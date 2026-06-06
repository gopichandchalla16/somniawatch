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
| 🎥 Demo Video | [YouTube Demo](https://www.youtube.com/watch?v=somniawatch-demo) |
| 📊 Presentation | [Google Slides](https://docs.google.com/presentation/d/1aB9s72xFDSyNdE_oMvt5QFXwrSRoagoT/edit?usp=drive_link&ouid=112248824595559643645&rtpof=true&sd=true) |
| 💻 Source Code | [github.com/gopichandchalla16/somniawatch](https://github.com/gopichandchalla16/somniawatch) |
| 🔍 Shannon Explorer | [shannon-explorer.somnia.network](https://shannon-explorer.somnia.network) |
| 🐦 X / Twitter | [@GopichandAI](https://x.com/GopichandAI) |

---

## 📜 Deployment History (Transparent)

> Judges: SomniaWatch was redeployed during development due to Solidity compilation fixes and platform interface updates. All addresses are documented below with full transparency.

| Version | Contract | Address | Status | Reason |
|---|---|---|---|---|
| v1 (initial) | SomniaWatch.sol | `0x21845ed6...` | ❌ Deprecated | Initial test deploy |
| v2 | SomniaWatch.sol | `0xd1e7EAC1aD0ad24eb444CbC9e9A143c570373ED0` | ❌ Deprecated | Fixed ResponseStatus compile error |
| **v3 (CURRENT)** | **SomniaWatch.sol** | **`0xaca28071870080421206831D2F9EBd3E97CcdFd1`** | **✅ LIVE** | **Removed platform.getRequestDeposit() call, hardcoded deposits** |
| permanent | MockVault.sol | `0xeB282f43b4015b7a71cfbd2Bd52f69146030701E` | ✅ LIVE | Attack simulator target |
| permanent | AuditCertificate.sol | `0xF9553A2eAF93e8cf63bB1BD7CdA942224E1Adb44` | ✅ LIVE | NFT certificates |

**Current live contract verified on Shannon Explorer:**
[🔗 View SomniaWatch v3 on Explorer](https://shannon-explorer.somnia.network/address/0xaca28071870080421206831D2F9EBd3E97CcdFd1)

---

## 🚨 The Problem

DeFi lost **$2.2 billion** to smart contract exploits in 2024–2025 alone. Every major attack shares the same fingerprint:

- 🕐 Attacks happen at **3 AM** — teams wake up to Twitter, not alerts
- ⚡ Funds are drained in **< 60 seconds** before anyone responds
- 🔗 Existing tools (Forta, OZ Defender) are **off-chain and centralized**
- 🤷 Manual audit firms review **code, not live runtime behavior**
- 📫 By the time humans respond, funds are **bridged and gone**

There is no autonomous, always-on, on-chain reasoning layer that watches contracts, thinks about what it sees, and acts — without waiting for a human.

---

## ✅ The Solution

SomniaWatch is a fully autonomous smart contract security guardian built natively on **Somnia’s Agentic L1**. It chains all three Somnia Agent types to fetch, reason, and classify contract risk every cycle, with no human in the loop.

When `CRITICAL` risk is detected:
- Real **Discord** and **Telegram** alerts fire immediately
- Every classification is recorded **immutably on-chain** with a verifiable receipt ID
- The system acts 24/7 — even when the developer’s machine is off

**Total cost per audit cycle: 0.38 STT · autonomous · immutable**

---

## 🤖 3-Agent Pipeline

SomniaWatch chains **all three Somnia agent types** in a live production security pipeline:

### Agent 1 — Watch · `fetchString()` · 0.13 STT
Fetches live TX data from Somnia Explorer API for the monitored contract.
- Extracts: TX count, method signatures, caller addresses, value flows
- 3-validator consensus before result is accepted

### Agent 2 — Reason · `inferString()` · 0.25 STT
Qwen3-30B classifies risk from the TX data:
- `allowedValues: ["safe", "suspicious", "critical"]` — eliminates hallucination
- Detects: reentrancy patterns, access violations, value anomalies, high-frequency bots
- 3-validator consensus → verifiable on-chain receipt ID

### Sphinx Protocol — `inferString()` as LLM Court
When a CRITICAL is disputed, Qwen3-30B scores the defense argument 0–100:
- Score ≥ 75 → `SAFE OVERRIDE` · reclassified on-chain
- Score < 75 → `CRITICAL CONFIRMED` · alerts fire again
- **No human moderator. Pure trustless AI judgment.**

---

## 🌍 Why This ONLY Works on Somnia

This section is critical. SomniaWatch is **structurally dependent** on Somnia — not cosmetically.

| Requirement | Why Somnia Only |
|---|---|
| **Trustless AI reasoning** | `inferString()` runs through 3-validator consensus. On Ethereum/Solana this requires a centralized oracle (Chainlink, API3) — single point of failure and trust. Somnia makes it native. |
| **Verifiable receipts** | Every agent call produces an on-chain receipt ID — a judge can verify any classification decision on Shannon Explorer. No other chain has this. |
| **Cost-viable at scale** | 0.38 STT per full audit cycle = ~$0.02 at scale. Ethereum equivalent with Chainlink Functions: $5–15 per call. SomniaWatch is economically viable only on Somnia. |
| **Sphinx Protocol** | The false-positive court requires trustless LLM judgment — not possible without native inference consensus. You cannot build this on Ethereum without a centralized judge. |
| **Composability** | Agent 1 output feeds Agent 2 directly inside a single on-chain pipeline. Cross-chain equivalents require bridges, latency, and trust assumptions. |

> **SomniaWatch is not a monitoring dashboard that happens to use Somnia. It is a security primitive that only exists because Somnia does.**

---

## 🦁 Sphinx Protocol — Trustless False Positive Resolution

False positives destroy trust in any security system. The **Sphinx Protocol** solves this:

1. `CRITICAL` audit recorded on-chain → Discord + Telegram alerts fire
2. Protocol team writes a defense argument in the Sphinx tab
3. Argument submitted to `inferString()` with `allowedValues: ["0"..."100"]`
4. Qwen3-30B scores legitimacy through 3-validator consensus
5. Score ≥ 75 → `SAFE OVERRIDE` · Score < 75 → `CRITICAL CONFIRMED`

**No human moderator. No DAO vote. On-chain LLM judgment — verifiable and immutable.**

> This is a new primitive. Not a feature. The first trustless AI court on any blockchain.

---

## 🏅 Tamagotchi Guardian — Living NFT Certificates

| Tier | Requirement | Signal |
|---|---|---|
| 🥉 Bronze | 1+ consecutive SAFE audits | Monitored & passing |
| 🥈 Silver | 5+ consecutive SAFE audits | Trusted by guardian |
| 🥇 Gold | 10+ consecutive SAFE audits | Elite security record |

- Every NFT has a **Speak** button → calls `inferString()` live → Qwen3-30B generates a status report
- Each speech produces a **verifiable on-chain receipt ID**
- Health degrades on `CRITICAL` — security compliance as a social signal

---

## ⚡ Product Features

| Feature | Description |
|---|---|
| 🤖 Autonomous Keeper | GitHub Actions triggers every 6 hours — 70+ runs logged |
| 💥 Attack Simulator | One-click reentrancy on live MockVault — real detection proof |
| 🔔 Real-Time Alerts | Discord + Telegram — individual alerts + 6-hour session reports |
| 🔍 Agent Explorer | Every agent call: receipt ID, STT cost, timestamp |
| 🧠 Force Audit Now | Judges can trigger an immediate single-cycle audit — no 6hr wait |
| 📝 Register Any Contract | Paste any Somnia testnet address and start monitoring instantly |
| 🦁 Sphinx Protocol | Trustless LLM court for disputed CRITICAL findings |
| 🏅 NFT Certificates | Bronze→Silver→Gold ERC-721 based on consecutive SAFE streaks |

---

## 🎬 Live Demo (5-Minute Judge Flow)

1. Open [somniawatch-eight.vercel.app](https://somniawatch-eight.vercel.app)
2. Click **📝 Register Any Contract** → paste any Somnia testnet address → monitoring starts instantly
3. Click **⚡ Force Audit Now** → watch the full AI pipeline execute in real time
4. Click **💥 Simulate Attack** → watch CRITICAL alert fire in < 30 seconds
5. Open **Agent Explorer** → see receipt IDs and pipeline cost breakdown
6. Check **Discord / Telegram** → 6-hour report already sent
7. Open Shannon Explorer → verify contract `0xaca28071870080421206831D2F9EBd3E97CcdFd1` is live

---

## 🏗️ Architecture

```
Contract Activity (Somnia Testnet)
     │
     ▼
[Keeper: GitHub Actions every 6h]
     │
     ▼
fetchString()   →  live TX data from Somnia Explorer (3-validator consensus)
     │
     ▼
inferString()   →  SAFE / SUSPICIOUS / CRITICAL  (Qwen3-30B, 3-validator consensus)
     │
     ▼
On-chain receipt + Discord alert + Telegram alert + NFT health update
     │
     ▼
[Sphinx Protocol: inferString() as trustless LLM court if CRITICAL disputed]
```

---

## 🔧 Technical Stack

| Layer | Technology |
|---|---|
| Blockchain | Somnia Shannon Testnet · Chain ID 50312 |
| Smart Contracts | Solidity 0.8.20 + Hardhat · 3 deployed contracts |
| AI Agents | Somnia `fetchString()` + `inferString()` + Sphinx `inferString()` |
| LLM Model | Qwen3-30B via Somnia Inference Agent · `allowedValues` constraint |
| Frontend | React 18 + Vite + ethers.js v6 · 8 production UI tabs |
| Deployment | Vercel · frontend + serverless API routes |
| Automation | GitHub Actions · keeper fires every 6 hours · 70+ runs |
| Alerts | Discord Webhooks + Telegram Bot API · individual + session reports |
| NFT Standard | ERC-721 · AuditCertificate.sol |

---

## 💼 Real-World Use Cases

### DeFi Protocol Security
A lending protocol registers its vault. When a flash loan attack begins, SomniaWatch detects unusual withdrawal frequency, classifies `CRITICAL`, Discord fires, team pauses deposits — before the second transaction.

### Pre-Launch Certification
A new DEX runs SomniaWatch for 30 days. After 10 consecutive SAFE audits, their contract earns a Gold NFT Certificate — publicly verifiable on-chain proof of sustained security.

### DAO Treasury Monitoring
A Somnia DAO registers its multisig. Unusual spending triggers `CRITICAL`. The Sphinx Protocol lets the committee challenge false positives — an on-chain defense scored by Qwen3-30B without any human moderator.

---

## 🚀 Market Vision

- **Protocol Security Subscriptions** — continuous 24/7 monitoring
- **Pre-Launch Trust Certification** — Gold NFT certificates as verifiable security signals
- **DAO Treasury Protection** — autonomous monitoring with challenge resolution
- **Ecosystem Security Layer** — trust infrastructure built into Somnia network

---

## 📁 Repository Structure

```
contracts/              Solidity contracts (SomniaWatch v3, MockVault, AuditCertificate)
frontend/               React + Vite frontend (8 production tabs)
api/                    Vercel serverless endpoints (keeper-cron, force-audit, register)
scripts/                Deployment, fund, register scripts
.github/workflows/      GitHub Actions keeper automation
```

---

## 💻 Local Setup

```bash
git clone https://github.com/gopichandchalla16/somniawatch.git
cd somniawatch
npm install
cd frontend && npm install && cd ..
cp .env.example .env
# Add: PRIVATE_KEY, SOMNIA_RPC, DISCORD_WEBHOOK, TELEGRAM_TOKEN, TELEGRAM_CHAT_ID
npx hardhat compile
npx hardhat run scripts/deploy.js --network somnia_testnet
cd frontend && npm run dev
```

---

## 👨‍💻 Built By

**Gopichand Challa** · Solo Submission · Somnia Agentathon 2026

- X / Twitter: [@GopichandAI](https://x.com/GopichandAI)
- GitHub: [@gopichandchalla16](https://github.com/gopichandchalla16)
- Live: [somniawatch-eight.vercel.app](https://somniawatch-eight.vercel.app)

---

*SomniaWatch — Watch. Reason. Act. Autonomously. Only on Somnia.*
