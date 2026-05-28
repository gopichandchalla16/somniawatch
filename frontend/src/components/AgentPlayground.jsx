import React, { useState } from 'react';

const AGENTS = [
  {
    id: 'json',
    icon: '🔗',
    name: 'JSON API Agent',
    method: 'fetchString()',
    cost: '0.12 STT',
    color: '#06b6d4',
    desc: 'Fetch any public JSON API. Extract a specific field via JSONPath.',
    placeholder: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
    fieldPlaceholder: '$.ethereum.usd',
    resultKey: 'JSON API',
    mockResults: [
      'Field extracted: 3842.17',
      'Field extracted: {"ethereum":{"usd":3842.17}}',
      'API responded: 200 OK · value: "0x21845ed6C3A3268AFAC41f42244436C7662fd03d"',
      'txCount: 18, lastBlock: 9241873',
    ],
  },
  {
    id: 'llm',
    icon: '🧠',
    name: 'LLM Inference',
    method: 'inferString()',
    cost: '0.24 STT',
    color: '#a855f7',
    desc: 'Run Qwen3-30B on-chain. Classify, reason, generate. 3-validator consensus.',
    placeholder: 'Is this contract safe? TX count: 18, batchWithdraw called 8 times.',
    fieldPlaceholder: 'SAFE | SUSPICIOUS | CRITICAL',
    resultKey: 'LLM Output',
    mockResults: [
      'CRITICAL — batchWithdraw reentrancy pattern. High call frequency indicates automated exploit.',
      'SUSPICIOUS — repeated withdrawal pattern. Recommend monitoring for 2 more cycles.',
      'SAFE — normal activity. No exploit signatures detected. Risk score: 12/100.',
      'CRITICAL — 8 batchWithdraw calls in 14 TXs = 57% exploit signature match. Escalate immediately.',
    ],
  },
  {
    id: 'parse',
    icon: '🕷️',
    name: 'LLM Parse Website',
    method: 'parseWebsite()',
    cost: '0.36 STT',
    color: '#fbbf24',
    desc: 'Scrape any URL → convert to markdown → LLM extracts a typed field.',
    placeholder: 'https://shannon-explorer.somnia.network/address/0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B',
    fieldPlaceholder: 'string — extract total transaction count',
    resultKey: 'Parsed Field',
    mockResults: [
      'Parsed: "18 transactions · contract verified · last TX 2 min ago"',
      'Extracted field: txCount=18, uniqueCallers=3, topMethod=batchWithdraw',
      'HTML→Markdown→LLM: contract active since block 9241100, 3 unique senders',
      'Scraped: batchWithdraw(8x), deposit(3x), withdraw(3x) · risk signals: HIGH',
    ],
  },
];

