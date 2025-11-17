import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePatientStore } from '../stores/patientStore';
import { Patient } from '../utils/patientAPI';
import { useFeatureFlag } from '../components/FeatureFlag';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Filter,
  Calendar,
  User,
  Baby,
  Users,
  FileText,
  AlertTriangle
} from 'lucide-react';

const Patients: React.FC = () => {
  const { 
    patients, 
    loading, 
    error, 
    filters, 
    fetchPatients, 
    deletePatient, 
    setFilters 
  } = usePatientStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Feature flags
  const patientManagement = useFeatureFlag('patient_management');
  const advancedPatientFeatures = useFeatureFlag('advanced_patient_features');
  const patientAnalytics = useFeatureFlag('patient_analytics');
  
  const patientManagementEnabled = patientManagement.isEnabled;
  const advancedPatientFeaturesEnabled = advancedPatientFeatures.isEnabled;
  const patientAnalyticsEnabled = patientAnalytics.isEnabled;

  useEffect(() => {
    if (patientManagementEnabled) {
      fetchPatients();
    }
  }, [patientManagementEnabled]);

  useEffect(() => {
    if (patientManagementEnabled) {
      const newFilters = {
        search: searchTerm,
        gender: genderFilter
      };
      setFilters(newFilters);
      fetchPatients(newFilters);
    }
  }, [searchTerm, genderFilter, patientManagementEnabled]);

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const years = today.getFullYear() - birthDate.getFullYear();
    const months = today.getMonth() - birthDate.getMonth();
    
    if (months < 0) {
      return `${years - 1} years ${12 + months} months`;
    }
    return `${years} years ${months} months`;
  };

  const handleDelete = async (patientId: string, patientName: string) => {
    if (confirm(`Are you sure you want to delete ${patientName}? This action cannot be undone.`)) {
      await deletePatient(patientId);
    }
  };

  if (!patientManagementEnabled) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Management Disabled</h3>
          <p className="text-gray-600">This feature is not available in your current subscription plan.</p>
          <p className="text-sm text-gray-500 mt-2">Please contact your administrator to enable patient management.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
          <p className="text-gray-600 mt-1">Manage your pediatric patients and their vaccination records</p>
        </div>
        {advancedPatientFeatures && (
          <Link
            to="/patients/new"
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Patient</span>
          </Link>
        )}
      </div>

      {/* Feature-specific Analytics */}
      {patientAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <Baby className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Patients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => p.is_active).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Age</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.length > 0 ? Math.round(
                    patients.reduce((sum, p) => {
                      const age = calculateAge(p.date_of_birth);
                      return sum + (parseInt(age.split(' ')[0]) || 0);
                    }, 0) / patients.length
                  ) : 0} years
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => {
                    const createdDate = new Date(p.created_at);
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();
                    return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients by name or MRN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              {advancedPatientFeatures && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                    <select
                      value={filters.age_range || 'all'}
                      onChange={(e) => setFilters({ ...filters, age_range: e.target.value === 'all' ? undefined : e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Ages</option>
                      <option value="0-1">0-1 years</option>
                      <option value="1-5">1-5 years</option>
                      <option value="5-12">5-12 years</option>
                      <option value="12-18">12-18 years</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filters.status || 'all'}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value === 'all' ? undefined : e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent/Guardian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MRN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No patients found. {searchTerm && 'Try adjusting your search terms.'}
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Baby className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {patient.gender === 'male' ? 'Male' : patient.gender === 'female' ? 'Female' : 'Other'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {calculateAge(patient.date_of_birth)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.parent_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {patient.parent_phone && (
                          <div className="flex items-center">
                            <span className="text-xs">📞</span>
                            <span className="ml-1">{patient.parent_phone}</span>
                          </div>
                        )}
                        {patient.parent_email && (
                          <div className="flex items-center mt-1">
                            <span className="text-xs">✉️</span>
                            <span className="ml-1">{patient.parent_email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {patient.medical_record_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {advancedPatientFeatures && (
                          <Link
                            to={`/patients/${patient.id}/edit`}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        )}
                        {advancedPatientFeatures && (
                          <button
                            onClick={() => handleDelete(patient.id, `${patient.first_name} ${patient.last_name}`)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Total Patients: {patients.length}</span>
          <span>Last Updated: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default Patients;