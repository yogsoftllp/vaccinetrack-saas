import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePatientStore } from '../stores/patientStore';
import { patientAPI } from '../utils/patientAPI';
import VaccinationCertificateManager from '../components/VaccinationCertificateManager';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard,
  Baby,
  Syringe,
  Clock,
  CheckCircle,
  AlertCircle,
  Award
} from 'lucide-react';

interface VaccinationHistory {
  id: string;
  administration_date: string;
  lot_number: string;
  site: string;
  route: string;
  administered_by: string;
  reaction: string | null;
  notes: string | null;
  vaccines: {
    name: string;
    abbreviation: string;
    manufacturer: string;
  };
}

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentPatient, fetchPatientById } = usePatientStore();
  const [vaccinationHistory, setVaccinationHistory] = useState<VaccinationHistory[]>([]);
  const [vaccinationSchedule, setVaccinationSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'vaccinations' | 'schedule' | 'certificates'>('overview');

  useEffect(() => {
    if (id) {
      loadPatientData();
    }
  }, [id]);

  const loadPatientData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      await fetchPatientById(id);
      
      // Load vaccination history
      const history = await patientAPI.getPatientVaccinationHistory(id);
      setVaccinationHistory(history || []);
      
      // Load vaccination schedule
      const schedule = await patientAPI.getVaccinationSchedule(id);
      setVaccinationSchedule(schedule);
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSiteDisplayName = (site: string) => {
    const siteMap: { [key: string]: string } = {
      'left_deltoid': 'Left Deltoid',
      'right_deltoid': 'Right Deltoid',
      'left_thigh': 'Left Thigh',
      'right_thigh': 'Right Thigh',
      'left_arm': 'Left Arm',
      'right_arm': 'Right Arm'
    };
    return siteMap[site] || site;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentPatient) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Patient Not Found</h2>
        <p className="text-gray-600 mb-4">The patient you're looking for doesn't exist.</p>
        <Link
          to="/patients"
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Patients</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/patients"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentPatient.first_name} {currentPatient.last_name}
            </h1>
            <p className="text-gray-600">Patient ID: {currentPatient.medical_record_number}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/patients/${currentPatient.id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit Patient
          </Link>
          <Link
            to={`/vaccinations/schedule?patient_id=${currentPatient.id}`}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Update Vaccination
          </Link>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3">
            <Baby className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-500">Basic Information</p>
              <p className="text-sm text-gray-900">
                {calculateAge(currentPatient.date_of_birth)} old
              </p>
              <p className="text-sm text-gray-900 capitalize">{currentPatient.gender}</p>
              <p className="text-sm text-gray-900">
                Born: {formatDate(currentPatient.date_of_birth)}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-500">Parent/Guardian</p>
              <p className="text-sm text-gray-900">{currentPatient.parent_name}</p>
              {currentPatient.parent_phone && (
                <p className="text-sm text-gray-900 flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  {currentPatient.parent_phone}
                </p>
              )}
              {currentPatient.parent_email && (
                <p className="text-sm text-gray-900 flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  {currentPatient.parent_email}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-500">Contact Information</p>
              {currentPatient.address && (
                <p className="text-sm text-gray-900">{currentPatient.address}</p>
              )}
              {currentPatient.insurance_id && (
                <p className="text-sm text-gray-900 flex items-center mt-1">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Insurance: {currentPatient.insurance_id}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'vaccinations', label: 'Vaccination History', icon: Syringe },
              { id: 'schedule', label: 'Upcoming Vaccines', icon: Calendar },
              { id: 'certificates', label: 'Certificates', icon: Award }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
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

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <Syringe className="h-5 w-5 mr-2" />
                  Vaccination Summary
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-blue-800">
                    Total Vaccinations: {vaccinationHistory.length}
                  </p>
                  <p className="text-sm text-blue-800">
                    Upcoming Vaccines: {vaccinationSchedule?.upcoming_vaccines?.length || 0}
                  </p>
                  <p className="text-sm text-blue-800">
                    Age: {vaccinationSchedule?.age || 0} months
                  </p>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Compliance Status
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-green-800">
                    On Schedule: {vaccinationSchedule?.upcoming_vaccines?.length === 0 ? 'Yes' : 'No'}
                  </p>
                  <p className="text-sm text-green-800">
                    Last Vaccination: {
                      vaccinationHistory.length > 0 
                        ? formatDate(vaccinationHistory[0].administration_date)
                        : 'None'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Vaccination History Tab */}
          {activeTab === 'vaccinations' && (
            <div className="space-y-4">
              {vaccinationHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Syringe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Vaccinations Recorded</h3>
                  <p className="text-gray-600 mb-4">This patient has no vaccination records yet.</p>
                  <Link
                    to={`/vaccinations/schedule?patient_id=${currentPatient.id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add First Vaccination
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {vaccinationHistory.map((vaccination) => (
                    <div key={vaccination.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {vaccination.vaccines.name}
                            <span className="text-sm font-normal text-gray-500 ml-2">
                              ({vaccination.vaccines.abbreviation})
                            </span>
                          </h4>
                          <p className="text-sm text-gray-600">
                            Manufacturer: {vaccination.vaccines.manufacturer}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-sm text-gray-600">
                                <strong>Date:</strong> {formatDate(vaccination.administration_date)}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Site:</strong> {getSiteDisplayName(vaccination.site)}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Route:</strong> {vaccination.route}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                <strong>Lot Number:</strong> {vaccination.lot_number}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Administered by:</strong> {vaccination.administered_by}
                              </p>
                              {vaccination.reaction && (
                                <p className="text-sm text-gray-600">
                                  <strong>Reaction:</strong> {vaccination.reaction}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {vaccination.notes && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-600">
                                <strong>Notes:</strong> {vaccination.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              {vaccinationSchedule?.upcoming_vaccines?.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Up to Date!</h3>
                  <p className="text-gray-600">This patient is current with all recommended vaccinations.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vaccinationSchedule?.upcoming_vaccines?.map((vaccine: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {vaccine.vaccines.name}
                            <span className="text-sm font-normal text-gray-500 ml-2">
                              ({vaccine.vaccines.abbreviation})
                            </span>
                          </h4>
                          <p className="text-sm text-gray-600">
                            Recommended at: {vaccine.min_age_months} months
                          </p>
                          
                          {vaccine.contraindications && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="text-sm text-yellow-800">
                                <strong>Contraindications:</strong> {vaccine.contraindications}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <Clock className="h-6 w-6 text-blue-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Certificates Tab */}
          {activeTab === 'certificates' && currentPatient && (
            <VaccinationCertificateManager
              patientId={currentPatient.id}
              patientName={`${currentPatient.first_name} ${currentPatient.last_name}`}
              vaccinations={vaccinationHistory}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;