const Apartment = require('../models/Apartment');

const apartmentController = {
  // Create new apartment
  async createApartment(req, res) {
    try {
      const { name, address, city, postalCode, description } = req.body;

      // Validation
      if (!name || !address || !city || !postalCode) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['name', 'address', 'city', 'postalCode']
        });
      }

      const apartment = await Apartment.create({
        name,
        address,
        city,
        postalCode,
        description
      });

      res.status(201).json({
        success: true,
        data: apartment,
        message: 'Apartment created successfully'
      });
    } catch (error) {
      console.error('Error creating apartment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create apartment',
        message: error.message
      });
    }
  },

  // Get all apartments
  async getAllApartments(req, res) {
    try {
      const apartments = await Apartment.findWithTenants();
      res.json({
        success: true,
        data: apartments,
        count: apartments.length
      });
    } catch (error) {
      console.error('Error fetching apartments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch apartments',
        message: error.message
      });
    }
  },

  // Get apartments with tenant count
  async getApartmentsWithTenants(req, res) {
    try {
      const apartments = await Apartment.findWithTenants();
      res.json({
        success: true,
        data: apartments,
        count: apartments.length
      });
    } catch (error) {
      console.error('Error fetching apartments with tenants:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch apartments',
        message: error.message
      });
    }
  },

  // Get apartment by ID
  async getApartmentById(req, res) {
    try {
      const { id } = req.params;
      const apartment = await Apartment.findById(id);

      if (!apartment) {
        return res.status(404).json({
          success: false,
          error: 'Apartment not found'
        });
      }

      res.json({
        success: true,
        data: apartment
      });
    } catch (error) {
      console.error('Error fetching apartment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch apartment',
        message: error.message
      });
    }
  },

  // Update apartment
  async updateApartment(req, res) {
    try {
      const { id } = req.params;
      const { name, address, city, postalCode, description } = req.body;

      // Validation
      if (!name || !address || !city || !postalCode) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['name', 'address', 'city', 'postalCode']
        });
      }

      const apartment = await Apartment.update(id, {
        name,
        address,
        city,
        postalCode,
        description
      });

      res.json({
        success: true,
        data: apartment,
        message: 'Apartment updated successfully'
      });
    } catch (error) {
      console.error('Error updating apartment:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Apartment not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update apartment',
        message: error.message
      });
    }
  },

  // Delete apartment
  async deleteApartment(req, res) {
    try {
      const { id } = req.params;
      
      await Apartment.delete(id);
      
      res.json({
        success: true,
        message: 'Apartment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting apartment:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Apartment not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete apartment',
        message: error.message
      });
    }
  }
};

module.exports = apartmentController;
