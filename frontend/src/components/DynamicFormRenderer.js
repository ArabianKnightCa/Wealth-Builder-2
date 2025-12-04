import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Dynamic Form Renderer Component
 * Renders forms based on backend template definitions
 */
const DynamicFormRenderer = ({ templateId, onSuccess, onCancel, initialData = {} }) => {
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [lookupOptions, setLookupOptions] = useState({});

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/forms/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplate(response.data);
      
      // Load lookup options for lookup fields
      const lookupFields = response.data.fields.filter(f => f.input === 'lookup');
      for (const field of lookupFields) {
        await fetchLookupOptions(field.name, field.collection, field.displayField);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching form template:', error);
      setLoading(false);
    }
  };

  const fetchLookupOptions = async (fieldName, collection, displayField) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/forms/lookup/${collection}?display_field=${displayField}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLookupOptions(prev => ({
        ...prev,
        [fieldName]: response.data
      }));
    } catch (error) {
      console.error(`Error fetching lookup options for ${fieldName}:`, error);
    }
  };

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    template.fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/forms/submit/${templateId}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ _form: error.response?.data?.detail || 'Failed to submit form' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];

    const baseInputClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      error ? 'border-red-500' : 'border-gray-300'
    }`;

    switch (field.input) {
      case 'text':
      case 'email':
        return (
          <input
            type={field.input}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={baseInputClass}
            placeholder={field.label}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={baseInputClass}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={baseInputClass}
          >
            <option value="">Select {field.label}</option>
            {field.options && field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'lookup':
        const options = lookupOptions[field.name] || [];
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={baseInputClass}
          >
            <option value="">Select {field.label}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => handleChange(field.name, e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        );

      default:
        return <span className="text-gray-400">Unsupported field type: {field.input}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Failed to load form template
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{template.label}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {template.fields.map(field => (
          <div key={field.name}>
            <label className="block mb-2">
              <span className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
            {renderField(field)}
            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
            )}
          </div>
        ))}

        {errors._form && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {errors._form}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default DynamicFormRenderer;
