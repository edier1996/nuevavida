const express = require("express")
const { User, TempRegistration, Notification, PageFeedback, sequelize } = require("../db")
const argon2 = require("argon2")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const { Op } = require("sequelize")
const {
  sendPasswordResetEmail,
  sendVerificationEmail,
} = require("../config/email")

const router = express.Router()
const VERIFICATION_EXPIRY_MINUTES = Number(process.env.EMAIL_VERIFICATION_EXPIRES_MINUTES || 15)

const getFriendlyMailError = (mailError) => {
  const code = mailError?.code || ''
  const message = String(mailError?.message || '').toLowerCase()

  if (code === 'BREVO_IP_NOT_AUTHORIZED' || message.includes('brevo bloqueó la ip saliente')) {
    return 'No pudimos enviar el correo por una restricción de IP en Brevo. Contacta al administrador.'
  }

  if (message.includes('timed out')) {
    return 'El servicio de correo tardó demasiado en responder. Intenta nuevamente.'
  }

  return 'No se pudo enviar el correo de verificación. Intenta nuevamente.'
}

// Handle CORS preflight requests
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

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

const adminOnly = async (req, res, next) => {
  try {
    const adminUser = await User.findByPk(req.user)
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }
    req.adminUser = adminUser
    next()
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server error' })
  }
}

const normalizeBaseUrl = (value) => String(value || "").trim().replace(/\/+$/, "")

const getFrontendBaseUrl = () =>
  normalizeBaseUrl(process.env.FRONTEND_URL || "http://localhost:5173")

const getVerificationSecret = () =>
  process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_SECRET

const createVerificationArtifacts = (tempReg) => {
  const payload = {
    type: "email_verification",
    tempRegistrationId: tempReg.id,
    email: tempReg.email,
  }

  const token = jwt.sign(payload, getVerificationSecret(), {
    expiresIn: `${VERIFICATION_EXPIRY_MINUTES}m`,
  })

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
  const tokenExpiry = new Date(Date.now() + VERIFICATION_EXPIRY_MINUTES * 60 * 1000)

  return { token, tokenHash, tokenExpiry }
}

const isTokenHashValid = (token, storedHash) => {
  if (!token || !storedHash) return false
  const incomingHash = crypto.createHash("sha256").update(token).digest("hex")
  const incomingBuffer = Buffer.from(incomingHash)
  const storedBuffer = Buffer.from(storedHash)
  if (incomingBuffer.length !== storedBuffer.length) return false
  return crypto.timingSafeEqual(incomingBuffer, storedBuffer)
}

const issueSessionToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" })

const buildVerificationLink = (token, email) => {
  const frontendBase = getFrontendBaseUrl()
  const tokenParam = encodeURIComponent(token)
  const emailParam = encodeURIComponent(email)
  return `${frontendBase}/verify-email?token=${tokenParam}&email=${emailParam}`
}

const completeRegistrationFromTemp = async (tempReg) => {
  const existingUser = await User.findOne({ where: { email: tempReg.email } })
  if (existingUser && existingUser.isEmailVerified) {
    await tempReg.destroy()
    return { user: existingUser, token: issueSessionToken(existingUser.id), alreadyVerified: true }
  }

  let user = existingUser

  if (user) {
    await user.update({
      name: tempReg.name,
      password: tempReg.password,
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationCodeExpiry: null,
    })
  } else {
    user = await User.create({
      name: tempReg.name,
      email: tempReg.email,
      password: tempReg.password,
      role: "user",
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationCodeExpiry: null,
    })
  }

  await tempReg.destroy()

  try {
    await Notification.findOrCreate({
      where: { externalKey: `welcome-${user.id}` },
      defaults: {
        userId: user.id,
        type: 'system',
        title: 'Bienvenido a Nueva Vida',
        message: `Hola ${user.name}, tu cuenta ya está activa. Ahora puedes explorar, solicitar y compartir ayudas dentro de la comunidad.`,
        actionUrl: '/dashboard',
        metadata: { source: 'registration' },
      },
    })
  } catch (notifErr) {
    console.error('⚠️ Could not create welcome notification (non-fatal):', notifErr.message)
  }

  return {
    user,
    token: issueSessionToken(user.id),
    alreadyVerified: false,
  }
}

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Delete any existing temp registration with this email FIRST
    await TempRegistration.destroy({ where: { email } });

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date(Date.now() + VERIFICATION_EXPIRY_MINUTES * 60000);

    // Create temporary registration (NOT a real user yet)
    const tempReg = await TempRegistration.create({
      name,
      email,
      password,
      verificationCode,
      verificationCodeExpiry,
    });

    const { token: verificationToken, tokenHash, tokenExpiry } = createVerificationArtifacts(tempReg)
    await tempReg.update({
      verificationTokenHash: tokenHash,
      verificationTokenExpiry: tokenExpiry,
    })

    const verificationLink = buildVerificationLink(verificationToken, email)

    // Try to send verification email, but don't fail if it doesn't work
    let emailSent = false;
    let emailError = null;
    try {
      await sendVerificationEmail(email, verificationCode, verificationLink);
      emailSent = true;
      console.log(`✅ Verification email sent to ${email}`);
    } catch (mailError) {
      emailError = getFriendlyMailError(mailError);
      console.error(`❌ Failed to send verification email to ${email}:`, emailError);
      // Don't throw - we still want to return success
    }

    res.status(201).json({
      msg: emailSent
        ? "Verification code and link sent to your email. Please verify to complete registration."
        : "Registration created. Check your email for verification code. If you don't receive it, use 'Resend Code'.",
      email: email,
      tempRegistrationId: tempReg.id,
      emailSent: emailSent,
      emailError: emailSent ? null : emailError,
    });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ error: error.message });
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

