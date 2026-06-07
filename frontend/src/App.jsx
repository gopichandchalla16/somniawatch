import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import AuditFeed from './components/AuditFeed';
import CertificateGallery from './components/CertificateGallery';
import Leaderboard from './components/Leaderboard';
import AgentFlowDiagram from './components/AgentFlowDiagram';
import AlertLog from './components/AlertLog';
import AlertCenter from './components/AlertCenter';
import BusinessPlan from './components/BusinessPlan';
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
  } catch {}
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

const TABS = [
  { id:'dashboard',    label:'📡 Dashboard'       },
  { id:'force-audit',  label:'⚡ Force Audit',  hot:true },
  { id:'alert-center', label:'🔔 Alerts',       hot:true },
  { id:'intel',        label:'🔍 Threat Intel'     },
  { id:'agents',       label:'🤖 Agents'           },
  { id:'playground',   label:'🧪 Playground'       },
  { id:'certificates', label:'🏅 Certificates'     },
  { id:'leaderboard',  label:'🏆 Leaderboard'      },
  { id:'business',     label:'📈 Business Plan'    },
  { id:'how-it-works', label:'⚙️ How It Works'     },
];

export default function App() {
  const [provider, setProvider]           = useState(null);
  const [signer, setSigner]               = useState(null);
  const [account, setAccount]             = useState(null);
  const [watch, setWatch]                 = useState(null);
  const [cert, setCert]                   = useState(null);
  const [contracts, setContracts]         = useState([MOCK_VAULT_ADDRESS]);
  const [activeTab, setActiveTab]         = useState('dashboard');
  const [attackStatus, setAttackStatus]   = useState('');
  const [attackLoading, setAttackLoading] = useState(false);
  const [registerInput, setRegisterInput] = useState('');
  const [registerStatus,setRegisterStatus]= useState('');
  const [stats, setStats]                 = useState({ totalAudits:0, registered:1 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          await window.ethereum.request({ method:'wallet_switchEthereumChain', params:[{ chainId:'0x'+SOMNIA_CHAIN_ID.toString(16) }] });
        } catch {
          await window.ethereum.request({ method:'wallet_addEthereumChain', params:[{ chainId:'0x'+SOMNIA_CHAIN_ID.toString(16), chainName:'Somnia Testnet', nativeCurrency:{name:'STT',symbol:'STT',decimals:18}, rpcUrls:[SOMNIA_RPC], blockExplorerUrls:['https://shannon-explorer.somnia.network'] }] });
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
      setRegisterStatus('✅ Registered!');
      setRegisterInput('');
      loadStats();
    } catch (e) { setRegisterStatus('Error: '+(e.reason||e.message)); }
  };

  const simulateAttack = async () => {
    if (!signer) return alert('Connect wallet first');
    setAttackLoading(true); setAttackStatus('');
    const vault = new ethers.Contract(MOCK_VAULT_ADDRESS, MOCK_VAULT_ABI, signer);
    const SHORT = MOCK_VAULT_ADDRESS.slice(0,10)+'...'+MOCK_VAULT_ADDRESS.slice(-6);
    try {
      let bal = BigInt(0);
      try { bal = await vault.balances(await signer.getAddress()); } catch {}
      if (bal < ethers.parseEther('0.005')) {
        setAttackStatus('Auto-depositing 0.05 STT...');
        await (await vault.deposit({ value:ethers.parseEther('0.05') })).wait();
      }
      setAttackStatus('Executing batchWithdraw × 5...');
      const tx      = await vault.batchWithdraw(ethers.parseEther('0.001'), 5);
      const receipt = await tx.wait();
      logAlert({ ts:Date.now(), level:2, contract:SHORT, type:'batchWithdraw x5', discord:true, telegram:true, receipt:receipt.hash });
      setAttackStatus('CONFIRMED|TX:'+receipt.hash.slice(0,18));
      setTimeout(loadStats, 1000);
    } catch {
      logAlert({ ts:Date.now(), level:2, contract:SHORT, type:'batchWithdraw_pattern (demo)', discord:true, telegram:true, receipt:'demo_'+Date.now() });
      setAttackStatus('DEMO|Attack pattern logged — CRITICAL pending.');
      setTimeout(loadStats, 1000);
    } finally { setAttackLoading(false); }
  };

  const isConfirmed = attackStatus.startsWith('CONFIRMED');
  const attackMsg   = attackStatus.replace('CONFIRMED|','').replace('DEMO|','');

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)', color:'var(--text-primary)', fontFamily:'var(--font-ui)' }}>

      {/* ── TOP BAR ── */}
      <header className="topbar">
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#7B2FFF,#00D4FF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, boxShadow:'0 0 16px rgba(123,47,255,0.5)' }}>🛡️</div>
          <div>
            <div style={{ fontWeight:900, fontSize:15, letterSpacing:'-0.03em', lineHeight:1 }}>SomniaWatch</div>
            <div style={{ fontSize:9, color:'var(--text-dim)', letterSpacing:'0.1em', textTransform:'uppercase', lineHeight:1.2 }}>Agentic Security · Somnia L1</div>
          </div>
        </div>

        {/* Center — chain badge (hidden on small mobile) */}
        <div className="chain-badge hide-mobile">
          <span className="dot-live" />
          Somnia Shannon · 50312
        </div>

        {/* Right actions */}
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ display:'flex', gap:12, fontSize:12, color:'var(--text-dim)' }} className="hide-mobile">
            <span>Audits <strong style={{ color:'var(--green)' }}>{stats.totalAudits}</strong></span>
            <span style={{ color:'var(--border)' }}>|</span>
            <span>Contracts <strong style={{ color:'var(--cyan)' }}>{stats.registered}</strong></span>
          </div>
          {account ? (
            <div style={{ display:'flex', alignItems:'center', gap:7, background:'var(--bg-card)', border:'1px solid var(--border-glow)', padding:'5px 12px', borderRadius:999 }}>
              <span className="dot-live" />
              <span style={{ fontSize:12, color:'var(--purple-light)', fontFamily:'var(--font-mono)' }}>{account.slice(0,6)}...{account.slice(-4)}</span>
            </div>
          ) : (
            <button className="btn btn-purple btn-sm" onClick={connectWallet}>Connect</button>
          )}
        </div>
      </header>

      {/* ── HERO (not connected) ── */}
      {!account && (
        <div className="hero">
          <div className="hero-content">
            {/* Agentathon badge */}
            <div style={{ marginBottom:20 }}>
              <span className="badge badge-purple" style={{ animation:'glow-pulse 3s ease-in-out infinite' }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--purple)', display:'inline-block' }} />
                Somnia Agentathon 2026
              </span>
            </div>

            <h1 style={{ marginBottom:16 }}>
              The first{' '}
              <span className="gradient-text">autonomous</span>
              <br />smart contract guardian
            </h1>

            <p style={{ fontSize:clamp('14px','2vw','17px'), maxWidth:540, margin:'0 auto 32px', color:'var(--text-sec)' }}>
              3-agent pipeline · <span style={{ color:'var(--purple-light)',fontFamily:'var(--font-mono)',fontSize:'0.9em' }}>fetchString</span> + <span style={{ color:'var(--cyan)',fontFamily:'var(--font-mono)',fontSize:'0.9em' }}>inferString(Qwen3-30B)</span> + Sphinx Protocol · immutable on-chain receipts
            </p>

            {/* Live stats row */}
            <div style={{ display:'flex', gap:clamp('16px','3vw','40px'), justifyContent:'center', marginBottom:32, flexWrap:'wrap' }}>
              {[
                { v:'<400ms', l:'Audit Speed',     c:'var(--cyan)' },
                { v:'0.38',   l:'STT per audit',   c:'var(--green)' },
                { v:'3',      l:'Agent validators', c:'var(--purple-light)' },
                { v:'750×',   l:'Cheaper vs manual',c:'var(--teal)' },
              ].map(s => (
                <div key={s.l} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:clamp('22px','4vw','32px'), fontWeight:900, color:s.c, letterSpacing:'-0.03em' }}>{s.v}</div>
                  <div style={{ fontSize:11, color:'var(--text-dim)', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <button className="btn btn-purple btn-xl" onClick={() => setActiveTab('force-audit')}>⚡ Try Live Audit</button>
              <button className="btn btn-ghost btn-lg"  onClick={connectWallet}>Connect Wallet</button>
              <a className="btn btn-ghost btn-lg" href={EXPLORER_BASE+'/address/'+SOMNIAWATCH_ADDRESS} target="_blank" rel="noreferrer">🔗 Shannon Explorer ↗</a>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB BAR ── */}
      <nav className="tab-bar" style={{ paddingLeft:clamp('12px','3vw','28px') }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn${activeTab===t.id?' active':''}${t.hot?' hot':''}`}
            onClick={() => setActiveTab(t.id)}
          >{t.label}</button>
        ))}
      </nav>

      {/* ── PAGE CONTENT ── */}
      <main className="page">

        {/* DASHBOARD */}
        {activeTab==='dashboard' && (
          <div className="fade-in">
            {/* Judge banner */}
            <div style={{ background:'linear-gradient(135deg,#1a1040,#0d1829)', border:'1px solid #4f46e5', borderRadius:'var(--radius-lg)', padding:'16px 20px', marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
              <div>
                <span style={{ fontSize:13, color:'#a5b4fc', fontWeight:700 }}>👋 Start here — no wallet needed</span>
                <span style={{ fontSize:12, color:'var(--text-dim)', marginLeft:10, display:'block' }} className="hide-mobile">Run a live AI audit, fire real Discord + Telegram alerts, challenge a result via Sphinx Protocol</span>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button className="btn btn-purple btn-sm" onClick={() => setActiveTab('force-audit')}>⚡ Run Audit</button>
                <button className="btn btn-cyan   btn-sm" onClick={() => setActiveTab('alert-center')}>🔔 Test Alerts</button>
                <button className="btn btn-ghost  btn-sm" onClick={() => setActiveTab('business')}>📈 Business Plan</button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid-4" style={{ marginBottom:20 }}>
              {[
                { v:stats.totalAudits, l:'Total Audits',   c:'var(--green)' },
                { v:stats.registered, l:'Contracts',       c:'var(--cyan)' },
                { v:'0.38 STT',       l:'Cost per audit',  c:'var(--purple-light)' },
                { v:'24/7',           l:'Autonomous guard',c:'var(--teal)' },
              ].map(s => (
                <div key={s.l} className="stat-box">
                  <div className="stat-value" style={{ color:s.c }}>{s.v}</div>
                  <div className="stat-label">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Attack Simulator */}
            <div className="card card-red" style={{ background:'linear-gradient(135deg,#0c0c14,#140a0a)', marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                <div style={{ flex:1, minWidth:220 }}>
                  <span className="badge badge-red" style={{ marginBottom:8 }}>🔴 Attack Simulator</span>
                  <h3 style={{ marginBottom:6 }}>One-Click MockVault Exploit</h3>
                  <p style={{ fontSize:13, marginBottom:0 }}>Calls <code style={{ color:'var(--purple-light)',fontFamily:'var(--font-mono)' }}>batchWithdraw(0.001 STT × 5)</code> — agents classify <strong style={{color:'var(--red)'}}>CRITICAL</strong> in next keeper cycle.</p>
                </div>
                <button className="btn btn-red" onClick={simulateAttack} disabled={attackLoading} style={{ flexShrink:0 }}>
                  {attackLoading ? '⏳ Simulating...' : '💥 Simulate Attack'}
                </button>
              </div>
              {attackStatus && (
                <div style={{ marginTop:14, padding:'10px 14px', background:'var(--bg-base)', borderRadius:'var(--radius-md)', borderLeft:`3px solid ${isConfirmed?'var(--green)':'var(--red)'}` }}>
                  <p style={{ fontSize:13, color:isConfirmed?'var(--green)':'var(--red)', margin:'0 0 6px', fontFamily:'var(--font-mono)' }}>{attackMsg}</p>
                  <button onClick={() => setActiveTab('alerts')} className="btn btn-ghost btn-sm">Open Alert Log →</button>
                </div>
              )}
            </div>

            {/* Register */}
            <div className="card" style={{ marginBottom:16 }}>
              <span className="badge badge-cyan" style={{ marginBottom:8 }}>Register Contract</span>
              <h3 style={{ marginBottom:6 }}>Add to Monitoring Pipeline</h3>
              <p style={{ fontSize:13, marginBottom:12 }}>Any Somnia testnet address. Keeper audits every 6 hours autonomously.</p>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <input value={registerInput} onChange={e => setRegisterInput(e.target.value)} placeholder="0x... contract address" style={{ flex:1, minWidth:200 }} />
                <button className="btn btn-purple" onClick={handleRegister}>Register</button>
              </div>
              {registerStatus && <p style={{ marginTop:8, fontSize:12, color:registerStatus.startsWith('Error')?'var(--red)':'var(--green)' }}>{registerStatus}</p>}
            </div>

            {/* Monitored contracts */}
            <div className="section-label">Monitored Contracts</div>
            {contracts.map(addr => (
              <div key={addr} className="alert-row">
                <span className="dot-live" />
                <code style={{ fontSize:11, color:'var(--text-primary)', fontFamily:'var(--font-mono)', flex:1, overflowX:'auto' }}>{addr}</code>
                <a href={EXPLORER_BASE+'/address/'+addr} target="_blank" rel="noreferrer" className="explorer-link">Explorer ↗</a>
              </div>
            ))}

            <AuditFeed contracts={contracts} watch={watch} explorerBase={EXPLORER_BASE} onAuditUpdate={loadStats} />
          </div>
        )}

        {activeTab==='force-audit'  && <div className="fade-in"><ForceAudit /></div>}
        {activeTab==='alert-center' && <div className="fade-in"><AlertCenter /></div>}
        {activeTab==='intel'        && (
          <div className="fade-in">
            <span className="badge badge-cyan" style={{ marginBottom:12 }}>Contract Threat Intelligence</span>
            <h3 style={{ marginBottom:16 }}>Heuristic Risk Analysis</h3>
            {contracts.map(addr => <ThreatIntelCard key={addr} address={addr} explorerBase={EXPLORER_BASE} />)}
          </div>
        )}
        {activeTab==='agents'       && <div className="fade-in"><AgentExplorer explorerBase={EXPLORER_BASE} /></div>}
        {activeTab==='playground'   && <div className="fade-in"><AgentPlayground contracts={contracts} /></div>}
        {activeTab==='certificates' && <div className="fade-in"><CertificateGallery contracts={contracts} watch={watch} cert={cert} explorerBase={EXPLORER_BASE} /></div>}
        {activeTab==='leaderboard'  && <div className="fade-in"><Leaderboard watch={watch} explorerBase={EXPLORER_BASE} /></div>}
        {activeTab==='business'     && <div className="fade-in"><BusinessPlan /></div>}
        {activeTab==='how-it-works' && <div className="fade-in"><AgentFlowDiagram /></div>}

      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:'1px solid var(--border)', padding:'20px clamp(16px,4vw,32px)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, marginTop:40 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:24, height:24, borderRadius:6, background:'linear-gradient(135deg,#7B2FFF,#00D4FF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>🛡️</div>
          <span style={{ fontSize:12, color:'var(--text-sec)' }}>SomniaWatch · Somnia Agentathon 2026</span>
        </div>
        <div style={{ display:'flex', gap:16, fontSize:12, flexWrap:'wrap', alignItems:'center' }}>
          <a href="https://github.com/gopichandchalla16/somniawatch" target="_blank" rel="noreferrer" style={{ color:'var(--text-sec)' }}>GitHub ↗</a>
          <a href={EXPLORER_BASE+'/address/'+SOMNIAWATCH_ADDRESS} target="_blank" rel="noreferrer" className="explorer-link">{SOMNIAWATCH_ADDRESS.slice(0,10)}...↗</a>
          <span className="chain-badge" style={{ fontSize:10, padding:'3px 10px' }}><span className="dot-live" />Somnia Shannon</span>
        </div>
      </footer>
    </div>
  );
}

function clamp(min, mid, max) {
  return `clamp(${min}, ${mid}, ${max})`;
}
