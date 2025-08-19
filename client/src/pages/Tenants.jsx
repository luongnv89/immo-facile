import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTenants } from '../store/slices/tenantSlice';
import TenantList from '../components/TenantList';
import TenantForm from '../components/TenantForm';
import { UserGroupIcon } from '@heroicons/react/24/outline';

const Tenants = () => {
  const dispatch = useDispatch();
  const { items: tenants, loading, error } = useSelector(state => state.tenants);

  useEffect(() => {
    dispatch(fetchTenants());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600 mt-1">Manage all your tenants and their information</p>
        </div>
        <TenantForm />
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error loading tenants: {error}</p>
        </div>
      )}

      {tenants && tenants.length > 0 ? (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              All Tenants ({tenants.length})
            </h2>
          </div>
          <div className="p-6">
            <TenantList />
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first tenant.</p>
        </div>
      )}
    </div>
  );
};

export default Tenants;
