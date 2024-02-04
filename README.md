# QR Flow (ex-GhoTicket)

LFGHO Hackathon Project 2024

## Deployments

- Centralized Main: https://qrflow.xyz
- Decentralized Main: https://qrflow.on-fleek.app
- Decentralized Legacy: https://ghoticket.on-fleek.app

## Main Idea

Create claimable tickets to send ERC20 tokens without specifying any wallet address. Simple as using cash!

## Description

Inspired by cash, which sidesteps the concept of a predefined recipient, QR Flow is a protocol that lets you send crypto in the form of claimable tickets, without the need to specify target wallet addresses.

The sender needs no information about the recipient(s) to prepare tickets, and can simply share them as a private link or by generating a QR code. This can be useful for sending funds to someone who doesn't have a wallet yet, or doesn't know their own address, or as a reward for giveaways. To create tickets, the sender must choose the transfer mode (instant or stream) and the number of tickets, which are generated and signed off-chain. After depositing the funds (1 tx), tickets can be transmitted.

Subsequently, by accessing a ticket link, a recipient can securely claim the funds in 2 txs: 1) Reservation of the ticket (frontrunning prevention) 2) After validation and a safety delay (1min), the ticket and associated funds can be claimed.

Given a wallet address, you can track the status of its created tickets and also see its claim history, on an unified page. Unclaimed funds can be withdrawn after the chosen deadline (when the tickets expired).

## Missing Features at Submission

Everything is done except the frontend (70%). Now I plan to finish the project 100% and to add:

- Support for any ERC20 token over 7 EVM chains + 4 testnets
- Gasless claims via sponsoring at deposit using Gelato Relay
- Maybe CCIP for crosschain transfers using a trick
- Fee system and tokenomics
