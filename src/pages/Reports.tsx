import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { reportingAPI, VaccinationReport, PatientReport, AppointmentReport, InventoryReport } from '../utils/reportingAPI';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Package, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

const Reports: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'vaccination' | 'patient' | 'appointment' | 'inventory'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Report data states
  const [vaccinationReport, setVaccinationReport] = useState<VaccinationReport | null>(null);
  const [patientReport, setPatientReport] = useState<PatientReport | null>(null);
  const [appointmentReport, setAppointmentReport] = useState<AppointmentReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);

  useEffect(() => {
    if (user?.clinic_id) {
      fetchAllReports();
    }
  }, [user?.clinic_id, dateRange]);

  const fetchAllReports = async () => {
    setLoading(true);
    try {
      const dateRangeObj = getDateRange();
      
      const [
        vaxReport,
        patReport,
        apptReport,
        invReport
      ] = await Promise.all([
        reportingAPI.getVaccinationReport(user!.clinic_id, dateRangeObj),
        reportingAPI.getPatientReport(user!.clinic_id),
        reportingAPI.getAppointmentReport(user!.clinic_id, dateRangeObj),
        reportingAPI.getInventoryReport(user!.clinic_id)
      ]);

      setVaccinationReport(vaxReport);
      setPatientReport(patReport);
      setAppointmentReport(apptReport);
      setInventoryReport(invReport);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllReports();
    setRefreshing(false);
  };

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    // Export functionality would be implemented here
    alert(`Exporting ${format.toUpperCase()} report for ${activeTab}...`);
  };

  const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
            <p className="text-gray-600">Comprehensive insights and performance metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'vaccination', label: 'Vaccination', icon: TrendingUp },
              { key: 'patient', label: 'Patient', icon: Users },
              { key: 'appointment', label: 'Appointment', icon: Calendar },
              { key: 'inventory', label: 'Inventory', icon: Package }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Overview Dashboard */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Patients</p>
                  <p className="text-2xl font-semibold text-gray-900">{patientReport?.total_patients || 0}</p>
                  <p className="text-xs text-green-600">+{patientReport?.new_patients_this_month || 0} this month</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Vaccinations</p>
                  <p className="text-2xl font-semibold text-gray-900">{vaccinationReport?.total_vaccinations || 0}</p>
                  <p className="text-xs text-blue-600">{vaccinationReport?.completion_rate || 0}% completion rate</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Appointments</p>
                  <p className="text-2xl font-semibold text-gray-900">{appointmentReport?.total_appointments || 0}</p>
                  <p className="text-xs text-orange-600">{appointmentReport?.scheduled_appointments || 0} scheduled</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Alerts</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {(vaccinationReport?.overdue_vaccinations || 0) + (inventoryReport?.low_stock_vaccines || 0)}
                  </p>
                  <p className="text-xs text-red-600">Requires attention</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vaccination Status Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vaccination Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: vaccinationReport?.completed_vaccinations || 0 },
                      { name: 'Scheduled', value: vaccinationReport?.upcoming_vaccinations || 0 },
                      { name: 'Overdue', value: vaccinationReport?.overdue_vaccinations || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {vaccinationReport && [0, 1, 2].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Appointment Trends */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Appointment Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={appointmentReport?.monthly_trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="appointments" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="cancelled" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Vaccination Reports */}
      {activeTab === 'vaccination' && vaccinationReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Total Vaccinations</p>
              <p className="text-3xl font-semibold text-gray-900">{vaccinationReport.total_vaccinations}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-3xl font-semibold text-green-600">{vaccinationReport.completed_vaccinations}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-3xl font-semibold text-red-600">{vaccinationReport.overdue_vaccinations}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-3xl font-semibold text-blue-600">{vaccinationReport.completion_rate}%</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vaccine Breakdown</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={vaccinationReport.vaccine_breakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vaccine_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="administered_count" fill="#10B981" name="Administered" />
                <Bar dataKey="scheduled_count" fill="#3B82F6" name="Scheduled" />
                <Bar dataKey="overdue_count" fill="#EF4444" name="Overdue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Patient Reports */}
      {activeTab === 'patient' && patientReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Total Patients</p>
              <p className="text-3xl font-semibold text-gray-900">{patientReport.total_patients}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Active Patients</p>
              <p className="text-3xl font-semibold text-blue-600">{patientReport.active_patients}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">New This Month</p>
              <p className="text-3xl font-semibold text-green-600">{patientReport.new_patients_this_month}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={patientReport.age_distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, payload }) => `${payload.age_group} (${payload.percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {patientReport.age_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vaccination Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Fully Vaccinated', value: patientReport.vaccination_status.fully_vaccinated },
                      { name: 'Partially Vaccinated', value: patientReport.vaccination_status.partially_vaccinated },
                      { name: 'Not Vaccinated', value: patientReport.vaccination_status.not_vaccinated }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Reports */}
      {activeTab === 'appointment' && appointmentReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Total Appointments</p>
              <p className="text-3xl font-semibold text-gray-900">{appointmentReport.total_appointments}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Scheduled</p>
              <p className="text-3xl font-semibold text-blue-600">{appointmentReport.scheduled_appointments}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-3xl font-semibold text-green-600">{appointmentReport.completed_appointments}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Cancelled</p>
              <p className="text-3xl font-semibold text-red-600">{appointmentReport.cancelled_appointments}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider Utilization</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentReport.provider_utilization}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="provider_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_appointments" fill="#3B82F6" name="Total" />
                <Bar dataKey="completed_appointments" fill="#10B981" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Inventory Reports */}
      {activeTab === 'inventory' && inventoryReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Total Vaccines</p>
              <p className="text-3xl font-semibold text-gray-900">{inventoryReport.total_vaccines}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-3xl font-semibold text-orange-600">{inventoryReport.low_stock_vaccines}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Expired</p>
              <p className="text-3xl font-semibold text-red-600">{inventoryReport.expired_vaccines}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-500">Stock Value</p>
              <p className="text-3xl font-semibold text-blue-600">${inventoryReport.stock_value.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Vaccine Inventory Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccine</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventoryReport.vaccine_details.map((vaccine, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vaccine.vaccine_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vaccine.current_stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vaccine.min_stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(vaccine.expiry_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          vaccine.status === 'sufficient' ? 'bg-green-100 text-green-800' :
                          vaccine.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                          vaccine.status === 'expired' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {vaccine.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;