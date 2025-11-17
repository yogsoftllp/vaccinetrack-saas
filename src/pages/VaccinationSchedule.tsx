import React, { useState, useEffect } from 'react';
import { useVaccinationStore } from '../stores/vaccinationStore';
import { usePatientStore } from '../stores/patientStore';
import { useAuthStore } from '../stores/authStore';
import { useFeatureFlag } from '../components/FeatureFlag';
import { VaccinationRecord } from '../utils/vaccinationAPI';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Plus,
  User,
  Syringe,
  FileText
} from 'lucide-react';

const VaccinationSchedule: React.FC = () => {
  const { 
    vaccinationSchedule, 
    vaccines, 
    loading, 
    selectedPatientId,
    fetchVaccinationSchedule,
    fetchVaccines,
    createVaccinationRecord,
    setSelectedPatient
  } = useVaccinationStore();
  
  const { patients } = usePatientStore();
  const { user } = useAuthStore();
  
  // Feature flags
  const { isEnabled: isVaccinationManagementEnabled } = useFeatureFlag('vaccination_management');
  const { isEnabled: isAdvancedSchedulingEnabled } = useFeatureFlag('advanced_scheduling');
  const { isEnabled: isInventoryManagementEnabled } = useFeatureFlag('inventory_management');
  
  const [selectedVaccine, setSelectedVaccine] = useState<string>('');
  const [lotNumber, setLotNumber] = useState<string>('');
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [administrationDate, setAdministrationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [site, setSite] = useState<VaccinationRecord['site']>('left_deltoid');
  const [route, setRoute] = useState<string>('IM');
  const [notes, setNotes] = useState<string>('');
  const [showAdministerForm, setShowAdministerForm] = useState<boolean>(false);

  useEffect(() => {
    fetchVaccines();
  }, [fetchVaccines]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchVaccinationSchedule(selectedPatientId);
    }
  }, [selectedPatientId, fetchVaccinationSchedule]);

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatient(patientId);
  };

  const handleAdministerVaccine = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatientId || !selectedVaccine || !lotNumber || !expirationDate || !user) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if vaccination management is enabled
    if (!isVaccinationManagementEnabled) {
      alert('Vaccination management is not enabled for your clinic');
      return;
    }

    try {
      const record: Omit<VaccinationRecord, 'id' | 'created_at' | 'tenant_id'> = {
        patient_id: selectedPatientId,
        vaccine_id: selectedVaccine,
        provider_id: user.id,
        administration_date: administrationDate,
        lot_number: lotNumber,
        expiration_date: expirationDate,
        site,
        route,
        administered_by: user.email || 'Unknown',
        reaction: null,
        notes: notes || null
      };

      await createVaccinationRecord(record);
      
      // Reset form
      setSelectedVaccine('');
      setLotNumber('');
      setExpirationDate('');
      setNotes('');
      setShowAdministerForm(false);
      
      alert('Vaccination recorded successfully');
    } catch (error) {
      alert('Failed to record vaccination');
      console.error('Vaccination recording error:', error);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Check if vaccination management is disabled
  if (!isVaccinationManagementEnabled) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Vaccination management is not enabled for your clinic. Please contact your administrator to enable this feature.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vaccination Schedule</h1>
          <p className="text-muted-foreground">Manage patient vaccination records and schedules</p>
        </div>
        {isAdvancedSchedulingEnabled && (
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Bulk Reminders
          </Button>
        )}
      </div>

      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Patient
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => handlePatientSelect(patient.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPatientId === patient.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      {patient.first_name} {patient.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {patient.id.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedPatient && (
        <>
          {/* Patient Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </CardTitle>
                <Button onClick={() => setShowAdministerForm(true)}>
                  <Syringe className="h-4 w-4 mr-2" />
                  Administer Vaccine
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span>Age: {vaccinationSchedule?.age_months} months</span>
                <span>•</span>
                <span>DOB: {new Date(selectedPatient.date_of_birth).toLocaleDateString()}</span>
                {vaccinationSchedule?.next_due_date && (
                  <>
                    <span>•</span>
                    <span className="text-primary font-medium">
                      Next due: {new Date(vaccinationSchedule.next_due_date).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>

              {/* Vaccination Status Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    {vaccinationSchedule?.administered_vaccines.length || 0}
                  </div>
                  <div className="text-sm text-green-700 flex items-center justify-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Completed
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">
                    {vaccinationSchedule?.upcoming_vaccines.length || 0}
                  </div>
                  <div className="text-sm text-blue-700 flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    Upcoming
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">
                    {vaccinationSchedule?.overdue_vaccines.length || 0}
                  </div>
                  <div className="text-sm text-red-700 flex items-center justify-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Overdue
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vaccination Schedule */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Overdue Vaccines */}
            {vaccinationSchedule?.overdue_vaccines.length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Overdue Vaccines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vaccinationSchedule.overdue_vaccines.map((vaccine) => (
                      <div key={vaccine.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div>
                          <div className="font-medium text-red-900">{vaccine.vaccines.name}</div>
                          <div className="text-sm text-red-600">{vaccine.vaccines.abbreviation}</div>
                        </div>
                        <Badge variant="destructive">
                          Due at {vaccine.min_age_months} months
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Vaccines */}
            {vaccinationSchedule?.upcoming_vaccines.length > 0 && (
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Clock className="h-5 w-5" />
                    Upcoming Vaccines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vaccinationSchedule.upcoming_vaccines.map((vaccine) => (
                      <div key={vaccine.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <div className="font-medium text-blue-900">{vaccine.vaccines.name}</div>
                          <div className="text-sm text-blue-600">{vaccine.vaccines.abbreviation}</div>
                        </div>
                        <Badge variant="secondary">
                          Due at {vaccine.min_age_months} months
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Completed Vaccines */}
          {vaccinationSchedule?.administered_vaccines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Completed Vaccines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vaccinationSchedule.administered_vaccines.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Syringe className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium text-green-900">{record.vaccines?.name}</div>
                          <div className="text-sm text-green-600">{record.vaccines?.abbreviation}</div>
                          <div className="text-xs text-green-500">Lot: {record.lot_number}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-green-600">
                          {new Date(record.administration_date).toLocaleDateString()}
                        </div>
                        {record.notes && (
                          <div className="text-xs text-green-500 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Has notes
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Administer Vaccine Modal */}
      {showAdministerForm && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Administer Vaccine</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdministerForm(false)}
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleAdministerVaccine} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Patient</label>
                  <input
                    type="text"
                    value={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-muted"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Vaccine *</label>
                  <select
                    value={selectedVaccine}
                    onChange={(e) => setSelectedVaccine(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Vaccine</option>
                    {vaccines.map((vaccine) => (
                      <option key={vaccine.id} value={vaccine.id}>
                        {vaccine.name} ({vaccine.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Lot Number *</label>
                  <input
                    type="text"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="Enter lot number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Expiration Date *</label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Administration Date *</label>
                  <input
                    type="date"
                    value={administrationDate}
                    onChange={(e) => setAdministrationDate(e.target.value)}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Route</label>
                  <select
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="IM">Intramuscular (IM)</option>
                    <option value="SC">Subcutaneous (SC)</option>
                    <option value="PO">Oral (PO)</option>
                    <option value="IN">Intranasal (IN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Injection Site</label>
                <select
                  value={site}
                  onChange={(e) => setSite(e.target.value as VaccinationRecord['site'])}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value="left_deltoid">Left Deltoid</option>
                  <option value="right_deltoid">Right Deltoid</option>
                  <option value="left_thigh">Left Thigh</option>
                  <option value="right_thigh">Right Thigh</option>
                  <option value="left_arm">Left Arm</option>
                  <option value="right_arm">Right Arm</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdministerForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Record Vaccination
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaccinationSchedule;