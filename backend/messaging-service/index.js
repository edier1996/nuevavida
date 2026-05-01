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

// CORS configuration
const allowedOrigins = [
  "https://nuevavida1327.com",
  "https://www.nuevavida1327.com",
  "http://localhost:8080",
  "http://localhost:5173",
]

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true)
    const isRailwayDomain = /^https:\/\/[^/]+\.up\.railway\.app$/.test(origin)
    if (allowedOrigins.includes(origin) || isRailwayDomain) {
      return callback(null, true)
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`), false)
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
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
