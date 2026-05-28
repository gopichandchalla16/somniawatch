# SomniaWatch

**The first autonomous smart contract security guardian on Somnia Agentic L1.**

Watch. Reason. Act. No humans required.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-somniawatch--eight.vercel.app-22ff88?style=flat-square)](https://somniawatch-eight.vercel.app)
[![Somnia Testnet](https://img.shields.io/badge/Somnia-Shannon%20Testnet-1a6cff?style=flat-square)](https://shannon-explorer.somnia.network)
[![Agentathon](https://img.shields.io/badge/Encode%20Club-Somnia%20Agentathon%202026-ff6600?style=flat-square)](https://encodeclub.com)

---

## What is SomniaWatch?

SomniaWatch is a production-grade, agent-native security platform built natively on Somnia's Agentic L1. It monitors any deployed smart contract in real time, detects reentrancy, access control violations, and value anomalies using on-chain AI inference, and triggers automated protective actions — entirely without human intervention.

Every security decision is:
- Made by Qwen3-30B running on Somnia's LLM Inference Agent
- Validated by 3 independent validator nodes reaching consensus
- Stored on-chain as an immutable AuditRecord with the agent requestId as proof
- Verifiable by anyone on the Somnia explorer

---

## Architecture

```
keeper.js (runs every 5 min)
        |
        v
 SomniaWatch.sol
        |
        v
[Step 1] Somnia JSON API Agent #13174292974160097713
         fetchString(explorerApiUrl, 'items')
         0.12 STT | 3 validators | consensus
        |
        v
 handleTxDataResponse() -- on-chain callback
        |
        v
[Step 2] Somnia LLM Inference Agent #12847293847561029384 (Qwen3-30B)
         inferString(prompt, system, false, ["safe","suspicious","critical"])
         allowedValues = exact enum output, no JSON parsing in Solidity
         0.24 STT | 3 validators | consensus
        |
        v
 handleClassificationResponse() -- on-chain callback
        |
        +---> AuditRecord stored (riskLevel, riskType, reasoning, receiptId)
        +---> Auto-flag if CRITICAL (ContractFlagged event)
        +---> keeper.js picks up RiskClassified event
        +---> Discord / Telegram alert if CRITICAL
        +---> Public Audit API updated
        +---> AuditCertificate NFT tier computed (Bronze / Silver / Gold)
```

**Cost per full cycle: 0.36 STT (0.12 JSON + 0.24 LLM)**

---

## Deployed Contracts (Somnia Shannon Testnet)

| Contract | Address |
|---|---|
| SomniaWatch | [0x21845ed6C3A3268AFAC41f42244436C7662fd03d](https://shannon-explorer.somnia.network/address/0x21845ed6C3A3268AFAC41f42244436C7662fd03d) |
| AuditCertificate | Deploy via `npm run deploy` |
| MockVault | [0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B](https://shannon-explorer.somnia.network/address/0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B) |

---

## Live Demo

[https://somniawatch-eight.vercel.app](https://somniawatch-eight.vercel.app)

---

## Features

| Feature | Description |
|---|---|
| Autonomous 2-agent pipeline | JSON API -> LLM Inference, fully on-chain, no off-chain oracle |
| Immutable AuditRecords | receiptId = agent requestId = verifiable on-chain proof of AI decision |
| On-chain SVG NFT Certificates | Bronze / Silver / Gold based on consecutive SAFE audits |
| One-click Attack Simulator | Frontend button triggers batchWithdraw on MockVault for live demo |
| Risk History Chart | Live recharts line graph of risk score over time per contract |
| Multi-contract Dashboard | Register any Somnia contract address for monitoring |
| Discord + Telegram Alerts | Keeper sends webhook alert on CRITICAL classification |
| Public Audit API | HTTP endpoint at localhost:3001 exposes full audit history as JSON |
| Security Leaderboard | Top 10 safest contracts ranked by consecutive SAFE audits |
| Auto-flag on CRITICAL | Zero human involvement in flagging decision |

---

## Judging Criteria Mapping

| Criterion | How SomniaWatch addresses it |
|---|---|
| Functionality | Fully deployed on testnet, frontend live, keeper running, all features working |
| Agent-First Design | Somnia agents ARE the core logic -- not a wrapper, not optional |
| Innovation | On-chain AI risk classification + NFT certificates + public audit API as composable primitive |
| Autonomous Performance | keeper.js + auto-flag + Discord/Telegram alerts -- zero human in the loop |

---

## Quickstart

```bash
git clone https://github.com/gopichandchalla16/somniawatch
cd somniawatch
npm install

# Copy env and add your private key
cp .env.example .env

# Deploy to Somnia testnet
npm run deploy

# Start keeper (autonomous monitoring + public API)
node scripts/keeper.js

# Start frontend
cd frontend && npm install && npm run dev
```

---

## Environment Variables

```
PRIVATE_KEY=your_wallet_private_key
SOMNIA_RPC=https://dream-rpc.somnia.network
SOMNIAWATCH_ADDRESS=0x21845ed6C3A3268AFAC41f42244436C7662fd03d
MOCK_VAULT_ADDRESS=0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B
DISCORD_WEBHOOK=https://discord.com/api/webhooks/your_webhook
TELEGRAM_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
API_PORT=3001
```

---

## Public Audit API

When keeper.js is running:

```
GET http://localhost:3001/health
GET http://localhost:3001/api/leaderboard
GET http://localhost:3001/api/audits/0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B
```

This makes SomniaWatch a composable security primitive -- other agents and dApps can consume audit data.

---

## Agent Receipt Verification

Every AuditRecord contains a `receiptId` which equals the Somnia platform `requestId`.
You can verify any AI decision on the Somnia explorer:

```
https://shannon-explorer.somnia.network/tx/{receiptId}
```

This is the core innovation: immutable, consensus-validated proof of every security decision.

---

## Built By

[Gopichand Challa](https://x.com/GopichandAI) | [GitHub](https://github.com/gopichandchalla16) | Somnia Agentathon 2026
