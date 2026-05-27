import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { SOMNIA_NETWORK_CONFIG } from "../constants";

export function useWallet() {
  const [address,     setAddress]     = useState(null);
  const [provider,    setProvider]    = useState(null);
  const [signer,      setSigner]      = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error,       setError]       = useState(null);

  const connect = useCallback(async () => {
    setError(null);
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found. Install MetaMask to use SomniaWatch.");
      }

      // Request accounts
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Switch to Somnia Testnet
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SOMNIA_NETWORK_CONFIG.chainId }],
        });
      } catch (switchErr) {
        // Chain not added yet — add it
        if (switchErr.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [SOMNIA_NETWORK_CONFIG],
          });
        } else {
          throw switchErr;
        }
      }

      // Create provider and signer (ethers v6 — getSigner is async)
      const _provider = new ethers.BrowserProvider(window.ethereum);
      const _signer   = await _provider.getSigner();
      const _address  = await _signer.getAddress();

      setProvider(_provider);
      setSigner(_signer);
      setAddress(_address);
      setIsConnected(true);

      // Listen for account changes
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          setAddress(null);
          setSigner(null);
          setIsConnected(false);
        } else {
          window.location.reload();
        }
      });

      // Listen for chain changes
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });

    } catch (err) {
      setError(err.message || "Connection failed");
      console.error("Wallet connect error:", err);
    }
  }, []);

  return { address, provider, signer, isConnected, connect, error };
}
