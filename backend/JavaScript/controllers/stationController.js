import Station from '../models/Station.js';

class StationController {
  // Get all stations
  static async index(req, res) {
    try {
      const stations = await Station.getAll();
      return res.status(200).json(stations);
    } catch (error) {
      console.error('Stations fetch error:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch stations. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get station by ID
  static async show(req, res) {
    try {
      const { id } = req.params;
      
      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid station ID' });
      }
      
      const station = await Station.findById(id);
      
      if (!station) {
        return res.status(404).json({ message: 'Station not found' });
      }

      return res.status(200).json(station);
    } catch (error) {
      console.error('Station fetch error:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch station details. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create new station (if needed for admin)
  static async create(req, res) {
    try {
      const { name, city, address } = req.body;
      
      if (!name || !city) {
        return res.status(422).json({ 
          errors: {
            name: !name ? ['Station name is required'] : undefined,
            city: !city ? ['City is required'] : undefined
          }
        });
      }

      // Check for duplicate station name in the same city
      const existingStation = await Station.findByNameAndCity(name, city);
      if (existingStation) {
        return res.status(422).json({ 
          errors: {
            name: ['A station with this name already exists in this city']
          }
        });
      }

      const station = await Station.create({ name, city, address });
      return res.status(201).json(station);
    } catch (error) {
      console.error('Station create error:', error);
      
      // Handle database unique constraint errors
      if (error.code === '23505') {
        return res.status(422).json({ 
          message: 'A station with this name already exists',
          errors: {
            name: ['Station name must be unique']
          }
        });
      }
      
      return res.status(500).json({ 
        message: 'Failed to create station. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default StationController;
