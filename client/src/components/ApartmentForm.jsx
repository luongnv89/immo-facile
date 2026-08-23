import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createApartment,
  updateApartment,
  clearSelectedApartment,
} from '../store/slices/apartmentSlice';
import { addNotification } from '../store/slices/uiSlice';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ConfirmDialog from './common/ConfirmDialog';
import { useModalDismiss } from './common/useModalDismiss';
import fr from '../i18n/fr';

const EMPTY_FORM = {
  name: '',
  address: '',
  city: '',
  postalCode: '',
  description: '',
};

const ApartmentForm = forwardRef((props, ref) => {
  const dispatch = useDispatch();
  const selectedApartment = useSelector(state => state.apartments?.selectedApartment || null);
  const loading = useSelector(state => state.apartments?.loading || false);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Reset form and open when a different apartment gets selected
  // (render-phase adjustment pattern — no cascading effect renders)
  const [lastSelectedApartment, setLastSelectedApartment] = useState(selectedApartment);
  if (selectedApartment !== lastSelectedApartment) {
    setLastSelectedApartment(selectedApartment);
    if (selectedApartment) {
      setFormData({
        name: selectedApartment.name || '',
        address: selectedApartment.address || '',
        city: selectedApartment.city || '',
        postalCode: selectedApartment.postalCode || '',
        description: selectedApartment.description || '',
      });
      setIsOpen(true);
    }
  }

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
  }));

  const snapshotFor = source =>
    source
      ? {
          name: source.name || '',
          address: source.address || '',
          city: source.city || '',
          postalCode: source.postalCode || '',
          description: source.description || '',
        }
      : EMPTY_FORM;

  // Dirty-form gate (#55): closing an edited form asks for confirmation.
  const isDirty = JSON.stringify(formData) !== JSON.stringify(snapshotFor(selectedApartment));

  const { requestClose, handleBackdropClick, confirmProps } = useModalDismiss({
    isOpen,
    onClose: () => handleClose(),
    isDirty,
  });

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      if (selectedApartment) {
        await dispatch(updateApartment({ id: selectedApartment.id, data: formData })).unwrap();
        dispatch(
          addNotification({
            type: 'success',
            message: fr.apartments.updated,
          })
        );
      } else {
        await dispatch(createApartment(formData)).unwrap();
        dispatch(
          addNotification({
            type: 'success',
            message: fr.apartments.created,
          })
        );
      }

      handleClose();
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          message: error || fr.apartments.errSave,
        })
      );
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFormData(EMPTY_FORM);
    if (selectedApartment) {
      dispatch(clearSelectedApartment());
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
        data-testid="apartment-form-trigger"
      >
        <PlusIcon className="h-4 w-4" />
        <span>{fr.apartments.add}</span>
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
              {selectedApartment ? fr.apartments.edit : fr.apartments.addNew}
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
            <div>
              <label className="form-label">{fr.apartments.name}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder={fr.apartments.namePlaceholder}
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
                placeholder={fr.apartments.addressPlaceholder}
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
                  placeholder={fr.apartments.city}
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
                  placeholder="12345"
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
                placeholder={fr.apartments.descriptionPlaceholder}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={requestClose} className="btn-secondary">
                {fr.common.cancel}
              </button>
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading
                  ? fr.common.saving
                  : selectedApartment
                    ? fr.common.update
                    : fr.common.create}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog {...confirmProps} />
    </>
  );
});

ApartmentForm.displayName = 'ApartmentForm';

export default ApartmentForm;
