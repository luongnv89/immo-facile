import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTenant, updateTenant } from '../store/slices/tenantSlice';
import { fetchApartments } from '../store/slices/apartmentSlice';
import { addNotification } from '../store/slices/uiSlice';
import { tenantAPI } from '../services/api';
import { tenantHref } from '../utils/tabs';
import fr from '../i18n/fr';

const EMPTY_FORM = {
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
  leaseEndDate: '',
};

const TenantFormPage = ({ tenantId }) => {
  const dispatch = useDispatch();
  const isEdit = Boolean(tenantId);
  const apartments = useSelector(state => state.apartments?.items || []);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    dispatch(fetchApartments());
  }, [dispatch]);

  useEffect(() => {
    if (!isEdit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(EMPTY_FORM);
       
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
       
      setLoading(true);
       
      setError(null);
      try {
        const res = await tenantAPI.getById(tenantId);
        const t = res.data?.data || res.data;
        if (!cancelled && t) {
           
          setFormData({
            firstName: t.firstName || '',
            lastName: t.lastName || '',
            gender: t.gender || 'M',
            email: t.email || '',
            phone: t.phone || '',
            apartment_id: t.apartment_id || '',
            rentAmount: t.rentAmount || '',
            charges: t.charges || '',
            depositAmount: t.depositAmount || '',
            leaseStartDate: t.leaseStartDate ? String(t.leaseStartDate).slice(0, 10) : '',
            leaseEndDate: t.leaseEndDate ? String(t.leaseEndDate).slice(0, 10) : '',
          });
        }
      } catch (e) {
         
        if (!cancelled) setError(e.response?.data?.error || e.message || fr.tenants.errLoad);
      } finally {
         
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId, isEdit]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await dispatch(updateTenant({ id: tenantId, data: formData })).unwrap();
        dispatch(addNotification({ type: 'success', message: fr.tenants.updated }));
      } else {
        await dispatch(createTenant(formData)).unwrap();
        dispatch(addNotification({ type: 'success', message: fr.tenants.created }));
      }
      window.location.hash = tenantHref.list();
    } catch (err) {
      dispatch(addNotification({ type: 'error', message: err || fr.tenants.errSave }));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    window.location.hash = tenantHref.list();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32" data-testid="tenant-form-page-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
        <p className="text-red-800">{error}</p>
        <button type="button" onClick={handleCancel} className="btn-secondary mt-3">
          {fr.common.back}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center space-x-2 mb-6">
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← {fr.common.back}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? fr.tenants.edit : fr.tenants.addNew}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">{fr.tenants.firstName}</label>
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
            <label className="form-label">{fr.tenants.lastName}</label>
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
          <label className="form-label">{fr.tenants.gender}</label>
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
          <label className="form-label">{fr.tenants.apartment}</label>
          <select
            name="apartment_id"
            value={formData.apartment_id}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="">{fr.tenants.selectApartment}</option>
            {apartments.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} - {a.address}, {a.city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">{fr.tenants.email}</label>
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
          <label className="form-label">
            {fr.tenants.phone} {fr.common.optional}
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="form-input"
            placeholder={fr.tenants.phonePlaceholder}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">{fr.tenants.rentAmount}</label>
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
            <label className="form-label">{fr.tenants.charges}</label>
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
          <label className="form-label">{fr.tenants.deposit}</label>
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
            <label className="form-label">{fr.tenants.leaseStart}</label>
            <input
              type="date"
              name="leaseStartDate"
              value={formData.leaseStartDate}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">{fr.tenants.leaseEnd}</label>
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
          <button type="button" onClick={handleCancel} className="btn-secondary">
            {fr.common.cancel}
          </button>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? fr.common.saving : isEdit ? fr.common.update : fr.common.create}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TenantFormPage;
