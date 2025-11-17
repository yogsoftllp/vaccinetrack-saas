import { create } from 'zustand';
import { Patient, CreatePatientData, PatientFilters, patientAPI } from '../utils/patientAPI';

interface PatientState {
  patients: Patient[];
  currentPatient: Patient | null;
  loading: boolean;
  error: string | null;
  filters: PatientFilters;
  totalCount: number;
  
  // Actions
  fetchPatients: (filters?: PatientFilters) => Promise<void>;
  fetchPatientById: (id: string) => Promise<void>;
  createPatient: (patientData: CreatePatientData) => Promise<void>;
  updatePatient: (id: string, patientData: Partial<CreatePatientData>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  setFilters: (filters: PatientFilters) => void;
  clearError: () => void;
  clearCurrentPatient: () => void;
}

export const usePatientStore = create<PatientState>()(
  (set, get) => ({
    patients: [],
    currentPatient: null,
    loading: false,
    error: null,
    filters: {},
    totalCount: 0,

    fetchPatients: async (filters?: PatientFilters) => {
      set({ loading: true, error: null });
      
      try {
        const finalFilters = filters || get().filters;
        const patients = await patientAPI.getPatients(finalFilters);
        
        set({ 
          patients, 
          totalCount: patients.length,
          loading: false 
        });
      } catch (error) {
        set({ 
          error: 'Failed to fetch patients', 
          loading: false 
        });
      }
    },

    fetchPatientById: async (id: string) => {
      set({ loading: true, error: null });
      
      try {
        const patient = await patientAPI.getPatientById(id);
        if (patient) {
          set({ currentPatient: patient, loading: false });
        } else {
          set({ error: 'Patient not found', loading: false });
        }
      } catch (error) {
        set({ 
          error: 'Failed to fetch patient details', 
          loading: false 
        });
      }
    },

    createPatient: async (patientData: CreatePatientData) => {
      set({ loading: true, error: null });
      
      try {
        // Check if MRN already exists
        if (patientData.medical_record_number) {
          const mrnExists = await patientAPI.checkMRNExists(patientData.medical_record_number);
          if (mrnExists) {
            set({ 
              error: 'Medical record number already exists', 
              loading: false 
            });
            return;
          }
        }

        const newPatient = await patientAPI.createPatient(patientData);
        
        set(state => ({
          patients: [newPatient, ...state.patients],
          totalCount: state.totalCount + 1,
          loading: false
        }));
      } catch (error) {
        set({ 
          error: 'Failed to create patient', 
          loading: false 
        });
      }
    },

    updatePatient: async (id: string, patientData: Partial<CreatePatientData>) => {
      set({ loading: true, error: null });
      
      try {
        // Check if MRN already exists (if being updated)
        if (patientData.medical_record_number) {
          const mrnExists = await patientAPI.checkMRNExists(patientData.medical_record_number, id);
          if (mrnExists) {
            set({ 
              error: 'Medical record number already exists', 
              loading: false 
            });
            return;
          }
        }

        const updatedPatient = await patientAPI.updatePatient(id, patientData);
        
        set(state => ({
          patients: state.patients.map(p => p.id === id ? updatedPatient : p),
          currentPatient: state.currentPatient?.id === id ? updatedPatient : state.currentPatient,
          loading: false
        }));
      } catch (error) {
        set({ 
          error: 'Failed to update patient', 
          loading: false 
        });
      }
    },

    deletePatient: async (id: string) => {
      set({ loading: true, error: null });
      
      try {
        await patientAPI.deletePatient(id);
        
        set(state => ({
          patients: state.patients.filter(p => p.id !== id),
          totalCount: state.totalCount - 1,
          loading: false
        }));
      } catch (error) {
        set({ 
          error: 'Failed to delete patient', 
          loading: false 
        });
      }
    },

    setFilters: (filters: PatientFilters) => {
      set({ filters });
    },

    clearError: () => {
      set({ error: null });
    },

    clearCurrentPatient: () => {
      set({ currentPatient: null });
    }
  })
);