import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createApartment, updateApartment, clearSelectedApartment } from '../store/slices/apartmentSlice';
import { addNotification } from '../store/slices/uiSlice';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ApartmentForm = () => {
  const dispatch = useDispatch();
  const { selectedApartment, loading } = useSelector(state => state.apartments);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    description: ''
  });

  useEffect(() => {
    if (selectedApartment) {
      setFormData({
        name: selectedApartment.name || '',
        address: selectedApartment.address || '',
        city: selectedApartment.city || '',
        postalCode: selectedApartment.postalCode || '',
        description: selectedApartment.description || ''
      });
      setIsOpen(true);
    }
  }, [selectedApartment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedApartment) {
        await dispatch(updateApartment({ id: selectedApartment.id, data: formData })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Apartment updated successfully'
        }));
      } else {
        await dispatch(createApartment(formData)).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Apartment created successfully'
        }));
      }
      
      handleClose();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error || 'Failed to save apartment'
      }));
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFormData({
      name: '',
      address: '',
      city: '',
      postalCode: '',
      description: ''
    });
    if (selectedApartment) {
      dispatch(clearSelectedApartment());
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
        <span>Add Apartment</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedApartment ? 'Edit Apartment' : 'Add New Apartment'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Apartment Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Apartment 2A, Studio 1"
              required
            />
          </div>

          <div>
            <label className="form-label">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-input"
              placeholder="Street address"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="form-input"
                placeholder="City"
                required
              />
            </div>
            <div>
              <label className="form-label">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="form-input"
                placeholder="12345"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              rows="3"
              placeholder="Additional details about the apartment..."
            />
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
              {loading ? 'Saving...' : (selectedApartment ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApartmentForm;
