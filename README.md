# LFGHO Hackathon Project 2024 - GhoTicket

## TLDR

Generate claimable tickets to send GHO to anyone without specifying their wallet address

## Description

Inspired by cash, which sidesteps the concept of a predefined recipient, GhoTicket is a protocol that lets you send GHO in the form of claimable tickets, without the need to specify a wallet address. The sender doesn't need any information about the recipient to program a payment, and can simply send them a link or have them scan a QR code. This can be useful when you want to send funds to someone who doesn't yet have a wallet, or doesn't know their own address, or as a reward for giveaways. After depositing the funds (1 tx), the sender simply needs to decide on the transfer mode (instant or stream) and the number of tickets to be signed, before they can be generated offchain and transmitted. Subsequently, by accessing the ticket link (obviously private), a recipient can securely claim the funds in 2 txs: 1) Reservation of the ticket (frontrunning prevention) 2) After validation and a short time, claim of the funds. The sender can track the status of their tickets on a specific page.

## Links

Decentralized Main Deployment: https://ghoticket.on-fleek.app

Centralized Backup Deployment: https://ghoticket.vercel.app
