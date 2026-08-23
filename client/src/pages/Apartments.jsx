import React, { useRef } from 'react';
import ApartmentForm from '../components/ApartmentForm';
import ApartmentList from '../components/ApartmentList';
import fr from '../i18n/fr';

const Apartments = () => {
  const apartmentFormRef = useRef(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{fr.apartments.pageTitle}</h1>
        <ApartmentForm ref={apartmentFormRef} />
      </div>

      <ApartmentList onAddApartment={() => apartmentFormRef.current?.open()} />
    </div>
  );
};

export default Apartments;
