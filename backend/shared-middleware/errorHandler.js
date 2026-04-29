// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation error",
      details: Object.values(err.errors).map((e) => e.message),
    })
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid ID format" })
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" })
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired" })
  }

  // Axios/HTTP errors
  if (err.response) {
    return res.status(err.response.status || 500).json({
      error: err.response.data?.message || "Service error",
    })
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  })
}

// Async handler wrapper to catch Promise rejections
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

module.exports = {
  errorHandler,
  asyncHandler,
}