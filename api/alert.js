// /api/alert.js — Alert system status check + manual trigger
// GET: returns alert system health (Discord + Telegram webhook status)
// POST: fires a test alert to both channels

const DISCORD_URL    = process.env.DISCORD_WEBHOOK_URL;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID;

async function sendDiscord(msg) {
  if (!DISCORD_URL) return false;
  try {
    const r = await fetch(DISCORD_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: msg }),
    });
    return r.ok;
  } catch { return false; }
}

async function sendTelegram(msg) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text: msg, parse_mode: 'Markdown' }),
    });
    return r.ok;
  } catch { return false; }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const discordConfigured  = !!DISCORD_URL;
  const telegramConfigured = !!(TELEGRAM_TOKEN && TELEGRAM_CHAT);

  if (req.method === 'GET') {
    // Health check — don’t fire a real alert, just report config status
    return res.status(200).json({
      ok:       true,
      message:  'Alert system operational',
      discord:  discordConfigured,
      telegram: telegramConfigured,
      channels: (discordConfigured ? 1 : 0) + (telegramConfigured ? 1 : 0),
      hint:     discordConfigured || telegramConfigured
        ? 'Both channels configured. POST to this endpoint to fire a test alert.'
        : 'No webhook env vars set — alerts will log locally only.',
    });
  }

  if (req.method === 'POST') {
    const msg = `🛡️ **SomniaWatch — Test Alert** \`${new Date().toISOString()}\`
This is a manual test from the Force Audit panel.
If you see this, Discord/Telegram alerts are working correctly.
⚡ [Live App](https://somniawatch-eight.vercel.app) | [🔗 Contract](https://shannon-explorer.somnia.network/address/0xaca28071870080421206831D2F9EBd3E97CcdFd1)`;

    const [dOk, tOk] = await Promise.all([sendDiscord(msg), sendTelegram(msg)]);

    return res.status(200).json({
      ok:       true,
      discord:  dOk,
      telegram: tOk,
      message:  `Test alert sent — Discord: ${dOk ? '✅' : '❌'} | Telegram: ${tOk ? '✅' : '❌'}`,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(405).json({ error: 'GET or POST only' });
};
