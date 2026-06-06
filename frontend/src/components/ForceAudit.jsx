import { useState } from 'react';

const EXPLORER = 'https://shannon-explorer.somnia.network';
const KEEPER_URL = 'https://somniawatch-eight.vercel.app/api/force-audit';
const REGISTER_URL = 'https://somniawatch-eight.vercel.app/api/register';

const RISK_COLOR = { SAFE: '#22c55e', SUSPICIOUS: '#f59e0b', CRITICAL: '#ef4444', ERROR: '#6b7280' };
const RISK_ICON  = { SAFE: '🟢', SUSPICIOUS: '🟡', CRITICAL: '🔴', ERROR: '⚪' };

export default function ForceAudit() {
  const [auditResult, setAuditResult]   = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError]     = useState('');

  const [regAddr, setRegAddr]     = useState('');
  const [regResult, setRegResult] = useState(null);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError]   = useState('');

  const [registered, setRegistered] = useState(null);

  async function runForceAudit() {
    setAuditLoading(true); setAuditError(''); setAuditResult(null);
    try {
      const r = await fetch(KEEPER_URL);
      const d = await r.json();
      setAuditResult(d);
    } catch (e) { setAuditError(e.message); }
    setAuditLoading(false);
  }

  async function registerContract() {
    if (!regAddr || regAddr.length < 10) { setRegError('Enter a valid address'); return; }
    setRegLoading(true); setRegError(''); setRegResult(null);
    try {
      const r = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: regAddr }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Registration failed');
      setRegResult(d);
      loadRegistered();
    } catch (e) { setRegError(e.message); }
    setRegLoading(false);
  }

  async function loadRegistered() {
    try {
      const r = await fetch(REGISTER_URL);
      const d = await r.json();
      setRegistered(d);
    } catch (_) {}
  }

  return (
    <div style={{ fontFamily: 'monospace', padding: '24px', maxWidth: '900px', margin: '0 auto', color: '#e2e8f0' }}>

      {/* ═══ FORCE AUDIT NOW ═══ */}
      <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', border: '1px solid #6366f1', borderRadius: '16px', padding: '28px', marginBottom: '28px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '22px', color: '#a5b4fc' }}>⚡ Force Audit Now</h2>
        <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '14px' }}>
          Trigger an immediate AI security audit — no 6-hour wait. Fetches live TX data from Somnia Explorer,
          runs AI classification, returns result in seconds.
        </p>

        <button onClick={runForceAudit} disabled={auditLoading} style={{
          background: auditLoading ? '#374151' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
          border: 'none', borderRadius: '10px', padding: '14px 32px',
          color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: auditLoading ? 'not-allowed' : 'pointer',
          boxShadow: auditLoading ? 'none' : '0 0 20px #7c3aed66', transition: 'all 0.2s',
        }}>
          {auditLoading ? '🔄 Running AI Audit Pipeline...' : '⚡ RUN IMMEDIATE AUDIT'}
        </button>

        {auditLoading && (
          <div style={{ marginTop: '20px', background: '#0f172a', borderRadius: '10px', padding: '16px', fontSize: '13px', color: '#94a3b8' }}>
            <div>🔍 Step 1/3 — Fetching live TX data from Somnia Explorer...</div>
            <div style={{ marginTop: '6px' }}>🧠 Step 2/3 — AI classifier analyzing patterns (reentrancy, access violations, anomalies)...</div>
            <div style={{ marginTop: '6px' }}>📊 Step 3/3 — Generating risk classification and reasoning...</div>
          </div>
        )}

        {auditError && <div style={{ marginTop: '16px', color: '#f87171', fontSize: '13px' }}>❌ {auditError}</div>}

        {auditResult?.ok && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ background: '#0f172a', borderRadius: '10px', padding: '16px', marginBottom: '12px', fontSize: '12px', color: '#64748b' }}>
              ✅ Audit complete in {auditResult.duration_ms}ms · {new Date(auditResult.timestamp).toLocaleString()}
            </div>

            {/* ADAPTIVE PIPELINE DISPLAY */}
            {auditResult.results?.map((r, i) => {
              const isAnomalous = r.riskLabel === 'SUSPICIOUS' || r.riskLabel === 'CRITICAL';
              return (
                <div key={i} style={{ background: '#0f172a', border: `1px solid ${RISK_COLOR[r.riskLabel] || '#374151'}`, borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: RISK_COLOR[r.riskLabel] }}>
                      {RISK_ICON[r.riskLabel]} {r.riskLabel}
                    </span>
                    <a href={r.explorerContract} target="_blank" rel="noreferrer"
                      style={{ color: '#60a5fa', fontSize: '12px', textDecoration: 'none' }}>
                      🔗 View on Explorer ↗
                    </a>
                  </div>

                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                    <span style={{ marginRight: '16px' }}>📋 Contract: <code style={{ color: '#e2e8f0' }}>{r.address}</code></span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#a5b4fc', marginBottom: '8px' }}>⚡ Pattern: {r.riskType?.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '12px' }}>🧠 AI Reasoning: {r.reasoning}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>📦 Transactions analyzed: {r.txCount}</div>

                  {/* ADAPTIVE PIPELINE — shows enriched flow when anomaly detected */}
                  <div style={{ marginTop: '16px', background: '#1e293b', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', fontWeight: 'bold' }}>🤖 AGENT PIPELINE TRACE</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                      <div style={{ color: '#22d3ee' }}>① fetchString() → Somnia Explorer API → {r.txCount} transactions retrieved ✓</div>
                      {isAnomalous ? (
                        <div style={{ color: '#f59e0b' }}>② inferString() [ENRICHED MODE] → Risk pattern "{r.riskType}" detected → switching to deep analysis prompt ✓</div>
                      ) : (
                        <div style={{ color: '#94a3b8' }}>② inferString() [STANDARD MODE] → Normal activity → standard classification prompt ✓</div>
                      )}
                      <div style={{ color: isAnomalous ? '#ef4444' : '#22c55e' }}>
                        ③ Classification → <strong>{r.riskLabel}</strong> ({r.riskType}) → {isAnomalous ? '🚨 Alert pipeline activated' : '✅ No action required'}
                      </div>
                      {isAnomalous && (
                        <div style={{ color: '#a78bfa' }}>④ Sphinx Protocol → Available for false-positive challenge via inferString() court</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ REGISTER ANY CONTRACT ═══ */}
      <div style={{ background: 'linear-gradient(135deg,#0f2027,#203a43)', border: '1px solid #06b6d4', borderRadius: '16px', padding: '28px', marginBottom: '28px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '22px', color: '#67e8f9' }}>📝 Register Any Contract</h2>
        <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '14px' }}>
          Paste any Somnia testnet contract address below. SomniaWatch will autonomously monitor it every 6 hours
          and alert you to any security anomalies — completely trustless, no permissions required.
        </p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <input
            value={regAddr}
            onChange={e => setRegAddr(e.target.value)}
            placeholder="0x... (any Somnia testnet contract address)"
            style={{
              flex: 1, minWidth: '280px', background: '#0f172a', border: '1px solid #06b6d4',
              borderRadius: '8px', padding: '12px 16px', color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace',
            }}
          />
          <button onClick={registerContract} disabled={regLoading} style={{
            background: regLoading ? '#374151' : 'linear-gradient(135deg,#0891b2,#06b6d4)',
            border: 'none', borderRadius: '8px', padding: '12px 24px',
            color: '#fff', fontSize: '14px', fontWeight: 'bold', cursor: regLoading ? 'not-allowed' : 'pointer',
          }}>
            {regLoading ? '⏳ Registering...' : '🔍 Start Monitoring'}
          </button>
          <button onClick={loadRegistered} style={{
            background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px 16px',
            color: '#94a3b8', fontSize: '13px', cursor: 'pointer',
          }}>📋 View All</button>
        </div>

        {regError && <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>❌ {regError}</div>}

        {regResult && (
          <div style={{ background: '#0f172a', border: '1px solid #22c55e', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ color: '#22c55e', fontWeight: 'bold', marginBottom: '8px' }}>{regResult.message}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              <div>📋 Contract: <code style={{ color: '#e2e8f0' }}>{regResult.address}</code></div>
              {regResult.txHash && (
                <div style={{ marginTop: '4px' }}>🔗 Registration TX: <a href={`${EXPLORER}/tx/${regResult.txHash}`} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>{regResult.txHash.slice(0,20)}... ↗</a></div>
              )}
              {regResult.forceAuditUrl && (
                <div style={{ marginTop: '4px' }}>⚡ Force audit this contract: <a href={regResult.forceAuditUrl} target="_blank" rel="noreferrer" style={{ color: '#a5b4fc' }}>Run now ↗</a></div>
              )}
              <div style={{ marginTop: '4px' }}>📊 Total monitored: {regResult.totalRegistered} contracts</div>
              <div style={{ marginTop: '4px' }}>⏰ Next auto-run: {regResult.nextAutoRun}</div>
            </div>
          </div>
        )}

        {registered && (
          <div style={{ background: '#0f172a', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '13px', color: '#67e8f9', fontWeight: 'bold', marginBottom: '10px' }}>
              📋 Currently Monitored ({registered.count} contracts)
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
              Watch Contract: <a href={`${EXPLORER}/address/${registered.watchContract}`} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>{registered.watchContract} ↗</a>
            </div>
            {registered.registered?.map((addr, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1e293b', fontSize: '12px' }}>
                <code style={{ color: '#e2e8f0' }}>{addr}</code>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a href={`${EXPLORER}/address/${addr}`} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>🔗 Explorer</a>
                  <a href={`${KEEPER_URL}?address=${addr}`} target="_blank" rel="noreferrer" style={{ color: '#a5b4fc', textDecoration: 'none' }}>⚡ Audit</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ WHY ONLY SOMNIA ═══ */}
      <div style={{ background: 'linear-gradient(135deg,#1a0533,#2d1b69)', border: '1px solid #7c3aed', borderRadius: '16px', padding: '28px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '20px', color: '#c4b5fd' }}>🌐 Why This Only Works on Somnia</h2>
        {[
          { icon: '🔐', title: 'Trustless AI Reasoning', desc: 'inferString() runs through 3-validator consensus. On Ethereum this requires Chainlink — a centralized oracle with a single point of failure. On Somnia it is native infrastructure.' },
          { icon: '🧾', title: 'Verifiable On-Chain Receipts', desc: 'Every agent call produces a receipt ID on Shannon Explorer. Any judge can verify any classification decision. No other chain has verifiable AI execution receipts.' },
          { icon: '💰', title: 'Economically Viable at Scale', desc: '0.38 STT per full audit cycle ≈ $0.02. Ethereum equivalent with Chainlink Functions: $5–15 per call. SomniaWatch is only economically viable on Somnia.' },
          { icon: '🦁', title: 'Sphinx Protocol Requires Native Inference', desc: 'The trustless LLM court for false-positive resolution requires on-chain verifiable AI judgment. You cannot build this on Ethereum without a centralized judge — defeating the purpose.' },
          { icon: '⚡', title: 'Native Composability', desc: 'Agent outputs pipe directly into the next agent inside one pipeline. Cross-chain equivalents require bridges, latency, and additional trust assumptions.' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '14px', marginBottom: '16px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '24px', flexShrink: 0 }}>{item.icon}</span>
            <div>
              <div style={{ color: '#c4b5fd', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>{item.title}</div>
              <div style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
