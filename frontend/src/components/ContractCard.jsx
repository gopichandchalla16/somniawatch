import { useState } from "react";
import { RISK_COLORS, RISK_BG, RISK_ICONS, RISK_LABELS, RISK_BORDER, TIME_AGO, EXPLORER_TX, EXPLORER_ADDR } from "../constants";

export default function ContractCard({ profile, onTrigger, onClear }) {
  const [triggering, setTriggering] = useState(false);
  const [clearing,   setClearing]   = useState(false);
  const [txHash,     setTxHash]     = useState(null);
  const [error,      setError]      = useState(null);

  const risk = profile.isFlagged ? 2
             : profile.riskScore >= 60 ? 1
             : profile.riskScore > 0   ? 0
             : null; // unscanned

  const handleTrigger = async () => {
    setTriggering(true);
    setError(null);
    setTxHash(null);
    try {
      const hash = await onTrigger(profile.address);
      setTxHash(hash);
    } catch (err) {
      setError(err.reason || err.message || "Transaction failed");
    } finally {
      setTriggering(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await onClear(profile.address);
    } catch (err) {
      setError(err.reason || err.message || "Clear failed");
    } finally {
      setClearing(false);
    }
  };

  const lastThreeAudits = profile.history.slice(-3).reverse();

  return (
    <div style={{
      background:   profile.isFlagged ? "rgba(255,68,68,0.04)" : "var(--bg-card)",
      border:       `1px solid ${profile.isFlagged ? "var(--color-crit)" : "var(--border)"}`,
      borderRadius: "var(--radius)",
      padding:      "20px",
      marginBottom: "16px",
      animation:    "slideIn 0.2s ease-out",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Address */}
          <a
            href={EXPLORER_ADDR(profile.address)}
            target="_blank"
            rel="noreferrer"
            style={{
              fontFamily:  "JetBrains Mono",
              fontSize:    "13px",
              color:       "var(--color-text)",
              textDecoration: "none",
              wordBreak:   "break-all",
            }}
          >
            {profile.address}
          </a>

          {/* Badges row */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px", alignItems: "center" }}>
            {risk !== null ? (
              <span style={{
                background:   RISK_BG[risk],
                color:        RISK_COLORS[risk],
                border:       `1px solid ${RISK_BORDER[risk]}`,
                borderRadius: "6px",
                padding:      "3px 10px",
                fontFamily:   "JetBrains Mono",
                fontSize:     "11px",
                fontWeight:   700,
              }}>
                {RISK_ICONS[risk]} {RISK_LABELS[risk]}
              </span>
            ) : (
              <span style={{
                background:   "rgba(107,107,144,0.15)",
                color:        "var(--color-muted)",
                border:       "1px solid rgba(107,107,144,0.3)",
                borderRadius: "6px",
                padding:      "3px 10px",
                fontFamily:   "JetBrains Mono",
                fontSize:     "11px",
                fontWeight:   700,
              }}>
                UNSCANNED
              </span>
            )}

            {profile.isFlagged && (
              <span style={{
                background:   "rgba(255,68,68,0.2)",
                color:        "var(--color-crit)",
                border:       "1px solid rgba(255,68,68,0.5)",
                borderRadius: "6px",
                padding:      "3px 8px",
                fontFamily:   "JetBrains Mono",
                fontSize:     "10px",
                fontWeight:   700,
                letterSpacing:"0.5px",
              }}>
                AUTO-FLAGGED
              </span>
            )}

            <span style={{ fontFamily: "JetBrains Mono", fontSize: "11px", color: "var(--color-muted)" }}>
              {profile.lastRiskType}
            </span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: "11px", color: "var(--color-muted)" }}>
              {profile.totalChecks} checks
            </span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: "11px", color: "var(--color-muted)" }}>
              last: {TIME_AGO(profile.lastChecked)}
            </span>
          </div>

          {/* Risk score bar */}
          {profile.riskScore > 0 && (
            <div style={{ marginTop: "10px" }}>
              <div style={{
                height:       "4px",
                background:   "var(--bg-input)",
                borderRadius: "2px",
                overflow:     "hidden",
              }}>
                <div style={{
                  width:      `${profile.riskScore}%`,
                  height:     "100%",
                  background: profile.riskScore >= 80 ? "var(--color-crit)"
                            : profile.riskScore >= 50 ? "var(--color-warn)"
                            : "var(--color-safe)",
                  transition: "width 0.5s ease",
                  borderRadius: "2px",
                }} />
              </div>
              <div style={{ fontSize: "10px", color: "var(--color-muted)", fontFamily: "JetBrains Mono", marginTop: "2px" }}>
                Risk score: {profile.riskScore}/100
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px", marginLeft: "12px", flexShrink: 0 }}>
          <button
            onClick={handleTrigger}
            disabled={triggering}
            style={{
              background:   triggering ? "rgba(124,111,255,0.3)" : "var(--bg-input)",
              color:        "var(--color-agent)",
              border:       "1px solid rgba(124,111,255,0.4)",
              borderRadius: "8px",
              padding:      "8px 14px",
              cursor:       triggering ? "wait" : "pointer",
              fontSize:     "12px",
              fontWeight:   600,
              display:      "flex",
              alignItems:   "center",
              gap:          "6px",
            }}
          >
            {triggering ? (
              <span style={{
                width: "10px", height: "10px",
                border: "2px solid var(--color-agent)", borderTop: "2px solid transparent",
                borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block",
              }} />
            ) : "▶"}
            {triggering ? "Checking..." : "Trigger Check"}
          </button>

          {profile.isFlagged && (
            <button
              onClick={handleClear}
              disabled={clearing}
              style={{
                background:   "transparent",
                color:        "var(--color-muted)",
                border:       "1px solid var(--border)",
                borderRadius: "8px",
                padding:      "8px 14px",
                cursor:       "pointer",
                fontSize:     "12px",
              }}
            >
              {clearing ? "Clearing..." : "Clear Flag"}
            </button>
          )}
        </div>
      </div>

      {/* Tx hash / error feedback */}
      {txHash && (
        <div style={{ fontSize: "11px", color: "var(--color-safe)", fontFamily: "JetBrains Mono", marginBottom: "8px" }}>
          ✓ Triggered —{" "}
          <a href={EXPLORER_TX(txHash)} target="_blank" rel="noreferrer"
             style={{ color: "var(--color-agent)" }}>
            view tx ↗
          </a>
          {" "}— waiting for agent consensus (~1-3 min)
        </div>
      )}
      {error && (
        <div style={{ fontSize: "11px", color: "var(--color-crit)", fontFamily: "JetBrains Mono", marginBottom: "8px" }}>
          ❌ {error}
        </div>
      )}

      {/* Mini audit history */}
      {lastThreeAudits.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "10px", marginTop: "4px" }}>
          <div style={{ fontSize: "10px", color: "var(--color-muted)", fontFamily: "JetBrains Mono", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Recent Audits
          </div>
          {lastThreeAudits.map((h, i) => (
            <div key={i} style={{
              display:    "flex",
              gap:        "8px",
              alignItems: "center",
              marginBottom: "4px",
              fontSize:   "11px",
              flexWrap:   "wrap",
            }}>
              <span>{RISK_ICONS[h.riskLevel]}</span>
              <span style={{ color: RISK_COLORS[h.riskLevel], fontWeight: 700, fontFamily: "JetBrains Mono" }}>
                {RISK_LABELS[h.riskLevel]}
              </span>
              <span style={{ color: "var(--color-muted)", fontFamily: "JetBrains Mono" }}>{h.riskType}</span>
              <span style={{ color: "var(--color-text)", flex: 1 }}>"{h.reasoning.slice(0, 60)}{h.reasoning.length > 60 ? "..." : ""}"</span>
              <a href={EXPLORER_TX(h.receiptId)} target="_blank" rel="noreferrer"
                 style={{ color: "var(--color-agent)", fontSize: "10px", whiteSpace: "nowrap" }}>
                receipt ↗
              </a>
              <span style={{ color: "var(--color-muted)", fontFamily: "JetBrains Mono" }}>{TIME_AGO(h.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
