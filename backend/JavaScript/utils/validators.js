import { body, query, param } from 'express-validator';

// Auth validations
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3, max: 255 }).withMessage('Name must be between 3 and 255 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('password_confirmation')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Train validations
export const searchTrainValidation = [
  query('departure_station')
    .notEmpty().withMessage('Departure station is required')
    .isInt().withMessage('Departure station must be a valid ID'),
  query('arrival_station')
    .notEmpty().withMessage('Arrival station is required')
    .isInt().withMessage('Arrival station must be a valid ID'),
  query('date')
    .notEmpty().withMessage('Date is required')
    .isDate().withMessage('Must be a valid date')
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const searchDate = new Date(value);
      searchDate.setHours(0, 0, 0, 0);
      if (searchDate < today) {
        throw new Error('Date must be today or in the future');
      }
      return true;
    })
];

// Booking validations
export const createBookingValidation = [
  body('user_uuid')
    .notEmpty().withMessage('User UUID is required')
    .isUUID().withMessage('Must be a valid UUID'),
  body('train_id')
    .notEmpty().withMessage('Train ID is required')
    .isInt().withMessage('Train ID must be a valid integer'),
  body('travel_date')
    .notEmpty().withMessage('Travel date is required')
    .isDate().withMessage('Must be a valid date'),
  body('passenger_name')
    .trim()
    .notEmpty().withMessage('Passenger name is required')
    .isLength({ min: 3 }).withMessage('Passenger name must be at least 3 characters'),
  body('passenger_id_number')
    .trim()
    .notEmpty().withMessage('Passenger ID number is required'),
  body('passenger_dob')
    .notEmpty().withMessage('Passenger date of birth is required')
    .isDate().withMessage('Must be a valid date'),
  body('passenger_gender')
    .notEmpty().withMessage('Passenger gender is required')
    .isIn(['male', 'female']).withMessage('Gender must be either male or female'),
  body('payment_method')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['transfer']).withMessage('Payment method must be transfer'),
  body('seat_number')
    .trim()
    .notEmpty().withMessage('Seat number is required')
];

export const bookingHistoryValidation = [
  query('user_uuid')
    .notEmpty().withMessage('User UUID is required')
    .isUUID().withMessage('Must be a valid UUID')
];

export const updateBookingStatusValidation = [
  param('transactionId')
    .notEmpty().withMessage('Transaction ID is required'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'cancelled', 'paid'])
    .withMessage('Status must be one of: pending, confirmed, cancelled, paid')
];

// Payment validations
export const uploadPaymentProofValidation = [
  param('id')
    .notEmpty().withMessage('Transaction ID is required')
];
