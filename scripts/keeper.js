// scripts/keeper.js
// Autonomous monitoring keeper + Public Audit API server
// Run: node scripts/keeper.js

require('dotenv').config();
const { ethers } = require('ethers');
const http        = require('http');
const SomniaWatchABI = require('../frontend/src/abi/SomniaWatch.json');

// ── Config ────────────────────────────────────────────────────────────
const RPC              = process.env.SOMNIA_RPC        || 'https://dream-rpc.somnia.network';
const PK               = process.env.PRIVATE_KEY;
const WATCH            = process.env.SOMNIAWATCH_ADDRESS;
const DISCORD_WEBHOOK  = process.env.DISCORD_WEBHOOK  || '';
const TELEGRAM_TOKEN   = process.env.TELEGRAM_TOKEN   || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const API_PORT         = parseInt(process.env.API_PORT || '3001', 10);
const EXPLORER         = 'https://shannon-explorer.somnia.network';
const INTERVAL         = 5 * 60 * 1000;
const MIN_GAP          = 295;

if (!PK)    { console.error('PRIVATE_KEY missing from .env'); process.exit(1); }
if (!WATCH) { console.error('SOMNIAWATCH_ADDRESS missing from .env'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
const ts    = ()  => new Date().toISOString().slice(11, 19);
const short = a   => `${a.slice(0,10)}...${a.slice(-4)}`;

// ── In-memory audit cache (for public API) ────────────────────────────
const auditCache = {};

// ── Alert Helpers ─────────────────────────────────────────────────────
async function sendDiscordAlert(message) {
  if (!DISCORD_WEBHOOK) return;
  try {
    const body = JSON.stringify({
      embeds: [{
        title: 'SomniaWatch CRITICAL ALERT',
        description: message,
        color: 0xff0000,
        footer: { text: 'SomniaWatch | Somnia Agentathon 2026' }
      }]
    });
    const url  = new URL(DISCORD_WEBHOOK);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    await new Promise((resolve, reject) => {
      const req = require('https').request(opts, resolve);
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    console.log(`[${ts()}]   Discord alert sent`);
  } catch (e) {
    console.warn(`[${ts()}]   Discord alert failed: ${e.message}`);
  }
}

async function sendTelegramAlert(message) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    const body = JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' });
    const opts = {
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    await new Promise((resolve, reject) => {
      const req = require('https').request(opts, resolve);
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    console.log(`[${ts()}]   Telegram alert sent`);
  } catch (e) {
    console.warn(`[${ts()}]   Telegram alert failed: ${e.message}`);
  }
}

// ── Public Audit API (HTTP server) ────────────────────────────────────
function startApiServer() {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.url === '/health') {
      res.writeHead(200);
      return res.end(JSON.stringify({ status: 'ok', keeper: 'running', timestamp: Date.now() }));
    }

    if (req.url === '/api/leaderboard') {
      const entries = Object.entries(auditCache)
        .map(([address, records]) => ({
          address,
          totalChecks: records.length,
          safeCount: records.filter(r => r.riskLevel === 'SAFE').length,
          latestRisk: records[records.length - 1]?.riskLevel || 'UNKNOWN',
          isFlagged: records[records.length - 1]?.riskLevel === 'CRITICAL'
        }))
        .sort((a, b) => b.safeCount - a.safeCount);
      res.writeHead(200);
      return res.end(JSON.stringify({ entries, updatedAt: Date.now() }));
    }

    const match = req.url.match(/^\/api\/audits\/([0-9a-fA-Fx]+)$/);
    if (match) {
      const addr = match[1].toLowerCase();
      const records = auditCache[addr] || [];
      res.writeHead(200);
      return res.end(JSON.stringify({ address: addr, audits: records, count: records.length }));
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found', routes: ['/health', '/api/leaderboard', '/api/audits/:address'] }));
  });

  server.listen(API_PORT, () => {
    console.log(`[${ts()}]   Public Audit API running at http://localhost:${API_PORT}`);
    console.log(`[${ts()}]   Routes: /health | /api/leaderboard | /api/audits/:address`);
  });
}

// ── Main Keeper ───────────────────────────────────────────────────────
async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const signer   = new ethers.Wallet(PK.startsWith('0x') ? PK : `0x${PK}`, provider);
  const watch    = new ethers.Contract(WATCH, SomniaWatchABI, signer);

  const walletBal = await provider.getBalance(signer.address);

  console.log('\n============================================');
  console.log('  SomniaWatch Keeper - AUTONOMOUS MODE');
  console.log('============================================');
  console.log(`  Wallet:    ${signer.address}`);
  console.log(`  Balance:   ${ethers.formatEther(walletBal)} STT`);
  console.log(`  Contract:  ${WATCH}`);
  console.log(`  Discord:   ${DISCORD_WEBHOOK ? 'configured' : 'not set'}`);
  console.log(`  Telegram:  ${TELEGRAM_TOKEN ? 'configured' : 'not set'}`);
  console.log(`  API Port:  ${API_PORT}`);
  console.log('============================================\n');

  // ── Event listeners (for real-time logging + alerts) ────────────────
  watch.on('RiskClassified', async (target, riskLevel, riskType, receiptId) => {
    const labels = ['SAFE', 'SUSPICIOUS', 'CRITICAL'];
    const level  = Number(riskLevel);
    const label  = labels[level] || 'UNKNOWN';

    console.log(`[${ts()}]   ${label.padEnd(10)} | ${riskType.padEnd(20)} | ${short(target)} | receipt: ${receiptId.toString().slice(0,12)}...`);

    // Cache for public API
    const addr = target.toLowerCase();
    if (!auditCache[addr]) auditCache[addr] = [];
    auditCache[addr].push({
      riskLevel: label,
      riskType,
      receiptId: receiptId.toString(),
      timestamp: Date.now(),
      explorerLink: `${EXPLORER}/tx/${receiptId.toString()}`
    });

    // Alert on CRITICAL
    if (level === 2) {
      const msg = `CRITICAL risk detected on ${target}\nRisk Type: ${riskType}\nReceipt: ${EXPLORER}/tx/${receiptId.toString()}`;
      await sendDiscordAlert(msg);
      await sendTelegramAlert(`*CRITICAL ALERT*\nContract: \`${target}\`\nRisk: ${riskType}\n[View Receipt](${EXPLORER}/tx/${receiptId.toString()})`);
    }
  });

  watch.on('ContractFlagged', (target, riskType, receiptId) => {
    console.log(`\n[${ts()}]   CONTRACT FLAGGED: ${short(target)} | ${riskType} | receipt: ${receiptId.toString().slice(0,12)}...\n`);
  });

  watch.on('MonitorTriggered', (target, requestId, deposit) => {
    console.log(`[${ts()}]   Agent request sent for ${short(target)} | deposit: ${ethers.formatEther(deposit)} STT`);
  });

  watch.on('AgentCallFailed', (target, requestId, reason) => {
    console.warn(`[${ts()}]   Agent call failed for ${short(target)}: ${reason}`);
  });

  // ── Keeper cycle ─────────────────────────────────────────────────────
  async function runCycle() {
    console.log(`\n[${ts()}] --- Keeper cycle starting ---`);

    try {
      let contracts;
      try {
        contracts = await watch.getAllRegistered();
      } catch (e) {
        console.error(`[${ts()}]   Cannot read registered contracts: ${e.message}`);
        return;
      }

      console.log(`[${ts()}]   Registered contracts: ${contracts.length}`);
      if (contracts.length === 0) {
        console.log(`[${ts()}]   No contracts registered yet.`);
        return;
      }

      let contractBal;
      try {
        contractBal = await watch.contractBalance();
        console.log(`[${ts()}]   Contract balance: ${ethers.formatEther(contractBal)} STT`);
      } catch {
        contractBal = ethers.parseEther('1');
      }

      let cycleCost;
      try {
        cycleCost = await watch.depositForFullCycle();
        console.log(`[${ts()}]   Cost per cycle: ${ethers.formatEther(cycleCost)} STT`);
      } catch {
        console.warn(`[${ts()}]   depositForFullCycle() reverted - using fallback 0.36 STT`);
        cycleCost = ethers.parseEther('0.36');
      }

      if (contractBal < cycleCost) {
        console.warn(`[${ts()}]   Insufficient balance. Fund contract at ${WATCH}`);
        return;
      }

      const now = Math.floor(Date.now() / 1000);

      for (const addr of contracts) {
        try {
          const profile   = await watch.registry(addr);
          const lastCheck = Number(profile.lastChecked);
          const timeSince = lastCheck > 0 ? now - lastCheck : Infinity;

          if (timeSince < MIN_GAP) {
            console.log(`[${ts()}]   ${short(addr)} checked ${timeSince}s ago - skipping (need 300s)`);
            continue;
          }

          console.log(`[${ts()}]   Triggering monitor for ${short(addr)}...`);

          let deposit;
          try {
            deposit = await watch.depositForJson();
          } catch {
            deposit = ethers.parseEther('0.12');
          }

          const tx = await watch.triggerMonitor(addr, {
            value: deposit,
            gasLimit: 600_000
          });
          const receipt = await tx.wait();
          console.log(`[${ts()}]   Triggered OK - tx: ${receipt.hash}`);
          console.log(`[${ts()}]   Explorer: ${EXPLORER}/tx/${receipt.hash}`);

          await sleep(2000);

        } catch (err) {
          const msg = err.message || '';
          if (msg.includes('Too soon'))          console.log(`[${ts()}]   ${short(addr)} - cooldown active, skip`);
          else if (msg.includes('Insufficient')) console.warn(`[${ts()}]   ${short(addr)} - needs more STT funding`);
          else if (msg.includes('require(false)') || msg.includes('CALL_EXCEPTION')) {
            console.warn(`[${ts()}]   ${short(addr)} - platform not live yet, will retry`);
          } else {
            console.error(`[${ts()}]   Error for ${short(addr)}: ${msg.slice(0, 120)}`);
          }
        }
      }
    } catch (err) {
      console.error(`[${ts()}]   Cycle error: ${err.message}`);
    }

    console.log(`[${ts()}] --- Cycle complete. Next in 5 min ---\n`);
  }

  startApiServer();
  await runCycle();
  setInterval(runCycle, INTERVAL);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
