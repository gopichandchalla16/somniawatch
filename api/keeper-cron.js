// /api/keeper-cron.js — Vercel Serverless Function
// Autonomous keeper: monitors registered contracts, fires alerts on CRITICAL/SUSPICIOUS

const { ethers } = require('ethers');
const https = require('https');

const WATCH_ABI = [
  'function getAllRegistered() external view returns (address[])',
  'function registry(address) external view returns (address owner, bool isRegistered, bool isFlagged, uint8 riskScore, uint256 lastChecked, uint256 totalChecks, string lastRiskType)',
  'function triggerMonitor(address target) external payable returns (uint256 requestId)',
  'function getLatestAudit(address target) external view returns (tuple(address target, uint8 riskLevel, string riskType, string reasoning, uint256 timestamp, uint256 receiptId, bool autoActioned))',
  'function contractBalance() external view returns (uint256)',
  'function fund() external payable',
  'function totalAuditsCompleted() external view returns (uint256)',
  'event RiskClassified(address indexed target, uint8 riskLevel, string riskType, uint256 receiptId)',
];

const EXPLORER = 'https://shannon-explorer.somnia.network';

// Hardcoded costs from contract constants (avoids calling platform.getRequestDeposit())
// JSON:  0.03 STT × 3 validators = 0.09 STT + platform reserve ~0.03 = ~0.12 STT
// LLM:   0.07 STT × 3 validators = 0.21 STT + platform reserve ~0.03 = ~0.24 STT
// Full cycle: 0.36 STT — send 0.4 STT as msg.value to be safe
const JSON_DEPOSIT = ethers.parseEther('0.13');  // slightly above 0.12 to cover reserve
const LLM_DEPOSIT  = ethers.parseEther('0.25');  // slightly above 0.24 to cover reserve
const FULL_CYCLE   = JSON_DEPOSIT + LLM_DEPOSIT; // 0.38 STT
const MIN_CONTRACT_BALANCE = FULL_CYCLE * 3n;    // keep 3 cycles worth = ~1.14 STT

function httpsPost(hostname, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      { hostname, path, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d })); }
    );
    req.on('error', reject);
    req.write(data); req.end();
  });
}

async function sendDiscord(webhook, addr, riskType, riskLevel, receiptId, txHash) {
  if (!webhook) return 'not_configured';
  try {
    const url   = new URL(webhook);
    const color = riskLevel === 2 ? 0xff2200 : 0xffaa00;
    await httpsPost(url.hostname, url.pathname + url.search, {
      embeds: [{
        title: riskLevel === 2 ? '🚨 SOMNIAWATCH — CRITICAL ALERT' : '⚠️ SOMNIAWATCH — SUSPICIOUS',
        description:
          `**Contract:** \`${addr}\`\n` +
          `**Risk Pattern:** ${riskType}\n` +
          `**Classification:** ${riskLevel === 2 ? 'CRITICAL 🚨' : 'SUSPICIOUS ⚠️'}\n` +
          `**Receipt ID:** \`${receiptId}\`\n` +
          `**TX Hash:** \`${txHash}\`\n\n` +
          `[View Contract](${EXPLORER}/address/${addr}) • [View TX](${EXPLORER}/tx/${txHash})`,
        color,
        footer: { text: 'SomniaWatch | Autonomous Security Guardian | Somnia Agentathon 2026' },
        timestamp: new Date().toISOString(),
      }]
    });
    return 'sent';
  } catch (e) { return `error: ${e.message}`; }
}

async function sendTelegram(token, chatId, addr, riskType, riskLevel, receiptId, txHash) {
  if (!token || !chatId) return 'not_configured';
  try {
    const level = riskLevel === 2 ? 'CRITICAL 🚨' : 'SUSPICIOUS ⚠️';
    const r = await httpsPost('api.telegram.org', `/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: `*SOMNIAWATCH ${level}*\n\nContract: \`${addr}\`\nRisk: *${riskType.replace(/_/g, '\\_')}*\nReceipt: \`${receiptId}\`\nTX: \`${txHash}\`\n\n[Explorer](${EXPLORER}/address/${addr})`,
      parse_mode: 'Markdown'
    });
    const parsed = JSON.parse(r.body);
    return parsed.ok ? 'sent' : `failed: ${parsed.description}`;
  } catch (e) { return `error: ${e.message}`; }
}

