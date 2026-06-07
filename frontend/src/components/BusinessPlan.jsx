import React, { useState } from 'react';

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: 'var(--text-sec)',
    border: 'var(--border)',
    tag: null,
    features: [
      '3 contracts monitored',
      '1 audit / contract / day',
      'Discord + Telegram alerts',
      'Public leaderboard entry',
      'Force Audit (manual)',
      'Shannon Explorer receipts',
    ],
    cta: 'Start Free',
    ctaClass: 'btn-ghost',
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    color: 'var(--purple-light)',
    border: 'rgba(123,47,255,0.5)',
    tag: 'Most Popular',
    features: [
      '50 contracts monitored',
      'Continuous keeper (every 6h)',
      'Sphinx Protocol challenges',
      'NFT Audit Certificates',
      'Priority alert routing',
      'Agent Explorer receipts',
      'Swarm Audit (batch 3–10)',
      'Email + Webhook alerts',
    ],
    cta: 'Coming Soon',
    ctaClass: 'btn-purple',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    color: 'var(--cyan)',
    border: 'rgba(0,212,255,0.4)',
    tag: 'For Protocols',
    features: [
      'Unlimited contracts',
      'Real-time mempool monitoring',
      'Custom agent training',
      'SLA with guaranteed uptime',
      'White-label dashboard',
      'Dedicated Somnia node',
      'On-chain insurance hooks',
      'Priority support channel',
    ],
    cta: 'Contact Us',
    ctaClass: 'btn-cyan',
  },
];

const MARKET_STATS = [
  { value: '$2.3B', label: 'Smart contract audit market size (2025)', color: 'var(--purple-light)' },
  { value: '4 wks', label: 'Average manual audit turnaround time', color: 'var(--orange)' },
  { value: '$50K+', label: 'Typical manual audit cost per protocol', color: 'var(--red)' },
  { value: '$0.02', label: 'SomniaWatch cost per full audit cycle', color: 'var(--green)' },
];

const ROADMAP = [
  { q: 'Q2 2026', label: 'Agentathon Launch', done: true,  items: ['Force Audit live', 'Sphinx Protocol', 'Discord + Telegram alerts', 'NFT certificates', 'Leaderboard'] },
  { q: 'Q3 2026', label: 'Pro Tier Beta',     done: false, items: ['Pro subscriptions', 'Email + Webhook alerts', 'Swarm Audit v2', 'Multi-chain expansion', 'SDK for dApp devs'] },
  { q: 'Q4 2026', label: 'Enterprise Launch', done: false, items: ['Custom agent training', 'Mempool monitoring', 'On-chain insurance hooks', 'DAO governance', 'Mainnet deploy'] },
  { q: 'Q1 2027', label: 'Protocol Network',  done: false, items: ['SomniaWatch DAO token', 'Peer audit marketplace', 'Cross-chain bridge monitoring', 'Institutional partners'] },
];

const COMPETITORS = [
  { name: 'Manual Audit',    cost: '$50,000+', speed: '2–4 weeks',    autonomous: false, onchain: false, llm: false  },
  { name: 'OpenZeppelin',    cost: '$10,000+', speed: '1–2 weeks',    autonomous: false, onchain: false, llm: false  },
  { name: 'Forta Network',   cost: '~$200/mo', speed: 'Minutes',      autonomous: true,  onchain: false, llm: false  },
  { name: 'SomniaWatch ⚡',  cost: '~$0.02',   speed: '<400ms',       autonomous: true,  onchain: true,  llm: true   },
];

