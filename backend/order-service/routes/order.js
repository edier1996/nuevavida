const express = require("express")
const { Order } = require("../db")
const axios = require("axios")

const router = express.Router()

const PRODUCT_SERVICE_URI =
  process.env.PRODUCT_SERVICE_URI || "http://localhost:5001"
const NOTIFICATION_SERVICE_URI =
  process.env.NOTIFICATION_SERVICE_URI || "http://localhost:5005"
const USER_SERVICE_URI =
  process.env.USER_SERVICE_URI || "http://localhost:5000"

// Helper function to send notification (async, non-blocking)
const sendOrderNotification = async (orderId, userId, userEmail, status) => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URI}/api/notification/email`, {
      to: userEmail,
      subject: `Order ${orderId} - ${status}`,
      text: `Your order #${orderId} has been ${status.toLowerCase()}.\nPlease track your shipment with the tracking number provided.`,
    })
  } catch (err) {
    console.warn(`⚠️ Failed to send notification for order ${orderId}:`, err.message)
    // Don't fail the order creation if notification fails
  }
}

// Place a new order
router.post("/:userId", async (req, res) => {
  const { userId } = req.params
  const { items, totalAmount, shippingAddress, shippingCost } = req.body

  try {
    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ msg: "Items must be a non-empty array" })
    }
    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      return res.status(400).json({ msg: "Total amount must be positive" })
    }
    if (!shippingAddress) {
      return res.status(400).json({ msg: "Shipping address is required" })
    }

    // Check if products are available
    const productChecks = await Promise.all(
      items.map(async (item) => {
        const productResponse = await axios.get(
          `${PRODUCT_SERVICE_URI}/api/products/${item.productId}`
        )
        const product = productResponse.data
        if (!product) {
          throw new Error(`Product ${item.productId} not found`)
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`)
        }
        return product
      })
    )

    // Deduct stock
    await Promise.all(
      items.map(async (item) => {
        await axios.put(
          `${PRODUCT_SERVICE_URI}/api/products/${item.productId}/deduct`,
          { quantity: item.quantity }
        )
      })
    )

    // Create order
    const order = await Order.create({
      userId,
      products: items,
      totalAmount,
      shippingAddress,
      shippingCost,
    })

    // Get user email for notification
    const userResponse = await axios.get(`${USER_SERVICE_URI}/api/users/${userId}`)
    const userEmail = userResponse.data.email

    // Send notification
    sendOrderNotification(order.id, userId, userEmail, "Placed")

    res.status(201).json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get orders for a user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params
  try {
    const orders = await Order.findAll({ where: { userId } })
    res.json(orders)
  } catch (err) {
    res.status(500).send("Server error")
  }
})

// Get order by ID
router.get("/order/:orderId", async (req, res) => {
  const { orderId } = req.params
  try {
    const order = await Order.findByPk(orderId)
    if (!order) return res.status(404).json({ msg: "Order not found" })
    res.json(order)
  } catch (err) {
    res.status(500).send("Server error")
  }
})

// Update order status
router.put("/:orderId/status", async (req, res) => {
  const { orderId } = req.params
  const { status } = req.body
  try {
    const [updatedRowsCount] = await Order.update(
      { status },
      { where: { id: orderId } }
    )
    if (updatedRowsCount === 0) return res.status(404).json({ msg: "Order not found" })
    const updatedOrder = await Order.findByPk(orderId)

    // Get user email for notification
    const userResponse = await axios.get(`${USER_SERVICE_URI}/api/users/${updatedOrder.userId}`)
    const userEmail = userResponse.data.email

    // Send notification
    sendOrderNotification(orderId, updatedOrder.userId, userEmail, status)

    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send("Server error")
  }
})

// Cancel order
router.put("/:orderId/cancel", async (req, res) => {
  const { orderId } = req.params
  try {
    const order = await Order.findByPk(orderId)
    if (!order) return res.status(404).json({ msg: "Order not found" })
    if (order.status === 'cancelled') {
      return res.status(400).json({ msg: "Order is already cancelled" })
    }

    // Restore stock
    await Promise.all(
      order.products.map(async (item) => {
        await axios.put(
          `${PRODUCT_SERVICE_URI}/api/products/${item.productId}/restore`,
          { quantity: item.quantity }
        )
      })
    )

    order.status = 'cancelled'
    await order.save()

    // Get user email for notification
    const userResponse = await axios.get(`${USER_SERVICE_URI}/api/users/${order.userId}`)
    const userEmail = userResponse.data.email

    // Send notification
    sendOrderNotification(orderId, order.userId, userEmail, "Cancelled")

    res.json(order)
  } catch (err) {
    res.status(500).send("Server error")
  }
})

module.exports = router
