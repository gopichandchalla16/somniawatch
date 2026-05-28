import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import AuditFeed from './components/AuditFeed';
import CertificateGallery from './components/CertificateGallery';
import Leaderboard from './components/Leaderboard';
import RegisterPanel from './components/RegisterPanel';
import AgentFlowDiagram from './components/AgentFlowDiagram';
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
  'function batchWithdraw() external',
  'function deposit() external payable',
  'function withdraw(uint256 amount) external'
];

export default function App() {
  const [provider, setProvider]     = useState(null);
  const [signer, setSigner]         = useState(null);
  const [account, setAccount]       = useState(null);
  const [watch, setWatch]           = useState(null);
  const [cert, setCert]             = useState(null);
  const [contracts, setContracts]   = useState([MOCK_VAULT_ADDRESS]);
  const [activeTab, setActiveTab]   = useState('dashboard');
  const [attackStatus, setAttackStatus] = useState('');
  const [registerInput, setRegisterInput] = useState('');
  const [registerStatus, setRegisterStatus] = useState('');
  const [stats, setStats]           = useState({ totalAudits: 0, registered: 0, criticals: 0 });

  // ── Connect Wallet ──────────────────────────────────────────────────
  const connectWallet = async () => {
    if (!window.ethereum) return alert('Please install MetaMask');
    try {
      const p = new ethers.BrowserProvider(window.ethereum);
      await p.send('eth_requestAccounts', []);
      const network = await p.getNetwork();
      if (network.chainId !== BigInt(SOMNIA_CHAIN_ID)) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + SOMNIA_CHAIN_ID.toString(16) }]
          });
        } catch {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x' + SOMNIA_CHAIN_ID.toString(16),
              chainName: 'Somnia Testnet',
              nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
              rpcUrls: [SOMNIA_RPC],
              blockExplorerUrls: ['https://shannon-explorer.somnia.network']
            }]
          });
        }
      }
      const s = await p.getSigner();
      const addr = await s.getAddress();
      const watchContract = new ethers.Contract(SOMNIAWATCH_ADDRESS, SomniaWatchABI, s);
      const certContract  = new ethers.Contract(CERTIFICATE_ADDRESS, AuditCertABI, s);
      setProvider(p);
      setSigner(s);
      setAccount(addr);
      setWatch(watchContract);
      setCert(certContract);
    } catch (e) {
      console.error(e);
    }
  };

  // ── Load stats ──────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    if (!watch) return;
    try {
      const total     = await watch.totalAuditsCompleted();
      const registered = await watch.getRegisteredCount();
      setStats(s => ({ ...s, totalAudits: Number(total), registered: Number(registered) }));
    } catch {}
  }, [watch]);

  useEffect(() => { loadStats(); }, [loadStats]);

  // ── Register contract ───────────────────────────────────────────────
  const handleRegister = async () => {
    if (!watch) return alert('Connect wallet first');
    if (!ethers.isAddress(registerInput)) return alert('Invalid address');
    try {
      setRegisterStatus('Registering...');
      const tx = await watch.registerContract(registerInput);
      await tx.wait();
      setContracts(prev => [...new Set([...prev, registerInput])]);
      setRegisterStatus('Registered! Monitoring starts in the next keeper cycle.');
      setRegisterInput('');
      loadStats();
    } catch (e) {
      setRegisterStatus('Error: ' + (e.reason || e.message));
    }
  };

  // ── One-click Attack Simulator ──────────────────────────────────────
  const simulateAttack = async () => {
    if (!signer) return alert('Connect wallet first');
    try {
      setAttackStatus('Sending batchWithdraw to MockVault...');
      const vault = new ethers.Contract(MOCK_VAULT_ADDRESS, MOCK_VAULT_ABI, signer);
      const tx = await vault.batchWithdraw();
      setAttackStatus('Waiting for confirmation...');
      await tx.wait();
      setAttackStatus('Attack simulated! SomniaWatch keeper will detect this in the next cycle (up to 5 min). Watch the Audit Feed for a CRITICAL or SUSPICIOUS classification.');
    } catch (e) {
      setAttackStatus('Error: ' + (e.reason || e.message || 'batchWithdraw failed — vault may need funds'));
    }
  };

  const tabs = [
    { id: 'dashboard',    label: 'Dashboard' },
    { id: 'certificates', label: 'NFT Certificates' },
    { id: 'leaderboard',  label: 'Leaderboard' },
    { id: 'how-it-works', label: 'How It Works' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', color: '#e0e8ff', fontFamily: 'monospace' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #1e2d4a', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, color: '#22ff88' }}>SomniaWatch</h1>
          <p style={{ margin: 0, fontSize: 12, color: '#7a9cc0' }}>Autonomous Agentic Security Guardian on Somnia L1</p>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#7a9cc0' }}>Audits: {stats.totalAudits} | Contracts: {stats.registered}</span>
          {account
            ? <span style={{ fontSize: 12, color: '#22ff88', background: '#0d2a1a', padding: '6px 12px', borderRadius: 6 }}>{account.slice(0,8)}...{account.slice(-4)}</span>
            : <button onClick={connectWallet} style={{ background: '#1a6cff', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>Connect Wallet</button>
          }
        </div>
      </header>

      {/* Hero Banner */}
      {!account && (
        <div style={{ textAlign: 'center', padding: '48px 24px', borderBottom: '1px solid #1e2d4a' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>The first autonomous smart contract guardian on Somnia Agentic L1.</div>
          <p style={{ color: '#7a9cc0', maxWidth: 600, margin: '0 auto 24px', fontSize: 15 }}>
            Watch. Reason. Act. No humans required. Powered by a 2-agent pipeline — JSON API + LLM Inference — with validator consensus and immutable on-chain receipts.
          </p>
          <button onClick={connectWallet} style={{ background: '#22ff88', color: '#000', border: 'none', padding: '14px 36px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>Connect Wallet to Start</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e2d4a', padding: '0 24px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '12px 20px', background: 'none', border: 'none',
            borderBottom: activeTab === t.id ? '2px solid #22ff88' : '2px solid transparent',
            color: activeTab === t.id ? '#22ff88' : '#7a9cc0',
            cursor: 'pointer', fontFamily: 'monospace', fontSize: 14
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '24px' }}>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Attack Simulator */}
            <div style={{ background: '#0d1a2a', border: '1px solid #ff4444', borderRadius: 10, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#ff4444', margin: '0 0 8px' }}>One-Click Attack Simulator</h3>
              <p style={{ color: '#7a9cc0', fontSize: 13, margin: '0 0 12px' }}>Calls <code>batchWithdraw()</code> on MockVault to simulate a suspicious withdrawal pattern. SomniaWatch agents will detect and classify the risk in the next 5-minute cycle.</p>
              <button onClick={simulateAttack} style={{ background: '#cc2200', color: '#fff', border: 'none', padding: '10px 28px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
                Simulate Attack on MockVault
              </button>
              {attackStatus && <p style={{ marginTop: 10, fontSize: 13, color: attackStatus.startsWith('Error') ? '#ff6666' : '#22ff88' }}>{attackStatus}</p>}
            </div>

            {/* Register Panel */}
            <div style={{ background: '#0d1a2a', border: '1px solid #1e2d4a', borderRadius: 10, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: '#22aaff', margin: '0 0 8px' }}>Register Contract for Monitoring</h3>
              <p style={{ color: '#7a9cc0', fontSize: 13, margin: '0 0 12px' }}>Add any Somnia contract address to be monitored by the autonomous agent pipeline.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  value={registerInput}
                  onChange={e => setRegisterInput(e.target.value)}
                  placeholder="0x... contract address"
                  style={{ flex: 1, background: '#0a0f1a', border: '1px solid #1e2d4a', color: '#e0e8ff', padding: '8px 12px', borderRadius: 6, fontFamily: 'monospace' }}
                />
                <button onClick={handleRegister} style={{ background: '#1a6cff', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>Register</button>
              </div>
              {registerStatus && <p style={{ marginTop: 8, fontSize: 13, color: registerStatus.startsWith('Error') ? '#ff6666' : '#22ff88' }}>{registerStatus}</p>}
            </div>

            {/* Monitored Contracts */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#e0e8ff', marginBottom: 12 }}>Monitored Contracts</h3>
              {contracts.map(addr => (
                <div key={addr} style={{ background: '#0d1a2a', border: '1px solid #1e2d4a', borderRadius: 8, padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ fontSize: 13 }}>{addr}</code>
                  <a href={`${EXPLORER_BASE}/address/${addr}`} target="_blank" rel="noreferrer" style={{ color: '#22aaff', fontSize: 12 }}>View on Explorer</a>
                </div>
              ))}
            </div>

            {/* Audit Feed with Risk Chart */}
            <AuditFeed contracts={contracts} watch={watch} explorerBase={EXPLORER_BASE} />
          </div>
        )}

        {/* CERTIFICATES TAB */}
        {activeTab === 'certificates' && (
          <CertificateGallery contracts={contracts} watch={watch} cert={cert} explorerBase={EXPLORER_BASE} />
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <Leaderboard watch={watch} explorerBase={EXPLORER_BASE} />
        )}

        {/* HOW IT WORKS TAB */}
        {activeTab === 'how-it-works' && (
          <AgentFlowDiagram />
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1e2d4a', padding: '16px 24px', textAlign: 'center', fontSize: 12, color: '#3a5a80' }}>
        SomniaWatch by <a href="https://x.com/GopichandAI" target="_blank" rel="noreferrer" style={{ color: '#22aaff' }}>Gopichand Challa</a> |
        <a href="https://github.com/gopichandchalla16/somniawatch" target="_blank" rel="noreferrer" style={{ color: '#22aaff', marginLeft: 8 }}>GitHub</a> |
        Somnia Agentathon 2026 | Contract: <a href={`${EXPLORER_BASE}/address/${SOMNIAWATCH_ADDRESS}`} target="_blank" rel="noreferrer" style={{ color: '#22aaff' }}>{SOMNIAWATCH_ADDRESS.slice(0,12)}...</a>
      </footer>
    </div>
  );
}
