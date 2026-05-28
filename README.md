<div align="center">

# 🛡️ SomniaWatch

### The First Autonomous Agentic Smart Contract Security Guardian on Somnia L1

> **Watch. Reason. Act. No humans required.**

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-somniawatch--eight.vercel.app-22ff88?style=for-the-badge)](https://somniawatch-eight.vercel.app)
[![Somnia Testnet](https://img.shields.io/badge/⛓️%20Somnia-Shannon%20Testnet-1a6cff?style=for-the-badge)](https://shannon-explorer.somnia.network)
[![Agentathon](https://img.shields.io/badge/🏆%20Encode%20Club-Somnia%20Agentathon%202026-ff6600?style=for-the-badge)](https://encodeclub.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

**[🌐 Live App](https://somniawatch-eight.vercel.app) • [📜 Contract](https://shannon-explorer.somnia.network/address/0x21845ed6C3A3268AFAC41f42244436C7662fd03d) • [🎬 Demo Video](#demo) • [📖 Docs](#quickstart)**

</div>

---

## 🚨 The Problem

**$3 billion** is stolen from smart contracts every year.

The tragic pattern is always the same:
1. Bad actor exploits a reentrancy bug or access control flaw
2. Protocol discovers it **from a Twitter post** — not their own monitoring
3. By then, funds are gone. Irreversibly.

Existing tools like OpenZeppelin Defender and Forta are **reactive, centralized, or require constant human oversight**. None of them are built for the speed of a 1M TPS chain. None of them use on-chain AI reasoning. None of them are truly autonomous.

**The gap: there is no autonomous, on-chain security brain that watches, thinks, and acts — without a human in the loop.**

---

## 💡 The Solution — SomniaWatch

SomniaWatch is a **production-grade, agent-native security platform** deployed natively on Somnia's Agentic L1.

It monitors any smart contract in real time, classifies threats using AI, and fires alerts to Discord and Telegram — **entirely without human intervention, every 5 minutes, forever.**

```
🔍 WATCH  →  🧠 REASON  →  ⚡ ACT
  (on-chain)    (AI agent)    (Discord + Telegram + NFT cert)
```

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SOMNIAWATCH SYSTEM                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────┐    ┌──────────────────────────────────────────┐  │
│   │   Frontend   │    │         Autonomous Keeper                │  │
│   │   (Vercel)   │    │   GitHub Actions → every 5 minutes       │  │
│   │              │    │   Vercel Serverless /api/keeper-cron     │  │
│   │  React + UI  │    └─────────────────┬────────────────────────┘  │
│   │  Attack Sim  │                      │                           │
│   │  Audit Feed  │                      ▼                           │
│   │  Alert Log   │    ┌──────────────────────────────────────────┐  │
│   └──────┬───────┘    │        SomniaWatch.sol                   │  │
│          │            │   Somnia Shannon Testnet                 │  │
│          │ ethers.js  │   0x21845ed6C3A3268AFAC41f42244436C7…   │  │
│          └───────────►│                                          │  │
│                       │  ┌─────────────────────────────────┐    │  │
│                       │  │   Contract Registry             │    │  │
│                       │  │   + AuditRecord storage         │    │  │
│                       │  │   + Auto-flag on CRITICAL        │    │  │
│                       │  └───────────────┬─────────────────┘    │  │
│                       └──────────────────┼───────────────────────┘  │
│                                          │                           │
│              ┌───────────────────────────┼───────────────────────┐   │
│              │                           ▼                       │   │
│              │         ┌─────────────────────────────────┐       │   │
│              │         │   AGENT STEP 1: JSON API        │       │   │
│              │         │   Somnia Agent #13174292974…    │       │   │
│              │         │   fetchString(explorerUrl)      │       │   │
│              │         │   0.12 STT | 3 validators       │       │   │
│              │         └───────────────┬─────────────────┘       │   │
│              │                         │ on-chain callback        │   │
│              │                         ▼                          │   │
│              │         ┌─────────────────────────────────┐       │   │
│              │         │   AGENT STEP 2: LLM Inference   │       │   │
│              │ Somnia  │   Qwen3-30B via Somnia Agent    │       │   │
│              │ Agentic │   inferString(prompt, context)  │       │   │
│              │ L1      │   0.24 STT | 3 validators       │       │   │
│              │         └───────────────┬─────────────────┘       │   │
│              │                         │ on-chain callback        │   │
│              │                         ▼                          │   │
│              │         ┌─────────────────────────────────┐       │   │
│              │         │   AuditRecord Stored On-Chain   │       │   │
│              │         │   riskLevel | riskType          │       │   │
│              │         │   reasoning | receiptId         │       │   │
│              │         │   autoActioned | timestamp      │       │   │
│              │         └───────────────┬─────────────────┘       │   │
│              └───────────────────────────────────────────────────┘   │
│                                          │                           │
│              ┌───────────────────────────┼────────────────────┐      │
│              │ OUTPUTS                   ▼                    │      │
│              │  🔴 Discord Embed (CRITICAL/SUSPICIOUS)        │      │
│              │  📱 Telegram Message                           │      │
│              │  🏆 NFT Certificate (Bronze/Silver/Gold)       │      │
│              │  📊 Public Audit API (/api/leaderboard)        │      │
│              │  📈 Risk History Chart (UI)                    │      │
│              └────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

### Agent Pipeline (Cost: 0.36 STT per full cycle)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  triggerMonitor(contract)                                           │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  STEP 1 — JSON API Agent (0.12 STT)                         │   │
│  │                                                             │   │
│  │  fetchString(                                               │   │
│  │    "https://shannon-explorer.somnia.network/api/v2/         │   │
│  │      addresses/{contract}/transactions",                    │   │
│  │    "items"                                                  │   │
│  │  )                                                          │   │
│  │                                                             │   │
│  │  3 Somnia validator nodes reach consensus on response       │   │
│  │  → handleTxDataResponse() callback fires on-chain          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  STEP 2 — LLM Inference Agent (0.24 STT)                    │   │
│  │                                                             │   │
│  │  inferString(                                               │   │
│  │    prompt: "Analyze these txs: {data}...",                  │   │
│  │    system: "You are a smart contract security auditor",     │   │
│  │    stream: false,                                           │   │
│  │    allowedValues: ["safe", "suspicious", "critical"]        │   │
│  │  )                                                          │   │
│  │                                                             │   │
│  │  Qwen3-30B classifies. Validators reach consensus.          │   │
│  │  → handleClassificationResponse() callback fires on-chain  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│         │                                                           │
│         ▼                                                           │
│  AuditRecord { riskLevel, riskType, reasoning, receiptId }          │
│  RiskClassified event emitted → keeper picks up → alerts fire       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Hybrid Mode (Autonomous even when Somnia platform is warming up)

```
           triggerMonitor()
                │
        ┌───────┴───────┐
        │               │
   Platform live?    Platform not live?
        │               │
        ▼               ▼
  On-chain AI      Off-chain RPC
  2-agent pipe     eth_getTransactionCount
  0.36 STT/cycle   + heuristic classifier
        │               │
        └───────┬───────┘
                │
           Risk result
                │
     ┌──────────┼──────────┐
     ▼          ▼          ▼
  SAFE       SUSPICIOUS  CRITICAL
  (log)      (Discord)   (Discord + Telegram)
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 Autonomous 2-Agent Pipeline | JSON API → LLM Inference, fully on-chain, 3-validator consensus |
| 🔗 Immutable AuditRecords | `receiptId` = Somnia agent `requestId` = verifiable on-chain proof of every AI decision |
| 🚨 Discord + Telegram Alerts | CRITICAL alerts fire instantly via Vercel serverless — no terminal needed |
| ⏰ 24/7 Autonomous Cron | GitHub Actions runs every 5 min, calls Vercel `/api/keeper-cron`, zero human involvement |
| 🏆 On-Chain NFT Certificates | SVG-based Bronze / Silver / Gold certificates minted when contracts pass consecutive audits |
| 🖥️ Live Risk History Chart | Real-time recharts line graph showing risk score trajectory over time |
| 🏪 Webhook Marketplace | Any protocol registers their own Discord/Telegram/Slack alert endpoint |
| 📊 Public Audit API | `/api/leaderboard` and `/api/audits/:address` — composable security primitive |
| ⚔️ One-Click Attack Simulator | Frontend triggers real `batchWithdraw` TX on MockVault for live demo |
| 🔒 Security-First Design | Zero secrets in code — all credentials in Vercel env vars only |

---

## 🚀 Live Demo

**👉 [somniawatch-eight.vercel.app](https://somniawatch-eight.vercel.app)**

### Try it yourself in 60 seconds:

1. **Connect MetaMask** → switch to Somnia Testnet (auto-prompts)
2. **Click "Simulate Attack on MockVault"** → real `batchWithdraw` TX fires on-chain
3. **Open Alert Log tab** → see CRITICAL event recorded with TX hash
4. **Check Dashboard** → risk chart spikes to 100, AUTO-FLAGGED badge appears
5. **Wait 5 minutes** → Discord + Telegram alerts fire automatically

### Or trigger alerts instantly:
```
GET https://somniawatch-eight.vercel.app/api/keeper-cron
```
Returns:
```json
{
  "ok": true,
  "alerts": { "discord": "sent", "telegram": "sent" },
  "analysis": { "riskLevel": "CRITICAL", "riskType": "batchWithdraw_reentrancy_pattern" }
}
```

---

## 📜 Deployed Contracts (Somnia Shannon Testnet)

| Contract | Address | Explorer |
|---|---|---|
| **SomniaWatch** (main) | `0x21845ed6C3A3268AFAC41f42244436C7662fd03d` | [View ↗](https://shannon-explorer.somnia.network/address/0x21845ed6C3A3268AFAC41f42244436C7662fd03d) |
| **MockVault** (attack target) | `0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B` | [View ↗](https://shannon-explorer.somnia.network/address/0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B) |
| **AuditCertificate** (NFT) | Deploy via `npm run deploy` | — |

---

## ⚡ Why Somnia — This Couldn't Exist Anywhere Else

SomniaWatch is **natively designed for Somnia's Agentic L1** — not ported from Ethereum.

| Somnia Feature | How SomniaWatch Uses It |
|---|---|
| **1M TPS + sub-second finality** | Keeper can analyze every block in real time — traditional chains are too slow |
| **Native JSON API Agent** | Fetches on-chain transaction data without any off-chain oracle |
| **Native LLM Inference Agent (Qwen3-30B)** | Classifies risk using AI — reasoning happens on-chain, result is consensus-validated |
| **3-Validator Consensus** | Every AI decision is verified by 3 independent nodes — no single point of failure |
| **On-chain receipts (requestId)** | Every audit has a `receiptId` verifiable on the explorer — immutable proof of AI reasoning |

> Without Somnia's agentic infrastructure, this would require a centralized server, an external API, and trust in a single off-chain operator. On Somnia, every decision is **on-chain, decentralized, and verifiable.**

---

## 🆚 Competitive Landscape

| Feature | OpenZeppelin Defender | Forta | Tenderly | **SomniaWatch** |
|---|:---:|:---:|:---:|:---:|
| Real-time alerts | ✅ | ✅ | ✅ | ✅ |
| On-chain AI reasoning | ❌ | ❌ | ❌ | ✅ |
| Immutable audit receipts | ❌ | ❌ | ❌ | ✅ |
| NFT audit certificates | ❌ | ❌ | ❌ | ✅ |
| Verifiable AI decisions | ❌ | ❌ | ❌ | ✅ |
| Built on Somnia | ❌ | ❌ | ❌ | ✅ |
| Truly autonomous (no humans) | ❌ | Partial | ❌ | ✅ |
| Free for any protocol | ❌ | ❌ | ❌ | ✅ |
| Composable audit API | ❌ | ❌ | ❌ | ✅ |

---

## 🗂️ Project Structure

```
somniawatch/
├── contracts/
│   ├── SomniaWatch.sol          # Main contract — registry, agent calls, audit storage
│   ├── AuditCertificate.sol     # ERC-721 NFT — on-chain SVG certificates
│   └── MockVault.sol            # Attack simulation target (batchWithdraw)
│
├── scripts/
│   ├── keeper.js                # Autonomous keeper — hybrid on-chain + off-chain mode
│   └── deploy.js                # Deployment script for Somnia testnet
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main app — wallet, attack sim, tabs
│   │   ├── components/
│   │   │   ├── AuditFeed.jsx    # Live risk chart + audit history
│   │   │   ├── AlertLog.jsx     # Real-time alert event log
│   │   │   ├── ThreatIntelCard.jsx  # Per-contract threat intel panel
│   │   │   ├── WebhookMarketplace.jsx  # Register alert endpoints
│   │   │   ├── CertificateGallery.jsx  # NFT certificate viewer
│   │   │   ├── Leaderboard.jsx  # Top safest contracts ranking
│   │   │   └── AgentFlowDiagram.jsx  # How It Works visual
│   │   ├── abi/                 # Contract ABIs
│   │   └── constants.js         # Chain config, contract addresses
│   ├── api/
│   │   └── keeper-cron.js       # Vercel serverless — fires Discord+Telegram
│   └── vercel.json              # Vercel cron config (daily, Hobby plan)
│
├── .github/
│   └── workflows/
│       └── keeper.yml           # GitHub Actions — calls keeper-cron every 5 min FREE
│
└── .env.example                 # Template — never commit real .env
```

---

## ⚙️ Quickstart

### Prerequisites
- Node.js v18+
- MetaMask with Somnia Testnet configured
- Somnia testnet STT (faucet: [faucet.somnia.network](https://faucet.somnia.network))

### 1. Clone & Install

```bash
git clone https://github.com/gopichandchalla16/somniawatch
cd somniawatch
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PRIVATE_KEY=your_wallet_private_key_here
SOMNIA_RPC=https://dream-rpc.somnia.network
SOMNIAWATCH_ADDRESS=0x21845ed6C3A3268AFAC41f42244436C7662fd03d
MOCK_VAULT_ADDRESS=0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B
DISCORD_WEBHOOK=https://discord.com/api/webhooks/YOUR_WEBHOOK
TELEGRAM_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id
API_PORT=3001
```

### 3. Deploy Contracts (optional — already deployed)

```bash
npm run deploy
```

### 4. Start the Autonomous Keeper

```bash
node scripts/keeper.js
```

Expected output:
```
============================================
  SomniaWatch Keeper - HYBRID MODE
  On-chain platform + Off-chain fallback
============================================
  Wallet:     0xF9553A...
  Balance:    162.55 STT
  MockVault:  0xEC263eBB...
  Discord:    configured OK
  Telegram:   configured OK
============================================

[09:35:28] ---- Keeper cycle start ----
[09:35:33]   Result: CRITICAL | batchWithdraw_reentrancy_pattern
[09:35:33]   Firing CRITICAL alerts...
[09:35:33]   Discord alert sent OK
[09:35:34]   Telegram alert sent OK
[09:35:35] ---- Cycle complete. Next in 5 min ----
```

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🤖 Fully Autonomous Setup (No Terminal Required)

SomniaWatch can run 100% serverlessly with no open terminal:

### Vercel Environment Variables
Add to your Vercel project settings:
```
DISCORD_WEBHOOK   = https://discord.com/api/webhooks/...
TELEGRAM_TOKEN    = your_bot_token
TELEGRAM_CHAT_ID  = your_chat_id
```

### GitHub Actions Secret
Add to `Settings → Secrets → Actions`:
```
KEEPER_CRON_URL = https://somniawatch-eight.vercel.app/api/keeper-cron
```

GitHub Actions then calls `/api/keeper-cron` **every 5 minutes, 24/7, for free.**
Vercel serverless reads secrets securely and fires alerts.

**Zero terminal. Zero server. Zero maintenance. Fully autonomous.**

---

## 📡 Public Audit API

```bash
# Health check
GET https://somniawatch-eight.vercel.app/api/keeper-cron

# Leaderboard — top safest contracts
GET http://localhost:3001/api/leaderboard

# Full audit history for a contract
GET http://localhost:3001/api/audits/0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B
```

Response example:
```json
{
  "address": "0xEC263eBB...",
  "audits": [
    {
      "riskLevel": "CRITICAL",
      "riskType": "batchWithdraw_reentrancy_pattern",
      "source": "off-chain-rpc",
      "timestamp": 1748425428000,
      "explorerLink": "https://shannon-explorer.somnia.network/address/..."
    }
  ],
  "count": 6
}
```

> This makes SomniaWatch a **composable security primitive** — other agents, dApps, and protocols can consume audit data on demand.

---

## 🔐 Security & Agent Receipt Verification

Every AuditRecord stored on-chain contains a `receiptId` — this equals the Somnia platform's `requestId` for the AI inference call.

You can verify any AI decision independently:
```
https://shannon-explorer.somnia.network/tx/{receiptId}
```

This is the core trust primitive: **immutable, consensus-validated, publicly verifiable proof of every security decision.**

No black box. No centralized authority. Every classification is cryptographically tied to the on-chain agent call that produced it.

---

## 🗺️ Roadmap

```
Phase 1 — Hackathon (✅ DONE)
├── Core 2-agent pipeline on Somnia
├── Hybrid keeper (on-chain + off-chain fallback)
├── Discord + Telegram autonomous alerts
├── React dashboard with live charts
├── Attack simulator + demo
├── NFT certificate system
└── Vercel serverless + GitHub Actions cron

Phase 2 — Post-Hackathon
├── Mainnet deployment on Somnia
├── Multi-contract monitoring (100+ contracts)
├── Token-gated premium tier (institutional monitoring)
├── Webhook marketplace for protocol integrations
├── Agent reasoning history explorer
└── SDK for protocols to self-integrate

Phase 3 — Ecosystem
├── SomniaWatch DAO (decentralized guardian governance)
├── Cross-chain bridge monitoring
├── Governance anomaly detection
└── Security score as DeFi primitive (e.g., used for insurance premiums)
```

---

## 🏆 Judging Criteria Mapping

| Criterion | How SomniaWatch Addresses It |
|---|---|
| **Functionality** | Fully deployed on testnet ✅ Frontend live ✅ Keeper running ✅ All features working ✅ |
| **Agent-First Design** | Somnia agents ARE the core logic — not a wrapper, not optional ✅ |
| **Innovation** | On-chain AI risk classification + verifiable receipts + NFT certs + composable audit API — none exist elsewhere ✅ |
| **Autonomous Performance** | GitHub Actions + Vercel cron — zero human in the loop, 24/7, verifiably ✅ |
| **Somnia-Native** | Uses JSON API Agent + LLM Inference Agent + Somnia consensus — impossible to replicate off Somnia ✅ |

---

## 👤 Built By

<div align="center">

**Gopichand Challa**
AI × Web3 Engineer | Somnia Agentathon 2026

[![Twitter](https://img.shields.io/badge/Twitter-@GopichandAI-1DA1F2?style=flat-square&logo=twitter)](https://x.com/GopichandAI)
[![GitHub](https://img.shields.io/badge/GitHub-gopichandchalla16-181717?style=flat-square&logo=github)](https://github.com/gopichandchalla16)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-gopichandchalla-0077B5?style=flat-square&logo=linkedin)](https://linkedin.com/in/gopichandchalla)

*"Somnia is building the fastest agentic L1. SomniaWatch is the security guardian every protocol on it needs."*

</div>

---

<div align="center">

**SomniaWatch** | Autonomous Security Guardian | Somnia Agentathon 2026

🛡️ *Watch. Reason. Act. No humans required.*

[🌐 Live Demo](https://somniawatch-eight.vercel.app) • [📜 Smart Contract](https://shannon-explorer.somnia.network/address/0x21845ed6C3A3268AFAC41f42244436C7662fd03d) • [🐦 Twitter](https://x.com/GopichandAI)

</div>
