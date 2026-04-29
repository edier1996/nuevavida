const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const { sequelize, Product } = require('./db')
const productRoutes = require("./routes/product")

const PORT = process.env.PORT || 5001

const app = express()
dotenv.config()

app.use(express.json())
app.use(cors())

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
