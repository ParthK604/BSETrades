const express = require('express')
const cors = require('cors')

const tradesRoute = require('./routes/trades')
const pullRoute = require('./routes/pull')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

app.use('/api/trades', tradesRoute)
app.use('/api', pullRoute)

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})

