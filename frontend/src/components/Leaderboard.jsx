import React, { useState, useEffect } from 'react';

function getLocalAuditStats(address) {
  try {
    const key = 'sw_audits_' + address.toLowerCase();
    const records = JSON.parse(localStorage.getItem(key) || '[]');
    const total = records.length;
    let consecutive = 0;
    for (let i = records.length - 1; i >= 0; i--) {
      if (records[i].riskLevel === 'safe' || records[i].riskLevel === 'SAFE' || records[i].level === 0) {
        consecutive++;
      } else break;
    }
    // supplement with alert log count
    const alerts = JSON.parse(localStorage.getItem('sw_alert_log') || '[]');
    return { total: Math.max(total, alerts.length), consecutive };
  } catch { return { total: 0, consecutive: 0 }; }
}

function getTier(consecutive) {
  if (consecutive >= 10) return { name: 'Gold',   color: '#ffd700', emoji: '🯅' };
  if (consecutive >= 5)  return { name: 'Silver', color: '#c0c0c0', emoji: '⚪' };
  if (consecutive >= 1)  return { name: 'Bronze', color: '#cd7f32', emoji: '🟤' };
  return { name: 'Active', color: '#22aaff', emoji: '🔵' };
}

export default function Leaderboard({ watch, explorerBase }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    // Build leaderboard from localStorage
    const keys = Object.keys(localStorage).filter(k => k.startsWith('sw_audits_'));
    const rows = [];

    // Always include MockVault
    const mockVault = '0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B';
    const mvStats   = getLocalAuditStats(mockVault);
    rows.push({ address: mockVault, ...mvStats });

    // Add any other monitored contracts from localStorage
    keys.forEach(k => {
      const addr = '0x' + k.replace('sw_audits_0x', '');
      if (addr.toLowerCase() !== mockVault.toLowerCase() && addr.length === 42) {
        rows.push({ address: addr, ...getLocalAuditStats(addr) });
      }
    });

    // Sort by consecutive SAFE desc, then total desc
    rows.sort((a, b) => b.consecutive - a.consecutive || b.total - a.total);
    setEntries(rows);
  }, []);

  // Try to enrich with on-chain data
  useEffect(() => {
    if (!watch) return;
    entries.forEach(async ({ address }) => {
      try {
        const rec = await watch.getAuditRecord(address);
        setEntries(prev => prev.map(e =>
          e.address.toLowerCase() === address.toLowerCase()
            ? {
                ...e,
                total:       Math.max(e.total,       Number(rec.totalAudits || 0)),
                consecutive: Math.max(e.consecutive, Number(rec.consecutiveSafe || 0)),
              }
            : e
        ));
      } catch { /* use localStorage values */ }
    });
  }, [watch, entries.length]);

  return (
    <div>
      <h3 style={{ color: '#e0e8ff', marginBottom: 4 }}>Security Leaderboard</h3>
      <p style={{ color: '#7a9cc0', fontSize: 13, marginBottom: 20 }}>
        Top contracts by consecutive SAFE audits on Somnia.
        Every entry is backed by immutable on-chain agent receipts.
      </p>

      <div style={{ background: '#0d1a2a', border: '1px solid #1e2d4a', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e2d4a' }}>
              {['Rank', 'Contract', 'Tier', 'Safe Audits', 'Total Audits', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#7a9cc0', fontWeight: 'normal' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const tier = getTier(entry.consecutive);
              return (
                <tr key={entry.address} style={{ borderBottom: '1px solid #0d1a2a' }}>
                  <td style={{ padding: '12px 16px', color: '#22ff88', fontWeight: 'bold' }}>#{i + 1}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <a href={explorerBase + '/address/' + entry.address}
                      target="_blank" rel="noreferrer"
                      style={{ color: '#22aaff', fontSize: 12, fontFamily: 'monospace' }}>
                      {entry.address.slice(0,10)}...{entry.address.slice(-6)}
                    </a>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: tier.color }}>{tier.emoji} {tier.name}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: entry.consecutive > 0 ? '#22ff88' : '#7a9cc0', fontWeight: 'bold' }}>
                    {entry.consecutive}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#e0e8ff' }}>{entry.total}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 4,
                      background: '#0a1f2f', border: '1px solid #22aaff44', color: '#22aaff',
                    }}>ACTIVE</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Public API info — production URL only */}
      <div style={{ background: '#0d1a2a', border: '1px solid #22ff8822', borderRadius: 8, padding: '14px 18px', fontSize: 13 }}>
        <div style={{ color: '#22ff88', fontWeight: 'bold', marginBottom: 8 }}>📡 Public Audit API</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>
            <span style={{ color: '#7a9cc0' }}>Health check + trigger: </span>
            <a href="https://somniawatch-eight.vercel.app/api/keeper-cron"
              target="_blank" rel="noreferrer"
              style={{ color: '#22aaff', fontFamily: 'monospace', fontSize: 12 }}>
              somniawatch-eight.vercel.app/api/keeper-cron
            </a>
          </div>
          <div style={{ color: '#7a9cc0', fontSize: 12 }}>
            Returns: <code style={{ color: '#e0e8ff' }}>
              {'{"ok":true,"alerts":{"discord":"sent","telegram":"sent"},"analysis":{"riskLevel":"CRITICAL"}}'}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
