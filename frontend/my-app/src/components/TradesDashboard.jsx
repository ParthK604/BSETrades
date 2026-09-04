import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const BACKEND_URL = 'http://localhost:3000'

export default function TradesDashboard() {
  const [trades, setTrades] = useState([])
  const [isPulling, setIsPulling] = useState(false)
  const [pullComplete, setPullComplete] = useState(false)
  const [connected, setConnected] = useState(false)
  const tableRef = useRef(null)

  useEffect(() => {
    // Connect to SSE on mount
    const es = new EventSource(`${BACKEND_URL}/api/trades/stream`)

    es.onopen = () => setConnected(true)

    es.onmessage = (event) => {
      const data = JSON.parse(event.data)

      // Pull complete signal
      if (data.pullComplete) {
        setIsPulling(false)
        setPullComplete(true)
        return
      }

      // Add new trades
      setTrades(prev => [...prev, ...data])

      // Auto scroll to bottom
      setTimeout(() => {
        if (tableRef.current) {
          tableRef.current.scrollTop = tableRef.current.scrollHeight
        }
      }, 50)
    }

    es.onerror = () => setConnected(false)

    return () => es.close()
  }, [])

  const triggerPull = async () => {
    try {
      setPullComplete(false)
      setIsPulling(true)
      setTrades([])
      await axios.post(`${BACKEND_URL}/api/pull`)
    } catch (err) {
      console.error('Pull failed:', err)
      setIsPulling(false)
    }
  }

  const getSymbolColor = (symbol) => {
    const colors = {
      RELIANCE: '#60a5fa',
      TCS: '#34d399',
      INFY: '#f59e0b',
      HDFC: '#a78bfa',
      WIPRO: '#fb7185',
      ONGC: '#22d3ee',
      SBI: '#86efac'
    }
    return colors[symbol] || '#e1e4e8'
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>BSE Trade Dashboard</h1>
          <p style={styles.subtitle}>Real-time trade data via Server Sent Events</p>
        </div>
        <div style={styles.headerRight}>
          {/* Connection status */}
          <div style={styles.statusBadge}>
            <div style={{
              ...styles.statusDot,
              backgroundColor: connected ? '#34d399' : '#f87171'
            }} />
            <span style={styles.statusText}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {/* Pull button */}
          <button
            style={{
              ...styles.pullButton,
              opacity: isPulling ? 0.6 : 1,
              cursor: isPulling ? 'not-allowed' : 'pointer'
            }}
            onClick={triggerPull}
            disabled={isPulling}
          >
            {isPulling ? 'Pulling...' : 'Start BSE Pull'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={styles.statsBar}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Total Trades</span>
          <span style={styles.statValue}>{trades.length.toLocaleString()}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Status</span>
          <span style={{
            ...styles.statValue,
            color: isPulling ? '#f59e0b' : pullComplete ? '#34d399' : '#6b7280'
          }}>
            {isPulling ? '⟳ Pulling from BSE' : pullComplete ? '✓ Pull Complete' : 'Idle'}
          </span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Unique Symbols</span>
          <span style={styles.statValue}>
            {new Set(trades.map(t => t.symbol)).size}
          </span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Total Volume</span>
          <span style={styles.statValue}>
            {trades.reduce((sum, t) => sum + t.quantity, 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableWrapper} ref={tableRef}>
        {trades.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>
              {isPulling ? 'Receiving trades...' : 'Hit "Start BSE Pull" to fetch trades'}
            </p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['Trade ID', 'Client', 'Symbol', 'Quantity', 'Price', 'Timestamp'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, idx) => (
                <tr
                  key={trade.tradeId}
                  style={{
                    ...styles.tr,
                    backgroundColor: idx % 2 === 0 ? '#13161e' : '#0f1117',
                    animation: 'fadeIn 0.3s ease'
                  }}
                >
                  <td style={styles.td}>{trade.tradeId}</td>
                  <td style={styles.td}>{trade.client}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.symbolBadge,
                      color: getSymbolColor(trade.symbol),
                      borderColor: getSymbolColor(trade.symbol) + '40',
                      backgroundColor: getSymbolColor(trade.symbol) + '15'
                    }}>
                      {trade.symbol}
                    </span>
                  </td>
                  <td style={styles.td}>{trade.quantity.toLocaleString()}</td>
                  <td style={styles.td}>
                    ₹{trade.price.toLocaleString()}
                  </td>
                  <td style={styles.td}>
                    {new Date(trade.timestamp).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#f0f6fc',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '4px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: '#1c1f26',
    borderRadius: '20px',
    border: '1px solid #2d3139'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  statusText: {
    fontSize: '13px',
    color: '#9ca3af'
  },
  pullButton: {
    padding: '10px 20px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background 0.2s'
  },
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    backgroundColor: '#1c1f26',
    border: '1px solid #2d3139',
    borderRadius: '10px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#f0f6fc'
  },
  tableWrapper: {
    backgroundColor: '#1c1f26',
    border: '1px solid #2d3139',
    borderRadius: '10px',
    overflow: 'auto',
    maxHeight: '600px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    backgroundColor: '#13161e',
    borderBottom: '1px solid #2d3139',
    position: 'sticky',
    top: 0
  },
  tr: {
    borderBottom: '1px solid #1c1f26',
    transition: 'background 0.15s'
  },
  td: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#d1d5db'
  },
  symbolBadge: {
    padding: '3px 8px',
    borderRadius: '4px',
    border: '1px solid',
    fontSize: '12px',
    fontWeight: '600'
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px'
  },
  emptyText: {
    color: '#6b7280',
    fontSize: '14px'
  }
}