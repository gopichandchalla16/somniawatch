import React, { useState, useEffect } from 'react';

const TIER_COLORS = { Gold: '#ffd700', Silver: '#c0c0c0', Bronze: '#cd7f32' };
const TIER_REQ    = { Gold: 10, Silver: 5, Bronze: 1 };

export default function CertificateGallery({ contracts, watch, cert, explorerBase }) {
  const [certs, setCerts] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!watch) return;
    const load = async () => {
      setLoading(true);
      const result = {};
      for (const addr of contracts) {
        try {
          const profile = await watch.registry(addr);
          const history = await watch.getAuditHistory(addr);
          const safeCount = history.filter(r => Number(r.riskLevel) === 0).length;
          const tier = safeCount >= 10 ? 'Gold' : safeCount >= 5 ? 'Silver' : 'Bronze';
          result[addr] = {
            tier,
            safeCount,
            totalChecks: Number(profile.totalChecks),
            isFlagged: profile.isFlagged,
            riskScore: Number(profile.riskScore)
          };
        } catch {
          result[addr] = { tier: 'Bronze', safeCount: 0, totalChecks: 0, isFlagged: false };
        }
      }
      setCerts(result);
      setLoading(false);
    };
    load();
  }, [watch, contracts]);

  return (
    <div>
      <h3 style={{ color: '#e0e8ff', marginBottom: 4 }}>On-Chain Security Certificates</h3>
      <p style={{ color: '#7a9cc0', fontSize: 13, marginBottom: 24 }}>
        NFT certificates are issued on-chain based on consecutive SAFE audit results.
        Bronze (1+) Silver (5+) Gold (10+) consecutive safe audits.
      </p>

      {loading && <p style={{ color: '#3a5a80' }}>Loading certificate data...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {contracts.map(addr => {
          const data = certs[addr];
          if (!data) return null;
          const color = TIER_COLORS[data.tier];
          const progress = Math.min(100, (data.safeCount / TIER_REQ['Gold']) * 100);

          return (
            <div key={addr} style={{
              background: '#0d1a2a',
              border: `2px solid ${color}`,
              borderRadius: 12,
              padding: 24,
              boxShadow: `0 0 20px ${color}22`
            }}>
              {/* Certificate Badge */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  border: `4px solid ${color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                  background: `${color}11`,
                  fontSize: 28
                }}>
                  {data.tier === 'Gold' ? 'G' : data.tier === 'Silver' ? 'S' : 'B'}
                </div>
                <h4 style={{ margin: 0, color: color, fontSize: 18 }}>{data.tier} Certificate</h4>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7a9cc0' }}>
                  {data.isFlagged ? 'FLAGGED - Certificate paused' : 'Active Security Badge'}
                </p>
              </div>

              {/* Stats */}
              <div style={{ fontSize: 12, color: '#7a9cc0', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Contract</span>
                  <code style={{ color: '#22aaff' }}>{addr.slice(0,8)}...{addr.slice(-4)}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Safe Audits</span>
                  <span style={{ color: '#22ff88' }}>{data.safeCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span>Total Audits</span>
                  <span style={{ color: '#e0e8ff' }}>{data.totalChecks}</span>
                </div>

                {/* Progress to Gold */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Progress to Gold</span>
                    <span>{data.safeCount}/10</span>
                  </div>
                  <div style={{ background: '#060d16', borderRadius: 4, height: 6 }}>
                    <div style={{ background: color, borderRadius: 4, height: 6, width: `${progress}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={`${explorerBase}/address/${addr}`}
                  target="_blank" rel="noreferrer"
                  style={{ flex: 1, textAlign: 'center', background: '#060d16', border: `1px solid ${color}`, color: color, padding: '8px', borderRadius: 6, fontSize: 12, textDecoration: 'none' }}
                >
                  View on Explorer
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {contracts.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#3a5a80' }}>No contracts registered. Go to Dashboard to register one.</div>
      )}

      {/* How certificates work */}
      <div style={{ marginTop: 32, background: '#0d1a2a', border: '1px solid #1e2d4a', borderRadius: 10, padding: 20 }}>
        <h4 style={{ color: '#22aaff', margin: '0 0 12px' }}>How Certificates Work</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, fontSize: 13 }}>
          {[['Bronze','#cd7f32','1+ consecutive\nSAFE audits','Entry-level security badge'],
            ['Silver','#c0c0c0','5+ consecutive\nSAFE audits','Trusted protocol status'],
            ['Gold','#ffd700','10+ consecutive\nSAFE audits','Top-tier security badge']].map(([tier, color, req, desc]) => (
            <div key={tier} style={{ background: '#060d16', border: `1px solid ${color}`, borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ color, fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>{tier}</div>
              <div style={{ color: '#7a9cc0', fontSize: 11, whiteSpace: 'pre', marginBottom: 4 }}>{req}</div>
              <div style={{ color: '#3a5a80', fontSize: 11 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
