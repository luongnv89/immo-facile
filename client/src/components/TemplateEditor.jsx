import React, { useState, useEffect } from 'react';
import { XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';

const TemplateEditor = ({ template, onSave, onCancel }) => {
  const [templateData, setTemplateData] = useState(template?.template_data || {
    layout: { margin: 50, pageSize: 'A4' },
    header: { title: 'Quittance de loyer', fontSize: 18, fontStyle: 'bold', position: { x: 50, y: 70 }, align: 'center' },
    landlordInfo: { position: { x: 70, y: 130 }, fontSize: 10 },
    tenantInfo: { position: { x: 350, y: 175 }, fontSize: 10 },
    propertyAddress: { position: { x: 70, y: 240 }, fontSize: 11, fontStyle: 'bold' },
    mainText: { position: { x: 70, y: 270 }, fontSize: 11 },
    paymentDetails: { position: { x: 70, y: 350 }, fontSize: 11 },
    signature: { position: { x: 70, y: 480 } },
    footer: { position: { x: 70, y: 580 }, fontSize: 9 }
  });

  const [activeSection, setActiveSection] = useState('header');

  const sections = [
    { key: 'layout', name: 'Mise en page', icon: '📄' },
    { key: 'header', name: 'En-tête', icon: '📋' },
    { key: 'landlordInfo', name: 'Info Propriétaire', icon: '👤' },
    { key: 'tenantInfo', name: 'Info Locataire', icon: '🏠' },
    { key: 'propertyAddress', name: 'Adresse Bien', icon: '📍' },
    { key: 'mainText', name: 'Texte Principal', icon: '📝' },
    { key: 'paymentDetails', name: 'Détails Paiement', icon: '💰' },
    { key: 'signature', name: 'Signature', icon: '✍️' },
    { key: 'footer', name: 'Pied de page', icon: '📄' }
  ];

  const handleSectionChange = (section, field, value) => {
    setTemplateData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: field === 'position' ? value : (isNaN(value) ? value : Number(value))
      }
    }));
  };

  const handlePositionChange = (section, axis, value) => {
    setTemplateData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        position: {
          ...prev[section].position,
          [axis]: Number(value)
        }
      }
    }));
  };

  const handleSave = () => {
    onSave({
      ...template,
      template_data: templateData
    });
  };

  const renderSectionEditor = () => {
    const section = templateData[activeSection];
    if (!section) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          {sections.find(s => s.key === activeSection)?.name}
        </h3>

        {activeSection === 'layout' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marge (px)
              </label>
              <input
                type="number"
                value={section.margin || 50}
                onChange={(e) => handleSectionChange('layout', 'margin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taille de page
              </label>
              <select
                value={section.pageSize || 'A4'}
                onChange={(e) => handleSectionChange('layout', 'pageSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="Letter">Letter</option>
              </select>
            </div>
          </>
        )}

        {activeSection !== 'layout' && (
          <>
            {section.position && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position X (px)
                  </label>
                  <input
                    type="number"
                    value={section.position.x || 0}
                    onChange={(e) => handlePositionChange(activeSection, 'x', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position Y (px)
                  </label>
                  <input
                    type="number"
                    value={section.position.y || 0}
                    onChange={(e) => handlePositionChange(activeSection, 'y', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {section.fontSize !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taille de police
                </label>
                <input
                  type="number"
                  value={section.fontSize || 11}
                  onChange={(e) => handleSectionChange(activeSection, 'fontSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {section.fontStyle !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Style de police
                </label>
                <select
                  value={section.fontStyle || 'normal'}
                  onChange={(e) => handleSectionChange(activeSection, 'fontStyle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Gras</option>
                  <option value="italic">Italique</option>
                </select>
              </div>
            )}

            {section.align !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alignement
                </label>
                <select
                  value={section.align || 'left'}
                  onChange={(e) => handleSectionChange(activeSection, 'align', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="left">Gauche</option>
                  <option value="center">Centre</option>
                  <option value="right">Droite</option>
                </select>
              </div>
            )}

            {section.title !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre
                </label>
                <input
                  type="text"
                  value={section.title || ''}
                  onChange={(e) => handleSectionChange(activeSection, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Éditeur de Template - {template?.name}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Sections</h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md ${
                      activeSection === section.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{section.icon}</span>
                    {section.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 flex">
            <div className="w-80 p-6 border-r overflow-y-auto">
              {renderSectionEditor()}
            </div>

            {/* Preview */}
            <div className="flex-1 p-6 bg-gray-100 overflow-auto">
              <div className="bg-white shadow-lg mx-auto" style={{ width: '595px', height: '842px', position: 'relative' }}>
                <div className="absolute inset-0 p-4 text-xs">
                  <div className="text-center text-gray-500 mb-4">
                    <EyeIcon className="h-5 w-5 mx-auto mb-2" />
                    Aperçu du template
                  </div>
                  
                  {/* Visual representation of template sections */}
                  {Object.entries(templateData).map(([key, section]) => {
                    if (key === 'layout' || !section.position) return null;
                    
                    return (
                      <div
                        key={key}
                        className={`absolute border border-dashed border-blue-300 bg-blue-50 p-1 text-xs ${
                          activeSection === key ? 'border-blue-500 bg-blue-100' : ''
                        }`}
                        style={{
                          left: `${(section.position.x / 595) * 100}%`,
                          top: `${(section.position.y / 842) * 100}%`,
                          fontSize: `${Math.max(8, section.fontSize / 2)}px`
                        }}
                        onClick={() => setActiveSection(key)}
                      >
                        {sections.find(s => s.key === key)?.name}
                        {key === 'header' && section.title && (
                          <div className="font-bold">{section.title}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
