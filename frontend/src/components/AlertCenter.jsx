import React, { useState, useEffect } from 'react';

const WATCH_ADDR = '0xaca28071870080421206831D2F9EBd3E97CcdFd1';
const EXPLORER   = 'https://shannon-explorer.somnia.network';

const ALERT_PRESETS = [
  {
    id: 'test',
    icon: '🔔',
    label: 'Test Alert',
    color: 'var(--cyan)',
    border: '#06b6d444',
    desc: 'Verify both channels are live',
    body: {},
  },
  {
    id: 'critical',
    icon: '🔴',
    label: 'CRITICAL Alert',
    color: 'var(--red)',
    border: '#f43f5e44',
    desc: 'Simulate reentrancy / flash attack detection',
    body: {
      riskLabel: 'CRITICAL',
      contract:  '0xeB282f43...701E',
      riskType:  'reentrancy_pattern',
      agentCalls: 3,
      costSTT:   '0.38',
      txHash:    '0xdemo_critical_' + Math.random().toString(16).slice(2, 10),
    },
  },
  {
    id: 'suspicious',
    icon: '🟡',
    label: 'SUSPICIOUS Alert',
    color: '#f59e0b',
    border: '#f59e0b44',
    desc: 'Simulate flash loan anomaly detection',
    body: {
      riskLabel: 'SUSPICIOUS',
      contract:  '0xeB282f43...701E',
      riskType:  'flash_loan_anomaly',
      agentCalls: 2,
      costSTT:   '0.19',
    },
  },
  {
    id: 'safe',
    icon: '✅',
    label: 'SAFE Cleared',
    color: 'var(--green)',
    border: '#10b98144',
    desc: 'Notify team contract passed audit',
    body: {
      riskLabel: 'SAFE',
      contract:  WATCH_ADDR,
      riskType:  'clean',
      agentCalls: 2,
      costSTT:   '0.19',
    },
  },
];

function StatusDot({ on }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: on ? 'var(--green)' : '#ef4444',
      boxShadow: on ? '0 0 6px var(--green)' : 'none',
      marginRight: 6,
    }} />
  );
}

