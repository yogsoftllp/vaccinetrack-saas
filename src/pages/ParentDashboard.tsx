import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Calendar, Bell, Settings, CreditCard, Shield, TrendingUp, Users, AlertCircle, CheckCircle, WifiOff, RefreshCw } from 'lucide-react';
import { offlineDataManager } from '@/utils/offlineDataManager';
import { useServiceWorker } from '@/hooks/usePWA';
import { SyncStatusIndicator, OfflineStatusIndicator } from '@/components/PWAComponents';

interface Child {
  id: string;
  name: string;
  date_of_birth: string;
  gender: 'male' | 'female';
  upcoming_vaccinations: number;
  completed_vaccinations: number;
}

interface DashboardStats {
  totalChildren: number;
  upcomingVaccinations: number;
  completedVaccinations: number;
  subscriptionStatus: string;
  subscriptionEndDate: string;
  daysUntilNextVaccination: number;
}

interface UpcomingVaccination {
  id: string;
  child_name: string;
  vaccine_name: string;
  due_date: string;
  status: 'upcoming' | 'overdue' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [children, setChildren] = useState<Child[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingVaccinations, setUpcomingVaccinations] = useState<UpcomingVaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isDataStale, setIsDataStale] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up offline status monitoring
    const handleOnline = () => {
      setIsOffline(false);
      // Refresh data when back online
      fetchDashboardData();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      loadOfflineData();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial offline status
    setIsOffline(!navigator.onLine);
    if (!navigator.onLine) {
      loadOfflineData();
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineData = async () => {
    try {
      const cachedData = offlineDataManager.getCachedData();
      
      // Transform offline data to match UI format
      const transformedChildren: Child[] = cachedData.children.map(child => ({
        id: child.id,
        name: child.full_name,
        date_of_birth: child.date_of_birth,
        gender: child.gender as 'male' | 'female',
        upcoming_vaccinations: 0, // Will be calculated
        completed_vaccinations: 0 // Will be calculated
      }));

      const upcomingVaccinations = offlineDataManager.getUpcomingReminders(30);
      
      setChildren(transformedChildren);
      setUpcomingVaccinations(upcomingVaccinations.map(reminder => ({
        id: reminder.id,
        child_name: reminder.child_id, // Will need to map to child name
        vaccine_name: reminder.message,
        due_date: reminder.scheduled_date,
        status: 'upcoming' as const,
        priority: 'medium' as const
      })));

      setStats({
        totalChildren: transformedChildren.length,
        upcomingVaccinations: upcomingVaccinations.length,
        completedVaccinations: cachedData.vaccinations.filter(v => v.completed).length,
        subscriptionStatus: 'active',
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        daysUntilNextVaccination: upcomingVaccinations.length > 0 ? 
          Math.ceil((new Date(upcomingVaccinations[0].scheduled_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0
      });

      setIsDataStale(offlineDataManager.isDataStale());
      setLoading(false);
    } catch (error) {
      console.error('Failed to load offline data:', error);
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('parentToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Try to fetch fresh data first
      const response = await fetch('/api/parent-dashboard/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChildren(data.children || []);
        setStats(data.stats || null);
        setUpcomingVaccinations(data.upcomingVaccinations || []);
        
        // Update offline cache
        await offlineDataManager.syncWithServer();
        setIsDataStale(false);
      } else if (response.status === 401) {
        localStorage.removeItem('parentToken');
        navigate('/login');
        return;
      } else {
        // If request fails but we have cached data, use it
        await loadOfflineData();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (childData: any) => {
    try {
      const token = localStorage.getItem('parentToken');
      const response = await fetch('/api/parent-dashboard/children', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(childData)
      });

      if (!response.ok) {
        throw new Error('Failed to add child');
      }

      setShowAddChildModal(false);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error adding child:', error);
      alert('Failed to add child. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('parentToken');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">VaccineTrack</h1>
              </div>
              <span className="text-sm text-gray-500">Parent Portal</span>
              {isOffline && (
                <div className="flex items-center space-x-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-xs font-medium">Offline</span>
                </div>
              )}
              {isDataStale && !isOffline && (
                <div className="flex items-center space-x-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md">
                  <RefreshCw className="h-4 w-4" />
                  <span className="text-xs font-medium">Stale Data</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddChildModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Child</span>
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* PWA Status Indicators */}
        <OfflineStatusIndicator />
        <SyncStatusIndicator />
        
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Children</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalChildren}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Vaccines</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.upcomingVaccinations}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedVaccinations}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Subscription</p>
                  <p className="text-lg font-bold text-blue-600 capitalize">{stats.subscriptionStatus}</p>
                  <p className="text-xs text-gray-500">Ends {new Date(stats.subscriptionEndDate).toLocaleDateString()}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Children List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">My Children</h2>
              </div>
              
              <div className="p-6">
                {children.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No children added yet</p>
                    <button
                      onClick={() => setShowAddChildModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Your First Child
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {children.map((child) => (
                      <div key={child.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 rounded-full p-2">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{child.name}</h3>
                              <p className="text-sm text-gray-600">
                                Born {new Date(child.date_of_birth).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="text-orange-600">
                                <span className="font-medium">{child.upcoming_vaccinations}</span>
                                <span className="text-gray-500 ml-1">Upcoming</span>
                              </div>
                              <div className="text-green-600">
                                <span className="font-medium">{child.completed_vaccinations}</span>
                                <span className="text-gray-500 ml-1">Completed</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => navigate(`/parent/child/${child.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View Schedule
                          </button>
                          <button
                            onClick={() => navigate(`/parent/child/${child.id}/vaccinations`)}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            Vaccination History
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Vaccinations */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Vaccinations</h2>
              </div>
              
              <div className="p-6">
                {upcomingVaccinations.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No upcoming vaccinations</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingVaccinations.map((vaccination) => (
                      <div key={vaccination.id} className="border-l-4 border-orange-400 bg-orange-50 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{vaccination.vaccine_name}</h4>
                            <p className="text-sm text-gray-600">{vaccination.child_name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Due: {new Date(vaccination.due_date).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            vaccination.priority === 'high' ? 'bg-red-100 text-red-800' :
                            vaccination.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {vaccination.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              
              <div className="p-6 space-y-3">
                <button
                  onClick={() => navigate('/parent/subscription')}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium">Manage Subscription</span>
                  </div>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </button>
                
                <button
                  onClick={() => navigate('/parent/notifications')}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium">Notification Settings</span>
                  </div>
                  <Bell className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Child Modal */}
      {showAddChildModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Child</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handleAddChild({
                  name: formData.get('name'),
                  date_of_birth: formData.get('date_of_birth'),
                  gender: formData.get('gender')
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Child's Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter child's full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
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
                  onClick={() => setShowAddChildModal(false)}
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