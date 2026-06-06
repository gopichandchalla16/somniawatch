// /api/keeper-cron.js — SomniaWatch Autonomous Keeper
// Runs every 6 hours via GitHub Actions. Monitors contracts, fires rich alerts.

const { ethers } = require('ethers');
const https = require('https');

const WATCH_ABI = [
  'function getAllRegistered() external view returns (address[])',
  'function registry(address) external view returns (address owner, bool isRegistered, bool isFlagged, uint8 riskScore, uint256 lastChecked, uint256 totalChecks, string lastRiskType)',
  'function triggerMonitor(address target) external payable returns (uint256 requestId)',
  'function getLatestAudit(address target) external view returns (tuple(address target, uint8 riskLevel, string riskType, string reasoning, uint256 timestamp, uint256 receiptId, bool autoActioned))',
  'function getAuditHistory(address target) external view returns (tuple(address target, uint8 riskLevel, string riskType, string reasoning, uint256 timestamp, uint256 receiptId, bool autoActioned)[])',
  'function contractBalance() external view returns (uint256)',
  'function totalAuditsCompleted() external view returns (uint256)',
  'function fund() external payable',
  'function depositForFullCycle() external pure returns (uint256)',
];

const EXPLORER  = 'https://shannon-explorer.somnia.network';
const JSON_DEPOSIT = ethers.parseEther('0.13');
const LLM_DEPOSIT  = ethers.parseEther('0.25');
const FULL_CYCLE   = JSON_DEPOSIT + LLM_DEPOSIT;  // 0.38 STT per contract
const MIN_BAL      = FULL_CYCLE * 3n;             // keep 3 cycles buffer

// ─── HTTP helper ──────────────────────────────────────────────────────────────
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

// ─── Discord rich embed alert ─────────────────────────────────────────────────
async function sendDiscordAlert(webhook, addr, audit, txHash, runStats) {
  if (!webhook) return 'not_configured';
  try {
    const rl     = Number(audit.riskLevel);
    const isCrit = rl === 2;
    const url    = new URL(webhook);
    const color  = isCrit ? 0xE53935 : rl === 1 ? 0xFB8C00 : 0x43A047;
    const badge  = isCrit ? '🚨 CRITICAL' : rl === 1 ? '⚠️ SUSPICIOUS' : '✅ SAFE';
    const icon   = isCrit ? '🔴' : rl === 1 ? '🟡' : '🟢';

    await httpsPost(url.hostname, url.pathname + url.search, {
      username: 'SomniaWatch',
      avatar_url: 'https://i.imgur.com/8hSHGlH.png',
      embeds: [{
        title: `${icon} SomniaWatch Security Report — ${badge}`,
        description:
          `**Somnia Agentic L1 | Autonomous On-Chain Security Guardian**\n` +
          `Powered by **Qwen3-30B** via 3-validator consensus`,
        color,
        fields: [
          { name: '📋 Monitored Contract', value: `\`${addr}\``, inline: false },
          { name: '🔍 Risk Classification', value: badge, inline: true },
          { name: '⚡ Risk Pattern', value: audit.riskType.replace(/_/g,' '), inline: true },
          { name: '🧠 AI Reasoning', value: audit.reasoning || 'N/A', inline: false },
          { name: '🔗 On-Chain Receipt', value: `\`${audit.receiptId.toString()}\``, inline: true },
          { name: '📦 TX Hash', value: `[${txHash.slice(0,10)}...](${EXPLORER}/tx/${txHash})`, inline: true },
          { name: '📊 Run Stats', value:
            `• Contracts monitored: **${runStats.total}**\n` +
            `• Audits this session: **${runStats.audited}**\n` +
            `• Contract STT balance: **${runStats.contractBal} STT**\n` +
            `• Total audits ever: **${runStats.totalEver}**`, inline: false },
          { name: '🔭 Explorer Links',
            value: `[View Contract](${EXPLORER}/address/${addr}) | [View TX](${EXPLORER}/tx/${txHash})`,
            inline: false },
        ],
        footer: {
          text: `SomniaWatch | Somnia Agentathon 2026 | Every 6 hours | ${new Date().toUTCString()}`
        },
        timestamp: new Date().toISOString(),
      }]
    });
    return 'sent';
  } catch (e) { return `error: ${e.message}`; }
}

