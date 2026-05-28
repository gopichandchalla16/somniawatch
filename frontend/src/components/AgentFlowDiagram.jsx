import React from 'react';

export default function AgentFlowDiagram() {
  const steps = [
    {
      icon: '⏰',
      title: 'keeper.js fires every 5 min',
      desc: 'Autonomous Node.js process calls triggerMonitor() on SomniaWatch.sol for every registered contract.',
      color: '#22aaff'
    },
    {
      icon: '🌐',
      title: 'JSON API Agent #13174...',
      desc: 'Fetches last 20 transactions from Somnia explorer API. 3 validators reach consensus. Callback fires on-chain.',
      color: '#22ff88'
    },
    {
      icon: '🧠',
      title: 'LLM Inference Agent (Qwen3-30B)',
      desc: 'Receives tx data. Classifies risk as safe / suspicious / critical using allowedValues — no JSON parsing needed. 3 validators reach consensus.',
      color: '#ffaa00'
    },
    {
      icon: '📋',
      title: 'AuditRecord stored on-chain',
      desc: 'receiptId = agent requestId = immutable proof of AI decision. Anyone can verify on Somnia explorer.',
      color: '#22ff88'
    },
    {
      icon: '🔴',
      title: 'CRITICAL? Auto-flag + Alert',
      desc: 'Contract flagged autonomously. Discord webhook fires. Telegram bot fires. Zero humans involved.',
      color: '#ff4444'
    },
    {
      icon: '🏅',
      title: 'Certificate tier computed',
      desc: 'Bronze (1+ safe) → Silver (5+ safe) → Gold (10+ consecutive safe audits). Composable trust primitive.',
      color: '#ffd700'
    }
  ];

  return (
    <div>
      <h3 style={{ color: '#e0e8ff', marginBottom: 4 }}>How SomniaWatch Works</h3>
      <p style={{ color: '#7a9cc0', fontSize: 13, marginBottom: 32 }}>
        A fully autonomous 2-agent pipeline. Every step runs on-chain on Somnia Agentic L1.
      </p>

      {/* Flow steps */}
      <div style={{ position: 'relative' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 20, marginBottom: 8 }}>
            {/* Left: icon + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `${step.color}22`,
                border: `2px solid ${step.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0
              }}>
                {step.icon}
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 2, flex: 1, background: '#1e2d4a', minHeight: 24, margin: '4px 0' }} />
              )}
            </div>

            {/* Right: content */}
            <div style={{ background: '#0d1a2a', border: '1px solid #1e2d4a', borderRadius: 8, padding: '14px 18px', flex: 1, marginBottom: 8 }}>
              <div style={{ color: step.color, fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
                Step {i + 1}: {step.title}
              </div>
              <div style={{ color: '#7a9cc0', fontSize: 13 }}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Cost breakdown */}
      <div style={{ marginTop: 24, background: '#0d1a2a', border: '1px solid #1e2d4a', borderRadius: 10, padding: 20 }}>
        <h4 style={{ color: '#22aaff', margin: '0 0 16px' }}>Cost Per Monitoring Cycle</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            ['JSON API Agent', '0.12 STT', '#22aaff'],
            ['LLM Inference Agent', '0.24 STT', '#22ff88'],
            ['Full Cycle Total', '0.36 STT', '#ffd700']
          ].map(([label, cost, color]) => (
            <div key={label} style={{ background: '#060d16', borderRadius: 8, padding: 14, textAlign: 'center', border: `1px solid ${color}44` }}>
              <div style={{ color, fontSize: 18, fontWeight: 'bold' }}>{cost}</div>
              <div style={{ color: '#7a9cc0', fontSize: 11, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent IDs */}
      <div style={{ marginTop: 16, background: '#0d1a2a', border: '1px solid #1e2d4a', borderRadius: 10, padding: 20 }}>
        <h4 style={{ color: '#22aaff', margin: '0 0 12px' }}>On-Chain Agent IDs</h4>
        <div style={{ fontSize: 12, fontFamily: 'monospace' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #0d1a2a', color: '#7a9cc0' }}>
            <span>JSON API Agent</span>
            <code style={{ color: '#22aaff' }}>13174292974160097713</code>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#7a9cc0' }}>
            <span>LLM Inference Agent (Qwen3-30B)</span>
            <code style={{ color: '#22ff88' }}>12847293847561029384</code>
          </div>
        </div>
      </div>

      {/* Why agent-native */}
      <div style={{ marginTop: 16, background: '#0d1a2a', border: '1px solid #22ff8844', borderRadius: 10, padding: 20 }}>
        <h4 style={{ color: '#22ff88', margin: '0 0 12px' }}>Why Agent-Native Beats Off-Chain Tools</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
          {[
            ['Forta / OpenZeppelin Defender', 'SomniaWatch'],
            ['Off-chain nodes', '100% on-chain agents'],
            ['Centralized infrastructure', 'Validator consensus'],
            ['No immutable proof', 'receiptId = verifiable proof'],
            ['Human review required', 'Fully autonomous'],
            ['High cost', '0.36 STT per cycle']
          ].map(([old, neww], i) => i === 0
            ? <React.Fragment key={i}>
                <div style={{ color: '#ff6666', fontWeight: 'bold', fontSize: 12 }}>{old}</div>
                <div style={{ color: '#22ff88', fontWeight: 'bold', fontSize: 12 }}>{neww}</div>
              </React.Fragment>
            : <React.Fragment key={i}>
                <div style={{ color: '#3a5a80', padding: '4px 8px', background: '#060d16', borderRadius: 4 }}>✗ {old}</div>
                <div style={{ color: '#22ff88', padding: '4px 8px', background: '#0d2a1a', borderRadius: 4 }}>✓ {neww}</div>
              </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}
