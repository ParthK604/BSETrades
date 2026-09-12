const axios = require('axios')
const { createClient } = require('redis')

// Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})

redisClient.on('error', (err) => console.error('Redis error:', err))

async function connectRedis() {
  await redisClient.connect()
  console.log('Connected to Redis')
}

connectRedis()

// SSE clients
let clients = []
let pulledTrades = []
let isPulling = false

function addClient(res) {
  clients.push(res)
  console.log(`Client connected. Total: ${clients.length}`)
}

function removeClient(res) {
  clients = clients.filter(c => c !== res)
  console.log(`Client disconnected. Total: ${clients.length}`)
}

function getExistingTrades() {
  return pulledTrades
}

function isPullRunning() {
  return isPulling
}

// Get cached trades from Redis
async function getCachedTrades() {
  const cached = await redisClient.get('bse:trades')
  return cached ? JSON.parse(cached) : null
}

function broadcast(trades) {
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(trades)}\n\n`)
  })
}

async function pullFromBSE() {
  if (isPulling) {
    console.log('Pull already in progress')
    return
  }

  isPulling = true
  pulledTrades = []
  console.log('Starting BSE pull...')

  try {
    const response = await axios({
      method: 'get',
      url: process.env.BSE_URL 
        ? `${process.env.BSE_URL}/getTrades` 
        : 'http://localhost:4000/getTrades',
      responseType: 'stream'
    })

    let buffer = ''

    response.data.on('data', (chunk) => {
      buffer += chunk.toString()
      try {
        const trades = JSON.parse(buffer)
        buffer = ''
        pulledTrades = [...pulledTrades, ...trades]
        broadcast(trades)
        console.log(`Pulled ${trades.length}. Total: ${pulledTrades.length}`)
      } catch (e) {
        // keep buffering
      }
    })

    response.data.on('end', async () => {
      console.log('BSE pull complete.')
      isPulling = false

      // Save to Redis with 1 hour TTL
      await redisClient.set(
        'bse:trades',
        JSON.stringify(pulledTrades),
        { EX: 3600 }
      )
      console.log('Trades cached in Redis')

      // Broadcast pull complete signal
      clients.forEach(client => {
        client.write(`data: ${JSON.stringify({ pullComplete: true })}\n\n`)
      })
    })

    response.data.on('error', (err) => {
      console.error('Stream error:', err.message)
      isPulling = false
    })

  } catch (err) {
    console.error('BSE pull failed:', err.message)
    isPulling = false
  }
}

module.exports = {
  addClient,
  removeClient,
  getExistingTrades,
  isPullRunning,
  pullFromBSE,
  getCachedTrades
}