// ─── Discord session summary (always sent, even if all safe) ──────────────────
async function sendDiscordSummary(webhook, runStats, results) {
  if (!webhook) return 'not_configured';
  try {
    const url    = new URL(webhook);
    const critCount = results.filter(r => r.riskLabel === 'CRITICAL').length;
    const suspCount = results.filter(r => r.riskLabel === 'SUSPICIOUS').length;
    const safeCount = results.filter(r => r.riskLabel === 'SAFE').length;
    const color  = critCount > 0 ? 0xE53935 : suspCount > 0 ? 0xFB8C00 : 0x1565C0;
    const statusLine = critCount > 0
      ? `🚨 **${critCount} CRITICAL** threat(s) detected and flagged on-chain!`
      : suspCount > 0
      ? `⚠️ **${suspCount} SUSPICIOUS** pattern(s) detected — monitoring closely`
      : `✅ All contracts clear — no threats detected`;

    const resultRows = results.map(r => {
      const icon = r.riskLabel === 'CRITICAL' ? '🔴' : r.riskLabel === 'SUSPICIOUS' ? '🟡' : '🟢';
      return `${icon} \`${r.address.slice(0,10)}...\` → **${r.riskLabel}** (${r.riskType || r.status})`;
    }).join('\n') || 'No contracts processed';

    await httpsPost(url.hostname, url.pathname + url.search, {
      username: 'SomniaWatch',
      avatar_url: 'https://i.imgur.com/8hSHGlH.png',
      embeds: [{
        title: '📡 SomniaWatch — 6-Hour Autonomous Security Report',
        description: statusLine,
        color,
        fields: [
          { name: '📊 Session Summary',
            value:
              `• 🕐 Run time: **${new Date().toUTCString()}**\n` +
              `• 📋 Contracts monitored: **${runStats.total}**\n` +
              `• ✅ SAFE: **${safeCount}** | ⚠️ SUSPICIOUS: **${suspCount}** | 🔴 CRITICAL: **${critCount}**\n` +
              `• 💰 Contract balance: **${runStats.contractBal} STT**\n` +
              `• 🏆 Total audits ever: **${runStats.totalEver}**\n` +
              `• ⏭ Next run: **in ~6 hours**`,
            inline: false },
          { name: '📋 Contract Results', value: resultRows, inline: false },
          { name: '🤖 How it works',
            value:
              'SomniaWatch autonomously fetches transaction data via **JSON API Agent**, ' +
              'classifies threats using **Qwen3-30B LLM Agent**, and stores all results on-chain. ' +
              '3 Somnia validators reach consensus before any action is taken.',
            inline: false },
          { name: '🔗 Dashboard',
            value: `[Somnia Explorer](${EXPLORER}) | [GitHub](https://github.com/gopichandchalla16/somniawatch)`,
            inline: false },
        ],
        footer: { text: 'SomniaWatch | Somnia Agentathon 2026 | Autonomous Security Guardian' },
        timestamp: new Date().toISOString(),
      }]
    });
    return 'sent';
  } catch (e) { return `error: ${e.message}`; }
}

// ─── Telegram alert ────────────────────────────────────────────────────────────
async function sendTelegramAlert(token, chatId, addr, audit, txHash, runStats) {
  if (!token || !chatId) return 'not_configured';
  try {
    const rl     = Number(audit.riskLevel);
    const badge  = rl === 2 ? '🚨 CRITICAL' : rl === 1 ? '⚠️ SUSPICIOUS' : '✅ SAFE';
    const text =
      `*SOMNIAWATCH — ${badge}*\n` +
      `_Somnia Agentathon 2026 | Autonomous Security Guardian_\n\n` +
      `📋 *Contract:* \`${addr}\`\n` +
      `🔍 *Risk:* ${badge}\n` +
      `⚡ *Pattern:* ${audit.riskType.replace(/_/g,' ')}\n` +
      `🧠 *AI Reasoning:* ${audit.reasoning || 'N/A'}\n` +
      `🔗 *Receipt ID:* \`${audit.receiptId.toString()}\`\n` +
      `📦 *TX:* \`${txHash}\`\n\n` +
      `📊 *Session Stats*\n` +
      `• Contracts: ${runStats.total} | Balance: ${runStats.contractBal} STT\n` +
      `• Total audits: ${runStats.totalEver}\n\n` +
      `[Explorer](${EXPLORER}/address/${addr}) | [TX](${EXPLORER}/tx/${txHash})`;
    const r = await httpsPost('api.telegram.org', `/bot${token}/sendMessage`, {
      chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: false
    });
    const parsed = JSON.parse(r.body);
    return parsed.ok ? 'sent' : `failed: ${parsed.description}`;
  } catch (e) { return `error: ${e.message}`; }
}

