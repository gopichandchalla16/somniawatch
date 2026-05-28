import React, { useState } from 'react';

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1509449159369949194/DJm1A0hoNjGvQlFBQFKTYnFVbYk0Aah1Qnzxf-hZ5TQdbvI3Rn_D-RkNufUwBPwx7Pgt';
const TELEGRAM_TOKEN  = '8607154392:AAEyaWuSH5bCgOj2_zqp7GVGCN7B8m0E5MI';
const TELEGRAM_CHAT   = '5613202828';
const MOCK_VAULT      = '0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B';

export default function AlertSender() {
  const [status, setStatus]   = useState('');
  const [loading, setLoading] = useState(false);

  const sendAlerts = async () => {
    setLoading(true);
    setStatus('Sending alerts...');
    const results = { discord: null, telegram: null };

    // --- Discord (direct fetch, no CORS issue for webhooks) ---
    try {
      const body = JSON.stringify({
        embeds: [{
          title: 'SOMNIAWATCH - CRITICAL ALERT',
          description:
            `**Contract:** \`${MOCK_VAULT}\`\n` +
            `**Risk Pattern:** batchWithdraw_reentrancy_pattern\n` +
            `**Classification:** CRITICAL\n` +
            `**Mode:** Manual UI trigger\n` +
            `[View on Explorer](https://shannon-explorer.somnia.network/address/${MOCK_VAULT})`,
          color: 0xff2200,
          fields: [
            { name: 'Severity',  value: 'CRITICAL',                       inline: true },
            { name: 'Pattern',   value: 'batchWithdraw_reentrancy',        inline: true },
            { name: 'Triggered', value: 'SomniaWatch UI',                  inline: true },
          ],
          footer: { text: 'SomniaWatch | Autonomous Security Guardian | Somnia Agentathon 2026' },
          timestamp: new Date().toISOString(),
        }],
      });
      const r = await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      results.discord = (r.status >= 200 && r.status < 300) ? 'sent' : `failed (${r.status})`;
    } catch (e) {
      results.discord = `error: ${e.message}`;
    }

    // --- Telegram (via Vercel serverless proxy /api/alert) ---
    try {
      const r = await fetch('/api/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract:       MOCK_VAULT,
          riskType:       'batchWithdraw_reentrancy_pattern',
          level:          2,
          telegramToken:  TELEGRAM_TOKEN,
          telegramChatId: TELEGRAM_CHAT,
        }),
      });
      const data = await r.json();
      results.telegram = data?.results?.telegram || 'unknown';
    } catch (e) {
      results.telegram = `error: ${e.message}`;
    }

    const discordOk  = results.discord === 'sent';
    const telegramOk = results.telegram === 'sent';
    setStatus(
      (discordOk  ? '✅ Discord sent!' : `❌ Discord: ${results.discord}`) + '  ' +
      (telegramOk ? '✅ Telegram sent!' : `❌ Telegram: ${results.telegram}`)
    );
    setLoading(false);
  };

  return (
    <div style={{
      background: '#0d1a2a', border: '1px solid #22ff8844',
      borderRadius: 10, padding: 20, marginBottom: 24,
    }}>
      <h3 style={{ color: '#22ff88', margin: '0 0 6px' }}>Send Alert Now</h3>
      <p style={{ color: '#7a9cc0', fontSize: 13, margin: '0 0 14px' }}>
        Manually fires a CRITICAL alert to Discord and Telegram instantly.
        Same message the autonomous keeper sends every 5-min cycle.
      </p>
      <button
        onClick={sendAlerts}
        disabled={loading}
        style={{
          background: loading ? '#0d2a1a' : '#22ff88',
          color: '#000', border: 'none', padding: '10px 28px',
          borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold', fontSize: 14, opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Sending...' : 'Send CRITICAL Alert to Discord + Telegram'}
      </button>
      {status && (
        <div style={{
          marginTop: 12, padding: '10px 14px',
          background: '#060d16', borderRadius: 6,
          borderLeft: `3px solid ${status.includes('❌') ? '#ff4444' : '#22ff88'}`,
          fontSize: 13, color: '#e0e8ff',
        }}>
          {status}
        </div>
      )}
    </div>
  );
}
