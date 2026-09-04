const express = require('express')
const router = express.Router()
const { addClient, removeClient, getExistingTrades } = require('../services/bsePuller')

router.get('/stream', (req, res) => {
  // SSE headers — keep connection alive
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // Send existing trades immediately on connect
  const existing = getExistingTrades()
  if (existing.length > 0) {
    res.write(`data: ${JSON.stringify(existing)}\n\n`)
  }

  // Register this client
  addClient(res)

  // Remove client when they disconnect
  req.on('close', () => {
    removeClient(res)
  })
})

module.exports = router