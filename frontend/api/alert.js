// Vercel serverless function: /api/alert
// Proxies Discord + Telegram alerts — secrets from Vercel env vars ONLY

const https = require('https');

function post(hostname, path, body) {
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { contract, riskType } = req.body || {};
  if (!contract) return res.status(400).json({ error: 'contract required' });

  // ✅ Secrets from Vercel env vars — never from request body
  const DISCORD_WEBHOOK  = process.env.DISCORD_WEBHOOK  || '';
  const TELEGRAM_TOKEN   = process.env.TELEGRAM_TOKEN   || '';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

  const explorerLink = `https://shannon-explorer.somnia.network/address/${contract}`;
  const risk = riskType || 'batchWithdraw_reentrancy_pattern';
  const results = {};

  // Discord
  if (DISCORD_WEBHOOK) {
    try {
      const url = new URL(DISCORD_WEBHOOK);
      const embed = {
        title: 'SOMNIAWATCH - CRITICAL ALERT',
        description:
          `**Contract:** \`${contract}\`\n` +
          `**Risk Pattern:** ${risk}\n` +
          `**Classification:** CRITICAL\n` +
          `**Triggered by:** Manual UI test\n` +
          `[View on Explorer](${explorerLink})`,
        color: 0xff2200,
        fields: [
          { name: 'Severity', value: 'CRITICAL', inline: true },
          { name: 'Pattern',  value: risk,        inline: true },
          { name: 'Source',   value: 'SomniaWatch UI', inline: true },
        ],
        footer: { text: 'SomniaWatch | Autonomous Security Guardian | Somnia Agentathon 2026' },
        timestamp: new Date().toISOString(),
      };
      const r = await post(url.hostname, url.pathname + url.search, { embeds: [embed] });
      results.discord = r.status < 300 ? 'sent' : `failed:${r.status}`;
    } catch (e) { results.discord = `error:${e.message}`; }
  } else {
    results.discord = 'not_configured';
  }

  // Telegram
  if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      const text =
        `*SOMNIAWATCH CRITICAL ALERT*\n\n` +
        `Contract: \`${contract}\`\n` +
        `Risk: *${risk.replace(/_/g, '\\_')}*\n` +
        `Severity: *CRITICAL*\n` +
        `Triggered by: Manual UI test\n\n` +
        `[View on Explorer](${explorerLink})`;
      const r = await post('api.telegram.org', `/bot${TELEGRAM_TOKEN}/sendMessage`,
        { chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' });
      const parsed = JSON.parse(r.body);
      results.telegram = parsed.ok ? 'sent' : `failed:${parsed.description}`;
    } catch (e) { results.telegram = `error:${e.message}`; }
  } else {
    results.telegram = 'not_configured';
  }

  return res.status(200).json({ ok: true, results });
}
