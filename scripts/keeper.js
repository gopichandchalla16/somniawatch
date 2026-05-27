// scripts/keeper.js
// Autonomous monitoring keeper — triggers SomniaWatch every 5 minutes
// Run: npm run keeper  OR  node scripts/keeper.js

require("dotenv").config();
const { ethers } = require("ethers");
const SomniaWatchABI = require("../frontend/src/abi/SomniaWatch.json");

// ── Config ────────────────────────────────────────────────────────────
const RPC      = process.env.SOMNIA_RPC || "https://dream-rpc.somnia.network";
const PK       = process.env.PRIVATE_KEY;
const WATCH    = process.env.SOMNIAWATCH_ADDRESS;
const EXPLORER = "https://shannon-explorer.somnia.network";
const INTERVAL = 5 * 60 * 1000; // 5 minutes
const MIN_GAP  = 295;            // 295s buffer (contract requires 300s / 5 min)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ts    = ()   => new Date().toISOString().slice(11, 19);
const short = (a)  => `${a.slice(0, 10)}...${a.slice(-4)}`;

// ── Validation ────────────────────────────────────────────────────────
if (!PK) {
  console.error("❌ PRIVATE_KEY missing from .env");
  process.exit(1);
}
if (!WATCH) {
  console.error("❌ SOMNIAWATCH_ADDRESS missing from .env");
  console.error("   Run: npm run deploy  first");
  process.exit(1);
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const signer   = new ethers.Wallet(
    PK.startsWith("0x") ? PK : `0x${PK}`,
    provider
  );
  const watch    = new ethers.Contract(WATCH, SomniaWatchABI, signer);

  const walletBal = await provider.getBalance(signer.address);

  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log("║     SomniaWatch Keeper — AUTONOMOUS MODE          ║");
  console.log("╠════════════════════════════════════════════════════╣");
  console.log(`║  Wallet:    ${signer.address}`);
  console.log(`║  Balance:   ${ethers.formatEther(walletBal)} STT`);
  console.log(`║  Contract:  ${WATCH}`);
  console.log(`║  Interval:  every 5 minutes`);
  console.log(`║  Explorer:  ${EXPLORER}`);
  console.log("╚════════════════════════════════════════════════════╝\n");

  // ── Event Listeners ───────────────────────────────────────────────
  watch.on("ContractFlagged", (target, riskType, receiptId) => {
    console.log(`\n🚨 ════════ CRITICAL ALERT ════════ 🚨`);
    console.log(`   Contract:  ${target}`);
    console.log(`   Risk Type: ${riskType}`);
    console.log(`   Receipt:   ${receiptId.toString()}`);
    console.log(`   Proof:     ${EXPLORER}/tx/${receiptId.toString()}`);
    console.log(`══════════════════════════════════════\n`);
  });

  watch.on("RiskClassified", (target, riskLevel, riskType, receiptId) => {
    const icons  = ["✅", "⚠️ ", "🔴"];
    const labels = ["SAFE", "SUSPICIOUS", "CRITICAL"];
    const level  = Number(riskLevel);
    console.log(
      `[${ts()}] ${icons[level]} ${labels[level].padEnd(10)} | ${riskType.padEnd(20)} | ${short(target)} | receipt: ${receiptId.toString().slice(0, 10)}...`
    );
  });

  watch.on("MonitorTriggered", (target, requestId, deposit) => {
    console.log(
      `[${ts()}] 🔄 Agent request sent for ${short(target)} | deposit: ${ethers.formatEther(deposit)} STT`
    );
  });

  watch.on("TxDataReceived", (target, jsonId, llmId) => {
    console.log(
      `[${ts()}] 📊 Tx data received → LLM request ${llmId.toString().slice(0, 10)}... sent`
    );
  });

  watch.on("AgentCallFailed", (target, requestId, reason) => {
    console.warn(
      `[${ts()}] ⚠️  Agent call failed for ${short(target)}: ${reason}`
    );
  });

  // ── Main Cycle ────────────────────────────────────────────────────
  async function runCycle() {
    console.log(`\n[${ts()}] ─── Keeper cycle starting ───`);

    try {
      const contracts = await watch.getAllRegistered();
      console.log(`[${ts()}]     Registered contracts: ${contracts.length}`);

      if (contracts.length === 0) {
        console.log(`[${ts()}]     No contracts registered yet.`);
        return;
      }

      // Check contract SOMI balance
      const contractBal = await watch.contractBalance();
      const cycleCost   = await watch.depositForFullCycle();

      console.log(`[${ts()}]     Contract balance: ${ethers.formatEther(contractBal)} STT`);
      console.log(`[${ts()}]     Cost per cycle:   ${ethers.formatEther(cycleCost)} STT`);

      if (contractBal < cycleCost) {
        console.warn(`[${ts()}]     ⚠️  Insufficient balance for monitoring.`);
        console.warn(`[${ts()}]     ⚠️  Fund the contract: call fund() or send STT to ${WATCH}`);
        return;
      }

      const now = Math.floor(Date.now() / 1000);

      for (const addr of contracts) {
        try {
          const profile    = await watch.registry(addr);
          const lastCheck  = Number(profile.lastChecked);
          const timeSince  = lastCheck > 0 ? now - lastCheck : Infinity;

          if (timeSince < MIN_GAP) {
            console.log(`[${ts()}]     ⏭  ${short(addr)} — checked ${timeSince}s ago, skipping`);
            continue;
          }

          console.log(`[${ts()}]     ▶  Triggering monitor for ${short(addr)}...`);

          const deposit = await watch.depositForJson();
          const tx      = await watch.triggerMonitor(addr, {
            value:    deposit,
            gasLimit: 600_000,
          });
          const receipt = await tx.wait();
          console.log(`[${ts()}]     ✓  Triggered — tx: ${receipt.hash}`);

          await sleep(2000);
        } catch (err) {
          console.error(`[${ts()}]     ✗  Error for ${short(addr)}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error(`[${ts()}]     Cycle error: ${err.message}`);
    }

    console.log(`[${ts()}] ─── Cycle complete. Next in 5 min ───\n`);
  }

  // Run immediately, then every 5 minutes
  await runCycle();
  setInterval(runCycle, INTERVAL);
}

main().catch((err) => {
  console.error("Fatal keeper error:", err);
  process.exit(1);
});
