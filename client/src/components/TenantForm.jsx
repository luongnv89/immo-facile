import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTenant, updateTenant, clearSelectedTenant } from '../store/slices/tenantSlice';
import { fetchApartments } from '../store/slices/apartmentSlice';
import { addNotification } from '../store/slices/uiSlice';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const TenantForm = () => {
  const dispatch = useDispatch();
  const { selectedTenant, loading } = useSelector(state => state.tenants);
  const { items: apartments } = useSelector(state => state.apartments);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'M',
    email: '',
    phone: '',
    apartment_id: '',
    rentAmount: '',
    charges: '',
    depositAmount: '',
    leaseStartDate: '',
    leaseEndDate: ''
  });

  useEffect(() => {
    dispatch(fetchApartments());
  }, [dispatch]);

  useEffect(() => {
    if (selectedTenant) {
      setFormData({
        firstName: selectedTenant.firstName || '',
        lastName: selectedTenant.lastName || '',
        gender: selectedTenant.gender || 'M',
        email: selectedTenant.email || '',
        phone: selectedTenant.phone || '',
        apartment_id: selectedTenant.apartment_id || '',
        rentAmount: selectedTenant.rentAmount || '',
        charges: selectedTenant.charges || '',
        depositAmount: selectedTenant.depositAmount || '',
        leaseStartDate: selectedTenant.leaseStartDate || '',
        leaseEndDate: selectedTenant.leaseEndDate || ''
      });
      setIsOpen(true);
    }
  }, [selectedTenant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedTenant) {
        await dispatch(updateTenant({ id: selectedTenant.id, data: formData })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Tenant updated successfully'
        }));
      } else {
        await dispatch(createTenant(formData)).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Tenant created successfully'
        }));
      }
      
      handleClose();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error || 'Failed to save tenant'
      }));
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFormData({
      firstName: '',
      lastName: '',
      gender: 'M',
      email: '',
      phone: '',
      apartment_id: '',
      rentAmount: '',
      charges: '',
      depositAmount: '',
      leaseStartDate: '',
      leaseEndDate: ''
    });
    if (selectedTenant) {
      dispatch(clearSelectedTenant());
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center space-x-2"
      >
        <PlusIcon className="h-4 w-4" />
        <span>Add Tenant</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedTenant ? 'Edit Tenant' : 'Add New Tenant'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="M">Monsieur</option>
              <option value="F">Madame</option>
            </select>
          </div>

          <div>
            <label className="form-label">Apartment</label>
            <select
              name="apartment_id"
              value={formData.apartment_id}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select an apartment</option>
              {apartments.map((apartment) => (
                <option key={apartment.id} value={apartment.id}>
                  {apartment.name} - {apartment.address}, {apartment.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="form-label">Phone (Optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., +33 1 23 45 67 89"
            />
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Rent Amount (€)</label>
              <input
                type="number"
                name="rentAmount"
                value={formData.rentAmount}
                onChange={handleChange}
                className="form-input"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="form-label">Charges (€)</label>
              <input
                type="number"
                name="charges"
                value={formData.charges}
                onChange={handleChange}
                className="form-input"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Deposit Amount (€)</label>
            <input
              type="number"
              name="depositAmount"
              value={formData.depositAmount}
              onChange={handleChange}
              className="form-input"
              min="0"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Lease Start Date</label>
              <input
                type="date"
                name="leaseStartDate"
                value={formData.leaseStartDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Lease End Date</label>
              <input
                type="date"
                name="leaseEndDate"
                value={formData.leaseEndDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : (selectedTenant ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantForm;
