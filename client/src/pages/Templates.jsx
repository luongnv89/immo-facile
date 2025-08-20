import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  DocumentIcon,
  PhotoIcon,
  CheckIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import TemplateForm from '../components/TemplateForm';
import TemplateEditor from '../components/TemplateEditor';
import { addNotification } from '../store/slices/uiSlice';
import * as templateAPI from '../services/templateApi';

const Templates = () => {
  const dispatch = useDispatch();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await templateAPI.getAllTemplates();
      if (response.success) {
        setTemplates(response.data);
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Erreur lors du chargement des templates'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleEditTemplateDesign = (template) => {
    setSelectedTemplate(template);
    setShowEditor(true);
  };

  const handleDeleteTemplate = async (template) => {
    if (template.is_default) {
      dispatch(addNotification({
        type: 'error',
        message: 'Impossible de supprimer le template par défaut'
      }));
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      try {
        const response = await templateAPI.deleteTemplate(template.id);
        if (response.success) {
          dispatch(addNotification({
            type: 'success',
            message: 'Template supprimé avec succès'
          }));
          loadTemplates();
        }
      } catch (error) {
        dispatch(addNotification({
          type: 'error',
          message: 'Erreur lors de la suppression du template'
        }));
      }
    }
  };

  const handleSetDefault = async (template) => {
    try {
      const response = await templateAPI.setDefaultTemplate(template.id);
      if (response.success) {
        dispatch(addNotification({
          type: 'success',
          message: 'Template set as default'
        }));
        loadTemplates();
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Error setting default template'
      }));
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (isEditing) {
        await templateAPI.updateTemplate(selectedTemplate.id, formData);
        dispatch(addNotification({
          type: 'success',
          message: 'Template updated successfully'
        }));
      } else {
        await templateAPI.createTemplate(formData);
        dispatch(addNotification({
          type: 'success',
          message: 'Template created successfully'
        }));
      }
      
      // Refresh templates list
      await loadTemplates();
      
      // Close form
      setShowForm(false);
      setSelectedTemplate(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving template:', error);
      dispatch(addNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to save template'
      }));
    }
  };

  const handleEditorSave = async (templateData) => {
    try {
      const response = await templateAPI.updateTemplate(selectedTemplate.id, templateData);
      if (response.success) {
        dispatch(addNotification({
          type: 'success',
          message: 'Design du template sauvegardé'
        }));
        setShowEditor(false);
        loadTemplates();
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Erreur lors de la sauvegarde du design'
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receipt Templates</h1>
          <p className="text-gray-600">Manage your rent receipt templates</p>
        </div>
        <button
          onClick={handleCreateTemplate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <DocumentIcon className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                {template.is_default && (
                  <StarSolidIcon className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                template.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {template.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {template.description && (
              <p className="text-gray-600 text-sm mb-4">{template.description}</p>
            )}

            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                template.template_type === 'default' 
                  ? 'bg-blue-100 text-blue-800'
                  : template.template_type === 'custom'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {template.template_type === 'default' ? 'Default' : 
                 template.template_type === 'custom' ? 'Custom' : 'Uploaded'}
              </span>
              {template.background_image_path && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  <PhotoIcon className="h-3 w-3" />
                  Background Image
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="Edit information"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEditTemplateDesign(template)}
                  className="text-purple-600 hover:text-purple-800 p-1"
                  title="Edit design"
                >
                  <DocumentIcon className="h-4 w-4" />
                </button>
                {!template.is_default && (
                  <>
                    <button
                      onClick={() => handleSetDefault(template)}
                      className="text-yellow-600 hover:text-yellow-800 p-1"
                      title="Set as default"
                    >
                      <StarIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(template.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start by creating your first receipt template.
          </p>
          <div className="mt-6">
            <button
              onClick={handleCreateTemplate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <PlusIcon className="h-5 w-5" />
              Create template
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <TemplateForm
          template={selectedTemplate}
          isEditing={isEditing}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {showEditor && (
        <TemplateEditor
          template={selectedTemplate}
          onSave={handleEditorSave}
          onCancel={() => setShowEditor(false)}
        />
      )}
    </div>
  );
};

export default Templates;
