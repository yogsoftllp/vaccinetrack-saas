import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Calendar, 
  Bell, 
  Users, 
  Smartphone, 
  Check, 
  Star,
  Baby,
  Heart,
  Clock,
  MapPin,
  Award
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const Landing: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null);
  const [authForm, setAuthForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (showAuthModal === 'register') {
        await register(authForm);
      } else {
        await login(authForm.email, authForm.password, 'parent');
      }
      setShowAuthModal(null);
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Calendar className="w-8 h-8 text-blue-600" />,
      title: "AI-Powered Scheduling",
      description: "Automatically generates personalized vaccination schedules based on your child's age and location"
    },
    {
      icon: <Bell className="w-8 h-8 text-green-600" />,
      title: "Smart Reminders",
      description: "Get timely notifications about upcoming vaccinations via email and SMS"
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-600" />,
      title: "Health Records",
      description: "Keep track of completed vaccinations and maintain digital health records"
    },
    {
      icon: <Users className="w-8 h-8 text-orange-600" />,
      title: "Multi-Child Support",
      description: "Manage vaccination schedules for all your children in one place"
    }
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      icon: <Star className="w-6 h-6" />,
      features: [
        "Up to 2 children",
        "Basic vaccination schedule",
        "Email reminders",
        "Basic health records",
        "Community support"
      ],
      popular: false
    },
    {
      name: "Premium",
      price: "$9.99",
      period: "/month",
      icon: <Award className="w-6 h-6" />,
      features: [
        "Up to 5 children",
        "Advanced AI scheduling",
        "Email + SMS reminders",
        "Complete health records",
        "Priority support",
        "Export reports",
        "Advanced notifications"
      ],
      popular: true
    },
    {
      name: "Family",
      price: "$19.99",
      period: "/month",
      icon: <Users className="w-6 h-6" />,
      features: [
        "Unlimited children",
        "Advanced AI scheduling",
        "Email + SMS reminders",
        "Complete health records",
        "Priority support",
        "Export reports",
        "Advanced notifications",
        "Family sharing",
        "Custom schedules"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Baby className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">VaccineTrack</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/super-admin/login"
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md transition-colors text-sm"
              >
                Admin
              </Link>
              <Link
                to="/clinic-login"
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md transition-colors"
              >
                Clinic Login
              </Link>
              <button
                onClick={() => setShowAuthModal('login')}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Parent Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Never Miss a
              <span className="text-blue-600"> Vaccination</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              AI-powered vaccination scheduling for your children. Get personalized schedules, 
              smart reminders, and track your child's health records - all in one secure platform.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowAuthModal('register')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Free Trial
              </button>
              <button className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Your Child's Health
            </h2>
            <p className="text-xl text-gray-600">
              Smart, secure, and simple vaccination management for modern parents
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade anytime. No hidden fees.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`relative rounded-lg p-8 ${plan.popular ? 'bg-blue-600 text-white shadow-xl' : 'bg-white shadow-lg'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-2">
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="ml-1">{plan.period}</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className={`w-5 h-5 mr-3 ${plan.popular ? 'text-yellow-400' : 'text-green-500'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => setShowAuthModal('register')}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    plan.popular 
                      ? 'bg-white text-blue-600 hover:bg-gray-100' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to keep your child healthy and protected
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign Up & Add Child</h3>
              <p className="text-gray-600">Create your account and add your child's basic information including date of birth and location.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Generates Schedule</h3>
              <p className="text-gray-600">Our AI automatically creates a personalized vaccination schedule based on your location and child's age.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Reminders</h3>
              <p className="text-gray-600">Receive timely notifications about upcoming vaccinations and track completed ones.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Keep Your Child Protected?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of parents who trust VaccineTrack to manage their children's vaccination schedules.
          </p>
          <button
            onClick={() => setShowAuthModal('register')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Free Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Baby className="w-6 h-6 mr-2" />
                <span className="text-xl font-bold">VaccineTrack</span>
              </div>
              <p className="text-gray-400">
                Smart vaccination scheduling for modern parents.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="#" className="hover:text-white">Features</Link></li>
                <li><Link to="#" className="hover:text-white">Pricing</Link></li>
                <li><Link to="#" className="hover:text-white">AI Scheduling</Link></li>
                <li><Link to="#" className="hover:text-white">Mobile App</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="#" className="hover:text-white">Help Center</Link></li>
                <li><Link to="#" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="#" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="#" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Clinics</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/clinic-login" className="hover:text-white">Clinic Portal</Link></li>
                <li><Link to="#" className="hover:text-white">Provider Login</Link></li>
                <li><Link to="#" className="hover:text-white">Integration</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 VaccineTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {showAuthModal === 'login' ? 'Parent Login' : 'Create Account'}
              </h3>
              <button
                onClick={() => setShowAuthModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAuth} className="space-y-4">
              {showAuthModal === 'register' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={authForm.firstName}
                      onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={authForm.lastName}
                      onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Loading...' : (showAuthModal === 'login' ? 'Login' : 'Create Account')}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {showAuthModal === 'login' ? "Don't have an account?" : 'Already have an account?'}
                <button
                  onClick={() => setShowAuthModal(showAuthModal === 'login' ? 'register' : 'login')}
                  className="text-blue-600 hover:underline ml-1"
                >
                  {showAuthModal === 'login' ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;