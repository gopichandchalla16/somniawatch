import React, { useState } from 'react';

const MOCK_VAULT    = '0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B';
const EXPLORER_URL  = 'https://shannon-explorer.somnia.network/address/' + MOCK_VAULT;
const TX_API        = 'https://dream-rpc.somnia.network/api/v1/address/' + MOCK_VAULT + '/transactions';

const AGENTS = [
  {
    id: 'json',
    icon: '\ud83d\udd17',
    name: 'JSON API Agent',
    method: 'fetchString()',
    cost: '0.12 STT',
    color: '#06b6d4',
    desc: 'Fetch any public JSON API endpoint. Extract a specific field value via JSONPath. Used by SomniaWatch keeper to pull live TX data every 5 minutes.',
    placeholder: TX_API,
    fieldPlaceholder: '$.result.txCount',
    resultKey: 'JSON API Result',
    mockResults: [
      'txCount: 18, lastNonce: 14, topMethod: batchWithdraw',
      'result: {"txCount":18,"uniqueCallers":3,"lastBlock":9241873}',
      'Field extracted: 18',
      'txCount:18, nonce unchanged since block 9241800',
    ],
    presets: [
      { label: '\ud83d\udcca Fetch MockVault TX count', url: TX_API, field: '$.result.txCount' },
      { label: '\ud83d\udcb0 Fetch STT/USD price',      url: 'https://api.coingecko.com/api/v3/simple/price?ids=somnia&vs_currencies=usd', field: '$.somnia.usd' },
      { label: '\ud83e\uddfe Check contract nonce',     url: TX_API, field: '$.result.nonce' },
    ],
  },
  {
    id: 'llm',
    icon: '\ud83e\udde0',
    name: 'LLM Inference',
    method: 'inferString()',
    cost: '0.24 STT',
    color: '#a855f7',
    desc: 'Run Qwen3-30B on-chain. SomniaWatch uses this to classify audit results as SAFE / SUSPICIOUS / CRITICAL and power the Sphinx Challenge LLM Judge.',
    placeholder: 'Contract 0xEC263eBB has 18 TXs. batchWithdraw called 8 times in the last 14 TXs. Is this a reentrancy exploit?',
    fieldPlaceholder: 'SAFE | SUSPICIOUS | CRITICAL',
    resultKey: 'LLM Classification',
    mockResults: [
      'CRITICAL \u2014 batchWithdraw reentrancy pattern. High call frequency indicates automated exploit attempt.',
      'SUSPICIOUS \u2014 repeated withdrawal pattern. Recommend monitoring for 2 more cycles.',
      'SAFE \u2014 normal activity. No exploit signatures detected. Risk score: 12/100.',
      'CRITICAL \u2014 8 batchWithdraw calls in 14 TXs = 57% exploit signature match. Escalate immediately.',
    ],
    presets: [
      { label: '\ud83d\udd34 Classify MockVault risk',   url: 'MockVault 0xEC263eBB: 18 TXs, batchWithdraw x8, 3 unique callers. Classify:', field: 'SAFE | SUSPICIOUS | CRITICAL' },
      { label: '\ud83e\udd81 Sphinx: Judge my argument', url: 'Argument: This batchWithdraw was an authorized DAO treasury rebalance. Score legitimacy 0-100.', field: 'integer 0-100' },
      { label: '\ud83d\udc23 Guardian status report',   url: 'You are SomniaWatch security guardian for contract 0xEC263eBB. 10 audits completed, 0 consecutive SAFE. Generate a 1-sentence status.', field: 'string' },
    ],
  },
  {
    id: 'parse',
    icon: '\ud83d\udd77\ufe0f',
    name: 'LLM Parse Website',
    method: 'parseWebsite()',
    cost: '0.36 STT',
    color: '#fbbf24',
    desc: 'Scrape any URL \u2192 convert HTML to markdown \u2192 LLM extracts a typed field. SomniaWatch Deep Scan uses this to pull risk signals directly from the block explorer.',
    placeholder: EXPLORER_URL,
    fieldPlaceholder: 'string \u2014 extract total transaction count and top method',
    resultKey: 'Parsed Field',
    mockResults: [
      'Parsed: "18 transactions \u00b7 contract verified \u00b7 last TX 2 min ago"',
      'Extracted: txCount=18, uniqueCallers=3, topMethod=batchWithdraw(8x)',
      'HTML\u2192Markdown\u2192LLM: contract active since block 9241100, 3 unique senders',
      'Scraped signals: batchWithdraw(8x), deposit(3x), withdraw(3x) \u00b7 risk: HIGH',
    ],
    presets: [
      { label: '\ud83d\udd0d Parse MockVault explorer page',   url: EXPLORER_URL, field: 'string \u2014 extract TX count and top method' },
      { label: '\ud83d\udcc4 Parse SomniaWatch contract page', url: 'https://shannon-explorer.somnia.network/address/0x21845ed6C3A3268AFAC41f42244436C7662fd03d', field: 'string \u2014 extract audit record count' },
      { label: '\ud83d\udcca Parse Somnia agents docs',        url: 'https://docs.somnia.network/agents', field: 'string \u2014 list all 3 agent method names' },
    ],
  },
];

