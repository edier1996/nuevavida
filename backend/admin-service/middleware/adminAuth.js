const jwt = require('jsonwebtoken')

/**
 * Middleware that verifies the request carries a valid JWT and that
 * the decoded payload contains role === 'admin'.
 *
 * The JWT_SECRET env var must match the one used by the user-service.
 * Admins receive a token with { userId, role: 'admin' } in the payload.
 */
const adminAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied: admin role required' })
    }

    req.admin = decoded
    next()
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' })
  }
}

module.exports = adminAuth
