// scripts/fund.js — Run: npx hardhat run scripts/fund.js --network somnia_testnet
const { ethers } = require('hardhat');

async function main() {
  const [signer] = await ethers.getSigners();
  const WATCH = '0xd1e7EAC1aD0ad24eb444CbC9e9A143c570373ED0';

  const walletBal = await ethers.provider.getBalance(signer.address);
  console.log('Wallet :', signer.address);
  console.log('Wallet balance :', ethers.formatEther(walletBal), 'STT');

  const watch = await ethers.getContractAt('SomniaWatch', WATCH);
  const before = await watch.contractBalance();
  console.log('Contract balance before:', ethers.formatEther(before), 'STT');

  const FUND_AMOUNT = ethers.parseEther('2'); // 2 STT = ~5 full monitoring cycles
  console.log('Sending', ethers.formatEther(FUND_AMOUNT), 'STT to contract...');

  const tx = await watch.fund({ value: FUND_AMOUNT });
  console.log('TX submitted:', tx.hash);
  await tx.wait();
  console.log('TX confirmed!');

  const after = await watch.contractBalance();
  console.log('Contract balance after:', ethers.formatEther(after), 'STT');
  console.log('Done! Contract funded successfully.');
}

main().catch(e => { console.error(e); process.exit(1); });
