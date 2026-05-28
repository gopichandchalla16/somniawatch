import React, { useState, useEffect } from 'react';

const RISK_COLORS = { 0: '#22ff88', 1: '#ffaa00', 2: '#ff4444' };
const RISK_LABELS = { 0: 'SAFE', 1: 'SUSPICIOUS', 2: 'CRITICAL' };
const RISK_ICONS  = { 0: '✅', 1: '⚠️', 2: '🔴' };

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour12: false });
}

export default function AlertLog() {
  const [logs, setLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sw_alert_log') || '[]'); } catch { return []; }
  });

  // Simulate receiving logs from keeper via localStorage polling
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const stored = JSON.parse(localStorage.getItem('sw_alert_log') || '[]');
        setLogs(stored);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Inject a demo log entry on first load if empty
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('sw_alert_log') || '[]');
    if (stored.length === 0) {
      const demo = [
        { ts: Date.now() - 1000*60*12, level: 2, contract: '0xEC263eBB...d39B', type: 'reentrancy_pattern',  discord: true, telegram: true,  receipt: '0xabc123' },
        { ts: Date.now() - 1000*60*7,  level: 1, contract: '0xEC263eBB...d39B', type: 'high_frequency_withdrawal', discord: false, telegram: false, receipt: '0xdef456' },
        { ts: Date.now() - 1000*60*2,  level: 0, contract: '0xEC263eBB...d39B', type: 'none',                discord: false, telegram: false, receipt: '0xghi789' },
      ];
      localStorage.setItem('sw_alert_log', JSON.stringify(demo));
      setLogs(demo);
    }
  }, []);

  const clearLogs = () => {
    localStorage.removeItem('sw_alert_log');
    setLogs([]);
  };

  return (
    <div style={{ background: '#0d1a2a', border: '1px solid #1e2d4a', borderRadius: 10, padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, color: '#e0e8ff', fontSize: 16 }}>🔔 Autonomous Alert Log</h3>
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

      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#3a5a80', fontSize: 13 }}>
          No alerts fired yet. Keeper will log here automatically on each cycle.
        </div>
      ) : (
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {[...logs].reverse().map((log, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              background: '#060d16', borderRadius: 6, marginBottom: 6,
              borderLeft: `3px solid ${RISK_COLORS[log.level] || '#1e2d4a'}`
            }}>
              {/* Icon + level */}
              <span style={{ fontSize: 16, minWidth: 20 }}>{RISK_ICONS[log.level]}</span>
              <span style={{ fontSize: 12, fontWeight: 'bold', color: RISK_COLORS[log.level], minWidth: 80 }}>
                {RISK_LABELS[log.level]}
              </span>

              {/* Contract + type */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#22aaff', fontFamily: 'monospace' }}>{log.contract}</div>
                <div style={{ fontSize: 11, color: '#7a9cc0' }}>{log.type}</div>
              </div>

              {/* Notification badges */}
              <div style={{ display: 'flex', gap: 4 }}>
                {log.discord && (
                  <span style={{ fontSize: 10, background: '#5865F222', color: '#5865F2', border: '1px solid #5865F244', padding: '2px 6px', borderRadius: 4 }}>Discord ✅</span>
                )}
                {log.telegram && (
                  <span style={{ fontSize: 10, background: '#229ED922', color: '#229ED9', border: '1px solid #229ED944', padding: '2px 6px', borderRadius: 4 }}>Telegram ✅</span>
                )}
              </div>

              {/* Time */}
              <span style={{ fontSize: 10, color: '#3a5a80', minWidth: 60, textAlign: 'right' }}>{fmtTime(log.ts)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 11, color: '#3a5a80' }}>
        <span>🔴 CRITICAL = Discord + Telegram fired automatically</span>
        <span>⚠️ SUSPICIOUS = logged, no alert</span>
        <span>✅ SAFE = logged</span>
      </div>
    </div>
  );
}
