<div align="center">

# 🛡️ SomniaWatch

### The First Autonomous Agentic Smart Contract Security Guardian on Somnia L1

> **Watch. Reason. Act. No humans required.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-somniawatch--eight.vercel.app-22ff88?style=for-the-badge&logo=vercel)](https://somniawatch-eight.vercel.app)
[![Somnia Testnet](https://img.shields.io/badge/Somnia-Shannon%20Testnet-1a6cff?style=for-the-badge)](https://shannon-explorer.somnia.network)
[![Agentathon](https://img.shields.io/badge/Encode%20Club-Somnia%20Agentathon%202026-ff6600?style=for-the-badge)](https://encodeclub.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

**[🌐 Live App](https://somniawatch-eight.vercel.app) • [📜 Contract on Explorer](https://shannon-explorer.somnia.network/address/0x21845ed6C3A3268AFAC41f42244436C7662fd03d) • [📖 Quickstart](#quickstart)**

</div>

---

## 🚨 The Problem

**$3 billion** is stolen from smart contracts every year.

The tragic pattern is always the same:
1. A bad actor exploits a reentrancy bug or access control flaw
2. The protocol discovers it **from a Twitter post** — not their own monitoring
3. By then, funds are gone. Irreversibly.

Existing tools like OpenZeppelin Defender and Forta are **reactive, centralized, or require constant human oversight**. None are built for the speed of a 1M TPS chain. None use on-chain AI reasoning. None are truly autonomous.

**The gap: there is no autonomous, on-chain security brain that watches, thinks, and acts — without a human in the loop.**

---

## 💡 The Solution — SomniaWatch

SomniaWatch is a **production-grade, agent-native security platform** deployed natively on Somnia's Agentic L1.

It monitors any smart contract in real time, classifies threats using on-chain AI, and fires alerts to Discord and Telegram — **entirely without human intervention, every 5 minutes, forever.**

```
🔍 WATCH  →  🧠 REASON  →  ⚡ ACT
 (on-chain)   (AI agent)   (Discord + Telegram + NFT cert)
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
│                       │  ┌──────────────────────────────────┐   │  │
│                       │  │   Contract Registry              │   │  │
│                       │  │   + AuditRecord storage          │   │  │
│                       │  │   + Auto-flag on CRITICAL        │   │  │
│                       │  └──────────────┬───────────────────┘   │  │
│                       └─────────────────┼────────────────────────┘  │
│                                         │                           │
│                                         ▼                           │
│              ┌──────────────────────────────────────────────────┐   │
│              │         AGENT STEP 1 — JSON API                  │   │
│              │         Somnia Agent #13174292974…               │   │
│              │         fetchString(explorerUrl, "items")        │   │
│              │         0.12 STT · 3 validators · consensus      │   │
│              │         → handleTxDataResponse() on-chain        │   │
│              └──────────────────────┬───────────────────────────┘   │
│                                     │                               │
│                                     ▼                               │
│              ┌──────────────────────────────────────────────────┐   │
│              │         AGENT STEP 2 — LLM Inference             │   │
│              │         Qwen3-30B via Somnia Agent               │   │
│              │         inferString(prompt, system, false,       │   │
│              │           ["safe","suspicious","critical"])       │   │
│              │         0.24 STT · 3 validators · consensus      │   │
│              │         → handleClassificationResponse() on-chain│   │
│              └──────────────────────┬───────────────────────────┘   │
│                                     │                               │
│                                     ▼                               │
│              ┌──────────────────────────────────────────────────┐   │
│              │  AuditRecord stored on-chain                     │   │
│              │  { riskLevel, riskType, reasoning, receiptId }   │   │
│              │  RiskClassified event emitted                    │   │
│              └──────────────────────┬───────────────────────────┘   │
│                                     │                               │
│            ┌────────────────────────┼────────────────────────┐      │
│            ▼                        ▼                        ▼      │
│     🔴 Discord Alert        📱 Telegram Alert       🏆 NFT Cert     │
│     (CRITICAL embed)        (instant message)       (Bronze/Silver) │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

Total cost per full audit cycle: 0.36 STT (0.12 JSON + 0.24 LLM)
```

### Hybrid Mode — Always Autonomous

```
           triggerMonitor(contract)
                    │
        ┌───────────┴───────────┐
        │                       │
   Platform live?         Platform warming up?
        │                       │
        ▼                       ▼
  On-chain AI             Off-chain RPC
  2-agent pipeline        eth_getTransactionCount
  Qwen3-30B               + heuristic classifier
  0.36 STT/cycle          (free fallback)
        │                       │
        └───────────┬───────────┘
                    │
              Risk result
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
     SAFE       SUSPICIOUS    CRITICAL
     (log)      (Discord)     (Discord + Telegram)
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **Autonomous 2-Agent Pipeline** | JSON API → LLM Inference, fully on-chain, 3-validator consensus |
| 🔗 **Immutable AuditRecords** | `receiptId` = Somnia agent `requestId` = verifiable on-chain proof of every AI decision |
| 🚨 **Discord + Telegram Alerts** | CRITICAL alerts fire instantly via Vercel serverless — no terminal needed |
| ⏰ **24/7 Autonomous Cron** | GitHub Actions calls `/api/keeper-cron` every 5 min — zero human involvement |
| 🏆 **On-Chain NFT Certificates** | SVG-based Bronze / Silver / Gold certificates for contracts that pass consecutive audits |
| 📈 **Live Risk History Chart** | Real-time line graph showing risk score trajectory over time per contract |
| 🏪 **Webhook Marketplace** | Any protocol registers their own Discord / Telegram / Slack alert endpoint |
| 📊 **Public Audit API** | `/api/leaderboard` and `/api/audits/:address` — composable security primitive |
| ⚔️ **One-Click Attack Simulator** | Frontend triggers real `batchWithdraw` TX on MockVault for live demo |
| 🔒 **Security-First Design** | Zero secrets in code — all credentials stored in Vercel env vars only |

---

## 🚀 Live Demo

**👉 [somniawatch-eight.vercel.app](https://somniawatch-eight.vercel.app)**

### Try it in 60 seconds:

1. **Connect MetaMask** → switch to Somnia Testnet (auto-prompts)
2. **Click "Simulate Attack on MockVault"** → real `batchWithdraw` TX fires on-chain
3. **Open Alert Log tab** → CRITICAL event recorded with TX hash
4. **Check Dashboard** → risk chart spikes to 100, `AUTO-FLAGGED` badge appears
5. **Check Discord / Telegram** → alert fires automatically within 5 minutes

### Trigger an alert instantly (no wallet needed):

```
GET https://somniawatch-eight.vercel.app/api/keeper-cron
```

Response:
```json
{
  "ok": true,
  "timestamp": "2026-05-28T09:59:29.031Z",
  "analysis": {
    "contract": "0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B",
    "riskLevel": "CRITICAL",
    "riskType": "batchWithdraw_reentrancy_pattern",
    "txNonce": 1
  },
  "alerts": {
    "discord": "sent",
    "telegram": "sent"
  },
  "env": {
    "discord_configured": true,
    "telegram_configured": true
  }
}
```

---

## 🔔 Live Alert Example

This is a real alert fired autonomously by SomniaWatch — no human triggered it:

```
╔══════════════════════════════════════════════════════════════╗
║           SOMNIAWATCH — CRITICAL ALERT                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Contract :  0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B    ║
║  Risk     :  batchWithdraw_reentrancy_pattern               ║
║  Class    :  CRITICAL                                        ║
║  Mode     :  Autonomous Vercel Cron (5-min cycle)           ║
║                                                              ║
║  ┌──────────┬────────────────────────────────┬───────────┐  ║
║  │ Severity │ Pattern                        │ Keeper    │  ║
║  │ CRITICAL │ batchWithdraw_reentrancy_pattern│ Vercel ⚡ │  ║
║  └──────────┴────────────────────────────────┴───────────┘  ║
║                                                              ║
║  🔗 View on Explorer →                                       ║
║  shannon-explorer.somnia.network/address/0xEC263eBB...      ║
║                                                              ║
║  SomniaWatch | Autonomous Security Guardian                  ║
║  Somnia Agentathon 2026 · Today at 3:29 PM                  ║
╚══════════════════════════════════════════════════════════════╝
```

> This exact Discord embed and Telegram message fires automatically every time a CRITICAL pattern is detected — sourced from real keeper output on **28 May 2026 at 15:29 IST**.

---

## 📜 Deployed Contracts (Somnia Shannon Testnet)

| Contract | Address | Explorer |
|---|---|---|
| **SomniaWatch** (main) | `0x21845ed6C3A3268AFAC41f42244436C7662fd03d` | [View ↗](https://shannon-explorer.somnia.network/address/0x21845ed6C3A3268AFAC41f42244436C7662fd03d) |
| **MockVault** (attack target) | `0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B` | [View ↗](https://shannon-explorer.somnia.network/address/0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B) |
| **AuditCertificate** (ERC-721 NFT) | deploy via `npm run deploy` | — |

---

## ⚡ Why Somnia — This Couldn't Exist Anywhere Else

SomniaWatch is **natively designed for Somnia's Agentic L1** — not ported from Ethereum.

| Somnia Feature | How SomniaWatch Uses It |
|---|---|
| **1M TPS + sub-second finality** | Keeper analyzes every block in real time — Ethereum is too slow and too expensive |
| **Native JSON API Agent** | Fetches on-chain transaction data without any off-chain oracle or trusted middleware |
| **Native LLM Inference Agent (Qwen3-30B)** | Classifies risk using AI — reasoning happens on-chain, result is consensus-validated |
| **3-Validator Consensus** | Every AI decision verified by 3 independent nodes — no single point of failure |
| **On-chain receipts (requestId)** | Every audit has a `receiptId` verifiable on explorer — immutable proof of AI reasoning |

> Without Somnia's agentic infrastructure, this would require a centralized server, an external oracle, and trust in a single off-chain operator. On Somnia, every decision is **on-chain, decentralized, and verifiable.**

---

## 🆚 Competitive Landscape

| Feature | OpenZeppelin Defender | Forta | Tenderly | **SomniaWatch** |
|---|:---:|:---:|:---:|:---:|
| Real-time alerts | ✅ | ✅ | ✅ | ✅ |
| On-chain AI reasoning | ❌ | ❌ | ❌ | ✅ |
| Immutable audit receipts | ❌ | ❌ | ❌ | ✅ |
| NFT audit certificates | ❌ | ❌ | ❌ | ✅ |
| Verifiable AI decisions | ❌ | ❌ | ❌ | ✅ |
| Built on Somnia natively | ❌ | ❌ | ❌ | ✅ |
| Truly autonomous (no humans) | ❌ | Partial | ❌ | ✅ |
| Free for any protocol | ❌ | ❌ | ❌ | ✅ |
| Composable public audit API | ❌ | ❌ | ❌ | ✅ |

---

## 🗂️ Project Structure

```
somniawatch/
├── contracts/
│   ├── SomniaWatch.sol          # Core contract — registry, agent calls, audit storage
│   ├── AuditCertificate.sol     # ERC-721 — on-chain SVG NFT certificates
│   └── MockVault.sol            # Attack demo target (batchWithdraw reentrancy)
│
├── scripts/
│   ├── keeper.js                # Autonomous keeper — hybrid on-chain + off-chain
│   └── deploy.js                # Deployment to Somnia testnet
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main app — wallet connect, attack sim, tabs
│   │   ├── components/
│   │   │   ├── AuditFeed.jsx        # Live risk chart + full audit history
│   │   │   ├── AlertLog.jsx         # Real-time alert event log
│   │   │   ├── ThreatIntelCard.jsx  # Per-contract threat intelligence panel
│   │   │   ├── WebhookMarketplace.jsx  # Register alert endpoints
│   │   │   ├── CertificateGallery.jsx  # NFT certificate viewer
│   │   │   ├── Leaderboard.jsx      # Top safest contracts ranking
│   │   │   └── AgentFlowDiagram.jsx # How It Works visual diagram
│   │   ├── abi/                 # Contract ABIs
│   │   └── constants.js         # Chain config, addresses
│   ├── api/
│   │   └── keeper-cron.js       # Vercel serverless — fires Discord + Telegram
│   └── vercel.json              # Vercel cron (daily, Hobby plan compatible)
│
├── .github/
│   └── workflows/
│       └── keeper.yml           # GitHub Actions — calls keeper every 5 min, FREE
│
└── .env.example                 # Safe template — real .env is never committed
```

---

## ⚙️ Quickstart

### Prerequisites
- Node.js v18+
- MetaMask configured for Somnia Testnet
- Somnia testnet STT from the [Somnia Discord faucet](https://discord.gg/somnia)

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

Edit `.env` with your values (never commit this file):

```env
PRIVATE_KEY=your_wallet_private_key_here
SOMNIA_RPC=https://dream-rpc.somnia.network
SOMNIAWATCH_ADDRESS=0x21845ed6C3A3268AFAC41f42244436C7662fd03d
MOCK_VAULT_ADDRESS=0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B
DISCORD_WEBHOOK=https://discord.com/api/webhooks/YOUR_WEBHOOK_HERE
TELEGRAM_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id
API_PORT=3001
```

### 3. Deploy Contracts (optional — already live on testnet)

```bash
npm run deploy
```

### 4. Run the Keeper

```bash
node scripts/keeper.js
```

```
============================================
  SomniaWatch Keeper - HYBRID MODE
  On-chain platform + Off-chain fallback
============================================
  Wallet:     0xF9553A2eAF93e8cf63bB1BD7...
  Balance:    162.55 STT
  Contract:   0x21845ed6C3A3268AFAC41f422...
  MockVault:  0xEC263eBBA7f26ab58C78c27c9...
  Discord:    configured OK
  Telegram:   configured OK
============================================

[09:35:28] ---- Keeper cycle start ----
[09:35:33]   Result: CRITICAL | batchWithdraw_reentrancy_pattern | nonce: 1
[09:35:33]   Firing CRITICAL alerts...
[09:35:33]   Discord alert sent OK
[09:35:34]   Telegram alert sent OK
[09:35:35] ---- Cycle complete. Next in 5 min ----
```

### 5. Start Frontend

```bash
cd frontend && npm install && npm run dev
# Open http://localhost:5173
```

---

## 🤖 Fully Autonomous Setup (No Terminal, No Server)

Run SomniaWatch 100% serverlessly — alerts fire even when your laptop is off.

**Step 1 — Add secrets to Vercel** (`Project → Settings → Environment Variables`):

```
DISCORD_WEBHOOK    →  https://discord.com/api/webhooks/YOUR_WEBHOOK
TELEGRAM_TOKEN     →  your_bot_token_from_botfather
TELEGRAM_CHAT_ID   →  your_telegram_chat_id
```

**Step 2 — Add GitHub Actions secret** (`Settings → Secrets → Actions → New`):

```
KEEPER_CRON_URL  →  https://somniawatch-eight.vercel.app/api/keeper-cron
```

GitHub Actions calls `/api/keeper-cron` **every 5 minutes, 24/7, completely free.**
Vercel reads secrets server-side and fires Discord + Telegram.

```
Every 5 minutes:
  GitHub Actions → POST /api/keeper-cron (Vercel serverless)
       ↓
  Reads DISCORD_WEBHOOK + TELEGRAM_TOKEN from Vercel env
       ↓
  Fires Discord embed + Telegram message
       ↓
  Returns { "discord": "sent", "telegram": "sent" }
```

**Zero terminal. Zero server. Zero maintenance. Fully autonomous.**

---

## 📡 Public Audit API

```bash
# Live health check + trigger alert
GET https://somniawatch-eight.vercel.app/api/keeper-cron

# Leaderboard — top safest contracts by consecutive SAFE audits
GET https://somniawatch-eight.vercel.app/api/leaderboard

# Full audit history for any monitored contract
GET https://somniawatch-eight.vercel.app/api/audits/0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B
```

Response:
```json
{
  "address": "0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B",
  "audits": [
    {
      "riskLevel": "CRITICAL",
      "riskType": "batchWithdraw_reentrancy_pattern",
      "source": "off-chain-rpc",
      "timestamp": 1748425428000,
      "explorerLink": "https://shannon-explorer.somnia.network/address/0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B"
    }
  ],
  "count": 6
}
```

SomniaWatch is a **composable security primitive** — any agent, dApp, or protocol on Somnia can query audit data on demand.

---

## 🔐 Agent Receipt Verification

Every `AuditRecord` stored on-chain contains a `receiptId` — this equals the Somnia platform's `requestId` for the AI inference call.

Verify any AI security decision independently:

```
https://shannon-explorer.somnia.network/tx/{receiptId}
```

**No black box. No centralized authority.** Every classification is cryptographically tied to the on-chain agent call that produced it — immutable, consensus-validated, publicly verifiable.

---

## 🗺️ Roadmap

```
Phase 1 — Somnia Agentathon (✅ COMPLETE)
├── Core 2-agent pipeline (JSON API + LLM Inference) on Somnia
├── Hybrid keeper — on-chain + off-chain fallback
├── Discord + Telegram autonomous alerts
├── React dashboard with live risk history chart
├── One-click attack simulator (real on-chain TX)
├── NFT audit certificate system (Bronze / Silver / Gold)
└── Vercel serverless + GitHub Actions 5-min cron

Phase 2 — Post-Hackathon
├── Somnia mainnet deployment
├── Multi-contract batch monitoring (100+ contracts)
├── Token-gated premium tier for institutional protocols
├── Webhook marketplace (Discord / Telegram / Slack / PagerDuty)
├── Agent reasoning history explorer
└── SDK for protocols to self-integrate in one transaction

Phase 3 — Ecosystem Layer
├── SomniaWatch DAO — decentralized guardian governance
├── Bridge + governance anomaly monitoring
├── Security score as a DeFi primitive (insurance, collateral rating)
└── Cross-protocol threat intelligence sharing
```

---

## 👤 Built By

<div align="center">

**Gopichand Challa**
AI × Web3 Engineer | Somnia Agentathon 2026

[![Twitter](https://img.shields.io/badge/Twitter-@GopichandAI-1DA1F2?style=flat-square&logo=twitter&logoColor=white)](https://x.com/GopichandAI)
[![GitHub](https://img.shields.io/badge/GitHub-gopichandchalla16-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/gopichandchalla16)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Gopichand%20Challa-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gopichandchalla)

*"Somnia is building the fastest agentic L1. SomniaWatch is the security guardian every protocol on it needs."*

</div>

---

<div align="center">

**SomniaWatch** · Autonomous Security Guardian · Somnia Agentathon 2026

🛡️ *Watch. Reason. Act. No humans required.*

[🌐 Live Demo](https://somniawatch-eight.vercel.app) &nbsp;·&nbsp; [📜 Smart Contract](https://shannon-explorer.somnia.network/address/0x21845ed6C3A3268AFAC41f42244436C7662fd03d) &nbsp;·&nbsp; [🐦 @GopichandAI](https://x.com/GopichandAI)

</div>
