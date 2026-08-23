const Tenant = require('../models/Tenant');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');

const tenantController = {
  // Get all tenants
  async getAllTenants(req, res) {
    const tenants = await Tenant.findAll();
    res.json({
      success: true,
      data: tenants,
      count: tenants.length,
    });
  },

  // Get tenant by ID
  async getTenantById(req, res) {
    const { id } = req.params;
    const tenant = await Tenant.findById(id);

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    res.json({
      success: true,
      data: tenant,
    });
  },

  // Create new tenant
  async createTenant(req, res) {
    const {
      firstName,
      lastName,
      gender,
      email,
      phone,
      apartment_id,
      rentAmount,
      charges,
      depositAmount,
      leaseStartDate,
      leaseEndDate,
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !rentAmount) {
      throw new ValidationError('Missing required fields', [
        'firstName',
        'lastName',
        'email',
        'rentAmount',
      ]);
    }

    if (rentAmount <= 0) {
      throw new ValidationError('Rent amount must be greater than 0');
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
      leaseEndDate,
    };

    let tenant;
    try {
      tenant = await Tenant.create(tenantData);
    } catch (err) {
      if (String(err.message).includes('UNIQUE constraint failed')) {
        throw new ConflictError('Email already exists');
      }
      throw err;
    }

    res.status(201).json({
      success: true,
      data: tenant,
      message: 'Tenant created successfully',
    });
  },

  // Update tenant
  async updateTenant(req, res) {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      gender,
      email,
      phone,
      apartment_id,
      rentAmount,
      charges,
      depositAmount,
      leaseStartDate,
      leaseEndDate,
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !rentAmount) {
      throw new ValidationError('Missing required fields', [
        'firstName',
        'lastName',
        'email',
        'rentAmount',
      ]);
    }

    if (rentAmount <= 0) {
      throw new ValidationError('Rent amount must be greater than 0');
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
      leaseEndDate,
    };

    let tenant;
    try {
      tenant = await Tenant.update(id, tenantData);
    } catch (err) {
      if (String(err.message).includes('not found')) {
        throw new NotFoundError('Tenant not found');
      }
      if (String(err.message).includes('UNIQUE constraint failed')) {
        throw new ConflictError('Email already exists');
      }
      throw err;
    }

    res.json({
      success: true,
      data: tenant,
      message: 'Tenant updated successfully',
    });
  },

  // Delete tenant (soft delete)
  async deleteTenant(req, res) {
    const { id } = req.params;

    try {
      await Tenant.delete(id);
    } catch (err) {
      if (String(err.message).includes('not found')) {
        throw new NotFoundError('Tenant not found');
      }
      throw err;
    }

    res.json({
      success: true,
      message: 'Tenant deleted successfully',
    });
  },
};

module.exports = tenantController;
