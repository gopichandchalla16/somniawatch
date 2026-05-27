export default function StatsBar({ contracts, totalAudits, contractBalance, cycleCost }) {
  const flagged = contracts.filter((c) => c.isFlagged).length;

  const stats = [
    { label: "Monitored Contracts", value: contracts.length,                     color: "var(--color-agent)" },
    { label: "Total Audits",        value: totalAudits,                           color: "var(--color-agent)" },
    { label: "Flagged Contracts",   value: flagged,                               color: flagged > 0 ? "var(--color-crit)" : "var(--color-safe)" },
    { label: "Guardian Balance",    value: `${parseFloat(contractBalance).toFixed(3)} STT`, color: "var(--color-safe)" },
  ];

  return (
    <div style={{
      display:             "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap:                 "12px",
      marginBottom:        "24px",
    }}>
      {stats.map((s) => (
        <div key={s.label} style={{
          background:   "var(--bg-card)",
          border:       "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding:      "16px 20px",
          textAlign:    "center",
        }}>
          <div style={{
            fontFamily: "JetBrains Mono",
            fontSize:   "24px",
            fontWeight: 700,
            color:      s.color,
          }}>
            {s.value}
          </div>
          <div style={{
            fontSize:   "11px",
            color:      "var(--color-muted)",
            marginTop:  "4px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
