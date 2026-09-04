const axios = require('axios')

// All connected SSE clients stored here
let clients = []

// All trades pulled so far stored here
let pulledTrades = []

// Track if pull is currently running
let isPulling = false

// Register a new SSE client
function addClient(res) {
  clients.push(res)
  console.log(`Client connected. Total clients: ${clients.length}`)
}

// Remove client when they disconnect
function removeClient(res) {
  clients = clients.filter(c => c !== res)
  console.log(`Client disconnected. Total clients: ${clients.length}`)
}

// Get all trades pulled so far
function getExistingTrades() {
  return pulledTrades
}

function isPullRunning() {
  return isPulling
}

// Broadcast new trades to all connected clients
function broadcast(trades) {
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(trades)}\n\n`)
  })
}

// Main pull function — calls mock BSE API
async function pullFromBSE() {
  if (isPulling) {
    console.log('Pull already in progress')
    return
  }

  isPulling = true
  pulledTrades = [] // reset on new pull
  console.log('Starting BSE pull...')

  try {
    const response = await axios({
      method: 'get',
      url: 'http://localhost:4000/getTrades',
      responseType: 'stream'  // stream the response
    })

    let buffer = ''

    response.data.on('data', (chunk) => {
      buffer += chunk.toString()

      // Each chunk is a JSON array — try to parse
      try {
        const trades = JSON.parse(buffer)
        buffer = '' // clear buffer on success

        // Store trades
        pulledTrades = [...pulledTrades, ...trades]

        // Broadcast to all connected clients
        broadcast(trades)

        console.log(`Pulled and broadcasted ${trades.length} trades. Total: ${pulledTrades.length}`)
      } catch (e) {
        // Chunk not complete yet — keep buffering
      }
    })

    response.data.on('end', () => {
      console.log('BSE pull complete.')
      isPulling = false

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
  pullFromBSE
}