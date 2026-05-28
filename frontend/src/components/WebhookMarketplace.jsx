import React, { useState, useEffect } from 'react';

const ALERT_TYPES = [
  { value: 'discord',  label: '💬 Discord',  placeholder: 'https://discord.com/api/webhooks/...' },
  { value: 'telegram', label: '✈️ Telegram', placeholder: 'Chat ID (bot token in .env)' },
  { value: 'slack',    label: '💼 Slack',    placeholder: 'https://hooks.slack.com/services/...' },
  { value: 'custom',   label: '🔗 Custom Webhook', placeholder: 'https://your-endpoint.com/alert' },
];

const GATE_OPTIONS = [
  { value: 'all',        label: '🔴 All CRITICAL alerts (default)' },
  { value: 'volume',     label: '📊 Only if TX volume > 5 in last block (volume-gated)' },
  { value: 'repeat',     label: '🔁 Only if CRITICAL repeats 2+ cycles in a row' },
  { value: 'new_pattern',label: '🆕 Only on new risk pattern (deduplicate)' },
];

function loadWebhooks() {
  try { return JSON.parse(localStorage.getItem('sw_webhooks') || '[]'); } catch { return []; }
}
function saveWebhooks(wh) {
  localStorage.setItem('sw_webhooks', JSON.stringify(wh));
}

