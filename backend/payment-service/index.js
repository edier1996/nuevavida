const express = require("express")
const { sequelize, Payment } = require('./db')
const dotenv = require("dotenv")
const paymentRoutes = require("./routes/payment")

const PORT = process.env.PORT || 5004

dotenv.config()
const app = express()
app.use(express.json())

// Test connection and sync
sequelize.authenticate()
  .then(() => {
    console.log('✅ Payment Service is Connected to MySQL')
    return sequelize.sync()
  })
  .then(() => {
    console.log('Database synchronized')
    app.listen(PORT, () =>
      console.log(`Payment Service running on port ${PORT}`)
    )
  })
  .catch((err) => {
    console.error("🚫 Failed to connect to MySQL", err)
  })

// routes
app.use("/api/payments", paymentRoutes)
