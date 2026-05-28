// Vercel serverless function: /api/alert
// Proxies Discord + Telegram alerts from the browser (bypasses CORS)

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

  const { contract, riskType, level, discordWebhook, telegramToken, telegramChatId } = req.body || {};
  if (!contract) return res.status(400).json({ error: 'contract required' });

  const explorerLink = `https://shannon-explorer.somnia.network/address/${contract}`;
  const results = {};

  // Discord
  if (discordWebhook) {
    try {
      const url = new URL(discordWebhook);
      const embed = {
        title: 'SOMNIAWATCH - CRITICAL ALERT',
        description:
          `**Contract:** \`${contract}\`\n` +
          `**Risk Pattern:** ${riskType || 'batchWithdraw_reentrancy_pattern'}\n` +
          `**Classification:** CRITICAL\n` +
          `**Triggered by:** Manual UI test\n` +
          `[View on Explorer](${explorerLink})`,
        color: 0xff2200,
        fields: [
          { name: 'Severity', value: 'CRITICAL', inline: true },
          { name: 'Pattern', value: riskType || 'reentrancy', inline: true },
          { name: 'Source', value: 'SomniaWatch UI', inline: true },
        ],
        footer: { text: 'SomniaWatch | Autonomous Security Guardian | Somnia Agentathon 2026' },
        timestamp: new Date().toISOString(),
      };
      const r = await post(url.hostname, url.pathname + url.search, { embeds: [embed] });
      results.discord = r.status < 300 ? 'sent' : `failed:${r.status}`;
    } catch (e) { results.discord = `error:${e.message}`; }
  }

  // Telegram
  if (telegramToken && telegramChatId) {
    try {
      const text =
        `*SOMNIAWATCH CRITICAL ALERT*\n\n` +
        `Contract: \`${contract}\`\n` +
        `Risk: *${riskType || 'batchWithdraw\_reentrancy\_pattern'}*\n` +
        `Severity: *CRITICAL*\n` +
        `Triggered by: Manual UI test\n\n` +
        `[View on Explorer](${explorerLink})`;
      const r = await post('api.telegram.org', `/bot${telegramToken}/sendMessage`,
        { chat_id: telegramChatId, text, parse_mode: 'Markdown' });
      const parsed = JSON.parse(r.body);
      results.telegram = parsed.ok ? 'sent' : `failed:${parsed.description}`;
    } catch (e) { results.telegram = `error:${e.message}`; }
  }

  return res.status(200).json({ ok: true, results });
}
