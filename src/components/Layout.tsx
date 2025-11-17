import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { 
  Home, 
  Users, 
  Calendar, 
  Clock, 
  Package, 
  BarChart3, 
  Settings, 
  LogOut,
  User,
  Stethoscope,
  Bell
} from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Vaccination Schedule', href: '/vaccinations/schedule', icon: Stethoscope },
    { name: 'Vaccination Reminders', href: '/vaccinations/reminders', icon: Bell },
    { name: 'Appointments', href: '/appointments', icon: Calendar },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Stethoscope className="h-8 w-8 text-blue-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">
                  Pediatric Clinic
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {user?.first_name} {user?.last_name}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {user?.role}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;