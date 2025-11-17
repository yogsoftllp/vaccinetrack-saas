import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle, Clock, AlertCircle, TrendingUp, Shield, Users, Bell } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  max_children: number;
  max_reminders: number;
  stripe_price_id: string;
}

interface CurrentSubscription {
  id: string;
  plan_name: string;
  status: 'active' | 'trial' | 'cancelled' | 'past_due';
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_method: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  } | null;
}

export default function ParentSubscription() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const token = localStorage.getItem('parentToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/parent-subscriptions/current', {
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
        throw new Error('Failed to fetch subscription data');
      }

      const data = await response.json();
      setPlans(data.plans || []);
      setCurrentSubscription(data.currentSubscription);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setShowUpgradeModal(true);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('parentToken');
      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      
      const response = await fetch('/api/parent-subscriptions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price_id: selectedPlanData?.stripe_price_id,
          plan_id: selectedPlan
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = (window as any).Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Failed to create subscription. Please try again.');
    } finally {
      setProcessing(false);
      setShowUpgradeModal(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;
    
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.')) {
      return;
    }

    try {
      const token = localStorage.getItem('parentToken');
      const response = await fetch('/api/parent-subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Refresh subscription data
      fetchSubscriptionData();
      alert('Your subscription has been cancelled. You will continue to have access until the end of your current billing period.');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'trial':
        return 'text-blue-600 bg-blue-100';
      case 'past_due':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'trial':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'past_due':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription details...</p>
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
                onClick={() => navigate('/parent/notifications')}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Subscription Status */}
        {currentSubscription && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Current Subscription</h2>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(currentSubscription.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">{currentSubscription.plan_name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(currentSubscription.status)}`}>
                      {currentSubscription.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-600">Renews on</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {currentSubscription.payment_method && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      {currentSubscription.payment_method.brand} ending in {currentSubscription.payment_method.last4}
                    </span>
                    <span className="text-sm text-gray-500">
                      Expires {currentSubscription.payment_method.exp_month}/{currentSubscription.payment_method.exp_year}
                    </span>
                  </div>
                </div>
              )}
              
              {currentSubscription.status === 'active' && !currentSubscription.cancel_at_period_end && (
                <button
                  onClick={handleCancelSubscription}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cancel Subscription
                </button>
              )}
              
              {currentSubscription.cancel_at_period_end && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      Your subscription will be cancelled at the end of the current billing period.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Choose Your Plan</h2>
            <p className="text-sm text-gray-600 mt-1">Select the plan that best fits your family's needs</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isCurrentPlan = currentSubscription?.plan_name === plan.name;
                const isTrial = currentSubscription?.status === 'trial';
                
                return (
                  <div key={plan.id} className={`border rounded-lg p-6 ${
                    isCurrentPlan ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}>
                    {isCurrentPlan && (
                      <div className="flex items-center justify-center mb-4">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Current Plan
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="flex items-baseline justify-center">
                        <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                        <span className="text-gray-600 ml-1">/{plan.interval}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">Up to {plan.max_children} children</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">{plan.max_reminders} reminders per month</span>
                      </li>
                      {plan.name === 'Pro' && (
                        <>
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Email notifications</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Priority support</span>
                          </li>
                        </>
                      )}
                      {plan.name === 'Family Plus' && (
                        <>
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Email & SMS notifications</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Premium support</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Advanced analytics</span>
                          </li>
                        </>
                      )}
                    </ul>
                    
                    <button
                      onClick={() => handlePlanSelect(plan.id)}
                      disabled={isCurrentPlan || processing}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        isCurrentPlan
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : isTrial
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isCurrentPlan ? 'Current Plan' : isTrial ? 'Upgrade Now' : 'Choose Plan'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-lg shadow mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Features Comparison</h2>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Children</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {plan.max_children}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Monthly Reminders</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {plan.max_reminders}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Email Notifications</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {plan.name !== 'Free' ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SMS Notifications</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {plan.name === 'Family Plus' ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Priority Support</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {plan.name !== 'Free' ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Advanced Analytics</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {plan.name === 'Family Plus' ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Upgrade</h3>
            
            {(() => {
              const plan = plans.find(p => p.id === selectedPlan);
              return (
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    You are about to upgrade to the <span className="font-semibold">{plan?.name}</span> plan for ${plan?.price}/{plan?.interval}.
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Plan Features:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Up to {plan?.max_children} children</li>
                      <li>• {plan?.max_reminders} reminders per month</li>
                      {plan?.name !== 'Free' && <li>• Email notifications</li>}
                      {plan?.name === 'Family Plus' && <li>• SMS notifications</li>}
                      {plan?.name !== 'Free' && <li>• Priority support</li>}
                    </ul>
                  </div>
                </div>
              );
            })()}
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Upgrade Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}