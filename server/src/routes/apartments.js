const express = require('express');
const apartmentController = require('../controllers/apartmentController');

const router = express.Router();

// Create apartment
router.post('/', apartmentController.createApartment);

// Get all apartments
router.get('/', apartmentController.getAllApartments);

// Get apartments with tenant count
router.get('/with-tenants', apartmentController.getApartmentsWithTenants);

// Get apartment by ID
router.get('/:id', apartmentController.getApartmentById);

// Update apartment
router.put('/:id', apartmentController.updateApartment);

// Delete apartment
router.delete('/:id', apartmentController.deleteApartment);

module.exports = router;
