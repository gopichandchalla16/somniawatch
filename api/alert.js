// /api/alert.js — ROOT level, Vercel detects this as serverless function
const https = require('https');

function post(hostname, path, body) {
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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { contract, riskType } = req.body || {};
  if (!contract) return res.status(400).json({ error: 'contract required' });

  const DISCORD_WEBHOOK  = process.env.DISCORD_WEBHOOK  || '';
  const TELEGRAM_TOKEN   = process.env.TELEGRAM_TOKEN   || '';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

  const explorerLink = `https://shannon-explorer.somnia.network/address/${contract}`;
  const risk = riskType || 'batchWithdraw_reentrancy_pattern';
  const results = {};

  if (DISCORD_WEBHOOK) {
    try {
      const url = new URL(DISCORD_WEBHOOK);
      const r   = await post(url.hostname, url.pathname + url.search, {
        embeds: [{
          title: '\uD83D\uDEA8 SOMNIAWATCH - CRITICAL ALERT',
          description: `**Contract:** \`${contract}\`\n**Risk:** ${risk}\n[View on Explorer](${explorerLink})`,
          color: 0xff2200,
          timestamp: new Date().toISOString(),
        }],
      });
      results.discord = r.status < 300 ? 'sent' : `failed:${r.status}`;
    } catch (e) { results.discord = `error:${e.message}`; }
  } else { results.discord = 'not_configured'; }

  if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      const text = `\uD83D\uDEA8 *SOMNIAWATCH ALERT*\nContract: \`${contract}\`\nRisk: *${risk.replace(/_/g, '\\_')}*\n[Explorer](${explorerLink})`;
      const r    = await post('api.telegram.org', `/bot${TELEGRAM_TOKEN}/sendMessage`,
        { chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' });
      const p    = JSON.parse(r.body);
      results.telegram = p.ok ? 'sent' : `failed:${p.description}`;
    } catch (e) { results.telegram = `error:${e.message}`; }
  } else { results.telegram = 'not_configured'; }

  return res.status(200).json({ ok: true, results });
};
