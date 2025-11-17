import { create } from 'zustand';
import { vaccinationAPI, VaccinationSchedule, VaccinationRecord, Vaccine } from '../utils/vaccinationAPI';

interface VaccinationState {
  vaccinationSchedule: VaccinationSchedule | null;
  vaccinationRecords: VaccinationRecord[];
  vaccines: Vaccine[];
  loading: boolean;
  error: string | null;
  selectedPatientId: string | null;
  
  // Actions
  fetchVaccinationSchedule: (patientId: string) => Promise<void>;
  fetchVaccinationRecords: (patientId: string) => Promise<void>;
  fetchVaccines: () => Promise<void>;
  createVaccinationRecord: (record: Omit<VaccinationRecord, 'id' | 'created_at'>) => Promise<void>;
  setSelectedPatient: (patientId: string | null) => void;
  clearError: () => void;
}

export const useVaccinationStore = create<VaccinationState>()(
  (set, get) => ({
    vaccinationSchedule: null,
    vaccinationRecords: [],
    vaccines: [],
    loading: false,
    error: null,
    selectedPatientId: null,

    fetchVaccinationSchedule: async (patientId: string) => {
      set({ loading: true, error: null });
      
      try {
        const schedule = await vaccinationAPI.getVaccinationSchedule(patientId);
        set({ 
          vaccinationSchedule: schedule, 
          loading: false 
        });
      } catch (error) {
        set({ 
          error: 'Failed to fetch vaccination schedule', 
          loading: false 
        });
      }
    },

    fetchVaccinationRecords: async (patientId: string) => {
      set({ loading: true, error: null });
      
      try {
        const records = await vaccinationAPI.getVaccinationRecords(patientId);
        set({ 
          vaccinationRecords: records, 
          loading: false 
        });
      } catch (error) {
        set({ 
          error: 'Failed to fetch vaccination records', 
          loading: false 
        });
      }
    },

    fetchVaccines: async () => {
      set({ loading: true, error: null });
      
      try {
        const vaccines = await vaccinationAPI.getVaccines();
        set({ 
          vaccines, 
          loading: false 
        });
      } catch (error) {
        set({ 
          error: 'Failed to fetch vaccines', 
          loading: false 
        });
      }
    },

    createVaccinationRecord: async (record: Omit<VaccinationRecord, 'id' | 'created_at'>) => {
      set({ loading: true, error: null });
      
      try {
        const newRecord = await vaccinationAPI.createVaccinationRecord(record);
        
        set(state => ({
          vaccinationRecords: [newRecord, ...state.vaccinationRecords],
          loading: false
        }));
        
        // Refresh schedule after adding new record
        if (get().selectedPatientId) {
          await get().fetchVaccinationSchedule(get().selectedPatientId!);
        }
      } catch (error) {
        set({ 
          error: 'Failed to create vaccination record', 
          loading: false 
        });
      }
    },

    setSelectedPatient: (patientId: string | null) => {
      set({ selectedPatientId: patientId });
    },

    clearError: () => {
      set({ error: null });
    }
  })
);