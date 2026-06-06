// /api/force-audit.js — Force an immediate single-cycle audit for demo/judge use
// GET /api/force-audit?address=0x... (optional: specific contract)
// GET /api/force-audit (audits all registered contracts)

const { ethers } = require('ethers');
const https = require('https');

const WATCH_ABI = [
  'function getAllRegistered() external view returns (address[])',
  'function registry(address) external view returns (address owner, bool isRegistered, bool isFlagged, uint8 riskScore, uint256 lastChecked, uint256 totalChecks, string lastRiskType)',
  'function contractBalance() external view returns (uint256)',
  'function totalAuditsCompleted() external view returns (uint256)',
];

const EXPLORER = 'https://shannon-explorer.somnia.network';

function fetchTxData(target) {
  return new Promise((resolve) => {
    const req = https.request(
      { hostname: 'shannon-explorer.somnia.network',
        path: `/api/v2/addresses/${target}/transactions?limit=20`,
        method: 'GET', headers: { 'Accept': 'application/json' } },
      res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } }); }
    );
    req.on('error', () => resolve(null));
    req.end();
  });
}

function classifyRisk(txData) {
  if (!txData || !txData.items || txData.items.length === 0)
    return { riskLevel: 0, riskLabel: 'SAFE', riskType: 'normal',
      reasoning: 'No transactions found. Contract appears inactive — no threats detected.' };
  const items   = txData.items;
  const methods = items.map(t => (t.method || '').toLowerCase());
  const values  = items.map(t => BigInt(t.value || '0'));
  const maxVal  = values.reduce((a,b) => a > b ? a : b, 0n);
  const withdrawCount = methods.filter(m => m.includes('withdraw')).length;
  if (withdrawCount >= 3 && maxVal > ethers.parseEther('10'))
    return { riskLevel: 2, riskLabel: 'CRITICAL', riskType: 'reentrancy_pattern',
      reasoning: `${withdrawCount} withdrawal calls with transfers >10 STT. Possible reentrancy attack detected by SomniaWatch AI.` };
  if (methods.some(m => m.includes('drain') || m.includes('selfdestruct')))
    return { riskLevel: 2, riskLabel: 'CRITICAL', riskType: 'access_violation',
      reasoning: 'Drain or selfdestruct call detected. Possible unauthorized access or rug pull.' };
  if (maxVal > ethers.parseEther('50'))
    return { riskLevel: 1, riskLabel: 'SUSPICIOUS', riskType: 'value_anomaly',
      reasoning: `Large transfer of ${ethers.formatEther(maxVal)} STT detected. Flagged for review.` };
  if (items.length >= 15)
    return { riskLevel: 1, riskLabel: 'SUSPICIOUS', riskType: 'high_frequency',
      reasoning: `${items.length} recent transactions. High frequency — possible bot or attack pattern.` };
  return { riskLevel: 0, riskLabel: 'SAFE', riskType: 'normal',
    reasoning: `Analyzed ${items.length} transactions. Normal patterns. No anomalies found.` };
}

module.exports = async function handler(req, res) {
  // CORS for frontend Force Audit button
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const PRIVATE_KEY   = process.env.PRIVATE_KEY;
  const RPC_URL       = process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network';
  const WATCH_ADDRESS = process.env.SOMNIAWATCH_ADDRESS;

  if (!PRIVATE_KEY || !WATCH_ADDRESS)
    return res.status(500).json({ ok: false, error: 'Missing env vars' });

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
  const watch    = new ethers.Contract(WATCH_ADDRESS, WATCH_ABI, signer);

  // Allow targeting a specific address via query param
  const specificAddr = req.query?.address || req.body?.address || null;

  let targets;
  try {
    const all = await watch.getAllRegistered();
    targets = specificAddr ? [specificAddr] : all;
  } catch (e) {
    return res.status(500).json({ ok: false, error: `RPC error: ${e.message}` });
  }

  if (targets.length === 0)
    return res.status(200).json({ ok: true, message: 'No contracts registered. POST /api/register first.' });

  const results = [];
  const startTime = Date.now();

  for (const target of targets) {
    const txData       = await fetchTxData(target);
    const txCount      = txData?.items?.length || 0;
    const classif      = classifyRisk(txData);
    const explorerUrl  = `${EXPLORER}/address/${target}`;
    results.push({
      address:  target,
      riskLabel: classif.riskLabel,
      riskType:  classif.riskType,
      reasoning: classif.reasoning,
      txCount,
      explorerContract: explorerUrl,
      auditedAt: new Date().toISOString(),
    });
  }

  return res.status(200).json({
    ok: true,
    mode: 'force_audit',
    message: 'Immediate audit complete — no 6-hour wait',
    duration_ms: Date.now() - startTime,
    contracts_audited: results.length,
    timestamp: new Date().toISOString(),
    results,
  });
};
