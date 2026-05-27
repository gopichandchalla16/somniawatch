import { useState, useEffect } from "react";
import { useWallet }       from "./hooks/useWallet";
import { useSomniaWatch }  from "./hooks/useSomniaWatch";
import Header              from "./components/Header";
import StatsBar            from "./components/StatsBar";
import RegisterPanel       from "./components/RegisterPanel";
import ContractCard        from "./components/ContractCard";
import AuditFeed           from "./components/AuditFeed";
import AgentFlowDiagram    from "./components/AgentFlowDiagram";
import { SOMNIAWATCH_ADDRESS } from "./constants";

export default function App() {
  const { address, signer, isConnected, connect, error: walletError } = useWallet();
  const {
    contracts, totalAudits, contractBalance, cycleCost,
    isLoading, error: watchError,
    registerContract, triggerMonitor, clearFlag, refresh,
  } = useSomniaWatch(signer);

  const [statusMsg, setStatusMsg] = useState(null);

  const showStatus = (msg, duration = 8000) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), duration);
  };

  // Show wallet error if any
  useEffect(() => {
    if (walletError) showStatus(`❌ ${walletError}`);
  }, [walletError]);

  const handleRegister = async (addr) => {
    showStatus("Registering contract...");
    const hash = await registerContract(addr);
    showStatus(`✅ Registered! tx: ${hash.slice(0, 18)}...`);
    return hash;
  };

  const handleTrigger = async (addr) => {
    showStatus(`🔄 Triggering monitor for ${addr.slice(0, 12)}...`);
    const hash = await triggerMonitor(addr);
    showStatus(`✅ Agent request sent! Waiting for consensus (~1-3 min)...`, 12000);
    return hash;
  };

  const handleClear = async (addr) => {
    showStatus("Clearing flag...");
    const hash = await clearFlag(addr);
    showStatus("✅ Flag cleared.");
    return hash;
  };

  const s = {
    main: {
      maxWidth: "1100px",
      margin:   "0 auto",
      padding:  "32px 24px",
    },
    section: {
      background:   "var(--bg-card)",
      border:       "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding:      "24px",
      marginBottom: "24px",
    },
    sectionTitle: {
      fontFamily:    "JetBrains Mono",
      fontSize:      "11px",
      color:         "var(--color-muted)",
      letterSpacing: "2px",
      textTransform: "uppercase",
      marginBottom:  "16px",
      display:       "flex",
      justifyContent:"space-between",
      alignItems:    "center",
    },
    hero: {
      textAlign: "center",
      padding:   "60px 24px",
    },
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Header address={address} isConnected={isConnected} onConnect={connect} />

      {/* Status Banner */}
      {statusMsg && (
        <div className="slide-in" style={{
          background:    "rgba(124,111,255,0.12)",
          borderBottom:  "1px solid rgba(124,111,255,0.3)",
          padding:       "10px 32px",
          fontFamily:    "JetBrains Mono",
          fontSize:      "13px",
          color:         "var(--color-agent)",
        }}>
          {statusMsg}
        </div>
      )}

      <main style={s.main}>

        {/* NOT CONNECTED — Hero */}
        {!isConnected && (
          <div style={s.hero}>
            <div style={{
              fontSize:   "56px",
              marginBottom:"16px",
            }}>
              🔴
            </div>
            <h1 style={{
              fontFamily: "JetBrains Mono",
              fontSize:   "clamp(24px, 5vw, 42px)",
              fontWeight: 700,
              color:      "var(--color-text)",
              marginBottom:"12px",
            }}>
              SomniaWatch
            </h1>
            <p style={{
              fontSize:    "16px",
              color:       "var(--color-muted)",
              maxWidth:    "540px",
              margin:      "0 auto 12px",
              lineHeight:  1.7,
            }}>
              The first autonomous smart contract guardian on Somnia Agentic L1.
            </p>
            <p style={{
              fontFamily:  "JetBrains Mono",
              fontSize:    "14px",
              color:       "var(--color-agent)",
              marginBottom:"32px",
            }}>
              Watch. Reason. Act. No humans required.
            </p>
            <button
              onClick={connect}
              style={{
                background:   "var(--color-agent)",
                color:        "white",
                border:       "none",
                borderRadius: "10px",
                padding:      "14px 32px",
                fontSize:     "16px",
                fontWeight:   700,
                cursor:       "pointer",
                marginBottom: "48px",
              }}
            >
              Connect Wallet to Start
            </button>
          </div>
        )}

        {/* CONNECTED — Dashboard */}
        {isConnected && (
          <>
            <StatsBar
              contracts={contracts}
              totalAudits={totalAudits}
              contractBalance={contractBalance}
              cycleCost={cycleCost}
            />

            <RegisterPanel
              onRegister={handleRegister}
              isConnected={isConnected}
            />

            {/* Contract Grid */}
            <div style={s.section}>
              <div style={s.sectionTitle}>
                <span>Monitored Contracts ({contracts.length})</span>
                <button
                  onClick={refresh}
                  style={{
                    background:   "transparent",
                    border:       "1px solid var(--border)",
                    color:        "var(--color-muted)",
                    borderRadius: "6px",
                    padding:      "4px 10px",
                    cursor:       "pointer",
                    fontSize:     "11px",
                    fontFamily:   "JetBrains Mono",
                  }}
                >
                  ↻ Refresh
                </button>
              </div>

              {isLoading && contracts.length === 0 && (
                <div style={{ color: "var(--color-muted)", fontFamily: "JetBrains Mono", fontSize: "13px" }}>
                  Loading...
                </div>
              )}

              {!isLoading && contracts.length === 0 && (
                <div style={{ color: "var(--color-muted)", fontFamily: "JetBrains Mono", fontSize: "13px", padding: "16px 0" }}>
                  No contracts registered yet. Use the form above to register your first contract.
                </div>
              )}

              {contracts.map((c) => (
                <ContractCard
                  key={c.address}
                  profile={c}
                  onTrigger={handleTrigger}
                  onClear={handleClear}
                />
              ))}
            </div>

            <AuditFeed contracts={contracts} totalAudits={totalAudits} />
          </>
        )}

        {/* Always visible */}
        <AgentFlowDiagram />

        {/* Footer */}
        <div style={{
          textAlign:  "center",
          padding:    "24px 0",
          fontFamily: "JetBrains Mono",
          fontSize:   "11px",
          color:      "var(--color-muted)",
          borderTop:  "1px solid var(--border)",
        }}>
          SomniaWatch by{" "}
          <a href="https://x.com/GopichandAI" target="_blank" rel="noreferrer"
             style={{ color: "var(--color-agent)" }}>
            Gopichand Challa
          </a>
          {" "}|{" "}
          <a href="https://github.com/gopichandchalla16/somniawatch"
             target="_blank" rel="noreferrer"
             style={{ color: "var(--color-agent)" }}>
            GitHub
          </a>
          {" "}|{" "}
          Somnia Agentathon 2026 | Built on Somnia Agentic L1
          {SOMNIAWATCH_ADDRESS && (
            <span> | Contract: {SOMNIAWATCH_ADDRESS.slice(0, 10)}...</span>
          )}
        </div>
      </main>
    </div>
  );
}
