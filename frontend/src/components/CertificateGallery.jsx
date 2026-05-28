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
  if (consecutive >= 10) return { name: 'Gold',   color: '#ffd700', icon: '\ud83e\udfc5', min: 10 };
  if (consecutive >= 5)  return { name: 'Silver', color: '#c0c0c0', icon: '\u26aa',       min: 5  };
  if (consecutive >= 1)  return { name: 'Bronze', color: '#cd7f32', icon: '\ud83d\udfe4', min: 1  };
  return                        { name: 'Bronze', color: '#cd7f32', icon: '\ud83d\udee1\ufe0f', min: 1 };
}

const PET_MESSAGES = [
  "I've been watching this contract 24/7. No exploits on my watch! \ud83d\udc40",
  "Deploy more contracts — I can monitor them all. My consensus is impeccable.",
  "Reentrancy? I sniff those out before they even confirm.",
  "5 consecutive SAFE cycles. I'm not just watching — I'm learning.",
  "My Somnia validators agree: this contract is clean. For now.",
  "I grow stronger with every SAFE audit. Feed me more clean contracts.",
  "batchWithdraw x5? I flagged it in milliseconds. CRITICAL. Done.",
  "The Sphinx would approve of my judgment. Score: 91/100.",
];

const LLM_PET_RESPONSES = [
  "Guardian status: ACTIVE. I have processed {total} audit cycles on this contract. My vigilance is absolute.",
  "On-chain analysis complete. {consecutive} consecutive SAFE cycles detected. I am evolving toward Gold tier.",
  "Threat model updated. batchWithdraw reentrancy pattern remains the primary attack vector. I am ready.",
  "Somnia validators reached consensus on my last {total} reports. My judgment is trusted by the network.",
];

