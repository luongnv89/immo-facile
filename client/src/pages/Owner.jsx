import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOwner, uploadSignature, fetchSignatureImage } from '../store/slices/ownerSlice';
import OwnerForm from '../components/OwnerForm';
import { UserIcon, MapPinIcon, PencilSquareIcon, PhotoIcon } from '@heroicons/react/24/outline';

const Owner = () => {
  const dispatch = useDispatch();
  const { data: owner, loading, error, signatureImage } = useSelector(state => state.owner);
  const fileInputRef = useRef(null);

  useEffect(() => {
    dispatch(fetchOwner());
  }, [dispatch]);

  useEffect(() => {
    if (owner && owner.signature_path) {
      dispatch(fetchSignatureImage());
    }
  }, [dispatch, owner]);

  const handleSignatureUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      await dispatch(uploadSignature(file));
      dispatch(fetchSignatureImage());
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Owner Information</h1>
        <OwnerForm />
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error loading owner information: {error}</p>
        </div>
      )}

      {owner ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Full Name</h3>
                <p className="text-gray-700">{owner.name}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Address</h3>
                <p className="text-gray-700">{owner.address1}</p>
                {owner.address2 && (
                  <p className="text-gray-700">{owner.address2}</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <PencilSquareIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">Signature</h3>
                <p className="text-gray-700">{owner.signature || 'Not set'}</p>
                
                {/* Signature Image Display */}
                {owner.signature_path && (
                  <div className="mt-3">
                    <div className="border border-gray-200 rounded p-2 bg-gray-50">
                      <p className="text-sm text-gray-600 mb-2">Signature Preview:</p>
                      {signatureImage ? (
                        <img 
                          src={signatureImage.image}
                          alt="Owner signature"
                          className="max-w-xs max-h-24 border border-gray-200 rounded bg-white"
                        />
                      ) : (
                        <div className="w-full h-24 bg-white border border-dashed border-gray-300 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">
                            Loading signature...
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        File: {owner.signature_path.replace(/.*[\/\\]/, '')}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="mt-3">
                  <button
                    onClick={triggerFileUpload}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PhotoIcon className="h-4 w-4 mr-2" />
                    {owner.signature_path ? 'Replace Signature' : 'Upload Signature'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {owner.updated_at && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(owner.updated_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No owner information</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding owner information.</p>
        </div>
      )}
    </div>
  );
};

export default Owner;