export default function BusinessPlan() {
  const [activeSection, setActiveSection] = useState('market');

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <div style={{ fontSize:28 }}>📈</div>
          <div>
            <h2 style={{ margin:0 }}>SomniaWatch <span className="gradient-text">Business Plan</span></h2>
            <p style={{ margin:0, fontSize:13 }}>From hackathon to product — the path to $5M ARR on Somnia Agentic L1</p>
          </div>
        </div>
      </div>

      {/* Section nav */}
      <div className="scroll-row" style={{ marginBottom:24 }}>
        {[
          { id:'market',      label:'📊 Market Opportunity' },
          { id:'pricing',     label:'💳 Pricing Plans' },
          { id:'competitors', label:'⚔️ Why We Win' },
          { id:'roadmap',     label:'🗺️ Roadmap' },
          { id:'why-somnia',  label:'⚡ Why Somnia' },
        ].map(s => (
          <button
            key={s.id}
            className={`btn ${activeSection === s.id ? 'btn-purple' : 'btn-ghost'} btn-sm`}
            onClick={() => setActiveSection(s.id)}
            style={{ flexShrink:0 }}
          >{s.label}</button>
        ))}
      </div>

      {/* MARKET */}
      {activeSection === 'market' && (
        <div className="slide-up">
          <div className="grid-4" style={{ marginBottom:24 }}>
            {MARKET_STATS.map(s => (
              <div key={s.label} className="stat-box">
                <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
                <div className="stat-label" style={{ marginTop:8, fontSize:11 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="card card-glow">
            <div className="section-label">The Problem</div>
            <h3 style={{ marginBottom:12 }}>Smart contract security is broken</h3>
            <div className="grid-2">
              <div>
                <p style={{ fontSize:14, marginBottom:12 }}>Every DeFi protocol launching today needs a smart contract audit. But the current options are either <strong style={{color:'var(--red)'}}>slow and expensive</strong> (manual firms) or <strong style={{color:'var(--orange)'}}>incomplete</strong> (rule-based scanners that miss logic bugs).</p>
                <p style={{ fontSize:14 }}>In 2024, <strong style={{color:'var(--red)'}}>$2.1 billion</strong> was lost to smart contract exploits — all of which happened after protocols were deployed, many after audits. The market needs continuous, intelligent monitoring — not a one-time snapshot.</p>
              </div>
              <div>
                <div className="card" style={{ borderColor:'rgba(255,59,107,0.3)', background:'rgba(255,59,107,0.05)' }}>
                  <div className="section-label" style={{ color:'var(--red)' }}>Current Gaps</div>
                  {['No real-time monitoring after deployment','Manual audits take weeks — attacks take seconds','No LLM reasoning — only pattern matching','No on-chain proof of audit integrity','Costs price out 90% of new protocols'].map(g => (
                    <div key={g} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:8, fontSize:13 }}>
                      <span style={{ color:'var(--red)', flexShrink:0, marginTop:2 }}>✗</span>
                      <span style={{ color:'var(--text-sec)' }}>{g}</span>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ borderColor:'rgba(16,185,129,0.3)', background:'rgba(16,185,129,0.05)' }}>
                  <div className="section-label" style={{ color:'var(--green)' }}>SomniaWatch Solves</div>
                  {['Autonomous 24/7 monitoring on Somnia L1','Sub-400ms audit via native LLM inference','3-agent consensus — fetch + infer + verify','Immutable on-chain receipts, Shannon Explorer','0.38 STT per audit — democratises security'].map(g => (
                    <div key={g} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:8, fontSize:13 }}>
                      <span style={{ color:'var(--green)', flexShrink:0, marginTop:2 }}>✓</span>
                      <span style={{ color:'var(--text-sec)' }}>{g}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRICING */}
      {activeSection === 'pricing' && (
        <div className="slide-up">
          <div className="grid-3" style={{ marginBottom:20, alignItems:'start' }}>
            {TIERS.map(t => (
              <div key={t.name} className="card" style={{ border:`1px solid ${t.border}`, position:'relative', boxShadow: t.tag === 'Most Popular' ? '0 0 32px rgba(123,47,255,0.25)' : undefined }}>
                {t.tag && (
                  <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)' }}>
                    <span className={`badge ${t.tag==='Most Popular'?'badge-purple':'badge-cyan'}`}>{t.tag}</span>
                  </div>
                )}
                <div style={{ marginBottom:16, paddingTop: t.tag ? 8 : 0 }}>
                  <div style={{ fontSize:12, color:t.color, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>{t.name}</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                    <span style={{ fontSize:36, fontWeight:900, color:t.color }}>{t.price}</span>
                    <span style={{ fontSize:13, color:'var(--text-dim)' }}>{t.period}</span>
                  </div>
                </div>
                <div className="divider" />
                {t.features.map(f => (
                  <div key={f} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:9, fontSize:13 }}>
                    <span style={{ color:'var(--green)', flexShrink:0, marginTop:1 }}>✓</span>
                    <span style={{ color:'var(--text-sec)' }}>{f}</span>
                  </div>
                ))}
                <div style={{ marginTop:20 }}>
                  <button className={`btn ${t.ctaClass} btn-full`}>{t.cta}</button>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize:12, color:'var(--text-dim)', textAlign:'center' }}>All plans run on Somnia Shannon Testnet. Mainnet pricing subject to STT token value. Pro + Enterprise launching Q3 2026.</p>
        </div>
      )}

      {/* COMPETITORS */}
      {activeSection === 'competitors' && (
        <div className="slide-up">
          <div className="card" style={{ marginBottom:20 }}>
            <div className="section-label">Competitive Landscape</div>
            <h3 style={{ marginBottom:16 }}>SomniaWatch wins on every dimension that matters</h3>
            <div style={{ overflowX:'auto' }}>
              <table className="sw-table">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Cost per Audit</th>
                    <th>Speed</th>
                    <th>Autonomous</th>
                    <th>On-Chain Proof</th>
                    <th>LLM Reasoning</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPETITORS.map(c => (
                    <tr key={c.name} style={{ background: c.name.includes('Somnia') ? 'rgba(123,47,255,0.08)' : undefined }}>
                      <td style={{ fontWeight:600, color: c.name.includes('Somnia') ? 'var(--purple-light)' : 'var(--text-primary)' }}>{c.name}</td>
                      <td style={{ fontFamily:'var(--font-mono)', color: c.name.includes('Somnia') ? 'var(--green)' : 'var(--text-sec)' }}>{c.cost}</td>
                      <td style={{ color: c.name.includes('Somnia') ? 'var(--cyan)' : 'var(--text-sec)' }}>{c.speed}</td>
                      <td style={{ textAlign:'center' }}>{c.autonomous ? '✅' : '❌'}</td>
                      <td style={{ textAlign:'center' }}>{c.onchain   ? '✅' : '❌'}</td>
                      <td style={{ textAlign:'center' }}>{c.llm       ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card" style={{ borderColor:'rgba(123,47,255,0.3)', background:'rgba(123,47,255,0.05)' }}>
            <div className="section-label" style={{ color:'var(--purple-light)' }}>Unfair Advantage</div>
            <h3 style={{ marginBottom:12 }}>Why competitors cannot replicate this</h3>
            <p style={{ fontSize:14, marginBottom:0 }}>Somnia is the only L1 blockchain with <strong style={{color:'var(--cyan)'}}>native LLM inference primitives</strong> (inferString, fetchString). Competitors running on Ethereum/Solana must call external AI APIs — adding latency, centralisation risk, and cost. SomniaWatch runs the entire 3-agent pipeline <strong style={{color:'var(--green)'}}>on-chain</strong>, making every reasoning step verifiable, tamper-proof, and provably decentralised. This moat deepens as Somnia's Agentathon ecosystem grows.</p>
          </div>
        </div>
      )}

      {/* ROADMAP */}
      {activeSection === 'roadmap' && (
        <div className="slide-up">
          {ROADMAP.map((r, i) => (
            <div key={r.q} style={{ display:'flex', gap:16, marginBottom:16 }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background: r.done ? 'var(--green-dim)' : 'var(--purple-dim)', border:`2px solid ${r.done ? 'var(--green)' : 'var(--purple)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                  {r.done ? '✅' : (i+1)}
                </div>
                {i < ROADMAP.length-1 && <div style={{ width:2, flex:1, background:'var(--border)', marginTop:4, marginBottom:-4 }} />}
              </div>
              <div className="card" style={{ flex:1, marginBottom:0, borderColor: r.done ? 'rgba(16,185,129,0.3)' : 'var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexWrap:'wrap', gap:8 }}>
                  <div>
                    <span style={{ fontSize:11, fontWeight:700, color: r.done ? 'var(--green)' : 'var(--purple-light)', letterSpacing:'0.06em' }}>{r.q}</span>
                    <h4 style={{ margin:'2px 0 0', fontSize:15 }}>{r.label}</h4>
                  </div>
                  {r.done && <span className="badge badge-green">✓ Live</span>}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {r.items.map(item => (
                    <span key={item} style={{ fontSize:12, padding:'3px 10px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:999, color:'var(--text-sec)' }}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WHY SOMNIA */}
      {activeSection === 'why-somnia' && (
        <div className="slide-up">
          <div className="card card-glow" style={{ marginBottom:20, textAlign:'center', padding:'32px 24px' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⚡</div>
            <h2 style={{ marginBottom:8 }}>Only possible on <span className="gradient-text">Somnia Agentic L1</span></h2>
            <p style={{ fontSize:14, maxWidth:560, margin:'0 auto' }}>Somnia is the first blockchain with native AI agent primitives built into the protocol layer. SomniaWatch is not a wrapper around external APIs — it uses inferString() and fetchString() directly on-chain.</p>
          </div>
          <div className="grid-2" style={{ marginBottom:20 }}>
            {[
              { icon:'🧠', title:'inferString(Qwen3-30B)', desc:'30-billion-parameter LLM inference running natively on-chain. No external API, no centralisation, fully verifiable. Every classification is on-chain.', color:'var(--purple-light)' },
              { icon:'🌐', title:'fetchString()', desc:'On-chain HTTP fetch — agents pull live transaction data from Shannon Explorer directly within the smart contract execution context. No oracles needed.', color:'var(--cyan)' },
              { icon:'⚖️', title:'Sphinx Protocol', desc:'On-chain LLM court. Stake STT, submit a defense argument, 3 validators vote. If you score >75/100, CRITICAL flag is overridden. Trustless dispute resolution.', color:'var(--teal)' },
              { icon:'💸', title:'750× Cheaper', desc:'Full 3-agent pipeline costs 0.38 STT (~$0.02). Manual audits cost $50,000+. On Ethereum, equivalent AI calls cost $15+. Somnia makes this democratically accessible.', color:'var(--green)' },
            ].map(s => (
              <div key={s.title} className="card" style={{ borderColor: s.color+'33' }}>
                <div style={{ fontSize:28, marginBottom:10 }}>{s.icon}</div>
                <h4 style={{ fontSize:14, color:s.color, marginBottom:6, fontFamily:'var(--font-mono)' }}>{s.title}</h4>
                <p style={{ fontSize:13, margin:0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="card" style={{ borderColor:'rgba(0,212,255,0.3)', textAlign:'center' }}>
            <p style={{ fontSize:14, margin:0 }}>🏆 <strong style={{color:'var(--cyan)'}}>Somnia Agentathon 2026</strong> — SomniaWatch demonstrates that the Agentic L1 stack enables an entirely new category of trustless, intelligent infrastructure. This is not a demo — it is a production-ready protocol.</p>
          </div>
        </div>
      )}
    </div>
  );
}
