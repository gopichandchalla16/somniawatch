import React, { useState, useEffect } from 'react';

export default function Leaderboard({ watch, explorerBase }) {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [apiData, setApiData]   = useState(null);

  useEffect(() => {
    // Try public audit API first (keeper.js exposes this)
    fetch('http://localhost:3001/api/leaderboard')
      .then(r => r.json())
      .then(d => setApiData(d.entries))
      .catch(() => {});

    if (!watch) return;
    const load = async () => {
      setLoading(true);
      try {
        const addrs = await watch.getAllRegistered();
        const rows = [];
        for (const addr of addrs) {
          try {
            const profile = await watch.registry(addr);
            const history = await watch.getAuditHistory(addr);
            const safeCount = history.filter(r => Number(r.riskLevel) === 0).length;
            rows.push({
              address: addr,
              safeCount,
              totalChecks: Number(profile.totalChecks),
              riskScore: Number(profile.riskScore),
              isFlagged: profile.isFlagged,
              tier: safeCount >= 10 ? 'Gold' : safeCount >= 5 ? 'Silver' : 'Bronze'
            });
          } catch {}
        }
        rows.sort((a, b) => b.safeCount - a.safeCount);
        setEntries(rows);
      } catch {}
      setLoading(false);
    };
    load();
  }, [watch]);

  const TIER_COLORS = { Gold: '#ffd700', Silver: '#c0c0c0', Bronze: '#cd7f32' };
  const displayEntries = apiData || entries;

  return (
    <div>
      <h3 style={{ color: '#e0e8ff', marginBottom: 4 }}>Security Leaderboard</h3>
      <p style={{ color: '#7a9cc0', fontSize: 13, marginBottom: 24 }}>Top contracts by consecutive SAFE audits on Somnia. Every entry is backed by immutable on-chain agent receipts.</p>

      {loading && <p style={{ color: '#3a5a80' }}>Loading leaderboard from chain...</p>}

      {displayEntries.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 40, background: '#0d1a2a', borderRadius: 10, color: '#3a5a80' }}>
          No contracts registered yet. Be the first to achieve a Gold certificate!
        </div>
      )}

      <div style={{ background: '#0d1a2a', borderRadius: 10, overflow: 'hidden', border: '1px solid #1e2d4a' }}>
        {displayEntries.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e2d4a' }}>
                {['Rank','Contract','Tier','Safe Audits','Total Audits','Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#3a5a80', fontWeight: 'normal' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayEntries.slice(0,10).map((row, i) => (
                <tr key={row.address} style={{ borderBottom: '1px solid #060d16' }}>
                  <td style={{ padding: '12px 16px', color: i < 3 ? '#ffd700' : '#7a9cc0' }}>#{i + 1}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <a href={`${explorerBase}/address/${row.address}`} target="_blank" rel="noreferrer" style={{ color: '#22aaff', fontSize: 12 }}>
                      {row.address.slice(0,10)}...{row.address.slice(-4)}
                    </a>
                  </td>
                  <td style={{ padding: '12px 16px', color: TIER_COLORS[row.tier], fontWeight: 'bold' }}>{row.tier}</td>
                  <td style={{ padding: '12px 16px', color: '#22ff88' }}>{row.safeCount}</td>
                  <td style={{ padding: '12px 16px', color: '#e0e8ff' }}>{row.totalChecks}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 4,
                      background: row.isFlagged ? '#3a0000' : '#0d2a1a',
                      color: row.isFlagged ? '#ff6666' : '#22ff88'
                    }}>{row.isFlagged ? 'FLAGGED' : 'ACTIVE'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: 20, padding: 16, background: '#0d1a2a', borderRadius: 8, border: '1px solid #1e2d4a', fontSize: 12, color: '#3a5a80' }}>
        Public Audit API: <code style={{ color: '#22aaff' }}>http://localhost:3001/api/audits/:address</code> (run keeper.js to enable)
      </div>
    </div>
  );
}
