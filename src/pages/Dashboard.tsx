import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../utils/supabase';
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  Plus,
  Eye,
  Stethoscope,
  BarChart3
} from 'lucide-react';

interface DashboardStats {
  totalPatients: number;
  upcomingVaccinations: number;
  overdueVaccinations: number;
  todayAppointments: number;
  lowStockVaccines: number;
  recentVaccinations: number;
}

interface RecentActivity {
  id: string;
  patient_name: string;
  vaccine_name: string;
  administration_date: string;
  administered_by: string;
}

interface UpcomingVaccination {
  id: string;
  patient_name: string;
  vaccine_name: string;
  due_date: string;
  days_until_due: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    upcomingVaccinations: 0,
    overdueVaccinations: 0,
    todayAppointments: 0,
    lowStockVaccines: 0,
    recentVaccinations: 0
  });
  
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingVaccinations, setUpcomingVaccinations] = useState<UpcomingVaccination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get clinic ID for current user
      const clinicId = user?.clinic_id;
      if (!clinicId) return;

      // Fetch patients count
      const { count: patientCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('is_active', true);

      // Fetch recent vaccinations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentVaccinationsData, count: recentVaccinationsCount } = await supabase
        .from('vaccinations')
        .select(`
          *,
          patients (first_name, last_name),
          vaccines (name, abbreviation)
        `, { count: 'exact' })
        .gte('administration_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('administration_date', { ascending: false })
        .limit(5);

      // Fetch upcoming vaccinations (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // Fetch today's appointments
      const today = new Date().toISOString().split('T')[0];
      const { count: todayAppointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', today)
        .eq('status', 'scheduled');

      // Fetch low stock vaccines
      const { count: lowStockCount } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .lte('quantity_on_hand', 5)
        .gte('expiration_date', today);

      // Process recent activities
      const activities = recentVaccinationsData?.map(vaccination => ({
        id: vaccination.id,
        patient_name: `${vaccination.patients.first_name} ${vaccination.patients.last_name}`,
        vaccine_name: vaccination.vaccines.name,
        administration_date: vaccination.administration_date,
        administered_by: vaccination.administered_by
      })) || [];

      // Mock upcoming vaccinations data (in a real app, this would be calculated)
      const upcoming = [
        {
          id: '1',
          patient_name: 'Emma Johnson',
          vaccine_name: 'DTaP (Dose 2)',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          days_until_due: 7
        },
        {
          id: '2',
          patient_name: 'Liam Smith',
          vaccine_name: 'Hib (Dose 1)',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          days_until_due: 14
        }
      ];

      setStats({
        totalPatients: patientCount || 0,
        upcomingVaccinations: upcoming.length,
        overdueVaccinations: 0, // Would be calculated based on missed appointments
        todayAppointments: todayAppointmentsCount || 0,
        lowStockVaccines: lowStockCount || 0,
        recentVaccinations: recentVaccinationsCount || 0
      });

      setRecentActivities(activities);
      setUpcomingVaccinations(upcoming);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    link?: string;
  }> = ({ title, value, icon, color, link }) => {
    const content = (
      <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${link ? 'cursor-pointer' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color === 'text-red-600' ? 'bg-red-100' : color === 'text-yellow-600' ? 'bg-yellow-100' : color === 'text-green-600' ? 'bg-green-100' : 'bg-blue-100'}`}>
            {icon}
          </div>
        </div>
      </div>
    );

    return link ? <Link to={link}>{content}</Link> : content;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, Dr. {user?.last_name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening in your clinic today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          color="text-blue-600"
          link="/patients"
        />
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          icon={<Calendar className="h-6 w-6 text-blue-600" />}
          color="text-blue-600"
          link="/appointments"
        />
        <StatCard
          title="Upcoming Vaccinations"
          value={stats.upcomingVaccinations}
          icon={<Clock className="h-6 w-6 text-green-600" />}
          color="text-green-600"
          link="/vaccinations/schedule"
        />
        <StatCard
          title="Low Stock Vaccines"
          value={stats.lowStockVaccines}
          icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
          color="text-red-600"
          link="/inventory"
        />
        <StatCard
          title="Recent Vaccinations (30 days)"
          value={stats.recentVaccinations}
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          color="text-green-600"
          link="/reports"
        />
        <StatCard
          title="Overdue Vaccinations"
          value={stats.overdueVaccinations}
          icon={<AlertTriangle className="h-6 w-6 text-yellow-600" />}
          color="text-yellow-600"
          link="/vaccinations/schedule"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Vaccinations</h2>
              <Link to="/reports" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Eye className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.patient_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.vaccine_name} - {activity.administration_date}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs text-gray-400">
                        by {activity.administered_by}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent vaccinations</p>
            )}
          </div>
        </div>

        {/* Upcoming Vaccinations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Vaccinations</h2>
              <Link to="/vaccinations/schedule" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Schedule
              </Link>
            </div>
          </div>
          <div className="p-6">
            {upcomingVaccinations.length > 0 ? (
              <div className="space-y-4">
                {upcomingVaccinations.map((vaccination) => (
                  <div key={vaccination.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Clock className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {vaccination.patient_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {vaccination.vaccine_name}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`text-xs font-medium ${
                        vaccination.days_until_due <= 7 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {vaccination.days_until_due} days
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming vaccinations</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/patients/new"
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Patient</span>
          </Link>
          <Link
            to="/appointments/new"
            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            <Calendar className="h-4 w-4" />
            <span>Schedule Appointment</span>
          </Link>
          <Link
            to="/vaccinations/schedule"
            className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
          >
            <Stethoscope className="h-4 w-4" />
            <span>Update Vaccination</span>
          </Link>
          <Link
            to="/reports"
            className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Generate Report</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;