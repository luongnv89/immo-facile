import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchApartments, deleteApartment, setSelectedApartment } from '../store/slices/apartmentSlice';
import { addNotification } from '../store/slices/uiSlice';
import { PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const ApartmentList = () => {
  const dispatch = useDispatch();
  const { items: apartments, loading, error } = useSelector(state => state.apartments);

  useEffect(() => {
    dispatch(fetchApartments());
  }, [dispatch]);

  const handleEdit = (apartment) => {
    dispatch(setSelectedApartment(apartment));
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await dispatch(deleteApartment(id)).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Apartment deleted successfully'
        }));
      } catch (error) {
        dispatch(addNotification({
          type: 'error',
          message: error || 'Failed to delete apartment'
        }));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading apartments: {error}</p>
      </div>
    );
  }

  if (apartments.length === 0) {
    return (
      <div className="text-center py-8">
        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No apartments</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding your first apartment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {apartments.map((apartment) => (
        <div key={apartment.id} className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {apartment.name}
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Address:</span> {apartment.address}
                </p>
                <p>
                  <span className="font-medium">City:</span> {apartment.city}, {apartment.postalCode}
                </p>
                {apartment.description && (
                  <p>
                    <span className="font-medium">Description:</span> {apartment.description}
                  </p>
                )}
                <div className="mt-2 flex items-center space-x-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {apartment.tenantCount || 0} {apartment.tenantCount === 1 ? 'tenant' : 'tenants'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => handleEdit(apartment)}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                title="Edit apartment"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(apartment.id, apartment.name)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                title="Delete apartment"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApartmentList;
