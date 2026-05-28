import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const RISK_COLORS = { 0: '#22ff88', 1: '#ffaa00', 2: '#ff4444' };
const RISK_LABELS = { 0: 'SAFE', 1: 'SUSPICIOUS', 2: 'CRITICAL' };
const RISK_SCORE  = { 0: 10, 1: 60, 2: 100 };

export default function AuditFeed({ contracts, watch, explorerBase }) {
  const [histories, setHistories] = useState({});
  const [loading, setLoading]    = useState(false);

  const loadHistory = useCallback(async () => {
    if (!watch || !contracts.length) return;
    setLoading(true);
    const result = {};
    for (const addr of contracts) {
      try {
        const records = await watch.getAuditHistory(addr);
        result[addr] = records.map((r, i) => ({
          index: i + 1,
          time: new Date(Number(r.timestamp) * 1000).toLocaleTimeString(),
          risk: RISK_SCORE[Number(r.riskLevel)] || 10,
          riskLevel: Number(r.riskLevel),
          riskType: r.riskType,
          reasoning: r.reasoning,
          receiptId: r.receiptId?.toString(),
          autoActioned: r.autoActioned
        }));
      } catch {
        result[addr] = [];
      }
    }
    setHistories(result);
    setLoading(false);
  }, [watch, contracts]);

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 30000);
    return () => clearInterval(interval);
  }, [loadHistory]);

  // Demo data if no on-chain history yet
  const demoData = [
    { index: 1, time: 'T-4', risk: 10,  riskLevel: 0 },
    { index: 2, time: 'T-3', risk: 10,  riskLevel: 0 },
    { index: 3, time: 'T-2', risk: 60,  riskLevel: 1 },
    { index: 4, time: 'T-1', risk: 100, riskLevel: 2 },
    { index: 5, time: 'Now', risk: 10,  riskLevel: 0 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: '#e0e8ff' }}>Live Audit Feed + Risk History</h3>
        <button onClick={loadHistory} style={{ background: '#0d2a3a', border: '1px solid #1e2d4a', color: '#22aaff', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {contracts.map(addr => {
        const history = histories[addr] || [];
        const chartData = history.length > 0 ? history : demoData;
        const latest = history[history.length - 1];
        const level = latest ? latest.riskLevel : null;

        return (
          <div key={addr} style={{ background: '#0d1a2a', border: `1px solid ${level === 2 ? '#ff4444' : level === 1 ? '#ffaa00' : '#1e2d4a'}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            {/* Contract header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <code style={{ fontSize: 13, color: '#7af' }}>{addr.slice(0,10)}...{addr.slice(-6)}</code>
                {latest && (
                  <span style={{ marginLeft: 12, fontSize: 13, fontWeight: 'bold', color: RISK_COLORS[level] }}>
                    {RISK_LABELS[level]}
                  </span>
                )}
                {latest?.autoActioned && <span style={{ marginLeft: 8, fontSize: 11, background: '#3a0000', color: '#ff6666', padding: '2px 8px', borderRadius: 4 }}>AUTO-FLAGGED</span>}
              </div>
              <a href={`${explorerBase}/address/${addr}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#22aaff' }}>Explorer</a>
            </div>

            {/* Risk History Chart */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: '#3a5a80', margin: '0 0 6px' }}>
                {history.length > 0 ? `${history.length} audit cycles recorded` : 'Demo data — live data loads after first keeper cycle'}
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#3a5a80' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#3a5a80' }} />
                  <Tooltip
                    contentStyle={{ background: '#0a0f1a', border: '1px solid #1e2d4a', borderRadius: 6 }}
                    formatter={(val) => [`${val}`, 'Risk Score']}
                  />
                  <Line type="monotone" dataKey="risk" stroke="#22ff88" strokeWidth={2} dot={{ fill: '#22ff88', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Latest audit record */}
            {latest && (
              <div style={{ background: '#060d16', borderRadius: 6, padding: 12, fontSize: 12 }}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ color: '#3a5a80' }}>Risk Type: <span style={{ color: '#e0e8ff' }}>{latest.riskType}</span></span>
                  <span style={{ color: '#3a5a80' }}>Time: <span style={{ color: '#e0e8ff' }}>{latest.time}</span></span>
                  {latest.receiptId && (
                    <a href={`${explorerBase}/tx/${latest.receiptId}`} target="_blank" rel="noreferrer" style={{ color: '#22aaff' }}>
                      Receipt: {latest.receiptId.slice(0,12)}...
                    </a>
                  )}
                </div>
                <p style={{ color: '#7a9cc0', margin: 0 }}>{latest.reasoning}</p>
              </div>
            )}

            {/* Full history list */}
            {history.length > 1 && (
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: 'pointer', fontSize: 12, color: '#22aaff' }}>Show all {history.length} audit records</summary>
                <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
                  {[...history].reverse().map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '4px 0', borderBottom: '1px solid #0d1a2a', fontSize: 11 }}>
                      <span style={{ color: RISK_COLORS[r.riskLevel], minWidth: 70 }}>{RISK_LABELS[r.riskLevel]}</span>
                      <span style={{ color: '#3a5a80' }}>{r.time}</span>
                      <span style={{ color: '#7a9cc0' }}>{r.riskType}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        );
      })}

      {contracts.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#3a5a80' }}>No contracts registered yet. Add one above.</div>
      )}
    </div>
  );
}
