import { supabase } from './supabase';

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

export interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  tenant_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  appointment_type: 'vaccination' | 'consultation' | 'follow_up' | 'well_child_visit';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  patients?: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    phone: string;
  };
  users?: {
    first_name: string;
    last_name: string;
    role: string;
  };
}

export interface AppointmentSlot {
  date: string;
  time: string;
  available: boolean;
  provider_id: string;
  provider_name: string;
}

export interface CreateAppointmentData {
  patient_id: string;
  provider_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  appointment_type: Appointment['appointment_type'];
  notes?: string;
}

export const appointmentAPI = {
  // Get all appointments for current tenant
  async getAppointments(tenantId?: string, date?: string): Promise<Appointment[]> {
    try {
      const currentTenantId = tenantId || getCurrentTenantId();
      
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients (
            first_name,
            last_name,
            date_of_birth,
            phone
          ),
          users (
            first_name,
            last_name,
            role
          )
        `)
        .eq('tenant_id', currentTenantId)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (date) {
        query = query.eq('appointment_date', date);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found, return empty array
          return [];
        }
        throw error;
      }
      
      return data as Appointment[];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

  // Get appointments for a specific patient with tenant verification
  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    try {
      const tenantId = getCurrentTenantId();
      
      // First verify the patient belongs to the current tenant
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('id', patientId)
        .eq('tenant_id', tenantId)
        .single();

      if (patientError || !patient) {
        throw new Error('Patient not found or access denied');
      }
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            first_name,
            last_name,
            date_of_birth
          ),
          users (
            first_name,
            last_name,
            role
          )
        `)
        .eq('patient_id', patientId)
        .eq('tenant_id', tenantId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found, return empty array
          return [];
        }
        throw error;
      }
      
      return data as Appointment[];
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      throw error;
    }
  },

  // Get available time slots for a provider on a specific date
  async getAvailableSlots(providerId: string, date: string, duration: number = 30): Promise<AppointmentSlot[]> {
    try {
      // Get provider's working hours (assuming 9 AM to 5 PM for now)
      const workingHours = {
        start: 9,
        end: 17
      };

      // Get existing appointments for this provider on this date
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time, duration_minutes')
        .eq('provider_id', providerId)
        .eq('appointment_date', date)
        .not('status', 'in', '(cancelled, no_show)');

      if (appointmentsError) throw appointmentsError;

      // Generate time slots
      const slots: AppointmentSlot[] = [];
      const { data: provider, error: providerError } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', providerId)
        .single();

      if (providerError) throw providerError;

      const providerName = `${provider.first_name} ${provider.last_name}`;

      for (let hour = workingHours.start; hour < workingHours.end; hour++) {
        for (let minute = 0; minute < 60; minute += duration) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Check if this slot conflicts with existing appointments
          const isAvailable = !existingAppointments?.some(apt => {
            const aptTime = apt.appointment_time;
            const aptDuration = apt.duration_minutes;
            const aptStart = new Date(`2000-01-01T${aptTime}`);
            const aptEnd = new Date(aptStart.getTime() + aptDuration * 60000);
            
            const slotStart = new Date(`2000-01-01T${time}`);
            const slotEnd = new Date(slotStart.getTime() + duration * 60000);
            
            return (slotStart >= aptStart && slotStart < aptEnd) || 
                   (aptStart >= slotStart && aptStart < slotEnd);
          });

          slots.push({
            date,
            time,
            available: isAvailable,
            provider_id: providerId,
            provider_name: providerName
          });
        }
      }

      return slots;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  },

  // Create new appointment with tenant isolation
  async createAppointment(appointmentData: CreateAppointmentData): Promise<Appointment> {
    try {
      const tenantId = getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          ...appointmentData,
          tenant_id: tenantId,
          status: 'scheduled',
          reminder_sent: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          patients (
            first_name,
            last_name,
            date_of_birth
          ),
          users (
            first_name,
            last_name,
            role
          )
        `)
        .single();

      if (error) throw error;
      return data as Appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  // Update appointment with tenant verification
  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    try {
      const tenantId = getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('appointments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select(`
          *,
          patients (
            first_name,
            last_name,
            date_of_birth
          ),
          users (
            first_name,
            last_name,
            role
          )
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Appointment not found or access denied');
        }
        throw error;
      }
      
      return data as Appointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  },

  // Cancel appointment with tenant verification
  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    try {
      const tenantId = getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select(`
          *,
          patients (
            first_name,
            last_name,
            date_of_birth
          ),
          users (
            first_name,
            last_name,
            role
          )
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Appointment not found or access denied');
        }
        throw error;
      }
      
      return data as Appointment;
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  },

  // Get today's appointments for current tenant
  async getTodaysAppointments(tenantId?: string): Promise<Appointment[]> {
    try {
      const currentTenantId = tenantId || getCurrentTenantId();
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            first_name,
            last_name,
            date_of_birth,
            phone
          ),
          users (
            first_name,
            last_name,
            role
          )
        `)
        .eq('tenant_id', currentTenantId)
        .eq('appointment_date', today)
        .not('status', 'in', '(cancelled, no_show)')
        .order('appointment_time', { ascending: true });

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found, return empty array
          return [];
        }
        throw error;
      }
      
      return data as Appointment[];
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      throw error;
    }
  },

  // Get upcoming appointments (next 7 days) for current tenant
  async getUpcomingAppointments(tenantId?: string): Promise<Appointment[]> {
    try {
      const currentTenantId = tenantId || getCurrentTenantId();
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            first_name,
            last_name,
            date_of_birth,
            phone
          ),
          users (
            first_name,
            last_name,
            role
          )
        `)
        .eq('tenant_id', currentTenantId)
        .gte('appointment_date', today.toISOString().split('T')[0])
        .lte('appointment_date', nextWeek.toISOString().split('T')[0])
        .not('status', 'in', '(cancelled, no_show)')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found, return empty array
          return [];
        }
        throw error;
      }
      
      return data as Appointment[];
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error;
    }
  },

  // Mark appointment as confirmed with tenant verification
  async confirmAppointment(id: string): Promise<Appointment> {
    try {
      const tenantId = getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select(`
          *,
          patients (
            first_name,
            last_name,
            date_of_birth
          ),
          users (
            first_name,
            last_name,
            role
          )
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Appointment not found or access denied');
        }
        throw error;
      }
      
      return data as Appointment;
    } catch (error) {
      console.error('Error confirming appointment:', error);
      throw error;
    }
  },

  // Mark reminder as sent with tenant verification
  async markReminderSent(id: string): Promise<void> {
    try {
      const tenantId = getCurrentTenantId();
      
      const { error } = await supabase
        .from('appointments')
        .update({
          reminder_sent: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking reminder as sent:', error);
      throw error;
    }
  },

  // Get providers (pediatricians and nurses) for current tenant
  async getProviders(tenantId?: string): Promise<any[]> {
    try {
      const currentTenantId = tenantId || getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .eq('tenant_id', currentTenantId)
        .eq('is_active', true)
        .in('role', ['pediatrician', 'nurse'])
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw error;
    }
  }
};