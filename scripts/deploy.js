// scripts/deploy.js — npx hardhat run scripts/deploy.js --network somnia_testnet
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with:', deployer.address);
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'STT');

  // Somnia Agentic L1 platform address (Chain ID 50312)
  const PLATFORM = '0x5E5205CF39E766118C01636bED000A54D93163E6';

  const Factory = await ethers.getContractFactory('SomniaWatch');
  const watch = await Factory.deploy(PLATFORM);
  await watch.waitForDeployment();

  const addr = await watch.getAddress();
  console.log('\n✅ SomniaWatch deployed to:', addr);
  console.log('Explorer:', `https://shannon-explorer.somnia.network/address/${addr}`);
  console.log('\n⚠️  IMPORTANT: Update these env vars:');
  console.log('  Vercel: SOMNIAWATCH_ADDRESS =', addr);
  console.log('  GitHub Secret: KEEPER_CRON_URL = https://somniawatch-eight.vercel.app/api/keeper-cron');
  console.log('\nThen fund the contract:');
  console.log('  npx hardhat run scripts/fund.js --network somnia_testnet');
  console.log('  (Update WATCH address in fund.js first!)');
}

main().catch(e => { console.error(e); process.exit(1); });
