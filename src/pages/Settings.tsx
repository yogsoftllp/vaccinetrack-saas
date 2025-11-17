import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useFeatureStore } from '../stores/featureStore';
import { FeatureFlag } from '../components/FeatureFlag';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  Key,
  Users,
  Shield,
  CreditCard,
  Settings as SettingsIcon
} from 'lucide-react';

interface TenantSettings {
  name: string;
  business_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  settings: {
    timezone?: string;
    language?: string;
    date_format?: string;
    notifications_enabled?: boolean;
    auto_backup_enabled?: boolean;
  };
}

const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const { fetchTenantFeatures } = useFeatureStore();
  const [settings, setSettings] = useState<TenantSettings>({
    name: '',
    business_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    settings: {
      timezone: 'UTC',
      language: 'en',
      date_format: 'MM/DD/YYYY',
      notifications_enabled: true,
      auto_backup_enabled: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadTenantSettings();
    if (user?.tenant_id) {
      fetchTenantFeatures(user.tenant_id);
    }
  }, [user?.tenant_id]);

  const loadTenantSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tenant/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      if (data.success && data.tenant) {
        setSettings({
          name: data.tenant.name || '',
          business_name: data.tenant.business_name || '',
          contact_email: data.tenant.contact_email || '',
          contact_phone: data.tenant.contact_phone || '',
          address: data.tenant.address || '',
          settings: data.tenant.settings || {
            timezone: 'UTC',
            language: 'en',
            date_format: 'MM/DD/YYYY',
            notifications_enabled: true,
            auto_backup_enabled: true,
          },
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/tenant/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Settings updated successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev.settings,
          [child]: value,
        },
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your clinic configuration and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Shield className="h-3 w-3 mr-1" />
            {user?.role}
          </Badge>
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building className="h-4 w-4 inline mr-2" />
            General
          </button>
          
          <FeatureFlag feature="advanced_settings">
            <button
              onClick={() => setActiveTab('security')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Key className="h-4 w-4 inline mr-2" />
              Security
            </button>
          </FeatureFlag>

          <FeatureFlag feature="user_management">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Users
            </button>
          </FeatureFlag>

          <FeatureFlag feature="billing_management">
            <button
              onClick={() => setActiveTab('billing')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'billing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CreditCard className="h-4 w-4 inline mr-2" />
              Billing
            </button>
          </FeatureFlag>
        </nav>
      </div>

      {/* Settings Content */}
      <div className="space-y-6">
        {activeTab === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Update your clinic's basic information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Clinic Name</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter clinic name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={settings.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    placeholder="Enter business name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="contact@clinic.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="contact_phone"
                    value={settings.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="address"
                    value={settings.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Medical Center Dr, City, State 12345"
                    className="pl-10"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={settings.settings.timezone}
                    onChange={(e) => handleInputChange('settings.timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_format">Date Format</Label>
                  <select
                    id="date_format"
                    value={settings.settings.date_format}
                    onChange={(e) => handleInputChange('settings.date_format', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notifications_enabled"
                  checked={settings.settings.notifications_enabled}
                  onChange={(e) => handleInputChange('settings.notifications_enabled', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="notifications_enabled">Enable email notifications</Label>
              </div>

              <FeatureFlag feature="advanced_backup">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto_backup_enabled"
                    checked={settings.settings.auto_backup_enabled}
                    onChange={(e) => handleInputChange('settings.auto_backup_enabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="auto_backup_enabled">Enable automatic data backup</Label>
                </div>
              </FeatureFlag>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'security' && (
          <FeatureFlag feature="advanced_settings">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your clinic's security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        Require 2FA for all administrator accounts
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <h4 className="font-medium">Session Timeout</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatically log out users after inactivity
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <h4 className="font-medium">API Access</h4>
                      <p className="text-sm text-muted-foreground">
                        Manage API keys and integrations
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FeatureFlag>
        )}

        {activeTab === 'users' && (
          <FeatureFlag feature="user_management">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage users and permissions for your clinic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>User management is handled in the Tenant Admin Dashboard</p>
                  <p className="text-sm">Please visit the admin dashboard to manage users</p>
                </div>
              </CardContent>
            </Card>
          </FeatureFlag>
        )}

        {activeTab === 'billing' && (
          <FeatureFlag feature="billing_management">
            <Card>
              <CardHeader>
                <CardTitle>Billing Settings</CardTitle>
                <CardDescription>
                  Manage your subscription and billing information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Billing management is handled in the Tenant Admin Dashboard</p>
                  <p className="text-sm">Please visit the admin dashboard to manage billing</p>
                </div>
              </CardContent>
            </Card>
          </FeatureFlag>
        )}
      </div>
    </div>
  );
};

export default Settings;