// ─── Telegram session summary ─────────────────────────────────────────────────
async function sendTelegramSummary(token, chatId, runStats, results) {
  if (!token || !chatId) return 'not_configured';
  try {
    const critCount = results.filter(r => r.riskLabel === 'CRITICAL').length;
    const suspCount = results.filter(r => r.riskLabel === 'SUSPICIOUS').length;
    const safeCount = results.filter(r => r.riskLabel === 'SAFE').length;
    const rows = results.map(r => {
      const icon = r.riskLabel === 'CRITICAL' ? '🔴' : r.riskLabel === 'SUSPICIOUS' ? '🟡' : '🟢';
      return `${icon} \`${r.address.slice(0,10)}...\` → *${r.riskLabel}*`;
    }).join('\n') || 'No results';
    const text =
      `*📡 SomniaWatch — 6-Hour Security Report*\n` +
      `_${new Date().toUTCString()}_\n\n` +
      `${critCount > 0 ? '🚨 CRITICAL threats detected!' : suspCount > 0 ? '⚠️ Suspicious activity!' : '✅ All clear'}\n\n` +
      `📊 *Summary*\n` +
      `• Monitored: ${runStats.total} contracts\n` +
      `• ✅ SAFE: ${safeCount} | ⚠️ SUSP: ${suspCount} | 🔴 CRIT: ${critCount}\n` +
      `• 💰 Balance: ${runStats.contractBal} STT\n` +
      `• 🏆 Total audits: ${runStats.totalEver}\n` +
      `• ⏭ Next: ~6 hours\n\n` +
      `*Results*\n${rows}\n\n` +
      `[Explorer](${EXPLORER}) | [GitHub](https://github.com/gopichandchalla16/somniawatch)`;
    const r = await httpsPost('api.telegram.org', `/bot${token}/sendMessage`, {
      chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: true
    });
    const parsed = JSON.parse(r.body);
    return parsed.ok ? 'sent' : `failed: ${parsed.description}`;
  } catch (e) { return `error: ${e.message}`; }
}

// ─── Poll for audit result ─────────────────────────────────────────────────────
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

