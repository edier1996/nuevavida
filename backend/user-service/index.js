const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const { sequelize, User, TempRegistration } = require('./db')
const userRoutes = require("./routes/user")
const { sendPasswordResetEmail, sendVerificationEmail } = require('./config/email')

const PORT = process.env.PORT || 5000

dotenv.config()
const app = express()

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
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}

// middleware
app.use(express.json())
app.use(cors(corsOptions))
app.options('*', cors(corsOptions)) // Handle preflight requests

// CORS debugging middleware
app.use((req, res, next) => {
  const origin = req.get('origin');
  console.log(`📍 Request from origin: ${origin || 'no origin'}`);
  console.log(`📍 Request method: ${req.method}`);
  console.log(`📍 Request path: ${req.path}`);
  next();
});

// routes
app.use("/api/users", userRoutes)

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

// Test connection and sync
sequelize.authenticate()
  .then(() => {
    console.log('✅ User Service is Connected to MySQL')
    return sequelize.sync({ alter: true })
  })
  .then(async () => {
    console.log('Database synchronized')
    await initAdmin()
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("🚫 Failed to connect to Database -> User Service", err)
  })
