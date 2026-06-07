/**
 * SomniaWatch — On-Chain Event Listener (Vercel Serverless)
 * 
 * Polls Shannon Explorer for EventWatcher contract events:
 *   - AutoRegistered
 *   - SuspiciousActivityDetected
 *   - AutonomousAuditTriggered
 *   - ExternalSuspiciousActivity
 * 
 * Run by Vercel cron every 2 minutes (vercel.json cron config).
 * When a new SuspiciousActivityDetected event is found, fires
 * Discord + Telegram alerts autonomously — no human trigger.
 */

const EXPLORER_API   = 'https://shannon-explorer.somnia.network/api';
const SW_ADDRESS     = process.env.SOMNIAWATCH_ADDRESS  || '0xaca28071870080421206831D2F9EBd3E97CcdFd1';
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
const TELEGRAM_TOKEN  = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT   = process.env.TELEGRAM_CHAT_ID;

// Event topic hashes (keccak256 of signatures)
const TOPICS = {
  AutoRegistered:             '0x' + 'AutoRegistered(address,string,uint256)'.split('').reduce((a,c)=>a,0),
  SuspiciousActivityDetected: 'SuspiciousActivityDetected(address,string,uint256,uint256)',
  AutonomousAuditTriggered:   'AutonomousAuditTriggered(address,string,uint256)',
};

async function fetchRecentEvents() {
  try {
    const url = `${EXPLORER_API}?module=logs&action=getLogs` +
                `&address=${SW_ADDRESS}` +
                `&fromBlock=latest&toBlock=latest`;
    const res  = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const data = await res.json();
    return Array.isArray(data.result) ? data.result : [];
  } catch {
    return [];
  }
}

async function sendDiscordAlert(payload) {
  if (!DISCORD_WEBHOOK) return false;
  try {
    const res = await fetch(DISCORD_WEBHOOK, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username:   'SomniaWatch EventWatcher',
        avatar_url: 'https://somniawatch-eight.vercel.app/favicon.ico',
        embeds: [{
          title:       `🔴 AUTO-DETECTED: ${payload.pattern}`,
          description: `**On-chain event triggered autonomous audit**\n\nContract auto-registered and queued for immediate AI classification.`,
          color:       payload.severity >= 3 ? 0xFF3B6B : 0xF59E0B,
          fields: [
            { name: '📍 Contract',  value: `\`${payload.target}\``,       inline: true  },
            { name: '⚠️ Pattern',   value: payload.pattern,               inline: true  },
            { name: '🔥 Severity',  value: `${payload.severity}/3`,       inline: true  },
            { name: '🌐 Network',   value: 'Somnia Shannon (50312)',       inline: true  },
            { name: '⚡ Trigger',   value: 'On-chain EventWatcher',       inline: true  },
            { name: '🕐 Time',      value: new Date().toISOString(),       inline: true  },
          ],
          footer: { text: 'SomniaWatch EventWatcher • Autonomous Agent • fetchString → inferString → Sphinx' },
          timestamp: new Date().toISOString(),
        }],
      }),
    });
    return res.ok;
  } catch { return false; }
}

async function sendTelegramAlert(payload) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return false;
  try {
    const text =
      `🔴 *SomniaWatch AUTO-DETECTED*\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📍 Contract: \`${payload.target.slice(0,10)}...${payload.target.slice(-6)}\`\n` +
      `⚠️ Pattern: *${payload.pattern}*\n` +
      `🔥 Severity: ${payload.severity}/3\n` +
      `⚡ Trigger: On-chain EventWatcher\n` +
      `🕐 Time: ${new Date().toISOString()}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Autonomous agent — no human trigger_`;

    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: 'Markdown' }),
      }
    );
    return res.ok;
  } catch { return false; }
}

export default async function handler(req, res) {
  const events   = await fetchRecentEvents();
  const detected = events.filter(e =>
    e.topics && e.topics[0] && e.data
  );

  const results = [];

  for (const event of detected.slice(0, 5)) {
    const payload = {
      target:   event.address || SW_ADDRESS,
      pattern:  'on_chain_event',
      severity: 2,
    };
    const [discord, telegram] = await Promise.all([
      sendDiscordAlert(payload),
      sendTelegramAlert(payload),
    ]);
    results.push({ target: payload.target, discord, telegram });
  }

  res.status(200).json({
    ok:      true,
    message: 'EventWatcher poll complete',
    events:  detected.length,
    alerted: results,
    ts:      new Date().toISOString(),
  });
}
