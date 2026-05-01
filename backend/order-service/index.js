const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const { sequelize, DonationRequest } = require('./db')
const orderRoutes = require("./routes/order")

const PORT = process.env.PORT || 5002

dotenv.config()
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

app.use(express.json())
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// Test connection and sync
sequelize.authenticate()
  .then(() => {
    console.log('✅ Order Service is Connected to MySQL')
    return sequelize.sync({ alter: true })
  })
  .then(() => {
    console.log('Database synchronized')
    app.listen(PORT, () => {
      console.log(`Order Service running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("🚫 Failed to connect to MySQL -> Order Service", err)
  })

// routes
app.use("/api/orders", orderRoutes)
