import React from 'react';
import { useDispatch } from 'react-redux';
import { createApartment, updateApartment } from '../store/slices/apartmentSlice';
import { addNotification } from '../store/slices/uiSlice';
import { apartmentAPI } from '../services/api';
import { apartmentHref } from '../utils/tabs';
import { setFormDirty } from '../utils/dirtyForm';
import { useFormPage } from '../hooks/useFormPage';
import FormPage from '../components/forms/FormPage';
import fr from '../i18n/fr';

const EMPTY_FORM = {
  name: '',
  address: '',
  city: '',
  postalCode: '',
  description: '',
};

const apartmentFromApi = a => ({
  name: a.name || '',
  address: a.address || '',
  city: a.city || '',
  postalCode: a.postalCode || '',
  description: a.description || '',
});

const ApartmentFormPage = ({ apartmentId }) => {
  const dispatch = useDispatch();
  const { isEdit, formData, loading, saving, error, isDirty, setSaving, handleChange } =
    useFormPage({
      id: apartmentId,
      fetchById: apartmentAPI.getById,
      mapRecord: apartmentFromApi,
      emptyForm: EMPTY_FORM,
      loadError: fr.apartments.errLoad,
    });

  // Clearing the dirty flag first lets Dashboard's nav gate pass this
  // intentional exit (submit success or confirmed close).
  const navigateToList = () => {
    setFormDirty(null);
    window.location.hash = apartmentHref.list();
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
      navigateToList();
    } catch (err) {
      dispatch(addNotification({ type: 'error', message: err || fr.apartments.errSave }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormPage
      title={isEdit ? fr.apartments.edit : fr.apartments.addNew}
      loading={loading}
      error={error}
      isDirty={isDirty}
      saving={saving}
      submitLabel={saving ? fr.common.saving : isEdit ? fr.common.update : fr.common.create}
      onNavigate={navigateToList}
      onSubmit={handleSubmit}
      loadingTestId="apartment-form-page-loading"
    >
      <div>
        <label htmlFor="apartment-name" className="form-label">
          {fr.apartments.name}
        </label>
        <input
          id="apartment-name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>
      <div>
        <label htmlFor="apartment-address" className="form-label">
          {fr.apartments.address}
        </label>
        <input
          id="apartment-address"
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="apartment-city" className="form-label">
            {fr.apartments.city}
          </label>
          <input
            id="apartment-city"
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        <div>
          <label htmlFor="apartment-postalCode" className="form-label">
            {fr.apartments.postalCode}
          </label>
          <input
            id="apartment-postalCode"
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
        <label htmlFor="apartment-description" className="form-label">
          {fr.apartments.descriptionOptional}
        </label>
        <textarea
          id="apartment-description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="form-input"
          rows="3"
        />
      </div>
    </FormPage>
  );
};

export default ApartmentFormPage;
