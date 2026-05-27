import { SHORT_ADDR, SOMNIA_CHAIN_ID_HEX } from "../constants";

export default function Header({ address, isConnected, onConnect }) {
  return (
    <header style={{
      background:    "var(--bg-card)",
      borderBottom:  "1px solid var(--border)",
      padding:       "0 32px",
      display:       "flex",
      alignItems:    "center",
      justifyContent:"space-between",
      height:        "64px",
      position:      "sticky",
      top:           0,
      zIndex:        100,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width:     "10px",
          height:    "10px",
          borderRadius: "50%",
          background:"var(--color-crit)",
          boxShadow: "0 0 8px var(--color-crit)",
          animation: "pulse 2s infinite",
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: "JetBrains Mono",
          fontWeight: 700,
          fontSize:   "18px",
          color:      "var(--color-text)",
        }}>
          SomniaWatch
        </span>
        <span style={{
          fontSize:  "12px",
          color:     "var(--color-muted)",
          display:   "none",
          "@media (min-width: 600px)": { display: "inline" },
        }}>
          Autonomous Contract Guardian
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{
          background:  "rgba(124,111,255,0.15)",
          color:       "var(--color-agent)",
          border:      "1px solid rgba(124,111,255,0.4)",
          borderRadius:"6px",
          padding:     "4px 10px",
          fontFamily:  "JetBrains Mono",
          fontSize:    "11px",
        }}>
          Somnia Testnet
        </span>

        {isConnected && address ? (
          <span style={{
            fontFamily: "JetBrains Mono",
            fontSize:   "12px",
            color:      "var(--color-muted)",
          }}>
            {SHORT_ADDR(address)}
          </span>
        ) : (
          <button
            onClick={onConnect}
            style={{
              background:   "var(--color-agent)",
              color:        "white",
              border:       "none",
              borderRadius: "8px",
              padding:      "8px 16px",
              cursor:       "pointer",
              fontWeight:   600,
              fontSize:     "13px",
              fontFamily:   "JetBrains Mono",
            }}
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
