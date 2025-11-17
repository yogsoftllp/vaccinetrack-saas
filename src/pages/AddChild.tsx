import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Calendar, ArrowLeft } from 'lucide-react';

export default function AddChild() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    gender: '',
    birth_weight: '',
    birth_height: '',
    blood_type: '',
    allergies: '',
    medical_notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('parentToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/parent-dashboard/children', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to add child');
      }

      const result = await response.json();
      
      // Navigate to the child's detail page or back to children list
      navigate(`/parent/child/${result.child.id}`);
    } catch (error) {
      console.error('Error adding child:', error);
      alert('Failed to add child. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate('/parent/children')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Children
          </button>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">Add New Child</h1>
        <p className="text-gray-600 mt-2">Add your child's information to start tracking their vaccination schedule</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Child's Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter child's full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  required
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Type
                </label>
                <select
                  name="blood_type"
                  value={formData.blood_type}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
          </div>

          {/* Birth Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Birth Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Weight (kg)
                </label>
                <input
                  type="number"
                  name="birth_weight"
                  step="0.1"
                  value={formData.birth_weight}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 3.2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Height (cm)
                </label>
                <input
                  type="number"
                  name="birth_height"
                  value={formData.birth_height}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 50"
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergies
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="List any known allergies (medications, foods, etc.)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Notes
                </label>
                <textarea
                  name="medical_notes"
                  value={formData.medical_notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional medical information or notes"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/parent/children')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Add Child</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}