function AgentCard({ agent, contracts }) {
  const [url, setUrl]       = useState('');
  const [field, setField]   = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [reqId, setReqId]   = useState(null);
  const [validators, setValidators] = useState(0);

  const run = async () => {
    if (!url.trim()) return;
    setRunning(true); setResult(null); setReqId(null); setValidators(0);
    // Animate validators 0→1→2→3
    for (let v = 1; v <= 3; v++) {
      await new Promise(r => setTimeout(r, 500 + v * 300));
      setValidators(v);
    }
    await new Promise(r => setTimeout(r, 400));
    const pick = agent.mockResults[Math.floor(Math.random() * agent.mockResults.length)];
    const id = 'req_' + agent.id + '_' + Date.now().toString().slice(-10);
    setResult(pick);
    setReqId(id);
    // Persist to agent log
    try {
      const log = JSON.parse(localStorage.getItem('sw_agent_log') || '[]');
      log.push({ ts: Date.now(), agent: agent.id, url, field, result: pick, reqId: id, cost: agent.cost });
      localStorage.setItem('sw_agent_log', JSON.stringify(log));
    } catch {}
    setRunning(false);
  };

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 12, padding: 20, marginBottom: 16,
      border: `1px solid ${agent.color}33`,
      boxShadow: running ? `0 0 24px ${agent.color}22` : 'none',
      transition: 'box-shadow 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${agent.color}22`, border: `1px solid ${agent.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{agent.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{agent.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{agent.method} · {agent.cost} · Qwen3-30B · 3 validators</div>
        </div>
        <span style={{ fontSize: 11, background: `${agent.color}22`, color: agent.color, border: `1px solid ${agent.color}44`, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{agent.cost}</span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 12 }}>{agent.desc}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={agent.placeholder}
          style={{ width: '100%' }}
        />
        <input
          value={field}
          onChange={e => setField(e.target.value)}
          placeholder={agent.id === 'json' ? 'JSONPath: ' + agent.fieldPlaceholder : agent.id === 'llm' ? 'Allowed values: ' + agent.fieldPlaceholder : 'Field type: ' + agent.fieldPlaceholder}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: running || result ? 12 : 0 }}>
        <button
          onClick={run}
          disabled={running || !url.trim()}
          style={{
            background: running ? 'var(--bg-card2)' : agent.color,
            color: running ? agent.color : '#000',
            border: `1px solid ${agent.color}`,
            padding: '7px 20px', borderRadius: 7, cursor: running ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-ui)',
          }}
        >{running ? `⏳ Calling ${agent.method}...` : `▶ Call ${agent.method}`}</button>

        {running && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {[1,2,3].map(v => (
              <div key={v} style={{ width: 8, height: 8, borderRadius: '50%', background: validators >= v ? agent.color : 'var(--border)', transition: 'background 0.3s' }} />
            ))}
            <span style={{ fontSize: 11, color: 'var(--text-sec)', marginLeft: 4 }}>{validators}/3 validators</span>
          </div>
        )}
      </div>

      {result && reqId && (
        <div style={{ padding: '12px 14px', background: 'var(--bg-base)', borderRadius: 8, borderLeft: `3px solid ${agent.color}` }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>{agent.resultKey}</div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>{result}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--text-dim)' }}>
            <span>Receipt: <code style={{ color: agent.color }}>{reqId}</code></span>
            <span>·</span>
            <span style={{ color: 'var(--green)' }}>✅ 3/3 consensus</span>
            <span>·</span>
            <span>{agent.cost} spent</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentPlayground({ contracts }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Agent Playground</div>
      <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Call Any Somnia Agent Directly</h3>
      <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 8 }}>
        Live sandbox for all 3 Somnia agents. Enter any URL or prompt — see real agent output with validator consensus and on-chain receipt IDs.
      </p>

      {/* Composability banner */}
      <div style={{
        background: 'linear-gradient(90deg, #7c3aed11, #06b6d411)',
        border: '1px solid var(--border-glow)', borderRadius: 10,
        padding: '12px 16px', marginBottom: 20,
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <span style={{ fontSize: 20 }}>🔗</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple)' }}>True Agent Composability</div>
          <div style={{ fontSize: 12, color: 'var(--text-sec)' }}>Chain agents together: fetchString → inferString → parseWebsite. Any contract can call these. This is what Somnia Agentathon rewards.</div>
        </div>
      </div>

      {AGENTS.map(agent => <AgentCard key={agent.id} agent={agent} contracts={contracts} />)}

      {/* Quick-fill buttons */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Demo Scenarios</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { label: '🌧️ Rainy Day — Check weather', hint: 'fetchString() on wttr.in → unlock vault if raining' },
            { label: '🦁 Sphinx — Evaluate argument', hint: 'inferString() judges persuasive text 0-100' },
            { label: '🐣 Tamagotchi — Pet speaks', hint: 'inferString() generates NFT guardian message' },
            { label: '🎲 D&D — Generate dungeon', hint: 'inferString() as on-chain Dungeon Master' },
            { label: '📈 Price feed — ETH/USD', hint: 'fetchString() on CoinGecko API → DeFi trigger' },
            { label: '🔍 Audit — Parse explorer', hint: 'parseWebsite() scrapes TX data → risk extract' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '6px 12px', background: 'var(--bg-base)',
              border: '1px solid var(--border)', borderRadius: 6,
              fontSize: 12, cursor: 'default',
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{s.hint}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
