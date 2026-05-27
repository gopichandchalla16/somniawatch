const Arrow = () => (
  <div style={{
    textAlign:  "center",
    color:      "var(--color-agent)",
    fontSize:   "18px",
    margin:     "4px 0",
    fontFamily: "JetBrains Mono",
  }}>↓</div>
);

const FlowBox = ({ title, subtitle, color = "var(--color-agent)", cost }) => (
  <div style={{
    background:   "var(--bg-input)",
    border:       `1px solid ${color}40`,
    borderRadius: "8px",
    padding:      "12px 16px",
    position:     "relative",
  }}>
    <div style={{
      fontFamily: "JetBrains Mono",
      fontWeight: 700,
      fontSize:   "13px",
      color:      color,
    }}>
      {title}
    </div>
    {subtitle && (
      <div style={{
        fontFamily: "JetBrains Mono",
        fontSize:   "11px",
        color:      "var(--color-muted)",
        marginTop:  "3px",
      }}>
        {subtitle}
      </div>
    )}
    {cost && (
      <div style={{
        position:   "absolute",
        top:        "8px",
        right:      "12px",
        fontFamily: "JetBrains Mono",
        fontSize:   "10px",
        color:      "var(--color-warn)",
        background: "rgba(255,215,0,0.1)",
        border:     "1px solid rgba(255,215,0,0.3)",
        borderRadius:"4px",
        padding:    "2px 6px",
      }}>
        {cost}
      </div>
    )}
  </div>
);

const ValidatorRow = ({ count = 3 }) => (
  <div style={{
    display:        "flex",
    justifyContent: "center",
    gap:            "8px",
    margin:         "4px 0",
  }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{
        width:        "28px",
        height:       "28px",
        borderRadius: "50%",
        background:   "rgba(124,111,255,0.15)",
        border:       "1px solid rgba(124,111,255,0.4)",
        display:      "flex",
        alignItems:   "center",
        justifyContent:"center",
        fontSize:     "12px",
      }}>
        🔷
      </div>
    ))}
    <span style={{
      fontFamily: "JetBrains Mono",
      fontSize:   "10px",
      color:      "var(--color-muted)",
      alignSelf:  "center",
      marginLeft: "4px",
    }}>
      3 validators → consensus
    </span>
  </div>
);

export default function AgentFlowDiagram() {
  return (
    <div style={{
      background:   "var(--bg-card)",
      border:       "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding:      "24px",
      marginBottom: "24px",
    }}>
      <div style={{
        fontFamily:    "JetBrains Mono",
        fontSize:      "11px",
        color:         "var(--color-muted)",
        letterSpacing: "2px",
        textTransform: "uppercase",
        marginBottom:  "20px",
      }}>
        How It Works — Two-Agent Pipeline
      </div>

      <div style={{ maxWidth: "560px", margin: "0 auto" }}>
        <FlowBox
          title="keeper.js / Auto-Trigger"
          subtitle="Calls triggerMonitor() every 5 minutes — no human needed"
          color="var(--color-safe)"
        />
        <Arrow />
        <FlowBox
          title="Somnia JSON API Agent  #13174292974160097713"
          subtitle="fetchString(explorerApiUrl, 'items') — fetches recent transactions"
          cost="0.12 SOMI"
        />
        <ValidatorRow />
        <Arrow />
        <FlowBox
          title="handleTxDataResponse()"
          subtitle="Receives tx data on-chain → immediately chains to LLM agent"
          color="var(--color-text)"
        />
        <Arrow />
        <FlowBox
          title="Somnia LLM Agent  #12847293847561029384  (Qwen3-30B)"
          subtitle='inferString(prompt, system, false, ["safe","suspicious","critical"]) — allowedValues forces clean output'
          cost="0.24 SOMI"
        />
        <ValidatorRow />
        <Arrow />
        <FlowBox
          title="handleClassificationResponse()"
          subtitle="No JSON parsing needed — allowedValues guarantees exact string output"
          color="var(--color-text)"
        />
        <Arrow />
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
        }}>
          <FlowBox
            title="AuditRecord stored"
            subtitle="receiptId = requestId = immutable on-chain proof of AI decision"
            color="var(--color-safe)"
          />
          <FlowBox
            title="Auto-flag if CRITICAL"
            subtitle="Contract flagged autonomously — zero human involvement"
            color="var(--color-crit)"
          />
        </div>
      </div>

      {/* Cost summary */}
      <div style={{
        marginTop:    "20px",
        padding:      "12px 16px",
        background:   "var(--bg-input)",
        borderRadius: "8px",
        display:      "flex",
        justifyContent:"space-between",
        flexWrap:     "wrap",
        gap:          "8px",
      }}>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: "12px", color: "var(--color-muted)" }}>
          JSON API: <span style={{ color: "var(--color-warn)" }}>0.12 SOMI</span>
          {"  +  "}
          LLM: <span style={{ color: "var(--color-warn)" }}>0.24 SOMI</span>
          {"  =  "}
          <span style={{ color: "var(--color-text)", fontWeight: 700 }}>0.36 SOMI / cycle</span>
        </span>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: "12px", color: "var(--color-safe)" }}>
          ✓ Every decision consensus-validated  •  ✓ Every receipt on-chain
        </span>
      </div>
    </div>
  );
}