// ─── Main keeper logic ─────────────────────────────────────────────────────────
async function runKeeper() {
  const PRIVATE_KEY      = process.env.PRIVATE_KEY;
  const RPC_URL          = process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network';
  const WATCH_ADDRESS    = process.env.SOMNIAWATCH_ADDRESS;
  const DISCORD_WEBHOOK  = process.env.DISCORD_WEBHOOK  || '';
  const TELEGRAM_TOKEN   = process.env.TELEGRAM_TOKEN   || '';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

  if (!PRIVATE_KEY || !WATCH_ADDRESS) {
    return { ok: false, error: 'Missing PRIVATE_KEY or SOMNIAWATCH_ADDRESS env vars in Vercel' };
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
  const watch    = new ethers.Contract(WATCH_ADDRESS, WATCH_ABI, signer);

  // Pre-flight — only safe read calls, no platform calls
  let registered, contractBal, walletBal, totalEver;
  try {
    [registered, contractBal, walletBal, totalEver] = await Promise.all([
      watch.getAllRegistered(),
      watch.contractBalance(),
      provider.getBalance(signer.address),
      watch.totalAuditsCompleted(),
    ]);
  } catch (e) {
    return { ok: false, error: `Pre-flight RPC error: ${e.message}` };
  }

  const contractBalFmt = ethers.formatEther(contractBal);
  const walletBalFmt   = ethers.formatEther(walletBal);
  console.log(`Registered: ${registered.length} | Contract: ${contractBalFmt} STT | Wallet: ${walletBalFmt} STT | Total audits: ${totalEver}`);

  if (registered.length === 0) {
    const summary = { ok: true, message: 'No contracts registered yet — add one via registerContract()', contracts_checked: 0 };
    await sendDiscordSummary(DISCORD_WEBHOOK, { total: 0, contractBal: contractBalFmt, totalEver: totalEver.toString() }, []);
    await sendTelegramSummary(TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, { total: 0, contractBal: contractBalFmt, totalEver: totalEver.toString() }, []);
    return summary;
  }

  // Auto-fund if low
  let funded = false;
  if (contractBal < MIN_BAL) {
    const topUp = MIN_BAL - contractBal;
    if (walletBal > topUp + ethers.parseEther('0.5')) {
      try {
        const tx = await watch.fund({ value: topUp });
        await tx.wait();
        contractBal += topUp;
        funded = true;
        console.log(`Auto-funded +${ethers.formatEther(topUp)} STT. New balance: ${ethers.formatEther(contractBal)} STT`);
      } catch (e) { console.warn('Auto-fund failed:', e.message); }
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const results = [];
  let alertsD = 0, alertsT = 0;

  for (const target of registered) {
    try {
      const profile = await watch.registry(target);
      const lastChecked = Number(profile.lastChecked);

      if (now - lastChecked < 300) {
        results.push({ address: target, status: 'skipped_too_soon',
          riskLabel: null, riskType: 'cooldown',
          wait_seconds: 300 - (now - lastChecked) });
        continue;
      }

      const beforeTime = now;
      console.log(`Triggering monitor: ${target}`);
      const tx = await watch.triggerMonitor(target, { value: JSON_DEPOSIT });
      await tx.wait();
      console.log(`TX: ${tx.hash}`);

      const audit = await waitForAudit(watch, target, beforeTime);

      if (!audit) {
        results.push({ address: target, status: 'timeout_waiting_consensus',
          riskLabel: 'PENDING', riskType: 'timeout', txHash: tx.hash,
          note: 'Agents took >4.5min. Check next run or explorer.' });
        continue;
      }

      const rl        = Number(audit.riskLevel);
      const riskLabel = ['SAFE','SUSPICIOUS','CRITICAL'][rl] || 'UNKNOWN';
      const riskType  = audit.riskType;
      const receiptId = audit.receiptId.toString();
      const txHash    = tx.hash;

      console.log(`Result: ${riskLabel} | ${riskType} | Receipt: ${receiptId}`);

      const runStats = {
        total:       registered.length,
        audited:     results.filter(r=>r.status==='completed').length + 1,
        contractBal: ethers.formatEther(contractBal),
        totalEver:   (BigInt(totalEver) + BigInt(results.filter(r=>r.status==='completed').length + 1)).toString(),
      };

      let discord = 'skipped', telegram = 'skipped';
      // Always send individual alert for SUSPICIOUS or CRITICAL
      if (rl >= 1) {
        discord  = await sendDiscordAlert(DISCORD_WEBHOOK, target, audit, txHash, runStats);
        telegram = await sendTelegramAlert(TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, target, audit, txHash, runStats);
        if (discord  === 'sent') alertsD++;
        if (telegram === 'sent') alertsT++;
      }

      results.push({
        address: target, status: 'completed',
        riskLevel: rl, riskLabel, riskType,
        reasoning: audit.reasoning,
        receiptId, txHash,
        autoActioned: audit.autoActioned,
        explorerTx: `${EXPLORER}/tx/${txHash}`,
        explorerContract: `${EXPLORER}/address/${target}`,
        alerts: { discord, telegram },
      });

    } catch (err) {
      const msg = err.message || '';
      let decoded = msg;
      if (msg.includes('Too soon'))           decoded = '5min cooldown not elapsed';
      else if (msg.includes('Insufficient'))  decoded = 'Contract needs more STT — call fund()';
      else if (msg.includes('not registered'))decoded = 'Contract not registered';
      results.push({ address: target, status: 'error', riskLabel: 'ERROR', riskType: 'error', error: decoded });
    }
  }

  // Always send a 6-hour session summary to both channels
  const runStats = {
    total:       registered.length,
    contractBal: ethers.formatEther(contractBal),
    totalEver:   totalEver.toString(),
  };
  const summaryD = await sendDiscordSummary(DISCORD_WEBHOOK, runStats, results);
  const summaryT = await sendTelegramSummary(TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, runStats, results);

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    contracts_checked: registered.length,
    wallet_balance_stt: walletBalFmt,
    contract_balance_stt: contractBalFmt,
    auto_funded: funded,
    results,
    alerts_fired: { discord_individual: alertsD, telegram_individual: alertsT },
    session_summary_sent: { discord: summaryD, telegram: summaryT },
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
