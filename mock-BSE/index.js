const express = require('express')
const generateTrades = require('./seedData')

const app = express()
const PORT = 4000

// How many ms between each batch — configurable
// Real scenario = 15 mins total for 3000 trades
// For testing set DELAY_MS=500 in env
const DELAY_MS = parseInt(process.env.DELAY_MS) || 500
const BATCH_SIZE = 50  // send 50 trades at a time

app.get('/getTrades', async (req, res) => {
  const trades = generateTrades(3000)
  const batches = []

  // Split into batches
  for (let i = 0; i < trades.length; i += BATCH_SIZE) {
    batches.push(trades.slice(i, i + BATCH_SIZE))
  }

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Transfer-Encoding', 'chunked')

  // Send each batch with delay — simulates slow BSE pull
  for (const batch of batches) {
    await new Promise(resolve => setTimeout(resolve, DELAY_MS))
    res.write(JSON.stringify(batch))
  }

  res.end()
})

app.listen(PORT, () => {
  console.log(`Mock BSE API running on port ${PORT}`)
})