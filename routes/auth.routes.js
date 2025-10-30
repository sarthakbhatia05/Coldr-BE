import express from "express";
import { googleAuth, googleCallback } from '../controller/auth.controller.js';

const router = express.Router();
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);



export default router;
