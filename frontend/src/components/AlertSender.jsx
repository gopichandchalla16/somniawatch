import React, { useState } from 'react';

// ✅ NO secrets here — all alerts go through /api/alert serverless proxy
// Secrets live ONLY in Vercel Environment Variables (never in frontend code)
const MOCK_VAULT = '0xEC263eBBA7f26ab58C78c27c93fD84D369e5d39B';

export default function AlertSender({ contract = MOCK_VAULT, riskType = 'reentrancy_pattern' }) {
  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(false);

  async function sendAlert() {
    setLoading(true);
    setStatus(null);
    try {
      const res  = await fetch('/api/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract, riskType }),
      });
      const data = await res.json();
      setStatus(data.ok ? '✅ Alert sent!' : `❌ Error: ${JSON.stringify(data)}`);
    } catch (err) {
      setStatus(`❌ Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '1rem', background: '#1a1a2e', borderRadius: 8, border: '1px solid #ff2200' }}>
      <h3 style={{ color: '#ff2200', margin: '0 0 0.5rem' }}>🚨 Manual Alert Trigger</h3>
      <p style={{ color: '#aaa', fontSize: 12, margin: '0 0 1rem' }}>
        Contract: <code style={{ color: '#fff' }}>{contract}</code>
      </p>
      <button
        onClick={sendAlert}
        disabled={loading}
        style={{
          background: loading ? '#555' : '#ff2200',
          color: '#fff',
          border: 'none',
          padding: '0.5rem 1.5rem',
          borderRadius: 6,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
        }}
      >
        {loading ? 'Sending...' : 'Send Alert'}
      </button>
      {status && (
        <p style={{ marginTop: '0.75rem', color: status.startsWith('✅') ? '#00ff88' : '#ff6666' }}>
          {status}
        </p>
      )}
    </div>
  );
}
