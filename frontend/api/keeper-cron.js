// Vercel Serverless Function + Cron Job
// Runs every day automatically on Vercel (Hobby plan)
// Secrets read from Vercel Environment Variables (never in code)

const https = require('https');

const MOCK_VAULT  = '0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B';
const EXPLORER    = 'https://shannon-explorer.somnia.network';

function httpsPost(hostname, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req  = https.request(
      { hostname, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d })); }
    );
    req.on('error', reject);
    req.write(data); req.end();
  });
}

async function sendDiscord(webhook, contract, riskType) {
  if (!webhook) return 'not_configured';
  try {
    const url  = new URL(webhook);
    const body = {
      embeds: [{
        title: '\uD83D\uDEA8 SOMNIAWATCH - CRITICAL ALERT',
        description:
          `**Contract:** \`${contract}\`\n` +
          `**Risk Pattern:** ${riskType}\n` +
          `**Classification:** CRITICAL\n` +
          `**Mode:** Autonomous Keeper Cron\n` +
          `[View on Explorer](${EXPLORER}/address/${contract})`,
        color: 0xff2200,
        fields: [
          { name: 'Severity',  value: 'CRITICAL',               inline: true },
          { name: 'Pattern',   value: riskType,                 inline: true },
          { name: 'Keeper',    value: 'Vercel Cron Autonomous', inline: true },
        ],
        footer: { text: 'SomniaWatch | Autonomous Security Guardian | Somnia Agentathon 2026' },
        timestamp: new Date().toISOString(),
      }],
    };
    const r = await httpsPost(url.hostname, url.pathname + url.search, body);
    return r.status < 300 ? 'sent' : `failed_${r.status}`;
  } catch (e) { return `error_${e.message}`; }
}

async function sendTelegram(token, chatId, contract, riskType) {
  if (!token || !chatId) return 'not_configured';
  try {
    const text =
      `\uD83D\uDEA8 *SOMNIAWATCH CRITICAL ALERT*\n\n` +
      `Contract: \`${contract}\`\n` +
      `Risk: *${riskType.replace(/_/g, '\\_')}*\n` +
      `Severity: *CRITICAL*\n` +
      `Mode: Autonomous Keeper Cron\n\n` +
      `[View on Explorer](${EXPLORER}/address/${contract})`;
    const r      = await httpsPost('api.telegram.org', `/bot${token}/sendMessage`,
      { chat_id: chatId, text, parse_mode: 'Markdown' });
    const parsed = JSON.parse(r.body);
    return parsed.ok ? 'sent' : `failed: ${parsed.description}`;
  } catch (e) { return `error_${e.message}`; }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ✅ Secrets from Vercel env vars ONLY
  const DISCORD_WEBHOOK  = process.env.DISCORD_WEBHOOK  || '';
  const TELEGRAM_TOKEN   = process.env.TELEGRAM_TOKEN   || '';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

  const contract  = MOCK_VAULT;
  const riskType  = 'batchWithdraw_reentrancy_pattern';
  const timestamp = new Date().toISOString();

  const [discordResult, telegramResult] = await Promise.all([
    sendDiscord(DISCORD_WEBHOOK, contract, riskType),
    sendTelegram(TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, contract, riskType),
  ]);

  const result = {
    ok: true,
    timestamp,
    contract,
    riskLevel: 'CRITICAL',
    alerts: {
      discord:  discordResult,
      telegram: telegramResult,
    },
    env: {
      discord_configured:  !!DISCORD_WEBHOOK,
      telegram_configured: !!TELEGRAM_TOKEN && !!TELEGRAM_CHAT_ID,
    },
  };

  console.log('SomniaWatch Keeper Cron:', JSON.stringify(result));
  return res.status(200).json(result);
}
