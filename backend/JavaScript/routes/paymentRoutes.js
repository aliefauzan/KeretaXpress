import express from 'express';
import multer from 'multer';
import PaymentController from '../controllers/paymentController.js';
import { uploadPaymentProofValidation } from '../utils/validators.js';
import authMiddleware from '../middlerware/authMiddleware.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
});

// Payment proof upload route
router.post(
  '/:id/upload', 
  authMiddleware, 
  upload.single('proof'),
  uploadPaymentProofValidation,
  PaymentController.uploadProof
);

export default router;
