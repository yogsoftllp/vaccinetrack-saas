import React, { useState, useEffect } from 'react';
import { X, Building2, Users, Calendar, DollarSign, Settings, Mail, Phone, MapPin, CreditCard, ToggleLeft, ToggleRight } from 'lucide-react';
import { useSuperAdminStore } from '../stores/superAdminStore';
import { Tenant, TenantSubscription, Feature, TenantFeature } from '../stores/superAdminStore';

interface TenantDetailsModalProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface SubscriptionFormData {
  planId: string;
  status: 'active' | 'trial' | 'suspended' | 'cancelled';
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
}

const TenantDetailsModal: React.FC<TenantDetailsModalProps> = ({ tenantId, isOpen, onClose }) => {
  const { 
    tenants, 
    subscriptionPlans, 
    features, 
    tenantFeatures, 
    updateTenant, 
    updateTenantSubscription, 
    updateTenantFeature,
    fetchTenantDetails 
  } = useSuperAdminStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'features' | 'users'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState<SubscriptionFormData>({
    planId: '',
    status: 'active',
    trialEndsAt: '',
    subscriptionEndsAt: ''
  });

  const tenant = tenants.find(t => t.id === tenantId);
  const tenantSubscription = tenant?.subscription;
  const tenantFeatureList = tenantFeatures[tenantId] || [];

  useEffect(() => {
    if (tenantId && isOpen) {
      fetchTenantDetails(tenantId);
      if (tenantSubscription) {
        setSubscriptionForm({
          planId: tenantSubscription.plan_id,
          status: tenantSubscription.status as 'active' | 'cancelled' | 'suspended' | 'trial',
          trialEndsAt: tenantSubscription.trial_end || '',
          subscriptionEndsAt: ''
        });
      }
    }
  }, [tenantId, isOpen, tenantSubscription]);

  const handleUpdateSubscription = async () => {
    if (!tenantId || !tenantSubscription) return;
    
    setIsLoading(true);
    try {
      await updateTenantSubscription(tenantId, subscriptionForm.planId);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFeature = async (featureId: string, currentValue: boolean) => {
    if (!tenantId) return;
    
    try {
      await updateTenantFeature(tenantId, featureId, !currentValue);
    } catch (error) {
      console.error('Failed to update feature:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!isOpen || !tenant) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">{tenant.name}</h2>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tenant.status)}`}>
              {tenant.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Building2 },
              { id: 'subscription', label: 'Subscription', icon: CreditCard },
              { id: 'features', label: 'Features', icon: Settings },
              { id: 'users', label: 'Users', icon: Users }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {tenant.contact_email}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {tenant.contact_phone || 'N/A'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {tenant.address || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Account Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-900">{formatDate(tenant.created_at)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Updated:</span>
                      <span className="text-gray-900">{formatDate(tenant.updated_at)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subdomain:</span>
                      <span className="text-gray-900">{tenant.subdomain}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600">Total Users</p>
                      <p className="text-2xl font-semibold text-blue-900">{tenant.user_count || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600">Active Since</p>
                      <p className="text-2xl font-semibold text-green-900">
                        {Math.ceil((Date.now() - new Date(tenant.created_at).getTime()) / (1000 * 60 * 60 * 24))}d
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-600">Monthly Revenue</p>
                      <p className="text-2xl font-semibold text-purple-900">
                        {tenantSubscription ? formatCurrency(subscriptionPlans.find(p => p.id === tenantSubscription.plan_id)?.price || 0) : '$0'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Subscription Details</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {isEditing ? 'Cancel' : 'Edit Subscription'}
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Plan</label>
                    {isEditing ? (
                      <select
                        value={subscriptionForm.planId}
                        onChange={(e) => setSubscriptionForm({ ...subscriptionForm, planId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        {subscriptionPlans.map(plan => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - {formatCurrency(plan.price)}/month
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-900">
                        {subscriptionPlans.find(p => p.id === tenantSubscription?.plan_id)?.name} - 
                        {formatCurrency(subscriptionPlans.find(p => p.id === tenantSubscription?.plan_id)?.price || 0)}/month
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    {isEditing ? (
                      <select
                        value={subscriptionForm.status}
                        onChange={(e) => setSubscriptionForm({ ...subscriptionForm, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="trial">Trial</option>
                        <option value="suspended">Suspended</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tenantSubscription?.status || 'active')}`}>
                        {tenantSubscription?.status}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trial Ends At</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={subscriptionForm.trialEndsAt?.split('T')[0] || ''}
                        onChange={(e) => setSubscriptionForm({ ...subscriptionForm, trialEndsAt: e.target.value ? `${e.target.value}T00:00:00Z` : '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{formatDate(tenantSubscription?.trial_end)}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Ends At</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={subscriptionForm.subscriptionEndsAt?.split('T')[0] || ''}
                        onChange={(e) => setSubscriptionForm({ ...subscriptionForm, subscriptionEndsAt: e.target.value ? `${e.target.value}T00:00:00Z` : '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{formatDate(tenantSubscription?.current_period_end)}</p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleUpdateSubscription}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'Updating...' : 'Update Subscription'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Feature Configuration</h3>
              <div className="space-y-3">
                {features.map(feature => {
                  const tenantFeature = tenantFeatureList.find(tf => tf.feature_id === feature.id);
                  const isEnabled = tenantFeature?.enabled || false;

                  return (
                    <div key={feature.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{feature.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            feature.category === 'core' ? 'bg-blue-100 text-blue-800' :
                            feature.category === 'advanced' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {feature.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {feature.is_premium ? 'Premium' : 'Standard'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleFeature(feature.id, isEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Tenant Users</h3>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                  Invite User
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* User list would be populated here */}
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          User management coming soon...
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantDetailsModal;