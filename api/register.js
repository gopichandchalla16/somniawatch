// /api/register.js — Register any Somnia testnet contract for monitoring
// POST /api/register  { address: "0x..." }
// Judges can paste ANY contract address and start monitoring instantly

const { ethers } = require('ethers');

const WATCH_ABI = [
  'function registerContract(address target) external',
  'function getAllRegistered() external view returns (address[])',
  'function registry(address) external view returns (address owner, bool isRegistered, bool isFlagged, uint8 riskScore, uint256 lastChecked, uint256 totalChecks, string lastRiskType)',
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    // List all registered contracts
    const PRIVATE_KEY   = process.env.PRIVATE_KEY;
    const RPC_URL       = process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network';
    const WATCH_ADDRESS = process.env.SOMNIAWATCH_ADDRESS;
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
    const watch    = new ethers.Contract(WATCH_ADDRESS, WATCH_ABI, signer);
    const all      = await watch.getAllRegistered();
    return res.status(200).json({ ok: true, registered: all, count: all.length,
      watchContract: WATCH_ADDRESS,
      explorer: `https://shannon-explorer.somnia.network/address/${WATCH_ADDRESS}` });
  }

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'POST { address } or GET to list' });

  const { address } = req.body || {};
  if (!address || !ethers.isAddress(address))
    return res.status(400).json({ ok: false, error: 'Invalid address. Send: { "address": "0x..." }' });

  const PRIVATE_KEY   = process.env.PRIVATE_KEY;
  const RPC_URL       = process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network';
  const WATCH_ADDRESS = process.env.SOMNIAWATCH_ADDRESS;

  if (!PRIVATE_KEY || !WATCH_ADDRESS)
    return res.status(500).json({ ok: false, error: 'Missing env vars on server' });

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
  const watch    = new ethers.Contract(WATCH_ADDRESS, WATCH_ABI, signer);

  // Check if already registered
  try {
    const profile = await watch.registry(address);
    if (profile.isRegistered) {
      const all = await watch.getAllRegistered();
      return res.status(200).json({
        ok: true, alreadyRegistered: true,
        message: `✅ Contract already monitored by SomniaWatch`,
        address, totalRegistered: all.length,
        monitoringUrl: `https://shannon-explorer.somnia.network/address/${address}`,
        forceAuditUrl: `https://somniawatch-eight.vercel.app/api/force-audit?address=${address}`,
      });
    }
  } catch (_) {}

  // Register it
  try {
    const tx = await watch.registerContract(address);
    await tx.wait();
    const all = await watch.getAllRegistered();
    return res.status(200).json({
      ok: true,
      message: `🟢 Contract registered! SomniaWatch is now monitoring it autonomously every 6 hours.`,
      address,
      txHash: tx.hash,
      explorerTx: `https://shannon-explorer.somnia.network/tx/${tx.hash}`,
      monitoringUrl: `https://shannon-explorer.somnia.network/address/${address}`,
      forceAuditUrl: `https://somniawatch-eight.vercel.app/api/force-audit?address=${address}`,
      totalRegistered: all.length,
      nextAutoRun: 'Within 6 hours via GitHub Actions',
      watchContract: WATCH_ADDRESS,
    });
  } catch (e) {
    const msg = e.message || '';
    const decoded = msg.includes('Already registered') ? 'Already registered' :
      msg.includes('self-register') ? 'Cannot register SomniaWatch itself' : msg;
    return res.status(500).json({ ok: false, error: decoded });
  }
};
