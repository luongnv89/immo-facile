const Tenant = require('../models/Tenant');

const tenantController = {
  // Get all tenants
  async getAllTenants(req, res) {
    try {
      const tenants = await Tenant.findAll();
      res.json({
        success: true,
        data: tenants,
        count: tenants.length
      });
    } catch (error) {
      console.error('Error fetching tenants:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tenants',
        message: error.message
      });
    }
  },

  // Get tenant by ID
  async getTenantById(req, res) {
    try {
      const { id } = req.params;
      const tenant = await Tenant.findById(id);
      
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
      }

      res.json({
        success: true,
        data: tenant
      });
    } catch (error) {
      console.error('Error fetching tenant:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tenant',
        message: error.message
      });
    }
  },

  // Create new tenant
  async createTenant(req, res) {
    try {
      const { firstName, lastName, gender, email, phone, apartment_id, rentAmount, charges, depositAmount, leaseStartDate, leaseEndDate } = req.body;

      // Validation
      if (!firstName || !lastName || !email || !rentAmount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['firstName', 'lastName', 'email', 'rentAmount']
        });
      }

      if (rentAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Rent amount must be greater than 0'
        });
      }

      const tenantData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: gender || 'M',
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        address: 'N/A', // Backward compatibility - address now handled by apartment relationship
        apartment_id: apartment_id || null,
        rentAmount: parseFloat(rentAmount),
        charges: charges ? parseFloat(charges) : 0,
        depositAmount: depositAmount ? parseFloat(depositAmount) : 0,
        leaseStartDate,
        leaseEndDate
      };

      const tenant = await Tenant.create(tenantData);
      
      res.status(201).json({
        success: true,
        data: tenant,
        message: 'Tenant created successfully'
      });
    } catch (error) {
      console.error('Error creating tenant:', error);
      
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists',
          message: 'A tenant with this email already exists'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create tenant',
        message: error.message
      });
    }
  },

  // Update tenant
  async updateTenant(req, res) {
    try {
      const { id } = req.params;
      const { firstName, lastName, gender, email, phone, apartment_id, rentAmount, charges, depositAmount, leaseStartDate, leaseEndDate } = req.body;

      // Validation
      if (!firstName || !lastName || !email || !rentAmount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['firstName', 'lastName', 'email', 'rentAmount']
        });
      }

      if (rentAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Rent amount must be greater than 0'
        });
      }

      const tenantData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: gender || 'M',
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        address: 'N/A', // Backward compatibility - address now handled by apartment relationship
        apartment_id: apartment_id || null,
        rentAmount: parseFloat(rentAmount),
        charges: charges ? parseFloat(charges) : 0,
        depositAmount: depositAmount ? parseFloat(depositAmount) : 0,
        leaseStartDate,
        leaseEndDate
      };

      const tenant = await Tenant.update(id, tenantData);
      
      res.json({
        success: true,
        data: tenant,
        message: 'Tenant updated successfully'
      });
    } catch (error) {
      console.error('Error updating tenant:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
      }

      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists',
          message: 'Another tenant with this email already exists'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update tenant',
        message: error.message
      });
    }
  },

  // Delete tenant (soft delete)
  async deleteTenant(req, res) {
    try {
      const { id } = req.params;
      
      await Tenant.delete(id);
      
      res.json({
        success: true,
        message: 'Tenant deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting tenant:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete tenant',
        message: error.message
      });
    }
  }
};

module.exports = tenantController;
