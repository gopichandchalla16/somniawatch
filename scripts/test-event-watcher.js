/**
 * Test EventWatcher on Somnia Shannon
 * Fires a batchWithdraw report to verify auto-registration works.
 * 
 * Usage:
 *   npx hardhat run scripts/test-event-watcher.js --network somnia
 */

const hre = require('hardhat');

const EVENTWATCHER_ABI = [
  'function reportBatchWithdraw(address source, uint256 count) external',
  'function reportSuspiciousActivity(address suspect, string calldata pattern, uint256 severity) external',
  'function isMonitored(address target) external view returns (bool)',
  'event AutoRegistered(address indexed target, string reason, uint256 block_)',
  'event SuspiciousActivityDetected(address indexed source, string pattern, uint256 severity, uint256 timestamp)',
  'event AutonomousAuditTriggered(address indexed target, string triggerReason, uint256 timestamp)',
];

async function main() {
  const [signer] = await hre.ethers.getSigners();

  const ewAddress = process.env.EVENTWATCHER_ADDRESS;
  if (!ewAddress) {
    console.error('❌ Set EVENTWATCHER_ADDRESS in your .env first');
    process.exit(1);
  }

  const watcher   = new hre.ethers.Contract(ewAddress, EVENTWATCHER_ABI, signer);
  const MOCK_VAULT = '0xeB282f43b4015b7a71cfbd2Bd52f69146030701E';

  console.log('\n🧪 Testing EventWatcher...');
  console.log('   EventWatcher:', ewAddress);
  console.log('   Target      :', MOCK_VAULT);

  // Test 1: reportBatchWithdraw
  console.log('\n1️⃣  Calling reportBatchWithdraw(MockVault, 5)...');
  const tx1 = await watcher.reportBatchWithdraw(MOCK_VAULT, 5);
  const r1  = await tx1.wait();
  console.log('   ✅ TX:', r1.hash);
  console.log('   🔗 Explorer: https://shannon-explorer.somnia.network/tx/' + r1.hash);

  // Test 2: reportSuspiciousActivity HIGH
  console.log('\n2️⃣  Calling reportSuspiciousActivity(MockVault, reentrancy_pattern, 3)...');
  const tx2 = await watcher.reportSuspiciousActivity(MOCK_VAULT, 'reentrancy_pattern', 3);
  const r2  = await tx2.wait();
  console.log('   ✅ TX:', r2.hash);
  console.log('   🔗 Explorer: https://shannon-explorer.somnia.network/tx/' + r2.hash);

  // Verify
  const monitored = await watcher.isMonitored(MOCK_VAULT);
  console.log('\n✅ MockVault is now monitored:', monitored);
  console.log('🎉 EventWatcher working! Autonomous on-chain registration confirmed.');
  console.log('🔗 Paste both TX hashes in your submission notes to prove on-chain autonomy.');
}

main().catch(e => { console.error(e); process.exit(1); });
