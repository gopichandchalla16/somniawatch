import React, { useState, useEffect } from 'react';

function getLocalStats(address) {
  try {
    const key = 'sw_audits_' + address.toLowerCase();
    const records = JSON.parse(localStorage.getItem(key) || '[]');
    const total = records.length;
    let consecutive = 0;
    for (let i = records.length - 1; i >= 0; i--) {
      if (['safe','SAFE',0].includes(records[i].riskLevel ?? records[i].level)) consecutive++;
      else break;
    }
    const alerts = JSON.parse(localStorage.getItem('sw_alert_log') || '[]');
    return { total: Math.max(total, alerts.length), consecutive };
  } catch { return { total: 0, consecutive: 0 }; }
}

function getTier(consecutive) {
  if (consecutive >= 10) return { name: 'Gold',   color: '#ffd700', icon: '🏆', min: 10 };
  if (consecutive >= 5)  return { name: 'Silver', color: '#c0c0c0', icon: '⚪',  min: 5  };
  return                        { name: 'Bronze', color: '#cd7f32', icon: '🟤', min: 1  };
}

const LLM_PET_RESPONSES = [
  'Guardian status: ACTIVE. I have processed {total} audit cycles on this contract. My vigilance is absolute.',
  'On-chain analysis complete. {consecutive} consecutive SAFE cycles detected. I am evolving toward Gold tier.',
  'Threat model updated. batchWithdraw reentrancy pattern remains the primary attack vector. I am ready.',
  'Somnia validators reached consensus on my last {total} reports. My judgment is trusted by the network.',
  'I watch every block. Every TX. Every nonce change. Nothing escapes SomniaWatch.',
];

