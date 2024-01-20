// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {PaginatedEnumerableSet} from 'paginated-enumerableset/contracts/PaginatedEnumerableSet.sol';
import {Context} from '@openzeppelin/contracts/utils/Context.sol';
import {ERC20Permit} from '@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol';
import {EIP712} from '@openzeppelin/contracts/utils/cryptography/EIP712.sol';

contract ATM is Context, EIP712 {
  using PaginatedEnumerableSet for PaginatedEnumerableSet.Bytes32Set;

  uint256 public constant SAFETY_DELAY = 1 minutes;
  bytes32 public constant PERMIT_TICKET_TYPEHASH =
    keccak256('PermitTicket(Ticket memory ticket)');
  ERC20Permit public constant GHO =
    ERC20Permit(0xc4bF5CbDaBE595361438F8c6a187bDc330539c60);

  struct Account {
    uint256 nonce;
    mapping(bytes32 => uint256) withdrawnStreamBalances;
  }
  struct Order {
    address creator;
    uint256 amount;
    uint256 createdAt;
    uint256 deadline;
    uint8 streamed;
    uint8 closed;
  }
  struct Signature {
    uint8 v;
    bytes32 r;
    bytes32 s;
  }
  struct Ticket {
    bytes32 orderId;
    bytes32 orderSecret;
    bytes32 ticketSecret;
    Signature signature;
  }
  struct Claim {
    bytes32 orderId;
    address claimer;
  }

  mapping(address => Account) private _accounts;
  mapping(address => PaginatedEnumerableSet.Bytes32Set) private _accountClaims;
  mapping(bytes32 => Order) private _orders;
  mapping(bytes32 => PaginatedEnumerableSet.Bytes32Set) private _ticketOrders;
  mapping(bytes32 => uint256) private _reservations;
  mapping(bytes32 => Claim) private _claims;

  event OrderCreated(
    bytes32 indexed orderId,
    address indexed creator,
    uint256 amount,
    uint256 nbTickets
  );
  event OrderClosed(
    bytes32 indexed orderId,
    address indexed creator,
    uint256 amount
  );
  event TicketReserved(
    address indexed claimer,
    bytes32 reservation,
    uint256 timestamp
  );
  event TicketClaimed(
    bytes32 indexed orderId,
    bytes32 indexed ticketId,
    address indexed claimer,
    uint256 amount
  );
  event StreamWithdrawn(
    bytes32 indexed ticketId,
    address indexed claimer,
    uint256 amount
  );

  error InvalidOrder();
  error InvalidWithdraw(bytes32 id);
  error ReservationNotChanged(bytes32 reservation);
  error ReservationNotFound(bytes32 reservation);
  error TicketNotFound(bytes32 orderId, bytes32 ticketId);
  error TicketAlreadyClaimed(bytes32 orderId, bytes32 ticketId);
  error TicketExpired(bytes32 orderId, bytes32 ticketId, uint256 deadline);
  error InvalidSigner(address creator, address signer);

  constructor() EIP712('ATM', 'alpha') {}

  function DOMAIN_SEPARATOR() external view returns (bytes32) {
    return _domainSeparatorV4();
  }

  function PERMIT_TYPEHASH() external pure returns (bytes32) {
    return PERMIT_TICKET_TYPEHASH;
  }

  function createOrder(
    uint256 amount,
    uint256 deadline,
    uint8 streamed,
    bytes32[] calldata tickets,
    Signature calldata signature
  ) public {
    if (
      amount == 0 ||
      deadline <= block.timestamp ||
      streamed > 1 ||
      tickets.length == 0
    ) {
      revert InvalidOrder();
    }
    address creator = _msgSender();
    GHO.permit(
      creator,
      address(this),
      amount,
      deadline,
      signature.v,
      signature.r,
      signature.s
    );
    GHO.transferFrom(creator, address(this), amount);
    uint256 nonce = _accounts[creator].nonce;
    bytes32 orderId = keccak256(abi.encodePacked(creator, nonce));
    _accounts[creator].nonce = nonce + 1;
    _orders[orderId] = Order(
      creator,
      amount,
      block.timestamp,
      deadline,
      streamed,
      0
    );
    PaginatedEnumerableSet.Bytes32Set storage ticketIds = _ticketOrders[
      orderId
    ];
    for (uint256 i = 0; i < tickets.length; i++) {
      ticketIds.add(tickets[i]);
    }
    emit OrderCreated(orderId, creator, amount, tickets.length);
  }

  function closeOrder(bytes32 orderId) public {
    address creator = _msgSender();
    Order memory order = _orders[orderId];
    if (
      order.creator != creator ||
      order.deadline > block.timestamp ||
      order.closed > 0
    ) {
      revert InvalidWithdraw(orderId);
    }
    PaginatedEnumerableSet.Bytes32Set storage ticketIds = _ticketOrders[
      orderId
    ];
    uint256 nbUnclaimed;
    for (uint256 i = 0; i < ticketIds.length(); i++) {
      nbUnclaimed += _claims[ticketIds.at(i)].orderId > 0 ? 0 : 1;
    }
    uint256 amount = order.amount / nbUnclaimed;
    if (amount > 0) {
      _orders[orderId].closed = 1;
      GHO.transfer(creator, amount);
      emit OrderClosed(orderId, creator, amount);
    } else {
      revert InvalidWithdraw(orderId);
    }
  }

  function reserveTicket(bytes32 reservation) public {
    if (_reservations[reservation] > 0) {
      revert ReservationNotChanged(reservation);
    }
    _reservations[reservation] = block.timestamp;
    emit TicketReserved(_msgSender(), reservation, block.timestamp);
  }

  function claimTicket(Ticket memory ticket) public {
    address claimer = _msgSender();
    (bytes32 ticketId, uint256 amount, uint8 streamed) = _permitTicket(ticket);
    _claims[ticketId] = Claim(ticket.orderId, claimer);
    _accountClaims[claimer].add(ticketId);
    if (streamed == 0) {
      GHO.transfer(claimer, amount);
    }
    emit TicketClaimed(ticket.orderId, ticketId, claimer, amount);
  }

  function withdrawStream(bytes32 ticketId) public {
    address claimer = _msgSender();
    Claim memory claim = _claims[ticketId];
    if (claim.claimer != claimer) {
      revert InvalidWithdraw(ticketId);
    }
    Order memory order = _orders[claim.orderId];
    if (order.streamed == 0) {
      revert InvalidWithdraw(ticketId);
    }
    uint256 share = order.amount / _ticketOrders[claim.orderId].length();
    uint256 alreadyWithdrawn = _accounts[claimer].withdrawnStreamBalances[
      ticketId
    ];
    uint256 amount;
    if (order.deadline < block.timestamp) {
      amount = share - alreadyWithdrawn;
    } else {
      uint256 passed = block.timestamp - order.createdAt;
      uint256 duration = order.deadline - order.createdAt;
      amount = (share * passed) / duration - alreadyWithdrawn;
    }
    if (amount > 0) {
      _accounts[claimer].withdrawnStreamBalances[ticketId] += amount;
      GHO.transfer(claimer, amount);
      emit StreamWithdrawn(ticketId, claimer, amount);
    } else {
      revert InvalidWithdraw(ticketId);
    }
  }

  function _permitTicket(
    Ticket memory ticket
  ) private view returns (bytes32 ticketId, uint256 amount, uint8 streamed) {
    bytes32 reservation = keccak256(
      abi.encodePacked(_msgSender(), ticket.orderSecret, ticket.ticketSecret)
    );
    uint256 reservationTime = _reservations[reservation];
    if (
      reservationTime == 0 || block.timestamp < reservationTime + SAFETY_DELAY
    ) {
      revert ReservationNotFound(reservation);
    }
    ticketId = keccak256(
      abi.encodePacked(ticket.orderSecret, ticket.ticketSecret)
    );
    PaginatedEnumerableSet.Bytes32Set storage tickets = _ticketOrders[
      ticket.orderId
    ];
    if (!tickets.contains(ticketId)) {
      revert TicketNotFound(ticket.orderId, ticketId);
    }
    if (_claims[ticketId].orderId > 0) {
      revert TicketAlreadyClaimed(ticket.orderId, ticketId);
    }
    Order memory order = _orders[ticket.orderId];
    if (order.deadline < block.timestamp) {
      revert TicketExpired(ticket.orderId, ticketId, order.deadline);
    }
    address signer = ecrecover(
      _hashTypedDataV4(
        keccak256(
          abi.encode(
            PERMIT_TICKET_TYPEHASH,
            block.chainid,
            order.creator,
            order.amount,
            ticket.orderId,
            ticket.orderSecret
          )
        )
      ),
      ticket.signature.v,
      ticket.signature.r,
      ticket.signature.s
    );
    if (signer != order.creator) {
      revert InvalidSigner(order.creator, signer);
    }
    amount = order.amount / tickets.length();
    streamed = order.streamed;
  }

  function isClaimed(bytes32 ticketId) external view returns (bool) {
    return _claims[ticketId].orderId > 0;
  }

  function isValid(
    Ticket calldata ticket
  ) external view returns (bytes32 ticketId, uint256 amount, uint8 streamed) {
    return _permitTicket(ticket);
  }
}
