const express = require('express')
const router = express.Router()
const { pullFromBSE, isPullRunning } = require('../services/bsePuller')

router.post('/pull', (req, res) => {
  if (isPullRunning()) {
    return res.json({ 
      message: 'Pull already in progress' 
    })
  }

  // Don't await — runs in background
  pullFromBSE()

  res.json({ 
    message: 'BSE pull started' 
  })
})

module.exports = router