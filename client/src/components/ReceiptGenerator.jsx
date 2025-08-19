import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { generateReceipt } from '../store/slices/receiptSlice';
import { addNotification } from '../store/slices/uiSlice';
import { DocumentPlusIcon } from '@heroicons/react/24/outline';

const ReceiptGenerator = () => {
  const dispatch = useDispatch();
  const { items: tenants } = useSelector(state => state.tenants);
  const { generating } = useSelector(state => state.receipts);
  
  const [formData, setFormData] = useState({
    tenantId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: '',
    charges: 0,
    paymentDate: new Date().toISOString().split('T')[0] // Default to today's date
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tenantId || !formData.amount) {
      dispatch(addNotification({
        type: 'error',
        message: 'Please select a tenant and enter the rent amount'
      }));
      return;
    }

    try {
      await dispatch(generateReceipt({
        tenantId: parseInt(formData.tenantId),
        month: months[formData.month - 1],
        year: formData.year,
        amount: parseFloat(formData.amount),
        charges: parseFloat(formData.charges) || 0,
        paymentDate: formData.paymentDate
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'Receipt generated successfully'
      }));
      
      // Reset form
      setFormData({
        tenantId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        amount: '',
        charges: 0,
        paymentDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error || 'Failed to generate receipt'
      }));
    }
  };

  const handleTenantChange = (e) => {
    const tenantId = e.target.value;
    
    if (tenantId) {
      const tenant = tenants.find(t => t.id === parseInt(tenantId));
      if (tenant) {
        // Auto-fill rent amount and charges from tenant data
        setFormData(prev => ({
          ...prev,
          tenantId: tenantId,
          amount: tenant.rentAmount || '',
          charges: tenant.charges || ''
        }));
      }
    } else {
      // Clear auto-filled data when no tenant is selected
      setFormData(prev => ({
        ...prev,
        tenantId: '',
        amount: '',
        charges: ''
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="form-label">Select Tenant</label>
        <select
          name="tenantId"
          value={formData.tenantId}
          onChange={handleTenantChange}
          className="form-input"
          required
        >
          <option value="">Choose a tenant...</option>
          {tenants.map(tenant => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.firstName} {tenant.lastName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Month</label>
          <select
            name="month"
            value={formData.month}
            onChange={handleChange}
            className="form-input"
          >
            {months.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="form-label">Year</label>
          <input
            type="number"
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="form-input"
            min="2020"
            max="2030"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Rent Amount (€)</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="form-input"
            placeholder="400"
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
            placeholder="50"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <label className="form-label">Payment Date</label>
        <input
          type="date"
          name="paymentDate"
          value={formData.paymentDate}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>

      <button
        type="submit"
        disabled={generating || tenants.length === 0}
        className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        <DocumentPlusIcon className="h-4 w-4" />
        <span>{generating ? 'Generating...' : 'Generate Receipt'}</span>
      </button>
      
      {tenants.length === 0 && (
        <p className="text-sm text-gray-500 text-center">
          Add tenants first to generate receipts
        </p>
      )}
    </form>
  );
};

export default ReceiptGenerator;
