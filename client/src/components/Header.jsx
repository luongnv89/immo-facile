import React from 'react';
import { useSelector } from 'react-redux';
import { BuildingOfficeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { items: tenants } = useSelector(state => state.tenants);
  const { items: receipts } = useSelector(state => state.receipts);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Rent Receipt Management
              </h1>
              <p className="text-sm text-gray-500">
                Property management made simple
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center text-sm text-gray-600">
              <BuildingOfficeIcon className="h-5 w-5 mr-1" />
              <span>{tenants.length} Tenants</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <DocumentTextIcon className="h-5 w-5 mr-1" />
              <span>{receipts.length} Receipts</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
