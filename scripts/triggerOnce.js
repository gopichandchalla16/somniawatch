// scripts/triggerOnce.js
// Manually trigger one monitoring cycle for a contract
// Usage: node scripts/triggerOnce.js [contractAddress]
// or:    node scripts/triggerOnce.js   (uses MOCK_VAULT_ADDRESS from .env)

require("dotenv").config();
const { ethers } = require("ethers");
const SomniaWatchABI = require("../frontend/src/abi/SomniaWatch.json");

const RPC      = process.env.SOMNIA_RPC || "https://dream-rpc.somnia.network";
const PK       = process.env.PRIVATE_KEY;
const WATCH    = process.env.SOMNIAWATCH_ADDRESS;
const EXPLORER = "https://shannon-explorer.somnia.network";
const TARGET   = process.argv[2] || process.env.MOCK_VAULT_ADDRESS;

async function main() {
  if (!PK)     throw new Error("PRIVATE_KEY missing from .env");
  if (!WATCH)  throw new Error("SOMNIAWATCH_ADDRESS missing from .env");
  if (!TARGET) throw new Error("Provide target address: node scripts/triggerOnce.js 0x...");
  if (!ethers.isAddress(TARGET)) throw new Error(`Invalid address: ${TARGET}`);

  console.log("\n🎯 SomniaWatch — Manual Trigger");
  console.log(`   Target:   ${TARGET}`);
  console.log(`   Contract: ${WATCH}`);
  console.log(`   Explorer: ${EXPLORER}\n`);

  const provider = new ethers.JsonRpcProvider(RPC);
  const signer   = new ethers.Wallet(
    PK.startsWith("0x") ? PK : `0x${PK}`,
    provider
  );
  const watch = new ethers.Contract(WATCH, SomniaWatchABI, signer);

  // Verify target is registered
  const profile = await watch.registry(TARGET);
  if (!profile.isRegistered) {
    throw new Error(`Contract ${TARGET} is not registered. Call registerContract() first.`);
  }

  // Get deposit amount
  const deposit = await watch.depositForJson();
  console.log(`   Deposit needed: ${ethers.formatEther(deposit)} STT`);

  // Set up event listeners for live feedback
  const timeout = setTimeout(() => {
    console.log("\n⏰ Timeout: Agent may still be processing. Check explorer.");
    process.exit(0);
  }, 5 * 60 * 1000);

  watch.on("MonitorTriggered", (target, requestId) => {
    if (target.toLowerCase() === TARGET.toLowerCase()) {
      console.log(`\n✓ Monitor triggered`);
      console.log(`  Request ID: ${requestId.toString()}`);
    }
  });

  watch.on("TxDataReceived", (target, jsonId, llmId) => {
    if (target.toLowerCase() === TARGET.toLowerCase()) {
      console.log(`✓ Tx data received → LLM request sent (${llmId.toString().slice(0, 12)}...)`);
    }
  });

  watch.on("RiskClassified", (target, riskLevel, riskType, receiptId) => {
    if (target.toLowerCase() === TARGET.toLowerCase()) {
      const labels = ["✅ SAFE", "⚠️  SUSPICIOUS", "🔴 CRITICAL"];
      clearTimeout(timeout);
      console.log(`\n╔══════════════════════════════════════════╗`);
      console.log(`║      CLASSIFICATION RESULT               ║`);
      console.log(`╠══════════════════════════════════════════╣`);
      console.log(`║  Risk:    ${labels[Number(riskLevel)]}`);
      console.log(`║  Type:    ${riskType}`);
      console.log(`║  Receipt: ${receiptId.toString()}`);
      console.log(`║  Proof:   ${EXPLORER}/tx/${receiptId.toString()}`);
      console.log(`╚══════════════════════════════════════════╝\n`);
      process.exit(0);
    }
  });

  watch.on("ContractFlagged", (target, riskType, receiptId) => {
    if (target.toLowerCase() === TARGET.toLowerCase()) {
      console.log(`\n🚨 CONTRACT AUTO-FLAGGED: ${riskType}`);
      console.log(`   Receipt: ${receiptId.toString()}`);
    }
  });

  // Trigger the monitoring cycle
  console.log("\nSending triggerMonitor()...");
  const tx = await watch.triggerMonitor(TARGET, {
    value:    deposit,
    gasLimit: 600_000,
  });
  console.log(`Transaction sent: ${tx.hash}`);
  console.log(`Explorer: ${EXPLORER}/tx/${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`\n✓ Confirmed in block ${receipt.blockNumber}`);
  console.log(`  Waiting for agent consensus (may take 1-3 minutes)...\n`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
