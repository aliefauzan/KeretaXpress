import { validationResult } from 'express-validator';
import Train from '../models/Train.js';
import supabaseService from '../services/supabaseService.js';

class TrainController {
  // Search trains
  static async search(req, res) {
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

      const { departure_station, arrival_station, date } = req.query;

      // Validate different stations
      if (departure_station === arrival_station) {
        return res.status(422).json({ 
          errors: {
            arrival_station: ['Arrival station must be different from departure station']
          }
        });
      }

      // Search trains
      const trains = await Train.search({
        departureStationId: departure_station,
        arrivalStationId: arrival_station,
        date
      });

      if (trains.length === 0) {
        return res.status(200).json({
          message: 'No trains found for the selected criteria',
          trains: []
        });
      }

      return res.status(200).json({ trains });
    } catch (error) {
      console.error('Train search error:', error);
      return res.status(500).json({ 
        error: 'An error occurred while searching for trains' 
      });
    }
  }

  // Get all trains
  static async allTrains(req, res) {
    try {
      const trains = await Train.getAll();

      if (trains.length === 0) {
        return res.status(200).json({
          message: 'No trains available',
          trains: []
        });
      }

      return res.status(200).json({ trains });
    } catch (error) {
      console.error('All trains fetch error:', error);
      return res.status(500).json({ 
        error: 'An error occurred while fetching trains' 
      });
    }
  }

  // Get promotional trains
  static async getPromoTrains(req, res) {
    try {
      const trains = await Train.getPromoTrains();

      if (trains.length === 0) {
        return res.status(200).json({
          message: 'No promotional trains available',
          trains: []
        });
      }

      return res.status(200).json(trains);
    } catch (error) {
      console.error('Promo trains fetch error:', error);
      return res.status(500).json({ 
        error: 'An error occurred while fetching promotional trains' 
      });
    }
  }

  // Get available seats for a train
  static async availableSeats(req, res) {
    try {
      const { id } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ error: 'Date is required' });
      }

      // Check if train exists
      const train = await Train.findById(id);
      if (!train) {
        return res.status(404).json({ error: 'Train not found' });
      }

      // Get available seats
      const availableSeats = await Train.getAvailableSeats(id, date);

      return res.status(200).json({ available_seats: availableSeats });
    } catch (error) {
      console.error('Available seats fetch error:', error);
      return res.status(500).json({ 
        error: 'An error occurred while fetching available seats' 
      });
    }
  }

  // Get train by ID
  static async show(req, res) {
    try {
      const { id } = req.params;
      const train = await Train.findById(id);

      if (!train) {
        return res.status(404).json({ error: 'Train not found' });
      }

      return res.status(200).json(train);
    } catch (error) {
      console.error('Train fetch error:', error);
      return res.status(500).json({ 
        error: 'An error occurred while fetching train' 
      });
    }
  }
}

export default TrainController;
