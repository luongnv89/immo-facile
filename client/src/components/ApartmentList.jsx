import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchApartments,
  deleteApartment,
  setSelectedApartment,
} from '../store/slices/apartmentSlice';
import { addNotification } from '../store/slices/uiSlice';
import { PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import ConfirmDialog from './common/ConfirmDialog';
import fr, { TOUCH_TARGET_CLASS } from '../i18n/fr';

const ApartmentList = ({ onAddApartment }) => {
  const dispatch = useDispatch();
  const apartments = useSelector(state => state.apartments?.items || []);
  const loading = useSelector(state => state.apartments?.loading || false);
  const error = useSelector(state => state.apartments?.error || null);
  const [apartmentToDelete, setApartmentToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchApartments());
  }, [dispatch]);

  const handleEdit = apartment => {
    dispatch(setSelectedApartment(apartment));
  };

  const confirmDelete = async () => {
    const target = apartmentToDelete;
    setApartmentToDelete(null);
    if (!target) return;
    try {
      await dispatch(deleteApartment(target.id)).unwrap();
      dispatch(
        addNotification({
          type: 'success',
          message: fr.apartments.deleted,
        })
      );
    } catch (err) {
      dispatch(
        addNotification({
          type: 'error',
          message: err || fr.apartments.errDelete,
        })
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32" data-testid="apartment-list-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
        <p className="text-red-800">
          {fr.apartments.errLoad}
          {error}
        </p>
        <button
          type="button"
          onClick={() => dispatch(fetchApartments())}
          className="mt-3 inline-flex h-11 items-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {fr.common.retry}
        </button>
      </div>
    );
  }

  if (apartments.length === 0) {
    return (
      <div className="text-center py-8" data-testid="apartment-list-empty">
        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">{fr.apartments.emptyTitle}</h3>
        <p className="mt-1 text-sm text-gray-500">{fr.apartments.emptyText}</p>
        {onAddApartment && (
          <button
            type="button"
            onClick={onAddApartment}
            className="btn-primary mt-4 inline-flex h-11 items-center"
          >
            {fr.apartments.emptyCta}
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {apartments.map(apartment => (
          <div key={apartment.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{apartment.name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">{fr.apartments.addressLabel}</span>{' '}
                    {apartment.address}
                  </p>
                  <p>
                    <span className="font-medium">{fr.apartments.cityLabel}</span> {apartment.city},{' '}
                    {apartment.postalCode}
                  </p>
                  {apartment.description && (
                    <p>
                      <span className="font-medium">{fr.apartments.descriptionLabel}</span>{' '}
                      {apartment.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center space-x-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {fr.apartments.tenantCount(apartment.tenantCount || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row actions: >=44x44 hit area (#56) */}
              <div className="flex ml-4">
                <button
                  type="button"
                  onClick={() => handleEdit(apartment)}
                  className={`${TOUCH_TARGET_CLASS} text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors`}
                  title={fr.apartments.editAction}
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setApartmentToDelete(apartment)}
                  className={`${TOUCH_TARGET_CLASS} text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors`}
                  title={fr.apartments.deleteAction}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={Boolean(apartmentToDelete)}
        title={fr.apartments.confirmDeleteTitle}
        message={fr.apartments.confirmDeleteMessage(apartmentToDelete?.name || '')}
        confirmLabel={fr.common.delete}
        onCancel={() => setApartmentToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
};

export default ApartmentList;
