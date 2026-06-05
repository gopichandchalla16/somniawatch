# 🛡️ SomniaWatch

**The first autonomous smart contract security guardian on Somnia Agentic L1.**

[![Live App](https://img.shields.io/badge/Live%20App-somniawatch--eight.vercel.app-7C3AED?style=for-the-badge)](https://somniawatch-eight.vercel.app)
[![Chain](https://img.shields.io/badge/Chain-Shannon%20Testnet%20%2350312-00D4FF?style=for-the-badge)](https://shannon-explorer.somnia.network)
[![Builder](https://img.shields.io/badge/Builder-Gopichand%20Challa-EC4899?style=for-the-badge)](https://github.com/gopichandchalla16)
[![Agentathon](https://img.shields.io/badge/Somnia-Agentathon%202026-00FF88?style=for-the-badge)](https://somniawatch-eight.vercel.app)

> *Every CRITICAL alert is a story. SomniaWatch reads them all — autonomously, on-chain, 24/7.*

---

## 🔗 Quick Links

| Resource | Link |
|---|---|
| 🌐 Live App | [somniawatch-eight.vercel.app](https://somniawatch-eight.vercel.app) |
| 📊 Presentation Deck | [Google Slides](https://docs.google.com/presentation/d/1aB9s72xFDSyNdE_oMvt5QFXwrSRoagoT/edit?usp=drive_link&ouid=112248824595559643645&rtpof=true&sd=true) |
| 💻 Source Code | [github.com/gopichandchalla16/somniawatch](https://github.com/gopichandchalla16/somniawatch) |
| 🔍 Shannon Explorer | [shannon-explorer.somnia.network](https://shannon-explorer.somnia.network) |
| 🐦 X / Twitter | [@GopichandAI](https://x.com/GopichandAI) |

---

## 🚨 The Problem

DeFi lost **$2.2 billion** to smart contract exploits in 2024–2025 alone. Every major attack shares the same fingerprint:

- 🕐 Attacks happen at **3 AM** — teams wake up to Twitter, not alerts
- ⚡ Funds are drained in **< 60 seconds** before anyone responds
- 🔗 Existing tools (Forta, OZ Defender) are **off-chain and centralized**
- 🤷 Manual audit firms review **code, not live runtime behavior**
- 📭 By the time humans respond, funds are **bridged and gone**

There is no autonomous, always-on, on-chain reasoning layer that watches contracts, thinks about what it sees, and acts — without waiting for a human.

---

## ✅ The Solution

SomniaWatch is a fully autonomous smart contract security guardian built natively on **Somnia's Agentic L1**. It chains all three Somnia Agent types — `fetchString()`, `parseWebsite()`, and `inferString()` — to fetch, reason, and classify contract risk every cycle, with no human in the loop.

When `CRITICAL` risk is detected:
- Real **Discord** and **Telegram** alerts fire in under 5 minutes
- Every classification is recorded **immutably on-chain** with a verifiable receipt ID
- The system acts 24/7 — even when the developer's machine is off

**Total cost per audit cycle: 0.72 STT · 9 validator attestations · 3 on-chain receipts**

---

## 🤖 3-Agent Pipeline

SomniaWatch is the only submission that chains **all three Somnia agent types** in a live production security pipeline. Each agent feeds its output to the next:

### Agent 1 — Watch · `fetchString()` · 0.12 STT
Calls the Somnia RPC to retrieve raw transaction history for the monitored contract.

- Extracts: TX count, unique caller addresses, method signature frequency, value-flow imbalances
- Runs through **3-validator consensus** before the result is accepted
- A compromised API response cannot pass validator consensus — tamper-resistant by design

### Agent 2 — Parse · `parseWebsite()` · 0.36 STT
Scrapes the Shannon Explorer contract page for human-readable risk context that raw RPC data misses:

- Contract verification status, token transfer events, ERC-20 interactions
- Historical anomaly patterns visible in the explorer UI
- New contract interactions since the last audit cycle
- Raw HTML → Markdown → LLM extracts a typed risk summary

### Agent 3 — Reason · `inferString()` · 0.24 STT
The reasoning core. Receives structured output from Agents 1 and 2 and classifies risk with **Qwen3-30B**:

- `allowedValues: ["SAFE", "SUSPICIOUS", "CRITICAL"]` — eliminates hallucination entirely
- Output is safe for on-chain consumption
- Runs through 3-validator consensus → verifiable on-chain receipt ID

---

## 📜 Live Contracts

Deployed on **Somnia Shannon Testnet · Chain ID: 50312**

| Contract | Address | Explorer |
|---|---|---|
| **SomniaWatch.sol** | `0xd1e7EAC1aD0ad24eb444CbC9e9A143c570373ED0` | [View ↗](https://shannon-explorer.somnia.network/address/0xd1e7EAC1aD0ad24eb444CbC9e9A143c570373ED0) |
| **MockVault.sol** | `0xeB282f43b4015b7a71cfbd2Bd52f69146030701E` | [View ↗](https://shannon-explorer.somnia.network/address/0xeB282f43b4015b7a71cfbd2Bd52f69146030701E) |
| **AuditCertificate.sol** | `0xF9553A2eAF93e8cf63bB1BD7CdA942224E1Adb44` | [View ↗](https://shannon-explorer.somnia.network/address/0xF9553A2eAF93e8cf63bB1BD7CdA942224E1Adb44) |

---

## 🦁 Sphinx Protocol — Trustless False Positive Resolution

False positives destroy trust in any security system. The **Sphinx Protocol** solves this with a four-step on-chain appeal mechanism:

1. A `CRITICAL` audit is recorded on-chain and Discord + Telegram alerts fire immediately
2. The protocol team opens the Sphinx tab and writes a defense argument
3. The argument is submitted to `inferString()` with `allowedValues: ["0"..."100"]` — Qwen3-30B scores its legitimacy through 3-validator consensus
4. **Score ≥ 75** → `SAFE OVERRIDE` · alert suppressed · audit reclassified on-chain  
   **Score < 75** → `CRITICAL CONFIRMED` · Discord and Telegram fire again

No human moderator. No DAO vote. Pure on-chain LLM judgment — verifiable and immutable.

---

## 🏅 Tamagotchi Guardian — Living NFT Certificates

SomniaWatch issues ERC-721 NFT certificates to contracts that maintain clean security records. Unlike static badges, these are **living guardians** powered by Somnia's inference agent:

| Tier | Requirement | Signal |
|---|---|---|
| 🥉 Bronze | 1+ consecutive SAFE audits | Monitored & passing |
| 🥈 Silver | 5+ consecutive SAFE audits | Trusted by guardian |
| 🥇 Gold | 10+ consecutive SAFE audits | Elite security record |

- Every NFT has a **Speak** button → calls `inferString()` live → Qwen3-30B generates a status report
- Each speech produces a **verifiable on-chain receipt ID**
- Guardian health degrades on any `CRITICAL` — security compliance as a gamified social signal

---

## ⚡ Product Features

| Feature | Description |
|---|---|
| 🤖 Autonomous Keeper | GitHub Actions + Vercel Cron run the pipeline 24/7 with zero human intervention |
| 💥 Attack Simulator | One-click `batchWithdraw()` reentrancy attack on live MockVault — real detection proof |
| 🔔 Alert Log | Live feed of every classified finding with TX hash, risk type, and timestamp |
| 🔍 Threat Intel | On-chain heuristic risk signals — caller frequency, method patterns, value anomalies |
| 🤖 Agent Explorer | Every agent call logged with receipt ID, STT cost, consensus status, and timestamp |
| 🧪 Agent Playground | Call any Somnia agent live from the UI with real contract data |
| 🦁 Sphinx Protocol | Trustless on-chain challenge layer for disputed CRITICAL findings |
| 🏅 NFT Certificates | Bronze → Silver → Gold ERC-721 certificates based on consecutive SAFE audit streaks |
| 🏆 Leaderboard | Ranks monitored contracts by consecutive SAFE streak — social proof for security |

---

## 🎬 Live Demo

A judge can verify SomniaWatch in under 5 minutes:

1. Open [somniawatch-eight.vercel.app](https://somniawatch-eight.vercel.app)
2. Connect wallet on **Somnia Shannon Testnet** (Chain ID: 50312)
3. Click **💥 Simulate Attack** on the Dashboard
4. Watch the contract move to `CRITICAL` in the Alert Log
5. Inspect the TX hash on Shannon Explorer
6. Open **Agent Explorer** to see receipt IDs and pipeline cost breakdown
7. Open **Certificates** to see the living NFT guardian and its on-chain speech

---

## 💼 Real-World Use Cases

### DeFi Protocol Security
A lending protocol registers its vault with SomniaWatch. Every cycle, the 3-agent pipeline audits transaction patterns. When a flash loan attack begins, the JSON API Agent detects unusual withdrawal frequency, the Parse Agent confirms a new caller, and the LLM classifies `CRITICAL` before the second transaction in the attack sequence. Discord fires. Team pauses deposits in 3 minutes.

### Pre-Launch Certification
A new DEX runs SomniaWatch for 30 days before launch. After 10 consecutive SAFE audits, their contract earns a Gold NFT Certificate — publicly verifiable on-chain proof of sustained security. Displayed in their app UI and documentation as a trust signal.

### DAO Treasury Monitoring
A Somnia DAO registers its multisig treasury. Unusual spending triggers `CRITICAL`. The security committee uses the Sphinx Protocol to challenge false positives — writing an on-chain defense that the LLM Judge verifies before suppressing the alert.

### Developer Audit Simulation
A developer deploys a new contract and uses the Attack Simulator to test detection sensitivity. They simulate reentrancy attacks and watch the 3-agent pipeline classify them in real-time — confirming detection before mainnet.

---

## 🏗️ Architecture

```
Contract Activity
     │
     ▼
fetchString()   →  runtime signals (TX patterns, callers, methods)
     │
     ▼
parseWebsite()  →  explorer-context signals (HTML → Markdown → LLM)
     │
     ▼
inferString()   →  SAFE / SUSPICIOUS / CRITICAL  (Qwen3-30B)
     │
     ▼
On-chain receipt + Discord/Telegram alert + UI update + certificate logic
```

---

## 🔧 Technical Stack

| Layer | Technology |
|---|---|
| Blockchain | Somnia Shannon Testnet · Chain ID 50312 · `dream-rpc.somnia.network` |
| Smart Contracts | Solidity 0.8.20 + Hardhat · 3 deployed contracts |
| AI Agents | Somnia `fetchString()` + `parseWebsite()` + `inferString()` |
| LLM Model | Qwen3-30B via Somnia Inference Agent · `allowedValues` constraint |
| Frontend | React 18 + Vite + ethers.js v6 · 8 production UI tabs |
| Deployment | Vercel · frontend + serverless API routes |
| Automation | Vercel Cron + GitHub Actions · dual keeper mechanism |
| Alerts | Discord Webhooks + Telegram Bot API · < 5 min response |
| NFT Standard | ERC-721 · AuditCertificate.sol · on-chain SVG metadata |

---

## 🚀 Market Vision

SomniaWatch is the foundation for an **agent-native security product** for the next generation of on-chain applications:

- **Protocol Security Subscriptions** — continuous 24/7 monitoring for DeFi vaults and core contracts
- **Pre-Launch Trust Certification** — Gold NFT certificates as verifiable security signals
- **DAO Treasury Protection** — autonomous spending pattern monitoring with challenge resolution
- **Monitoring APIs** — risk intelligence layer for wallets, explorers, and launchpads
- **Ecosystem Security Layer** — trust infrastructure built natively into the Somnia network

In a market where security is still reactive and centralized, SomniaWatch points toward **continuous, autonomous, on-chain security intelligence** — the natural evolution of smart contract security on Agentic L1.

---

## 🌐 Why Somnia

SomniaWatch is only possible because Somnia provides an **agent-native environment** where:

- Data retrieval (`fetchString`) composes with parsing (`parseWebsite`) and inference (`inferString`)
- Every agent call runs through 3-validator consensus — trustless by default
- On-chain receipts make every AI decision verifiable and immutable
- The platform eliminates the gap between off-chain AI and on-chain action

SomniaWatch is not using Somnia as a database. It is using Somnia as an **agentic reasoning layer** — the way the platform was designed to be used.

---

## 📁 Repository Structure

```
contracts/              Solidity contracts (SomniaWatch, MockVault, AuditCertificate)
frontend/               React + Vite frontend (8 production tabs)
api/                    Vercel serverless endpoints
scripts/                Deployment and automation scripts
.github/workflows/      GitHub Actions keeper automation
```

---

## 💻 Local Setup

```bash
# 1. Clone
git clone https://github.com/gopichandchalla16/somniawatch.git
cd somniawatch

# 2. Install dependencies
npm install
cd frontend && npm install && cd ..

# 3. Configure environment
cp .env.example .env
# Add: PRIVATE_KEY, SOMNIA_RPC, DISCORD_WEBHOOK, TELEGRAM_TOKEN, TELEGRAM_CHAT_ID

# 4. Deploy contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network somnia

# 5. Run frontend
cd frontend && npm run dev

# 6. Test keeper
node scripts/keeper-standalone.js
```

---

## 👨‍💻 Built By

**Gopichand Challa** · Solo Submission · Somnia Agentathon 2026

- X / Twitter: [@GopichandAI](https://x.com/GopichandAI)
- GitHub: [@gopichandchalla16](https://github.com/gopichandchalla16)
- Live: [somniawatch-eight.vercel.app](https://somniawatch-eight.vercel.app)

---

*SomniaWatch — Watch. Reason. Act. Autonomously.*
