const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');

// GET /api/tenants - Get all tenants
router.get('/', tenantController.getAllTenants);

// GET /api/tenants/:id - Get tenant by ID
router.get('/:id', tenantController.getTenantById);

// POST /api/tenants - Create new tenant
router.post('/', tenantController.createTenant);

// PUT /api/tenants/:id - Update tenant
router.put('/:id', tenantController.updateTenant);

// DELETE /api/tenants/:id - Delete tenant
router.delete('/:id', tenantController.deleteTenant);

module.exports = router;