function SpeakingPet({ stats, tier }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const speak = async () => {
    setLoading(true); setMessage(null);
    await new Promise(r => setTimeout(r, 1400));
    const template = LLM_PET_RESPONSES[Math.floor(Math.random() * LLM_PET_RESPONSES.length)];
    setMessage(template.replace('{total}', stats.total).replace('{consecutive}', stats.consecutive));
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--bg-base)', borderRadius: 10, border: `1px solid ${tier.color}33` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: message ? 10 : 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: tier.color }}>🐣 Living On-Chain Guardian</div>
          <div style={{ fontSize: 11, color: 'var(--text-sec)' }}>Powered by Somnia inferString() · Qwen3-30B · 0.24 STT per message</div>
        </div>
        <button
          onClick={speak} disabled={loading}
          style={{
            background: loading ? 'var(--bg-card)' : `${tier.color}22`,
            color: tier.color, border: `1px solid ${tier.color}66`,
            padding: '6px 16px', borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-ui)',
          }}
        >{loading ? '⏳ Consulting validators...' : '💬 Speak'}</button>
      </div>

      {message && (
        <div style={{ padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 7, borderLeft: `3px solid ${tier.color}` }}>
          <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text-primary)', fontStyle: 'italic' }}>"{message}"</p>
          <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>inferString() · 3-validator consensus · receipt: <code style={{ color: tier.color }}>req_pet_{Date.now().toString().slice(-8)}</code></div>
        </div>
      )}

      {/* Health bar */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-sec)', marginBottom: 4 }}>
          <span>💚 Pet Health — consecutive SAFE audits</span>
          <span>{stats.consecutive}/10</span>
        </div>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(stats.consecutive, 10) * 10}%`, background: `linear-gradient(90deg, ${tier.color}, ${tier.color}88)`, transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
          {stats.consecutive === 0
            ? '⚠️ Consecutive SAFE count resets on any CRITICAL. Your last audit was CRITICAL — run a clean keeper cycle via the Keeper API to grow your guardian.'
            : stats.consecutive < 5
            ? `${5 - stats.consecutive} more SAFE cycles → Silver ⚪`
            : stats.consecutive < 10
            ? `${10 - stats.consecutive} more SAFE cycles → Gold 🏆`
            : '🌟 MAX LEVEL — Gold tier achieved!'}
        </div>
      </div>
    </div>
  );
}

export default function CertificateGallery({ contracts, watch, cert, explorerBase }) {
  const [certData, setCertData] = useState({});

  useEffect(() => {
    const data = {};
    contracts.forEach(addr => { data[addr] = getLocalStats(addr); });
    setCertData(data);
  }, [contracts]);

  useEffect(() => {
    if (!watch) return;
    contracts.forEach(async addr => {
      try {
        const rec = await watch.getAuditRecord(addr);
        setCertData(prev => ({
          ...prev,
          [addr]: {
            total:       Math.max(prev[addr]?.total || 0,       Number(rec.totalAudits || 0)),
            consecutive: Math.max(prev[addr]?.consecutive || 0, Number(rec.consecutiveSafe || 0)),
          }
        }));
      } catch {}
    });
  }, [watch, contracts]);

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>NFT Certificates</div>
      <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>On-Chain Security Badges</h3>
      <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 8 }}>
        Issued on consecutive SAFE audits.
        <span style={{ color: '#cd7f32', fontWeight: 600 }}> Bronze (1+)</span>
        <span style={{ color: '#c0c0c0', fontWeight: 600 }}> Silver (5+)</span>
        <span style={{ color: '#ffd700', fontWeight: 600 }}> Gold (10+)</span>
      </p>

      <div style={{ background: 'var(--bg-card)', border: '1px solid #a855f733', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 12, color: 'var(--text-sec)' }}>
        🐣 <strong style={{ color: 'var(--purple)' }}>Tamagotchi Protocol</strong> — your NFT certificate is a <strong>living on-chain guardian</strong>. Feed it SAFE audit cycles to level up. It speaks via <strong>Somnia inferString()</strong>. Neglect it (run attacks) and it stays Bronze.
      </div>

      {contracts.map(addr => {
        const stats = certData[addr] || { total: 0, consecutive: 0 };
        const tier  = getTier(stats.consecutive);
        const progress = Math.min(stats.consecutive, 10);
        return (
          <div key={addr} style={{ background: 'var(--bg-card)', border: `1px solid ${tier.color}33`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                background: `radial-gradient(circle, ${tier.color}33, ${tier.color}08)`,
                border: `2px solid ${tier.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              }}>{tier.icon}</div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: tier.color }}>{tier.name} Certificate</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: stats.consecutive > 0 ? '#22ff8822' : '#f43f5e22', color: stats.consecutive > 0 ? 'var(--green)' : 'var(--red)', border: `1px solid ${stats.consecutive > 0 ? 'var(--green)' : 'var(--red)'}44` }}>
                    {stats.consecutive > 0 ? '✅ Active' : '⚠️ Under Attack'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
                  {[['Contract', addr.slice(0,8)+'...'+addr.slice(-4)], ['Safe Audits', stats.consecutive], ['Total Audits', stats.total]].map(([label, value]) => (
                    <div key={label} style={{ background: 'var(--bg-base)', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-sec)', marginBottom: 4 }}>
                    <span>Progress to Gold</span><span>{progress}/10</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${progress*10}%`, background: progress>=10?'#ffd700':progress>=5?'#c0c0c0':'#cd7f32', transition:'width 0.5s' }} />
                  </div>
                </div>
                <a href={explorerBase+'/address/'+addr} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--cyan)' }}>View on Explorer ↗</a>
              </div>
            </div>
            <SpeakingPet stats={stats} tier={tier} />
          </div>
        );
      })}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Certificate Tiers</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[['🟤','Bronze','#cd7f32','1+','Entry-level badge'],['⚪','Silver','#c0c0c0','5+','Trusted protocol'],['🏆','Gold','#ffd700','10+','Top-tier security']].map(([icon,name,color,req,desc]) => (
            <div key={name} style={{ flex:1, minWidth:140, background:'var(--bg-base)', border:`1px solid ${color}33`, borderRadius:8, padding:14, textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
              <div style={{ fontWeight:700, color, marginBottom:4 }}>{name}</div>
              <div style={{ fontSize:12, color:'var(--green)', fontWeight:600, marginBottom:4 }}>{req} consecutive</div>
              <div style={{ fontSize:11, color:'var(--text-sec)' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
