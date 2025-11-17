export interface Child {
  id: string;
  parent_id: string;
  full_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  blood_group?: string;
  allergies?: string[];
  medical_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VaccinationRecord {
  id: string;
  child_id: string;
  vaccine_name: string;
  vaccine_code: string;
  scheduled_date: string;
  completed_date?: string;
  completed: boolean;
  dose_number: number;
  total_doses: number;
  clinic_name?: string;
  administered_by?: string;
  batch_number?: string;
  side_effects?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VaccinationReminder {
  id: string;
  child_id: string;
  vaccination_record_id: string;
  reminder_type: 'email' | 'sms' | 'push' | 'in_app';
  scheduled_date: string;
  sent_date?: string;
  sent: boolean;
  message: string;
  days_before: number;
  created_at: string;
  updated_at: string;
}

export interface VaccinationSchedule {
  vaccine_name: string;
  vaccine_code: string;
  recommended_age_months: number;
  dose_number: number;
  total_doses: number;
  description: string;
  importance: 'critical' | 'recommended' | 'optional';
  diseases_prevented: string[];
}

export interface OfflineSyncStatus {
  pending: number;
  synced: number;
  failed: number;
  lastSync: number;
  isSyncing: boolean;
}