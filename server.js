import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import dotenv from "dotenv";

import { loadFromSSM } from "./utils/loadEnv.js";
import emailRoutes from "./routes/email.routes.js";
import authRoutes from "./routes/auth.routes.js";

async function startServer() {
  if (process.env.NODE_ENV === "production") {
    try {
      await loadFromSSM();
      console.log("✅ Loaded environment variables from AWS SSM");
    } catch (error) {
      console.error("❌ Failed to load from AWS SSM", error);
      process.exit(1); 
    }
  } else {
    dotenv.config();
  }

  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static("public"));

  // routes
  app.use("/api/email", emailRoutes);
  app.use("/auth", authRoutes);

  // Error handling middleware
  app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ success: false, error: "File too large. Maximum size is 10MB." });
      }
    }
    res.status(500).json({ success: false, error: error.message });
  });

  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`✅ Backend running on http://localhost:${PORT}`)
  );
}

startServer();