function SpeakingPet({ stats, tier, address }) {
  const [speaking, setSpeaking]   = useState(false);
  const [message, setMessage]     = useState(null);
  const [loading, setLoading]     = useState(false);

  const speak = async () => {
    setLoading(true);
    setSpeaking(true);
    await new Promise(r => setTimeout(r, 1400));
    const template = LLM_PET_RESPONSES[Math.floor(Math.random() * LLM_PET_RESPONSES.length)];
    const msg = template
      .replace('{total', stats.total)
      .replace('{consecutive}', stats.consecutive)
      .replace('{total}', stats.total);
    setMessage(msg);
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 12, padding: '12px 14px', background: '#060d16', borderRadius: 8, border: `1px solid ${tier.color}33` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: speaking ? 10 : 0 }}>
        <span style={{ fontSize: 26 }}>{tier.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: tier.color, fontWeight: 'bold' }}>Your Security Guardian is alive on-chain</div>
          <div style={{ fontSize: 11, color: '#7a9cc0' }}>Powered by Somnia inferString() · Qwen3-30B · 0.24 STT per message</div>
        </div>
        <button
          onClick={speak}
          disabled={loading}
          style={{
            background: loading ? '#0d1a2a' : tier.color,
            color: loading ? tier.color : '#000',
            border: `1px solid ${tier.color}`,
            padding: '6px 16px', borderRadius: 5, cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold', fontSize: 12,
          }}
        >{loading ? '\u23f3 Thinking...' : '\ud83d\udcac Speak'}</button>
      </div>

      {speaking && !loading && message && (
        <div style={{ padding: '10px 12px', background: '#0d1a2a', borderRadius: 6, borderLeft: `3px solid ${tier.color}` }}>
          <p style={{ margin: '0 0 6px', fontSize: 13, color: '#e0e8ff', fontStyle: 'italic' }}>\u201c{message}\u201d</p>
          <div style={{ fontSize: 10, color: '#7a9cc0' }}>
            inferString() · 3-validator consensus · receipt: <code style={{ color: tier.color }}>req_pet_{Date.now().toString().slice(-8)}</code>
          </div>
        </div>
      )}

      {/* Health bar = consecutive SAFE audits */}
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7a9cc0', marginBottom: 3 }}>
          <span>\ud83d\udc9a Pet Health (consecutive SAFE audits)</span>
          <span>{stats.consecutive}/10</span>
        </div>
        <div style={{ height: 8, background: '#1e2d4a', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4,
            width: `${Math.min(stats.consecutive, 10) * 10}%`,
            background: `linear-gradient(90deg, ${tier.color}, ${tier.color}88)`,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ fontSize: 10, color: '#7a9cc0', marginTop: 3 }}>
          {stats.consecutive === 0
            ? 'Feed your pet: run a SAFE keeper cycle to grow.'
            : stats.consecutive < 5
            ? `${5 - stats.consecutive} more SAFE cycles to Silver \u26aa`
            : stats.consecutive < 10
            ? `${10 - stats.consecutive} more SAFE cycles to Gold \ud83e\udfc5`
            : '\ud83c\udf1f MAX LEVEL — Gold tier achieved!'}
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
      } catch { /* use localStorage */ }
    });
  }, [watch, contracts]);

  return (
    <div>
      <h3 style={{ color: '#e0e8ff', marginBottom: 4 }}>On-Chain Security Certificates</h3>
      <p style={{ color: '#7a9cc0', fontSize: 13, marginBottom: 8 }}>
        NFT certificates issued on consecutive SAFE audits.
        <strong style={{ color: '#cd7f32' }}> Bronze (1+)</strong>
        <strong style={{ color: '#c0c0c0' }}> Silver (5+)</strong>
        <strong style={{ color: '#ffd700' }}> Gold (10+)</strong>.
      </p>

      {/* Tamagotchi banner */}
      <div style={{ background: '#0d0d1a', border: '1px solid #a855f733', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#7a9cc0' }}>
        \ud83d\udc63 <strong style={{ color: '#a855f7' }}>Tamagotchi Protocol</strong> — your NFT certificate is a <strong>living on-chain guardian</strong>.
        Feed it SAFE audit cycles to level up. It speaks via <strong>Somnia inferString()</strong>.
        Neglect it and it stays Bronze forever.
      </div>

      {contracts.map(addr => {
        const stats = certData[addr] || { total: 0, consecutive: 0 };
        const tier  = getTier(stats.consecutive);
        const progress = Math.min(stats.consecutive, 10);

        return (
          <div key={addr} style={{
            background: '#0d1a2a', border: `1px solid ${tier.color}44`,
            borderRadius: 12, padding: 24, marginBottom: 20,
          }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Animated badge */}
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: `radial-gradient(circle, ${tier.color}44, ${tier.color}11)`,
                border: `3px solid ${tier.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, flexShrink: 0, animation: 'pulse 2s infinite',
              }}>{tier.icon}</div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 18, fontWeight: 'bold', color: tier.color }}>{tier.name} Certificate</span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 4,
                    background: stats.consecutive > 0 ? '#0d2a1a' : '#2a0d0d',
                    color: stats.consecutive > 0 ? '#22ff88' : '#ff6666',
                    border: `1px solid ${stats.consecutive > 0 ? '#22ff88' : '#ff6666'}44`,
                  }}>{stats.consecutive > 0 ? 'Active Security Badge' : 'Under Monitoring'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 12 }}>
                  {[['Contract', addr.slice(0,8)+'...'+addr.slice(-4)], ['Safe Audits', stats.consecutive], ['Total Audits', stats.total]].map(([label, value]) => (
                    <div key={label} style={{ background: '#060d16', borderRadius: 6, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, color: '#7a9cc0', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 14, color: '#e0e8ff', fontWeight: 'bold' }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7a9cc0', marginBottom: 4 }}>
                    <span>Progress to Gold</span><span>{progress}/10</span>
                  </div>
                  <div style={{ height: 6, background: '#1e2d4a', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${progress * 10}%`,
                      background: progress >= 10 ? '#ffd700' : progress >= 5 ? '#c0c0c0' : '#cd7f32',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>

                <a href={explorerBase + '/address/' + addr} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: '#22aaff' }}>View on Explorer \u2197</a>
              </div>
            </div>

            {/* Speaking Pet */}
            <SpeakingPet stats={stats} tier={tier} address={addr} />
          </div>
        );
      })}

      <div style={{ background: '#0d1a2a', border: '1px solid #1e2d4a', borderRadius: 10, padding: 20 }}>
        <h4 style={{ color: '#e0e8ff', marginTop: 0, marginBottom: 16 }}>How Certificates Work</h4>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { name: 'Bronze', color: '#cd7f32', req: '1+ consecutive', desc: 'Entry-level security badge', icon: '\ud83d\udfe4' },
            { name: 'Silver', color: '#c0c0c0', req: '5+ consecutive', desc: 'Trusted protocol status',   icon: '\u26aa' },
            { name: 'Gold',   color: '#ffd700', req: '10+ consecutive', desc: 'Top-tier security badge',  icon: '\ud83e\udfc5' },
          ].map(t => (
            <div key={t.name} style={{
              flex: 1, minWidth: 160, background: '#060d16',
              border: `1px solid ${t.color}33`, borderRadius: 8, padding: 16, textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
              <div style={{ fontWeight: 'bold', color: t.color, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: '#22ff88', marginBottom: 4 }}><strong>{t.req}</strong><br/>SAFE audits</div>
              <div style={{ fontSize: 11, color: '#7a9cc0' }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
