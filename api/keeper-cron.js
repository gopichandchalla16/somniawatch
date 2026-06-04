// /api/keeper-cron.js — Vercel Serverless Function
// REAL keeper: calls triggerMonitor() on-chain, polls for consensus result,
// fires Discord + Telegram with REAL receipt IDs.

const { ethers } = require('ethers');
const https = require('https');

// ── ABI (minimal — only what keeper needs) ─────────────────────────────

const WATCH_ABI = [
  'function getAllRegistered() external view returns (address[])',
  'function registry(address) external view returns (address owner, bool isRegistered, bool isFlagged, uint8 riskScore, uint256 lastChecked, uint256 totalChecks, string lastRiskType, uint256 consecutiveSafe)',
  'function triggerMonitor(address target) external payable returns (uint256 requestId)',
  'function getLatestAudit(address target) external view returns (tuple(address target, uint8 riskLevel, string riskType, string reasoning, uint256 timestamp, uint256 receiptId, bool autoActioned))',
  'function depositForJson() external view returns (uint256)',
  'function totalAuditsCompleted() external view returns (uint256)',
  'event RiskClassified(address indexed target, uint8 riskLevel, string riskType, uint256 receiptId)',
];

const EXPLORER = 'https://shannon-explorer.somnia.network';
const MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ── HTTP helpers ────────────────────────────────────────────────────

function httpsPost(hostname, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname, path, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      },
      res => {
        let d = ''; res.on('data', c => d += c);
        res.on('end', () => resolve({ status: res.statusCode, body: d }));
      }
    );
    req.on('error', reject);
    req.write(data); req.end();
  });
}

async function sendDiscord(webhook, contractAddr, riskType, riskLevel, receiptId, txHash) {
  if (!webhook) return 'not_configured';
  try {
    const url   = new URL(webhook);
    const color = riskLevel === 2 ? 0xff2200 : 0xffaa00;
    const title = riskLevel === 2
      ? '\uD83D\uDEA8 SOMNIAWATCH — CRITICAL ALERT'
      : '\u26A0\uFE0F SOMNIAWATCH — SUSPICIOUS ACTIVITY';
    const body = {
      embeds: [{
        title,
        description:
          `**Contract:** \`${contractAddr}\`\n` +
          `**Risk Pattern:** ${riskType}\n` +
          `**Classification:** ${riskLevel === 2 ? 'CRITICAL' : 'SUSPICIOUS'}\n` +
          `**Receipt ID:** \`${receiptId}\`\n` +
          `**TX Hash:** \`${txHash}\`\n\n` +
          `[View Contract](${EXPLORER}/address/${contractAddr}) • ` +
          `[View TX](${EXPLORER}/tx/${txHash})`,
        color,
        footer: { text: 'SomniaWatch | Autonomous Security Guardian | Somnia Agentathon 2026' },
        timestamp: new Date().toISOString(),
      }],
    };
    const r = await httpsPost(url.hostname, url.pathname + url.search, body);
    return r.status < 300 ? 'sent' : `failed_${r.status}`;
  } catch (e) { return `error_${e.message}`; }
}

async function sendTelegram(token, chatId, contractAddr, riskType, riskLevel, receiptId, txHash) {
  if (!token || !chatId) return 'not_configured';
  try {
    const level = riskLevel === 2 ? 'CRITICAL \uD83D\uDEA8' : 'SUSPICIOUS \u26A0\uFE0F';
    const text =
      `*SOMNIAWATCH ${level}*\n\n` +
      `Contract: \`${contractAddr}\`\n` +
      `Risk: *${riskType.replace(/_/g, '\\_')}*\n` +
      `Receipt: \`${receiptId}\`\n` +
      `TX: \`${txHash}\`\n\n` +
      `[Explorer](${EXPLORER}/address/${contractAddr})`;
    const r = await httpsPost(
      'api.telegram.org',
      `/bot${token}/sendMessage`,
      { chat_id: chatId, text, parse_mode: 'Markdown' }
    );
    const parsed = JSON.parse(r.body);
    return parsed.ok ? 'sent' : `failed: ${parsed.description}`;
  } catch (e) { return `error_${e.message}`; }
}

// ── Wait for RiskClassified event (polls every 30s, max 5 min) ─────────

async function waitForAudit(watch, target, beforeTimestamp, maxWaitMs = 300000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const audit = await watch.getLatestAudit(target);
      if (Number(audit.timestamp) > beforeTimestamp) return audit;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 30000));
  }
  return null;
}

// ── Main keeper logic ────────────────────────────────────────────────

async function runKeeper() {
  const PRIVATE_KEY       = process.env.PRIVATE_KEY;
  const RPC_URL           = process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network';
  const WATCH_ADDRESS     = process.env.SOMNIAWATCH_ADDRESS;
  const DISCORD_WEBHOOK   = process.env.DISCORD_WEBHOOK || '';
  const TELEGRAM_TOKEN    = process.env.TELEGRAM_TOKEN  || '';
  const TELEGRAM_CHAT_ID  = process.env.TELEGRAM_CHAT_ID || '';

  if (!PRIVATE_KEY || !WATCH_ADDRESS) {
    return { ok: false, error: 'Missing PRIVATE_KEY or SOMNIAWATCH_ADDRESS env vars' };
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
  const watch    = new ethers.Contract(WATCH_ADDRESS, WATCH_ABI, signer);

  const registered = await watch.getAllRegistered();
  const now        = Math.floor(Date.now() / 1000);
  const results    = [];
  let alertsDiscord = 0, alertsTelegram = 0;

  for (const target of registered) {
    try {
      const profile = await watch.registry(target);
      const lastChecked = Number(profile.lastChecked);

      if (now - lastChecked < 300) {
        results.push({ address: target, status: 'skipped_too_soon', lastChecked });
        continue;
      }

      const deposit    = await watch.depositForJson();
      const beforeTime = now;

      const tx = await watch.triggerMonitor(target, { value: deposit });
      await tx.wait();

      const audit = await waitForAudit(watch, target, beforeTime);
      if (!audit) {
        results.push({ address: target, status: 'timeout_waiting_for_consensus', txHash: tx.hash });
        continue;
      }

      const riskLevel  = Number(audit.riskLevel);
      const riskType   = audit.riskType;
      const receiptId  = audit.receiptId.toString();
      const txHash     = tx.hash;
      const riskLabel  = ['SAFE', 'SUSPICIOUS', 'CRITICAL'][riskLevel] || 'UNKNOWN';

      let discord = 'skipped', telegram = 'skipped';

      if (riskLevel >= 1) {
        discord  = await sendDiscord(DISCORD_WEBHOOK, target, riskType, riskLevel, receiptId, txHash);
        telegram = await sendTelegram(TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, target, riskType, riskLevel, receiptId, txHash);
        if (discord === 'sent') alertsDiscord++;
        if (telegram === 'sent') alertsTelegram++;
      }

      results.push({
        address: target,
        status:  'completed',
        riskLevel: riskLabel,
        riskType,
        receiptId,
        txHash,
        explorerLink: `${EXPLORER}/tx/${txHash}`,
        alerts: { discord, telegram },
      });

    } catch (err) {
      results.push({ address: target, status: 'error', error: err.message });
    }
  }

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    contracts_checked: registered.length,
    results,
    alerts_fired: { discord: alertsDiscord, telegram: alertsTelegram },
  };
}

// ── Vercel handler ────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });
  try {
    const result = await runKeeper();
    return res.status(result.ok ? 200 : 500).json(result);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
