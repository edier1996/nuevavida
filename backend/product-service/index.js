const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const { sequelize, Product } = require('./db')
const productRoutes = require("./routes/product")

const PORT = process.env.PORT || 5001

const app = express()
dotenv.config()

// CORS configuration
const corsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}

app.use(express.json())
app.use(cors(corsOptions))
app.options('*', cors(corsOptions)) // Handle preflight requests

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

// Routes
app.use("/api/products", productRoutes)
