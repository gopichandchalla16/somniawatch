import React, { useState, useEffect } from 'react';

function getLocalStats(address) {
  try {
    const key = 'sw_audits_' + address.toLowerCase();
    const records = JSON.parse(localStorage.getItem(key) || '[]');
    const total = records.length;
    // Count consecutive SAFE from most recent backwards
    let consecutive = 0;
    for (let i = records.length - 1; i >= 0; i--) {
      if (records[i].riskLevel === 'safe' || records[i].riskLevel === 'SAFE' || records[i].level === 0) {
        consecutive++;
      } else break;
    }
    // Also check alert log for this contract
    const alerts = JSON.parse(localStorage.getItem('sw_alert_log') || '[]');
    const contractAlerts = alerts.filter(a =>
      a.contract && address.toLowerCase().includes(a.contract.replace('...','').toLowerCase().slice(0,6))
    );
    const totalAudits = Math.max(total, contractAlerts.length);
    return { total: totalAudits, consecutive };
  } catch { return { total: 0, consecutive: 0 }; }
}

function getTier(consecutive) {
  if (consecutive >= 10) return { name: 'Gold', emoji: '🯅', color: '#ffd700', min: 10 };
  if (consecutive >= 5)  return { name: 'Silver', emoji: '🯅', color: '#c0c0c0', min: 5 };
  if (consecutive >= 1)  return { name: 'Bronze', emoji: '🯅', color: '#cd7f32', min: 1 };
  return { name: 'Bronze', emoji: '🛡️', color: '#cd7f32', min: 1 };
}

export default function CertificateGallery({ contracts, watch, cert, explorerBase }) {
  const [certData, setCertData] = useState({});

  useEffect(() => {
    const data = {};
    contracts.forEach(addr => {
      data[addr] = getLocalStats(addr);
    });
    setCertData(data);
  }, [contracts]);

  // Also try on-chain, prefer whichever is higher
  useEffect(() => {
    if (!watch) return;
    contracts.forEach(async addr => {
      try {
        const rec = await watch.getAuditRecord(addr);
        const onChainTotal = Number(rec.totalAudits || 0);
        const onChainSafe  = Number(rec.consecutiveSafe || 0);
        setCertData(prev => ({
          ...prev,
          [addr]: {
            total:       Math.max(prev[addr]?.total || 0,       onChainTotal),
            consecutive: Math.max(prev[addr]?.consecutive || 0, onChainSafe),
          }
        }));
      } catch { /* on-chain not ready, localStorage values are used */ }
    });
  }, [watch, contracts]);

  return (
    <div>
      <h3 style={{ color: '#e0e8ff', marginBottom: 4 }}>On-Chain Security Certificates</h3>
      <p style={{ color: '#7a9cc0', fontSize: 13, marginBottom: 24 }}>
        NFT certificates are issued on-chain based on consecutive SAFE audit results.
        <strong style={{ color: '#cd7f32' }}> Bronze (1+)</strong>
        <strong style={{ color: '#c0c0c0' }}> Silver (5+)</strong>
        <strong style={{ color: '#ffd700' }}> Gold (10+)</strong> consecutive safe audits.
      </p>

      {contracts.map(addr => {
        const stats = certData[addr] || { total: 0, consecutive: 0 };
        const tier  = getTier(stats.consecutive);
        const progressToGold = Math.min(stats.consecutive, 10);

        return (
          <div key={addr} style={{
            background: '#0d1a2a', border: `1px solid ${tier.color}44`,
            borderRadius: 12, padding: 24, marginBottom: 20,
            display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap',
          }}>
            {/* Badge */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: `radial-gradient(circle, ${tier.color}33, ${tier.color}11)`,
              border: `3px solid ${tier.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, flexShrink: 0,
            }}>
              {tier.name === 'Gold' ? '🯅' : tier.name === 'Silver' ? '⚪' : 'B'}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 'bold', color: tier.color }}>
                  {tier.name} Certificate
                </span>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 4,
                  background: stats.consecutive > 0 ? '#0d2a1a' : '#2a0d0d',
                  color: stats.consecutive > 0 ? '#22ff88' : '#ff6666',
                  border: `1px solid ${stats.consecutive > 0 ? '#22ff88' : '#ff6666'}44`,
                }}>
                  {stats.consecutive > 0 ? 'Active Security Badge' : 'Under Monitoring'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 12 }}>
                {[['Contract', addr.slice(0,8) + '...' + addr.slice(-4)],
                  ['Safe Audits', stats.consecutive],
                  ['Total Audits', stats.total],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: '#060d16', borderRadius: 6, padding: '8px 12px' }}>
                    <div style={{ fontSize: 11, color: '#7a9cc0', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, color: '#e0e8ff', fontWeight: 'bold' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Gold progress bar */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7a9cc0', marginBottom: 4 }}>
                  <span>Progress to Gold</span>
                  <span>{progressToGold}/10</span>
                </div>
                <div style={{ height: 6, background: '#1e2d4a', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${progressToGold * 10}%`,
                    background: progressToGold >= 10 ? '#ffd700' : progressToGold >= 5 ? '#c0c0c0' : '#cd7f32',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              <a href={explorerBase + '/address/' + addr} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: '#22aaff' }}>View on Explorer ↗</a>
            </div>
          </div>
        );
      })}

      {/* How it works */}
      <div style={{ background: '#0d1a2a', border: '1px solid #1e2d4a', borderRadius: 10, padding: 20, marginTop: 8 }}>
        <h4 style={{ color: '#e0e8ff', marginTop: 0, marginBottom: 16 }}>How Certificates Work</h4>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { name: 'Bronze', color: '#cd7f32', req: '1+ consecutive', desc: 'Entry-level security badge' },
            { name: 'Silver', color: '#c0c0c0', req: '5+ consecutive', desc: 'Trusted protocol status' },
            { name: 'Gold',   color: '#ffd700', req: '10+ consecutive', desc: 'Top-tier security badge' },
          ].map(t => (
            <div key={t.name} style={{
              flex: 1, minWidth: 160, background: '#060d16',
              border: `1px solid ${t.color}33`, borderRadius: 8, padding: 16, textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 6, color: t.color }}>
                {t.name === 'Gold' ? '🯅' : t.name === 'Silver' ? '⚪' : '🟤'}
              </div>
              <div style={{ fontWeight: 'bold', color: t.color, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: '#22ff88', marginBottom: 4 }}>
                <strong>{t.req}</strong><br/>SAFE audits
              </div>
              <div style={{ fontSize: 11, color: '#7a9cc0' }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
