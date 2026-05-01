const express = require("express")
const { User } = require("../db")
const argon2 = require("argon2")
const jwt = require("jsonwebtoken")
const { sendPasswordResetEmail, sendVerificationEmail } = require("../config/email")

const router = express.Router()

// Middleware for JWT authentication
const auth = (req, res, next) => {
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

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" })
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationCodeExpiry = new Date(Date.now() + 15 * 60000) // 15 minutes

    // Create user (not verified yet)
    const user = await User.create({
      name,
      email,
      password,
      role: 'user',
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpiry: verificationCodeExpiry,
    })

    // Send verification email
    await sendVerificationEmail(email, verificationCode)

    res.status(201).json({
      msg: "User created. Check your email for verification code.",
      userId: user.id,
      email: user.email,
    })
  } catch (error) {
    console.error("Error in register:", error)
    res.status(500).json({ error: error.message })
  }
})

// Login a user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(400).json({ error: "No user with this email was found" })
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ error: "Please verify your email before logging in" })
    }

    const isMatch = await argon2.verify(user.password, password)
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" })

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    })

    res.json({
      token,
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get user profile
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } })
    if (!user) return res.status(404).json({ msg: "User not found" })
    res.json(user)
  } catch (err) {
    res.status(500).send("Server error")
  }
})

// Update user profile
router.put("/:id", auth, async (req, res) => {
  const { name, email } = req.body
  try {
    const [updatedRowsCount] = await User.update(
      { name, email },
      { where: { id: req.params.id } }
    )
    if (updatedRowsCount === 0) return res.status(404).json({ msg: "User not found" })
    const updatedUser = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } })
    res.json(updatedUser)
  } catch (err) {
    res.status(500).send("Server error")
  }
})

// Verify email with code
router.post("/verify-email", async (req, res) => {
  try {
    const { email, verificationCode } = req.body

    if (!email || !verificationCode) {
      return res.status(400).json({ error: "Email and verification code are required" })
    }

    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    if (user.isEmailVerified) {
      return res.json({ msg: "Email already verified" })
    }

    if (user.emailVerificationCode !== verificationCode) {
      return res.status(400).json({ error: "Invalid verification code" })
    }

    if (new Date() > user.emailVerificationCodeExpiry) {
      return res.status(400).json({ error: "Verification code has expired" })
    }

    // Mark email as verified
    await User.update(
      {
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationCodeExpiry: null,
      },
      { where: { id: user.id } }
    )

    res.json({ msg: "Email verified successfully" })
  } catch (error) {
    console.error("Error in verify-email:", error)
    res.status(500).json({ error: error.message })
  }
})

// Resend verification code
router.post("/resend-verification-code", async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: "Email is required" })
    }

    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    if (user.isEmailVerified) {
      return res.json({ msg: "Email already verified" })
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationCodeExpiry = new Date(Date.now() + 15 * 60000) // 15 minutes

    await User.update(
      {
        emailVerificationCode: verificationCode,
        emailVerificationCodeExpiry: verificationCodeExpiry,
      },
      { where: { id: user.id } }
    )

    // Send verification email
    await sendVerificationEmail(email, verificationCode)

    res.json({ msg: "Verification code sent to your email" })
  } catch (error) {
    console.error("Error in resend-verification-code:", error)
    res.status(500).json({ error: error.message })
  }
})

// Forgot password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: "Email is required" })
    }

    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ error: "Please verify your email first" })
    }

    // Generate reset token and link
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" })
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`

    await sendPasswordResetEmail(email, resetToken, resetLink)

    res.json({ msg: "Password reset email sent" })
  } catch (error) {
    console.error("Error in forgot-password:", error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
