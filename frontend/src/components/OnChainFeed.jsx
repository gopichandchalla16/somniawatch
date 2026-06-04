import React, { useEffect, useState, useRef } from 'react';
import { ethers } from 'ethers';

const EXPLORER = 'https://shannon-explorer.somnia.network';
const RPC = 'https://dream-rpc.somnia.network';

const WATCH_ABI = [
  'event RiskClassified(address indexed target, uint8 riskLevel, string riskType, uint256 receiptId)',
  'event ContractFlagged(address indexed target, string riskType, uint256 receiptId)',
  'event ContractCleared(address indexed target)',
  'event SphinxOverride(address indexed target, uint256 score, uint256 receiptId)',
  'event SphinxConfirmed(address indexed target, uint256 score, uint256 receiptId)',
  'event MonitorTriggered(address indexed target, uint256 requestId, uint256 deposit)',
  'event TxDataReceived(address indexed target, uint256 jsonReqId, uint256 parseReqId)',
  'event ParseDataReceived(address indexed target, uint256 parseReqId, uint256 llmReqId)',
];

const LEVEL_LABELS = ['SAFE', 'SUSPICIOUS', 'CRITICAL'];
const LEVEL_COLORS = ['#00ff88', '#ffaa00', '#ff2244'];
const LEVEL_BG = ['rgba(0,255,136,0.08)', 'rgba(255,170,0,0.08)', 'rgba(255,34,68,0.08)'];

