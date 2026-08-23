import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { generateReceipt } from '../store/slices/receiptSlice';
import { addNotification } from '../store/slices/uiSlice';
import { DocumentPlusIcon } from '@heroicons/react/24/outline';
import fr, { MONTHS_FR } from '../i18n/fr';

const ReceiptGenerator = () => {
  const dispatch = useDispatch();
  const tenants = useSelector(state => state.tenants?.items || []);
  const generating = useSelector(state => state.receipts?.generating || false);

  const [formData, setFormData] = useState({
    tenantId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: '',
    charges: 0,
    paymentDate: new Date().toISOString().split('T')[0], // Default to today's date
    sendEmail: false,
  });

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.tenantId || !formData.amount) {
      dispatch(
        addNotification({
          type: 'error',
          message: fr.generator.errTenantAmount,
        })
      );
      return;
    }

    try {
      await dispatch(
        generateReceipt({
          tenantId: parseInt(formData.tenantId),
          month: formData.month,
          year: formData.year,
          amount: parseFloat(formData.amount),
          charges: parseFloat(formData.charges) || 0,
          paymentDate: formData.paymentDate,
          sendEmail: formData.sendEmail,
        })
      ).unwrap();

      dispatch(
        addNotification({
          type: 'success',
          message: fr.generator.success,
        })
      );

      // Reset form
      setFormData({
        tenantId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        amount: '',
        charges: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        sendEmail: false,
      });
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          message: error || fr.generator.failed,
        })
      );
    }
  };

  const handleTenantChange = e => {
    const tenantId = e.target.value;

    if (tenantId) {
      const tenant = tenants.find(t => t.id === parseInt(tenantId));
      if (tenant) {
        // Auto-fill rent amount and charges from tenant data
        setFormData(prev => ({
          ...prev,
          tenantId: tenantId,
          amount: tenant.rentAmount || '',
          charges: tenant.charges || '',
          sendEmail: false,
        }));
      }
    } else {
      // Clear auto-filled data when no tenant is selected
      setFormData(prev => ({
        ...prev,
        tenantId: '',
        amount: '',
        charges: '',
        sendEmail: false,
      }));
    }
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="form-label">{fr.generator.selectTenant}</label>
        <select
          name="tenantId"
          value={formData.tenantId}
          onChange={handleTenantChange}
          className="form-input"
          required
        >
          <option value="">{fr.generator.chooseTenant}</option>
          {tenants.map(tenant => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.firstName} {tenant.lastName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">{fr.generator.month}</label>
          <select
            name="month"
            value={formData.month}
            onChange={handleChange}
            className="form-input"
          >
            {MONTHS_FR.map((monthLabel, index) => (
              <option key={monthLabel} value={index + 1}>
                {monthLabel}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">{fr.generator.year}</label>
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
          <label className="form-label">{fr.generator.rentAmount}</label>
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
          <label className="form-label">{fr.generator.charges}</label>
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
        <label className="form-label">{fr.generator.paymentDate}</label>
        <input
          type="date"
          name="paymentDate"
          value={formData.paymentDate}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="sendEmail"
          name="sendEmail"
          checked={formData.sendEmail}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="sendEmail" className="text-sm font-medium text-gray-700">
          {fr.generator.sendEmail}
        </label>
      </div>

      <button
        type="submit"
        disabled={generating || tenants.length === 0}
        className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        <DocumentPlusIcon className="h-4 w-4" />
        <span>{generating ? fr.generator.generating : fr.generator.submit}</span>
      </button>

      {tenants.length === 0 && (
        <p className="text-sm text-gray-500 text-center">{fr.generator.noTenants}</p>
      )}
    </form>
  );
};

export default ReceiptGenerator;
