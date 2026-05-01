const express = require("express")
const { User } = require("../db")
const argon2 = require("argon2")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const { sendPasswordResetEmail } = require("../config/email")

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
    const { name, email, password, role } = req.body

    let user = await User.findOne({ where: { email } })
    if (user) {
      return res.status(400).json({ error: "User already exists" })
    }

    const normalizedRole = ["user", "admin", "worker"].includes(role) ? role : "user"

    user = await User.create({ name, email, password, role: normalizedRole })

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

// Login a user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(400).json({ error: "No user with this email was found" })
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

// Request a password reset link
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ msg: "Si el email existe, recibirás un enlace para recuperar tu contraseña" });
    }

    // Generate reset token (random 32 char hex string)
    const resetToken = crypto.randomBytes(16).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await User.update(
      { resetToken, resetTokenExpiry },
      { where: { id: user.id } }
    );

    // Send email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
    await sendPasswordResetEmail(email, resetToken, resetLink);

    res.json({ msg: "Si el email existe, recibirás un enlace para recuperar tu contraseña" });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    res.status(500).json({ error: error.message });
  }
});

// Reset password using a valid token
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: "Email, token, and newPassword are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || user.resetToken !== token) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    if (new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ error: "Reset token has expired" });
    }

    // Update password and clear reset token
    // individualHooks: true ensures the beforeUpdate hook runs to hash the new password
    await User.update(
      { password: newPassword, resetToken: null, resetTokenExpiry: null },
      { where: { id: user.id }, individualHooks: true }
    );

    res.json({ msg: "Password reset successfully" });
  } catch (error) {
    console.error("Error in reset-password:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router
