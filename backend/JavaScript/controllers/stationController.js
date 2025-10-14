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
        error: 'An error occurred while fetching stations' 
      });
    }
  }

  // Get station by ID
  static async show(req, res) {
    try {
      const { id } = req.params;
      const station = await Station.findById(id);
      
      if (!station) {
        return res.status(404).json({ message: 'Station not found' });
      }

      return res.status(200).json(station);
    } catch (error) {
      console.error('Station fetch error:', error);
      return res.status(500).json({ 
        error: 'An error occurred while fetching station' 
      });
    }
  }

  // Create new station (if needed for admin)
  static async create(req, res) {
    try {
      const { name, city, address } = req.body;
      
      if (!name || !city) {
        return res.status(422).json({ 
          errors: [{ message: 'Name and city are required' }] 
        });
      }

      const station = await Station.create({ name, city, address });
      return res.status(201).json(station);
    } catch (error) {
      console.error('Station create error:', error);
      return res.status(500).json({ 
        error: 'An error occurred while creating station' 
      });
    }
  }
}

export default StationController;
