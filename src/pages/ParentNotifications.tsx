import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Mail, Smartphone, Calendar, Clock, User, Shield, Save, X } from 'lucide-react';
import { PWASettings } from '@/components/PWAComponents';

interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  reminder_days_before: number;
  reminder_time: string;
  vaccine_due_alerts: boolean;
  appointment_reminders: boolean;
  milestone_alerts: boolean;
  emergency_alerts: boolean;
  weekly_summary: boolean;
  marketing_emails: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  timezone: string;
}

export default function ParentNotifications() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    reminder_days_before: 7,
    reminder_time: '09:00',
    vaccine_due_alerts: true,
    appointment_reminders: true,
    milestone_alerts: true,
    emergency_alerts: true,
    weekly_summary: true,
    marketing_emails: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchProfileAndPreferences();
  }, []);

  const fetchProfileAndPreferences = async () => {
    try {
      const token = localStorage.getItem('parentToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const [profileResponse, preferencesResponse] = await Promise.all([
        fetch('/api/parent-auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/parent-dashboard/notification-preferences', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!profileResponse.ok || !preferencesResponse.ok) {
        if (profileResponse.status === 401 || preferencesResponse.status === 401) {
          localStorage.removeItem('parentToken');
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch data');
      }

      const profileData = await profileResponse.json();
      const preferencesData = await preferencesResponse.json();
      
      setProfile(profileData);
      setPreferences(preferencesData);
    } catch (error) {
      console.error('Error fetching profile and preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean | number | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('parentToken');
      const response = await fetch('/api/parent-dashboard/notification-preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      setMessage({ type: 'success', text: 'Notification preferences saved successfully!' });
      
      // Hide message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const getNotificationChannels = () => {
    const channels = [];
    if (preferences.email_notifications) channels.push('Email');
    if (preferences.sms_notifications) channels.push('SMS');
    if (preferences.push_notifications) channels.push('Push');
    return channels.length > 0 ? channels.join(', ') : 'None';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notification settings...</p>
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
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/parent/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/parent/subscription')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Subscription
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
          </div>
          
          <div className="p-6">
            {profile && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{profile.name}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{profile.email}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{profile.phone || 'Not provided'}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{profile.timezone}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notification Channels */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Notification Channels</h2>
            <p className="text-sm text-gray-600 mt-1">Choose how you want to receive notifications</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_notifications}
                  onChange={(e) => handlePreferenceChange('email_notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-600">Receive text messages (requires paid plan)</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.sms_notifications}
                  onChange={(e) => handlePreferenceChange('sms_notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-600">Receive browser notifications</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.push_notifications}
                  onChange={(e) => handlePreferenceChange('push_notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Reminder Settings */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Reminder Settings</h2>
            <p className="text-sm text-gray-600 mt-1">Customize when and how you receive reminders</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remind me before vaccination
              </label>
              <select
                value={preferences.reminder_days_before}
                onChange={(e) => handlePreferenceChange('reminder_days_before', parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 day before</option>
                <option value={3}>3 days before</option>
                <option value={7}>1 week before</option>
                <option value={14}>2 weeks before</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred reminder time
              </label>
              <input
                type="time"
                value={preferences.reminder_time}
                onChange={(e) => handlePreferenceChange('reminder_time', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Notification Types</h2>
            <p className="text-sm text-gray-600 mt-1">Choose which notifications you want to receive</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Vaccination Due Alerts</p>
                <p className="text-sm text-gray-600">Get notified when vaccinations are due</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.vaccine_due_alerts}
                  onChange={(e) => handlePreferenceChange('vaccine_due_alerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Appointment Reminders</p>
                <p className="text-sm text-gray-600">Get reminded about upcoming appointments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.appointment_reminders}
                  onChange={(e) => handlePreferenceChange('appointment_reminders', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Milestone Alerts</p>
                <p className="text-sm text-gray-600">Get notified about developmental milestones</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.milestone_alerts}
                  onChange={(e) => handlePreferenceChange('milestone_alerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Emergency Alerts</p>
                <p className="text-sm text-gray-600">Get notified about urgent health information</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.emergency_alerts}
                  onChange={(e) => handlePreferenceChange('emergency_alerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Weekly Summary</p>
                <p className="text-sm text-gray-600">Receive a weekly summary of your children's health</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.weekly_summary}
                  onChange={(e) => handlePreferenceChange('weekly_summary', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Marketing Emails</p>
                <p className="text-sm text-gray-600">Receive updates about new features and offers</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.marketing_emails}
                  onChange={(e) => handlePreferenceChange('marketing_emails', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Current Settings Summary */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Current Settings</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Active Channels:</span>
                <span className="ml-2 text-gray-900">{getNotificationChannels()}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Reminder Time:</span>
                <span className="ml-2 text-gray-900">{preferences.reminder_time}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Days Before:</span>
                <span className="ml-2 text-gray-900">{preferences.reminder_days_before} days</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Total Alerts:</span>
                <span className="ml-2 text-gray-900">
                  {Object.values(preferences).filter(v => v === true).length - 3} types
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => navigate('/parent/dashboard')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="h-4 w-4 inline mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 inline mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}