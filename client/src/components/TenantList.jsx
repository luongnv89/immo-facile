import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteTenant, setSelectedTenant } from '../store/slices/tenantSlice';
import { addNotification } from '../store/slices/uiSlice';
import { PencilIcon, TrashIcon, EyeIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const TenantList = () => {
  const dispatch = useDispatch();
  const { items: tenants, loading } = useSelector(state => state.tenants);

  const handleDelete = async (tenant) => {
    if (window.confirm(`Are you sure you want to delete ${tenant.firstName} ${tenant.lastName}?`)) {
      try {
        await dispatch(deleteTenant(tenant.id)).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Tenant deleted successfully'
        }));
      } catch (error) {
        dispatch(addNotification({
          type: 'error',
          message: error || 'Failed to delete tenant'
        }));
      }
    }
  };

  const handleEdit = (tenant) => {
    dispatch(setSelectedTenant(tenant));
    // This would open the tenant form modal in edit mode
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="text-center py-8">
        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding a new tenant.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="space-y-4">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {tenant.firstName[0]}{tenant.lastName[0]}
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
                    <span>{tenant.apartmentName} - {tenant.apartmentAddress}, {tenant.apartmentCity}</span>
                  )}
                  <span className="font-medium text-green-600">€{tenant.rentAmount}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(tenant)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit tenant"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(tenant)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete tenant"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TenantList;
