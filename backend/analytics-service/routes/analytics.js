const express = require("express")
const { Op, fn, col, literal } = require("sequelize")
const { Analytics } = require("../db")

const router = express.Router()

// POST /api/analytics/track — Record an analytics event
router.post("/track", async (req, res) => {
  const { userId, eventType, productId, metadata } = req.body
  try {
    if (!eventType) {
      return res.status(400).json({ error: "eventType is required" })
    }

    const event = await Analytics.create({
      userId: userId || null,
      eventType,
      productId: productId || null,
      metadata: metadata || null,
      timestamp: new Date(),
    })

    res.status(201).json(event)
  } catch (err) {
    console.error("Error tracking event:", err)
    res.status(500).json({ error: err?.original?.sqlMessage || err?.message || "Server error" })
  }
})

// GET /api/analytics/user/:userId — Analytics events for a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const events = await Analytics.findAll({
      where: { userId: req.params.userId },
      order: [['timestamp', 'DESC']],
    })
    res.json(events)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// GET /api/analytics/product/:productId — Analytics events for a specific product
router.get("/product/:productId", async (req, res) => {
  try {
    const events = await Analytics.findAll({
      where: { productId: req.params.productId },
      order: [['timestamp', 'DESC']],
    })
    res.json(events)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// GET /api/analytics/dashboard — Aggregated dashboard stats
router.get("/dashboard", async (req, res) => {
  try {
    const totalEvents = await Analytics.count()

    // Count by event type
    const eventTypeCounts = await Analytics.findAll({
      attributes: [
        'eventType',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['eventType'],
      raw: true,
    })

    // Top 10 most viewed products
    const topProducts = await Analytics.findAll({
      attributes: [
        'productId',
        [fn('COUNT', col('id')), 'views'],
      ],
      where: {
        eventType: 'product_viewed',
        productId: { [Op.ne]: null },
      },
      group: ['productId'],
      order: [[literal('views'), 'DESC']],
      limit: 10,
      raw: true,
    })

    // Events in the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentEvents = await Analytics.count({
      where: {
        timestamp: { [Op.gte]: sevenDaysAgo },
      },
    })

    // Donation funnel: requested vs completed
    const donationsRequested = await Analytics.count({ where: { eventType: 'donation_requested' } })
    const donationsCompleted = await Analytics.count({ where: { eventType: 'donation_completed' } })
    const sponsorClicks = await Analytics.count({ where: { eventType: 'sponsor_clicked' } })

    res.json({
      totalEvents,
      recentEvents,
      eventTypeCounts,
      topProducts,
      donationFunnel: {
        requested: donationsRequested,
        completed: donationsCompleted,
        conversionRate: donationsRequested > 0
          ? ((donationsCompleted / donationsRequested) * 100).toFixed(2) + '%'
          : '0%',
      },
      sponsorClicks,
    })
  } catch (err) {
    console.error("Error fetching dashboard:", err)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router
