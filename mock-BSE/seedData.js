// mock-bse/seedData.js

const symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFC', 'WIPRO', 'ONGC', 'SBI']
const clients = ['Client_A', 'Client_B', 'Client_C', 'Client_D', 'Client_E']

function generateTrades(count = 3000) {
  const trades = []

  for (let i = 1; i <= count; i++) {
    trades.push({
      tradeId: `TRD_${i}`,
      client: clients[Math.floor(Math.random() * clients.length)],
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      quantity: Math.floor(Math.random() * 500) + 1,
      price: parseFloat((Math.random() * 3000 + 100).toFixed(2)),
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
    })
  }

  return trades
}

module.exports = generateTrades