const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const { sequelize, Cart, CartItem } = require('./db')
const cartRoutes = require("./routes/cart")

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
    console.log('✅ Shopping Cart Service is Connected to MySQL')
    return sequelize.sync()
  })
  .then(() => {
    console.log('Database synchronized')
    app.listen(PORT, () => {
      console.log(`Listening on PORT ${PORT}`)
    })
  })
  .catch((error) => {
    console.error("🚫 Failed to connect to MySQL -> Shopping Cart Service", error)
  })

// routes
app.use("/api/cart", cartRoutes)
