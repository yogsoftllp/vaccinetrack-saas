import React, { useState } from 'react';
import { X, Building2, Mail, User, Globe, Phone, MapPin } from 'lucide-react';
import { useSuperAdminStore, SubscriptionPlan } from '../stores/superAdminStore';

interface CreateTenantModalProps {
  onClose: () => void;
  subscriptionPlans: SubscriptionPlan[];
}

const CreateTenantModal: React.FC<CreateTenantModalProps> = ({ onClose, subscriptionPlans }) => {
  const { createTenant, isLoading } = useSuperAdminStore();
  
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    business_name: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    timezone: 'UTC',
    locale: 'en',
    plan_id: subscriptionPlans[0]?.id || '',
    admin_email: '',
    admin_first_name: '',
    admin_last_name: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tenant name is required';
    }

    if (!formData.subdomain.trim()) {
      newErrors.subdomain = 'Subdomain is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      newErrors.subdomain = 'Subdomain can only contain lowercase letters, numbers, and hyphens';
    }

    if (!formData.plan_id) {
      newErrors.plan_id = 'Subscription plan is required';
    }

    if (!formData.admin_email.trim()) {
      newErrors.admin_email = 'Admin email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
      newErrors.admin_email = 'Invalid email format';
    }

    if (!formData.admin_first_name.trim()) {
      newErrors.admin_first_name = 'Admin first name is required';
    }

    if (!formData.admin_last_name.trim()) {
      newErrors.admin_last_name = 'Admin last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await createTenant(formData);
      onClose();
    } catch (error) {
      // Error is handled in the store
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Create New Tenant</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tenant Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Tenant Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Tenant Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.name ? 'border-red-300' : ''
                  }`}
                  placeholder="ABC Medical Clinic"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
                  Subdomain *
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    id="subdomain"
                    name="subdomain"
                    value={formData.subdomain}
                    onChange={handleInputChange}
                    className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.subdomain ? 'border-red-300' : ''
                    }`}
                    placeholder="abc-clinic"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    .vaccineclinic.com
                  </span>
                </div>
                {errors.subdomain && (
                  <p className="mt-1 text-sm text-red-600">{errors.subdomain}</p>
                )}
              </div>

              <div>
                <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">
                  Business Name
                </label>
                <input
                  type="text"
                  id="business_name"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="ABC Medical Corporation"
                />
              </div>

              <div>
                <label htmlFor="business_phone" className="block text-sm font-medium text-gray-700">
                  Business Phone
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="business_phone"
                    name="business_phone"
                    value={formData.business_phone}
                    onChange={handleInputChange}
                    className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="business_address" className="block text-sm font-medium text-gray-700">
                  Business Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-start pointer-events-none pt-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                  <textarea
                    id="business_address"
                    name="business_address"
                    rows={3}
                    value={formData.business_address}
                    onChange={handleInputChange}
                    className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="business_email" className="block text-sm font-medium text-gray-700">
                  Business Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="business_email"
                    name="business_email"
                    value={formData.business_email}
                    onChange={handleInputChange}
                    className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="info@abcclinic.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Admin Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Admin User
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="admin_first_name" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  type="text"
                  id="admin_first_name"
                  name="admin_first_name"
                  value={formData.admin_first_name}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.admin_first_name ? 'border-red-300' : ''
                  }`}
                  placeholder="John"
                />
                {errors.admin_first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.admin_first_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="admin_last_name" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="admin_last_name"
                  name="admin_last_name"
                  value={formData.admin_last_name}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.admin_last_name ? 'border-red-300' : ''
                  }`}
                  placeholder="Doe"
                />
                {errors.admin_last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.admin_last_name}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="admin_email" className="block text-sm font-medium text-gray-700">
                  Admin Email *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="admin_email"
                    name="admin_email"
                    value={formData.admin_email}
                    onChange={handleInputChange}
                    className={`pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.admin_email ? 'border-red-300' : ''
                    }`}
                    placeholder="john.doe@abcclinic.com"
                  />
                </div>
                {errors.admin_email && (
                  <p className="mt-1 text-sm text-red-600">{errors.admin_email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Plan */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Subscription Plan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.plan_id === plan.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, plan_id: plan.id }))}
                >
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="radio"
                        name="plan_id"
                        value={plan.id}
                        checked={formData.plan_id === plan.id}
                        onChange={() => {}}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">{plan.name}</h4>
                      <p className="text-sm text-gray-500">{plan.description}</p>
                      <div className="mt-2">
                        <span className="text-lg font-semibold text-gray-900">
                          ${plan.price_monthly}/mo
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          or ${plan.price_yearly}/year
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        <p>• Up to {plan.max_users} users</p>
                        <p>• Up to {plan.max_patients} patients</p>
                        <p>• {plan.storage_gb}GB storage</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.plan_id && (
              <p className="mt-1 text-sm text-red-600">{errors.plan_id}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTenantModal;