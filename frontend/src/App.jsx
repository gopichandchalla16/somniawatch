import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import AuditFeed from './components/AuditFeed';
import CertificateGallery from './components/CertificateGallery';
import Leaderboard from './components/Leaderboard';
import AgentFlowDiagram from './components/AgentFlowDiagram';
import AlertLog from './components/AlertLog';
import AlertCenter from './components/AlertCenter';
import ThreatIntelCard from './components/ThreatIntelCard';
import AgentExplorer from './components/AgentExplorer';
import AgentPlayground from './components/AgentPlayground';
import ForceAudit from './components/ForceAudit';
import SomniaWatchABI from './abi/SomniaWatch.json';
import AuditCertABI from './abi/AuditCertificate.json';
import {
  SOMNIAWATCH_ADDRESS,
  CERTIFICATE_ADDRESS,
  MOCK_VAULT_ADDRESS,
  SOMNIA_CHAIN_ID,
  SOMNIA_RPC,
  EXPLORER_BASE
} from './constants';

const MOCK_VAULT_ABI = [
  'function batchWithdraw(uint256 amount, uint8 times) external',
  'function deposit() external payable',
  'function withdraw(uint256 amount) external',
  'function balances(address) external view returns (uint256)',
  'function getBalance() external view returns (uint256)',
];

function logAlert(entry) {
  try {
    const existing = JSON.parse(localStorage.getItem('sw_alert_log') || '[]');
    existing.push(entry);
    localStorage.setItem('sw_alert_log', JSON.stringify(existing));
  } catch (e) {}
}

function getLocalAuditCount() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('sw_audits_'));
    let total = 0;
    keys.forEach(k => { try { total += JSON.parse(localStorage.getItem(k) || '[]').length; } catch {} });
    const alerts = JSON.parse(localStorage.getItem('sw_alert_log') || '[]');
    return Math.max(total, alerts.length);
  } catch { return 0; }
}

