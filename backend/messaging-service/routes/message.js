const express = require("express")
const { Op } = require("sequelize")
const { Conversation, Message } = require("../db")

const router = express.Router()

// POST /api/messages/create — Send a message (creates conversation if needed)
router.post("/create", async (req, res) => {
  const {
    conversationId,
    senderId,
    senderName,
    content,
    // Fields to create a new conversation when conversationId is not provided
    participantIds,
    productId,
    orderId,
  } = req.body

  try {
    if (!senderId || !senderName || !content) {
      return res.status(400).json({ error: "senderId, senderName and content are required" })
    }

    let conversation

    if (conversationId) {
      conversation = await Conversation.findByPk(conversationId)
      if (!conversation) return res.status(404).json({ msg: "Conversation not found" })
    } else {
      // Create a new conversation
      if (!participantIds || !Array.isArray(participantIds) || participantIds.length !== 2) {
        return res.status(400).json({ error: "participantIds must be an array of exactly 2 user IDs when creating a new conversation" })
      }
      conversation = await Conversation.create({
        participantIds,
        productId: productId || null,
        orderId: orderId || null,
      })
    }

    const message = await Message.create({
      conversationId: conversation.id,
      senderId,
      senderName,
      content,
    })

    res.status(201).json({ conversation, message })
  } catch (err) {
    console.error("Error sending message:", err)
    res.status(500).json({ error: err?.original?.sqlMessage || err?.message || "Server error" })
  }
})

// GET /api/messages/conversation/:conversationId — Get all messages in a conversation
router.get("/conversation/:conversationId", async (req, res) => {
  try {
    const conversation = await Conversation.findByPk(req.params.conversationId)
    if (!conversation) return res.status(404).json({ msg: "Conversation not found" })

    const messages = await Message.findAll({
      where: { conversationId: req.params.conversationId },
      order: [['createdAt', 'ASC']],
    })
    res.json({ conversation, messages })
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// GET /api/messages/user/:userId — Get all conversations for a user
router.get("/user/:userId", async (req, res) => {
  try {
    // Sequelize JSON contains search — use a raw-friendly approach
    const conversations = await Conversation.findAll({
      order: [['updatedAt', 'DESC']],
    })

    // Filter in JS since MySQL JSON_CONTAINS support varies across Sequelize versions
    const userConversations = conversations.filter((c) => {
      const ids = c.participantIds
      return Array.isArray(ids) && ids.includes(req.params.userId)
    })

    res.json(userConversations)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// PUT /api/messages/:id/read — Mark a message as read
router.put("/:id/read", async (req, res) => {
  try {
    const [updatedRowsCount] = await Message.update(
      { read: true },
      { where: { id: req.params.id } }
    )
    if (updatedRowsCount === 0) return res.status(404).json({ msg: "Message not found" })
    const updated = await Message.findByPk(req.params.id)
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

// DELETE /api/messages/:id — Delete a message
router.delete("/:id", async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id)
    if (!message) return res.status(404).json({ msg: "Message not found" })
    await message.destroy()
    res.json({ msg: "Message deleted" })
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router
