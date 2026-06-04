// /api/sphinx-challenge.js — Vercel Serverless Function
// POST { contractAddress, argument }
// Calls sphinxChallenge() on-chain, polls for SphinxOverride/SphinxConfirmed event,
// returns { txHash, receiptId, score, verdict, explorerLink }

const { ethers } = require('ethers');

const WATCH_ABI = [
  'function sphinxChallenge(address target, string calldata argument) external payable returns (uint256 requestId)',
  'function depositForLlm() external view returns (uint256)',
  'function getSphinxHistory(address target) external view returns (tuple(address target, uint256 score, string argument, uint256 receiptId, bool overridden, uint256 timestamp)[])',
  'event SphinxOverride(address indexed target, uint256 score, uint256 receiptId)',
  'event SphinxConfirmed(address indexed target, uint256 score, uint256 receiptId)',
];

const EXPLORER = 'https://shannon-explorer.somnia.network';

async function waitForSphinxResult(watch, target, afterTimestamp, maxMs = 300000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const history = await watch.getSphinxHistory(target);
      if (history.length > 0) {
        const last = history[history.length - 1];
        if (Number(last.timestamp) > afterTimestamp) return last;
      }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 20000));
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'POST only' });

  const { contractAddress, argument } = req.body || {};
  if (!contractAddress || !argument)
    return res.status(400).json({ error: 'contractAddress and argument required' });
  if (!ethers.isAddress(contractAddress))
    return res.status(400).json({ error: 'Invalid contractAddress' });

  const PRIVATE_KEY    = process.env.PRIVATE_KEY;
  const RPC_URL        = process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network';
  const WATCH_ADDRESS  = process.env.SOMNIAWATCH_ADDRESS;

  if (!PRIVATE_KEY || !WATCH_ADDRESS)
    return res.status(500).json({ error: 'Server misconfigured: missing env vars' });

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
    const watch    = new ethers.Contract(WATCH_ADDRESS, WATCH_ABI, signer);

    const deposit  = await watch.depositForLlm();
    const beforeTs = Math.floor(Date.now() / 1000);

    const tx = await watch.sphinxChallenge(contractAddress, argument, { value: deposit });
    await tx.wait();

    const result = await waitForSphinxResult(watch, contractAddress, beforeTs);

    if (!result) {
      return res.status(202).json({
        ok: false,
        txHash: tx.hash,
        message: 'TX confirmed. Waiting for Sphinx agent consensus (poll again in 2 min)',
        explorerLink: `${EXPLORER}/tx/${tx.hash}`,
      });
    }

    const score    = Number(result.score);
    const receiptId= result.receiptId.toString();
    const verdict  = result.overridden ? 'SAFE_OVERRIDE' : 'CRITICAL_CONFIRMED';

    return res.status(200).json({
      ok: true,
      txHash: tx.hash,
      receiptId,
      score,
      verdict,
      overridden: result.overridden,
      explorerLink: `${EXPLORER}/tx/${tx.hash}`,
      receiptLink: `${EXPLORER}/tx/${receiptId}`,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