export default function AlertCenter() {
  const [status,      setStatus]      = useState(null);
  const [statusLoad,  setStatusLoad]  = useState(false);
  const [firing,      setFiring]      = useState({});
  const [results,     setResults]     = useState({});
  const [history,     setHistory]     = useState([]);
  const [custom,      setCustom]      = useState({ riskLabel: 'CRITICAL', contract: '', riskType: '', note: '' });
  const [customFire,  setCustomFire]  = useState(false);
  const [customResult,setCustomResult]= useState(null);

  // Load alert history from localStorage
  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem('sw_alert_sent') || '[]');
      setHistory(h);
    } catch {}
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setStatusLoad(true);
    try {
      const r = await fetch('/api/alert');
      const d = await r.json();
      setStatus(d);
    } catch (e) {
      setStatus({ ok: false, discord: false, telegram: false, error: e.message });
    } finally { setStatusLoad(false); }
  };

  const fireAlert = async (preset) => {
    setFiring(f => ({ ...f, [preset.id]: true }));
    setResults(r => ({ ...r, [preset.id]: null }));
    try {
      const r = await fetch('/api/alert', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(preset.body),
      });
      const d = await r.json();
      setResults(prev => ({ ...prev, [preset.id]: d }));

      // Save to history
      const entry = {
        ts:       Date.now(),
        label:    preset.label,
        discord:  d.discord,
        telegram: d.telegram,
        id:       preset.id,
      };
      const h = [entry, ...history].slice(0, 20);
      setHistory(h);
      try { localStorage.setItem('sw_alert_sent', JSON.stringify(h)); } catch {}
    } catch (e) {
      setResults(prev => ({ ...prev, [preset.id]: { ok: false, error: e.message } }));
    } finally {
      setFiring(f => ({ ...f, [preset.id]: false }));
    }
  };

  const fireCustom = async () => {
    setCustomFire(true); setCustomResult(null);
    try {
      const r = await fetch('/api/alert', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...custom }),
      });
      const d = await r.json();
      setCustomResult(d);
      const entry = { ts: Date.now(), label: `Custom: ${custom.riskLabel}`, discord: d.discord, telegram: d.telegram, id: 'custom' };
      const h = [entry, ...history].slice(0, 20);
      setHistory(h);
      try { localStorage.setItem('sw_alert_sent', JSON.stringify(h)); } catch {}
    } catch (e) {
      setCustomResult({ ok: false, error: e.message });
    } finally { setCustomFire(false); }
  };

  const discordOn  = status?.discord;
  const telegramOn = status?.telegram;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>🔔</span>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Alert Center</h2>
            <p style={{ fontSize: 12, color: 'var(--text-sec)', margin: 0 }}>Send live Discord + Telegram alerts · All channels on Somnia Agentic L1</p>
          </div>
        </div>
      </div>

      {/* Channel status bar */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>💬</span>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Discord</div>
              <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                <StatusDot on={discordOn} />
                <span style={{ color: discordOn ? 'var(--green)' : 'var(--red)' }}>{discordOn ? 'LIVE' : 'NOT SET'}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📲</span>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Telegram</div>
              <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                <StatusDot on={telegramOn} />
                <span style={{ color: telegramOn ? 'var(--green)' : 'var(--red)' }}>{telegramOn ? 'LIVE' : 'NOT SET'}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>⛓️</span>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Channels</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cyan)' }}>{status?.channels ?? '...'} / 2</div>
            </div>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={checkStatus} disabled={statusLoad} style={{ fontSize: 12 }}>
          {statusLoad ? '⏳' : '🔄'} Refresh Status
        </button>
      </div>

      {/* Preset alert buttons */}
      <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Quick Fire Alerts</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 24 }}>
        {ALERT_PRESETS.map(preset => (
          <div key={preset.id} className="card" style={{ border: `1px solid ${preset.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{preset.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: preset.color }}>{preset.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{preset.desc}</div>
              </div>
            </div>
            <button
              className="btn"
              style={{ width: '100%', background: preset.color + '22', border: `1px solid ${preset.color}55`, color: preset.color, fontSize: 12, fontWeight: 700 }}
              onClick={() => fireAlert(preset)}
              disabled={firing[preset.id]}
            >
              {firing[preset.id] ? '⏳ Sending...' : `⚡ Send ${preset.label}`}
            </button>
            {results[preset.id] && (
              <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--bg-base)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                <div style={{ color: results[preset.id].discord ? 'var(--green)' : 'var(--red)' }}>
                  💬 Discord: {results[preset.id].discord ? '✅ Delivered' : '❌ Failed'}
                </div>
                <div style={{ color: results[preset.id].telegram ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>
                  📲 Telegram: {results[preset.id].telegram ? '✅ Delivered' : '❌ Failed'}
                </div>
                {results[preset.id].timestamp && (
                  <div style={{ color: 'var(--text-dim)', marginTop: 4 }}>{new Date(results[preset.id].timestamp).toLocaleTimeString()}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom alert builder */}
      <div className="card" style={{ marginBottom: 24, borderColor: '#7c3aed44' }}>
        <div style={{ fontSize: 11, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>✏️ Custom Alert Builder</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Risk Level</label>
            <select
              value={custom.riskLabel}
              onChange={e => setCustom(c => ({ ...c, riskLabel: e.target.value }))}
              style={{ width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 6, padding: '7px 10px', fontSize: 13 }}
            >
              <option>CRITICAL</option>
              <option>SUSPICIOUS</option>
              <option>SAFE</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Contract Address</label>
            <input
              value={custom.contract}
              onChange={e => setCustom(c => ({ ...c, contract: e.target.value }))}
              placeholder="0x... (optional)"
              style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Risk Type</label>
            <input
              value={custom.riskType}
              onChange={e => setCustom(c => ({ ...c, riskType: e.target.value }))}
              placeholder="e.g. reentrancy_pattern"
              style={{ width: '100%', boxSizing: 'border-box', fontSize: 13 }}
            />
          </div>
        </div>
        <button
          className="btn btn-purple"
          onClick={fireCustom}
          disabled={customFire}
          style={{ fontSize: 13, padding: '9px 20px' }}
        >
          {customFire ? '⏳ Sending...' : '🔔 Send Custom Alert to Both Channels'}
        </button>
        {customResult && (
          <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--bg-base)', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            <div style={{ color: customResult.discord ? 'var(--green)' : 'var(--red)' }}>💬 Discord: {customResult.discord ? '✅ Delivered' : '❌ Failed'}</div>
            <div style={{ color: customResult.telegram ? 'var(--green)' : 'var(--red)', marginTop: 4 }}>📲 Telegram: {customResult.telegram ? '✅ Delivered' : '❌ Failed'}</div>
            <div style={{ color: 'var(--text-dim)', marginTop: 4 }}>{customResult.message}</div>
          </div>
        )}
      </div>

      {/* Alert history */}
      {history.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>📜 Alert History (this session)</div>
            <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => {
              setHistory([]);
              try { localStorage.removeItem('sw_alert_sent'); } catch {}
            }}>Clear</button>
          </div>
          {history.map((h, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-base)', borderRadius: 6, marginBottom: 6, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14 }}>
                  {h.id === 'critical' ? '🔴' : h.id === 'suspicious' ? '🟡' : h.id === 'safe' ? '✅' : '🔔'}
                </span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{h.label}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{new Date(h.ts).toLocaleTimeString()}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                <span style={{ color: h.discord ? 'var(--green)' : 'var(--red)' }}>💬 {h.discord ? '✅' : '❌'}</span>
                <span style={{ color: h.telegram ? 'var(--green)' : 'var(--red)' }}>📲 {h.telegram ? '✅' : '❌'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* What judges see */}
      <div className="card" style={{ marginTop: 16, background: 'linear-gradient(135deg,#0d0d1a,#0a1020)', borderColor: '#6366f144' }}>
        <div style={{ fontSize: 11, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>🌐 How This Works on Somnia</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { icon: '🤖', title: 'Autonomous Trigger', desc: 'Keeper agent fires alerts automatically every 6h — no human trigger. inferString() classifies, then alert fires.' },
            { icon: '⛓️', title: 'On-Chain Proof', desc: 'Every alert has a verifiable on-chain receipt on Shannon Explorer. Not just a webhook — an immutable audit trail.' },
            { icon: '💰', title: 'Sub-Cent Cost', desc: 'Full cycle including alert costs 0.38 STT (~$0.02). Enterprise tools charge $500/month for less coverage.' },
            { icon: '⚡', title: 'Real-Time', desc: 'From TX anomaly detected → alert on Discord+Telegram in one keeper cycle. Faster than any centralized monitor.' },
          ].map(s => (
            <div key={s.title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
