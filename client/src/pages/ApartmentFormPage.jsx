import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { createApartment, updateApartment } from '../store/slices/apartmentSlice';
import { addNotification } from '../store/slices/uiSlice';
import { apartmentAPI } from '../services/api';
import { apartmentHref } from '../utils/tabs';
import fr from '../i18n/fr';

const EMPTY_FORM = {
  name: '',
  address: '',
  city: '',
  postalCode: '',
  description: '',
};

const ApartmentFormPage = ({ apartmentId }) => {
  const dispatch = useDispatch();
  const isEdit = Boolean(apartmentId);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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
        const res = await apartmentAPI.getById(apartmentId);
        const a = res.data?.data || res.data;
        if (!cancelled && a) {
           
          setFormData({
            name: a.name || '',
            address: a.address || '',
            city: a.city || '',
            postalCode: a.postalCode || '',
            description: a.description || '',
          });
        }
      } catch (e) {
         
        if (!cancelled) setError(e.response?.data?.error || e.message || fr.apartments.errLoad);
      } finally {
         
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [apartmentId, isEdit]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await dispatch(updateApartment({ id: apartmentId, data: formData })).unwrap();
        dispatch(addNotification({ type: 'success', message: fr.apartments.updated }));
      } else {
        await dispatch(createApartment(formData)).unwrap();
        dispatch(addNotification({ type: 'success', message: fr.apartments.created }));
      }
      window.location.hash = apartmentHref.list();
    } catch (err) {
      dispatch(addNotification({ type: 'error', message: err || fr.apartments.errSave }));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    window.location.hash = apartmentHref.list();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
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
          {isEdit ? fr.apartments.edit : fr.apartments.addNew}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="form-label">{fr.apartments.name}</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        <div>
          <label className="form-label">{fr.apartments.address}</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">{fr.apartments.city}</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="form-label">{fr.apartments.postalCode}</label>
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>
        <div>
          <label className="form-label">{fr.apartments.descriptionOptional}</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-input"
            rows="3"
          />
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

export default ApartmentFormPage;
