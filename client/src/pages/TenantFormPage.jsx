import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTenant, updateTenant } from '../store/slices/tenantSlice';
import { fetchApartments } from '../store/slices/apartmentSlice';
import { addNotification } from '../store/slices/uiSlice';
import { tenantAPI } from '../services/api';
import { tenantHref } from '../utils/tabs';
import { setFormDirty } from '../utils/dirtyForm';
import { useFormPage } from '../hooks/useFormPage';
import FormPage from '../components/forms/FormPage';
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

const tenantFromApi = t => ({
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

const TenantFormPage = ({ tenantId }) => {
  const dispatch = useDispatch();
  const apartments = useSelector(state => state.apartments?.items || []);
  const { isEdit, formData, loading, saving, error, isDirty, setSaving, handleChange } =
    useFormPage({
      id: tenantId,
      fetchById: tenantAPI.getById,
      mapRecord: tenantFromApi,
      emptyForm: EMPTY_FORM,
      loadError: fr.tenants.errLoad,
    });

  useEffect(() => {
    dispatch(fetchApartments());
  }, [dispatch]);

  // Clearing the dirty flag first lets Dashboard's nav gate pass this
  // intentional exit (submit success or confirmed close).
  const navigateToList = () => {
    setFormDirty(null);
    window.location.hash = tenantHref.list();
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
      navigateToList();
    } catch (err) {
      dispatch(addNotification({ type: 'error', message: err || fr.tenants.errSave }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormPage
      title={isEdit ? fr.tenants.edit : fr.tenants.addNew}
      loading={loading}
      error={error}
      isDirty={isDirty}
      saving={saving}
      submitLabel={saving ? fr.common.saving : isEdit ? fr.common.update : fr.common.create}
      onNavigate={navigateToList}
      onSubmit={handleSubmit}
      loadingTestId="tenant-form-page-loading"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tenant-firstName" className="form-label">
            {fr.tenants.firstName}
          </label>
          <input
            id="tenant-firstName"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        <div>
          <label htmlFor="tenant-lastName" className="form-label">
            {fr.tenants.lastName}
          </label>
          <input
            id="tenant-lastName"
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
        <label htmlFor="tenant-gender" className="form-label">
          {fr.tenants.gender}
        </label>
        <select
          id="tenant-gender"
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
        <label htmlFor="tenant-apartment" className="form-label">
          {fr.tenants.apartment}
        </label>
        <select
          id="tenant-apartment"
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
        <label htmlFor="tenant-email" className="form-label">
          {fr.tenants.email}
        </label>
        <input
          id="tenant-email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>

      <div>
        <label htmlFor="tenant-phone" className="form-label">
          {fr.tenants.phone} {fr.common.optional}
        </label>
        <input
          id="tenant-phone"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="form-input"
          placeholder={fr.tenants.phonePlaceholder}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tenant-rentAmount" className="form-label">
            {fr.tenants.rentAmount}
          </label>
          <input
            id="tenant-rentAmount"
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
          <label htmlFor="tenant-charges" className="form-label">
            {fr.tenants.charges}
          </label>
          <input
            id="tenant-charges"
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
        <label htmlFor="tenant-deposit" className="form-label">
          {fr.tenants.deposit}
        </label>
        <input
          id="tenant-deposit"
          type="number"
          name="depositAmount"
          value={formData.depositAmount}
          onChange={handleChange}
          className="form-input"
          min="0"
          step="0.01"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tenant-leaseStart" className="form-label">
            {fr.tenants.leaseStart}
          </label>
          <input
            id="tenant-leaseStart"
            type="date"
            name="leaseStartDate"
            value={formData.leaseStartDate}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor="tenant-leaseEnd" className="form-label">
            {fr.tenants.leaseEnd}
          </label>
          <input
            id="tenant-leaseEnd"
            type="date"
            name="leaseEndDate"
            value={formData.leaseEndDate}
            onChange={handleChange}
            className="form-input"
          />
        </div>
      </div>
    </FormPage>
  );
};

export default TenantFormPage;
