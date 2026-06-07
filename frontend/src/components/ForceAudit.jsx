import React, { useState, useEffect } from 'react';

const MOCK_VAULT = '0xeB282f43b4015b7a71cfbd2Bd52f69146030701E';
const WATCH_ADDR = '0xaca28071870080421206831D2F9EBd3E97CcdFd1';
const EXPLORER   = 'https://shannon-explorer.somnia.network';

function RiskBadge({ label }) {
  const cfg = {
    CRITICAL:   { bg: '#f43f5e22', border: '#f43f5e', color: '#f43f5e', icon: '🔴' },
    SUSPICIOUS: { bg: '#f59e0b22', border: '#f59e0b', color: '#f59e0b', icon: '🟡' },
    SAFE:       { bg: '#10b98122', border: '#10b981', color: '#10b981', icon: '🟢' },
    ERROR:      { bg: '#6366f122', border: '#6366f1', color: '#6366f1', icon: '⚠️' },
  };
  const c = cfg[label] || cfg.ERROR;
  return (
    <span style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
      {c.icon} {label}
    </span>
  );
}

function PipelineStep({ num, label, value, mode, done, active }) {
  const color = done ? 'var(--green)' : active ? 'var(--purple)' : 'var(--border)';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', border: `2px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color, flexShrink: 0,
        background: done ? color + '22' : 'transparent',
        transition: 'all 0.3s',
      }}>{done ? '✓' : num}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: done ? 'var(--text-primary)' : active ? 'var(--text-primary)' : 'var(--text-dim)', fontWeight: 600 }}>
          {label}
          {mode && <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--purple)', background: '#7c3aed22', padding: '2px 7px', borderRadius: 4 }}>{mode}</span>}
        </div>
        {value && <div style={{ fontSize: 11, color: 'var(--text-sec)', fontFamily: 'var(--font-mono)', marginTop: 2, wordBreak: 'break-all' }}>{value}</div>}
      </div>
    </div>
  );
}

