const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const { sequelize, User } = require('./db')
const userRoutes = require("./routes/user")

const PORT = process.env.PORT || 5000

dotenv.config()
const app = express()

// CORS configuration
const allowedOrigins = [
  "https://nuevavida1327.com",
  "http://localhost:8080",
  "http://localhost:5173",
]

const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server/no-origin requests and browser origins in allowlist.
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin) || /\.up\.railway\.app$/i.test(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`), false)
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}

// middleware
app.use(express.json())
app.use(cors(corsOptions))
app.options('*', cors(corsOptions)) // Handle preflight requests

// Test connection and sync
sequelize.authenticate()
  .then(() => {
    console.log('✅ User Service is Connected to MySQL')
    return sequelize.sync()
  })
  .then(() => {
    console.log('Database synchronized')
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("🚫 Failed to connect to Database -> User Service", err)
  })

// routes
app.use("/api/users", userRoutes)
