<!-- SomniaWatch — Autonomous Smart Contract Security Guardian -->
<div align="center">

# 🛡️ SomniaWatch

### The first autonomous smart contract security guardian on Somnia Agentic L1

**Watch. Reason. Act. No humans required.**

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20App-somniawatch--eight.vercel.app-22ff88?style=for-the-badge&logoColor=white)](https://somniawatch-eight.vercel.app)
[![Demo Video](https://img.shields.io/badge/🎬%20Demo%20Video-Watch%20Now-ff0000?style=for-the-badge)](https://youtube.com/YOUR_VIDEO_LINK)
[![Presentation](https://img.shields.io/badge/📊%20Slides-View%20Presentation-7c3aed?style=for-the-badge)](https://docs.google.com/presentation/d/1aB9s72xFDSyNdE_oMvt5QFXwrSRoagoT/edit?usp=sharing)
[![Somnia Agentathon 2026](https://img.shields.io/badge/Somnia-Agentathon%202026-06b6d4?style=for-the-badge)](https://www.encodeclub.com/programmes/agentathon)

</div>

---

## 📋 Submission Links

| Resource | Link |
|---|---|
| 🌐 **Live Application** | [somniawatch-eight.vercel.app](https://somniawatch-eight.vercel.app) |
| 🎬 **Demo Video** | [Watch on YouTube](https://youtube.com/YOUR_VIDEO_LINK) |
| 📊 **Pitch Deck** | [View Presentation on Google Slides](https://docs.google.com/presentation/d/1aB9s72xFDSyNdE_oMvt5QFXwrSRoagoT/edit?usp=sharing) |
| 💻 **Source Code** | [github.com/gopichandchalla16/somniawatch](https://github.com/gopichandchalla16/somniawatch) |
| 🔗 **SomniaWatch.sol** | [`0x21845ed6C3A3268AFAC41f42244436C7662fd03d`](https://shannon-explorer.somnia.network/address/0x21845ed6C3A3268AFAC41f42244436C7662fd03d) |
| 🔗 **MockVault.sol** | [`0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B`](https://shannon-explorer.somnia.network/address/0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B) |
| 🔗 **AuditCertificate.sol** | [`0xF9553A2eAF93e8cf63bB1BD7CdA942224E1Adb44`](https://shannon-explorer.somnia.network/address/0xF9553A2eAF93e8cf63bB1BD7CdA942224E1Adb44) |
| 👤 **Builder** | [Gopichand Challa — @GopichandAI](https://x.com/GopichandAI) |

---

## 🚨 The Problem: Smart Contracts Are Blind to Their Own Exploits

The DeFi ecosystem lost **over $2.2 billion** to smart contract exploits in 2024–2025 alone. The pattern is always the same:

- A reentrancy attack drains a vault at **3 AM**
- Flash loan manipulation executes across **14 transactions in 8 seconds**
- The protocol team wakes up to **Twitter notifications**, not security alerts
- By the time humans respond, the funds are **bridged and gone**

Existing security tools are either **off-chain and centralized** (Forta, OpenZeppelin Defender), require **manual human review** (audit firms), or only run **after deployment** with no real-time intelligence.

**The gap:** There is no autonomous, always-on, on-chain reasoning layer that watches contracts, thinks about what it sees, and acts — without waiting for a human.

---

## 🛡️ The Solution: SomniaWatch

SomniaWatch is a **fully autonomous smart contract security guardian** built natively on **Somnia's Agentic L1**. It uses three chained Somnia Agents to fetch, reason, and classify contract risk every 5 minutes — with no human in the loop.

```
Every 5 minutes, automatically:

  🔗  JSON API Agent      fetchString()    0.12 STT
       └─ Pulls live transaction history from the Somnia RPC
       └─ Extracts: TX count, method signatures, caller frequency
       └─ 3-validator consensus → tamper-proof data fetch
            ↓
  🕷️  LLM Parse Website   parseWebsite()   0.36 STT
       └─ Scrapes the Shannon Explorer contract page
       └─ HTML → Markdown → LLM extracts risk signals
       └─ Detects: unusual call patterns, new callers, value anomalies
            ↓
  🧠  LLM Inference       inferString()    0.24 STT
       └─ Qwen3-30B reasons over combined data
       └─ allowedValues: ["SAFE", "SUSPICIOUS", "CRITICAL"]
       └─ 3-validator consensus → classification is trustless
            ↓
  📝  SomniaWatch.sol     recordAudit()
       └─ Immutable on-chain receipt: classification + timestamp + receipt ID
            ↓
  🚨  CRITICAL detected?
       └─ Discord webhook fires → team alerted in < 5 minutes
       └─ Telegram bot fires → mobile push notification
       └─ Sphinx Protocol opens → protocol can challenge the finding
```

**Total cost per full audit cycle: 0.72 STT.** Every decision is verifiable on-chain.

---

## 🔬 How It Works: The 3-Agent Pipeline in Depth

### Agent 1 — JSON API Agent (`fetchString()`)

The first agent in every keeper cycle calls the Somnia RPC via `fetchString()`. It retrieves the raw transaction history for the monitored contract and extracts structured signals:

- **Transaction count** over the last 100 blocks
- **Unique callers** and caller frequency patterns
- **Method signature frequency** — how often each function is called
- **Value flows** — deposit vs withdrawal imbalances

The fetch runs through 3 Somnia validators before the result is accepted, making the input data itself **tamper-resistant**. A compromised or spoofed API response cannot pass validator consensus.

> *Real-world parallel: This is the same pattern as the Rainy Day Fund — real-world data (weather / TX history) verified by a Somnia Agent before any action is taken. SomniaWatch uses it to gate alert logic on confirmed on-chain evidence.*

---

### Agent 2 — LLM Parse Website (`parseWebsite()`)

The second agent scrapes the Shannon Block Explorer page for the monitored contract. This goes beyond raw RPC data — the explorer renders **human-readable risk context** that a pure API call misses:

- Contract verification status and source code presence
- Token transfer events and ERC-20 interactions
- Historical anomaly patterns visible in the explorer UI
- New contract interactions that appeared since the last audit

The raw HTML is converted to Markdown, then the LLM extracts a typed risk summary field. This gives SomniaWatch **two independent data sources** per cycle — RPC data and explorer data — dramatically reducing false positives.

---

### Agent 3 — LLM Inference (`inferString()`)

The third agent is the reasoning core. It receives the structured output from Agents 1 and 2, and classifies the contract's current risk state:

```
Input:  "Contract 0xEC263eBB: 18 TXs in 100 blocks.
         batchWithdraw called 8 times. 3 unique callers.
         Last deposit: 0.05 STT. Total withdrawn: 0.04 STT.
         Explorer: contract verified, new caller detected at block 9241800."

Model:  Qwen3-30B via Somnia Inference Agent
Allowed: ["SAFE", "SUSPICIOUS", "CRITICAL"]

Output: "CRITICAL" (3/3 validator consensus)
Receipt: req_llm_4729384756 → stored on-chain
```

The `allowedValues` constraint eliminates hallucination — the model cannot return anything outside `["SAFE", "SUSPICIOUS", "CRITICAL"]`. This is a key Somnia Agent design pattern that SomniaWatch uses to make LLM output **safe for on-chain consumption**.

> *Real-world parallel: This is On-Chain D&D — every classification decision is the LLM acting as Dungeon Master, ruling on the contract's fate with immutable on-chain receipts.*

---

## 🦁 Sphinx Protocol: Challenge CRITICAL Findings

False positives are the enemy of any security system. SomniaWatch solves this with the **Sphinx Protocol** — a challenge mechanism where any CRITICAL finding can be contested by the protocol team.

**How it works:**

1. A CRITICAL audit is recorded on-chain by the keeper
2. The monitored protocol's team sees the alert on Discord/Telegram
3. They open the Sphinx tab in SomniaWatch and write a defense argument:
   > *"This batchWithdraw was an authorized DAO treasury rebalancing. The 8 calls were from our multisig 0x... as confirmed in governance vote #142."*
4. The argument is submitted to `inferString()` with `allowedValues: ["0"..."100"]`
5. Qwen3-30B scores the argument's legitimacy (0–100) through 3-validator consensus
6. The score is recorded on-chain with a receipt ID:
   - **Score ≥ 75** → **SAFE OVERRIDE** — alert suppressed, audit reclassified
   - **Score < 75** → **CRITICAL CONFIRMED** — Discord + Telegram fire, finding stands

This gives protocols a **trustless appeal mechanism** — not a human moderator, not a DAO vote, but an on-chain LLM judgment that is verifiable and immutable.

---

## 🐣 Tamagotchi Guardian: The Living NFT Certificate

SomniaWatch issues **on-chain NFT certificates** to contracts that maintain clean security records. But unlike static badges, these certificates are **living guardians** — powered by Somnia's inference agent.

**Tier progression:**

| Tier | Requirement | Meaning |
|---|---|---|
| 🟤 Bronze | 1+ consecutive SAFE audits | Monitored and passing |
| ⚪ Silver | 5+ consecutive SAFE audits | Trusted by the guardian |
| 🏆 Gold | 10+ consecutive SAFE audits | Top-tier security record |

**The guardian speaks.** Every NFT certificate has a **Speak** button that calls `inferString()` in real-time. The Qwen3-30B model generates a live status report from the guardian's perspective:

> *"Guardian status: ACTIVE. I have completed 10 audit cycles on this contract. My consecutive SAFE record is intact. I am evolving toward Gold tier. My judgment is trusted by the Somnia validator network."*

Each speech response generates an on-chain receipt ID. The guardian's health bar degrades on any CRITICAL finding — simulating the same consequence mechanic as a Tamagotchi that needs care to thrive.

This turns **security compliance into a gamified, social signal** — protocols display their Gold guardian as proof of sustained security to users and investors.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SOMNIAWATCH SYSTEM                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                   │
│   TRIGGER LAYER                                                   │
│   ├─ Vercel Cron        ── /api/keeper-cron  (every 5 min)       │
│   └─ GitHub Actions     ── keeper.yml        (every 6 hours)     │
│                                    │                              │
│   AGENT PIPELINE                   │                              │
│   ├─ fetchString()    ←─────────┘  Somnia JSON API Agent      │
│   ├─ parseWebsite()                    Somnia LLM Parse Agent     │
│   └─ inferString()                     Somnia LLM Inference Agent  │
│              │                                                     │
│   CONTRACT LAYER                                                   │
│   ├─ SomniaWatch.sol    recordAudit()  → on-chain receipt          │
│   ├─ AuditCertificate   mintCert()     → NFT Bronze/Silver/Gold   │
│   └─ MockVault.sol      batchWithdraw() → attack simulator target  │
│              │                                                     │
│   ALERT LAYER                                                      │
│   ├─ Discord Webhook    → team notified within 5 minutes           │
│   └─ Telegram Bot       → mobile push notification                 │
│              │                                                     │
│   FRONTEND (React + Vite + ethers.js)                              │
│   ├─ 📡 Dashboard        Attack simulator + registered contracts     │
│   ├─ 🔔 Alert Log         Full keeper decision history               │
│   ├─ 🔍 Threat Intel       On-chain heuristic risk analysis           │
│   ├─ 🤖 Agent Explorer     Live log of all 3 agent calls + receipts   │
│   ├─ 🧪 Agent Playground    Call any Somnia agent directly from UI      │
│   ├─ 🏅 Certificates       NFT guardian status + Speak button          │
│   ├─ 🏆 Leaderboard        Top contracts by consecutive SAFE streak     │
│   └─ ⚙️  How It Works       Full pipeline diagram + agent call trace    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 The 3 Somnia Agents: Full Specification

| Agent | Method | Role in Pipeline | Cost | Validators |
|---|---|---|---|---|
| JSON API Request | `fetchString()` | Fetch + structure live on-chain TX data | 0.12 STT | 3 |
| LLM Parse Website | `parseWebsite()` | Scrape explorer, extract typed risk field | 0.36 STT | 3 |
| LLM Inference | `inferString()` | Classify SAFE/SUSPICIOUS/CRITICAL + Sphinx judge + NFT speech | 0.24 STT | 3 |

**Total per audit cycle: 0.72 STT · 9 validator attestations · 3 on-chain receipts**

All 3 agents run with **3-validator consensus** — no single point of failure, no single-node trust.

---

## 🔗 Live Contracts (Somnia Shannon Testnet)

| Contract | Address | Explorer |
|---|---|---|
| **SomniaWatch.sol** | `0x21845ed6C3A3268AFAC41f42244436C7662fd03d` | [View ↗](https://shannon-explorer.somnia.network/address/0x21845ed6C3A3268AFAC41f42244436C7662fd03d) |
| **MockVault.sol** | `0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B` | [View ↗](https://shannon-explorer.somnia.network/address/0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B) |
| **AuditCertificate.sol** | `0xF9553A2eAF93e8cf63bB1BD7CdA942224E1Adb44` | [View ↗](https://shannon-explorer.somnia.network/address/0xF9553A2eAF93e8cf63bB1BD7CdA942224E1Adb44) |

**Network:** Somnia Shannon Testnet · Chain ID: 50312 · RPC: `https://dream-rpc.somnia.network`

---

## ✨ Feature Set

| Feature | What It Does | Why It Matters |
|---|---|---|
| 🤖 **Autonomous Keeper** | Vercel Cron + GitHub Actions run automatically, zero intervention | Truly autonomous — not a demo |
| 💥 **Attack Simulator** | One-click `batchWithdraw` reentrancy on live MockVault | Live proof the detection works |
| 🦁 **Sphinx Protocol** | CRITICAL findings challenged via LLM Judge, scored 0–100 | Trustless false-positive resolution |
| 🐣 **Tamagotchi Guardian** | NFT that levels up, degrades, and speaks via `inferString()` | Gamified security compliance signal |
| 🌧️ **Conditional Gating** | Alerts only fire after JSON API Agent confirms risk evidence | Eliminates false positives at source |
| 🤖 **Agent Explorer** | Every agent call logged with receipt ID, cost, consensus status | Full auditability of the AI layer |
| 🧪 **Agent Playground** | Call any Somnia agent live from UI with real SomniaWatch data | Demonstrates composability directly |
| 🔔 **Discord + Telegram** | Real webhook + bot alerts on CRITICAL, fires in < 5 minutes | Production alerting infrastructure |
| 🏅 **NFT Certificates** | Bronze / Silver / Gold tiers based on consecutive SAFE streak | On-chain proof of security track record |
| 🏆 **Leaderboard** | Ranks monitored contracts by SAFE audit streak | Social proof + competitive security |
| 🔍 **Threat Intel** | On-chain heuristic risk signals per contract | Context layer for LLM reasoning |

---

## 💼 Real-World Use Cases

### DeFi Protocol Security Operations
A lending protocol on Somnia registers its vault contract with SomniaWatch. Every 5 minutes, the 3-agent pipeline audits transaction patterns. When a flash loan attack begins, the JSON API Agent detects unusual withdrawal frequency, the Parse Agent confirms a new caller at the explorer level, and the LLM classifies **CRITICAL** before the second transaction in the attack sequence. Discord fires. The team pauses deposits manually within 3 minutes.

### Protocol Security Certification
A new DEX launching on Somnia runs SomniaWatch for 30 days before launch. After 10 consecutive SAFE audits, their contract earns a **Gold NFT Certificate** — publicly verifiable on-chain proof of sustained security. They display it in their app UI and documentation as a trust signal to users.

### DAO Treasury Monitoring
A Somnia DAO registers its multisig treasury with SomniaWatch. Any unusual spending pattern triggers a CRITICAL alert. The DAO's security committee uses the **Sphinx Protocol** to challenge false positives — writing an on-chain argument that the LLM Judge verifies as legitimate before suppressing the alert.

### Developer Testing & Audit Simulation
A developer deploying a new contract uses SomniaWatch's **Attack Simulator** to test detection sensitivity before going live. They simulate reentrancy attacks and watch the 3-agent pipeline classify them in real time, confirming their contract's behavior is correctly analyzed before mainnet.

---

## 🚀 Quick Start

```bash
# Clone and run locally
git clone https://github.com/gopichandchalla16/somniawatch
cd somniawatch/frontend
npm install
npm run dev
# Open http://localhost:5173
```

```bash
# Connect MetaMask to Somnia Shannon Testnet
Network:  Somnia Shannon Testnet
Chain ID: 50312
RPC URL:  https://dream-rpc.somnia.network
Explorer: https://shannon-explorer.somnia.network
Symbol:   STT
```

**Vercel Environment Variables** (Settings → Environment Variables):
```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN
TELEGRAM_CHAT_ID=YOUR_CHAT_ID
SOMNIA_RPC=https://dream-rpc.somnia.network
```

---

## 📚 Technical Stack

| Layer | Technology |
|---|---|
| **Blockchain** | Somnia Shannon Testnet (Chain ID: 50312) |
| **Smart Contracts** | Solidity 0.8.20 + Hardhat |
| **AI Agents** | Somnia fetchString() + inferString() + parseWebsite() |
| **LLM Model** | Qwen3-30B via Somnia Inference Agent |
| **Frontend** | React 18 + Vite + ethers.js v6 |
| **Styling** | Custom CSS design system (Inter + JetBrains Mono) |
| **Deployment** | Vercel (frontend + serverless API routes) |
| **Automation** | Vercel Cron + GitHub Actions (dual keeper) |
| **Alerts** | Discord Webhooks + Telegram Bot API |
| **NFT** | ERC-721 AuditCertificate.sol |

---

## 🏆 Why SomniaWatch Wins

> Most hackathon teams call **1 Somnia agent**. SomniaWatch chains **all 3**, deploys **3 smart contracts**, ships **8 production UI tabs**, fires **real Discord and Telegram alerts**, implements a **trustless LLM challenge system**, and runs **two independent autonomous keeper mechanisms** simultaneously.

| Judging Criterion | SomniaWatch's Answer |
|---|---|
| **Agent Composability** | 3 agents chained in sequence: fetchString → parseWebsite → inferString |
| **Real-World Utility** | Live security monitoring for any deployed Somnia contract |
| **Somnia Vision Alignment** | Uses all 3 Somnia agent types with native design patterns (allowedValues, validator consensus) |
| **Technical Depth** | allowedValues constraint, off-chain hybrid keeper, dual trigger mechanism |
| **Production Quality** | Live frontend + 3 deployed contracts + working cron + real alerts |
| **Originality** | First autonomous security guardian on any Agentic L1 |
| **Demo-ability** | One-click attack → CRITICAL in 5 min → Discord fires — fully demonstrable |

---

## 👤 Built By

<div align="center">

**Gopichand Challa**

[X / Twitter @GopichandAI](https://x.com/GopichandAI) · [GitHub](https://github.com/gopichandchalla16) · [LinkedIn](https://linkedin.com/in/gopichandchalla) · [DEV.to](https://dev.to/gopichand_dev)

Somnia Agentathon 2026 — **Solo submission**

*"Every CRITICAL alert is a story. SomniaWatch reads them all."*

</div>
