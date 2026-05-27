import { RISK_COLORS, RISK_BG, RISK_ICONS, RISK_LABELS, RISK_BORDER, TIME_AGO, EXPLORER_TX } from "../constants";

export default function AuditFeed({ contracts, totalAudits }) {
  // Flatten all audits across all contracts, sort by timestamp desc
  const allAudits = contracts
    .flatMap((c) => c.history.map((h) => ({ ...h, contractAddr: c.address })))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);

  return (
    <div style={{
      background:   "var(--bg-card)",
      border:       "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding:      "24px",
      marginBottom: "24px",
    }}>
      <div style={{
        display:       "flex",
        justifyContent:"space-between",
        alignItems:    "center",
        marginBottom:  "16px",
      }}>
        <div style={{
          fontFamily:    "JetBrains Mono",
          fontSize:      "11px",
          color:         "var(--color-muted)",
          letterSpacing: "2px",
          textTransform: "uppercase",
        }}>
          Audit Log
        </div>
        <div style={{
          fontFamily: "JetBrains Mono",
          fontSize:   "12px",
          color:      "var(--color-agent)",
        }}>
          {totalAudits} total on-chain audits
        </div>
      </div>

      {allAudits.length === 0 ? (
        <div style={{
          color:      "var(--color-muted)",
          fontFamily: "JetBrains Mono",
          fontSize:   "13px",
          padding:    "24px 0",
          textAlign:  "center",
        }}>
          No audits yet. Register a contract and trigger monitoring.
        </div>
      ) : (
        allAudits.map((h, idx) => (
          <div
            key={idx}
            className="slide-in"
            style={{
              background:   "var(--bg-panel)",
              borderLeft:   `3px solid ${RISK_COLORS[h.riskLevel] || "var(--border)"}`,
              borderRadius: "0 8px 8px 0",
              padding:      "10px 14px",
              marginBottom: "8px",
              display:      "flex",
              gap:          "10px",
              alignItems:   "center",
              flexWrap:     "wrap",
            }}
          >
            <span style={{ fontSize: "16px", flexShrink: 0 }}>{RISK_ICONS[h.riskLevel]}</span>

            <span style={{
              color:      RISK_COLORS[h.riskLevel],
              fontFamily: "JetBrains Mono",
              fontWeight: 700,
              fontSize:   "12px",
              minWidth:   "80px",
            }}>
              {RISK_LABELS[h.riskLevel]}
            </span>

            <span style={{
              fontFamily: "JetBrains Mono",
              fontSize:   "11px",
              color:      "var(--color-muted)",
            }}>
              {h.contractAddr.slice(0, 10)}...
            </span>

            <span style={{
              fontFamily: "JetBrains Mono",
              fontSize:   "11px",
              color:      "var(--color-text)",
              background: "var(--bg-input)",
              borderRadius: "4px",
              padding:    "2px 6px",
            }}>
              {h.riskType}
            </span>

            <span style={{
              fontSize: "12px",
              color:    "var(--color-text)",
              flex:     1,
              minWidth: "120px",
            }}>
              "{h.reasoning.slice(0, 80)}{h.reasoning.length > 80 ? "..." : ""}"
            </span>

            {h.autoActioned && (
              <span style={{
                background:   "rgba(255,68,68,0.2)",
                color:        "var(--color-crit)",
                border:       "1px solid rgba(255,68,68,0.4)",
                borderRadius: "4px",
                padding:      "2px 6px",
                fontSize:     "10px",
                fontWeight:   700,
                fontFamily:   "JetBrains Mono",
                whiteSpace:   "nowrap",
              }}>
                AUTO-FLAGGED
              </span>
            )}

            <a
              href={EXPLORER_TX(h.receiptId)}
              target="_blank"
              rel="noreferrer"
              style={{
                color:      "var(--color-agent)",
                fontSize:   "11px",
                whiteSpace: "nowrap",
                fontFamily: "JetBrains Mono",
              }}
            >
              on-chain receipt ↗
            </a>

            <span style={{
              fontFamily: "JetBrains Mono",
              fontSize:   "10px",
              color:      "var(--color-muted)",
              whiteSpace: "nowrap",
            }}>
              {TIME_AGO(h.timestamp)}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
