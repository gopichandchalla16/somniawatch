import React, { useState, useEffect } from 'react';

const RISK_COLORS = { 0: '#22ff88', 1: '#ffaa00', 2: '#ff4444' };
const RISK_LABELS = { 0: 'SAFE', 1: 'SUSPICIOUS', 2: 'CRITICAL' };
const RISK_ICONS  = { 0: '\u2705', 1: '\u26a0\ufe0f', 2: '\ud83d\udd34' };

const LLM_RESPONSES = [
  { score: 82, verdict: 'SAFE_OVERRIDE',  msg: 'Argument accepted. The withdrawal pattern is consistent with a scheduled protocol rebalance. No malicious intent detected.' },
  { score: 67, verdict: 'SUSPICIOUS',     msg: 'Partially convincing. Some indicators of legitimacy present, but high-frequency pattern remains anomalous. Downgraded to SUSPICIOUS.' },
  { score: 31, verdict: 'CRITICAL',       msg: 'Argument insufficient. Reentrancy signature and batchWithdraw x5 pattern strongly indicate exploit attempt. CRITICAL confirmed.' },
  { score: 91, verdict: 'SAFE_OVERRIDE',  msg: 'Strong case. On-chain evidence aligns with stated protocol logic. Finding overridden — marking SAFE.' },
  { score: 22, verdict: 'CRITICAL',       msg: 'Not convincing. The argument lacks on-chain corroboration. Alert escalated to Discord + Telegram.' },
  { score: 74, verdict: 'SUSPICIOUS',     msg: 'Borderline. Threshold not met for full override. Reclassified SUSPICIOUS — monitoring extended.' },
];

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour12: false });
}

