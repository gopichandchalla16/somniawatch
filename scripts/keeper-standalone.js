#!/usr/bin/env node
// scripts/keeper-standalone.js
// Standalone Node.js keeper — run by GitHub Actions every 6 hours
// Usage: node scripts/keeper-standalone.js

require('dotenv').config();
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
      { hostname, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d })); }
    );
    req.on('error', reject);
    req.write(data); req.end();
  });
}

async function sendDiscord(webhook, target, riskType, riskLevel, receiptId, txHash) {
  if (!webhook) return 'not_configured';
  try {
    const url = new URL(webhook);
    const color = riskLevel === 2 ? 0xff2200 : 0xffaa00;
    await httpsPost(url.hostname, url.pathname + url.search, {
      embeds: [{
        title: riskLevel === 2 ? '🚨 SOMNIAWATCH — CRITICAL ALERT' : '⚠️ SOMNIAWATCH — SUSPICIOUS ACTIVITY',
        description:
          `**Contract:** \`${target}\`\n` +
          `**Risk Pattern:** ${riskType}\n` +
          `**Receipt ID:** \`${receiptId}\`\n` +
          `**TX Hash:** \`${txHash}\`\n\n` +
          `[View Contract](${EXPLORER}/address/${target}) • [View TX](${EXPLORER}/tx/${txHash})`,
        color,
        footer: { text: 'SomniaWatch GitHub Actions Keeper | Somnia Agentathon 2026' },
        timestamp: new Date().toISOString(),
      }]
    });
    return 'sent';
  } catch (e) { return `error: ${e.message}`; }
}

async function sendTelegram(token, chatId, target, riskType, riskLevel, receiptId, txHash) {
  if (!token || !chatId) return 'not_configured';
  try {
    const level = riskLevel === 2 ? 'CRITICAL 🚨' : 'SUSPICIOUS ⚠️';
    await httpsPost('api.telegram.org', `/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: `*SOMNIAWATCH ${level}*\n\nContract: \`${target}\`\nRisk: *${riskType}*\nReceipt: \`${receiptId}\`\nTX: \`${txHash}\`\n\n[Explorer](${EXPLORER}/address/${target})`,
      parse_mode: 'Markdown'
    });
    return 'sent';
  } catch (e) { return `error: ${e.message}`; }
}

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

async function main() {
  const PRIVATE_KEY      = process.env.PRIVATE_KEY;
  const RPC_URL          = process.env.SOMNIA_RPC || 'https://dream-rpc.somnia.network';
  const WATCH_ADDRESS    = process.env.SOMNIAWATCH_ADDRESS;
  const DISCORD_WEBHOOK  = process.env.DISCORD_WEBHOOK || '';
  const TELEGRAM_TOKEN   = process.env.TELEGRAM_TOKEN  || '';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

  if (!PRIVATE_KEY || !WATCH_ADDRESS) {
    console.error('❌ Missing PRIVATE_KEY or SOMNIAWATCH_ADDRESS');
    process.exit(1);
  }

  console.log('\n🔍 SomniaWatch Keeper — Starting...');
  console.log(`📡 RPC: ${RPC_URL}`);
  console.log(`📜 Contract: ${WATCH_ADDRESS}\n`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
  const watch    = new ethers.Contract(WATCH_ADDRESS, WATCH_ABI, signer);

  let registered;
  try {
    registered = await watch.getAllRegistered();
  } catch (e) {
    console.error('❌ Failed to fetch registered contracts:', e.message);
    process.exit(1);
  }

  console.log(`📋 Registered contracts: ${registered.length}`);
  if (registered.length === 0) {
    console.log('ℹ️  No contracts registered. Done.');
    process.exit(0);
  }

  const now     = Math.floor(Date.now() / 1000);
  const results = [];
  const rows    = [];

  for (const target of registered) {
    console.log(`\n⚙️  Processing: ${target}`);
    try {
      const profile     = await watch.registry(target);
      const lastChecked = Number(profile.lastChecked);

      if (now - lastChecked < 300) {
        console.log(`   ⏩ Skipped — checked ${now - lastChecked}s ago (min 5 min)`);
        results.push({ address: target, status: 'skipped_too_soon' });
        rows.push([target.slice(0, 10) + '...', 'SKIPPED', '-', '-']);
        continue;
      }

      const deposit    = await watch.depositForJson();
      const beforeTime = Math.floor(Date.now() / 1000);

      console.log(`   💰 Depositing ${ethers.formatEther(deposit)} STT...`);
      const tx = await watch.triggerMonitor(target, { value: deposit });
      console.log(`   📤 TX sent: ${tx.hash}`);
      await tx.wait();
      console.log(`   ✅ TX confirmed`);
      console.log(`   ⏳ Waiting for agent consensus (up to 5 min)...`);

      const audit = await waitForAudit(watch, target, beforeTime, 300000);
      if (!audit) {
        console.log(`   ⏰ Timeout — no consensus within 5 min`);
        results.push({ address: target, status: 'timeout', txHash: tx.hash });
        rows.push([target.slice(0, 10) + '...', 'TIMEOUT', tx.hash.slice(0, 10) + '...', '-']);
        continue;
      }

      const riskLevel  = Number(audit.riskLevel);
      const riskType   = audit.riskType;
      const receiptId  = audit.receiptId.toString();
      const txHash     = tx.hash;
      const riskLabels = ['SAFE ✅', 'SUSPICIOUS ⚠️', 'CRITICAL 🚨'];

      console.log(`   🎯 Result: ${riskLabels[riskLevel]} — ${riskType}`);
      console.log(`   🧾 Receipt: ${receiptId}`);

      let discord = 'skipped', telegram = 'skipped';
      if (riskLevel >= 1) {
        discord  = await sendDiscord(DISCORD_WEBHOOK, target, riskType, riskLevel, receiptId, txHash);
        telegram = await sendTelegram(TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, target, riskType, riskLevel, receiptId, txHash);
        console.log(`   📣 Discord: ${discord} | Telegram: ${telegram}`);
      }

      results.push({ address: target, status: 'completed', riskLevel: riskLabels[riskLevel], riskType, receiptId, txHash });
      rows.push([target.slice(0, 10) + '...', riskLabels[riskLevel], txHash.slice(0, 10) + '...', receiptId.slice(0, 10) + '...']);

    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
      results.push({ address: target, status: 'error', error: err.message });
      rows.push([target.slice(0, 10) + '...', 'ERROR', '-', err.message.slice(0, 20)]);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESULTS TABLE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('CONTRACT       STATUS          TX HASH        RECEIPT');
  rows.forEach(r => console.log(r.join('  |  ')));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const failed = results.filter(r => r.status === 'error' || r.status === 'timeout');
  if (failed.length === results.length && results.length > 0) {
    console.error('❌ All contracts failed. Exiting with code 1.');
    process.exit(1);
  }

  console.log('✅ Keeper run complete.');
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
