import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import SomniaWatchABI from "../abi/SomniaWatch.json";
import { SOMNIAWATCH_ADDRESS } from "../constants";

export function useSomniaWatch(signer) {
  const [contracts,        setContracts]        = useState([]);
  const [totalAudits,      setTotalAudits]      = useState(0);
  const [contractBalance,  setContractBalance]  = useState("0");
  const [cycleCost,        setCycleCost]        = useState("0");
  const [isLoading,        setIsLoading]        = useState(false);
  const [error,            setError]            = useState(null);

  const watchRef = useRef(null);

  // ── Build contract instance ─────────────────────────────────────────
  useEffect(() => {
    if (!signer || !SOMNIAWATCH_ADDRESS) return;

    const contract = new ethers.Contract(SOMNIAWATCH_ADDRESS, SomniaWatchABI, signer);
    watchRef.current = contract;

    // Load initial data
    loadData(contract);

    // Live event listeners → refresh on any state change
    contract.on("ContractRegistered", () => loadData(contract));
    contract.on("RiskClassified",     () => loadData(contract));
    contract.on("ContractFlagged",    () => loadData(contract));
    contract.on("ContractCleared",    () => loadData(contract));
    contract.on("MonitorTriggered",   () => loadData(contract));
    contract.on("Funded",             () => loadData(contract));

    return () => {
      contract.removeAllListeners();
    };
  }, [signer]);

  // ── Load all on-chain data ──────────────────────────────────────────
  const loadData = useCallback(async (contract) => {
    if (!contract) return;
    setIsLoading(true);
    setError(null);

    try {
      const [addresses, total, balance, cost] = await Promise.all([
        contract.getAllRegistered(),
        contract.totalAuditsCompleted(),
        contract.contractBalance(),
        contract.depositForFullCycle(),
      ]);

      setTotalAudits(Number(total));
      setContractBalance(ethers.formatEther(balance));
      setCycleCost(ethers.formatEther(cost));

      // Fetch profile + audit history for each registered contract
      const profiles = await Promise.all(
        addresses.map(async (addr) => {
          const [profile, history] = await Promise.all([
            contract.registry(addr),
            contract.getAuditHistory(addr),
          ]);
          return {
            address:      addr,
            owner:        profile.owner,
            isRegistered: profile.isRegistered,
            isFlagged:    profile.isFlagged,
            riskScore:    Number(profile.riskScore),
            lastChecked:  Number(profile.lastChecked),
            totalChecks:  Number(profile.totalChecks),
            lastRiskType: profile.lastRiskType,
            history: history.map((h) => ({
              riskLevel:    Number(h.riskLevel),
              riskType:     h.riskType,
              reasoning:    h.reasoning,
              timestamp:    Number(h.timestamp),
              receiptId:    h.receiptId.toString(),
              autoActioned: h.autoActioned,
            })),
          };
        })
      );

      setContracts(profiles);
    } catch (err) {
      setError(err.message || "Failed to load contract data");
      console.error("loadData error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (watchRef.current) loadData(watchRef.current);
  }, [loadData]);

  // ── Write functions ─────────────────────────────────────────────────

  const registerContract = useCallback(async (target) => {
    if (!watchRef.current) throw new Error("Not connected");
    const tx = await watchRef.current.registerContract(target);
    await tx.wait();
    await loadData(watchRef.current);
    return tx.hash;
  }, [loadData]);

  const triggerMonitor = useCallback(async (target) => {
    if (!watchRef.current) throw new Error("Not connected");
    const deposit = await watchRef.current.depositForJson();
    const tx = await watchRef.current.triggerMonitor(target, {
      value:    deposit,
      gasLimit: 600_000,
    });
    await tx.wait();
    return tx.hash;
  }, []);

  const clearFlag = useCallback(async (target) => {
    if (!watchRef.current) throw new Error("Not connected");
    const tx = await watchRef.current.clearFlag(target);
    await tx.wait();
    await loadData(watchRef.current);
    return tx.hash;
  }, [loadData]);

  const fund = useCallback(async (amountEth) => {
    if (!watchRef.current) throw new Error("Not connected");
    const tx = await watchRef.current.fund({
      value: ethers.parseEther(amountEth),
    });
    await tx.wait();
    await loadData(watchRef.current);
    return tx.hash;
  }, [loadData]);

  return {
    contracts,
    totalAudits,
    contractBalance,
    cycleCost,
    isLoading,
    error,
    registerContract,
    triggerMonitor,
    clearFlag,
    fund,
    refresh,
  };
}
