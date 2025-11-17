import { supabase } from './supabase';

export interface VaccinationRecord {
  id: string;
  patient_id: string;
  vaccine_id: string;
  provider_id: string;
  administration_date: string;
  lot_number: string;
  expiration_date: string;
  site: 'left_deltoid' | 'right_deltoid' | 'left_thigh' | 'right_thigh' | 'left_arm' | 'right_arm';
  route: string;
  administered_by: string;
  reaction: string | null;
  notes: string | null;
  created_at: string;
  tenant_id?: string;
  vaccines?: {
    name: string;
    abbreviation: string;
    manufacturer: string;
  };
}

export interface Vaccine {
  id: string;
  name: string;
  abbreviation: string;
  manufacturer: string;
  cpt_code: string;
  min_age_months: number;
  max_age_months: number;
  dose_number: number;
  interval_days: number;
  is_active: boolean;
  tenant_id?: string;
}

export interface ScheduleRecommendation {
  id: string;
  vaccine_id: string;
  min_age_months: number;
  max_age_months: number;
  dose_number: number;
  interval_days: number;
  priority: 'high' | 'standard' | 'low';
  contraindications: string | null;
  vaccines: Vaccine;
  tenant_id?: string;
}

export interface VaccinationSchedule {
  patient_id: string;
  age_months: number;
  upcoming_vaccines: ScheduleRecommendation[];
  overdue_vaccines: ScheduleRecommendation[];
  administered_vaccines: VaccinationRecord[];
  next_due_date: string | null;
}

export interface VaccinationReminder {
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  vaccine_name: string;
  due_date: string;
  days_until_due: number;
  priority: 'high' | 'medium' | 'low';
  reminder_sent: boolean;
}

// Helper function to get current tenant ID from auth store or localStorage
const getCurrentTenantId = (): string | null => {
  // Try to get from localStorage first (set by auth flow)
  const tenantId = localStorage.getItem('tenant_id');
  if (tenantId) return tenantId;
  
  // Fallback to extracting from subdomain
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0]; // First part is subdomain
  }
  
  return null;
};