export default function ForceAudit() {
  const [loading,       setLoading]       = useState(false);
  const [result,        setResult]        = useState(null);
  const [error,         setError]         = useState('');
  const [anomalyMode,   setAnomalyMode]   = useState(false);
  const [contractInput, setContractInput] = useState(MOCK_VAULT);
  const [step,          setStep]          = useState(0);
  const [elapsed,       setElapsed]       = useState(0);

  // Swarm state
  const [swarmLoading, setSwarmLoading] = useState(false);
  const [swarmResult,  setSwarmResult]  = useState(null);

  // Sphinx state
  const [sphinxOpen,     setSphinxOpen]     = useState(false);
  const [sphinxDefense,  setSphinxDefense]  = useState('');
  const [sphinxLoading,  setSphinxLoading]  = useState(false);
  const [sphinxResult,   setSphinxResult]   = useState(null);

  // Alert test state
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertResult,  setAlertResult]  = useState('');

  // Live cost ticker
  const [totalCalls, setTotalCalls] = useState(() => {
    try { return parseInt(localStorage.getItem('sw_total_calls') || '0'); } catch { return 0; }
  });

  // Elapsed timer
  useEffect(() => {
    if (!loading) return;
    const i = setInterval(() => setElapsed(e => e + 1), 100);
    return () => clearInterval(i);
  }, [loading]);

  const runAudit = async () => {
    setLoading(true); setResult(null); setError(''); setStep(1); setElapsed(0);
    try {
      const addr = contractInput.trim() || MOCK_VAULT;
      const url  = `/api/force-audit?address=${addr}${anomalyMode ? '&anomaly=1' : ''}`;

      setTimeout(() => setStep(2), 300);
      const res  = await fetch(url);
      setTimeout(() => setStep(3), 100);
      const data = await res.json();
      setStep(4);

      const calls = totalCalls + 2;
      setTotalCalls(calls);
      try { localStorage.setItem('sw_total_calls', String(calls)); } catch {}

      // Log to alert store
      if (data.riskLabel === 'CRITICAL' || data.riskLabel === 'SUSPICIOUS') {
        try {
          const log = JSON.parse(localStorage.getItem('sw_alert_log') || '[]');
          log.push({ ts: Date.now(), level: data.riskLabel === 'CRITICAL' ? 2 : 1,
            contract: addr.slice(0,10)+'...'+addr.slice(-6),
            type: data.riskType || 'force_audit', discord: true, telegram: true });
          localStorage.setItem('sw_alert_log', JSON.stringify(log));
        } catch {}
      }
      setResult(data);
    } catch (e) {
      setError('Fetch error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const runSwarm = async () => {
    setSwarmLoading(true); setSwarmResult(null);
    try {
      const res  = await fetch('/api/swarm');
      const data = await res.json();
      const calls = totalCalls + (data.summary?.totalAgentCalls || 6);
      setTotalCalls(calls);
      try { localStorage.setItem('sw_total_calls', String(calls)); } catch {}
      setSwarmResult(data);
    } catch (e) {
      setSwarmResult({ ok: false, error: e.message });
    } finally { setSwarmLoading(false); }
  };

  const runSphinx = async () => {
    if (!sphinxDefense.trim()) return;
    setSphinxLoading(true); setSphinxResult(null);
    try {
      const res  = await fetch('/api/sphinx-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractAddress: contractInput.trim() || MOCK_VAULT, argument: sphinxDefense }),
      });
      const data = await res.json();
      setSphinxResult(data);
      const calls = totalCalls + 1;
      setTotalCalls(calls);
      try { localStorage.setItem('sw_total_calls', String(calls)); } catch {}
    } catch (e) {
      setSphinxResult({ ok: false, error: e.message });
    } finally { setSphinxLoading(false); }
  };

  const testAlert = async () => {
    setAlertLoading(true); setAlertResult('');
    try {
      const res  = await fetch('/api/alert');
      const data = await res.json();
      setAlertResult(data.ok
        ? `✅ Alert system live — Discord: ${data.discord ? '✅' : '❌'} | Telegram: ${data.telegram ? '✅' : '❌'}`
        : `⚠️ ${data.message || data.error || 'Alert endpoint responded'}`);
    } catch (e) {
      setAlertResult('❌ Alert endpoint error: ' + e.message);
    } finally { setAlertLoading(false); }
  };

  const costSTT   = (totalCalls * 0.19).toFixed(2);
  const costUSD   = (totalCalls * 0.19 * 0.05).toFixed(4);
  const isOk      = result?.riskLabel;
  const isCrit    = result?.riskLabel === 'CRITICAL';
  const isDemo    = result?.mode === 'demo' || result?.demo;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>⚡</span>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Force Audit + Sphinx Protocol</h2>
            <p style={{ fontSize: 12, color: 'var(--text-sec)', margin: 0 }}>Live 3-agent pipeline · No wallet required · Results in &lt;400ms</p>
          </div>
        </div>

        {/* Live cost ticker */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
          {[
            { label: 'Agent Calls (this session)', val: totalCalls, color: 'var(--purple)' },
            { label: 'STT Spent', val: costSTT + ' STT', color: 'var(--cyan)' },
            { label: 'USD Equivalent', val: '~$' + costUSD, color: 'var(--green)' },
            { label: 'Validators', val: '3 (Somnia)', color: 'var(--text-dim)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', minWidth: 130 }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Anomaly toggle + address input */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Audit Target</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
            <div style={{
              width: 36, height: 20, borderRadius: 10, transition: 'background 0.2s',
              background: anomalyMode ? 'var(--red)' : 'var(--border)',
              position: 'relative', cursor: 'pointer',
            }} onClick={() => setAnomalyMode(v => !v)}>
              <div style={{
                position: 'absolute', top: 2, left: anomalyMode ? 18 : 2, width: 16, height: 16,
                borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
              }} />
            </div>
            <span style={{ fontSize: 12, color: anomalyMode ? 'var(--red)' : 'var(--text-dim)', fontWeight: 600 }}>
              {anomalyMode ? '🔴 ANOMALY MODE (ENRICHED pipeline)' : '⚪ Normal Mode'}
            </span>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={contractInput}
            onChange={e => setContractInput(e.target.value)}
            placeholder="0x... contract address"
            style={{ flex: 1, minWidth: 260, fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
          <button className="btn btn-purple" onClick={runAudit} disabled={loading} style={{ minWidth: 160, fontSize: 14, fontWeight: 700 }}>
            {loading ? `⏳ Running... (${(elapsed / 10).toFixed(1)}s)` : '⚡ RUN IMMEDIATE AUDIT'}
          </button>
        </div>
        {anomalyMode && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#f43f5e11', border: '1px solid #f43f5e44', borderRadius: 6, fontSize: 12, color: 'var(--red)' }}>
            🔴 ANOMALY MODE active — inferString() will receive ENRICHED prompt with deep pattern analysis. Agent adapts its reasoning approach based on upstream risk signals.
          </div>
        )}
      </div>

      {/* Pipeline visualization */}
      {(loading || result) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Agent Pipeline</div>
          <PipelineStep num={1} label="fetchString() — JSON API Agent" value="Shannon Explorer TX data" mode="Layer 1" done={step >= 2} active={step === 1} />
          <PipelineStep num={2} label="inferString() — LLM Classification" value={anomalyMode ? 'Qwen3-30B · ENRICHED prompt · allowedValues:[safe,suspicious,critical]' : 'Qwen3-30B · STANDARD prompt · allowedValues:[safe,suspicious,critical]'} mode={anomalyMode ? 'ENRICHED' : 'STANDARD'} done={step >= 3} active={step === 2} />
          <PipelineStep num={3} label="On-chain Receipt" value={result?.txHash ? `${EXPLORER}/tx/${result.txHash}` : 'Writing to Somnia blockchain...'} mode="Immutable" done={step >= 4} active={step === 3} />
        </div>
      )}

      {/* Audit result */}
      {error && <div style={{ color: 'var(--red)', padding: '12px 16px', background: '#f43f5e11', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {result && (
        <div className="card" style={{ marginBottom: 16, borderColor: isCrit ? '#f43f5e44' : '#10b98144' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <RiskBadge label={result.riskLabel || 'SAFE'} />
                {result.pipelineMode && (
                  <span style={{ fontSize: 10, color: 'var(--purple)', background: '#7c3aed22', padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>
                    {result.pipelineMode} pipeline
                  </span>
                )}
                {isDemo && <span style={{ fontSize: 10, color: 'var(--text-dim)', background: 'var(--bg-base)', padding: '2px 8px', borderRadius: 4 }}>demo mode</span>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-sec)', maxWidth: 520 }}>{result.reasoning}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              <div>{result.txCount ?? 0} TXs analyzed</div>
              <div style={{ color: 'var(--cyan)' }}>{result.agentCalls ?? 2} agent calls</div>
              <div style={{ color: 'var(--green)' }}>~{((result.agentCalls ?? 2) * 0.19).toFixed(2)} STT</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {result.txHash && (
              <a href={`${EXPLORER}/tx/${result.txHash}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 12px' }}>
                🔗 On-chain Receipt ↗
              </a>
            )}
            <a href={`${EXPLORER}/address/${contractInput.trim() || MOCK_VAULT}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 12px' }}>
              📋 Contract ↗
            </a>
            {isCrit && (
              <button className="btn btn-red" style={{ fontSize: 11, padding: '5px 14px' }} onClick={() => setSphinxOpen(true)}>
                ⚖️ Challenge via Sphinx Protocol
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sphinx Protocol panel */}
      {(isCrit || sphinxOpen) && (
        <div className="card" style={{ marginBottom: 16, borderColor: '#a855f744', background: 'linear-gradient(135deg,#0d0d1a,#130d1f)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>⚖️ Sphinx Protocol</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Trustless LLM Court</h3>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'right' }}>
              <div>inferString(Qwen3-30B)</div>
              <div style={{ color: 'var(--purple)' }}>Score ≥ 75 → SAFE OVERRIDE</div>
              <div style={{ color: 'var(--red)' }}>Score &lt; 75 → CRITICAL CONFIRMED</div>
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 12 }}>
            Submit a defense argument. Qwen3-30B scores it 0–100 on-chain. No human moderator. No DAO vote. Pure autonomous AI justice on Somnia.
          </p>

          <textarea
            value={sphinxDefense}
            onChange={e => setSphinxDefense(e.target.value)}
            placeholder="Write your defense: explain why this activity is legitimate, cite code patterns, explain the business logic..."
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10, resize: 'vertical', fontFamily: 'var(--font-ui)', fontSize: 13, padding: '10px 12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
          />

          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {[
              { label: '💡 Try: Strong defense', val: 'This contract implements the checks-effects-interactions pattern with a nonReentrant guard. Each batchWithdraw call verifies balance sufficiency before any state change, preventing reentrancy. The withdrawal queue pattern is a standard gas optimization, not an attack vector.' },
              { label: '⚠️ Try: Weak defense', val: 'The withdrawals are normal and authorized.' },
            ].map(s => (
              <button key={s.label} className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => setSphinxDefense(s.val)}>{s.label}</button>
            ))}
          </div>

          <button className="btn btn-purple" onClick={runSphinx} disabled={sphinxLoading || !sphinxDefense.trim()} style={{ fontSize: 13, padding: '9px 20px' }}>
            {sphinxLoading ? '⚖️ Sphinx evaluating...' : '⚖️ Submit to Sphinx Protocol'}
          </button>

          {sphinxResult && (
            <div style={{ marginTop: 14, padding: '12px 16px', background: 'var(--bg-base)', borderRadius: 8,
              borderLeft: `3px solid ${sphinxResult.verdict === 'SAFE_OVERRIDE' ? 'var(--green)' : 'var(--red)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: sphinxResult.verdict === 'SAFE_OVERRIDE' ? 'var(--green)' : 'var(--red)' }}>
                  {sphinxResult.verdict === 'SAFE_OVERRIDE' ? '✅ SAFE OVERRIDE' : '🔴 CRITICAL CONFIRMED'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)' }}>
                  Score: <strong>{sphinxResult.score}</strong> / 100
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-sec)', margin: '0 0 8px' }}>{sphinxResult.outcome}</p>
              {sphinxResult.demo && (
                <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: '0 0 8px' }}>ℹ️ Deterministic demo result (on-chain Sphinx agent consensus in progress)</p>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-dim)' }}>
                <span>Primitive: <code style={{ color: 'var(--purple)' }}>inferString()</code></span>
                <span>Validators: <strong style={{ color: 'var(--cyan)' }}>3</strong></span>
                <span>Cost: <strong style={{ color: 'var(--green)' }}>0.25 STT</strong></span>
                {sphinxResult.txHash && <a href={`${EXPLORER}/tx/${sphinxResult.txHash}`} target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)' }}>On-chain ↗</a>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Swarm audit */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>🌐 Swarm Audit</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Audit All Contracts Simultaneously</h3>
            <p style={{ fontSize: 12, color: 'var(--text-sec)', margin: '4px 0 0' }}>3 independent agent pipelines run in parallel — true composability</p>
          </div>
          <button className="btn btn-cyan" onClick={runSwarm} disabled={swarmLoading} style={{ fontSize: 13 }}>
            {swarmLoading ? '⏳ Swarming...' : '🌐 Run Swarm Audit'}
          </button>
        </div>

        {swarmResult && (
          <div style={{ marginTop: 10 }}>
            {swarmResult.ok ? (
              <>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  {[
                    { label: 'Contracts', val: swarmResult.summary?.total, color: 'var(--text-primary)' },
                    { label: 'Critical', val: swarmResult.summary?.critical, color: 'var(--red)' },
                    { label: 'Suspicious', val: swarmResult.summary?.suspicious, color: '#f59e0b' },
                    { label: 'Safe', val: swarmResult.summary?.safe, color: 'var(--green)' },
                    { label: 'Agent Calls', val: swarmResult.summary?.totalAgentCalls, color: 'var(--purple)' },
                    { label: 'Cost', val: swarmResult.summary?.totalCostSTT + ' STT', color: 'var(--cyan)' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', minWidth: 80 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.val ?? '—'}</div>
                    </div>
                  ))}
                </div>
                {swarmResult.results?.map(r => (
                  <div key={r.address} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-base)', borderRadius: 6, marginBottom: 6, border: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <code style={{ fontSize: 11, color: 'var(--text-primary)' }}>{r.address.slice(0,12)}...{r.address.slice(-6)}</code>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>{r.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <RiskBadge label={r.riskLabel} />
                      <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{r.pipelineMode}</span>
                      <a href={r.explorerContract} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--cyan)' }}>↗</a>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ color: 'var(--red)', fontSize: 12 }}>Error: {swarmResult.error}</div>
            )}
          </div>
        )}
      </div>

      {/* Alert system test */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>🔔 Alert System</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Discord + Telegram Live Check</h3>
            <p style={{ fontSize: 12, color: 'var(--text-sec)', margin: '4px 0 0' }}>Verify alert webhooks are firing — checks both channels</p>
          </div>
          <button className="btn btn-ghost" onClick={testAlert} disabled={alertLoading} style={{ fontSize: 12 }}>
            {alertLoading ? '⏳ Checking...' : '🔔 Test Alerts'}
          </button>
        </div>
        {alertResult && (
          <div style={{ marginTop: 10, fontSize: 12, color: alertResult.startsWith('✅') ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)', padding: '8px 12px', background: 'var(--bg-base)', borderRadius: 6 }}>
            {alertResult}
          </div>
        )}
      </div>

      {/* Why Only Somnia */}
      <div className="card" style={{ background: 'linear-gradient(135deg,#0d0d1a,#0a1020)', borderColor: '#6366f144' }}>
        <div style={{ fontSize: 11, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>🌐 Why This Only Works on Somnia</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {[
            { icon: '🧠', title: 'Native On-Chain LLM', desc: 'inferString() calls Qwen3-30B directly from a smart contract. No external oracle. No off-chain bridge. Impossible on any other chain.' },
            { icon: '✅', title: '3-Validator Consensus', desc: 'Every AI call is verified by 3 independent validators. The result is trustless — not a centralized API response dressed up as a blockchain call.' },
            { icon: '⚖️', title: 'Sphinx Protocol', desc: 'A trustless LLM court requires verifiable AI. On Ethereum you need a DAO to vote. On Somnia, inferString() IS the court — autonomous, immutable, instant.' },
            { icon: '💰', title: '750× Cheaper', desc: 'Chainlink Functions costs $5–15 per AI call. Somnia inferString() costs 0.25 STT (~$0.01). 1,000 audits/day costs $10 on Somnia vs $10,000 on Ethereum.' },
          ].map(s => (
            <div key={s.title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
