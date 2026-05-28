# SomniaWatch 🔧

> **The first autonomous smart contract security guardian on Somnia Agentic L1.**
> Watch. Reason. Act. No humans required.

[![Somnia Agentathon 2026](https://img.shields.io/badge/Somnia-Agentathon%202026-22ff88?style=flat-square)](https://www.encodeclub.com/programmes/agentathon)
[![Live Demo](https://img.shields.io/badge/Live-Demo-22aaff?style=flat-square)](https://somniawatch-eight.vercel.app)
[![Contract](https://img.shields.io/badge/Contract-Shannon%20Testnet-a855f7?style=flat-square)](https://shannon-explorer.somnia.network/address/0x21845ed6C3A3268AFAC41f42244436C7662fd03d)

---

## What is SomniaWatch?

SomniaWatch is an **autonomous agentic security platform** that monitors Somnia smart contracts 24/7 using a **3-agent pipeline** — no human intervention required:

```
Every 5 minutes:
  → JSON API Agent     fetchString()  · 0.12 STT · fetch on-chain TX data
  → LLM Inference      inferString()  · 0.24 STT · Qwen3-30B classifies risk
  → LLM Parse Website  parseWebsite() · 0.36 STT · scrape + extract signals
  → Result recorded on-chain with validator receipt
  → CRITICAL → Discord + Telegram alert fired
```

---

## Inspired by Somnia's Own Hackathon Projects

SomniaWatch takes direct inspiration from all 4 of Somnia's internal hackathon ideas:

### 🦁 The Sphinx Protocol → Challenge CRITICAL
In *The Sphinx*, a vault is guarded by an LLM that evaluates persuasive arguments.
In SomniaWatch: every **CRITICAL** finding can be **challenged**. The protocol guardian writes a defense. Somnia's `inferString()` (Qwen3-30B, 3-validator consensus) scores the argument 0–100.
- Score > 75 → **SAFE OVERRIDE** — alert suppressed
- Score < 75 → **CRITICAL CONFIRMED** — Discord + Telegram fired

### 👣 Tamagotchi → Living NFT Security Guardian
In *Tamagotchi*, an NFT pet's bio and conversation are powered by Somnia Agents.
In SomniaWatch: your **NFT Certificate** is a **living guardian**. Its health = consecutive SAFE audits. It levels up Bronze → Silver → Gold. It **speaks** via `inferString()` — reporting its audit status in real-time LLM-generated messages.

### 🌧️ Rainy Day Fund → Conditional Alert Gating
In *Rainy Day Fund*, a vault only unlocks when a Somnia Agent verifies real-world conditions.
In SomniaWatch: alerts only fire when the **JSON API Agent confirms** the condition (volume threshold, repeat pattern, new risk type). This eliminates false positives using the same real-world verification pattern.

### 🎲 On-Chain D&D → Agentic Decision-Making
In *On-Chain D&D*, all game logic and decisions happen via LLM Inference on-chain.
In SomniaWatch: every **audit classification decision** is made by `inferString()` — the LLM is the Dungeon Master of your contract's security, deciding SAFE / SUSPICIOUS / CRITICAL with on-chain receipts.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│            SomniaWatch                         │
│                                                │
│  Vercel Cron (every 5 min)                     │
│    → keeper.js                                  │
│      → fetchString()   ← JSON API Agent         │
│      → inferString()   ← LLM Inference Agent    │
│      → parseWebsite()  ← LLM Parse Website      │
│      → SomniaWatch.sol recordAudit()             │
│      → Discord / Telegram webhook               │
│                                                │
│  Frontend (React + ethers.js)                  │
│    → Dashboard + Attack Simulator               │
│    → Alert Log + Sphinx Challenge               │
│    → Agent Explorer (all 3 agents live)         │
│    → NFT Certificates (Tamagotchi guardian)     │
│    │ Leaderboard + Webhook Marketplace         │
└─────────────────────────────────────────────┘
```

---

## The 3 Somnia Agents Used

| Agent | Method | Use in SomniaWatch | Cost |
|---|---|---|---|
| JSON API Request | `fetchString()` | Fetch on-chain TX data per contract | 0.12 STT |
| LLM Inference | `inferString()` | Classify CRITICAL/SUSPICIOUS/SAFE + Sphinx judge + NFT speech | 0.24 STT |
| LLM Parse Website | `parseWebsite()` | Scrape explorer page, extract risk signals | 0.36 STT |

---

## Live Contracts (Somnia Shannon Testnet)

| Contract | Address | Explorer |
|---|---|---|
| SomniaWatch.sol | `0x21845ed6C3A3268AFAC41f42244436C7662fd03d` | [View](https://shannon-explorer.somnia.network/address/0x21845ed6C3A3268AFAC41f42244436C7662fd03d) |
| MockVault.sol | `0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B` | [View](https://shannon-explorer.somnia.network/address/0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B) |
| AuditCertificate.sol | `0xF9553A2eAF93e8cf63bB1BD7CdA942224E1Adb44` | [View](https://shannon-explorer.somnia.network/address/0xF9553A2eAF93e8cf63bB1BD7CdA942224E1Adb44) |

---

## Features

- 🔧 **Autonomous monitoring** — keeper runs every 5 min via Vercel Cron, zero human intervention
- 🔴 **One-click attack simulator** — `batchWithdraw` reentrancy demo on MockVault
- 🦁 **Sphinx Protocol** — challenge CRITICAL findings via Somnia LLM Judge
- 👣 **Tamagotchi guardian** — living NFT certificate powered by inferString()
- 🌧️ **Rainy Day gating** — conditional alerts verified by JSON API Agent
- 🤖 **Agent Explorer** — live log of all 3 Somnia agent calls with receipt IDs
- 📊 **Leaderboard** — top contracts by consecutive SAFE audits
- 🔔 **Alert Log** — every keeper decision recorded with Discord/Telegram status
- 📡 **Webhook Marketplace** — composable alert infrastructure for any Somnia protocol
- 🏅 **NFT Certificates** — Bronze/Silver/Gold on-chain proof of security

---

## Quick Start

```bash
git clone https://github.com/gopichandchalla16/somniawatch
cd somniawatch/frontend
npm install
npm run dev
```

Set env vars in Vercel:
```
DISCORD_WEBHOOK_URL=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
SOMNIA_RPC=https://dream-rpc.somnia.network
```

---

## Built By

**Gopichand Challa** | [@GopichandAI](https://x.com/GopichandAI) | [GitHub](https://github.com/gopichandchalla16) | Somnia Agentathon 2026

> *"Every CRITICAL alert is a story. SomniaWatch reads them all."*
