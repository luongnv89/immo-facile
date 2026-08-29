import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTenant, updateTenant, clearSelectedTenant } from '../store/slices/tenantSlice';
import { fetchApartments } from '../store/slices/apartmentSlice';
import { addNotification } from '../store/slices/uiSlice';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ConfirmDialog from './common/ConfirmDialog';
import { useModalDismiss } from './common/useModalDismiss';
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

const TenantForm = forwardRef((props, ref) => {
  const dispatch = useDispatch();
  const selectedTenant = useSelector(state => state.tenants?.selectedTenant || null);
  const loading = useSelector(state => state.tenants?.loading || false);
  const apartments = useSelector(state => state.apartments?.items || []);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    dispatch(fetchApartments());
  }, [dispatch]);

  // Sync form when a tenant is selected for edit
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
        leaseEndDate: selectedTenant.leaseEndDate || '',
      });
    }
  }, [selectedTenant]);

  useImperativeHandle(ref, () => ({
    open: () => {
      if (!selectedTenant) setFormData(EMPTY_FORM);
      setIsOpen(true);
    },
  }));

  // Dirty-form gate (#55): closing an edited form asks for confirmation.
  const isDirty =
    JSON.stringify(formData) !==
    JSON.stringify(
      selectedTenant
        ? {
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
            leaseEndDate: selectedTenant.leaseEndDate || '',
          }
        : EMPTY_FORM
    );

  const { requestClose, handleBackdropClick, confirmProps } = useModalDismiss({
    isOpen,
    onClose: () => handleClose(),
    isDirty,
  });

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      if (selectedTenant) {
        await dispatch(updateTenant({ id: selectedTenant.id, data: formData })).unwrap();
        dispatch(
          addNotification({
            type: 'success',
            message: fr.tenants.updated,
          })
        );
      } else {
        await dispatch(createTenant(formData)).unwrap();
        dispatch(
          addNotification({
            type: 'success',
            message: fr.tenants.created,
          })
        );
      }

      handleClose();
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          message: error || fr.tenants.errSave,
        })
      );
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFormData(EMPTY_FORM);
    if (selectedTenant) {
      dispatch(clearSelectedTenant());
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center space-x-2"
        data-testid="tenant-form-trigger"
      >
        <PlusIcon className="h-4 w-4" />
        <span>{fr.tenants.add}</span>
      </button>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        onClick={handleBackdropClick}
        data-testid="modal-backdrop"
      >
        <div
          className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedTenant ? fr.tenants.edit : fr.tenants.addNew}
            </h3>
            <button
              type="button"
              onClick={requestClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label={fr.common.close}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                {apartments.map(apartment => (
                  <option key={apartment.id} value={apartment.id}>
                    {apartment.name} - {apartment.address}, {apartment.city}
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
              <button type="button" onClick={requestClose} className="btn-secondary">
                {fr.common.cancel}
              </button>
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? fr.common.saving : selectedTenant ? fr.common.update : fr.common.create}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog {...confirmProps} />
    </>
  );
});

TenantForm.displayName = 'TenantForm';

export default TenantForm;
