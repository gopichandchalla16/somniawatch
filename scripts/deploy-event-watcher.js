/**
 * Deploy EventWatcher.sol to Somnia Shannon Testnet
 * Run: npx hardhat run scripts/deploy-event-watcher.js --network somnia
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying EventWatcher with:', deployer.address);

  const EventWatcher = await hre.ethers.getContractFactory('EventWatcher');
  const watcher      = await EventWatcher.deploy();
  await watcher.waitForDeployment();

  const address = await watcher.getAddress();
  console.log('✅ EventWatcher deployed to:', address);
  console.log('🔗 Explorer:', 'https://shannon-explorer.somnia.network/address/' + address);

  // Wire to existing SomniaWatch
  const SW_ADDRESS = process.env.SOMNIAWATCH_ADDRESS || '0xaca28071870080421206831D2F9EBd3E97CcdFd1';
  console.log('Wiring to SomniaWatch at:', SW_ADDRESS);
  const tx = await watcher.setSomniaWatch(SW_ADDRESS);
  await tx.wait();
  console.log('✅ EventWatcher wired to SomniaWatch');
  console.log('');
  console.log('Next steps:');
  console.log('  Add EVENTWATCHER_ADDRESS=' + address + ' to your .env');
  console.log('  Add EVENTWATCHER_ADDRESS to Vercel env vars');
  console.log('  Call watcher.reportBatchWithdraw(MockVault, 5) to test');
}

main().catch(e => { console.error(e); process.exit(1); });
