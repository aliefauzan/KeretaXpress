import { validationResult } from 'express-validator';
import Booking from '../models/Booking.js';
import supabaseService from '../services/supabaseService.js';
import fs from 'fs';

class PaymentController {
  // Upload payment proof
  static async uploadProof(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Format errors to match Laravel format
        const formattedErrors = {};
        errors.array().forEach(error => {
          const field = error.path || error.param;
          if (!formattedErrors[field]) {
            formattedErrors[field] = [];
          }
          formattedErrors[field].push(error.msg);
        });
        
        return res.status(422).json({ errors: formattedErrors });
      }

      const { id } = req.params; // Transaction ID

      // Check if file was uploaded
      if (!req.file) {
        return res.status(422).json({ 
          errors: {
            proof: ['Payment proof image is required']
          }
        });
      }

      // Get authenticated user
      const user = req.user;

      // Find booking
      const booking = await Booking.findByTransactionId(id);
      if (!booking) {
        // Clean up uploaded file
        if (req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Check if booking belongs to user
      if (booking.user_uuid !== user.uuid) {
        // Clean up uploaded file
        if (req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Create file path in storage
      const timestamp = Date.now();
      const fileExtension = req.file.originalname.split('.').pop();
      const filePath = `payments/${user.uuid}/${timestamp}.${fileExtension}`;

      // Read file buffer
      const fileBuffer = fs.readFileSync(req.file.path);

      // Upload to Supabase Storage
      await supabaseService.uploadFile(
        supabaseService.bucket,
        filePath,
        fileBuffer
      );

      // Get public URL
      const publicUrl = supabaseService.getPublicUrl(supabaseService.bucket, filePath);

      // Update booking with payment proof
      const updatedBooking = await Booking.updatePaymentProof(id, publicUrl, 'confirmed');

      // Clean up uploaded file from local storage
      fs.unlinkSync(req.file.path);

      return res.status(200).json({ 
        url: publicUrl,
        booking: updatedBooking 
      });
    } catch (error) {
      console.error('Payment proof upload error:', error);
      
      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error('File cleanup error:', cleanupError);
        }
      }
      
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export default PaymentController;
