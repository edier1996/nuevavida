const express = require("express")
const jwt = require("jsonwebtoken")
const { Notification, User } = require("../db")

const router = express.Router()

const auth = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "")
  if (!token) return res.status(401).json({ msg: "No token, authorization denied" })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded.userId
    next()
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" })
  }
}

router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.sendStatus(200)
})

router.get('/user/:userId', auth, async (req, res) => {
  try {
    const requestedUserId = Number(req.params.userId)
    if (Number(req.user) !== requestedUserId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const notifications = await Notification.findAll({
      where: { userId: requestedUserId },
      order: [['createdAt', 'DESC']],
    })

    res.json(notifications)
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' })
  }
})

router.post('/sync', auth, async (req, res) => {
  try {
    const { userId, type, title, message, actionUrl, externalKey, metadata } = req.body || {}

    if (!userId || Number(req.user) !== Number(userId)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (!type || !title || !message) {
      return res.status(400).json({ error: 'type, title and message are required' })
    }

    if (externalKey) {
      const existing = await Notification.findOne({ where: { externalKey } })
      if (existing) {
        return res.json(existing)
      }
    }

    const notification = await Notification.create({
      userId: Number(userId),
      type,
      title,
      message,
      actionUrl: actionUrl || null,
      externalKey: externalKey || null,
      metadata: metadata || null,
    })

    res.status(201).json(notification)
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' })
  }
})

router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id)
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    if (Number(notification.userId) !== Number(req.user)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await notification.update({ read: true })
    res.json(notification)
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' })
  }
})

router.put('/user/:userId/read-all', auth, async (req, res) => {
  try {
    const requestedUserId = Number(req.params.userId)
    if (Number(req.user) !== requestedUserId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await Notification.update({ read: true }, { where: { userId: requestedUserId, read: false } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id)
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    if (Number(notification.userId) !== Number(req.user)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await notification.destroy()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' })
  }
})

router.post('/admin/user-created', auth, async (req, res) => {
  try {
    const actor = await User.findByPk(req.user)
    if (!actor || actor.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { userId, name, email } = req.body || {}
    if (!userId || !name || !email) {
      return res.status(400).json({ error: 'userId, name and email are required' })
    }

    const notification = await Notification.create({
      userId: Number(userId),
      type: 'system',
      title: 'Tu cuenta fue creada',
      message: `Hola ${name}, tu cuenta en Nueva Vida ya fue creada y está lista para usarse con el correo ${email}.`,
      actionUrl: '/perfil',
      externalKey: `user-created-${userId}`,
      metadata: { email },
    })

    res.status(201).json(notification)
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' })
  }
})

module.exports = router