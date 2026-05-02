const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const { sequelize, Product } = require('./db')
const productRoutes = require("./routes/product")

const PORT = process.env.PORT || 5001

const app = express()
dotenv.config()

// CORS configuration
const allowedOrigins = [
  "https://nuevavida1327.com",
  "https://www.nuevavida1327.com",
  "http://localhost:8080",
  "http://localhost:5173",
]

const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server / no-origin requests (e.g. curl, server-to-server).
    if (!origin) return callback(null, true)

    // Allow any *.up.railway.app subdomain (covers all Railway preview/production URLs).
    const isRailwayDomain = /^https:\/\/[^/]+\.up\.railway\.app$/.test(origin)

    if (allowedOrigins.includes(origin) || isRailwayDomain) {
      return callback(null, true)
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`), false)
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: false,
  optionsSuccessStatus: 204,
}

// middleware - CORS MUST be first
app.use(cors(corsOptions))
app.options('*', cors(corsOptions)) // Handle preflight requests BEFORE routes
app.use(express.json({ limit: '50mb' }))

// routes - AFTER middleware
app.use("/api/products", productRoutes)

// Test connection and sync
sequelize.authenticate()
  .then(() => {
    console.log('✅ Product Service is Connected to MySQL')
    return sequelize.sync({ alter: true })
  })
  .then(() => {
    console.log('Database synchronized')
    app.listen(PORT, () => {
      console.log(`Product service is running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("🚫 Error connecting to MySQL -> Product Service", err)
  })
