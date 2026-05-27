# 🔴 SomniaWatch

[![Demo Video](https://img.shields.io/badge/Demo-Watch%20Now-FF4444?style=for-the-badge)](VIDEO_LINK)
[![Live App](https://img.shields.io/badge/Live-App-7C6FFF?style=for-the-badge)](FRONTEND_LINK)
[![Somnia Testnet](https://img.shields.io/badge/Somnia-Testnet-00FF88?style=for-the-badge)](https://shannon-explorer.somnia.network)
[![Agentathon 2026](https://img.shields.io/badge/Agentathon-2026-FFD700?style=for-the-badge)](https://encode.club)

> **The first autonomous smart contract guardian on Somnia Agentic L1.**
> Watch. Reason. Act. No humans required.

---

## The Problem

DeFi protocols lost over **$2 billion** to smart contract exploits in 2024–2025. Reentrancy attacks. Flash loan manipulation. Access control failures.

The tragedy: most were **detectable in the transaction data** — if something was watching. Nothing was watching.

Existing monitoring tools are centralized, off-chain, or require humans to act. When an attack happens at 3AM, nobody responds in time.

## The Solution

SomniaWatch registers smart contracts and monitors them **autonomously** using Somnia's agent network. When anomalous patterns are detected, it **acts immediately** — flagging contracts and storing immutable audit receipts on-chain — with zero human involvement.

The entire reasoning chain is consensus-validated by 3 independent Somnia validators. Every decision is an immutable on-chain fact.

## How It Works

```
keeper.js (auto, every 5 min)
       │
       ▼
triggerMonitor(contractAddress)
       │
       ▼
┌─────────────────────────────────────────────┐
│  Somnia JSON API Agent                      │
│  ID: 13174292974160097713                   │
│  fetchString(explorerAPI, "items")          │
│  3 validators → consensus → callback        │
│  Cost: 0.12 SOMI                           │
└─────────────────────────────────────────────┘
       │
       ▼
handleTxDataResponse()  ← on-chain callback
       │
       ▼
┌─────────────────────────────────────────────┐
│  Somnia LLM Agent (Qwen3-30B)              │
│  ID: 12847293847561029384                   │
│  inferString(prompt, system, false,         │
│    ["safe","suspicious","critical"])         │
│  allowedValues → guaranteed clean output    │
│  3 validators → consensus → callback        │
│  Cost: 0.24 SOMI                           │
└─────────────────────────────────────────────┘
       │
       ▼
handleClassificationResponse()  ← on-chain
       │
       ├─► Store AuditRecord (receiptId = agent requestId)
       ├─► Auto-flag contract if CRITICAL
       └─► Mint/update AuditCertificate NFT if SAFE streak
```

## Why Agent-Native

| Feature | Without Somnia Agents |
|---|---|
| Fetch tx data on-chain | ❌ EVM contracts cannot make HTTP calls |
| AI classification on-chain | ❌ No LLM access in EVM |
| Consensus-validated decisions | ❌ Single point of trust |
| Immutable AI decision receipts | ❌ Off-chain AI has no on-chain proof |

## NFT Audit Certificates

SomniaWatch mints **on-chain NFT security certificates** to contracts that maintain consecutive SAFE audit streaks:

| Level | Required | Color |
|---|---|---|
| 🥉 Bronze | 3 consecutive SAFE audits | #CD7F32 |
| 🥈 Silver | 7 consecutive SAFE audits | #C0C0C0 |
| 🥇 Gold | 15 consecutive SAFE audits | #FFD700 |

Certificates are **automatically revoked** when a contract is flagged CRITICAL. Fully on-chain SVG metadata. No IPFS dependency.

## Agent Details

| Agent | ID | Cost | Method | Purpose |
|---|---|---|---|---|
| JSON API | 13174292974160097713 | 0.12 SOMI | fetchString() | Fetch tx history |
| LLM Inference | 12847293847561029384 | 0.24 SOMI | inferString() | Classify risk |

**Total per cycle: 0.36 SOMI**

## Deployed Contracts (Somnia Testnet)

| Contract | Address | Explorer |
|---|---|---|
| SomniaWatch.sol | `DEPLOY_ADDRESS` | [View](https://shannon-explorer.somnia.network/address/DEPLOY_ADDRESS) |
| AuditCertificate.sol | `NFT_ADDRESS` | [View](https://shannon-explorer.somnia.network/address/NFT_ADDRESS) |
| MockVault.sol | `VAULT_ADDRESS` | [View](https://shannon-explorer.somnia.network/address/VAULT_ADDRESS) |

## Live Demo

| | Link |
|---|---|
| Frontend | [somniawatch.vercel.app](FRONTEND_LINK) |
| Demo Video | [Watch here](VIDEO_LINK) |
| Explorer | [shannon-explorer.somnia.network](https://shannon-explorer.somnia.network) |

## Quick Start

```bash
git clone https://github.com/gopichandchalla16/somniawatch
cd somniawatch
npm install
cp .env.example .env      # fill PRIVATE_KEY
npm run deploy             # deploys + funds + registers + populates
cd frontend && npm install
cp .env.example .env       # fill contract addresses
npm run dev                # http://localhost:5173
cd .. && npm run keeper    # start autonomous monitoring
```

## Tech Stack

- **Somnia Testnet** (chain ID 50312)
- **Somnia JSON API Agent** (#13174292974160097713)
- **Somnia LLM Inference Agent** (#12847293847561029384, Qwen3-30B)
- **Solidity 0.8.20** + Hardhat
- **React 18** + ethers.js v6
- **Vite** + Vercel deployment
- On-chain SVG NFTs (no IPFS)

## Repository Structure

```
somniawatch/
├── contracts/
│   ├── interfaces/ISomniaAgents.sol   ← Verified Somnia types
│   ├── SomniaWatch.sol                ← Main guardian contract
│   ├── AuditCertificate.sol           ← NFT security certificates
│   └── MockVault.sol                  ← Demo target contract
├── scripts/
│   ├── deploy.js                      ← Full deployment automation
│   ├── keeper.js                      ← Autonomous monitoring daemon
│   └── triggerOnce.js                 ← Manual trigger utility
└── frontend/                          ← React dashboard
```

## Builder

**Gopichand Challa** | [@GopichandAI](https://x.com/GopichandAI) on X | Somnia Agentathon 2026
