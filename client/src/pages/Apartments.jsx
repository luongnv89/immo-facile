import React from 'react';
import ApartmentForm from '../components/ApartmentForm';
import ApartmentList from '../components/ApartmentList';

const Apartments = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Apartments</h1>
        <ApartmentForm />
      </div>
      
      <ApartmentList />
    </div>
  );
};

export default Apartments;