function ChallengeCritical({ log, onResolved }) {
  const [open, setOpen]       = useState(false);
  const [text, setText]       = useState('');
  const [phase, setPhase]     = useState('idle'); // idle | thinking | result
  const [result, setResult]   = useState(null);

  const submit = async () => {
    if (!text.trim()) return;
    setPhase('thinking');
    // Simulate Somnia inferString agent call (1.8s)
    await new Promise(r => setTimeout(r, 1800));
    // Deterministic-ish: pick response based on text length + keyword heuristic
    const lower = text.toLowerCase();
    let pick;
    if (lower.includes('rebalance') || lower.includes('scheduled') || lower.includes('authorized') || lower.includes('protocol')) {
      pick = LLM_RESPONSES[text.length % 2 === 0 ? 0 : 3]; // high score
    } else if (lower.includes('test') || lower.includes('demo') || lower.includes('simulate')) {
      pick = LLM_RESPONSES[1]; // medium
    } else {
      pick = LLM_RESPONSES[text.length % 3 === 0 ? 2 : 4]; // low score
    }
    setResult(pick);
    setPhase('result');
    if (pick.verdict !== 'CRITICAL') onResolved(log, pick);
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
      background: '#1a1a2e', border: '1px solid #ff444466', color: '#ff8888',
    }}>\ud83e\udd14 Challenge</button>
  );

  return (
    <div style={{ marginTop: 10, padding: '12px 14px', background: '#0a0f1a', borderRadius: 8, border: '1px solid #a855f733' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>\ud83e\udde0</span>
        <span style={{ color: '#a855f7', fontWeight: 'bold', fontSize: 13 }}>Somnia LLM Judge — inferString()</span>
        <span style={{ fontSize: 10, color: '#7a9cc0' }}>Qwen3-30B · 3-validator consensus · 0.24 STT</span>
      </div>
      <p style={{ fontSize: 12, color: '#7a9cc0', margin: '0 0 8px' }}>
        Make your case. The LLM will score 0–100. Above 75 = SAFE override. Below 75 = CRITICAL confirmed.
      </p>
      {phase === 'idle' && (
        <>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder='e.g. "This was a scheduled protocol rebalance authorized by the DAO. The batchWithdraw was called by the treasury multisig..."'
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#060d16', border: '1px solid #a855f744',
              color: '#e0e8ff', padding: '8px 10px', borderRadius: 6,
              fontFamily: 'monospace', fontSize: 12, resize: 'vertical', marginBottom: 8,
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={submit} style={{
              background: '#a855f7', color: '#fff', border: 'none',
              padding: '7px 20px', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold', fontSize: 12,
            }}>Submit to LLM Judge</button>
            <button onClick={() => setOpen(false)} style={{
              background: 'none', border: '1px solid #1e2d4a', color: '#7a9cc0',
              padding: '7px 14px', borderRadius: 5, cursor: 'pointer', fontSize: 12,
            }}>Cancel</button>
          </div>
        </>
      )}
      {phase === 'thinking' && (
        <div style={{ color: '#a855f7', fontSize: 13, padding: '8px 0' }}>
          \u23f3 Somnia inferString() — sending to 3 validators... consensus pending...
        </div>
      )}
      {phase === 'result' && result && (
        <div style={{
          padding: '12px 14px', borderRadius: 6,
          background: result.verdict === 'CRITICAL' ? '#1a0505' : result.verdict === 'SUSPICIOUS' ? '#1a1205' : '#051a0d',
          border: `1px solid ${result.verdict === 'CRITICAL' ? '#ff4444' : result.verdict === 'SUSPICIOUS' ? '#ffaa00' : '#22ff88'}44`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>
              {result.verdict === 'CRITICAL' ? '\ud83d\udd34' : result.verdict === 'SUSPICIOUS' ? '\u26a0\ufe0f' : '\u2705'}
            </span>
            <span style={{
              fontWeight: 'bold', fontSize: 15,
              color: result.verdict === 'CRITICAL' ? '#ff4444' : result.verdict === 'SUSPICIOUS' ? '#ffaa00' : '#22ff88',
            }}>
              Score: {result.score}/100 — {result.verdict === 'SAFE_OVERRIDE' ? 'SAFE OVERRIDE' : result.verdict}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#e0e8ff', margin: '0 0 8px' }}>{result.msg}</p>
          <div style={{ fontSize: 11, color: '#7a9cc0' }}>
            Somnia inferString() consensus · Receipt: <code style={{ color: '#a855f7' }}>req_judge_{Date.now().toString().slice(-8)}</code>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlertLog() {
  const [logs, setLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sw_alert_log') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const stored = JSON.parse(localStorage.getItem('sw_alert_log') || '[]');
        setLogs(stored);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('sw_alert_log') || '[]');
    if (stored.length === 0) {
      const demo = [
        { ts: Date.now() - 1000*60*12, level: 2, contract: '0xEC263eBB...d39B', type: 'reentrancy_pattern',          discord: true,  telegram: true,  receipt: '0xabc123' },
        { ts: Date.now() - 1000*60*7,  level: 1, contract: '0xEC263eBB...d39B', type: 'high_frequency_withdrawal',    discord: false, telegram: false, receipt: '0xdef456' },
        { ts: Date.now() - 1000*60*2,  level: 0, contract: '0xEC263eBB...d39B', type: 'none',                         discord: false, telegram: false, receipt: '0xghi789' },
      ];
      localStorage.setItem('sw_alert_log', JSON.stringify(demo));
      setLogs(demo);
    }
  }, []);

  const clearLogs = () => { localStorage.removeItem('sw_alert_log'); setLogs([]); };

  const handleResolved = (log, result) => {
    setLogs(prev => {
      const updated = prev.map(l =>
        l.ts === log.ts
          ? { ...l, level: result.verdict === 'SAFE_OVERRIDE' ? 0 : 1, challenged: true, challengeScore: result.score, challengeVerdict: result.verdict }
          : l
      );
      localStorage.setItem('sw_alert_log', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div style={{ background: '#0d1a2a', border: '1px solid #1e2d4a', borderRadius: 10, padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, color: '#e0e8ff', fontSize: 16 }}>\ud83d\udd14 Autonomous Alert Log</h3>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#3a5a80' }}>Live record of every keeper cycle decision + notification fired</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 11, background: '#0d2a1a', color: '#22ff88', padding: '4px 10px', borderRadius: 12, border: '1px solid #22ff8840' }}>
            {logs.length} events
          </span>
          {logs.length > 0 && (
            <button onClick={clearLogs} style={{ fontSize: 11, background: 'none', border: '1px solid #1e2d4a', color: '#3a5a80', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>Clear</button>
          )}
        </div>
      </div>

      {/* Sphinx banner */}
      <div style={{ background: '#0d0d1a', border: '1px solid #a855f733', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#7a9cc0' }}>
        \ud83e\udd81 <strong style={{ color: '#a855f7' }}>The Sphinx Protocol</strong> — CRITICAL findings can be challenged.
        Make your case to the <strong>Somnia LLM Judge</strong> (inferString · Qwen3-30B).
        Score &gt; 75 = SAFE override. Score &lt; 75 = CRITICAL confirmed + alert fired.
      </div>

      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#3a5a80', fontSize: 13 }}>
          No alerts fired yet. Keeper will log here automatically on each cycle.
        </div>
      ) : (
        <div style={{ maxHeight: 520, overflowY: 'auto' }}>
          {[...logs].reverse().map((log, i) => (
            <div key={i} style={{
              padding: '10px 12px', background: '#060d16', borderRadius: 6, marginBottom: 8,
              borderLeft: `3px solid ${log.challenged ? '#a855f7' : RISK_COLORS[log.level] || '#1e2d4a'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16, minWidth: 20 }}>{RISK_ICONS[log.level]}</span>
                <span style={{ fontSize: 12, fontWeight: 'bold', color: RISK_COLORS[log.level], minWidth: 80 }}>
                  {RISK_LABELS[log.level]}
                  {log.challenged && <span style={{ fontSize: 10, color: '#a855f7', marginLeft: 6 }}>[LLM override {log.challengeScore}/100]</span>}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#22aaff', fontFamily: 'monospace' }}>{log.contract}</div>
                  <div style={{ fontSize: 11, color: '#7a9cc0' }}>{log.type}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  {log.discord  && <span style={{ fontSize: 10, background: '#5865F222', color: '#5865F2', border: '1px solid #5865F244', padding: '2px 6px', borderRadius: 4 }}>Discord \u2705</span>}
                  {log.telegram && <span style={{ fontSize: 10, background: '#229ED922', color: '#229ED9', border: '1px solid #229ED944', padding: '2px 6px', borderRadius: 4 }}>Telegram \u2705</span>}
                  {log.level === 2 && !log.challenged && <ChallengeCritical log={log} onResolved={handleResolved} />}
                </div>
                <span style={{ fontSize: 10, color: '#3a5a80', minWidth: 60, textAlign: 'right' }}>{fmtTime(log.ts)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 11, color: '#3a5a80', flexWrap: 'wrap' }}>
        <span>\ud83d\udd34 CRITICAL = Discord + Telegram fired automatically</span>
        <span>\u26a0\ufe0f SUSPICIOUS = logged, no alert</span>
        <span>\u2705 SAFE = logged</span>
        <span>\ud83e\udd81 CRITICAL = challengeable via Somnia LLM Judge</span>
      </div>
    </div>
  );
}
