import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteTenant, setSelectedTenant, fetchTenants } from '../store/slices/tenantSlice';
import { addNotification } from '../store/slices/uiSlice';
import { PencilIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import ConfirmDialog from './common/ConfirmDialog';
import fr, { TOUCH_TARGET_CLASS } from '../i18n/fr';

const TenantList = ({ onAddTenant }) => {
  const dispatch = useDispatch();
  const tenants = useSelector(state => state.tenants?.items || []);
  const loading = useSelector(state => state.tenants?.loading || false);
  const error = useSelector(state => state.tenants?.error || null);
  const [tenantToDelete, setTenantToDelete] = useState(null);

  const confirmDelete = async () => {
    const tenant = tenantToDelete;
    setTenantToDelete(null);
    if (!tenant) return;
    try {
      await dispatch(deleteTenant(tenant.id)).unwrap();
      dispatch(
        addNotification({
          type: 'success',
          message: fr.tenants.deleted,
        })
      );
    } catch (err) {
      dispatch(
        addNotification({
          type: 'error',
          message: err || fr.tenants.errDelete,
        })
      );
    }
  };

  const handleEdit = tenant => {
    dispatch(setSelectedTenant(tenant));
    // This would open the tenant form modal in edit mode
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8" data-testid="tenant-list-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
        <p className="text-red-800">
          {fr.tenants.errLoad}
          {error}
        </p>
        <button
          type="button"
          onClick={() => dispatch(fetchTenants())}
          className="mt-3 inline-flex h-11 items-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {fr.common.retry}
        </button>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="text-center py-8" data-testid="tenant-list-empty">
        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">{fr.tenants.emptyTitle}</h3>
        <p className="mt-1 text-sm text-gray-500">{fr.tenants.emptyText}</p>
        {onAddTenant && (
          <button
            type="button"
            onClick={onAddTenant}
            className="btn-primary mt-4 inline-flex h-11 items-center"
          >
            {fr.tenants.emptyCta}
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden">
        <div className="space-y-4">
          {tenants.map(tenant => (
            <div
              key={tenant.id}
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {tenant.firstName[0]}
                          {tenant.lastName[0]}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {tenant.firstName} {tenant.lastName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{tenant.email}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    {tenant.apartmentName && (
                      <span>
                        {tenant.apartmentName} - {tenant.apartmentAddress}, {tenant.apartmentCity}
                      </span>
                    )}
                    <span className="font-medium text-green-600">€{tenant.rentAmount}</span>
                  </div>
                </div>

                {/* Row actions: >=44x44 hit area (#56) */}
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(tenant)}
                    className={`${TOUCH_TARGET_CLASS} rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors`}
                    title={fr.tenants.editAction}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTenantToDelete(tenant)}
                    className={`${TOUCH_TARGET_CLASS} rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors`}
                    title={fr.tenants.deleteAction}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(tenantToDelete)}
        title={fr.tenants.confirmDeleteTitle}
        message={fr.tenants.confirmDeleteMessage(
          tenantToDelete ? `${tenantToDelete.firstName} ${tenantToDelete.lastName}` : ''
        )}
        confirmLabel={fr.common.delete}
        onCancel={() => setTenantToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
};

export default TenantList;
