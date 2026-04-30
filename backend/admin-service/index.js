const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const { sequelize } = require('./db')
const adminRoutes = require("./routes/admin")

dotenv.config()

const PORT = process.env.PORT || 5007

const app = express()

// CORS configuration
const allowedOrigins = [
  "https://nuevavida1327.com",
  "https://nuevavida-production.up.railway.app",
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

// Routes
app.use("/api/admin", adminRoutes)

// Test connection, sync DB, then start server
sequelize.authenticate()
  .then(() => {
    console.log('✅ Admin Service is Connected to MySQL')
    return sequelize.sync({ alter: true })
  })
  .then(() => {
    console.log('Database synchronized')
    app.listen(PORT, () => {
      console.log(`Admin Service running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("🚫 Failed to connect to MySQL -> Admin Service", err)
  })
