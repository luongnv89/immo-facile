import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTenants } from '../store/slices/tenantSlice';
import TenantList from '../components/TenantList';
import TenantForm from '../components/TenantForm';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import fr from '../i18n/fr';

const Tenants = () => {
  const dispatch = useDispatch();
  const tenants = useSelector(state => state.tenants?.items || []);
  const loading = useSelector(state => state.tenants?.loading || false);
  const error = useSelector(state => state.tenants?.error || null);
  const tenantFormRef = useRef(null);

  useEffect(() => {
    dispatch(fetchTenants());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32" data-testid="tenants-page-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{fr.tenants.pageTitle}</h1>
          <p className="text-gray-600 mt-1">{fr.tenants.pageSubtitle}</p>
        </div>
        <TenantForm ref={tenantFormRef} />
      </div>

      {error && (
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
      )}

      {tenants && tenants.length > 0 ? (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {fr.tenants.allTenants(tenants.length)}
            </h2>
          </div>
          <div className="p-6">
            <TenantList
              onAddTenant={() => tenantFormRef.current?.open()}
              onEditTenant={() => tenantFormRef.current?.open()}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12" data-testid="tenants-page-empty">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{fr.tenants.emptyTitle}</h3>
          <p className="mt-1 text-sm text-gray-500">{fr.tenants.emptyText}</p>
          <button
            type="button"
            onClick={() => tenantFormRef.current?.open()}
            className="btn-primary mt-4 inline-flex h-11 items-center"
          >
            {fr.tenants.emptyCta}
          </button>
        </div>
      )}
    </div>
  );
};

export default Tenants;
