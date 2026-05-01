const WebSocket = require('ws')

// Map conversationId -> Set of WebSocket clients (module-level so routes can broadcast)
const rooms = new Map()

/**
 * Broadcast a JSON payload to all clients currently in a conversation room.
 * Called by the REST route after persisting a message to the DB.
 */
function broadcastToRoom(conversationId, payload) {
  const room = rooms.get(conversationId)
  if (!room) return
  const msg = JSON.stringify(payload)
  room.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg)
    }
  })
}

/**
 * Sets up a WebSocket server attached to the given HTTP server.
 * Clients connect and send JSON messages of the form:
 *   { type: 'join', conversationId: '<uuid>' }
 *   { type: 'message', conversationId: '<uuid>', senderId: '<uuid>', senderName: '<name>', content: '<text>' }
 *
 * All participants in the same conversationId receive broadcast messages in real-time.
 */
function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server })

  wss.on('connection', (ws) => {
    let currentRoom = null

    ws.on('message', (raw) => {
      let data
      try {
        data = JSON.parse(raw)
      } catch {
        ws.send(JSON.stringify({ error: 'Invalid JSON' }))
        return
      }

      if (data.type === 'join') {
        const { conversationId } = data
        if (!conversationId) {
          ws.send(JSON.stringify({ error: 'conversationId required to join' }))
          return
        }

        // Leave previous room if any
        if (currentRoom && rooms.has(currentRoom)) {
          rooms.get(currentRoom).delete(ws)
        }

        // Join new room
        currentRoom = conversationId
        if (!rooms.has(conversationId)) {
          rooms.set(conversationId, new Set())
        }
        rooms.get(conversationId).add(ws)

        ws.send(JSON.stringify({ type: 'joined', conversationId }))
        return
      }

      if (data.type === 'message') {
        const { conversationId, senderId, senderName, content } = data
        if (!conversationId || !senderId || !content) {
          ws.send(JSON.stringify({ error: 'conversationId, senderId and content are required' }))
          return
        }

        const payload = JSON.stringify({
          type: 'message',
          conversationId,
          senderId,
          senderName: senderName || 'Unknown',
          content,
          timestamp: new Date().toISOString(),
        })

        // Broadcast to all clients in the room
        const room = rooms.get(conversationId)
        if (room) {
          room.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(payload)
            }
          })
        }
        return
      }

      ws.send(JSON.stringify({ error: `Unknown message type: ${data.type}` }))
    })

    ws.on('close', () => {
      if (currentRoom && rooms.has(currentRoom)) {
        rooms.get(currentRoom).delete(ws)
        if (rooms.get(currentRoom).size === 0) {
          rooms.delete(currentRoom)
        }
      }
    })

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message)
    })
  })

  console.log('✅ WebSocket server initialized')
  return wss
}

module.exports = { setupWebSocket, broadcastToRoom }
