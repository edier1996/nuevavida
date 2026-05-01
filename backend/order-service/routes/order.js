const express = require("express")
const { Op } = require("sequelize")
const { DonationRequest } = require("../db")

const router = express.Router()

// POST /api/orders/create — Create a donation request
router.post("/create", async (req, res) => {
  const {
    productId,
    productTitle,
    productCity,
    requesterId,
    requesterEmail,
    requesterName,
    requesterPhone,
    requesterCity,
    householdSize,
    needLevel,
    reason,
    intendedUse,
    pickupWindow,
    extraNotes,
    evidence,
    score,
    scoreBreakdown,
    donorId,
    message,
    location,
    city,
    country,
  } = req.body

  try {
    if (!productId || !requesterId || !requesterEmail || !requesterName) {
      return res.status(400).json({ error: "productId, requesterId, requesterEmail and requesterName are required" })
    }

    const donationRequest = await DonationRequest.create({
      productId,
      productTitle: productTitle || null,
      productCity: productCity || null,
      requesterId,
      requesterEmail,
      requesterName,
      requesterPhone: requesterPhone || null,
      requesterCity: requesterCity || null,
      householdSize: householdSize || null,
      needLevel: needLevel || 'media',
      reason: reason || null,
      intendedUse: intendedUse || null,
      pickupWindow: pickupWindow || null,
      extraNotes: extraNotes || null,
      evidence: evidence || null,
      score: typeof score === 'number' ? score : 0,
      scoreBreakdown: scoreBreakdown || null,
      donorId: donorId || null,
      message: message || null,
      location: location || null,
      city: city || null,
      country: country || null,
    })

    res.status(201).json(donationRequest)
  } catch (err) {
    console.error("Error creating donation request:", err)
    res.status(500).json({ error: err?.original?.sqlMessage || err?.message || "Server error" })
  }
})

// GET /api/orders — List all donation requests
router.get("/", async (req, res) => {
  try {
    const requests = await DonationRequest.findAll({ order: [['createdAt', 'DESC']] })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// GET /api/orders/product/:productId — Requests for a specific product
router.get("/product/:productId", async (req, res) => {
  try {
    const requests = await DonationRequest.findAll({
      where: { productId: req.params.productId },
      order: [['createdAt', 'DESC']],
    })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// GET /api/orders/user/:userId — Requests made by or involving a user
router.get("/user/:userId", async (req, res) => {
  try {
    const requests = await DonationRequest.findAll({
      where: {
        [Op.or]: [
          { requesterId: req.params.userId },
          { donorId: req.params.userId },
        ],
      },
      order: [['createdAt', 'DESC']],
    })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// GET /api/orders/:id — Get a single donation request
router.get("/:id", async (req, res) => {
  try {
    const request = await DonationRequest.findByPk(req.params.id)
    if (!request) return res.status(404).json({ msg: "Donation request not found" })
    res.json(request)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// PUT /api/orders/:id — Update a donation request (status, donorId, etc.)
router.put("/:id", async (req, res) => {
  const {
    status,
    donorId,
    message,
    location,
    city,
    country,
    productTitle,
    productCity,
    requesterPhone,
    requesterCity,
    householdSize,
    needLevel,
    reason,
    intendedUse,
    pickupWindow,
    extraNotes,
    evidence,
    score,
    scoreBreakdown,
  } = req.body

  const updates = {
    status,
    donorId,
    message,
    location,
    city,
    country,
    productTitle,
    productCity,
    requesterPhone,
    requesterCity,
    householdSize,
    needLevel,
    reason,
    intendedUse,
    pickupWindow,
    extraNotes,
    evidence,
    score,
    scoreBreakdown,
  }
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key]
  })

  try {
    const [updatedRowsCount] = await DonationRequest.update(updates, {
      where: { id: req.params.id },
    })
    if (updatedRowsCount === 0) return res.status(404).json({ msg: "Donation request not found" })
    const updated = await DonationRequest.findByPk(req.params.id)
    res.json(updated)
  } catch (err) {
    console.error("Error updating donation request:", err)
    res.status(500).json({ error: err?.original?.sqlMessage || err?.message || "Server error" })
  }
})

// DELETE /api/orders/:id — Cancel / delete a donation request
router.delete("/:id", async (req, res) => {
  try {
    const request = await DonationRequest.findByPk(req.params.id)
    if (!request) return res.status(404).json({ msg: "Donation request not found" })
    await request.destroy()
    res.json({ msg: "Donation request cancelled" })
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router
