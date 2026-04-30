const express = require("express")
const { Commission, Sponsorship } = require("../db")

const router = express.Router()

// ─── COMMISSIONS ────────────────────────────────────────────────────────────

// POST /api/payments/commission — Create a commission record
router.post("/commission", async (req, res) => {
  const { orderId, amount, percentage } = req.body
  try {
    if (!orderId || amount == null || percentage == null) {
      return res.status(400).json({ error: "orderId, amount and percentage are required" })
    }
    const commission = await Commission.create({ orderId, amount, percentage })
    res.status(201).json(commission)
  } catch (err) {
    console.error("Error creating commission:", err)
    res.status(500).json({ error: err?.original?.sqlMessage || err?.message || "Server error" })
  }
})

// GET /api/payments/commissions — List all commissions
router.get("/commissions", async (req, res) => {
  try {
    const commissions = await Commission.findAll({ order: [['createdAt', 'DESC']] })
    res.json(commissions)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// PUT /api/payments/commission/:id — Update commission status
router.put("/commission/:id", async (req, res) => {
  const { status } = req.body
  try {
    const [updatedRowsCount] = await Commission.update(
      { status },
      { where: { id: req.params.id } }
    )
    if (updatedRowsCount === 0) return res.status(404).json({ msg: "Commission not found" })
    const updated = await Commission.findByPk(req.params.id)
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err?.original?.sqlMessage || err?.message || "Server error" })
  }
})

// ─── SPONSORSHIPS ────────────────────────────────────────────────────────────

// POST /api/payments/sponsorship — Create a sponsorship
router.post("/sponsorship", async (req, res) => {
  const {
    sponsorId,
    sponsorName,
    type,
    amount,
    duration,
    targetAudience,
    startDate,
    endDate,
  } = req.body
  try {
    if (!sponsorId || !sponsorName || !type || amount == null || !duration || !startDate || !endDate) {
      return res.status(400).json({ error: "sponsorId, sponsorName, type, amount, duration, startDate and endDate are required" })
    }
    const sponsorship = await Sponsorship.create({
      sponsorId,
      sponsorName,
      type,
      amount,
      duration,
      targetAudience: targetAudience || null,
      startDate,
      endDate,
    })
    res.status(201).json(sponsorship)
  } catch (err) {
    console.error("Error creating sponsorship:", err)
    res.status(500).json({ error: err?.original?.sqlMessage || err?.message || "Server error" })
  }
})

// GET /api/payments/sponsorships — List all sponsorships
router.get("/sponsorships", async (req, res) => {
  try {
    const sponsorships = await Sponsorship.findAll({ order: [['createdAt', 'DESC']] })
    res.json(sponsorships)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// PUT /api/payments/sponsorship/:id — Update a sponsorship
router.put("/sponsorship/:id", async (req, res) => {
  const { status, conversionRate, targetAudience, endDate } = req.body

  const updates = { status, conversionRate, targetAudience, endDate }
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key]
  })

  try {
    const [updatedRowsCount] = await Sponsorship.update(updates, {
      where: { id: req.params.id },
    })
    if (updatedRowsCount === 0) return res.status(404).json({ msg: "Sponsorship not found" })
    const updated = await Sponsorship.findByPk(req.params.id)
    res.json(updated)
  } catch (err) {
    console.error("Error updating sponsorship:", err)
    res.status(500).json({ error: err?.original?.sqlMessage || err?.message || "Server error" })
  }
})

module.exports = router
