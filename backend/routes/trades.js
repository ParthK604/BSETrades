const express = require('express')
const router = express.Router()
const { 
  addClient, 
  removeClient, 
  getExistingTrades,
  getCachedTrades 
} = require('../services/bsePuller')

router.get('/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // Check Redis first
  const cached = await getCachedTrades()

  if (cached && cached.length > 0) {
    // Send from Redis cache
    console.log('Serving from Redis cache')
    res.write(`data: ${JSON.stringify(cached)}\n\n`)
  } else {
    // Check in-memory trades if pull is mid-way
    const existing = getExistingTrades()
    if (existing.length > 0) {
      res.write(`data: ${JSON.stringify(existing)}\n\n`)
    }
  }

  addClient(res)

  req.on('close', () => {
    removeClient(res)
  })
})

module.exports = router