// scripts/deploy.js
// Deploys SomniaWatch + MockVault, funds, registers, and populates with txns
// Run: npm run deploy

require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PLATFORM = "0x5E5205CF39E766118C01636bED000A54D93163E6";

async function main() {
  // ── Validate environment ────────────────────────────────────────────
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY missing from .env");
  }

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║           SOMNIAWATCH DEPLOYMENT                ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Deployer: ${deployer.address}`);
  console.log(`║  Balance:  ${ethers.formatEther(balance)} STT`);
  console.log(`║  Platform: ${PLATFORM}`);
  console.log("╚══════════════════════════════════════════════════╝\n");

  if (parseFloat(ethers.formatEther(balance)) < 10) {
    console.warn("⚠️  Low balance. Need at least 10 STT. Get from testnet.somnia.network");
  }

  // ── 1. Deploy MockVault ─────────────────────────────────────────────
  console.log("1️⃣  Deploying MockVault...");
  const MockVault = await ethers.getContractFactory("MockVault");
  const vault = await MockVault.deploy();
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log(`   ✓ MockVault deployed: ${vaultAddr}\n`);

  // ── 2. Deploy SomniaWatch ───────────────────────────────────────────
  console.log("2️⃣  Deploying SomniaWatch...");
  const SomniaWatch = await ethers.getContractFactory("SomniaWatch");
  const watch = await SomniaWatch.deploy(PLATFORM, BigInt("12875401142070969085"));
  await watch.waitForDeployment();
  const watchAddr = await watch.getAddress();
  console.log(`   ✓ SomniaWatch deployed: ${watchAddr}\n`);

  // ── 3. Fund SomniaWatch with 8 STT ─────────────────────────────────
  console.log("3️⃣  Funding SomniaWatch with 8 STT...");
  const fundTx = await watch.fund({ value: ethers.parseEther("8") });
  await fundTx.wait();
  const contractBal = await watch.contractBalance();
  console.log(`   ✓ Contract balance: ${ethers.formatEther(contractBal)} STT`);
  console.log(`   ✓ Covers ~22 full monitoring cycles (0.36 SOMI each)\n`);

  // ── 4. Register MockVault ───────────────────────────────────────────
  console.log("4️⃣  Registering MockVault for monitoring...");
  const regTx = await watch.registerContract(vaultAddr);
  await regTx.wait();
  console.log(`   ✓ MockVault registered in SomniaWatch\n`);

  // ── 5. Populate MockVault with transaction history ──────────────────
  console.log("5️⃣  Populating MockVault with realistic transactions...");
  console.log("   (This creates the tx history SomniaWatch agents will analyze)\n");

  // 5 normal deposits
  for (let i = 1; i <= 5; i++) {
    const tx = await vault.deposit({ value: ethers.parseEther("0.02") });
    await tx.wait();
    console.log(`   deposit ${i}/5: 0.02 STT — tx: ${tx.hash.slice(0, 16)}...`);
    await sleep(600);
  }

  // 3 normal withdrawals
  for (let i = 1; i <= 3; i++) {
    const tx = await vault.withdraw(ethers.parseEther("0.01"));
    await tx.wait();
    console.log(`   withdraw ${i}/3: 0.01 STT — tx: ${tx.hash.slice(0, 16)}...`);
    await sleep(600);
  }

  // 2 rapid small deposits (frequency pattern)
  for (let i = 1; i <= 2; i++) {
    const tx = await vault.deposit({ value: ethers.parseEther("0.001") });
    await tx.wait();
    console.log(`   rapid deposit ${i}/2: 0.001 STT — tx: ${tx.hash.slice(0, 16)}...`);
    await sleep(300);
  }

  // 1 batch withdraw — creates suspicious reentrancy-like pattern
  try {
    const batchTx = await vault.batchWithdraw(
      ethers.parseEther("0.001"),
      3
    );
    await batchTx.wait();
    console.log(`   batchWithdraw ×3 — tx: ${batchTx.hash.slice(0, 16)}...`);
  } catch (e) {
    console.log("   batchWithdraw skipped (insufficient balance)");
  }

  console.log(`\n   ✓ MockVault populated with ${10}+ transactions\n`);

  // ── 6. Save ABIs for frontend ───────────────────────────────────────
  console.log("6️⃣  Saving contract ABIs for frontend...");

  const abiDir = path.join(__dirname, "..", "frontend", "src", "abi");
  fs.mkdirSync(abiDir, { recursive: true });

  const swArtifact = require(
    path.join(__dirname, "..", "artifacts", "contracts", "SomniaWatch.sol", "SomniaWatch.json")
  );
  const mvArtifact = require(
    path.join(__dirname, "..", "artifacts", "contracts", "MockVault.sol", "MockVault.json")
  );

  fs.writeFileSync(
    path.join(abiDir, "SomniaWatch.json"),
    JSON.stringify(swArtifact.abi, null, 2)
  );
  fs.writeFileSync(
    path.join(abiDir, "MockVault.json"),
    JSON.stringify(mvArtifact.abi, null, 2)
  );
  console.log(`   ✓ ABIs saved to frontend/src/abi/\n`);

  // ── 7. Print summary ────────────────────────────────────────────────
  const finalBal = await watch.contractBalance();

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║           DEPLOYMENT COMPLETE ✓                     ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  SomniaWatch: ${watchAddr}`);
  console.log(`║  MockVault:   ${vaultAddr}`);
  console.log(`║  Balance:     ${ethers.formatEther(finalBal)} STT`);
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log("║  Explorer:                                           ║");
  console.log(`║  https://shannon-explorer.somnia.network/address/${watchAddr.slice(0,8)}...`);
  console.log("╚══════════════════════════════════════════════════════╝");

  console.log("\n📋 Add these to your .env:\n");
  console.log(`SOMNIAWATCH_ADDRESS=${watchAddr}`);
  console.log(`MOCK_VAULT_ADDRESS=${vaultAddr}`);

  console.log("\n📋 Add these to frontend/.env:\n");
  console.log(`VITE_SOMNIAWATCH_ADDRESS=${watchAddr}`);
  console.log(`VITE_MOCK_VAULT_ADDRESS=${vaultAddr}`);

  console.log("\n🚀 Next steps:");
  console.log("   1. Update both .env files with addresses above");
  console.log("   2. node scripts/keeper.js   ← start autonomous monitoring");
  console.log("   3. cd frontend && npm install && npm run dev");
  console.log("   4. Open http://localhost:5173\n");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
