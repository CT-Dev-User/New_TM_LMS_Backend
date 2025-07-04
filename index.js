

// import { v2 as cloudinary } from 'cloudinary';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import express from 'express';
// import Razorpay from 'razorpay';
// import { conn } from './database/db.js';

// // Load environment variables
// dotenv.config();

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Razorpay instance
// export const instance = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// // Initialize Express app
// const app = express();

// // Middlewares
// app.use(cors({
//   origin: process.env.NODE_ENV === 'production' ? 'https://your-production-url.com' : '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'token'],
// }));

// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ limit: '10mb', extended: true }));

// // Health check endpoint
// app.get('/', (req, res) => {
//   res.send('Server is working');
// });

// // Routes
// import adminRoutes from './routes/admin.js';
// import courseRoutes from './routes/course.js';
// import questionRoutes from './routes/CourseQ.js';
// import instructorRoutes from './routes/instructor.js';
// import userRoutes from './routes/user.js';

// app.use('/api', userRoutes);
// app.use('/api', courseRoutes);
// app.use('/api', adminRoutes);
// app.use('/api', instructorRoutes);
// app.use('/api', questionRoutes);

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error('Server error:', err.stack);
//   res.status(500).json({ message: 'Internal Server Error', error: err.message });
// });

// // Database connection with timeout
// let isConnected = false;

// const connectToDatabase = async () => {
//   if (isConnected) {
//     return;
//   }
  
//   try {
//     await conn();
//     isConnected = true;
//     console.log('Database connected');
//   } catch (error) {
//     console.error('Database connection failed:', error);
//     throw error;
//   }
// };

// // Vercel serverless handler
// export default async function handler(req, res) {
//   try {
//     // Connect to database with timeout
//     const dbTimeout = setTimeout(() => {
//       throw new Error('Database connection timeout');
//     }, 8000);
    
//     await connectToDatabase();
//     clearTimeout(dbTimeout);
    
//     // Handle the request
//     return app(req, res);
//   } catch (error) {
//     console.error('Handler error:', error);
//     return res.status(500).json({ 
//       message: 'Internal Server Error', 
//       error: error.message 
//     });
//   }
// }

import { v2 as cloudinary } from 'cloudinary';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import Razorpay from 'razorpay';
import { conn } from './database/db.js';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Razorpay instance
export const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Initialize Express app
const app = express();

// === ✅ CORS Configuration ===
const allowedOrigins = [
  'https://main.d38etjdofoghg2.amplifyapp.com', // Your Amplify frontend
  'http://localhost:3000' // Optional: local dev
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// === Routes ===
import adminRoutes from './routes/admin.js';
import courseRoutes from './routes/course.js';
import questionRoutes from './routes/CourseQ.js';
import instructorRoutes from './routes/instructor.js';
import userRoutes from './routes/user.js';

app.use('/api', userRoutes);
app.use('/api', courseRoutes);
app.use('/api', adminRoutes);
app.use('/api', instructorRoutes);
app.use('/api', questionRoutes);

// === Health check ===
app.get('/', (req, res) => {
  res.send('✅ Server is working');
});

// === Error Handler ===
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: err.message
  });
});

// === DB + Server Start ===
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await conn();
    console.log('✅ Database connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
