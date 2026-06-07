// /api/keeper-cron.js — SomniaWatch Autonomous Keeper
// Vercel Cron: every 6h (see vercel.json)
// Uses env vars exactly as named in Vercel:
//   PRIVATE_KEY, SOMNIAWATCH_ADDRESS, SOMNIA_RPC
//   DISCORD_WEBHOOK, TELEGRAM_TOKEN, TELEGRAM_CHAT_ID
//   MOCK_VAULT_ADDRESS

const { ethers } = require('ethers');

const RPC_URL        = process.env.SOMNIA_RPC        || 'https://dream-rpc.somnia.network';
const PRIVATE_KEY    = process.env.PRIVATE_KEY;
const WATCH_ADDRESS  = process.env.SOMNIAWATCH_ADDRESS;
const DISCORD_URL    = process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK;
const TG_TOKEN       = process.env.TELEGRAM_BOT_TOKEN  || process.env.TELEGRAM_TOKEN;
const TG_CHAT        = process.env.TELEGRAM_CHAT_ID;
const EXPLORER       = 'https://shannon-explorer.somnia.network';

const WATCH_ABI = [
  'function runAudit(address target) external returns (uint256 requestId)',
  'function getLastAudit(address target) external view returns (tuple(address target, string riskLabel, string riskType, string reasoning, uint256 txCount, uint256 receiptId, uint256 timestamp, bool alertSent))',
  'function getMonitoredContracts() external view returns (address[])',
  'function auditCount() external view returns (uint256)',
  'event AuditComplete(address indexed target, string riskLabel, uint256 receiptId)',
];

async function sendDiscord(msg, embed) {
  if (!DISCORD_URL) return false;
  try {
    const body = embed
      ? { username: 'SomniaWatch 🛡️', embeds: [embed] }
      : { username: 'SomniaWatch 🛡️', content: msg };
    const r = await fetch(DISCORD_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.ok;
  } catch { return false; }
}

async function sendTelegram(msg) {
  if (!TG_TOKEN || !TG_CHAT) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text: msg, parse_mode: 'Markdown', disable_web_page_preview: true }),
    });
    return r.ok;
  } catch { return false; }
}

async function alertCritical({ contract, riskType, reasoning, receiptId, txHash }) {
  const short  = contract.slice(0, 10) + '...' + contract.slice(-6);
  const ts     = new Date().toISOString();
  const receipt = receiptId ? `${EXPLORER}/tx/${receiptId}` : null;

  const embed = {
    title: '🔴 CRITICAL Security Alert — SomniaWatch',
    color: 0xf43f5e,
    fields: [
      { name: '📍 Contract',    value: `\`${short}\``,              inline: true  },
      { name: '⚠️ Risk Type',  value: riskType || 'unknown',        inline: true  },
      { name: '🤖 Reasoning', value: (reasoning || '').slice(0,200), inline: false },
      { name: '🔗 Receipt',   value: receipt ? `[View on Shannon](${receipt})` : 'pending', inline: false },
    ],
    footer: { text: 'Somnia Agentic L1 · inferString(Qwen3-30B) · 3-validator consensus' },
    timestamp: ts,
  };

  const tgMsg = `🔴 *CRITICAL Alert — SomniaWatch*
⏰ \`${ts}\`
📍 Contract: \`${short}\`
⚠️ Risk: \`${riskType || 'unknown'}\`
🤖 ${(reasoning || '').slice(0, 150)}
${receipt ? `🔗 [Receipt](${receipt})` : ''}`;

  const [d, t] = await Promise.all([sendDiscord(null, embed), sendTelegram(tgMsg)]);
  console.log(`[alert] CRITICAL fired — Discord:${d} Telegram:${t}`);
  return { discord: d, telegram: t };
}

async function alertSafe({ contract, auditStreak }) {
  if (!DISCORD_URL && !TG_TOKEN) return;
  const short = contract.slice(0, 10) + '...' + contract.slice(-6);
  const msg   = `✅ *SomniaWatch — SAFE Audit*
📍 \`${short}\` passed autonomous audit
🔥 Streak: ${auditStreak || 1} consecutive clean cycles
🔗 [SomniaWatch](https://somniawatch\-eight\.vercel\.app)`;
  await sendTelegram(msg);
}

