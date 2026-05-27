import { useState } from "react";
import { ethers } from "ethers";
import { EXPLORER_ADDR } from "../constants";

export default function RegisterPanel({ onRegister, isConnected }) {
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState(null); // {type:"success"|"error", msg, hash}
  const [invalid, setInvalid] = useState(false);

  const handleBlur = () => {
    setInvalid(input.length > 0 && !ethers.isAddress(input));
  };

  const handleRegister = async () => {
    if (!ethers.isAddress(input)) { setInvalid(true); return; }
    setLoading(true);
    setStatus(null);
    try {
      const hash = await onRegister(input);
      setStatus({ type: "success", msg: "Contract registered!", hash });
      setInput("");
      setInvalid(false);
    } catch (err) {
      setStatus({ type: "error", msg: err.reason || err.message || "Transaction failed" });
    } finally {
      setLoading(false);
    }
  };

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
        marginBottom:  "14px",
      }}>
        Register Contract for Monitoring
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <input
          style={{
            flex:         1,
            background:   "var(--bg-input)",
            border:       `1px solid ${invalid ? "var(--color-crit)" : "var(--border)"}`,
            color:        "var(--color-text)",
            borderRadius: "8px",
            padding:      "12px 16px",
            fontFamily:   "JetBrains Mono",
            fontSize:     "13px",
          }}
          placeholder="0x contract address to monitor..."
          value={input}
          onChange={(e) => { setInput(e.target.value); setInvalid(false); }}
          onBlur={handleBlur}
          disabled={!isConnected || loading}
        />
        <button
          onClick={handleRegister}
          disabled={!isConnected || loading || !input}
          style={{
            background:   loading ? "rgba(124,111,255,0.5)" : "var(--color-agent)",
            color:        "white",
            border:       "none",
            borderRadius: "8px",
            padding:      "12px 24px",
            cursor:       loading ? "wait" : "pointer",
            fontWeight:   600,
            fontSize:     "14px",
            whiteSpace:   "nowrap",
            display:      "flex",
            alignItems:   "center",
            gap:          "8px",
          }}
        >
          {loading && (
            <span style={{
              width:  "12px",
              height: "12px",
              border: "2px solid white",
              borderTop: "2px solid transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              display: "inline-block",
            }} />
          )}
          {loading ? "Registering..." : "Register →"}
        </button>
      </div>

      {invalid && (
        <div style={{ color: "var(--color-crit)", fontSize: "12px", marginTop: "6px", fontFamily: "JetBrains Mono" }}>
          Invalid Ethereum address
        </div>
      )}

      {status && (
        <div style={{
          marginTop:    "10px",
          padding:      "10px 14px",
          borderRadius: "8px",
          background:   status.type === "success" ? "rgba(0,255,136,0.08)" : "rgba(255,68,68,0.08)",
          border:       `1px solid ${status.type === "success" ? "rgba(0,255,136,0.3)" : "rgba(255,68,68,0.3)"}`,
          fontSize:     "13px",
          color:        status.type === "success" ? "var(--color-safe)" : "var(--color-crit)",
          fontFamily:   "JetBrains Mono",
        }}>
          {status.type === "success" ? "✅" : "❌"} {status.msg}
          {status.hash && (
            <a
              href={EXPLORER_ADDR(input || "")}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--color-agent)", marginLeft: "8px", fontSize: "11px" }}
            >
              View on explorer ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
