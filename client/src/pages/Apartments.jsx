import React from 'react';
import ApartmentList from '../components/ApartmentList';
import { apartmentHref } from '../utils/tabs';
import fr from '../i18n/fr';

const Apartments = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{fr.apartments.pageTitle}</h1>
        <a href={apartmentHref.new()} className="btn-primary inline-flex items-center space-x-2">
          <span>{fr.apartments.add}</span>
        </a>
      </div>

      <ApartmentList />
    </div>
  );
};

export default Apartments;
