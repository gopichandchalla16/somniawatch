/**
 * Deploy EventWatcher.sol to Somnia Shannon Testnet
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-event-watcher.js --network somnia
 *
 * Make sure your .env has:
 *   PRIVATE_KEY=your_wallet_private_key
 *   SOMNIA_RPC=https://dream-rpc.somnia.network   (optional, this is the default)
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('\n🚀 Deploying EventWatcher...');
  console.log('   Deployer :', deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('   Balance  :', hre.ethers.formatEther(balance), 'STT');

  if (balance === 0n) {
    console.error('\n❌ Wallet has 0 STT. Get testnet STT from the Somnia faucet first.');
    console.error('   https://testnet.somnia.network/faucet');
    process.exit(1);
  }

  // Deploy
  const EventWatcher = await hre.ethers.getContractFactory('EventWatcher');
  const watcher      = await EventWatcher.deploy();
  await watcher.waitForDeployment();

  const address = await watcher.getAddress();
  console.log('\n✅ EventWatcher deployed!');
  console.log('   Address  :', address);
  console.log('   Explorer : https://shannon-explorer.somnia.network/address/' + address);

  // Wire to existing SomniaWatch
  const SW_ADDRESS = process.env.SOMNIAWATCH_ADDRESS || '0xaca28071870080421206831D2F9EBd3E97CcdFd1';
  console.log('\n🔗 Wiring to SomniaWatch at:', SW_ADDRESS);
  const tx = await watcher.setSomniaWatch(SW_ADDRESS);
  await tx.wait();
  console.log('✅ Wired successfully!');

  console.log('\n──────────────────────────────────────────────────');
  console.log('📋 NEXT STEPS:');
  console.log('  1. Add this to your .env:');
  console.log('     EVENTWATCHER_ADDRESS=' + address);
  console.log('  2. Add EVENTWATCHER_ADDRESS to Vercel environment variables');
  console.log('  3. Test it:');
  console.log('     npx hardhat run scripts/test-event-watcher.js --network somnia');
  console.log('──────────────────────────────────────────────────\n');
}

main().catch(e => { console.error(e); process.exit(1); });
