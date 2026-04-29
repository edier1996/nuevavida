const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const { sequelize, User } = require('./db')
const userRoutes = require("./routes/user")

const PORT = process.env.PORT || 5000

dotenv.config()
const app = express()

// CORS configuration
const corsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
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
