import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { certificateAPI, VaccinationCertificate } from '../utils/certificateAPI';
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  Calendar, 
  User, 
  Stethoscope,
  Award,
  QrCode,
  Copy,
  Printer,
  AlertCircle
} from 'lucide-react';

interface VaccinationCertificateProps {
  patientId: string;
  patientName: string;
  vaccinations: any[];
}

const VaccinationCertificateManager: React.FC<VaccinationCertificateProps> = ({
  patientId,
  patientName,
  vaccinations
}) => {
  const { user } = useAuthStore();
  const [certificates, setCertificates] = useState<VaccinationCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedVaccinations, setSelectedVaccinations] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState<VaccinationCertificate | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, [patientId]);

  const fetchCertificates = async () => {
    try {
      const patientCertificates = await certificateAPI.getPatientCertificates(patientId);
      setCertificates(patientCertificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    if (selectedVaccinations.length === 0) {
      alert('Please select at least one vaccination to include in the certificate.');
      return;
    }

    setGenerating(true);
    try {
      const newCertificate = await certificateAPI.generateCertificate(patientId, selectedVaccinations, `${user?.first_name} ${user?.last_name}`);
      setCertificates([newCertificate, ...certificates]);
      setSelectedVaccinations([]);
      alert('Certificate generated successfully!');
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Failed to generate certificate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreviewCertificate = async (certificate: VaccinationCertificate) => {
    setPreviewCertificate(certificate);
    setShowPreview(true);
  };

  const handleDownloadCertificate = async (certificateId: string) => {
    setDownloading(certificateId);
    try {
      const pdfBlob = await certificateAPI.downloadCertificatePDF(certificateId);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vaccination_certificate_${certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleCopyCertificateNumber = (certificateNumber: string) => {
    navigator.clipboard.writeText(certificateNumber);
    alert('Certificate number copied to clipboard!');
  };

  const handleVaccinationSelect = (vaccinationId: string, checked: boolean) => {
    if (checked) {
      setSelectedVaccinations([...selectedVaccinations, vaccinationId]);
    } else {
      setSelectedVaccinations(selectedVaccinations.filter(id => id !== vaccinationId));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'expiring_soon': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const checkCertificateValidity = (certificate: VaccinationCertificate): 'valid' | 'expired' | 'expiring_soon' => {
    const validUntil = new Date(certificate.valid_until);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (today > validUntil) return 'expired';
    if (today <= validUntil && validUntil <= thirtyDaysFromNow) return 'expiring_soon';
    return 'valid';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generate New Certificate */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Award className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Generate Vaccination Certificate</h3>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            Select completed vaccinations to include in the certificate:
          </p>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {vaccinations.filter(v => v.status === 'completed').map((vaccination) => (
              <label key={vaccination.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedVaccinations.includes(vaccination.id)}
                  onChange={(e) => handleVaccinationSelect(vaccination.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{vaccination.vaccine_name}</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-sm text-gray-600 ml-6">
                    Administered on {formatDate(vaccination.administration_date)} • 
                    Lot: {vaccination.vaccine_lot_number} • 
                    Provider: {vaccination.provider_name}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {vaccinations.filter(v => v.status === 'completed').length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No completed vaccinations found for this patient.</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedVaccinations.length} vaccination{selectedVaccinations.length !== 1 ? 's' : ''} selected
          </div>
          <button
            onClick={handleGenerateCertificate}
            disabled={generating || selectedVaccinations.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className={`h-4 w-4 ${generating ? 'animate-pulse' : ''}`} />
            <span>{generating ? 'Generating...' : 'Generate Certificate'}</span>
          </button>
        </div>
      </div>

      {/* Existing Certificates */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <QrCode className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Vaccination Certificates</h3>
            </div>
            <span className="text-sm text-gray-500">{certificates.length} certificate{certificates.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {certificates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg mb-2">No certificates found</p>
              <p className="text-sm">Generate a vaccination certificate using the form above.</p>
            </div>
          ) : (
            certificates.map((certificate) => {
              const status = checkCertificateValidity(certificate);
              const statusText = status === 'valid' ? 'Valid' : status === 'expired' ? 'Expired' : 'Expiring Soon';
              
              return (
                <div key={certificate.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getStatusColor(status)}`}>
                          <Award className="h-6 w-6" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">Certificate #{certificate.certificate_number}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {statusText}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center space-x-2">
                            <User className="h-3 w-3" />
                            <span>{patientName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3" />
                            <span>Issued: {formatDate(certificate.issue_date)}</span>
                            <span>•</span>
                            <span>Valid until: {formatDate(certificate.valid_until)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Stethoscope className="h-3 w-3" />
                            <span>{certificate.vaccinations.length} vaccination{certificate.vaccinations.length !== 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span>Provider: {certificate.issuing_provider}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePreviewCertificate(certificate)}
                        className="flex items-center space-x-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        <span className="text-sm">Preview</span>
                      </button>
                      <button
                        onClick={() => handleCopyCertificateNumber(certificate.certificate_number)}
                        className="flex items-center space-x-1 px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                        <span className="text-sm">Copy #</span>
                      </button>
                      <button
                        onClick={() => handleDownloadCertificate(certificate.id)}
                        disabled={downloading === certificate.id}
                        className="flex items-center space-x-1 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                      >
                        <Download className={`h-3 w-3 ${downloading === certificate.id ? 'animate-pulse' : ''}`} />
                        <span className="text-sm">{downloading === certificate.id ? 'Downloading...' : 'PDF'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {showPreview && previewCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Award className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Certificate Preview</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadCertificate(previewCertificate.id)}
                  disabled={downloading === previewCertificate.id}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Download className={`h-4 w-4 ${downloading === previewCertificate.id ? 'animate-pulse' : ''}`} />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Certificate Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <Award className="h-12 w-12 text-blue-600 mr-3" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">VACCINATION CERTIFICATE</h1>
                    <p className="text-sm text-gray-600">Certificate #{previewCertificate.certificate_number}</p>
                  </div>
                </div>
                <div className="border-t border-b border-gray-200 py-2">
                  <p className="text-sm font-medium text-gray-700">
                    Issued by {previewCertificate.clinic_name} • Valid until {formatDate(previewCertificate.valid_until)}
                  </p>
                </div>
              </div>

              {/* Patient Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Patient Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="text-gray-900">{previewCertificate.patient_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Date of Birth:</span>
                    <span className="text-gray-900">{formatDate(previewCertificate.date_of_birth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Address:</span>
                    <span className="text-gray-900 text-right">{previewCertificate.patient_address}</span>
                  </div>
                </div>
              </div>

              {/* Clinic Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2" />
                  Clinic Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Clinic Name:</span>
                    <span className="text-gray-900">{previewCertificate.clinic_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Address:</span>
                    <span className="text-gray-900 text-right">{previewCertificate.clinic_address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Phone:</span>
                    <span className="text-gray-900">{previewCertificate.clinic_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="text-gray-900">{previewCertificate.clinic_email}</span>
                  </div>
                </div>
              </div>

              {/* Vaccination Records */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Vaccination Records ({previewCertificate.vaccinations.length})
                </h3>
                <div className="space-y-3">
                  {previewCertificate.vaccinations.map((vaccination, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{vaccination.vaccine_name}</h4>
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Type:</span>
                          <span className="ml-2 text-gray-900">{vaccination.vaccine_type}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Date:</span>
                          <span className="ml-2 text-gray-900">{formatDate(vaccination.administration_date)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Lot Number:</span>
                          <span className="ml-2 text-gray-900">{vaccination.lot_number}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Manufacturer:</span>
                          <span className="ml-2 text-gray-900">{vaccination.manufacturer}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Site:</span>
                          <span className="ml-2 text-gray-900">{vaccination.site}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Route:</span>
                          <span className="ml-2 text-gray-900">{vaccination.route}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Dose:</span>
                          <span className="ml-2 text-gray-900">{vaccination.dose_number}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Provider:</span>
                          <span className="ml-2 text-gray-900">{vaccination.provider_name}</span>
                        </div>
                        {vaccination.next_due_date && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-700">Next Due:</span>
                            <span className="ml-2 text-gray-900">{formatDate(vaccination.next_due_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <p>Issued by: {previewCertificate.issuing_provider}</p>
                    <p>Issue Date: {formatDate(previewCertificate.issue_date)}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end mb-2">
                      <QrCode className="h-6 w-6 text-gray-600 mr-2" />
                      <span className="text-sm text-gray-600">Certificate #{previewCertificate.certificate_number}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      This certificate is issued in accordance with CDC guidelines and state regulations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaccinationCertificateManager;