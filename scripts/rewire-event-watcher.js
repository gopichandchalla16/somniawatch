/**
 * Re-wire EventWatcher to the correct SomniaWatch v3 address.
 * Run this if EventWatcher was accidentally wired to an old contract.
 *
 * Usage:
 *   npx hardhat run scripts/rewire-event-watcher.js --network somnia
 *
 * Requires .env:
 *   EVENTWATCHER_ADDRESS=0xBE0D0a69A0CAe8334c1dCd569795F76b45c23948
 *   SOMNIAWATCH_ADDRESS=0xaca28071870080421206831D2F9EBd3E97CcdFd1
 */

const hre = require('hardhat');

const EVENTWATCHER_ABI = [
  'function setSomniaWatch(address _sw) external',
  'function somniaWatch() external view returns (address)',
  'function owner() external view returns (address)',
];

async function main() {
  const [signer] = await hre.ethers.getSigners();

  const ewAddress = process.env.EVENTWATCHER_ADDRESS || '0xBE0D0a69A0CAe8334c1dCd569795F76b45c23948';
  const swAddress = process.env.SOMNIAWATCH_ADDRESS  || '0xaca28071870080421206831D2F9EBd3E97CcdFd1';

  console.log('\n🔧 Re-wiring EventWatcher...');
  console.log('   EventWatcher :', ewAddress);
  console.log('   Target SW v3 :', swAddress);
  console.log('   Caller       :', signer.address);

  const watcher = new hre.ethers.Contract(ewAddress, EVENTWATCHER_ABI, signer);

  // Check current wiring
  const current = await watcher.somniaWatch();
  console.log('\n   Currently wired to:', current);

  if (current.toLowerCase() === swAddress.toLowerCase()) {
    console.log('✅ Already wired to v3! Nothing to do.');
    return;
  }

  // Re-wire
  console.log('   Re-wiring now...');
  const tx = await watcher.setSomniaWatch(swAddress);
  const r  = await tx.wait();
  console.log('✅ Re-wired successfully!');
  console.log('   TX      :', r.hash);
  console.log('   Explorer: https://shannon-explorer.somnia.network/tx/' + r.hash);

  // Verify
  const updated = await watcher.somniaWatch();
  console.log('\n✔️  Verified wired to:', updated);
  console.log('🎉 EventWatcher → SomniaWatch v3 confirmed!\n');
}

main().catch(e => { console.error(e); process.exit(1); });
