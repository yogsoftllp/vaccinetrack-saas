import { create } from 'zustand';
import { vaccinationAPI, VaccinationReminder } from '../utils/vaccinationAPI';

interface ReminderState {
  reminders: VaccinationReminder[];
  overdueReminders: VaccinationReminder[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchReminders: (clinicId: string) => Promise<void>;
  fetchOverdueReminders: (clinicId: string) => Promise<void>;
  processReminders: (clinicId: string) => Promise<{ sent: number; failed: number }>;
  clearError: () => void;
}

export const useReminderStore = create<ReminderState>()(
  (set, get) => ({
    reminders: [],
    overdueReminders: [],
    loading: false,
    error: null,

    fetchReminders: async (clinicId: string) => {
      set({ loading: true, error: null });
      
      try {
        const reminders = await vaccinationAPI.getUpcomingReminders(30);
        set({ reminders, loading: false });
      } catch (error) {
        set({ 
          error: 'Failed to fetch vaccination reminders', 
          loading: false 
        });
      }
    },

    fetchOverdueReminders: async (clinicId: string) => {
      set({ loading: true, error: null });
      
      try {
        const patients = await vaccinationAPI.getOverdueVaccinations();
        
        const overdueReminders: VaccinationReminder[] = [];
        
        for (const patient of patients || []) {
          for (const vaccine of patient.overdue_vaccines) {
            overdueReminders.push({
              patient_id: patient.patient_id,
              patient_name: patient.patient_name,
              patient_phone: '', // Would need to fetch from patient data
              vaccine_name: vaccine.vaccines.name,
              due_date: new Date().toISOString().split('T')[0], // Overdue today
              days_until_due: -1, // Negative indicates overdue
              priority: 'high',
              reminder_sent: false
            });
          }
        }
        
        set({ overdueReminders, loading: false });
      } catch (error) {
        set({ 
          error: 'Failed to fetch overdue reminders', 
          loading: false 
        });
      }
    },

    processReminders: async (clinicId: string) => {
      set({ loading: true, error: null });
      
      try {
        const result = await vaccinationAPI.processReminders();
        
        // Refresh reminders after processing
        await get().fetchReminders(clinicId);
        
        set({ loading: false });
        return result;
      } catch (error) {
        set({ 
          error: 'Failed to process reminders', 
          loading: false 
        });
        return { sent: 0, failed: 1 };
      }
    },

    clearError: () => {
      set({ error: null });
    }
  })
);