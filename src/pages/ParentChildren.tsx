import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Calendar, TrendingUp, ArrowRight, Baby } from 'lucide-react';

interface Child {
  id: string;
  name: string;
  date_of_birth: string;
  gender: 'male' | 'female';
  upcoming_vaccinations: number;
  completed_vaccinations: number;
  next_vaccination_date: string | null;
  next_vaccination_name: string | null;
  profile_image_url?: string;
}

export default function ParentChildren() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const token = localStorage.getItem('parentToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/parent-dashboard/children', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('parentToken');
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch children');
      }

      const data = await response.json();
      setChildren(data.children || []);
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const token = localStorage.getItem('parentToken');
      const response = await fetch('/api/parent-dashboard/children', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.get('name'),
          date_of_birth: formData.get('date_of_birth'),
          gender: formData.get('gender')
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add child');
      }

      setShowAddModal(false);
      fetchChildren(); // Refresh the list
    } catch (error) {
      console.error('Error adding child:', error);
      alert('Failed to add child. Please try again.');
    }
  };

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getVaccinationStatus = (child: Child) => {
    if (child.upcoming_vaccinations === 0) {
      return { status: 'up_to_date', color: 'text-green-600 bg-green-100', text: 'Up to date' };
    } else if (child.upcoming_vaccinations <= 2) {
      return { status: 'almost_due', color: 'text-yellow-600 bg-yellow-100', text: 'Almost due' };
    } else {
      return { status: 'overdue', color: 'text-red-600 bg-red-100', text: 'Vaccinations due' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your children...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Children</h1>
              <p className="text-gray-600 mt-2">Manage your children's vaccination schedules and health records</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Child</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Children</p>
                <p className="text-2xl font-bold text-gray-900">{children.length}</p>
              </div>
              <Baby className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Vaccines</p>
                <p className="text-2xl font-bold text-orange-600">
                  {children.reduce((sum, child) => sum + child.upcoming_vaccinations, 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {children.reduce((sum, child) => sum + child.completed_vaccinations, 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Children Grid */}
        {children.length === 0 ? (
          <div className="text-center py-12">
            <Baby className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No children added yet</h3>
            <p className="text-gray-600 mb-6">Start by adding your first child to track their vaccination schedule</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Child
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => {
              const status = getVaccinationStatus(child);
              const age = getAge(child.date_of_birth);
              
              return (
                <div key={child.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 rounded-full p-3">
                          <User className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{child.name}</h3>
                          <p className="text-sm text-gray-600">{age} years old</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Upcoming:</span>
                        <span className="font-medium text-orange-600">{child.upcoming_vaccinations}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-medium text-green-600">{child.completed_vaccinations}</span>
                      </div>
                      {child.next_vaccination_date && (
                        <div className="text-sm">
                          <span className="text-gray-600">Next vaccine:</span>
                          <p className="font-medium text-gray-900">{child.next_vaccination_name}</p>
                          <p className="text-gray-600">{new Date(child.next_vaccination_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/parent/child/${child.id}`)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View Schedule
                      </button>
                      <button
                        onClick={() => navigate(`/parent/child/${child.id}/vaccinations`)}
                        className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        History
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Child Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Child</h3>
            <form onSubmit={handleAddChild}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Child's Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter child's full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    name="gender"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Child
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}