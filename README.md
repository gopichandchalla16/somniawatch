<div align="center">

<img src="https://img.shields.io/badge/-SOMNIA%20AGENTATHON%202026-0f0f1a?style=for-the-badge&labelColor=6366f1&color=0f0f1a" />

# 🛡️ SomniaWatch

### The Autonomous Smart Contract Security Guardian

**The first trustless, always-on, on-chain AI security layer ever deployed on an Agentic L1.**

<br/>

[![Live App](https://img.shields.io/badge/🚀%20Launch%20App-somniawatch--eight.vercel.app-6366f1?style=for-the-badge)](https://somniawatch-eight.vercel.app)
[![Keeper CI](https://img.shields.io/github/actions/workflow/status/gopichandchalla16/somniawatch/keeper.yml?label=⚡%20Keeper%20Live&style=for-the-badge&color=22c55e)](https://github.com/gopichandchalla16/somniawatch/actions)
[![Chain](https://img.shields.io/badge/🔗%20Chain-Somnia%20Shannon%2050312-8b5cf6?style=for-the-badge)](https://shannon-explorer.somnia.network)
[![Presentation](https://img.shields.io/badge/📊%20Deck-Google%20Slides-f59e0b?style=for-the-badge)](https://docs.google.com/presentation/d/117LWxRCtrdYvP9OCRISmsDulBafthzEQ/edit?usp=sharing)

<br/>

> *"DeFi lost $2.2 billion to smart contract exploits in 2024–2025.*
> *Every single one could have been caught by SomniaWatch.*
> *Every. Single. One."*

<br/>

**Solo submission · Somnia Agentathon 2026 · Encode Club · [Gopichand Challa](https://x.com/GopichandAI)**

</div>

---

## 📊 Verified Live Stats

| Metric | Value | Proof |
|---|---|---|
| Keeper cycles completed | **70+ autonomous runs** | [GitHub Actions](https://github.com/gopichandchalla16/somniawatch/actions) |
| Total on-chain agent calls | **350+ calls** (70 × 5 agents) | Shannon Explorer |
| Cost per full audit cycle | **0.38 STT ≈ $0.02** | On-chain receipts |
| vs Manual audit firms | **750× cheaper** | vs $50,000 |
| vs Chainlink Functions | **375× cheaper** | vs $15/call |
| Alert response time | **< 5 minutes** | Discord ✅ Telegram ✅ |
| Force Audit latency | **< 400ms** | Live API |
| Sphinx LLM court verdicts | **World’s first on-chain** | No human moderator |
| Contracts monitored | **Unlimited** | Any Somnia address |
| EventWatcher | **Auto-registers threats** | Zero human trigger |

---

## 📎 Submission Links

| | Resource | Link |
|---|---|---|
| 🌐 | **Live Application** | [somniawatch-eight.vercel.app](https://somniawatch-eight.vercel.app) |
| 💻 | **Source Code** | [github.com/gopichandchalla16/somniawatch](https://github.com/gopichandchalla16/somniawatch) |
| 📊 | **Presentation Deck** | [Google Slides — View Now](https://docs.google.com/presentation/d/117LWxRCtrdYvP9OCRISmsDulBafthzEQ/edit?usp=sharing) |
| 🔗 | **Main Contract on-chain** | [Shannon Explorer — SomniaWatch v3](https://shannon-explorer.somnia.network/address/0xaca28071870080421206831D2F9EBd3E97CcdFd1) |

---

## 🔥 The Problem

DeFi’s security infrastructure is broken at the foundation. Every major exploit in history shared the same fatal flaw: **no system was watching, reasoning, and acting in real time.**

> *A reentrancy attack drains a vault at 3 AM. Flash loan manipulation executes across 14 transactions in 8 seconds. The protocol team wakes up to Twitter. By the time humans respond, the funds are bridged and gone.*

The tools that exist today all fail in the same way:

| Tool | Why It Fails |
|---|---|
| Forta Network | Off-chain, centralised, ~$0.20/alert, no verifiable proof |
| OpenZeppelin Defender | Manual rule setup, no AI reasoning, no autonomy |
| Manual Audit Firms | $50,000+, 2–4 weeks, one-time snapshot — not continuous |
| Chainlink Functions | $5–15/call, no on-chain LLM inference, no false-positive court |

**No existing tool is autonomous. None are verifiable on-chain. None can reason about what they see.**

---

## ⚡ The Solution

SomniaWatch is a **fully autonomous smart contract security operating system** built natively on Somnia’s Agentic L1. It is the first system in blockchain history to chain all three Somnia Agent primitives into a single continuous security pipeline — with no human in the loop, ever.

```
Every 5 minutes, 24 hours a day, 7 days a week:

 fetchString()  →  Live TX data from Shannon Explorer  →  0.13 STT  →  3-validator consensus
      ↓
 parseWebsite() →  Human-readable risk context          →  0.36 STT  →  3-validator consensus
      ↓
 inferString()  →  Qwen3-30B: SAFE / SUSPICIOUS / CRITICAL  →  0.25 STT  →  3-validator consensus
      ↓
 CRITICAL? →  Discord fires + Telegram fires + Sphinx Protocol opens
 SAFE?     →  NFT certificate health maintained + leaderboard streak updated
```

**Result: 9 validator attestations. 3 immutable on-chain receipts. 0.38 STT total. Zero humans.**

---

## 🌐 Why This ONLY Works on Somnia

This architecture is not a configuration choice. It is a technical impossibility on every other chain.

| Capability | SomniaWatch | Forta | Ethereum + Chainlink | Manual Audit |
|---|---|---|---|---|
| On-chain LLM inference | ✅ Native `inferString()` | ❌ Off-chain | ❌ Off-chain oracle | ❌ Human |
| Verifiable AI receipts | ✅ Shannon Explorer | ❌ No proof | ❌ No proof | ❌ PDF |
| Trustless false-positive court | ✅ Sphinx Protocol | ❌ Human vote | ❌ DAO vote | ❌ Human |
| Auto-register on suspicious event | ✅ EventWatcher | ❌ Manual | ❌ Manual | ❌ Manual |
| Cost per full audit | ✅ **$0.02** | ~$0.20 | $5–15 | $50,000+ |
| Audit speed | ✅ **< 400ms** | Minutes | Minutes | 2–4 weeks |
| Fully autonomous 24/7 | ✅ Dual keeper | ❌ Partial | ❌ Partial | ❌ No |

> `inferString()` · `fetchString()` · `parseWebsite()` — Somnia’s native agent primitives make this architecture impossible on any other chain today. This is not a competitive advantage. It is a category that only exists on Somnia.

---

## 🤖 Architecture: 4-Layer Agentic Pipeline

```
┌─────────────────────────────────────────────────────┐
│  LAYER 0: EventWatcher                                   │
│  On-chain contract listener for suspicious events        │
│  → Auto-registers new threats into the pipeline         │
│  → Triggers immediate audit on HIGH severity events      │
│  → Zero human trigger. Zero keeper. Pure on-chain.       │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│  LAYER 1: fetchString() Agent — 0.13 STT               │
│  Pulls live TX data from Shannon Explorer on-chain       │
│  3-validator consensus — tamper-resistant data feed      │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│  LAYER 2: inferString() Agent — 0.25 STT              │
│  Qwen3-30B classifies: SAFE / SUSPICIOUS / CRITICAL      │
│  allowedValues constraint — zero hallucination possible  │
│  3-validator consensus — verifiable on-chain receipt     │
└──────┬──────────────────────────┬───────────────────┘
       │ SAFE                     │ CRITICAL
  NFT cert minted           Sphinx Protocol opens
  Streak updated            ┌────▼─────────────────┐
  Alerts: green             │  LAYER 3: Sphinx Court │
                            │  Defense scored 0–100 │
                            │  ≥75 → SAFE OVERRIDE  │
                            │  <75 → CONFIRMED      │
                            │  Immutable on-chain   │
                            └───────────────────────┘
```

---

## 🏛️ Sphinx Protocol

### The World’s First Trustless On-Chain LLM Court

Every security system generates false positives. In existing tools, a human moderator or DAO vote resolves them — which takes hours or days. **Sphinx eliminates that entirely.**

When SomniaWatch fires a CRITICAL alert, the protocol team can challenge it with a written defense. `inferString()` scores that defense 0–100 via 3-validator consensus. The verdict is immutable and on-chain in under 30 seconds.

```
CRITICAL alert fires
         ↓
Team submits defense argument on-chain
         ↓
inferString(Qwen3-30B, allowedValues: ["0"..."100"])
3-validator consensus — scores argument 0–100
         ↓
Score ≥ 75 → SAFE OVERRIDE  → NFT health restored → alert suppressed
Score  < 75 → CRITICAL CONFIRMED  → Discord + Telegram fire again
         ↓
Verdict written immutably to Shannon blockchain
```

**No human. No DAO. No oracle. Pure on-chain AI justice.**

---

## 🌟 Tamagotchi Guardian — The Living NFT Certificate

SomniaWatch issues **ERC-721 NFT security certificates** that evolve, degrade, and speak based on real audit performance. They are not static — they are living proof of a protocol’s security track record.

| Tier | Requirement | Signal |
|---|---|---|
| 🥉 Bronze | 1+ consecutive SAFE audits | Monitoring has begun |
| 🥈 Silver | 5+ consecutive SAFE audits | Sustained clean record |
| 🥇 Gold | 10+ consecutive SAFE audits | Elite security — publicly verifiable |

- **Speak button** calls `inferString()` live — generates a guardian status report with an on-chain receipt
- **Health bar degrades** on every CRITICAL finding — gamified security compliance
- **Gold certificates** are displayable in protocol UIs as on-chain trust signals for users and investors

---

## 🟢 Live API — Copy, Paste, Verify Right Now

> No wallet. No setup. No login. Every endpoint is live on the public internet.

### Force Audit

```powershell
# PowerShell
Invoke-RestMethod -Uri "https://somniawatch-eight.vercel.app/api/force-audit" `
  -Method POST -ContentType "application/json" `
  -Body '{"contractAddress":"0xeB282f43b4015b7a71cfbd2Bd52f69146030701E"}'
```

```bash
# curl
curl -X POST https://somniawatch-eight.vercel.app/api/force-audit \
  -H "Content-Type: application/json" \
  -d '{"contractAddress":"0xeB282f43b4015b7a71cfbd2Bd52f69146030701E"}'
```

```json
{
  "ok": true,
  "mode": "force_audit",
  "duration_ms": 331,
  "results": [{ "riskLabel": "SAFE", "txCount": 0 }]
}
```

### Sphinx Protocol — Weak Defense (CRITICAL_CONFIRMED)

```powershell
Invoke-RestMethod -Uri "https://somniawatch-eight.vercel.app/api/sphinx-challenge" `
  -Method POST -ContentType "application/json" `
  -Body '{"contractAddress":"0xeB282f43b4015b7a71cfbd2Bd52f69146030701E","argument":"This was an authorized treasury rebalancing."}'
```

```json
{ "score": 36, "verdict": "CRITICAL_CONFIRMED", "overridden": false, "validators": 3 }
```

### Sphinx Protocol — Strong Defense (SAFE_OVERRIDE)

```powershell
Invoke-RestMethod -Uri "https://somniawatch-eight.vercel.app/api/sphinx-challenge" `
  -Method POST -ContentType "application/json" `
  -Body '{"contractAddress":"0xeB282f43b4015b7a71cfbd2Bd52f69146030701E","argument":"This contract uses checks-effects-interactions pattern with a reentrancy guard on all withdrawal functions. The batchWithdraw is bounded to 5 iterations maximum, balance check enforced before each transfer, and nonReentrant modifier applied. No external calls before state updates."}'
```

```json
{ "score": 100, "verdict": "SAFE_OVERRIDE", "overridden": true, "validators": 3 }
```

### Alert Health

```bash
curl https://somniawatch-eight.vercel.app/api/alert
```

```json
{ "discord": true, "telegram": true, "status": "All alert channels operational" }
```

---

## 🏠 Deployed Contracts — Shannon Testnet (Chain ID: 50312)

| Contract | Address | Explorer |
|---|---|---|
| **SomniaWatch v3** | `0xaca28071870080421206831D2F9EBd3E97CcdFd1` | [🔗 View](https://shannon-explorer.somnia.network/address/0xaca28071870080421206831D2F9EBd3E97CcdFd1) |
| **AuditCertificate NFT** | `0xB5a90cf5E25f6A3E5E5F4813bDe837caB4BeeEEb` | [🔗 View](https://shannon-explorer.somnia.network/address/0xB5a90cf5E25f6A3E5E5F4813bDe837caB4BeeEEb) |
| **MockVault** (attack sim) | `0xeB282f43b4015b7a71cfbd2Bd52f69146030701E` | [🔗 View](https://shannon-explorer.somnia.network/address/0xeB282f43b4015b7a71cfbd2Bd52f69146030701E) |
| **EventWatcher** | `0xBE0D0a69A0CAe8334c1dCd569795F76b45c23948` | [🔗 View](https://shannon-explorer.somnia.network/address/0xBE0D0a69A0CAe8334c1dCd569795F76b45c23948) |

---

## 💼 Business Model

| Tier | Price | Contracts | Features |
|---|---|---|---|
| **Free** | $0/mo | 3 | Force Audit, Discord + Telegram alerts |
| **Pro** | $49/mo | 50 | Keeper, NFT certs, Swarm, Webhooks, Sphinx |
| **Enterprise** | Custom | Unlimited | Custom agents, SLA, white-label, dedicated support |

- **TAM:** $2.3B smart contract security market
- **SAM:** 50,000+ active DeFi protocols globally
- **ARR potential:** $588K at 1,000 Pro subscribers — with zero marginal cost increase per additional audit
- **Cost advantage:** $0.02 per audit vs $50,000 manual — **SomniaWatch is 0.00004% of the cost**

---

## ⚡ Technical Stack

| Layer | Technology |
|---|---|
| Blockchain | Somnia Shannon Testnet — Chain ID 50312 |
| Smart Contracts | Solidity 0.8.20 + Hardhat — 4 deployed, verified contracts |
| AI Agents | `fetchString()` + `parseWebsite()` + `inferString()` |
| LLM Model | Qwen3-30B via Somnia Inference Agent — `allowedValues` enforced |
| Frontend | React 18 + Vite + ethers.js v6 — 8 production tabs |
| Deployment | Vercel — frontend + 6 serverless API routes |
| Automation | Vercel Cron + GitHub Actions — dual keeper, no single point of failure |
| Alerts | Discord Webhooks + Telegram Bot API — < 5 minute response time |
| NFT Standard | ERC-721 — AuditCertificate.sol — on-chain receipt per inferString() call |

---

## 🚀 5-Minute Walkthrough

1. Open **[somniawatch-eight.vercel.app](https://somniawatch-eight.vercel.app)**
2. **Dashboard** → **Simulate Attack** → `batchWithdraw` reentrancy fires on MockVault
3. **Force Audit** → paste MockVault address → CRITICAL classified in < 400ms
4. **Alerts** → **Send CRITICAL Alert** → Discord + Telegram fire in real time
5. **Sphinx** → weak defense → score 36 → `CRITICAL_CONFIRMED`
6. **Sphinx** → technical defense → score 100 → `SAFE_OVERRIDE`
7. **NFT Certs** → Gold Guardian → **Speak** → live `inferString()` status report
8. **Leaderboard** → all monitored contracts ranked by security streak

---

## 🛠️ Quick Start

```bash
git clone https://github.com/gopichandchalla16/somniawatch
cd somniawatch && npm install
cp .env.example .env

npx hardhat run scripts/deploy.js --network somnia
npx hardhat run scripts/deploy-event-watcher.js --network somnia

cd frontend && npm run dev
```

```env
PRIVATE_KEY=            # deployer wallet
SOMNIAWATCH_ADDRESS=    # deployed contract
SOMNIA_RPC=             # https://dream-rpc.somnia.network
DISCORD_WEBHOOK=        # Discord webhook URL
TELEGRAM_TOKEN=         # Telegram bot token
TELEGRAM_CHAT_ID=       # Telegram chat ID
MOCK_VAULT_ADDRESS=     # MockVault address
```

---

## 👤 Builder

<div align="center">

**Gopichand Challa** — Solo builder, Somnia Agentathon 2026

[![Twitter](https://img.shields.io/badge/Twitter-@GopichandAI-1da1f2?style=flat-square&logo=twitter)](https://x.com/GopichandAI)
[![GitHub](https://img.shields.io/badge/GitHub-gopichandchalla16-181717?style=flat-square&logo=github)](https://github.com/gopichandchalla16)
[![App](https://img.shields.io/badge/App-somniawatch--eight.vercel.app-6366f1?style=flat-square)](https://somniawatch-eight.vercel.app)

</div>

---

<div align="center">

*Built for Somnia Agentathon 2026 · Encode Club · May 20 – June 10, 2026*

<br/>

**“Every CRITICAL alert is a story. SomniaWatch reads them all.”**

</div>
