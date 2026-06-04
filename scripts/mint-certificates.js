#!/usr/bin/env node
// scripts/mint-certificates.js
// Reads audit history for registered contracts, mints NFT certificates for eligible ones.
// Run after 3+ consecutive SAFE audits to get a real Bronze cert on-chain.
// Usage: node scripts/mint-certificates.js

require('dotenv').config();
const { ethers } = require('ethers');

const WATCH_ABI = [
  'function getAllRegistered() external view returns (address[])',
  'function getAuditHistory(address target) external view returns (tuple(address target, uint8 riskLevel, string riskType, string reasoning, uint256 timestamp, uint256 receiptId, bool autoActioned)[])',
  'function registry(address) external view returns (address owner, bool isRegistered, bool isFlagged, uint8 riskScore, uint256 lastChecked, uint256 totalChecks, string lastRiskType, uint256 consecutiveSafe)',
  'function auditCertificate() external view returns (address)',
];

const CERT_ABI = [
  'function contractToToken(address) external view returns (uint256)',
  'function hasCertificate(address) external view returns (bool)',
  'function getCertificate(address) external view returns (tuple(address contractAddress, address owner, uint8 level, uint256 consecutiveSafe, uint256 issuedAt, uint256 lastAuditReceipt, bool isRevoked))',
  'function mintCertificate(address contractAddr, address owner, uint256 consecutiveSafe, uint256 agentReceipt) external returns (uint256)',
  'function nextTokenId() external view returns (uint256)',
];

const EXPLORER = 'https://shannon-explorer.somnia.network';
const LEVELS = ['BRONZE 🥉', 'SILVER 🥈', 'GOLD 🥇'];

function getLevel(consecutiveSafe) {
  if (consecutiveSafe >= 15) return 2;
  if (consecutiveSafe >= 7)  return 1;
  return 0;
}

async function main() {
  const PRIVATE_KEY   = process.env.PRIVATE_KEY;
  const RPC_URL       = process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network';
  const WATCH_ADDRESS = process.env.SOMNIAWATCH_ADDRESS;

  if (!PRIVATE_KEY || !WATCH_ADDRESS) {
    console.error('❌ Missing PRIVATE_KEY or SOMNIAWATCH_ADDRESS in .env');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
  const watch    = new ethers.Contract(WATCH_ADDRESS, WATCH_ABI, signer);

  console.log('\n🏅 SomniaWatch Certificate Minter');
  console.log(`📜 Contract: ${WATCH_ADDRESS}\n`);

  const certAddress = await watch.auditCertificate();
  if (!certAddress || certAddress === ethers.ZeroAddress) {
    console.error('❌ AuditCertificate address not set in SomniaWatch. Run setAuditCertificate() first.');
    process.exit(1);
  }
  console.log(`🏅 AuditCertificate: ${certAddress}`);

  const cert     = new ethers.Contract(certAddress, CERT_ABI, signer);
  const registered = await watch.getAllRegistered();
  console.log(`📋 Registered contracts: ${registered.length}\n`);

  for (const target of registered) {
    console.log(`\n🔍 Checking: ${target}`);
    const profile = await watch.registry(target);
    const consecutive = Number(profile.consecutiveSafe);
    console.log(`   Consecutive SAFE audits: ${consecutive}`);

    if (consecutive < 3) {
      console.log(`   ⏩ Not eligible yet (need 3+ SAFE). Current: ${consecutive}`);
      continue;
    }

    const hasCert = await cert.hasCertificate(target);
    const level   = getLevel(consecutive);
    console.log(`   Eligible for: ${LEVELS[level]} (${consecutive} safe audits)`);

    if (!hasCert) {
      console.log(`   🏅 Minting new certificate...`);
      const history = await watch.getAuditHistory(target);
      const lastSafe = history.filter(h => Number(h.riskLevel) === 0).pop();
      const receiptId = lastSafe ? lastSafe.receiptId : 0;

      const tx = await cert.mintCertificate(target, profile.owner, consecutive, receiptId);
      const receipt = await tx.wait();
      const tokenId = await cert.contractToToken(target);

      console.log(`   ✅ Minted! Token ID: ${tokenId}`);
      console.log(`   🔗 TX: ${EXPLORER}/tx/${tx.hash}`);
      console.log(`   🔗 Contract: ${EXPLORER}/address/${certAddress}`);
    } else {
      const existing = await cert.getCertificate(target);
      const existingLevel = Number(existing.level);
      if (level > existingLevel) {
        console.log(`   ⬆️  Certificate upgrade available: ${LEVELS[existingLevel]} → ${LEVELS[level]}`);
        console.log(`   ℹ️  Upgrade is handled automatically by SomniaWatch on next SAFE audit.`);
      } else {
        console.log(`   ✅ Certificate already at ${LEVELS[existingLevel]} level. Nothing to do.`);
      }
    }
  }

  console.log('\n✅ Done.');
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
