const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const { sequelize, User, TempRegistration } = require('./db')
const userRoutes = require("./routes/user")
const { sendPasswordResetEmail, sendVerificationEmail } = require('./config/email')

const PORT = process.env.PORT || 5000

dotenv.config()
const app = express()
let dbReady = false
let lastDbError = null

// CORS configuration
const allowedOrigins = [
  "https://nuevavida1327.com",
  "https://www.nuevavida1327.com",
  "http://localhost:8080",
  "http://localhost:5173",
]

const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server/no-origin requests and browser origins in allowlist.
    if (!origin) return callback(null, true)
    const isRailwayDomain = /^https:\/\/[^/]+\.up\.railway\.app$/.test(origin)
    if (allowedOrigins.includes(origin) || isRailwayDomain) {
      return callback(null, true)
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`), false)
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: false,
  optionsSuccessStatus: 204,
}

// middleware - CORS MUST be first
app.use(cors(corsOptions))
app.options('*', cors(corsOptions)) // Handle preflight requests BEFORE routes
app.use(express.json())

// CORS debugging middleware
app.use((req, res, next) => {
  const origin = req.get('origin');
  console.log(`📍 Request from origin: ${origin || 'no origin'}`);
  console.log(`📍 Request method: ${req.method}`);
  console.log(`📍 Request path: ${req.path}`);
  next();
});

// routes - AFTER middleware
app.use("/api/users", userRoutes)

app.get('/api/users/health', (_req, res) => {
  if (dbReady) {
    return res.status(200).json({ status: 'ok', db: 'connected' })
  }

  return res.status(503).json({
    status: 'degraded',
    db: 'disconnected',
    error: lastDbError,
  })
})

// Seed the default admin user if it doesn't already exist
const initAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({
      where: { email: 'nuevavida1327@gmail.com' }
    });

    if (!existingAdmin) {
      await User.create({
        name: 'Administrador',
        email: 'nuevavida1327@gmail.com',
        password: 'nevavida13272026',
        role: 'admin',
        isEmailVerified: true,
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error initializing admin user:', error.message);
  }
};

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ User Service is Connected to MySQL')
    await sequelize.sync()
    console.log('Database synchronized')
    await initAdmin()
    dbReady = true
    lastDbError = null
  } catch (err) {
    dbReady = false
    lastDbError = err?.message || 'Unknown DB error'
    console.error("🚫 Failed to connect to Database -> User Service", err)
    // Keep process alive and retry to avoid 502 from Railway edge.
    setTimeout(() => {
      initializeDatabase().catch(() => {})
    }, 10000)
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  initializeDatabase().catch(() => {})
})
