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
  event StreamWithdraw(
    bytes32 indexed ticketId,
    address indexed claimer,
    uint256 amount
  );

  error InvalidSigner(address creator, address signer);
  error ReservationNotChanged(bytes32 reservation);
  error ReservationNotFound(bytes32 reservation);
  error TicketExpired(bytes32 orderId, bytes32 ticketId, uint256 deadline);
  error TicketAlreadyClaimed(bytes32 orderId, bytes32 ticketId);
  error TicketNotClaimable(bytes32 orderId, bytes32 ticketId);

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

  function closeOrder() public returns (uint256) {
    // TODO
  }

  function reserveTicket(bytes32 reservation) public {
    if (_reservations[reservation] > 0) {
      revert ReservationNotChanged(reservation);
    }
    uint256 timestamp = block.timestamp;
    _reservations[reservation] = timestamp;
    emit TicketReserved(_msgSender(), reservation, timestamp);
  }

  function claimTicket(Ticket memory ticket) public {
    address claimer = _msgSender();
    (bytes32 ticketId, uint256 amount, uint8 streamed) = _permitTicket(ticket);
    if (streamed == 0) {
      GHO.transfer(claimer, amount);
    }
    _claims[ticketId] = Claim(ticket.orderId, claimer);
    emit TicketClaimed(ticket.orderId, ticketId, claimer, amount);
  }

  function withdrawFromStream() public {
    // TODO
  }

  function _permitTicket(
    Ticket memory ticket
  ) private returns (bytes32 ticketId, uint256 amount, uint8 streamed) {
    address sender = _msgSender();

    /* if (block.timestamp > ticket.deadline) {
      revert TicketExpired(ticket.deadline);
    } */

    address signer = ecrecover(
      _hashTypedDataV4(
        keccak256(
          abi.encode(
            PERMIT_TICKET_TYPEHASH,
            block.chainid,
            ticket.orderId,
            ticket.creator,
            ticket.amount,
            ticket.orderSecret
          )
        )
      ),
      ticket.signature.v,
      ticket.signature.r,
      ticket.signature.s
    );
    if (signer != ticket.creator) {
      revert InvalidSigner(ticket.creator, signer);
    }
    bytes32 ticketId = hex'0000000000000000000000000000000000000000000000000000000000000000';

    _approveTicket(
      ticket.orderId,
      ticketId,
      ticket.creator,
      sender,
      ticket.amount
    );
  }

  function _approveTicket(
    bytes32 orderId,
    bytes32 ticketId,
    address creator,
    address claimer,
    uint256 amount
  ) private {
    if (_claims[ticketId].orderId > 0) {
      revert TicketAlreadyClaimed(orderId, ticketId);
    }
    _claims[ticketId] = Claim(orderId, claimer);
    emit TicketClaimed(orderId, ticketId, claimer, amount);
  }

  function isClaimedTicket(bytes32 ticketId) public view returns (bool) {
    return _claims[ticketId].orderId > 0;
  }
}