// Favorites endpoints
router.get('/:id/favorites', auth, async (req, res) => {
  try {
    const { id } = req.params
    if (String(req.user) !== String(id)) {
      return res.status(403).json({ error: 'No autorizado' })
    }
    const user = await User.findByPk(id, { attributes: ['id', 'favorites'] })
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json({ favorites: user.favorites || [] })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id/favorites', auth, async (req, res) => {
  try {
    const { id } = req.params
    if (String(req.user) !== String(id)) {
      return res.status(403).json({ error: 'No autorizado' })
    }
    const { favorites } = req.body
    if (!Array.isArray(favorites)) return res.status(400).json({ error: 'favorites debe ser un array' })
    await User.update({ favorites }, { where: { id } })
    res.json({ favorites })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Public feedback listing for homepage
router.get('/feedback', async (_req, res) => {
  try {
    const reviews = await PageFeedback.findAll({
      order: [['createdAt', 'DESC']],
      limit: 40,
    })

    const total = await PageFeedback.count()
    const averageRaw = await PageFeedback.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']],
      raw: true,
    })

    const averageRating = Number(averageRaw?.avgRating || 0)

    return res.json({
      reviews,
      summary: {
        averageRating: Number(averageRating.toFixed(1)),
        total,
      },
    })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server error' })
  }
})

// Authenticated users can rate and comment about the platform
router.post('/feedback', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body || {}
    const numericRating = Number(rating)
    const normalizedComment = String(comment || '').trim()

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'La calificacion debe ser un entero entre 1 y 5' })
    }

    if (normalizedComment.length < 8) {
      return res.status(400).json({ error: 'El comentario debe tener al menos 8 caracteres' })
    }

    const user = await User.findByPk(req.user)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const recentDuplicate = await PageFeedback.findOne({
      where: {
        userId: user.id,
        comment: normalizedComment,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 2 * 60 * 1000),
        },
      },
      order: [['createdAt', 'DESC']],
    })

    if (recentDuplicate) {
      return res.status(409).json({ error: 'Ya enviaste este comentario hace un momento' })
    }

    const review = await PageFeedback.create({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      rating: numericRating,
      comment: normalizedComment,
    })

    return res.status(201).json({ review })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server error' })
  }
})

// Update own profile
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    // Only allow users to update their own profile (unless admin)
    const adminUser = await User.findByPk(req.user)
    if (String(req.user) !== String(id) && adminUser?.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para editar este perfil' })
    }

    const { name, phone, city, address } = req.body
    const updates = {}
    if (name !== undefined) updates.name = name
    if (phone !== undefined) updates.phone = phone
    if (city !== undefined) updates.city = city
    if (address !== undefined) updates.address = address

    const [count] = await User.update(updates, { where: { id } })
    if (count === 0) return res.status(404).json({ error: 'Usuario no encontrado' })

    const updated = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'phone', 'city', 'address', 'role'],
    })
    res.json({ user: updated })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/admin/users', auth, adminOnly, async (_req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    })

    res.json({
      users,
      totalUsers: users.length,
    })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' })
  }
})

router.get('/admin/stats', auth, adminOnly, async (_req, res) => {
  try {
    const totalUsers = await User.count()
    const totalByRole = {
      admin: await User.count({ where: { role: 'admin' } }),
      worker: await User.count({ where: { role: 'worker' } }),
      user: await User.count({ where: { role: 'user' } }),
    }

    res.json({ totalUsers, totalByRole })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' })
  }
})

router.post('/admin/users', auth, adminOnly, async (req, res) => {
  try {
    const { name, email, password, phone, city, address, role } = req.body || {}

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' })
    }

    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    const newUser = await User.create({
      name,
      email,
      password,
      phone: phone || null,
      city: city || null,
      address: address || null,
      role: role === 'admin' || role === 'worker' ? role : 'user',
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationCodeExpiry: null,
    })

    try {
      await Notification.findOrCreate({
        where: { externalKey: `admin-created-${newUser.id}` },
        defaults: {
          userId: newUser.id,
          type: 'system',
          title: 'Tu cuenta fue creada por el equipo',
          message: `Hola ${newUser.name}, tu cuenta en Nueva Vida ya fue creada por administración y está lista para usarse.`,
          actionUrl: '/perfil',
          metadata: { source: 'admin-create' },
        },
      })
    } catch (notifErr) {
      console.error('⚠️ Could not create admin notification (non-fatal):', notifErr.message)
    }

    return res.status(201).json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        city: newUser.city,
        address: newUser.address,
        role: newUser.role,
      },
      totalUsers: await User.count(),
    })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' })
  }
})