function shortAddr(addr) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function timeAgo(ts) {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function OnChainFeed({ watchAddress }) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [pipeline, setPipeline] = useState({}); // target => stage
  const contractRef = useRef(null);
  const providerRef = useRef(null);

  useEffect(() => {
    if (!watchAddress) return;
    let isMounted = true;

    async function init() {
      try {
        const provider = new ethers.JsonRpcProvider(RPC);
        providerRef.current = provider;
        const contract = new ethers.Contract(watchAddress, WATCH_ABI, provider);
        contractRef.current = contract;

        // Load last 200 blocks of history
        const block = await provider.getBlockNumber();
        const fromBlock = Math.max(0, block - 200);

        const pastEvents = [];

        const classifiedFilter = contract.filters.RiskClassified();
        const classified = await contract.queryFilter(classifiedFilter, fromBlock);
        classified.forEach(e => {
          pastEvents.push({
            id: e.transactionHash + e.logIndex,
            type: 'RiskClassified',
            target: e.args.target,
            riskLevel: Number(e.args.riskLevel),
            riskType: e.args.riskType,
            receiptId: e.args.receiptId.toString(),
            timestamp: 0,
            txHash: e.transactionHash,
          });
        });

        const flaggedFilter = contract.filters.ContractFlagged();
        const flagged = await contract.queryFilter(flaggedFilter, fromBlock);
        flagged.forEach(e => {
          pastEvents.push({
            id: e.transactionHash + e.logIndex + '_flag',
            type: 'ContractFlagged',
            target: e.args.target,
            riskType: e.args.riskType,
            receiptId: e.args.receiptId.toString(),
            timestamp: 0,
            txHash: e.transactionHash,
          });
        });

        const sphinxOvFilter = contract.filters.SphinxOverride();
        const sphinxOv = await contract.queryFilter(sphinxOvFilter, fromBlock);
        sphinxOv.forEach(e => {
          pastEvents.push({
            id: e.transactionHash + e.logIndex + '_so',
            type: 'SphinxOverride',
            target: e.args.target,
            score: Number(e.args.score),
            receiptId: e.args.receiptId.toString(),
            timestamp: 0,
            txHash: e.transactionHash,
          });
        });

        if (isMounted) {
          setEvents(pastEvents.slice(-20).reverse());
          setConnected(true);
        }

        // Live listeners
        contract.on('RiskClassified', (target, riskLevel, riskType, receiptId, event) => {
          if (!isMounted) return;
          setEvents(prev => [{
            id: event.log.transactionHash + event.log.logIndex,
            type: 'RiskClassified',
            target,
            riskLevel: Number(riskLevel),
            riskType,
            receiptId: receiptId.toString(),
            timestamp: Math.floor(Date.now() / 1000),
            txHash: event.log.transactionHash,
          }, ...prev.slice(0, 29)]);
          setPipeline(p => ({ ...p, [target]: 'complete' }));
        });

        contract.on('MonitorTriggered', (target, requestId, deposit, event) => {
          if (!isMounted) return;
          setPipeline(p => ({ ...p, [target]: 'stage1' }));
          setEvents(prev => [{
            id: event.log.transactionHash + '_mt',
            type: 'MonitorTriggered',
            target,
            requestId: requestId.toString(),
            timestamp: Math.floor(Date.now() / 1000),
            txHash: event.log.transactionHash,
          }, ...prev.slice(0, 29)]);
        });

        contract.on('TxDataReceived', (target, jsonReqId, parseReqId, event) => {
          if (!isMounted) return;
          setPipeline(p => ({ ...p, [target]: 'stage2' }));
        });

        contract.on('ParseDataReceived', (target, parseReqId, llmReqId, event) => {
          if (!isMounted) return;
          setPipeline(p => ({ ...p, [target]: 'stage3' }));
        });

        contract.on('SphinxOverride', (target, score, receiptId, event) => {
          if (!isMounted) return;
          setEvents(prev => [{
            id: event.log.transactionHash + '_sphinx',
            type: 'SphinxOverride',
            target,
            score: Number(score),
            receiptId: receiptId.toString(),
            timestamp: Math.floor(Date.now() / 1000),
            txHash: event.log.transactionHash,
          }, ...prev.slice(0, 29)]);
        });

        contract.on('ContractFlagged', (target, riskType, receiptId, event) => {
          if (!isMounted) return;
          setEvents(prev => [{
            id: event.log.transactionHash + '_flagged',
            type: 'ContractFlagged',
            target,
            riskType,
            receiptId: receiptId.toString(),
            timestamp: Math.floor(Date.now() / 1000),
            txHash: event.log.transactionHash,
          }, ...prev.slice(0, 29)]);
        });

      } catch (err) {
        console.warn('OnChainFeed init error:', err.message);
      }
    }

    init();
    return () => {
      isMounted = false;
      if (contractRef.current) contractRef.current.removeAllListeners();
    };
  }, [watchAddress]);

  function renderPipelineStages(target) {
    const stage = pipeline[target];
    const stages = [
      { key: 'stage1', icon: '🔗', label: 'JSON API' },
      { key: 'stage2', icon: '🕷️', label: 'Parse' },
      { key: 'stage3', icon: '🧠', label: 'LLM' },
      { key: 'complete', icon: '✅', label: 'Done' },
    ];
    const order = ['stage1', 'stage2', 'stage3', 'complete'];
    const currentIdx = order.indexOf(stage);
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
        {stages.map((s, i) => {
          const done = currentIdx > i;
          const active = currentIdx === i;
          return (
            <span key={s.key} style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 20,
              background: done ? 'rgba(0,255,136,0.15)' : active ? 'rgba(100,100,255,0.2)' : 'rgba(255,255,255,0.05)',
              color: done ? '#00ff88' : active ? '#8888ff' : '#555',
              border: `1px solid ${done ? '#00ff8833' : active ? '#8888ff44' : '#2a2a3a'}`,
              transition: 'all 0.3s'
            }}>
              {s.icon} {s.label} {active ? '⏳' : done ? '✓' : ''}
            </span>
          );
        })}
      </div>
    );
  }

  function renderEvent(ev) {
    if (ev.type === 'RiskClassified') {
      const level = ev.riskLevel;
      return (
        <div key={ev.id} style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 8,
          background: LEVEL_BG[level] || 'rgba(255,255,255,0.04)',
          border: `1px solid ${LEVEL_COLORS[level]}22`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            <span style={{ color: LEVEL_COLORS[level], fontWeight: 700, fontSize: 13 }}>
              {level === 2 ? '🚨' : level === 1 ? '⚠️' : '✅'} {LEVEL_LABELS[level]} — {ev.riskType}
            </span>
            {ev.timestamp > 0 && <span style={{ color: '#666', fontSize: 11 }}>{timeAgo(ev.timestamp)}</span>}
          </div>
          <div style={{ color: '#aaa', fontSize: 12, marginTop: 3 }}>
            Contract:{' '}
            <a href={`${EXPLORER}/address/${ev.target}`} target="_blank" rel="noreferrer"
              style={{ color: '#7878ff' }}>{shortAddr(ev.target)}</a>
            {' '}·{' '}
            <a href={`${EXPLORER}/tx/${ev.txHash}`} target="_blank" rel="noreferrer"
              style={{ color: '#7878ff' }}>TX ↗</a>
            {' '}·{' '}
            Receipt:{' '}
            <a href={`${EXPLORER}/tx/${ev.txHash}`} target="_blank" rel="noreferrer"
              style={{ color: '#7878ff', fontFamily: 'monospace' }}>{ev.receiptId.slice(0, 10)}... ↗</a>
          </div>
        </div>
      );
    }
    if (ev.type === 'MonitorTriggered') {
      return (
        <div key={ev.id} style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 8,
          background: 'rgba(100,100,255,0.06)',
          border: '1px solid #8888ff22',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            <span style={{ color: '#8888ff', fontWeight: 700, fontSize: 13 }}>⚙️ Pipeline Started — {shortAddr(ev.target)}</span>
            {ev.timestamp > 0 && <span style={{ color: '#666', fontSize: 11 }}>{timeAgo(ev.timestamp)}</span>}
          </div>
          {renderPipelineStages(ev.target)}
          <div style={{ color: '#aaa', fontSize: 12, marginTop: 3 }}>
            <a href={`${EXPLORER}/tx/${ev.txHash}`} target="_blank" rel="noreferrer" style={{ color: '#7878ff' }}>View TX ↗</a>
          </div>
        </div>
      );
    }
    if (ev.type === 'SphinxOverride') {
      return (
        <div key={ev.id} style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 8,
          background: 'rgba(0,200,255,0.06)',
          border: '1px solid #00c8ff22',
        }}>
          <span style={{ color: '#00c8ff', fontWeight: 700, fontSize: 13 }}>🦁 Sphinx Override — Score {ev.score}/100</span>
          <div style={{ color: '#aaa', fontSize: 12, marginTop: 3 }}>
            Contract: <a href={`${EXPLORER}/address/${ev.target}`} target="_blank" rel="noreferrer" style={{ color: '#7878ff' }}>{shortAddr(ev.target)}</a>
            {' '}·{' '}
            <a href={`${EXPLORER}/tx/${ev.txHash}`} target="_blank" rel="noreferrer" style={{ color: '#7878ff' }}>TX ↗</a>
          </div>
        </div>
      );
    }
    if (ev.type === 'ContractFlagged') {
      return (
        <div key={ev.id} style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 8,
          background: 'rgba(255,34,68,0.08)',
          border: '1px solid #ff224422',
        }}>
          <span style={{ color: '#ff2244', fontWeight: 700, fontSize: 13 }}>🚨 FLAGGED — {ev.riskType}</span>
          <div style={{ color: '#aaa', fontSize: 12, marginTop: 3 }}>
            <a href={`${EXPLORER}/address/${ev.target}`} target="_blank" rel="noreferrer" style={{ color: '#7878ff' }}>{shortAddr(ev.target)}</a>
            {' '}·{' '}
            <a href={`${EXPLORER}/tx/${ev.txHash}`} target="_blank" rel="noreferrer" style={{ color: '#7878ff' }}>TX ↗</a>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div style={{ background: '#0d0d1a', borderRadius: 14, padding: 20, border: '1px solid #1a1a2e' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>⛓️</span>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#e8e8f0' }}>On-Chain Activity Feed</span>
        <span style={{
          fontSize: 11, padding: '2px 10px', borderRadius: 20,
          background: connected ? 'rgba(0,255,136,0.12)' : 'rgba(255,100,0,0.12)',
          color: connected ? '#00ff88' : '#ff6400',
          border: `1px solid ${connected ? '#00ff8830' : '#ff640030'}`,
          marginLeft: 'auto'
        }}>
          {connected ? '● LIVE' : '○ Connecting...'}
        </span>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#444', padding: '30px 0', fontSize: 14 }}>
          Waiting for on-chain events...<br />
          <span style={{ fontSize: 12, color: '#333' }}>Events appear here in real-time as agents run</span>
        </div>
      ) : (
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {events.map(ev => renderEvent(ev))}
        </div>
      )}
    </div>
  );
}
