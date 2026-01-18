import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import multer from "multer";
import { loadFromSSM } from "./utils/loadEnv.js";
import emailRoutes from "./routes/email.routes.js";
import authRoutes from './routes/auth.routes.js';

dotenv.config();

// Only load from SSM in production (on EC2)
if (process.env.NODE_ENV !== 'local') {
  try {
    await loadFromSSM();
    console.log('✅ Loaded environment variables from AWS SSM');
  } catch (error) {
    console.error('⚠️  Failed to load from SSM, using .env file:', error.message);
  }
} else {
  console.log('🔧 Running in development mode, using .env file');
}


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// routes
app.use("/api/email", emailRoutes);
app.use('/auth', authRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File too large. Maximum size is 10MB.' });
    }
  }
  res.status(500).json({ success: false, error: error.message });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));