router.delete('/admin/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const targetId = Number(req.params.id)
    if (Number(req.user) === targetId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario administrador' })
    }

    const userToDelete = await User.findByPk(targetId)
    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' })
    }

    await userToDelete.destroy()

    return res.json({
      success: true,
      totalUsers: await User.count(),
    })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' })
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
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({ error: "Email and verification code are required" });
    }

    // Check if it's a temp registration
    const tempReg = await TempRegistration.findOne({ where: { email } });
    if (!tempReg) {
      return res.status(404).json({ error: "El registro expiró o no existe. Por favor regístrate de nuevo.", code: "REGISTRATION_EXPIRED" });
    }

    if (tempReg.verificationCode !== verificationCode) {
      return res.status(400).json({ error: "Código de verificación incorrecto" });
    }

    if (new Date() > tempReg.verificationCodeExpiry) {
      await tempReg.destroy();
      return res.status(400).json({ error: "El código de verificación expiró. Por favor regístrate de nuevo.", code: "CODE_EXPIRED" });
    }

    const { user, token, alreadyVerified } = await completeRegistrationFromTemp(tempReg);

    res.json({
      msg: alreadyVerified
        ? "Email already verified. Logged in successfully."
        : "Email verified successfully. Account created!",
      token,
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error in verify-email:", error);
    res.status(500).json({ error: error.message });
  }
})

// Verify email with secure token from email link
router.post("/verify-email-token", async (req, res) => {
  try {
    const { token } = req.body || {}

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Verification token is required" })
    }

    let payload
    try {
      payload = jwt.verify(token, getVerificationSecret())
    } catch (error) {
      if (error?.name === "TokenExpiredError") {
        return res.status(400).json({ error: "Verification link has expired. Request a new one." })
      }
      return res.status(400).json({ error: "Invalid verification link" })
    }

    if (payload?.type !== "email_verification" || !payload?.tempRegistrationId || !payload?.email) {
      return res.status(400).json({ error: "Invalid verification link payload" })
    }

    const tempReg = await TempRegistration.findOne({
      where: { id: payload.tempRegistrationId, email: payload.email },
    })

    if (!tempReg) {
      return res.status(404).json({ error: "Verification request not found. Please register again." })
    }

    if (!tempReg.verificationTokenExpiry || new Date() > tempReg.verificationTokenExpiry) {
      await tempReg.destroy()
      return res.status(400).json({ error: "Verification link has expired. Please register again." })
    }

    if (!isTokenHashValid(token, tempReg.verificationTokenHash)) {
      return res.status(400).json({ error: "Verification link is not valid anymore." })
    }

    const { user, token: sessionToken, alreadyVerified } = await completeRegistrationFromTemp(tempReg)

    return res.json({
      msg: alreadyVerified
        ? "Email already verified. Logged in successfully."
        : "Email verified successfully. Account created!",
      token: sessionToken,
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Error in verify-email-token:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Resend verification code
router.post("/resend-verification-code", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if it's a temp registration
    const tempReg = await TempRegistration.findOne({ where: { email } });
    if (!tempReg) {
      return res.status(404).json({ error: "El registro expiró o no existe. Por favor regístrate de nuevo.", code: "REGISTRATION_EXPIRED" });
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date(Date.now() + VERIFICATION_EXPIRY_MINUTES * 60000);

    const { token: verificationToken, tokenHash, tokenExpiry } = createVerificationArtifacts(tempReg)
    const verificationLink = buildVerificationLink(verificationToken, email)

    await TempRegistration.update(
      {
        verificationCode,
        verificationCodeExpiry,
        verificationTokenHash: tokenHash,
        verificationTokenExpiry: tokenExpiry,
      },
      { where: { id: tempReg.id } }
    );

    // Try to send verification email
    let emailSent = false;
    let emailError = null;
    try {
      await sendVerificationEmail(email, verificationCode, verificationLink);
      emailSent = true;
      console.log(`✅ Verification email resent to ${email}`);
    } catch (mailError) {
      emailError = getFriendlyMailError(mailError);
      console.error(`❌ Failed to resend verification email to ${email}:`, emailError);
      // Don't throw - we still want to return success
    }

    res.json({
      msg: emailSent
        ? "Verification code sent to your email"
        : "Code generated but email delivery failed. Check your spam folder or try again.",
      emailSent: emailSent,
      emailError: emailSent ? null : emailError,
    });
  } catch (error) {
    console.error("Error in resend-verification-code:", error);
    res.status(500).json({ error: error.message });
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
