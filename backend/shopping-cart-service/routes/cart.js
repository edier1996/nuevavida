const express = require("express")
const { Cart, CartItem } = require("../db")
const axios = require("axios")

const router = express.Router()

const PRODUCT_SERVICE_URI =
  process.env.PRODUCT_SERVICE_URI || "http://localhost:5001"

// Add Item to Cart
router.post("/:userId/add", async (req, res) => {
  const { userId } = req.params
  const { productId, quantity } = req.body

  try {
    const productResponse = await axios.get(
      `${PRODUCT_SERVICE_URI}/api/products/${productId}`
    )
    if (!productResponse.data) {
      return res.status(404).json({ msg: "Product not found" })
    }

    let cart = await Cart.findOne({ where: { userId } })
    if (!cart) {
      cart = await Cart.create({ userId })
    }

    let cartItem = await CartItem.findOne({ where: { cartId: cart.id, productId } })
    if (cartItem) {
      cartItem.quantity += quantity
      await cartItem.save()
    } else {
      cartItem = await CartItem.create({ cartId: cart.id, productId, quantity })
    }

    res.status(201).json({ cart, item: cartItem })
  } catch (err) {
    res.status(500).send("Server error")
  }
})

// Get User Cart
router.get("/:userId", async (req, res) => {
  const { userId } = req.params
  try {
    const cart = await Cart.findOne({ where: { userId }, include: CartItem })
    if (!cart) return res.status(404).json({ msg: "Cart not found" })
    res.json(cart)
  } catch (err) {
    res.status(500).send("Server error")
  }
})

// Remove Item from Cart
router.delete("/:userId/remove/:productId", async (req, res) => {
  const { userId, productId } = req.params
  try {
    const cart = await Cart.findOne({ where: { userId } })
    if (!cart) return res.status(404).json({ msg: "Cart not found" })

    await CartItem.destroy({ where: { cartId: cart.id, productId } })
    res.json({ msg: "Item removed" })
  } catch (err) {
    res.status(500).send("Server error")
  }
})

// Update Item Quantity
router.put("/:userId/update/:productId", async (req, res) => {
  const { userId, productId } = req.params
  const { quantity } = req.body

  try {
    const cart = await Cart.findOne({ where: { userId } })
    if (!cart) return res.status(404).json({ msg: "Cart not found" })

    const [updatedRowsCount] = await CartItem.update(
      { quantity },
      { where: { cartId: cart.id, productId } }
    )
    if (updatedRowsCount === 0) return res.status(404).json({ msg: "Product not found in cart" })
    res.json({ msg: "Quantity updated" })
  } catch (err) {
    res.status(500).send("Server error")
  }
})

module.exports = router
