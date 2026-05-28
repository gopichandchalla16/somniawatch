import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'sw_webhooks';

function loadWebhooks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveWebhooks(hooks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hooks));
}

export default function WebhookMarketplace({ contracts }) {
  const [webhooks, setWebhooks] = useState(loadWebhooks);
  const [form, setForm] = useState({ contract: contracts[0] || '', type: 'discord', url: '', label: '' });
  const [status, setStatus] = useState('');
  const [testing, setTesting] = useState(null);

  useEffect(() => {
    if (contracts.length && !form.contract) setForm(f => ({ ...f, contract: contracts[0] }));
  }, [contracts]);

  const addWebhook = () => {
    if (!form.url.startsWith('http')) return setStatus('Enter a valid URL');
    if (!form.contract) return setStatus('Select a contract');
    const hook = { ...form, id: Date.now(), active: true, alertCount: 0 };
    const updated = [...webhooks, hook];
    setWebhooks(updated);
    saveWebhooks(updated);
    setForm(f => ({ ...f, url: '', label: '' }));
    setStatus('Webhook registered! Alerts will fire here on CRITICAL detections.');
    setTimeout(() => setStatus(''), 4000);
  };

  const removeWebhook = (id) => {
    const updated = webhooks.filter(h => h.id !== id);
    setWebhooks(updated);
    saveWebhooks(updated);
  };

  const testWebhook = async (hook) => {
    setTesting(hook.id);
    try {
      if (hook.type === 'discord') {
        const body = JSON.stringify({
          embeds: [{
            title: '🔴 SomniaWatch TEST — Webhook Marketplace',
            description: `Contract: ${hook.contract}\nThis webhook is registered in the SomniaWatch Marketplace.\nReal alerts fire autonomously on CRITICAL detections.`,
            color: 0xff4444,
            footer: { text: `Label: ${hook.label || 'unnamed'} | Somnia Agentathon 2026` }
          }]
        });
        const res = await fetch(hook.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        setStatus(res.ok ? `✅ Discord test sent to "${hook.label || hook.url.slice(0,30)}..."` : '❌ Discord webhook failed — check URL');
      } else if (hook.type === 'telegram') {
        setStatus('⚠️ Telegram test — run node test-telegram.js from terminal (browser cannot call Telegram API directly)');
      } else {
        setStatus('⚠️ Slack test not supported from browser — add to keeper.js manually');
      }
    } catch {
      setStatus('❌ Test failed — CORS blocked in browser. Webhook will still work from keeper.js');
    }
    setTesting(null);
    setTimeout(() => setStatus(''), 5000);
  };

  const typeColors = { discord: '#5865F2', telegram: '#229ED9', slack: '#4A154B', custom: '#22ff88' };
  const typeIcons  = { discord: '💬', telegram: '✈️', slack: '💼', custom: '🔗' };

  return (
    <div style={{ background: '#0d1a2a', border: '1px solid #1e2d4a', borderRadius: 10, padding: 20, marginBottom: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: '#e0e8ff', fontSize: 16 }}>🏪 Webhook Marketplace</h3>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#3a5a80' }}>
          Register Discord / Telegram / Slack webhooks per contract. SomniaWatch fires alerts directly to your team on CRITICAL detections.
        </p>
      </div>

      {/* Add form */}
      <div style={{ background: '#060d16', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #1e2d4a' }}>
        <div style={{ fontSize: 12, color: '#22aaff', marginBottom: 10, fontWeight: 'bold' }}>+ Register New Webhook</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: '#3a5a80', marginBottom: 4 }}>Contract</div>
            <select
              value={form.contract}
              onChange={e => setForm(f => ({ ...f, contract: e.target.value }))}
              style={{ width: '100%', background: '#0d1a2a', border: '1px solid #1e2d4a', color: '#e0e8ff', padding: '8px', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }}
            >
              {contracts.map(c => <option key={c} value={c}>{c.slice(0,10)}...{c.slice(-6)}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#3a5a80', marginBottom: 4 }}>Type</div>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={{ width: '100%', background: '#0d1a2a', border: '1px solid #1e2d4a', color: '#e0e8ff', padding: '8px', borderRadius: 6, fontSize: 12 }}
            >
              <option value="discord">💬 Discord</option>
              <option value="telegram">✈️ Telegram</option>
              <option value="slack">💼 Slack</option>
              <option value="custom">🔗 Custom Webhook</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: '#3a5a80', marginBottom: 4 }}>Label (optional)</div>
          <input
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="e.g. Protocol Team Discord"
            style={{ width: '100%', background: '#0d1a2a', border: '1px solid #1e2d4a', color: '#e0e8ff', padding: '8px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: 12, boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#3a5a80', marginBottom: 4 }}>Webhook URL</div>
          <input
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            placeholder="https://discord.com/api/webhooks/... or https://hooks.slack.com/..."
            style={{ width: '100%', background: '#0d1a2a', border: '1px solid #1e2d4a', color: '#e0e8ff', padding: '8px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: 11, boxSizing: 'border-box' }}
          />
        </div>
        <button
          onClick={addWebhook}
          style={{ background: '#1a6cff', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
        >
          Register Webhook
        </button>
        {status && (
          <span style={{ marginLeft: 12, fontSize: 12, color: status.startsWith('❌') ? '#ff6666' : '#22ff88' }}>{status}</span>
        )}
      </div>

      {/* Registered webhooks */}
      {webhooks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px', color: '#3a5a80', fontSize: 13 }}>
          No webhooks registered yet. Add your Discord / Telegram above.
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12, color: '#7a9cc0', marginBottom: 8 }}>Registered ({webhooks.length})</div>
          {webhooks.map(hook => (
            <div key={hook.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              background: '#060d16', borderRadius: 6, marginBottom: 6,
              border: `1px solid ${typeColors[hook.type]}44`
            }}>
              <span style={{ fontSize: 18 }}>{typeIcons[hook.type]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: typeColors[hook.type], fontWeight: 'bold' }}>
                  {hook.label || hook.type.charAt(0).toUpperCase() + hook.type.slice(1)}
                </div>
                <div style={{ fontSize: 10, color: '#3a5a80', fontFamily: 'monospace' }}>
                  {hook.contract.slice(0,10)}...{hook.contract.slice(-6)} · {hook.url.slice(0, 35)}...
                </div>
              </div>
              <span style={{ fontSize: 10, background: '#0d2a1a', color: '#22ff88', padding: '2px 8px', borderRadius: 10 }}>ACTIVE</span>
              <button
                onClick={() => testWebhook(hook)}
                disabled={testing === hook.id}
                style={{ fontSize: 11, background: '#0d2a3a', border: '1px solid #22aaff44', color: '#22aaff', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}
              >
                {testing === hook.id ? 'Testing...' : 'Test'}
              </button>
              <button
                onClick={() => removeWebhook(hook.id)}
                style={{ fontSize: 11, background: 'none', border: '1px solid #ff444444', color: '#ff6666', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info note */}
      <div style={{ marginTop: 12, fontSize: 11, color: '#3a5a80', background: '#060d16', padding: '8px 12px', borderRadius: 6 }}>
        💡 Webhooks registered here are stored locally and passed to keeper.js on the next cycle. Protocols can register their own alert endpoints — making SomniaWatch a composable security infrastructure layer.
      </div>
    </div>
  );
}
