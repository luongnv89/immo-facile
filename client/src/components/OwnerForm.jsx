import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateOwner, createOwner, uploadSignature } from '../store/slices/ownerSlice';
import { addNotification } from '../store/slices/uiSlice';
import { PencilIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ConfirmDialog from './common/ConfirmDialog';
import { useModalDismiss } from './common/useModalDismiss';
import fr from '../i18n/fr';

const snapshotFor = source =>
  source
    ? {
        name: source.name || '',
        address1: source.address1 || '',
        address2: source.address2 || '',
        signature: source.signature || '',
        signature_path: source.signature_path || '',
      }
    : { name: '', address1: '', address2: '', signature: '', signature_path: '' };

const OwnerForm = forwardRef((props, ref) => {
  const dispatch = useDispatch();
  const owner = useSelector(state => state.owner?.data || null);
  const loading = useSelector(state => state.owner?.loading || false);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(snapshotFor(owner));
  const fileInputRef = useRef(null);

  // Reset form when the owner record changes
  const [lastOwner, setLastOwner] = useState(owner);
  if (owner !== lastOwner) {
    setLastOwner(owner);
    if (owner) {
      setFormData(snapshotFor(owner));
    }
  }

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
  }));

  // Dirty-form gate (#55): closing an edited form asks for confirmation.
  // After an in-form upload the owner record is refreshed server-side, so
  // this comparison stays clean once the new signature path lands.
  const isDirty = JSON.stringify({ ...formData }) !== JSON.stringify(snapshotFor(owner));

  const { requestClose, handleBackdropClick, confirmProps } = useModalDismiss({
    isOpen,
    onClose: () => handleClose(),
    isDirty,
  });

  const handleUpload = async event => {
    const file = event.target.files[0];
    if (!file) return;
    await dispatch(uploadSignature(file));
    event.target.value = '';
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      if (owner) {
        await dispatch(updateOwner(formData)).unwrap();
        dispatch(
          addNotification({
            type: 'success',
            message: fr.owner.updated,
          })
        );
      } else {
        await dispatch(createOwner(formData)).unwrap();
        dispatch(
          addNotification({
            type: 'success',
            message: fr.owner.created,
          })
        );
      }

      setIsOpen(false);
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          message: error || fr.owner.errSave,
        })
      );
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (owner) {
      setFormData(snapshotFor(owner));
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
        className="btn-secondary flex items-center space-x-2"
        data-testid="owner-form-trigger"
      >
        <PencilIcon className="h-4 w-4" />
        <span>{fr.owner.edit}</span>
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
              {owner ? fr.owner.editTitle : fr.owner.addTitle}
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
              <label className="form-label">{fr.owner.fullName}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder={fr.owner.namePlaceholder}
                required
              />
            </div>

            <div>
              <label className="form-label">{fr.owner.address1}</label>
              <input
                type="text"
                name="address1"
                value={formData.address1}
                onChange={handleChange}
                className="form-input"
                placeholder="12 rue de la Paix"
                required
              />
            </div>

            <div>
              <label className="form-label">{fr.owner.address2}</label>
              <input
                type="text"
                name="address2"
                value={formData.address2}
                onChange={handleChange}
                className="form-input"
                placeholder={fr.owner.cityPlaceholder}
              />
            </div>

            <div>
              <label className="form-label">{fr.owner.signature}</label>
              <input
                type="text"
                name="signature"
                value={formData.signature}
                onChange={handleChange}
                className="form-input"
                placeholder={fr.owner.signaturePlaceholder}
              />
            </div>

            {/* Signature image: upload only (#56) — the raw path text input is gone */}
            <div>
              <span className="form-label">
                {owner?.signature_path ? fr.owner.replaceSignature : fr.owner.uploadSignature}
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="btn-secondary flex items-center space-x-2 w-full justify-center"
                data-testid="owner-form-upload"
              >
                <PhotoIcon className="h-4 w-4" />
                <span>
                  {owner?.signature_path ? fr.owner.replaceSignature : fr.owner.uploadSignature}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
              />
              <p className="text-xs text-gray-500 mt-1">{fr.owner.signatureHint}</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={requestClose} className="btn-secondary">
                {fr.common.cancel}
              </button>
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? fr.common.saving : owner ? fr.common.update : fr.common.create}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog {...confirmProps} />
    </>
  );
});

OwnerForm.displayName = 'OwnerForm';

export default OwnerForm;
