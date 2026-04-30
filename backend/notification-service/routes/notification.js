const express = require("express")
const { Notification } = require("../db")
const sendEmail = require("../services/emailService")

const router = express.Router()

// POST /api/notifications/send — Create and optionally email a notification
router.post("/send", async (req, res) => {
  const { userId, type, title, message, relatedId, sendEmail: shouldEmail, email } = req.body
  try {
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ error: "userId, type, title and message are required" })
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedId: relatedId || null,
    })

    // Optionally send an email alongside the in-app notification
    if (shouldEmail && email) {
      try {
        await sendEmail(email, title, message)
      } catch (emailErr) {
        console.warn("⚠️ Failed to send email for notification:", emailErr.message)
      }
    }

    res.status(201).json(notification)
  } catch (err) {
    console.error("Error creating notification:", err)
    res.status(500).json({ error: err?.original?.sqlMessage || err?.message || "Server error" })
  }
})

// GET /api/notifications/user/:userId — Get all notifications for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.params.userId },
      order: [['createdAt', 'DESC']],
    })
    res.json(notifications)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// PUT /api/notifications/:id/read — Mark a notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const [updatedRowsCount] = await Notification.update(
      { read: true },
      { where: { id: req.params.id } }
    )
    if (updatedRowsCount === 0) return res.status(404).json({ msg: "Notification not found" })
    const updated = await Notification.findByPk(req.params.id)
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// DELETE /api/notifications/:id — Delete a notification
router.delete("/:id", async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id)
    if (!notification) return res.status(404).json({ msg: "Notification not found" })
    await notification.destroy()
    res.json({ msg: "Notification deleted" })
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// Legacy: POST /api/notifications/email — Direct email send (backward compat)
router.post("/email", async (req, res) => {
  const { to, subject, text } = req.body
  try {
    await sendEmail(to, subject, text)
    res.status(200).json({ msg: "Email sent" })
  } catch (err) {
    res.status(500).json({ error: "Failed to send email" })
  }
})

module.exports = router
