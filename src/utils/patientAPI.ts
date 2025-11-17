import { supabase } from '../utils/supabase';

// Helper function to get current tenant ID
export const getCurrentTenantId = (): string => {
  // Try to get tenant ID from localStorage first (for subdomain-based tenants)
  const storedTenant = localStorage.getItem('currentTenant');
  if (storedTenant) {
    try {
      const tenantData = JSON.parse(storedTenant);
      return tenantData.id;
    } catch (e) {
      console.error('Error parsing stored tenant data:', e);
    }
  }
  
  // Fallback to subdomain extraction
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  
  // If we're on a subdomain (not localhost or main domain), use it as tenant identifier
  if (subdomain && subdomain !== 'localhost' && subdomain !== 'clinic') {
    return subdomain;
  }
  
  // Default tenant ID for main domain
  return 'default';
};

export interface Patient {
  id: string;
  clinic_id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  parent_name: string;
  parent_phone?: string;
  parent_email?: string;
  address?: string;
  insurance_id?: string;
  medical_record_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePatientData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  parent_name: string;
  parent_phone?: string;
  parent_email?: string;
  address?: string;
  insurance_id?: string;
  medical_record_number?: string;
}

export interface PatientFilters {
  search?: string;
  gender?: string;
  age_range?: string;
  status?: 'active' | 'inactive' | 'all';
  sort_by?: 'name' | 'dob' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export const patientAPI = {
  // Get all patients for the current tenant
  async getPatients(filters: PatientFilters = {}): Promise<Patient[]> {
    try {
      const tenantId = getCurrentTenantId();
      
      let query = supabase
        .from('patients')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', filters.status !== 'inactive');

      // Apply search filter
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,medical_record_number.ilike.%${filters.search}%`);
      }

      // Apply gender filter
      if (filters.gender && filters.gender !== 'all') {
        query = query.eq('gender', filters.gender);
      }

      // Apply age range filter
      if (filters.age_range) {
        const [minAge, maxAge] = filters.age_range.split('-').map(Number);
        const today = new Date();
        const maxDob = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
        const minDob = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate());
        
        query = query.gte('date_of_birth', minDob.toISOString().split('T')[0])
                     .lte('date_of_birth', maxDob.toISOString().split('T')[0]);
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'created_at';
      const sortOrder = filters.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found, return empty array
          return [];
        }
        throw error;
      }
      
      return data as Patient[];
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  },

  // Get single patient by ID with tenant verification
  async getPatientById(id: string): Promise<Patient | null> {
    try {
      const tenantId = getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Patient not found or not in tenant
          return null;
        }
        throw error;
      }
      
      return data as Patient;
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw error;
    }
  },

  // Create new patient with tenant isolation
  async createPatient(patientData: CreatePatientData): Promise<Patient> {
    try {
      const tenantId = getCurrentTenantId();
      
      // Generate medical record number if not provided
      const mrn = patientData.medical_record_number || `MRN-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('patients')
        .insert([{ 
          ...patientData, 
          medical_record_number: mrn,
          tenant_id: tenantId 
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Patient;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  },

  // Update patient with tenant verification
  async updatePatient(id: string, patientData: Partial<CreatePatientData>): Promise<Patient> {
    try {
      const tenantId = getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('patients')
        .update(patientData)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Patient not found or access denied');
        }
        throw error;
      }
      
      return data as Patient;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  },

  // Soft delete patient with tenant verification
  async deletePatient(id: string): Promise<void> {
    try {
      const tenantId = getCurrentTenantId();
      
      const { error } = await supabase
        .from('patients')
        .update({ is_active: false })
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  },

  // Get patient's vaccination history with tenant verification
  async getPatientVaccinationHistory(patientId: string) {
    try {
      const tenantId = getCurrentTenantId();
      
      // First verify the patient belongs to the current tenant
      const patient = await this.getPatientById(patientId);
      if (!patient) {
        throw new Error('Patient not found or access denied');
      }
      
      const { data, error } = await supabase
        .from('vaccinations')
        .select(`
          *,
          vaccines (name, abbreviation, manufacturer)
        `)
        .eq('patient_id', patientId)
        .order('administration_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching vaccination history:', error);
      throw error;
    }
  },

  // Get patient's medical history with tenant verification
  async getPatientMedicalHistory(patientId: string) {
    try {
      const tenantId = getCurrentTenantId();
      
      // First verify the patient belongs to the current tenant
      const patient = await this.getPatientById(patientId);
      if (!patient) {
        throw new Error('Patient not found or access denied');
      }
      
      const { data, error } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_id', patientId)
        .order('diagnosis_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching medical history:', error);
      throw error;
    }
  },

  // Check if medical record number already exists within tenant
  async checkMRNExists(mrn: string, excludeId?: string): Promise<boolean> {
    try {
      const tenantId = getCurrentTenantId();
      
      let query = supabase
        .from('patients')
        .select('id')
        .eq('medical_record_number', mrn)
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking MRN:', error);
      throw error;
    }
  },

  // Calculate patient's age
  calculateAge(dateOfBirth: string): { years: number; months: number; days: number } {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }

    return { years, months, days };
  },

  // Get vaccination schedule for patient based on age with tenant verification
  async getVaccinationSchedule(patientId: string) {
    try {
      const patient = await this.getPatientById(patientId);
      if (!patient) throw new Error('Patient not found or access denied');

      const age = this.calculateAge(patient.date_of_birth);
      const ageInMonths = age.years * 12 + age.months;

      // Get recommended vaccines for patient's age
      const { data: recommendations, error: recError } = await supabase
        .from('schedule_recommendations')
        .select(`
          *,
          vaccines (name, abbreviation, manufacturer)
        `)
        .lte('min_age_months', ageInMonths)
        .gte('max_age_months', ageInMonths)
        .order('min_age_months', { ascending: true });

      if (recError) throw recError;

      // Get patient's vaccination history
      const vaccinationHistory = await this.getPatientVaccinationHistory(patientId);

      // Filter out already administered vaccines
      const administeredVaccineIds = vaccinationHistory.map((v: any) => v.vaccine_id);
      const upcomingVaccines = recommendations?.filter(rec => 
        !administeredVaccineIds.includes(rec.vaccine_id)
      ) || [];

      return {
        age: ageInMonths,
        upcoming_vaccines: upcomingVaccines,
        administered_vaccines: vaccinationHistory
      };
    } catch (error) {
      console.error('Error getting vaccination schedule:', error);
      throw error;
    }
  }
};