// /api/deep-scan.js — Vercel Serverless Function
// POST { contractAddress } → triggers real 3-agent pipeline on-chain
// GET  ?address=X         → returns latest audit result as JSON

const { ethers } = require('ethers');

const WATCH_ABI = [
  'function triggerMonitor(address target) external payable returns (uint256 requestId)',
  'function depositForJson() external view returns (uint256)',
  'function getLatestAudit(address target) external view returns (tuple(address target, uint8 riskLevel, string riskType, string reasoning, uint256 timestamp, uint256 receiptId, bool autoActioned))',
  'function registry(address) external view returns (address owner, bool isRegistered, bool isFlagged, uint8 riskScore, uint256 lastChecked, uint256 totalChecks, string lastRiskType, uint256 consecutiveSafe)',
];

const RISK_LABELS = ['SAFE', 'SUSPICIOUS', 'CRITICAL'];
const EXPLORER    = 'https://shannon-explorer.somnia.network';

function getContracts() {
  const provider     = new ethers.JsonRpcProvider(process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network');
  const signer       = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const watch        = new ethers.Contract(process.env.SOMNIAWATCH_ADDRESS, WATCH_ABI, signer);
  return { provider, signer, watch };
}

module.exports = async function handler(req, res) {
  const PRIVATE_KEY   = process.env.PRIVATE_KEY;
  const WATCH_ADDRESS = process.env.SOMNIAWATCH_ADDRESS;

  if (!PRIVATE_KEY || !WATCH_ADDRESS)
    return res.status(500).json({ error: 'Server misconfigured' });

  // GET — return latest audit result
  if (req.method === 'GET') {
    const address = req.query.address;
    if (!address || !ethers.isAddress(address))
      return res.status(400).json({ error: 'Valid address required' });
    try {
      const { watch } = getContracts();
      const audit     = await watch.getLatestAudit(address);
      const profile   = await watch.registry(address);
      return res.status(200).json({
        address,
        riskLevel:    RISK_LABELS[Number(audit.riskLevel)] || 'UNKNOWN',
        riskType:     audit.riskType,
        reasoning:    audit.reasoning,
        timestamp:    new Date(Number(audit.timestamp) * 1000).toISOString(),
        receiptId:    audit.receiptId.toString(),
        autoActioned: audit.autoActioned,
        isFlagged:    profile.isFlagged,
        consecutiveSafe: Number(profile.consecutiveSafe),
        explorerLink: `${EXPLORER}/tx/${audit.receiptId.toString()}`,
      });
    } catch (e) {
      return res.status(404).json({ error: e.message });
    }
  }

  // POST — trigger new monitoring cycle
  if (req.method === 'POST') {
    const { contractAddress } = req.body || {};
    if (!contractAddress || !ethers.isAddress(contractAddress))
      return res.status(400).json({ error: 'Valid contractAddress required' });
    try {
      const { watch } = getContracts();
      const deposit   = await watch.depositForJson();
      const tx        = await watch.triggerMonitor(contractAddress, { value: deposit });
      await tx.wait();
      return res.status(200).json({
        ok: true,
        txHash: tx.hash,
        contractAddress,
        explorerLink: `${EXPLORER}/tx/${tx.hash}`,
        message: '3-agent pipeline started (fetchString → parseWebsite → inferString). Poll GET /api/deep-scan?address=' + contractAddress + ' for result.',
        expectedResultIn: '2–5 minutes (3-validator consensus per agent)',
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  return res.status(405).json({ error: 'GET or POST only' });
};
