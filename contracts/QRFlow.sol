// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {PaginatedEnumerableSet} from 'paginated-enumerableset/contracts/PaginatedEnumerableSet.sol';
import {Context} from '@openzeppelin/contracts/utils/Context.sol';
import {ERC20Permit} from '@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol';
import {EIP712} from '@openzeppelin/contracts/utils/cryptography/EIP712.sol';

contract QRFlow is Context, EIP712 {
  using PaginatedEnumerableSet for PaginatedEnumerableSet.Bytes32Set;

  uint256 public constant SAFETY_DELAY = 1 minutes;
  bytes32 public constant TICKET_PERMIT_TYPEHASH =
    keccak256(
      'TicketPermit(address creator,bytes32 orderId,bytes32 orderSecret)'
    );
  ERC20Permit public immutable GHO;

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
  struct OrderData {
    bytes32 id;
    Order order;
    uint256 nbTickets;
  }
  struct StatusData {
    bytes32[] ticketIds;
    address[] claimers;
  }
  struct OrderFullData {
    OrderData order;
    StatusData status;
  }
  struct TicketData {
    bytes32 id;
    address claimer;
    uint256 amount;
    OrderData order;
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
    uint256 unlock
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

  constructor(address gho) EIP712('QR Flow', '1') {
    GHO = ERC20Permit(gho);
  }

  function DOMAIN_SEPARATOR() external view returns (bytes32) {
    return _domainSeparatorV4();
  }

  function createOrder(
    uint256 amount,
    uint256 deadline,
    uint8 streamed,
    bytes32[] calldata tickets,
    Signature calldata signature,
    uint256 signatureDeadline
  ) public {
    address creator = _msgSender();
    uint256 nonce = _accounts[creator].nonce;
    bytes32 orderId = keccak256(abi.encodePacked(creator, nonce));
    if (
      amount == 0 ||
      deadline < block.timestamp ||
      streamed > 1 ||
      tickets.length == 0 ||
      _orders[orderId].createdAt > 0
    ) {
      revert InvalidOrder();
    }
    GHO.permit(
      creator,
      address(this),
      amount,
      signatureDeadline,
      signature.v,
      signature.r,
      signature.s
    );
    GHO.transferFrom(creator, address(this), amount);
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
      order.closed > 0 ||
      (order.createdAt + 3 * 60 < block.timestamp &&
        block.timestamp < order.deadline)
    ) {
      revert InvalidWithdraw(orderId);
    }
    bytes32[] memory ticketIds = _ticketOrders[orderId].values();
    uint256 nbUnclaimed;
    for (uint256 i = 0; i < ticketIds.length; i++) {
      nbUnclaimed += _claims[ticketIds[i]].orderId > 0 ? 0 : 1;
    }
    uint256 amount = (order.amount * nbUnclaimed) / ticketIds.length;
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
    uint256 unlock = block.timestamp + SAFETY_DELAY;
    _reservations[reservation] = unlock;
    emit TicketReserved(_msgSender(), reservation, unlock);
  }

  function claimTicket(Ticket memory ticket) public {
    address claimer = _msgSender();
    bytes32 reservation = keccak256(
      abi.encodePacked(claimer, ticket.orderSecret, ticket.ticketSecret)
    );
    uint256 reservationTime = _reservations[reservation];
    if (reservationTime == 0 || block.timestamp < reservationTime) {
      revert ReservationNotFound(reservation);
    }
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
    uint256 ticketAmount = order.amount / _ticketOrders[claim.orderId].length();
    uint256 alreadyWithdrawn = _accounts[claimer].withdrawnStreamBalances[
      ticketId
    ];
    uint256 amount;
    if (order.deadline < block.timestamp) {
      amount = ticketAmount - alreadyWithdrawn;
    } else {
      uint256 passed = block.timestamp - order.createdAt;
      uint256 duration = order.deadline - order.createdAt;
      amount = (ticketAmount * passed) / duration - alreadyWithdrawn;
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
    if (order.deadline < block.timestamp || order.closed > 0) {
      revert TicketExpired(ticket.orderId, ticketId, order.deadline);
    }
    address signer = ecrecover(
      _hashTypedDataV4(
        keccak256(
          abi.encode(
            TICKET_PERMIT_TYPEHASH,
            order.creator,
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

  function getAccountNonce(address addr) public view returns (uint256 nonce) {
    nonce = _accounts[addr].nonce;
  }

  function getOrder(
    bytes32 orderId
  ) public view returns (OrderData memory data) {
    data = OrderData(
      orderId,
      _orders[orderId],
      _ticketOrders[orderId].length()
    );
  }

  function getStatus(
    bytes32 orderId
  ) public view returns (StatusData memory data) {
    data.ticketIds = _ticketOrders[orderId].values();
    data.claimers = new address[](data.ticketIds.length);
    for (uint256 i = 0; i < data.ticketIds.length; i++) {
      address claimer = _claims[data.ticketIds[i]].claimer;
      if (claimer != address(0)) {
        data.claimers[i] = claimer;
      }
    }
  }

  function getFullOrder(
    bytes32 orderId
  ) public view returns (OrderFullData memory data) {
    data.order = getOrder(orderId);
    data.status = getStatus(orderId);
  }

  function getFullOrderBatch(
    bytes32[] memory orderIds
  ) public view returns (OrderFullData[] memory data) {
    for (uint256 i = 0; i < orderIds.length; i++) {
      data[i] = getFullOrder(orderIds[i]);
    }
  }

  function getTicket(
    bytes32 ticketId
  ) public view returns (TicketData memory data) {
    Claim memory claim = _claims[ticketId];
    data.id = ticketId;
    data.claimer = claim.claimer;
    data.order = getOrder(claim.orderId);
    data.amount = data.order.order.amount / data.order.nbTickets;
  }

  function getNbClaims(address claimer) public view returns (uint256 nbClaims) {
    nbClaims = _accountClaims[claimer].length();
  }

  function getClaims(
    address claimer,
    uint256 start,
    uint256 size
  ) external view returns (bytes32[] memory data) {
    data = _accountClaims[claimer].subset(start, size);
  }

  function getFullClaims(
    address claimer,
    uint256 start,
    uint256 size
  ) external view returns (TicketData[] memory data) {
    bytes32[] memory ticketIds = _accountClaims[claimer].subset(start, size);
    for (uint256 i = 0; i < ticketIds.length; i++) {
      data[i] = getTicket(ticketIds[i]);
    }
  }

  function getWithdrawnStreamBalances(
    bytes32[] memory ticketIds
  ) external view returns (uint256[] memory withdrawn) {
    for (uint256 i = 0; i < ticketIds.length; i++) {
      withdrawn[i] = _accounts[_claims[ticketIds[i]].claimer]
        .withdrawnStreamBalances[ticketIds[i]];
    }
  }

  function getReservation(
    bytes32 reservation
  ) external view returns (uint256 unlock) {
    unlock = _reservations[reservation];
  }

  function isClaimed(bytes32 ticketId) public view returns (bool) {
    return _claims[ticketId].orderId > 0;
  }

  function isValid(
    Ticket calldata ticket
  ) external view returns (bytes32 ticketId, uint256 amount, uint8 streamed) {
    return _permitTicket(ticket);
  }
}
