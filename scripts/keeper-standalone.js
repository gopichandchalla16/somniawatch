#!/usr/bin/env node
// scripts/keeper-standalone.js
// GitHub Actions standalone keeper — calls triggerMonitor() for all registered
// contracts, polls for consensus, fires alerts based on REAL audit results.
// Exit 0 = success, Exit 1 = failure.

const { ethers } = require('ethers');
const https = require('https');

const WATCH_ABI = [
  'function getAllRegistered() external view returns (address[])',
  'function registry(address) external view returns (address owner, bool isRegistered, bool isFlagged, uint8 riskScore, uint256 lastChecked, uint256 totalChecks, string lastRiskType, uint256 consecutiveSafe)',
  'function triggerMonitor(address target) external payable returns (uint256 requestId)',
  'function getLatestAudit(address target) external view returns (tuple(address target, uint8 riskLevel, string riskType, string reasoning, uint256 timestamp, uint256 receiptId, bool autoActioned))',
  'function depositForJson() external view returns (uint256)',
  'function totalAuditsCompleted() external view returns (uint256)',
];

const EXPLORER = 'https://shannon-explorer.somnia.network';

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

async function sendDiscord(webhook, contractAddr, riskType, riskLevel, receiptId, txHash) {
  if (!webhook) return 'not_configured';
  try {
    const url = new URL(webhook);
    const body = {
      embeds: [{
        title: riskLevel === 2 ? '\uD83D\uDEA8 CRITICAL ALERT — SomniaWatch' : '\u26A0\uFE0F SUSPICIOUS — SomniaWatch',
        description:
          `**Contract:** \`${contractAddr}\`\n**Risk:** ${riskType}\n` +
          `**Receipt:** \`${receiptId}\`\n**TX:** \`${txHash}\`\n` +
          `[Explorer](${EXPLORER}/tx/${txHash})`,
        color: riskLevel === 2 ? 0xff2200 : 0xffaa00,
        footer: { text: 'SomniaWatch GitHub Actions Keeper | Somnia Agentathon 2026' },
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
    const label = riskLevel === 2 ? 'CRITICAL \uD83D\uDEA8' : 'SUSPICIOUS \u26A0\uFE0F';
    const text =
      `*SomniaWatch ${label}*\n\n` +
      `Contract: \`${contractAddr}\`\nRisk: *${riskType.replace(/_/g, '\\_')}*\n` +
      `Receipt: \`${receiptId}\`\n[Explorer](${EXPLORER}/tx/${txHash})`;
    const r = await httpsPost('api.telegram.org', `/bot${token}/sendMessage`,
      { chat_id: chatId, text, parse_mode: 'Markdown' });
    const parsed = JSON.parse(r.body);
    return parsed.ok ? 'sent' : `failed: ${parsed.description}`;
  } catch (e) { return `error_${e.message}`; }
}

async function waitForAudit(watch, target, afterTimestamp, maxMs = 300000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const audit = await watch.getLatestAudit(target);
      if (Number(audit.timestamp) > afterTimestamp) return audit;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 30000));
  }
  return null;
}

function pad(s, n) { return String(s).padEnd(n); }

async function main() {
  const PRIVATE_KEY      = process.env.PRIVATE_KEY;
  const RPC_URL          = process.env.SOMNIA_RPC    || 'https://dream-rpc.somnia.network';
  const WATCH_ADDRESS    = process.env.SOMNIAWATCH_ADDRESS;
  const DISCORD_WEBHOOK  = process.env.DISCORD_WEBHOOK  || '';
  const TELEGRAM_TOKEN   = process.env.TELEGRAM_TOKEN   || '';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

  if (!PRIVATE_KEY)   { console.error('ERROR: PRIVATE_KEY not set'); process.exit(1); }
  if (!WATCH_ADDRESS) { console.error('ERROR: SOMNIAWATCH_ADDRESS not set'); process.exit(1); }

  console.log('\n\uD83D\uDEE1\uFE0F  SomniaWatch Keeper — GitHub Actions');
  console.log(`   RPC:      ${RPC_URL}`);
  console.log(`   Contract: ${WATCH_ADDRESS}`);
  console.log(`   Time:     ${new Date().toISOString()}\n`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
  const watch    = new ethers.Contract(WATCH_ADDRESS, WATCH_ABI, signer);

  const balance     = await provider.getBalance(signer.address);
  const registered  = await watch.getAllRegistered();
  const totalAudits = await watch.totalAuditsCompleted();

  console.log(`   Wallet:   ${signer.address}`);
  console.log(`   Balance:  ${ethers.formatEther(balance)} STT`);
  console.log(`   Total audits completed: ${totalAudits}`);
  console.log(`   Registered contracts: ${registered.length}\n`);

  const now     = Math.floor(Date.now() / 1000);
  const rows    = [];
  let exitCode  = 0;

  for (const target of registered) {
    const profile = await watch.registry(target);
    const lastChecked = Number(profile.lastChecked);

    if (now - lastChecked < 300) {
      rows.push([target, 'SKIPPED', 'too soon', '', '']);
      continue;
    }

    try {
      const deposit = await watch.depositForJson();
      const beforeTime = now;
      const tx = await watch.triggerMonitor(target, { value: deposit });
      console.log(`  \u23F3 triggerMonitor(${target}) \u2192 TX: ${tx.hash}`);
      await tx.wait();
      console.log(`  \u2705 TX confirmed. Waiting for 3-agent consensus...`);

      const audit = await waitForAudit(watch, target, beforeTime);
      if (!audit) {
        rows.push([target, 'TIMEOUT', 'no consensus in 5m', tx.hash, '']);
        continue;
      }

      const riskLevel  = Number(audit.riskLevel);
      const riskLabel  = ['SAFE', 'SUSPICIOUS', 'CRITICAL'][riskLevel] || 'UNKNOWN';
      const riskType   = audit.riskType;
      const receiptId  = audit.receiptId.toString();

      let discord = 'skipped', telegram = 'skipped';
      if (riskLevel >= 1) {
        discord  = await sendDiscord(DISCORD_WEBHOOK, target, riskType, riskLevel, receiptId, tx.hash);
        telegram = await sendTelegram(TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, target, riskType, riskLevel, receiptId, tx.hash);
      }

      rows.push([target, riskLabel, riskType, tx.hash.slice(0, 18) + '...', receiptId.slice(0, 12) + '...']);
      console.log(`  \uD83D\uDCC4 ${target}: ${riskLabel} | receipt=${receiptId} | discord=${discord}`);

    } catch (err) {
      console.error(`  \u274C Error for ${target}: ${err.message}`);
      rows.push([target, 'ERROR', err.message.slice(0, 30), '', '']);
      exitCode = 1;
    }
  }

  console.log('\n\u250C' + '\u2500'.repeat(108) + '\u2510');
  console.log('\u2502 ' + pad('CONTRACT', 44) + pad('RESULT', 12) + pad('RISK TYPE', 22) + pad('TX', 20) + pad('RECEIPT', 14) + ' \u2502');
  console.log('\u251C' + '\u2500'.repeat(108) + '\u2524');
  for (const [c, r, t, tx, rec] of rows) {
    console.log('\u2502 ' + pad(c, 44) + pad(r, 12) + pad(t, 22) + pad(tx, 20) + pad(rec, 14) + ' \u2502');
  }
  console.log('\u2514' + '\u2500'.repeat(108) + '\u2518');
  console.log(`\n  Completed: ${new Date().toISOString()}`);

  process.exit(exitCode);
}

main().catch(e => { console.error(e); process.exit(1); });