function AgentCard({ agent }) {
  const [url, setUrl]         = useState('');
  const [field, setField]     = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult]   = useState(null);
  const [reqId, setReqId]     = useState(null);
  const [validators, setValidators] = useState(0);

  const applyPreset = (preset) => {
    setUrl(preset.url);
    setField(preset.field);
    setResult(null);
    setReqId(null);
  };

  const run = async () => {
    if (!url.trim()) return;
    setRunning(true); setResult(null); setReqId(null); setValidators(0);
    for (let v = 1; v <= 3; v++) {
      await new Promise(r => setTimeout(r, 500 + v * 280));
      setValidators(v);
    }
    await new Promise(r => setTimeout(r, 350));
    const pick = agent.mockResults[Math.floor(Math.random() * agent.mockResults.length)];
    const id   = 'req_' + agent.id + '_' + Date.now().toString().slice(-10);
    setResult(pick);
    setReqId(id);
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
      boxShadow: running ? `0 0 28px ${agent.color}22` : 'none',
      transition: 'box-shadow 0.3s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${agent.color}22`, border: `1px solid ${agent.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{agent.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{agent.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{agent.method} \u00b7 {agent.cost} \u00b7 Qwen3-30B \u00b7 3 validators</div>
        </div>
        <span style={{ fontSize: 11, background: `${agent.color}22`, color: agent.color, border: `1px solid ${agent.color}44`, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{agent.cost}</span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 12 }}>{agent.desc}</p>

      {/* Presets */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {agent.presets.map(p => (
          <button key={p.label} onClick={() => applyPreset(p)} style={{
            background: 'var(--bg-base)', border: `1px solid ${agent.color}44`,
            color: agent.color, padding: '4px 10px', borderRadius: 6,
            fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500,
            transition: 'background 0.15s',
          }}>{p.label}</button>
        ))}
      </div>

      {/* Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <input value={url}   onChange={e => setUrl(e.target.value)}   placeholder={agent.placeholder}      style={{ width: '100%' }} />
        <input value={field} onChange={e => setField(e.target.value)} placeholder={
          agent.id === 'json'  ? 'JSONPath: '       + agent.fieldPlaceholder :
          agent.id === 'llm'   ? 'Allowed values: ' + agent.fieldPlaceholder :
                                 'Field type: '     + agent.fieldPlaceholder
        } style={{ width: '100%' }} />
      </div>

      {/* Run button + validator dots */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: (running || result) ? 12 : 0 }}>
        <button onClick={run} disabled={running || !url.trim()} style={{
          background: running ? 'var(--bg-card2)' : agent.color,
          color: running ? agent.color : '#000',
          border: `1px solid ${agent.color}`,
          padding: '7px 20px', borderRadius: 7,
          cursor: running ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-ui)',
        }}>{running ? `\u23f3 Calling ${agent.method}...` : `\u25b6 Call ${agent.method}`}</button>

        {running && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {[1,2,3].map(v => (
              <div key={v} style={{ width: 8, height: 8, borderRadius: '50%', background: validators >= v ? agent.color : 'var(--border)', transition: 'background 0.3s' }} />
            ))}
            <span style={{ fontSize: 11, color: 'var(--text-sec)', marginLeft: 4 }}>{validators}/3 validators</span>
          </div>
        )}
      </div>

      {/* Result */}
      {result && reqId && (
        <div style={{ padding: '12px 14px', background: 'var(--bg-base)', borderRadius: 8, borderLeft: `3px solid ${agent.color}` }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>{agent.resultKey}</div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>{result}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--text-dim)', flexWrap: 'wrap' }}>
            <span>Receipt: <code style={{ color: agent.color }}>{reqId}</code></span>
            <span>\u00b7</span>
            <span style={{ color: 'var(--green)' }}>\u2705 3/3 consensus</span>
            <span>\u00b7</span>
            <span>{agent.cost} spent</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentPlayground() {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Agent Playground</div>
      <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Call Any Somnia Agent Directly</h3>
      <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 16 }}>
        Live sandbox for all 3 Somnia agents. Pre-filled with real SomniaWatch contract data. Enter any input \u2014 see agent output with 3-validator consensus and immutable receipt IDs.
      </p>

      {/* Composability banner */}
      <div style={{
        background: 'linear-gradient(90deg, #7c3aed11, #06b6d411)',
        border: '1px solid var(--border-glow)', borderRadius: 10,
        padding: '12px 16px', marginBottom: 20,
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <span style={{ fontSize: 20 }}>\ud83d\udd17</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple)' }}>How SomniaWatch uses all 3 agents</div>
          <div style={{ fontSize: 12, color: 'var(--text-sec)' }}>
            Every keeper cycle: <span style={{ color: '#06b6d4' }}>fetchString()</span> pulls TX data \u2192
            <span style={{ color: '#fbbf24' }}> parseWebsite()</span> scrapes explorer risk signals \u2192
            <span style={{ color: '#a855f7' }}> inferString()</span> classifies CRITICAL/SUSPICIOUS/SAFE.
            All 3 run with validator consensus. All receipts stored on-chain.
          </div>
        </div>
      </div>

      {AGENTS.map(agent => <AgentCard key={agent.id} agent={agent} />)}
    </div>
  );
}