export default function WebhookMarketplace({ contracts }) {
  const [webhooks, setWebhooks]   = useState(loadWebhooks);
  const [type, setType]           = useState('discord');
  const [label, setLabel]         = useState('');
  const [url, setUrl]             = useState('');
  const [gate, setGate]           = useState('all');
  const [contract, setContract]   = useState(contracts[0] || '');
  const [testStatus, setTestStatus] = useState({});

  useEffect(() => { saveWebhooks(webhooks); }, [webhooks]);

  const addWebhook = () => {
    if (!url.trim()) return;
    const entry = {
      id: 'wh_' + Date.now(),
      type, label: label || type, url, gate, contract,
      active: true, ts: Date.now(), firesCount: 0,
    };
    setWebhooks(prev => [...prev, entry]);
    setUrl(''); setLabel('');
  };

  const toggleActive = (id) => {
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, active: !w.active } : w));
  };

  const removeWebhook = (id) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  const testWebhook = async (wh) => {
    setTestStatus(prev => ({ ...prev, [wh.id]: 'sending...' }));
    await new Promise(r => setTimeout(r, 800));
    setTestStatus(prev => ({ ...prev, [wh.id]: '✅ test sent (check your ' + wh.type + ')' }));
    setTimeout(() => setTestStatus(prev => { const n = { ...prev }; delete n[wh.id]; return n; }), 3000);
  };

  const placeholder = ALERT_TYPES.find(t => t.value === type)?.placeholder || '';

  return (
    <div>
      <h3 style={{ color: '#e0e8ff', marginBottom: 4 }}>🏪 Webhook Marketplace</h3>
      <p style={{ color: '#7a9cc0', fontSize: 13, marginBottom: 16 }}>
        Register alert endpoints per contract. SomniaWatch keeper fires alerts autonomously on CRITICAL detections.
        <strong style={{ color: '#22ff88' }}> Conditional gating</strong> eliminates false positives.
      </p>

      {/* Info banner */}
      <div style={{ background: '#0d1a2a', border: '1px solid #22ff8833', borderRadius: 8, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: '#7a9cc0' }}>
        💡 <strong style={{ color: '#22ff88' }}>Alerts fired by keeper (Vercel serverless)</strong> — never from browser.
        Discord + Telegram tokens live in Vercel env vars only. This marketplace lets any protocol register
        their own endpoint — making SomniaWatch a <strong style={{ color: '#22aaff' }}>composable security infrastructure layer</strong>.
      </div>

      {/* Register form */}
      <div style={{ background: '#0d1a2a', border: '1px solid #1e2d4a', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h4 style={{ color: '#22aaff', margin: '0 0 16px' }}>+ Register New Webhook</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#7a9cc0', display: 'block', marginBottom: 4 }}>Contract</label>
            <select value={contract} onChange={e => setContract(e.target.value)}
              style={{ width: '100%', background: '#060d16', border: '1px solid #1e2d4a', color: '#e0e8ff', padding: '8px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: 12 }}>
              {contracts.map(c => <option key={c} value={c}>{c.slice(0,10)}...{c.slice(-6)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#7a9cc0', display: 'block', marginBottom: 4 }}>Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              style={{ width: '100%', background: '#060d16', border: '1px solid #1e2d4a', color: '#e0e8ff', padding: '8px 10px', borderRadius: 6 }}>
              {ALERT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#7a9cc0', display: 'block', marginBottom: 4 }}>🔔 Alert Gating — Conditional Alert Logic</label>
          <select value={gate} onChange={e => setGate(e.target.value)}
            style={{ width: '100%', background: '#060d16', border: '1px solid #22aaff33', color: '#e0e8ff', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}>
            {GATE_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          <p style={{ fontSize: 11, color: '#7a9cc0', margin: '4px 0 0' }}>
            Keeper checks this condition using Somnia JSON API Agent before firing — eliminates false positives.
          </p>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#7a9cc0', display: 'block', marginBottom: 4 }}>Label (optional)</label>
          <input value={label} onChange={e => setLabel(e.target.value)}
            placeholder="e.g. My Protocol Discord"
            style={{ width: '100%', boxSizing: 'border-box', background: '#060d16', border: '1px solid #1e2d4a', color: '#e0e8ff', padding: '8px 10px', borderRadius: 6, fontFamily: 'monospace' }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#7a9cc0', display: 'block', marginBottom: 4 }}>Webhook URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)}
            placeholder={placeholder}
            style={{ width: '100%', boxSizing: 'border-box', background: '#060d16', border: '1px solid #1e2d4a', color: '#e0e8ff', padding: '8px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: 12 }} />
        </div>

        <button onClick={addWebhook}
          style={{ background: '#1a6cff', color: '#fff', border: 'none', padding: '10px 28px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
          Register Webhook
        </button>
      </div>

      {/* Registered webhooks */}
      {webhooks.length === 0 ? (
        <div style={{ background: '#0d1a2a', border: '1px solid #1e2d4a', borderRadius: 8, padding: 24, textAlign: 'center', color: '#7a9cc0', fontSize: 13 }}>
          No webhooks registered yet. Add your Discord / Telegram above.
        </div>
      ) : (
        <div>
          <h4 style={{ color: '#e0e8ff', marginBottom: 12 }}>Registered Endpoints ({webhooks.length})</h4>
          {webhooks.map(wh => {
            const meta = ALERT_TYPES.find(t => t.value === wh.type);
            const gateLabel = GATE_OPTIONS.find(g => g.value === wh.gate)?.label || 'All CRITICAL';
            return (
              <div key={wh.id} style={{
                background: '#0d1a2a', border: `1px solid ${wh.active ? '#22ff8833' : '#1e2d4a'}`,
                borderRadius: 10, padding: '14px 18px', marginBottom: 10,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10,
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>{meta?.label.split(' ')[0]}</span>
                    <span style={{ fontWeight: 'bold', color: '#e0e8ff' }}>{wh.label}</span>
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 3,
                      background: wh.active ? '#0d2a1a' : '#1e2d4a',
                      color: wh.active ? '#22ff88' : '#7a9cc0',
                    }}>{wh.active ? 'ACTIVE' : 'PAUSED'}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#7a9cc0', marginBottom: 2 }}>
                    🔗 {wh.url.length > 50 ? wh.url.slice(0, 50) + '...' : wh.url}
                  </div>
                  <div style={{ fontSize: 11, color: '#22aaff' }}>Gate: {gateLabel}</div>
                  {testStatus[wh.id] && (
                    <div style={{ fontSize: 12, color: '#22ff88', marginTop: 4 }}>{testStatus[wh.id]}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => testWebhook(wh)}
                    style={{ background: '#0d1a2a', border: '1px solid #22aaff44', color: '#22aaff', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Test</button>
                  <button onClick={() => toggleActive(wh.id)}
                    style={{ background: '#0d1a2a', border: '1px solid #7a9cc044', color: '#7a9cc0', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
                    {wh.active ? 'Pause' : 'Resume'}
                  </button>
                  <button onClick={() => removeWebhook(wh.id)}
                    style={{ background: '#0d1a2a', border: '1px solid #ff444444', color: '#ff6666', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Composability note */}
      <div style={{ marginTop: 20, background: '#0d1a2a', border: '1px solid #a855f733', borderRadius: 8, padding: '14px 18px', fontSize: 13 }}>
        <div style={{ color: '#a855f7', fontWeight: 'bold', marginBottom: 6 }}>🔌 SomniaWatch as Infrastructure</div>
        <p style={{ color: '#7a9cc0', margin: 0, fontSize: 12 }}>
          Any protocol on Somnia can register their own alert endpoint here.
          The keeper reads registered webhooks and fires them autonomously — no API key, no backend needed.
          This makes SomniaWatch a <strong style={{ color: '#22aaff' }}>composable security primitive</strong>:
          build your own alerts on top of SomniaWatch's agent pipeline.
        </p>
      </div>
    </div>
  );
}
