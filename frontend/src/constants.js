export const SOMNIAWATCH_ADDRESS  = "0xd1e7EAC1aD0ad24eb444CbC9e9A143c570373ED0";
export const MOCK_VAULT_ADDRESS   = "0xeB282f43b4015b7a71cfbd2Bd52f69146030701E";
export const CERTIFICATE_ADDRESS  = import.meta.env.VITE_CERTIFICATE_ADDRESS || "";

export const SOMNIA_CHAIN_ID      = 50312;
export const SOMNIA_CHAIN_ID_HEX  = "0xC468";
export const SOMNIA_RPC           = "https://dream-rpc.somnia.network";

// Clear stale localStorage from old deployments
const CURRENT_DEPLOYMENT = "0xd1e7EAC1aD0ad24eb444CbC9e9A143c570373ED0";
if (typeof window !== 'undefined') {
  const storedDeployment = localStorage.getItem('sw_deployment');
  if (storedDeployment !== CURRENT_DEPLOYMENT) {
    Object.keys(localStorage)
      .filter(k => k.startsWith('sw_'))
      .forEach(k => localStorage.removeItem(k));
    localStorage.setItem('sw_deployment', CURRENT_DEPLOYMENT);
  }
}

export const SOMNIA_NETWORK_CONFIG = {
  chainId:           "0xC468",
  chainName:         "Somnia Testnet",
  rpcUrls:           ["https://dream-rpc.somnia.network"],
  nativeCurrency:    { name: "Somnia", symbol: "STT", decimals: 18 },
  blockExplorerUrls: ["https://shannon-explorer.somnia.network"],
};

export const RISK_LABELS = { 0: "SAFE",      1: "SUSPICIOUS", 2: "CRITICAL"  };
export const RISK_COLORS = { 0: "#00FF88",   1: "#FFD700",    2: "#FF4444"   };
export const RISK_BG     = { 0: "#00FF8815", 1: "#FFD70015",  2: "#FF444415" };
export const RISK_ICONS  = { 0: "✅",        1: "⚠️",         2: "🔴"       };
export const RISK_BORDER = { 0: "#00FF8840", 1: "#FFD70040",  2: "#FF444440" };

export const EXPLORER_BASE = "https://shannon-explorer.somnia.network";
export const EXPLORER_TX   = (hash) => `${EXPLORER_BASE}/tx/${hash}`;
export const EXPLORER_ADDR = (addr) => `${EXPLORER_BASE}/address/${addr}`;

export const SHORT_ADDR = (addr) =>
  addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : "";

export const TIME_AGO = (timestamp) => {
  if (!timestamp || timestamp === 0) return "never";
  const secs = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (secs < 5)     return "just now";
  if (secs < 60)    return `${secs}s ago`;
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
};

export const FORMAT_STT = (wei) => {
  if (!wei && wei !== 0n) return "0.0000";
  try {
    const val = parseFloat(
      (BigInt(wei.toString()) * 10000n / BigInt(1e18)).toString()
    ) / 10000;
    return val.toFixed(4);
  } catch {
    return "0.0000";
  }
};
