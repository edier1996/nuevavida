const express = require("express")
const dotenv = require("dotenv")
const { sequelize, Cart, CartItem } = require('./db')
const cartRoutes = require("./routes/cart")

const PORT = process.env.PORT || 5002

dotenv.config()
const app = express()

app.use(express.json())

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
