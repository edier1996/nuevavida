const express = require("express")
const { Product } = require("../db")

const router = express.Router()

// Handle CORS preflight requests
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Create Product
router.post("/create", async (req, res) => {
  const {
    title,
    name,
    description,
    category,
    price,
    isGift,
    condition,
    images,
    city,
    sellerId,
    sellerEmail,
    sellerName,
    sellerAvatar,
    status,
    donationStatus,
    sold,
    commission,
    stock,
  } = req.body
  try {
    const newProduct = await Product.create({
      title: title || name,
      name: name || title,
      description,
      price: price ?? 0,
      isGift: isGift ?? true,
      condition: condition || "bueno",
      category,
      images: images || [],
      city: city || "",
      sellerId,
      sellerEmail,
      sellerName: sellerName || "Usuario",
      sellerAvatar: sellerAvatar || "",
      status: status || "active",
      donationStatus: donationStatus || "disponible",
      sold: sold ?? false,
      commission: commission ?? 0,
      stock: stock ?? 0,
    })
    res.status(201).json(newProduct)
  } catch (err) {
    console.error("Error creating product:", err)
    res.status(500).json({
      error: err?.original?.sqlMessage || err?.message || "Server error",
    })
  }
})

// Get All Products
router.get("/", async (req, res) => {
  try {
    const products = await Product.findAll()
    res.json(products)
  } catch (err) {
    res.status(500).send("Server error")
  }
})

// Get Product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)
    if (!product) return res.status(404).json({ msg: "Product not found" })
    res.json(product)
  } catch (err) {
    res.status(500).send("Server error")
  }
})

// Update Product
router.put("/:id", async (req, res) => {
  const {
    title,
    name,
    description,
    category,
    price,
    isGift,
    condition,
    images,
    city,
    sellerId,
    sellerEmail,
    sellerName,
    sellerAvatar,
    status,
    donationStatus,
    sold,
    commission,
    stock,
  } = req.body

  const updates = {
    title: title || name,
    name: name || title,
    description,
    category,
    price,
    isGift,
    condition,
    images,
    city,
    sellerId,
    sellerEmail,
    sellerName,
    sellerAvatar,
    status,
    donationStatus,
    sold,
    commission,
    stock,
  }

  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) {
      delete updates[key]
    }
  })

  try {
    const [updatedRowsCount] = await Product.update(
      updates,
      { where: { id: req.params.id } }
    )

    if (updatedRowsCount === 0)
      return res.status(404).json({ msg: "Product not found" })
    
    const updatedProduct = await Product.findByPk(req.params.id)
    res.json(updatedProduct)
  } catch (err) {
    res.status(500).send("Server error")
  }
})

// Delete Product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)
    if (!product) return res.status(404).json({ msg: "Product not found" })
    
    await product.destroy()
    res.json({ msg: "Product deleted" })
  } catch (err) {
    res.status(500).send("Server error")
  }
})

// Deduct Stock
router.put("/:id/deduct", async (req, res) => {
  const { quantity } = req.body
  try {
    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive number" })
    }

    const product = await Product.findByPk(req.params.id)
    if (!product) return res.status(404).json({ msg: "Product not found" })
    if (product.stock < quantity) return res.status(400).json({ msg: "Insufficient stock" })
    
    product.stock -= quantity
    await product.save()
    res.json({
      success: true,
      message: `Stock reduced by ${quantity}`,
      product,
    })
  } catch (err) {
    res.status(500).send("Server error")
  }
})

// Restore Stock (for order cancellations)
router.put("/:id/restore", async (req, res) => {
  const { quantity } = req.body
  try {
    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive number" })
    }

    const product = await Product.findByPk(req.params.id)
    if (!product) return res.status(404).json({ msg: "Product not found" })
    
    product.stock += quantity
    await product.save()
    res.json({
      success: true,
      message: `Stock restored by ${quantity}`,
      product,
    })
  } catch (err) {
    res.status(500).send("Server error")
  }
})

module.exports = router
