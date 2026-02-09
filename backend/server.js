const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const reportsRoutes = require('./routes/reports');
const inventoryRoutes = require('./routes/inventory');
const expensesRoutes = require('./routes/expenses');
const shiftsRoutes = require('./routes/shifts');
const deliveriesRoutes = require('./routes/deliveries');
const creditRoutes = require('./routes/credit');
const pricesRoutes = require('./routes/prices');

// Import middleware
const { errorHandler, notFound } = require('./middleware/error');

// Import database
const { sequelize } = require('./models');
const { scheduleBackups } = require('./utils/backup');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Wakaruku Petrol Station Management System API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      sales: '/api/sales',
      reports: '/api/reports',
      inventory: '/api/inventory',
      expenses: '/api/expenses',
      shifts: '/api/shifts',
      deliveries: '/api/deliveries',
      credit: '/api/credit',
      prices: '/api/prices'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/credit', creditRoutes);
app.use('/api/prices', pricesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database sync and server start
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync database models
    await sequelize.sync({ alter: true });
    console.log('Database synchronized.');

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Initialize backup scheduler
      scheduleBackups();
    });

  } catch (error) {
    console.error('Unable to connect to database:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();