import express from "express";
import multer from "multer";
import { getTemplates, sendEmail } from "../controller/email.controller.js";

const router = express.Router();

// Configure multer for file uploads (in memory storage for PDF files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

router.get("/templates", getTemplates);
router.post("/send", upload.single('resume'), sendEmail);

export default router;