async function waitForAudit(watch, target, beforeTimestamp, maxWaitMs = 270000) {
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

async function runKeeper() {
  const PRIVATE_KEY      = process.env.PRIVATE_KEY;
  const RPC_URL          = process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network';
  const WATCH_ADDRESS    = process.env.SOMNIAWATCH_ADDRESS;
  const DISCORD_WEBHOOK  = process.env.DISCORD_WEBHOOK  || '';
  const TELEGRAM_TOKEN   = process.env.TELEGRAM_TOKEN   || '';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

  if (!PRIVATE_KEY || !WATCH_ADDRESS) {
    return { ok: false, error: 'Missing PRIVATE_KEY or SOMNIAWATCH_ADDRESS env vars' };
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
  const watch    = new ethers.Contract(WATCH_ADDRESS, WATCH_ABI, signer);

  // --- Pre-flight: get balances WITHOUT calling platform view functions ---
  let registered, contractBal, walletBal;
  try {
    [registered, contractBal, walletBal] = await Promise.all([
      watch.getAllRegistered(),
      watch.contractBalance(),
      provider.getBalance(signer.address),
    ]);
  } catch (e) {
    return { ok: false, error: `Pre-flight RPC error: ${e.message}` };
  }

  console.log(`Registered contracts: ${registered.length}`);
  console.log(`Contract balance: ${ethers.formatEther(contractBal)} STT`);
  console.log(`Wallet balance:   ${ethers.formatEther(walletBal)} STT`);

  if (registered.length === 0) {
    return { ok: true, message: 'No contracts registered yet', contracts_checked: 0 };
  }

  // --- Auto-fund if contract balance is low ---
  let funded = false;
  if (contractBal < MIN_CONTRACT_BALANCE) {
    const topUp = MIN_CONTRACT_BALANCE - contractBal;
    const walletBuffer = ethers.parseEther('0.5');
    if (walletBal > topUp + walletBuffer) {
      try {
        console.log(`Auto-funding: +${ethers.formatEther(topUp)} STT`);
        const tx = await watch.fund({ value: topUp });
        await tx.wait();
        contractBal += topUp;
        funded = true;
        console.log(`Contract funded. Balance now: ${ethers.formatEther(contractBal)} STT`);
      } catch (e) {
        console.warn(`Auto-fund failed: ${e.message}`);
      }
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const results = [];
  let alertsDiscord = 0, alertsTelegram = 0;

  for (const target of registered) {
    try {
      const profile = await watch.registry(target);
      const lastChecked = Number(profile.lastChecked);

      if (now - lastChecked < 300) {
        results.push({ address: target, status: 'skipped_too_soon', wait_seconds: 300 - (now - lastChecked) });
        continue;
      }

      const beforeTime = now;

      // Send JSON_DEPOSIT as msg.value so contract always has enough for JSON step
      // Contract balance covers the LLM step internally
      console.log(`Triggering monitor for ${target}...`);
      const tx = await watch.triggerMonitor(target, { value: JSON_DEPOSIT });
      await tx.wait();
      console.log(`TX sent: ${tx.hash}`);

      // Poll for audit result (agent consensus takes 1-5 min)
      console.log(`Waiting for agent consensus (up to 4.5 min)...`);
      const audit = await waitForAudit(watch, target, beforeTime);

      if (!audit) {
        results.push({ address: target, status: 'timeout_waiting_consensus', txHash: tx.hash,
          note: 'Agent consensus took >4.5min. Result will appear on next keeper run.' });
        continue;
      }

      const riskLevel = Number(audit.riskLevel);
      const riskType  = audit.riskType;
      const receiptId = audit.receiptId.toString();
      const riskLabel = ['SAFE', 'SUSPICIOUS', 'CRITICAL'][riskLevel] || 'UNKNOWN';

      console.log(`Result: ${riskLabel} | Risk: ${riskType} | Receipt: ${receiptId}`);

      let discord = 'skipped', telegram = 'skipped';
      if (riskLevel >= 1) {
        discord  = await sendDiscord(DISCORD_WEBHOOK, target, riskType, riskLevel, receiptId, tx.hash);
        telegram = await sendTelegram(TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, target, riskType, riskLevel, receiptId, tx.hash);
        if (discord  === 'sent') alertsDiscord++;
        if (telegram === 'sent') alertsTelegram++;
      }

      results.push({
        address: target, status: 'completed',
        riskLevel: riskLabel, riskType, receiptId,
        txHash: tx.hash,
        explorerLink: `${EXPLORER}/tx/${tx.hash}`,
        alerts: { discord, telegram },
      });

    } catch (err) {
      const msg = err.message || '';
      let decoded = msg;
      if (msg.includes('Too soon'))          decoded = 'Too soon: 5min cooldown not elapsed';
      else if (msg.includes('Insufficient')) decoded = 'Insufficient SOMI in contract — call fund()';
      else if (msg.includes('not registered')) decoded = 'Contract not registered in SomniaWatch';
      results.push({ address: target, status: 'error', error: decoded });
    }
  }

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    contracts_checked: registered.length,
    wallet_balance_stt: ethers.formatEther(walletBal),
    contract_balance_stt: ethers.formatEther(contractBal),
    auto_funded: funded,
    results,
    alerts_fired: { discord: alertsDiscord, telegram: alertsTelegram },
  };
}

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
