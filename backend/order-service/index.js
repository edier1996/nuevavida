const express = require("express")
const dotenv = require("dotenv")
const { sequelize, Order } = require('./db')
const orderRoutes = require("./routes/order")

const PORT = process.env.PORT || 5003

dotenv.config()
const app = express()

app.use(express.json())

// Test connection and sync
sequelize.authenticate()
  .then(() => {
    console.log('✅ Order Service is Connected to MySQL')
    return sequelize.sync()
  })
  .then(() => {
    console.log('Database synchronized')
    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("🚫 Failed to connect to MySQL -> Order Service", err)
  })

// routes
app.use("/api/orders", orderRoutes)
