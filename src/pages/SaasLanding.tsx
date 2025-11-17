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
  Award,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  ChevronRight,
  CheckCircle,
  Zap,
  TrendingUp,
  Lock,
  Building2,
  User
} from 'lucide-react';

const SaasLanding: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState<'parent-login' | 'parent-register' | 'clinic-login' | 'clinic-register' | null>(null);
  const [authForm, setAuthForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '', clinicName: '' });
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const isParent = showAuthModal?.includes('parent');
      const endpoint = isParent 
        ? `/api/parent-auth/${showAuthModal === 'parent-login' ? 'login' : 'register'}`
        : '/api/auth/login'; // Clinic users use existing auth system
      
      const payload = {
        email: authForm.email,
        password: authForm.password,
        ...(showAuthModal?.includes('register') && {
          firstName: authForm.firstName,
          lastName: authForm.lastName,
          phone: authForm.phone,
        }),
        ...(showAuthModal === 'clinic-register' && {
          clinicName: authForm.clinicName,
        }),
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store token and user info
      if (data.token) {
        if (isParent) {
          localStorage.setItem('parentToken', data.token);
        } else {
          localStorage.setItem('token', data.token);
        }
        localStorage.setItem('userType', isParent ? 'parent' : 'clinic');
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      setShowAuthModal(null);
      
      // Redirect based on user type
      if (isParent) {
        window.location.href = '/parent/dashboard';
      } else {
        window.location.href = '/clinic/dashboard';
      }
      
    } catch (error: any) {
      console.error('Auth error:', error);
      alert(error.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEarlyAccess = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thank you! We'll notify ${email} when we launch.`);
    setEmail('');
  };

  const features = [
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: "Instant Notifications",
      description: "Get real-time alerts via SMS, email, and push notifications about upcoming vaccinations"
    },
    {
      icon: <Calendar className="w-8 h-8 text-green-600" />,
      title: "Smart Scheduling",
      description: "AI-powered scheduling that adapts to your child's age and local vaccination guidelines"
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-600" />,
      title: "Complete Protection",
      description: "Never miss a vaccination with comprehensive tracking and automated reminders"
    },
    {
      icon: <Smartphone className="w-8 h-8 text-orange-600" />,
      title: "Mobile First",
      description: "Access your child's vaccination schedule anytime, anywhere from your phone"
    },
    {
      icon: <Lock className="w-8 h-8 text-red-600" />,
      title: "HIPAA Compliant",
      description: "Your child's health data is encrypted and stored securely with bank-level security"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-indigo-600" />,
      title: "Health Insights",
      description: "Track vaccination completion rates and get personalized health recommendations"
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "$0",
      period: "/month",
      icon: <Star className="w-6 h-6" />,
      features: [
        "Up to 2 children",
        "Basic SMS & email reminders",
        "Vaccination schedule",
        "Basic health records",
        "Community support"
      ],
      popular: false,
      cta: "Start Free"
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "/month",
      icon: <Award className="w-6 h-6" />,
      features: [
        "Up to 5 children",
        "Unlimited SMS & email reminders",
        "AI-powered scheduling",
        "Advanced health records",
        "Priority support",
        "Export reports",
        "Mobile app access"
      ],
      popular: true,
      cta: "Start Pro Trial"
    },
    {
      name: "Family Plus",
      price: "$19.99",
      period: "/month",
      icon: <Users className="w-6 h-6" />,
      features: [
        "Unlimited children",
        "Unlimited notifications",
        "Advanced AI scheduling",
        "Complete health records",
        "24/7 priority support",
        "Family sharing",
        "Custom schedules",
        "Health insights dashboard"
      ],
      popular: false,
      cta: "Start Family Trial"
    }
  ];

  const benefits = [
    {
      title: "Peace of Mind",
      description: "Never worry about missing a vaccination again with automated reminders",
      icon: <Heart className="w-6 h-6 text-red-500" />
    },
    {
      title: "Save Time",
      description: "No more manual tracking or calling clinics - everything is automated",
      icon: <Clock className="w-6 h-6 text-blue-500" />
    },
    {
      title: "Stay Organized",
      description: "Keep all your children's vaccination records in one secure place",
      icon: <CheckCircle className="w-6 h-6 text-green-500" />
    },
    {
      title: "Expert Guidance",
      description: "Get recommendations based on CDC guidelines and your local requirements",
      icon: <Shield className="w-6 h-6 text-purple-500" />
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Mother of 2",
      content: "VaccineTrack has been a lifesaver! I no longer worry about forgetting vaccination appointments. The reminders are perfectly timed and so helpful.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Father of 3",
      content: "Managing three kids' vaccination schedules was overwhelming. This app makes it so easy - everything is organized and accessible from my phone.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "New Mom",
      content: "As a first-time mom, I was so anxious about keeping track of everything. VaccineTrack gives me confidence that I'm doing everything right for my baby.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Baby className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">VaccineTrack</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* For Parents Dropdown */}
              <div className="relative group">
                <button className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md transition-colors flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  For Parents
                  <ChevronRight className="w-4 h-4 ml-1 transform rotate-90 group-hover:rotate-0 transition-transform" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-2">
                    <button
                      onClick={() => setShowAuthModal('parent-login')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Parent Login
                    </button>
                    <button
                      onClick={() => setShowAuthModal('parent-register')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Parent Sign Up
                    </button>
                  </div>
                </div>
              </div>

              {/* For Clinics Dropdown */}
              <div className="relative group">
                <button className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md transition-colors flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  For Clinics
                  <ChevronRight className="w-4 h-4 ml-1 transform rotate-90 group-hover:rotate-0 transition-transform" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-2">
                    <Link
                      to="/clinic-login"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Clinic Login
                    </Link>
                    <Link
                      to="/clinic-register"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Clinic Sign Up
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Never Miss a
              <span className="text-blue-600"> Vaccination</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              AI-powered vaccination notifications for busy parents. Get personalized reminders, 
              track schedules, and keep your children protected - all in one simple app.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
              <button
                onClick={() => setShowAuthModal('parent-register')}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => setShowAuthModal('parent-login')}
                className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Parent Login
              </button>
            </div>
            <p className="text-sm text-gray-500">
              ✓ No credit card required • ✓ 30-day free trial • ✓ Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Keep Your Child Healthy
            </h2>
            <p className="text-xl text-gray-600">
              Smart, secure, and simple vaccination management for modern parents
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-8 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200">
                <div className="flex justify-center mb-6">
                  <div className="bg-blue-100 p-4 rounded-full">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Why Parents Love VaccineTrack
            </h2>
            <p className="text-xl opacity-90">
              Join thousands of parents who trust us to keep their children healthy
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="opacity-90">{benefit.description}</p>
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
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade anytime. No hidden fees.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`relative rounded-xl p-8 ${plan.popular ? 'bg-blue-600 text-white shadow-2xl transform scale-105' : 'bg-white shadow-lg border border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${plan.popular ? 'bg-white/20' : 'bg-blue-100'}`}>
                      {plan.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center mb-4">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="ml-2 text-lg">{plan.period}</span>
                  </div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className={`w-5 h-5 mr-3 ${plan.popular ? 'text-yellow-400' : 'text-green-500'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => setShowAuthModal('parent-register')}
                  className={`w-full py-4 rounded-lg font-semibold transition-colors text-lg ${
                    plan.popular 
                      ? 'bg-white text-blue-600 hover:bg-gray-100' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Not sure which plan is right for you?</p>
            <button className="text-blue-600 hover:text-blue-700 font-semibold flex items-center mx-auto">
              Contact Sales <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Parents Everywhere
            </h2>
            <p className="text-xl text-gray-600">
              See what real parents are saying about VaccineTrack
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-xl">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Never Miss a Vaccination?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of parents who trust VaccineTrack to keep their children healthy and protected.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
            <button
              onClick={() => setShowAuthModal('parent-register')}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => setShowAuthModal('parent-login')}
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Parent Login
            </button>
          </div>
          <p className="text-sm opacity-75">
            ✓ 30-day free trial • ✓ No credit card required • ✓ Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Baby className="w-8 h-8 text-blue-400 mr-3" />
                <h3 className="text-2xl font-bold">VaccineTrack</h3>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The smartest way to manage your child's vaccination schedule. Never miss an important vaccination again with AI-powered notifications and reminders.
              </p>
              <div className="flex space-x-4">
                <Facebook className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer" />
                <Twitter className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer" />
                <Instagram className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer" />
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">How it Works</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Mobile App</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">
              © 2024 VaccineTrack. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 text-gray-400">
              <Phone className="w-4 h-4" />
              <span>1-800-VACCINE</span>
              <Mail className="w-4 h-4" />
              <span>support@vaccinetrack.com</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">
              {showAuthModal === 'login' ? 'Welcome Back' : 'Start Your Free Trial'}
            </h2>
            <form onSubmit={handleAuth}>
              {showAuthModal === 'register' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={authForm.firstName}
                      onChange={(e) => setAuthForm({...authForm, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={authForm.lastName}
                      onChange={(e) => setAuthForm({...authForm, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold mb-4"
              >
                {loading ? 'Processing...' : (showAuthModal === 'login' ? 'Login' : 'Start Free Trial')}
              </button>
              <button
                type="button"
                onClick={() => setShowAuthModal(null)}
                className="w-full text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaasLanding;