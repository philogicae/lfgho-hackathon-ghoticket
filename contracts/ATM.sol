// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {PaginatedEnumerableSet} from 'paginated-enumerableset/contracts/PaginatedEnumerableSet.sol';
import {Context} from '@openzeppelin/contracts/utils/Context.sol';
import {EIP712} from '@openzeppelin/contracts/utils/cryptography/EIP712.sol';

contract ATM is Context, EIP712 {
  using PaginatedEnumerableSet for PaginatedEnumerableSet.Bytes32Set;

  uint256 public constant SAFETY_DELAY = 1 minutes;
  bytes32 public constant PERMIT_TICKET_TYPEHASH =
    keccak256('PermitTicket(Ticket memory ticket)');

  struct Account {
    uint256 nbDeposits;
    PaginatedEnumerableSet.Bytes32Set claimed;
    mapping(bytes32 => uint256) withdrawnFromStreams;
  }
  struct Deposit {
    address sender;
    uint256 amount;
    uint256 signedAt;
    uint256 deadline;
    bool stream;
    bool closed;
    PaginatedEnumerableSet.Bytes32Set tickets;
  }
  struct Signature {
    uint8 v;
    bytes32 r;
    bytes32 s;
  }
  struct Ticket {
    bytes32 depositId;
    address minter;
    uint256 amount;
    bytes32 depositSecret;
    bytes32 ticketSecret;
    Signature signature;
  }
  struct Claimed {
    bytes32 depositId;
    address claimer;
  }

  IERC20 private constant GHO =
    IERC20(0xc4bF5CbDaBE595361438F8c6a187bDc330539c60);
  mapping(address => Account) private _accounts;
  mapping(bytes32 => Deposit) private _deposits;
  mapping(bytes32 => Claimed) private _claimed;

  event Tickets(
    bytes32 indexed depositId,
    bytes32 indexed minter,
    uint256 amount,
    uint256 nbTickets
  );
  event TicketReserved(address claimer, bytes32 reservation, uint256 timestamp);
  event TicketClaimed(
    bytes32 indexed depositId,
    bytes32 indexed ticketId,
    address indexed claimer,
    uint256 amount
  );
  event WithdrawFromDeposit(bytes32 indexed depositId, uint256 amount);
  event WithdrawFromStream(bytes32 indexed ticketId, uint256 amount);

  error TicketExpired(bytes32 depositId, bytes32 ticketId, uint256 deadline);
  error InvalidSigner(address minter, address signer);
  error AlreadyClaimed(bytes32 depositId, bytes32 ticketId);
  error ReservationNotFound(bytes32 reservation);
  error TooEarlyToClaim(bytes32 depositId, bytes32 ticketId);

  constructor() EIP712('ATM', 'alpha') {}

  function DOMAIN_SEPARATOR() external view returns (bytes32) {
    return _domainSeparatorV4();
  }

  function permitTicket(
    Ticket memory ticket
  ) internal returns (address ownerAddr, address claimerAddr) {
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
            ticket.depositId,
            ticket.minter,
            ticket.amount,
            ticket.depositSecret
          )
        )
      ),
      ticket.signature.v,
      ticket.signature.r,
      ticket.signature.s
    );
    if (signer != ticket.minter) {
      revert InvalidSigner(ticket.minter, signer);
    }
    bytes32 ticketId = hex'0000000000000000000000000000000000000000000000000000000000000000';

    _approveTicket(
      ticket.depositId,
      ticketId,
      ticket.minter,
      sender,
      ticket.amount
    );
  }

  function _approveTicket(
    bytes32 depositId,
    bytes32 ticketId,
    address minter,
    address claimer,
    uint256 amount
  ) internal {
    if (_claimed[ticketId].depositId != 0) {
      revert AlreadyClaimed(depositId, ticketId);
    }
    _claimed[ticketId] = Claimed(depositId, claimer);
    emit TicketClaimed(depositId, ticketId, claimer, amount);
  }

  function isClaimedTicket(bytes32 ticketId) public view returns (bool) {
    return _claimed[ticketId].depositId != 0;
  }
}