export const vaccinationAPI = {
  // Get all vaccines for current tenant
  async getVaccines(): Promise<Vaccine[]> {
    try {
      const tenantId = getCurrentTenantId();
      let query = supabase
        .from('vaccines')
        .select('*')
        .eq('is_active', true);
      
      // Add tenant filter if available
      if (tenantId) {
        query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
      }
      
      const { data, error } = await query
        .order('min_age_months', { ascending: true });

      if (error) throw error;
      return data as Vaccine[];
    } catch (error) {
      console.error('Error fetching vaccines:', error);
      throw error;
    }
  },

  // Get vaccination schedule for a patient (with tenant isolation)
  async getVaccinationSchedule(patientId: string): Promise<VaccinationSchedule> {
    try {
      const tenantId = getCurrentTenantId();
      
      // Get patient details with tenant verification
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('date_of_birth, tenant_id')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;
      
      // Verify tenant access
      if (tenantId && patient.tenant_id !== tenantId) {
        throw new Error('Access denied: Patient belongs to different tenant');
      }

      // Calculate age in months
      const birthDate = new Date(patient.date_of_birth);
      const today = new Date();
      const ageMonths = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

      // Get schedule recommendations with tenant filter
      let recQuery = supabase
        .from('schedule_recommendations')
        .select(`
          *,
          vaccines (*)
        `);
      
      if (tenantId) {
        recQuery = recQuery.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
      }
      
      const { data: recommendations, error: recError } = await recQuery
        .order('min_age_months', { ascending: true });

      if (recError) throw recError;

      // Get patient's vaccination history with tenant filter
      let historyQuery = supabase
        .from('vaccinations')
        .select(`
          *,
          vaccines (*)
        `)
        .eq('patient_id', patientId);
      
      if (tenantId) {
        historyQuery = historyQuery.eq('tenant_id', tenantId);
      }
      
      const { data: vaccinationHistory, error: historyError } = await historyQuery
        .order('administration_date', { ascending: false });

      if (historyError) throw historyError;

      // Determine which vaccines are due vs administered
      const administeredVaccineIds = vaccinationHistory?.map(v => v.vaccine_id) || [];
      
      const upcomingVaccines = recommendations?.filter(rec => 
        !administeredVaccineIds.includes(rec.vaccine_id) && 
        ageMonths >= rec.min_age_months
      ) || [];

      const overdueVaccines = recommendations?.filter(rec => 
        !administeredVaccineIds.includes(rec.vaccine_id) && 
        ageMonths > rec.max_age_months
      ) || [];

      // Calculate next due date
      let nextDueDate = null;
      if (upcomingVaccines.length > 0) {
        const nextVaccine = upcomingVaccines[0];
        const nextDueMonths = nextVaccine.min_age_months;
        const nextDueDateObj = new Date(birthDate);
        nextDueDateObj.setMonth(nextDueDateObj.getMonth() + nextDueMonths);
        nextDueDate = nextDueDateObj.toISOString().split('T')[0];
      }

      return {
        patient_id: patientId,
        age_months: ageMonths,
        upcoming_vaccines: upcomingVaccines,
        overdue_vaccines: overdueVaccines,
        administered_vaccines: vaccinationHistory || [],
        next_due_date: nextDueDate
      };
    } catch (error) {
      console.error('Error getting vaccination schedule:', error);
      throw error;
    }
  },

  // Create vaccination record (with tenant isolation)
  async createVaccinationRecord(record: Omit<VaccinationRecord, 'id' | 'created_at' | 'tenant_id'>): Promise<VaccinationRecord> {
    try {
      const tenantId = getCurrentTenantId();
      
      // Validate vaccine exists and is not expired
      const { data: vaccine, error: vaccineError } = await supabase
        .from('vaccines')
        .select('*')
        .eq('id', record.vaccine_id)
        .single();

      if (vaccineError) throw vaccineError;
      if (!vaccine) throw new Error('Vaccine not found');
      
      // Verify tenant access for vaccine
      if (tenantId && vaccine.tenant_id && vaccine.tenant_id !== tenantId) {
        throw new Error('Access denied: Vaccine belongs to different tenant');
      }

      // Verify patient belongs to current tenant
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('tenant_id')
        .eq('id', record.patient_id)
        .single();

      if (patientError) throw patientError;
      if (tenantId && patient.tenant_id !== tenantId) {
        throw new Error('Access denied: Patient belongs to different tenant');
      }

      // Check if vaccine lot exists in inventory with tenant filter
      let inventoryQuery = supabase
        .from('inventory')
        .select('*')
        .eq('vaccine_id', record.vaccine_id)
        .eq('lot_number', record.lot_number)
        .gte('expiration_date', record.administration_date)
        .gt('quantity_on_hand', 0);
      
      if (tenantId) {
        inventoryQuery = inventoryQuery.eq('tenant_id', tenantId);
      }
      
      const { data: inventory, error: inventoryError } = await inventoryQuery.single();

      if (inventoryError || !inventory) {
        throw new Error('Vaccine lot not available in inventory or expired');
      }

      // Create vaccination record with tenant ID
      const recordWithTenant = {
        ...record,
        tenant_id: tenantId
      };

      const { data, error } = await supabase
        .from('vaccinations')
        .insert([recordWithTenant])
        .select()
        .single();

      if (error) throw error;

      // Update inventory
      const { error: inventoryUpdateError } = await supabase
        .from('inventory')
        .update({ 
          quantity_on_hand: inventory.quantity_on_hand - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', inventory.id);

      if (inventoryUpdateError) {
        console.error('Error updating inventory:', inventoryUpdateError);
        // Don't throw here as vaccination was created successfully
      }

      return data as VaccinationRecord;
    } catch (error) {
      console.error('Error creating vaccination record:', error);
      throw error;
    }
  },

  // Get vaccination records for a patient (with tenant isolation)
  async getVaccinationRecords(patientId: string): Promise<VaccinationRecord[]> {
    try {
      const tenantId = getCurrentTenantId();
      
      // Verify patient belongs to current tenant
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('tenant_id')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;
      if (tenantId && patient.tenant_id !== tenantId) {
        throw new Error('Access denied: Patient belongs to different tenant');
      }

      let query = supabase
        .from('vaccinations')
        .select(`
          *,
          vaccines (*)
        `)
        .eq('patient_id', patientId);
      
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data, error } = await query
        .order('administration_date', { ascending: false });

      if (error) throw error;
      return data as VaccinationRecord[];
    } catch (error) {
      console.error('Error fetching vaccination records:', error);
      throw error;
    }
  },

  // Update vaccination record (with tenant verification)
  async updateVaccinationRecord(id: string, updates: Partial<VaccinationRecord>): Promise<VaccinationRecord> {
    try {
      const tenantId = getCurrentTenantId();
      
      // First verify the record belongs to current tenant
      if (tenantId) {
        const { data: existingRecord, error: checkError } = await supabase
          .from('vaccinations')
          .select('tenant_id')
          .eq('id', id)
          .single();

        if (checkError) throw checkError;
        if (existingRecord && existingRecord.tenant_id !== tenantId) {
          throw new Error('Access denied: Record belongs to different tenant');
        }
      }

      const { data, error } = await supabase
        .from('vaccinations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as VaccinationRecord;
    } catch (error) {
      console.error('Error updating vaccination record:', error);
      throw error;
    }
  },

  // Get overdue vaccinations for all patients in current tenant
  async getOverdueVaccinations(): Promise<any[]> {
    try {
      const tenantId = getCurrentTenantId();
      
      // Get all active patients in the current tenant
      let patientQuery = supabase
        .from('patients')
        .select('id, first_name, last_name, date_of_birth, tenant_id')
        .eq('is_active', true);
      
      if (tenantId) {
        patientQuery = patientQuery.eq('tenant_id', tenantId);
      }
      
      const { data: patients, error: patientsError } = await patientQuery;

      if (patientsError) throw patientsError;

      const overdueVaccinations = [];

      for (const patient of patients || []) {
        try {
          // Verify tenant access for each patient
          if (tenantId && patient.tenant_id !== tenantId) {
            continue; // Skip patients from other tenants
          }
          
          const schedule = await this.getVaccinationSchedule(patient.id);
          if (schedule.overdue_vaccines.length > 0) {
            overdueVaccinations.push({
              patient_id: patient.id,
              patient_name: `${patient.first_name} ${patient.last_name}`,
              overdue_vaccines: schedule.overdue_vaccines
            });
          }
        } catch (error) {
          console.error(`Error processing patient ${patient.id}:`, error);
        }
      }

      return overdueVaccinations;
    } catch (error) {
      console.error('Error fetching overdue vaccinations:', error);
      throw error;
    }
  },

  // Get upcoming vaccination reminders for current tenant
  async getUpcomingReminders(daysAhead: number = 30): Promise<VaccinationReminder[]> {
    try {
      const tenantId = getCurrentTenantId();
      
      // Get all active patients in current tenant
      let patientQuery = supabase
        .from('patients')
        .select('id, first_name, last_name, date_of_birth, phone, tenant_id')
        .eq('is_active', true);
      
      if (tenantId) {
        patientQuery = patientQuery.eq('tenant_id', tenantId);
      }
      
      const { data: patients, error: patientsError } = await patientQuery;

      if (patientsError) throw patientsError;

      const reminders: VaccinationReminder[] = [];
      const today = new Date();
      const futureDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      for (const patient of patients || []) {
        try {
          // Verify tenant access
          if (tenantId && patient.tenant_id !== tenantId) {
            continue; // Skip patients from other tenants
          }
          
          const schedule = await this.getVaccinationSchedule(patient.id);
          
          for (const vaccine of schedule.upcoming_vaccines) {
            // Calculate due date for this vaccine
            const birthDate = new Date(patient.date_of_birth);
            const dueDate = new Date(birthDate);
            dueDate.setMonth(dueDate.getMonth() + vaccine.min_age_months);

            // Check if due date is within the reminder window
            if (dueDate >= today && dueDate <= futureDate) {
              const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              let priority: 'high' | 'medium' | 'low' = 'medium';
              
              if (daysUntilDue <= 3) priority = 'high';
              else if (daysUntilDue > 14) priority = 'low';

              reminders.push({
                patient_id: patient.id,
                patient_name: `${patient.first_name} ${patient.last_name}`,
                patient_phone: patient.phone,
                vaccine_name: vaccine.vaccines.name,
                due_date: dueDate.toISOString().split('T')[0],
                days_until_due: daysUntilDue,
                priority,
                reminder_sent: false
              });
            }
          }
        } catch (error) {
          console.error(`Error processing patient ${patient.id}:`, error);
        }
      }

      return reminders.sort((a, b) => a.days_until_due - b.days_until_due);
    } catch (error) {
      console.error('Error fetching vaccination reminders:', error);
      throw error;
    }
  },

  // Send SMS reminder (placeholder - would integrate with SMS service)
  async sendSMSReminder(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // This is a placeholder for SMS integration
      // In a real implementation, you would integrate with services like:
      // - Twilio
      // - AWS SNS
      // - MessageBird
      // - etc.
      
      console.log(`SMS would be sent to ${phoneNumber}: ${message}`);
      
      // For now, we'll simulate success
      return true;
    } catch (error) {
      console.error('Error sending SMS reminder:', error);
      return false;
    }
  },

  // Send email reminder (placeholder - would integrate with email service)
  async sendEmailReminder(email: string, subject: string, message: string): Promise<boolean> {
    try {
      // This is a placeholder for email integration
      // In a real implementation, you would integrate with services like:
      // - SendGrid
      // - AWS SES
      // - Mailgun
      // - etc.
      
      console.log(`Email would be sent to ${email}: ${subject} - ${message}`);
      
      // For now, we'll simulate success
      return true;
    } catch (error) {
      console.error('Error sending email reminder:', error);
      return false;
    }
  },

  // Process all reminders for current tenant
  async processReminders(): Promise<{ sent: number; failed: number }> {
    try {
      const reminders = await this.getUpcomingReminders(7); // Next 7 days
      let sent = 0;
      let failed = 0;

      for (const reminder of reminders) {
        if (reminder.priority === 'high' && reminder.days_until_due <= 3) {
          // Send SMS for high priority reminders
          const smsSuccess = await this.sendSMSReminder(
            reminder.patient_phone,
            `Reminder: ${reminder.vaccine_name} vaccination is due on ${reminder.due_date}. Please schedule your appointment.`
          );
          
          if (smsSuccess) {
            sent++;
          } else {
            failed++;
          }
        }
        
        // Could also send email reminders here if email is available
      }

      return { sent, failed };
    } catch (error) {
      console.error('Error processing reminders:', error);
      return { sent: 0, failed: 1 };
    }
  }
};