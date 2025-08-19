import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOwner, updateOwner, createOwner } from '../store/slices/ownerSlice';
import { addNotification } from '../store/slices/uiSlice';
import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';

const OwnerForm = () => {
  const dispatch = useDispatch();
  const { data: owner, loading } = useSelector(state => state.owner);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address1: '',
    address2: '',
    signature: '',
    signature_path: ''
  });


  useEffect(() => {
    if (owner) {
      setFormData({
        name: owner.name || '',
        address1: owner.address1 || '',
        address2: owner.address2 || '',
        signature: owner.signature || '',
        signature_path: owner.signature_path || ''
      });
    }
  }, [owner]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (owner) {
        await dispatch(updateOwner(formData)).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Owner information updated successfully'
        }));
      } else {
        await dispatch(createOwner(formData)).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Owner information created successfully'
        }));
      }
      
      setIsOpen(false);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error || 'Failed to save owner information'
      }));
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (owner) {
      setFormData({
        name: owner.name || '',
        address1: owner.address1 || '',
        address2: owner.address2 || '',
        signature: owner.signature || '',
        signature_path: owner.signature_path || ''
      });
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
        className="btn-secondary flex items-center space-x-2"
      >
        <PencilIcon className="h-4 w-4" />
        <span>Edit Owner Info</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {owner ? 'Edit Owner Information' : 'Add Owner Information'}
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
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., NGUYEN Van Luong"
              required
            />
          </div>

          <div>
            <label className="form-label">Address Line 1</label>
            <input
              type="text"
              name="address1"
              value={formData.address1}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., 12 rue de la Paix"
              required
            />
          </div>

          <div>
            <label className="form-label">Address Line 2</label>
            <input
              type="text"
              name="address2"
              value={formData.address2}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., 78000 Versailles"
            />
          </div>

          <div>
            <label className="form-label">Signature Text</label>
            <input
              type="text"
              name="signature"
              value={formData.signature}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., NGUYEN Van Luong"
            />
          </div>

          <div>
            <label className="form-label">Signature Image Path (Optional)</label>
            <input
              type="text"
              name="signature_path"
              value={formData.signature_path}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., /path/to/signature.png"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use text signature
            </p>
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
              {loading ? 'Saving...' : (owner ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OwnerForm;
