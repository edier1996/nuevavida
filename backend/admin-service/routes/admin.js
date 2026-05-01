const express = require("express")
const { Report, ProductRequest } = require("../db")
const adminAuth = require("../middleware/adminAuth")

const router = express.Router()

// ─── REPORTS ─────────────────────────────────────────────────────────────────

// POST /api/admin/report — Create a user report (any authenticated user)
router.post("/report", async (req, res) => {
  const { reportedUserId, reporterUserId, reason } = req.body
  try {
    if (!reportedUserId || !reporterUserId || !reason) {
      return res.status(400).json({ error: "reportedUserId, reporterUserId and reason are required" })
    }

    if (reportedUserId === reporterUserId) {
      return res.status(400).json({ error: "A user cannot report themselves" })
    }

    const report = await Report.create({ reportedUserId, reporterUserId, reason })
    res.status(201).json(report)
  } catch (err) {
    console.error("Error creating report:", err)
    res.status(500).json({ error: err?.original?.sqlMessage || err?.message || "Server error" })
  }
})

// GET /api/admin/reports — List all reports (admin only)
router.get("/reports", adminAuth, async (req, res) => {
  try {
    const { status } = req.query
    const where = status ? { status } : {}
    const reports = await Report.findAll({
      where,
      order: [['createdAt', 'DESC']],
    })
    res.json(reports)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// PUT /api/admin/reports/:id — Update report status and action (admin only)
router.put("/reports/:id", adminAuth, async (req, res) => {
  const { status, action } = req.body

  const updates = { status, action }
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key]
  })

  try {
    const [updatedRowsCount] = await Report.update(updates, {
      where: { id: req.params.id },
    })
    if (updatedRowsCount === 0) return res.status(404).json({ msg: "Report not found" })
    const updated = await Report.findByPk(req.params.id)
    res.json(updated)
  } catch (err) {
    console.error("Error updating report:", err)
    res.status(500).json({ error: err?.original?.sqlMessage || err?.message || "Server error" })
  }
})

// ─── USER MODERATION ─────────────────────────────────────────────────────────

// POST /api/admin/users/:id/suspend — Suspend a user (admin only)
router.post("/users/:id/suspend", adminAuth, async (req, res) => {
  const { id } = req.params
  try {
    // Record the moderation action as a resolved report entry
    const report = await Report.create({
      reportedUserId: id,
      reporterUserId: req.admin.userId,
      reason: req.body.reason || 'Administrative suspension',
      status: 'resolved',
      action: 'suspend',
    })

    res.json({
      msg: `User ${id} has been suspended`,
      report,
    })
  } catch (err) {
    console.error("Error suspending user:", err)
    res.status(500).json({ error: err?.original?.sqlMessage || err?.message || "Server error" })
  }
})

// POST /api/admin/users/:id/ban — Ban a user (admin only)
router.post("/users/:id/ban", adminAuth, async (req, res) => {
  const { id } = req.params
  try {
    // Record the moderation action as a resolved report entry
    const report = await Report.create({
      reportedUserId: id,
      reporterUserId: req.admin.userId,
      reason: req.body.reason || 'Administrative ban',
      status: 'resolved',
      action: 'ban',
    })

    res.json({
      msg: `User ${id} has been banned`,
      report,
    })
  } catch (err) {
    console.error("Error banning user:", err)
    res.status(500).json({ error: err?.original?.sqlMessage || err?.message || "Server error" })
  }
})

// ─── PRODUCT REQUESTS ─────────────────────────────────────────────────────────

// GET /api/admin/requests — List all product requests (no auth required so frontend can read)
router.get("/requests", async (req, res) => {
  try {
    const requests = await ProductRequest.findAll({
      order: [['createdAt', 'DESC']],
    })
    res.json(requests)
  } catch (err) {
    console.error("Error fetching requests:", err)
    res.status(500).json({ error: err?.message || "Server error" })
  }
})

// POST /api/admin/requests — Create a new product request
router.post("/requests", async (req, res) => {
  try {
    const {
      id, productId, productTitle, productCity,
      requesterId, requesterName, requesterEmail, requesterPhone, requesterCity,
      householdSize, needLevel, reason, intendedUse, pickupWindow, extraNotes,
      evidence, status, score, scoreBreakdown, createdAt,
    } = req.body

    if (!id || !productId || !requesterId || !needLevel || !reason || !pickupWindow) {
      return res.status(400).json({ error: "id, productId, requesterId, needLevel, reason and pickupWindow are required" })
    }

    const request = await ProductRequest.create({
      id,
      productId,
      productTitle: productTitle || "",
      productCity: productCity || null,
      requesterId,
      requesterName: requesterName || "",
      requesterEmail: requesterEmail || "",
      requesterPhone: requesterPhone || null,
      requesterCity: requesterCity || null,
      householdSize: householdSize || null,
      needLevel,
      reason,
      intendedUse: intendedUse || null,
      pickupWindow,
      extraNotes: extraNotes || null,
      evidence: evidence || null,
      status: status || "pending",
      score: score || 0,
      scoreBreakdown: scoreBreakdown || null,
      createdAt: createdAt || new Date().toISOString(),
    })

    res.status(201).json(request)
  } catch (err) {
    console.error("Error creating request:", err)
    res.status(500).json({ error: err?.original?.sqlMessage || err?.message || "Server error" })
  }
})

// PUT /api/admin/requests/:id — Update request status
router.put("/requests/:id", async (req, res) => {
  try {
    const { status } = req.body
    if (!status) {
      return res.status(400).json({ error: "status is required" })
    }

    const [updatedRowsCount] = await ProductRequest.update(
      { status },
      { where: { id: req.params.id } }
    )

    if (updatedRowsCount === 0) {
      return res.status(404).json({ msg: "Request not found" })
    }

    const updated = await ProductRequest.findByPk(req.params.id)
    res.json(updated)
  } catch (err) {
    console.error("Error updating request:", err)
    res.status(500).json({ error: err?.original?.sqlMessage || err?.message || "Server error" })
  }
})

// DELETE /api/admin/requests/:id — Delete a product request
router.delete("/requests/:id", async (req, res) => {
  try {
    const deletedRowsCount = await ProductRequest.destroy({
      where: { id: req.params.id },
    })

    if (deletedRowsCount === 0) {
      return res.status(404).json({ msg: "Request not found" })
    }

    res.json({ msg: "Request deleted" })
  } catch (err) {
    console.error("Error deleting request:", err)
    res.status(500).json({ error: err?.original?.sqlMessage || err?.message || "Server error" })
  }
})

module.exports = router
