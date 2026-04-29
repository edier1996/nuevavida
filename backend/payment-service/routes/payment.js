// routes/payment.js
const express = require("express")
const { Payment } = require("../db")
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const router = express.Router()

// Create payment intent
router.post("/create-payment-intent", async (req, res) => {
  const { amount, currency = 'usd' } = req.body
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    })
    res.send({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Confirm payment
router.post("/confirm/:orderId", async (req, res) => {
  const { orderId } = req.params
  const { paymentIntentId, amount } = req.body
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (paymentIntent.status === 'succeeded') {
      const payment = await Payment.create({
        orderId,
        amount,
        status: 'completed',
        stripePaymentIntentId: paymentIntentId,
      })
      res.json(payment)
    } else {
      res.status(400).json({ error: 'Payment not completed' })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get payment by ID
router.get("/:paymentId", async (req, res) => {
  const { paymentId } = req.params
  try {
    const payment = await Payment.findByPk(paymentId)
    if (!payment) return res.status(404).json({ msg: "Payment not found" })
    res.json(payment)
  } catch (err) {
    res.status(500).send("Server error")
  }
})

// Get payments for an order
router.get("/order/:orderId", async (req, res) => {
  const { orderId } = req.params
  try {
    const payments = await Payment.findAll({ where: { orderId } })
    res.json(payments)
  } catch (err) {
    res.status(500).send("Server error")
  }
})

module.exports = router
