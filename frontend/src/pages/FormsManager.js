import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DynamicFormRenderer from '../components/DynamicFormRenderer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Forms Manager Page
 * Admin interface for managing Users, Families, and Family Members using dynamic forms
 */
const FormsManager = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/forms/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data);
      if (response.data.length > 0) {
        selectTemplate(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const selectTemplate = async (template) => {
    setSelectedTemplate(template);
    setShowForm(false);
    await fetchRecords(template.collection);
  };

  const fetchRecords = async (collection) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/${collection}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(response.data.data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSuccessMessage('Record created successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    if (selectedTemplate) {
      fetchRecords(selectedTemplate.collection);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  const getRecordDisplay = (record) => {
    // Display logic based on collection type
    if (selectedTemplate?.collection === 'users') {
      return {
        title: record.display_name || record.first_name || 'Unknown',
        subtitle: record.email || '',
        details: `Role: ${record.role_primary || 'N/A'}`
      };
    } else if (selectedTemplate?.collection === 'families') {
      return {
        title: record.family_name || 'Unnamed Family',
        subtitle: record.family_code || '',
        details: `Plan: ${record.plan_tier || 'N/A'} | Status: ${record.plan_status || 'N/A'}`
      };
    } else if (selectedTemplate?.collection === 'family_members') {
      return {
        title: `Member ${record.user_id || ''}`,
        subtitle: record.role || '',
        details: `Family: ${record.family_id || 'N/A'} | Status: ${record.status || 'N/A'}`
      };
    }
    return {
      title: record.id || 'Unknown',
      subtitle: '',
      details: JSON.stringify(record, null, 2).substring(0, 100)
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Forms Manager</h1>
          <p className="text-gray-600">Dynamic form-based management interface</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Template Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Form Templates</h2>
              <div className="space-y-2">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => selectTemplate(template)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="font-medium">{template.label}</div>
                    <div className="text-sm opacity-75">{template.collection}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {showForm ? (
              <DynamicFormRenderer
                templateId={selectedTemplate?.id}
                onSuccess={handleFormSuccess}
                onCancel={handleCancel}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedTemplate?.label || 'Select a Template'}
                  </h2>
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create New
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center p-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium mb-2">No records found</p>
                    <p className="text-sm">Create your first {selectedTemplate?.label?.toLowerCase()} to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {records.map((record, index) => {
                      const display = getRecordDisplay(record);
                      return (
                        <div
                          key={record.id || index}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800 mb-1">{display.title}</h3>
                              {display.subtitle && (
                                <p className="text-sm text-gray-600 mb-2">{display.subtitle}</p>
                              )}
                              <p className="text-xs text-gray-500">{display.details}</p>
                            </div>
                            <div className="flex gap-2">
                              <button className="text-blue-600 hover:text-blue-800 p-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button className="text-gray-400 hover:text-gray-600 p-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormsManager;
