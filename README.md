# SomniaWatch 🛡️

> **The first autonomous smart contract security guardian on Somnia Agentic L1.**
> Watch. Reason. Act. No humans required.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-somniawatch--eight.vercel.app-22ff88?style=for-the-badge)](https://somniawatch-eight.vercel.app)
[![Demo Video](https://img.shields.io/badge/🎬_Demo_Video-Watch_on_YouTube-ff0000?style=for-the-badge)](https://youtube.com/YOUR_VIDEO_LINK)
[![Somnia Agentathon](https://img.shields.io/badge/Somnia-Agentathon%202026-a855f7?style=for-the-badge)](https://www.encodeclub.com/programmes/agentathon)
[![Contract](https://img.shields.io/badge/Contract-Shannon%20Testnet-06b6d4?style=for-the-badge)](https://shannon-explorer.somnia.network/address/0x21845ed6C3A3268AFAC41f42244436C7662fd03d)

---

## 🏆 Submission Links

| | Link |
|---|---|
| 🌐 **Live App** | [somniawatch-eight.vercel.app](https://somniawatch-eight.vercel.app) |
| 🎬 **Demo Video** | [Watch on YouTube](https://youtube.com/YOUR_VIDEO_LINK) |
| 📊 **Presentation** | [View on Canva](https://canva.com/YOUR_PRESENTATION_LINK) |
| 💻 **GitHub** | [gopichandchalla16/somniawatch](https://github.com/gopichandchalla16/somniawatch) |
| 🔗 **SomniaWatch Contract** | [0x21845ed6...fd03d](https://shannon-explorer.somnia.network/address/0x21845ed6C3A3268AFAC41f42244436C7662fd03d) |
| 🔗 **MockVault Contract** | [0xEC263eBB...d39B](https://shannon-explorer.somnia.network/address/0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B) |
| 🔗 **AuditCertificate Contract** | [0xF9553A2e...db44](https://shannon-explorer.somnia.network/address/0xF9553A2eAF93e8cf63bB1BD7CdA942224E1Adb44) |
| 👤 **Builder** | [Gopichand Challa @GopichandAI](https://x.com/GopichandAI) |

---

## 🎯 Inspired by Somnia's Own Hackathon Projects

> SomniaWatch doesn't just *use* Somnia Agents — it implements **all 4** of Somnia's own internal hackathon inspirations as production features inside a single security product.

### 🦁 The Sphinx Protocol → Challenge CRITICAL Findings
In *The Sphinx*, a vault is guarded by an LLM that evaluates persuasive arguments. In SomniaWatch: every **CRITICAL** audit finding can be **challenged**. The contract guardian writes a defense. Somnia's `inferString()` (Qwen3-30B, 3-validator consensus) scores it 0–100.
- Score **> 75** → **SAFE OVERRIDE** — alert suppressed, finding dismissed
- Score **< 75** → **CRITICAL CONFIRMED** — Discord + Telegram alert fires

### 🐣 Tamagotchi → Living NFT Security Guardian
In *Tamagotchi*, an NFT pet's personality is powered by Somnia Agents. In SomniaWatch: your **NFT Certificate is a living guardian**. Its health = consecutive SAFE audits. It levels up Bronze → Silver → Gold. It **speaks** via `inferString()` — generating real-time status messages with on-chain receipt IDs.

### 🌧️ Rainy Day Fund → Conditional Alert Gating
In *Rainy Day Fund*, a vault only unlocks when a Somnia Agent verifies a real-world condition. In SomniaWatch: **alerts only fire when the JSON API Agent confirms** the risk condition (volume threshold, repeated pattern, new exploit type) — eliminating false positives using the same real-world verification primitive.

### 🎲 On-Chain D&D → Agentic Decision-Making
In *On-Chain D&D*, all game decisions happen via LLM Inference on-chain. In SomniaWatch: every **audit classification decision is made by `inferString()`** — the LLM is the Dungeon Master of your contract's security, ruling SAFE / SUSPICIOUS / CRITICAL with immutable on-chain receipts.

---

## What is SomniaWatch?

SomniaWatch is an **autonomous agentic security platform** that monitors Somnia smart contracts 24/7 using a **3-agent pipeline** — no human intervention required:

```
Every 5 minutes (Vercel Cron + GitHub Actions):
  → JSON API Agent     fetchString()  · 0.12 STT · fetch live TX data
  → LLM Inference      inferString()  · 0.24 STT · Qwen3-30B classifies risk
  → LLM Parse Website  parseWebsite() · 0.36 STT · scrape explorer signals
  → AuditRecord stored on-chain with validator receipt
  → CRITICAL → Discord + Telegram alert fired instantly
```

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    SomniaWatch                        │
│                                                       │
│  Vercel Cron + GitHub Actions (every 5 min)           │
│    → keeper.js                                        │
│      → fetchString()    ← JSON API Agent  (0.12 STT)  │
│      → parseWebsite()   ← LLM Parse Web   (0.36 STT)  │
│      → inferString()    ← LLM Inference   (0.24 STT)  │
│      → SomniaWatch.sol recordAudit()                  │
│      → Discord / Telegram webhook                     │
│                                                       │
│  Frontend (React + Vite + ethers.js)                  │
│    📡 Dashboard + One-click Attack Simulator          │
│    🔔 Alert Log (Discord/Telegram status per audit)   │
│    🔍 Threat Intel (heuristic risk analysis)          │
│    🤖 Agent Explorer (all 3 agents, live receipts)    │
│    🧪 Agent Playground (call any agent directly)      │
│    🏅 NFT Certificates (Bronze/Silver/Gold guardian)  │
│    🏆 Leaderboard (top contracts by SAFE streak)      │
│    ⚙️  How It Works (full pipeline diagram)           │
└──────────────────────────────────────────────────────┘
```

---

## The 3 Somnia Agents Used

| Agent | Method | Use in SomniaWatch | Cost/cycle |
|---|---|---|---|
| JSON API Request | `fetchString()` | Fetch live TX data per contract | 0.12 STT |
| LLM Inference | `inferString()` | Classify risk + Sphinx judge + NFT speech | 0.24 STT |
| LLM Parse Website | `parseWebsite()` | Scrape explorer, extract risk signals | 0.36 STT |

> **Total per cycle: 0.72 STT** · 3-validator consensus on every call · All receipts stored on-chain

---

## Live Contracts (Somnia Shannon Testnet)

| Contract | Address | Explorer |
|---|---|---|
| SomniaWatch.sol | `0x21845ed6C3A3268AFAC41f42244436C7662fd03d` | [View ↗](https://shannon-explorer.somnia.network/address/0x21845ed6C3A3268AFAC41f42244436C7662fd03d) |
| MockVault.sol | `0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B` | [View ↗](https://shannon-explorer.somnia.network/address/0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B) |
| AuditCertificate.sol | `0xF9553A2eAF93e8cf63bB1BD7CdA942224E1Adb44` | [View ↗](https://shannon-explorer.somnia.network/address/0xF9553A2eAF93e8cf63bB1BD7CdA942224E1Adb44) |

---

## Features

| Feature | Description |
|---|---|
| 🤖 **Autonomous Monitoring** | Keeper runs every 5 min via Vercel Cron + GitHub Actions — zero humans |
| 💥 **Attack Simulator** | One-click `batchWithdraw` reentrancy demo on live MockVault |
| 🦁 **Sphinx Protocol** | Challenge CRITICAL findings — LLM Judge scores 0–100, can override |
| 🐣 **Tamagotchi Guardian** | Living NFT certificate that levels up and speaks via `inferString()` |
| 🌧️ **Conditional Gating** | Alerts only fire when JSON API Agent confirms the risk condition |
| 🤖 **Agent Explorer** | Full log of every Somnia agent call with receipt IDs + consensus status |
| 🧪 **Agent Playground** | Call any of the 3 Somnia agents live from the UI with preset inputs |
| 🔔 **Discord + Telegram** | Real webhook alerts on every CRITICAL — fires within 5 minutes |
| 🏅 **NFT Certificates** | Bronze (1+) / Silver (5+) / Gold (10+) consecutive SAFE audits |
| 🏆 **Leaderboard** | Top contracts ranked by consecutive SAFE audit streak |

---

## Why This Wins

> Most hackathon teams submit **1 agent call**. SomniaWatch uses **all 3 agents**, implements **all 4 Somnia hackathon inspirations**, deploys **3 smart contracts**, ships **8 UI tabs**, and runs **two autonomous keeper mechanisms** simultaneously.

| What judges look for | What SomniaWatch delivers |
|---|---|
| Agent composability | 3 agents chained: fetch → parse → infer |
| Real-world utility | Live security monitoring for any Somnia contract |
| Technical depth | `allowedValues` optimization, off-chain hybrid keeper |
| Somnia vision alignment | All 4 internal hackathon projects reimplemented |
| Production quality | Deployed frontend + 3 contracts + cron + alerts |

---

## Quick Start

```bash
git clone https://github.com/gopichandchalla16/somniawatch
cd somniawatch/frontend
npm install
npm run dev
```

Environment variables (Vercel dashboard → Settings → Environment Variables):
```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
SOMNIA_RPC=https://dream-rpc.somnia.network
```

---

## Built By

**Gopichand Challa** · [@GopichandAI](https://x.com/GopichandAI) · [GitHub](https://github.com/gopichandchalla16) · [LinkedIn](https://linkedin.com/in/gopichandchalla)

Somnia Agentathon 2026 — Solo submission

> *"Every CRITICAL alert is a story. SomniaWatch reads them all."*
