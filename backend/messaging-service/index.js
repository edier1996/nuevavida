const http = require("http")
const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const { sequelize } = require('./db')
const messageRoutes = require("./routes/message")
const setupWebSocket = require("./websocket").setupWebSocket

dotenv.config()

const PORT = process.env.PORT || 5005

const app = express()

// CORS — allow all origins (public API)
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json())

// Routes
app.use("/api/messages", messageRoutes)

// Create HTTP server (required to share with WebSocket)
const server = http.createServer(app)

// Test connection, sync DB, then start server
sequelize.authenticate()
  .then(() => {
    console.log('✅ Messaging Service is Connected to MySQL')
    return sequelize.sync({ alter: true })
  })
  .then(() => {
    console.log('Database synchronized')
    server.listen(PORT, () => {
      console.log(`Messaging Service running on port ${PORT}`)
    })
    // Attach WebSocket server to the same HTTP server
    setupWebSocket(server)
  })
  .catch((err) => {
    console.error("🚫 Failed to connect to MySQL -> Messaging Service", err)
  })