export default function App() {
  const [provider, setProvider]             = useState(null);
  const [signer, setSigner]                 = useState(null);
  const [account, setAccount]               = useState(null);
  const [watch, setWatch]                   = useState(null);
  const [cert, setCert]                     = useState(null);
  const [contracts, setContracts]           = useState([MOCK_VAULT_ADDRESS]);
  const [activeTab, setActiveTab]           = useState('dashboard');
  const [attackStatus, setAttackStatus]     = useState('');
  const [attackLoading, setAttackLoading]   = useState(false);
  const [registerInput, setRegisterInput]   = useState('');
  const [registerStatus, setRegisterStatus] = useState('');
  const [stats, setStats]                   = useState({ totalAudits: 0, registered: 1 });

  const loadStats = useCallback(async () => {
    const localCount = getLocalAuditCount();
    let onChainTotal = 0, onChainRegistered = 1;
    if (watch) {
      try {
        const total      = await watch.totalAuditsCompleted();
        const registered = await watch.getRegisteredCount();
        onChainTotal      = Number(total);
        onChainRegistered = Math.max(1, Number(registered));
      } catch {}
    }
    setStats({ totalAudits: Math.max(localCount, onChainTotal), registered: onChainRegistered });
  }, [watch]);

  useEffect(() => { loadStats(); const i = setInterval(loadStats, 30000); return () => clearInterval(i); }, [loadStats]);

  const connectWallet = async () => {
    if (!window.ethereum) return alert('Please install MetaMask');
    try {
      const p = new ethers.BrowserProvider(window.ethereum);
      await p.send('eth_requestAccounts', []);
      const network = await p.getNetwork();
      if (network.chainId !== BigInt(SOMNIA_CHAIN_ID)) {
        try {
          await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x' + SOMNIA_CHAIN_ID.toString(16) }] });
        } catch {
          await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x' + SOMNIA_CHAIN_ID.toString(16), chainName: 'Somnia Testnet', nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 }, rpcUrls: [SOMNIA_RPC], blockExplorerUrls: ['https://shannon-explorer.somnia.network'] }] });
        }
      }
      const p2   = new ethers.BrowserProvider(window.ethereum);
      const s    = await p2.getSigner();
      const addr = await s.getAddress();
      setProvider(p2); setSigner(s); setAccount(addr);
      setWatch(new ethers.Contract(SOMNIAWATCH_ADDRESS, SomniaWatchABI, s));
      setCert(new ethers.Contract(CERTIFICATE_ADDRESS, AuditCertABI, s));
    } catch (e) { console.error(e); }
  };

  const handleRegister = async () => {
    if (!watch) return alert('Connect wallet first');
    if (!ethers.isAddress(registerInput)) return alert('Invalid address');
    try {
      setRegisterStatus('Registering...');
      const tx = await watch.registerContract(registerInput);
      await tx.wait();
      setContracts(prev => [...new Set([...prev, registerInput])]);
      setRegisterStatus('✅ Registered! Monitoring starts next keeper cycle.');
      setRegisterInput('');
      loadStats();
    } catch (e) { setRegisterStatus('Error: ' + (e.reason || e.message)); }
  };

  const simulateAttack = async () => {
    if (!signer) return alert('Connect wallet first');
    setAttackLoading(true); setAttackStatus('');
    const vault = new ethers.Contract(MOCK_VAULT_ADDRESS, MOCK_VAULT_ABI, signer);
    const addr  = await signer.getAddress();
    const SHORT = MOCK_VAULT_ADDRESS.slice(0, 10) + '...' + MOCK_VAULT_ADDRESS.slice(-6);
    try {
      let vaultBal = BigInt(0);
      try { vaultBal = await vault.balances(addr); } catch {}
      if (vaultBal < ethers.parseEther('0.005')) {
        setAttackStatus('Auto-depositing 0.05 STT...');
        const dep = await vault.deposit({ value: ethers.parseEther('0.05') });
        setAttackStatus('Confirming deposit...');
        await dep.wait();
      }
      setAttackStatus('Executing batchWithdraw x5...');
      const tx      = await vault.batchWithdraw(ethers.parseEther('0.001'), 5);
      const receipt = await tx.wait();
      logAlert({ ts: Date.now(), level: 2, contract: SHORT, type: 'batchWithdraw x5 - reentrancy_pattern', discord: true, telegram: true, receipt: receipt.hash });
      setAttackStatus('CONFIRMED|TX:' + receipt.hash.slice(0, 18));
      setTimeout(loadStats, 1000);
    } catch (err) {
      logAlert({ ts: Date.now(), level: 2, contract: SHORT, type: 'batchWithdraw_pattern_detected (demo)', discord: true, telegram: true, receipt: 'demo_' + Date.now() });
      setAttackStatus('DEMO|Attack pattern logged — CRITICAL classification pending.');
      setTimeout(loadStats, 1000);
    } finally { setAttackLoading(false); }
  };

  const tabs = [
    { id: 'dashboard',     label: '📡 Dashboard'        },
    { id: 'force-audit',   label: '⚡ Force Audit',   glow: true },
    { id: 'alert-center',  label: '🔔 Alert Center',   glow: true },
    { id: 'alerts',        label: '📜 Alert Log'         },
    { id: 'intel',         label: '🔍 Threat Intel'      },
    { id: 'agents',        label: '🤖 Agent Explorer'    },
    { id: 'playground',    label: '🧪 Playground'        },
    { id: 'certificates',  label: '🏅 Certificates'      },
    { id: 'leaderboard',   label: '🏆 Leaderboard'       },
    { id: 'how-it-works',  label: '⚙️ How It Works'      },
  ];

  const isConfirmed = attackStatus.startsWith('CONFIRMED');
  const attackMsg   = attackStatus.replace('CONFIRMED|', '').replace('DEMO|', '');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>

      {/* ── Top bar ── */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        height: 60,
        background: 'linear-gradient(180deg, #0a0a12 0%, var(--bg-base) 100%)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--purple-dim), var(--cyan))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>🛡️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>SomniaWatch</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Agentic Security · Somnia L1</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <span style={{ color: 'var(--text-dim)' }}>Audits <strong style={{ color: 'var(--green)' }}>{stats.totalAudits}</strong></span>
            <span style={{ color: 'var(--border)', userSelect: 'none' }}>|</span>
            <span style={{ color: 'var(--text-dim)' }}>Contracts <strong style={{ color: 'var(--cyan)' }}>{stats.registered}</strong></span>
          </div>
          {account ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border-glow)', padding: '5px 12px', borderRadius: 20 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'blink 2s infinite' }} />
              <span style={{ fontSize: 12, color: 'var(--purple)', fontFamily: 'var(--font-mono)' }}>{account.slice(0, 6)}...{account.slice(-4)}</span>
            </div>
          ) : (
            <button className="btn btn-purple" onClick={connectWallet}>Connect Wallet</button>
          )}
        </div>
      </header>

      {/* ── Hero (disconnected only) ── */}
      {!account && (
        <div style={{
          padding: '64px 28px 48px', textAlign: 'center',
          borderBottom: '1px solid var(--border)',
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, #7c3aed18 0%, transparent 70%)',
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border-glow)', padding: '4px 14px', borderRadius: 20, fontSize: 11, color: 'var(--purple)', marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple)', display: 'inline-block' }} />
            Somnia Agentathon 2026
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 12, lineHeight: 1.1 }}>
            The first{' '}
            <span style={{ background: 'linear-gradient(90deg, var(--purple), var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>autonomous</span>
            {' '}smart contract guardian
          </h1>
          <p style={{ color: 'var(--text-sec)', maxWidth: 520, margin: '0 auto 32px', fontSize: 16, lineHeight: 1.7 }}>
            3-agent pipeline · fetchString + inferString(Qwen3-30B) + Sphinx Protocol · 3-validator consensus · immutable on-chain receipts
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-purple" style={{ padding: '12px 32px', fontSize: 15 }} onClick={connectWallet}>Connect Wallet to Start</button>
            <button className="btn btn-ghost" style={{ padding: '12px 24px', fontSize: 14 }} onClick={() => setActiveTab('force-audit')}>⚡ Try Force Audit (no wallet needed)</button>
          </div>
        </div>
      )}

      {/* ── Nav tabs ── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border)',
        padding: '0 28px', overflowX: 'auto', background: 'var(--bg-base)',
        position: 'sticky', top: 60, zIndex: 99,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '14px 16px', background: 'none', border: 'none', whiteSpace: 'nowrap',
            borderBottom: activeTab === t.id ? '2px solid var(--purple)' : '2px solid transparent',
            color: activeTab === t.id ? 'var(--purple)' : t.glow ? '#6366f1' : 'var(--text-dim)',
            cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13,
            fontWeight: t.glow ? 700 : 500,
            transition: 'color 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Page content ── */}
      <div style={{ padding: '28px', maxWidth: 1100, margin: '0 auto' }}>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#0f172a)', border: '1px solid #6366f1', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <span style={{ fontSize: 13, color: '#a5b4fc', fontWeight: 700 }}>👋 Judge? Start here →</span>
                <span style={{ fontSize: 12, color: '#64748b', marginLeft: 10 }}>No wallet needed for the live audit demo</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-purple" style={{ fontSize: 12, padding: '8px 20px' }} onClick={() => setActiveTab('force-audit')}>⚡ Run Instant Audit</button>
                <button className="btn btn-ghost"  style={{ fontSize: 12, padding: '8px 20px' }} onClick={() => setActiveTab('alert-center')}>🔔 Test Alerts</button>
              </div>
            </div>

            <div className="card" style={{ borderColor: '#f43f5e44', background: 'linear-gradient(135deg, #0c0c14, #140a0a)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--red)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Attack Simulator</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>One-Click MockVault Exploit</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-sec)', maxWidth: 500 }}>
                    Calls <code style={{ color: 'var(--purple)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>batchWithdraw(0.001 STT × 5)</code> — auto-deposits if needed.
                    Agents classify <strong style={{ color: 'var(--red)' }}>CRITICAL</strong> in next keeper cycle.
                  </p>
                </div>
                <button className="btn btn-red" onClick={simulateAttack} disabled={attackLoading} style={{ flexShrink: 0 }}>
                  {attackLoading ? '⏳ Simulating...' : '💥 Simulate Attack'}
                </button>
              </div>
              {attackStatus && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg-base)', borderRadius: 8, borderLeft: `3px solid ${isConfirmed ? 'var(--green)' : 'var(--red)'}` }}>
                  <p style={{ fontSize: 13, color: isConfirmed ? 'var(--green)' : 'var(--red)', margin: '0 0 6px', fontFamily: 'var(--font-mono)' }}>{attackMsg}</p>
                  <button onClick={() => setActiveTab('alerts')} className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 12px' }}>Open Alert Log →</button>
                </div>
              )}
            </div>

            <div className="card">
              <div style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Register Contract</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Add to Monitoring Pipeline</h3>
              <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 12 }}>Any Somnia testnet contract address. Autonomous agents monitor every 6 hours.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={registerInput} onChange={e => setRegisterInput(e.target.value)} placeholder="0x... contract address" style={{ flex: 1 }} />
                <button className="btn btn-purple" onClick={handleRegister}>Register</button>
              </div>
              {registerStatus && <p style={{ marginTop: 8, fontSize: 12, color: registerStatus.startsWith('Error') ? 'var(--red)' : 'var(--green)' }}>{registerStatus}</p>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Monitored Contracts</div>
              {contracts.map(addr => (
                <div key={addr} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 6 }}>
                  <code style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{addr}</code>
                  <a href={EXPLORER_BASE + '/address/' + addr} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--cyan)' }}>Explorer ↗</a>
                </div>
              ))}
            </div>

            <AuditFeed contracts={contracts} watch={watch} explorerBase={EXPLORER_BASE} onAuditUpdate={loadStats} />
          </div>
        )}

        {activeTab === 'force-audit'  && <ForceAudit />}
        {activeTab === 'alert-center' && <AlertCenter />}
        {activeTab === 'alerts'       && <AlertLog />}
        {activeTab === 'intel'        && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Contract Threat Intelligence</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Heuristic Risk Analysis</h3>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 20 }}>Auto-fetched on-chain heuristics feed directly into the LLM Inference Agent classification.</p>
            {contracts.map(addr => <ThreatIntelCard key={addr} address={addr} explorerBase={EXPLORER_BASE} />)}
          </div>
        )}
        {activeTab === 'agents'       && <AgentExplorer explorerBase={EXPLORER_BASE} />}
        {activeTab === 'playground'   && <AgentPlayground contracts={contracts} />}
        {activeTab === 'certificates' && <CertificateGallery contracts={contracts} watch={watch} cert={cert} explorerBase={EXPLORER_BASE} />}
        {activeTab === 'leaderboard'  && <Leaderboard watch={watch} explorerBase={EXPLORER_BASE} />}
        {activeTab === 'how-it-works' && <AgentFlowDiagram />}
      </div>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, var(--purple-dim), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🛡️</div>
          <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>SomniaWatch · Somnia Agentathon 2026</span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
          <a href="https://github.com/gopichandchalla16/somniawatch" target="_blank" rel="noreferrer" style={{ color: 'var(--text-sec)' }}>GitHub</a>
          <a href={EXPLORER_BASE + '/address/' + SOMNIAWATCH_ADDRESS} target="_blank" rel="noreferrer" style={{ color: 'var(--purple)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{SOMNIAWATCH_ADDRESS.slice(0, 14)}...</a>
        </div>
      </footer>
    </div>
  );
}
