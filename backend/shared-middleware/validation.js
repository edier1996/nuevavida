// Validation middleware for common endpoints
const validateCreateProduct = (req, res, next) => {
  const { name, description, price, category, stock } = req.body
  
  if (!name || !description || !price || !category) {
    return res.status(400).json({ 
      error: "Missing required fields: name, description, price, category" 
    })
  }
  
  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: "Price must be a positive number" })
  }
  
  if (typeof stock !== 'number' || stock < 0) {
    return res.status(400).json({ error: "Stock must be a non-negative number" })
  }
  
  next()
}

const validateDeductStock = (req, res, next) => {
  const { quantity } = req.body
  
  if (typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ error: "Quantity must be a positive number" })
  }
  
  next()
}

const validateOrderCreation = (req, res, next) => {
  const { items, totalAmount, shippingAddress } = req.body
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Items must be a non-empty array" })
  }
  
  if (typeof totalAmount !== 'number' || totalAmount <= 0) {
    return res.status(400).json({ error: "Total amount must be positive" })
  }
  
  if (!shippingAddress || typeof shippingAddress !== 'string') {
    return res.status(400).json({ error: "Shipping address is required" })
  }
  
  for (let item of items) {
    if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
      return res.status(400).json({ 
        error: "Each item must have productId and quantity" 
      })
    }
  }
  
  next()
}

const validateUserRegistration = (req, res, next) => {
  const { name, email, password } = req.body
  
  if (!name || !email || !password) {
    return res.status(400).json({ 
      error: "Missing required fields: name, email, password" 
    })
  }
  
  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" })
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" })
  }
  
  next()
}

const validateUserLogin = (req, res, next) => {
  const { email, password } = req.body
  
  if (!email || !password) {
    return res.status(400).json({ 
      error: "Email and password are required" 
    })
  }
  
  next()
}

module.exports = {
  validateCreateProduct,
  validateDeductStock,
  validateOrderCreation,
  validateUserRegistration,
  validateUserLogin,
}