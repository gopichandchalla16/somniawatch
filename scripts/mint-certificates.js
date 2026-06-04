#!/usr/bin/env node
// scripts/mint-certificates.js
// Reads audit history from contract, counts consecutive SAFE audits,
// triggers mintCertificate() via SomniaWatch if threshold met.
// Run after 3+ SAFE cycles to get a real Bronze NFT on-chain.

const { ethers } = require('ethers');
require('dotenv').config();

const WATCH_ABI = [
  'function getAllRegistered() external view returns (address[])',
  'function getAuditHistory(address target) external view returns (tuple(address target, uint8 riskLevel, string riskType, string reasoning, uint256 timestamp, uint256 receiptId, bool autoActioned)[])',
  'function registry(address) external view returns (address owner, bool isRegistered, bool isFlagged, uint8 riskScore, uint256 lastChecked, uint256 totalChecks, string lastRiskType, uint256 consecutiveSafe)',
  'function auditCertificate() external view returns (address)',
];

const CERT_ABI = [
  'function mintCertificate(address contractAddr, address owner, uint256 consecutiveSafe, uint256 agentReceipt) external returns (uint256 tokenId)',
  'function contractToToken(address) external view returns (uint256)',
  'function hasCertificate(address) external view returns (bool)',
  'function getCertificate(address) external view returns (tuple(address contractAddress, address owner, uint8 level, uint256 consecutiveSafe, uint256 issuedAt, uint256 lastAuditReceipt, bool isRevoked))',
  'function somniaWatch() external view returns (address)',
];

const LEVELS = ['BRONZE', 'SILVER', 'GOLD'];
const THRESHOLDS = { BRONZE: 3, SILVER: 7, GOLD: 15 };
const EXPLORER = 'https://shannon-explorer.somnia.network';

async function main() {
  const RPC_URL       = process.env.SOMNIA_RPC    || 'https://dream-rpc.somnia.network';
  const PRIVATE_KEY   = process.env.PRIVATE_KEY;
  const WATCH_ADDRESS = process.env.SOMNIAWATCH_ADDRESS;
  const CERT_ADDRESS  = process.env.AUDIT_CERTIFICATE_ADDRESS;

  if (!PRIVATE_KEY)   { console.error('ERROR: PRIVATE_KEY not set'); process.exit(1); }
  if (!WATCH_ADDRESS) { console.error('ERROR: SOMNIAWATCH_ADDRESS not set'); process.exit(1); }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
  const watch    = new ethers.Contract(WATCH_ADDRESS, WATCH_ABI, signer);

  const certAddress = CERT_ADDRESS || await watch.auditCertificate();
  if (!certAddress || certAddress === ethers.ZeroAddress) {
    console.error('ERROR: AuditCertificate address not set on SomniaWatch');
    process.exit(1);
  }

  const cert       = new ethers.Contract(certAddress, CERT_ABI, signer);
  const registered = await watch.getAllRegistered();

  console.log('\n\uD83C\uDF96\uFE0F  SomniaWatch Certificate Minter');
  console.log(`   Contracts to check: ${registered.length}\n`);

  for (const target of registered) {
    console.log(`\u2192 Checking ${target}...`);

    const profile  = await watch.registry(target);
    const history  = await watch.getAuditHistory(target);
    const consecutive = Number(profile.consecutiveSafe);

    console.log(`   Consecutive SAFE: ${consecutive}`);
    console.log(`   Total audits:     ${history.length}`);

    if (consecutive < THRESHOLDS.BRONZE) {
      console.log(`   \u23ED  Need ${THRESHOLDS.BRONZE} consecutive SAFE audits for Bronze. Currently ${consecutive}.\n`);
      continue;
    }

    const hasCert = await cert.hasCertificate(target);
    const lastAudit = history[history.length - 1];
    const receipt   = lastAudit ? lastAudit.receiptId.toString() : '0';

    if (!hasCert) {
      const tier = consecutive >= THRESHOLDS.GOLD ? 'GOLD'
                 : consecutive >= THRESHOLDS.SILVER ? 'SILVER' : 'BRONZE';
      console.log(`   \uD83C\uDF96\uFE0F  Minting ${tier} certificate...`);
      try {
        const tx = await cert.mintCertificate(
          target, profile.owner, consecutive, BigInt(receipt)
        );
        await tx.wait();
        const tokenId = await cert.contractToToken(target);
        console.log(`   \u2705 Minted! Token ID: ${tokenId}`);
        console.log(`   \uD83D\uDD17 ${EXPLORER}/tx/${tx.hash}`);
      } catch (e) {
        console.error(`   \u274C Mint failed: ${e.message}`);
      }
    } else {
      const existing = await cert.getCertificate(target);
      const currentLevel = LEVELS[existing.level] || 'UNKNOWN';
      console.log(`   Certificate exists: ${currentLevel} (token ${await cert.contractToToken(target)})`);

      const newTier = consecutive >= THRESHOLDS.GOLD ? 2
                    : consecutive >= THRESHOLDS.SILVER ? 1 : 0;
      if (newTier > existing.level) {
        console.log(`   \u2B06\uFE0F  Upgrading to ${LEVELS[newTier]}...`);
        try {
          const certRW = new ethers.Contract(certAddress, [
            'function upgradeCertificate(address contractAddr, uint256 newConsecutiveSafe, uint256 agentReceipt) external'
          ], signer);
          const tx = await certRW.upgradeCertificate(target, consecutive, BigInt(receipt));
          await tx.wait();
          console.log(`   \u2705 Upgraded! ${EXPLORER}/tx/${tx.hash}`);
        } catch (e) {
          console.error(`   \u274C Upgrade failed: ${e.message}`);
        }
      } else {
        console.log(`   \u2713 Already at ${currentLevel} — no upgrade needed.`);
      }
    }
    console.log();
  }

  console.log('Done. \uD83C\uDF96\uFE0F\n');
}

main().catch(e => { console.error(e); process.exit(1); });