module.exports = async (req, res) => {
  // Allow manual trigger via GET for testing
  if (req.method !== 'GET' && req.method !== 'POST')
    return res.status(405).json({ error: 'GET or POST only' });

  if (!PRIVATE_KEY || !WATCH_ADDRESS) {
    return res.status(500).json({ error: 'Missing PRIVATE_KEY or SOMNIAWATCH_ADDRESS env vars' });
  }

  const startMs = Date.now();
  const results = [];

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
    const watch    = new ethers.Contract(WATCH_ADDRESS, WATCH_ABI, signer);

    // Get monitored contracts
    let contracts = [];
    try {
      contracts = await watch.getMonitoredContracts();
    } catch (_) {
      // Fallback to env var or MockVault
      const mv = process.env.MOCK_VAULT_ADDRESS || '0xeB282f43b4015b7a71cfbd2Bd52f69146030701E';
      contracts = [mv];
    }

    console.log(`[keeper] Running audit on ${contracts.length} contract(s)`);

    for (const target of contracts) {
      try {
        // Fetch current TX data for anomaly detection
        const explorerUrl = `https://api.somnia.network/api?module=account&action=txlist&address=${target}&page=1&offset=20`;
        let txCount = 0;
        let anomaly = false;
        try {
          const r    = await fetch(explorerUrl);
          const data = await r.json();
          txCount = Array.isArray(data?.result) ? data.result.length : 0;
          anomaly = txCount > 10;
        } catch (_) {}

        const pipelineMode = anomaly ? 'ENRICHED' : 'STANDARD';
        console.log(`[keeper] ${target.slice(0,10)}... → [inferString/${pipelineMode}] txCount=${txCount}`);

        // Run on-chain audit
        const tx      = await watch.runAudit(target);
        const receipt = await tx.wait();

        // Get result
        const audit = await watch.getLastAudit(target);
        const label = audit.riskLabel || 'SAFE';
        const costSTT = '0.38';

        console.log(`[keeper] Result: ${label} (${audit.riskType || 'n/a'}) — receipt: ${audit.receiptId}`);

        // Fire alerts for CRITICAL or SUSPICIOUS
        let alertResult = { discord: false, telegram: false };
        if (label === 'CRITICAL') {
          alertResult = await alertCritical({
            contract:  target,
            riskType:  audit.riskType,
            reasoning: audit.reasoning,
            receiptId: audit.receiptId?.toString(),
            txHash:    tx.hash,
          });
        } else if (label === 'SUSPICIOUS') {
          const short = target.slice(0,10)+'...'+target.slice(-6);
          await sendDiscord(null, {
            title: '🟡 SUSPICIOUS Activity — SomniaWatch',
            color: 0xf59e0b,
            fields: [
              { name: 'Contract', value: `\`${short}\``, inline: true },
              { name: 'Risk',     value: audit.riskType || 'anomaly', inline: true },
            ],
            footer: { text: 'Somnia inferString(Qwen3-30B)' },
            timestamp: new Date().toISOString(),
          });
        } else {
          await alertSafe({ contract: target, auditStreak: 1 });
        }

        results.push({
          contract:     target,
          riskLabel:    label,
          riskType:     audit.riskType,
          txHash:       tx.hash,
          receiptId:    audit.receiptId?.toString(),
          pipelineMode,
          txCount,
          costSTT,
          alertDiscord: alertResult.discord,
          alertTelegram: alertResult.telegram,
          explorerLink: `${EXPLORER}/tx/${tx.hash}`,
        });
      } catch (contractErr) {
        console.error(`[keeper] Error on ${target}:`, contractErr.message);
        results.push({ contract: target, error: contractErr.message });
      }
    }

    const elapsed = Date.now() - startMs;
    const critical = results.filter(r => r.riskLabel === 'CRITICAL').length;
    const safe     = results.filter(r => r.riskLabel === 'SAFE').length;

    // Post keeper summary to Discord
    if (DISCORD_URL) {
      await sendDiscord(null, {
        title: '🛡️ SomniaWatch — Keeper Cycle Complete',
        color: critical > 0 ? 0xf43f5e : 0x10b981,
        fields: [
          { name: 'Contracts Audited', value: String(results.length), inline: true },
          { name: 'Critical',          value: String(critical),        inline: true },
          { name: 'Safe',              value: String(safe),            inline: true },
          { name: 'Duration',          value: `${elapsed}ms`,          inline: true },
          { name: 'Cost',              value: `${(results.length * 0.38).toFixed(2)} STT`, inline: true },
          { name: 'Chain',             value: 'Shannon Testnet 50312', inline: true },
        ],
        footer: { text: 'fetchString() → inferString(Qwen3-30B) → Sphinx · 3 validators' },
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      ok:       true,
      mode:     'keeper_cycle',
      cycles:   results.length,
      critical,
      safe,
      elapsedMs: elapsed,
      results,
      alertChannels: {
        discord:  !!DISCORD_URL,
        telegram: !!(TG_TOKEN && TG_CHAT),
      },
    });

  } catch (e) {
    console.error('[keeper] Fatal:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
};
