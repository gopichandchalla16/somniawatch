// /api/alert.js — Alert system status check + manual trigger
// GET: returns alert system health (Discord + Telegram webhook status)
// POST: fires a test alert to both channels
//
// Env vars (matching Vercel project exactly):
//   DISCORD_WEBHOOK      — Discord webhook URL
//   TELEGRAM_TOKEN       — Telegram bot token
//   TELEGRAM_CHAT_ID     — Telegram chat ID

const DISCORD_URL    = process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN  || process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID;

async function sendDiscord(msg) {
  if (!DISCORD_URL) return false;
  try {
    const r = await fetch(DISCORD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'SomniaWatch 🛡️',
        content: msg,
        embeds: [{
          title: '🛡️ SomniaWatch Security Alert',
          color: 0xf43f5e,
          fields: [
            { name: 'Network', value: 'Somnia Shannon Testnet (50312)', inline: true },
            { name: 'Contract', value: '0xaca28071...CcdFd1', inline: true },
            { name: 'Pipeline', value: 'fetchString → inferString → Sphinx', inline: false },
          ],
          footer: { text: 'Powered by Somnia Agentic L1 · inferString(Qwen3-30B)' },
          timestamp: new Date().toISOString(),
        }],
      }),
    });
    return r.ok;
  } catch (e) {
    console.error('[alert] Discord error:', e.message);
    return false;
  }
}

async function sendTelegram(msg) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT,
        text: msg,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
    });
    const data = await r.json();
    if (!r.ok) console.error('[alert] Telegram error:', JSON.stringify(data));
    return r.ok;
  } catch (e) {
    console.error('[alert] Telegram error:', e.message);
    return false;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const discordConfigured  = !!DISCORD_URL;
  const telegramConfigured = !!(TELEGRAM_TOKEN && TELEGRAM_CHAT);

  if (req.method === 'GET') {
    return res.status(200).json({
      ok:       true,
      message:  'Alert system operational',
      discord:  discordConfigured,
      telegram: telegramConfigured,
      channels: (discordConfigured ? 1 : 0) + (telegramConfigured ? 1 : 0),
      envCheck: {
        DISCORD_WEBHOOK:  discordConfigured,
        TELEGRAM_TOKEN:   !!TELEGRAM_TOKEN,
        TELEGRAM_CHAT_ID: !!TELEGRAM_CHAT,
      },
      hint: discordConfigured || telegramConfigured
        ? 'Channels configured ✅ POST to this endpoint to fire a test alert.'
        : 'Env vars missing. Check DISCORD_WEBHOOK and TELEGRAM_TOKEN in Vercel.',
    });
  }

  if (req.method === 'POST') {
    const { riskLabel, contract, riskType, agentCalls, costSTT, txHash } = req.body || {};
    const isTest = !riskLabel;

    const discordMsg = isTest
      ? `🛡️ **SomniaWatch — Test Alert** \`${new Date().toISOString()}\`\nAlert system is working correctly. Both Discord and Telegram are live.\n\n⚡ [Live App](https://somniawatch-eight.vercel.app) | [🔗 Shannon Explorer](https://shannon-explorer.somnia.network/address/0xaca28071870080421206831D2F9EBd3E97CcdFd1)`
      : `${ riskLabel === 'CRITICAL' ? '🔴' : '🟡' } **SomniaWatch — ${riskLabel} Alert**\n⏰ \`${new Date().toISOString()}\`\n📍 Contract: \`${contract || 'N/A'}\`\n⚠️ Risk Type: \`${riskType || 'unknown'}\`\n🤖 Agent Calls: ${agentCalls || 2} | Cost: ${costSTT || '0.38'} STT\n${txHash ? `🔗 [On-chain Receipt](https://shannon-explorer.somnia.network/tx/${txHash})` : ''}`;

    const telegramMsg = isTest
      ? `🛡️ *SomniaWatch \u2014 Test Alert*
\`${new Date().toISOString()}\`

Alert system is working correctly\!
⚡ [Live App](https://somniawatch\-eight\.vercel\.app)`
      : `${riskLabel === 'CRITICAL' ? '🔴' : '🟡'} *SomniaWatch \u2014 ${riskLabel} Alert*
⏰ \`${new Date().toISOString()}\`
📍 Contract: \`${contract || 'N/A'}\`
⚠️ Risk: \`${riskType || 'unknown'}\`
🤖 Agent calls: ${agentCalls || 2} \| Cost: ${costSTT || '0\.38'} STT`;

    const [dOk, tOk] = await Promise.all([
      sendDiscord(discordMsg),
      sendTelegram(telegramMsg),
    ]);

    return res.status(200).json({
      ok:        true,
      discord:   dOk,
      telegram:  tOk,
      message:   `Alert sent — Discord: ${dOk ? '✅' : '❌'} | Telegram: ${tOk ? '✅' : '❌'}`,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(405).json({ error: 'GET or POST only' });
};
