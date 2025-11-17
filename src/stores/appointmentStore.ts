import { create } from 'zustand';
import { appointmentAPI, Appointment, CreateAppointmentData } from '../utils/appointmentAPI';

interface AppointmentState {
  appointments: Appointment[];
  todaysAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  selectedAppointment: Appointment | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchAppointments: (date?: string) => Promise<void>;
  fetchTodaysAppointments: () => Promise<void>;
  fetchUpcomingAppointments: () => Promise<void>;
  createAppointment: (appointmentData: CreateAppointmentData) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  cancelAppointment: (id: string, reason?: string) => Promise<void>;
  confirmAppointment: (id: string) => Promise<void>;
  setSelectedAppointment: (appointment: Appointment | null) => void;
  clearError: () => void;
}

export const useAppointmentStore = create<AppointmentState>()(
  (set, get) => ({
    appointments: [],
    todaysAppointments: [],
    upcomingAppointments: [],
    selectedAppointment: null,
    loading: false,
    error: null,

    fetchAppointments: async (date?: string) => {
      set({ loading: true, error: null });
      
      try {
        const appointments = await appointmentAPI.getAppointments(undefined, date);
        set({ appointments, loading: false });
      } catch (error) {
        set({ 
          error: 'Failed to fetch appointments', 
          loading: false 
        });
      }
    },

    fetchTodaysAppointments: async () => {
      set({ loading: true, error: null });
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const todaysAppointments = await appointmentAPI.getAppointments(undefined, today);
        set({ todaysAppointments, loading: false });
      } catch (error) {
        set({ 
          error: 'Failed to fetch today\'s appointments', 
          loading: false 
        });
      }
    },

    fetchUpcomingAppointments: async () => {
      set({ loading: true, error: null });
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const upcomingAppointments = await appointmentAPI.getAppointments(undefined, today);
        set({ upcomingAppointments, loading: false });
      } catch (error) {
        set({ 
          error: 'Failed to fetch upcoming appointments', 
          loading: false 
        });
      }
    },

    createAppointment: async (appointmentData: CreateAppointmentData) => {
      set({ loading: true, error: null });
      
      try {
        const newAppointment = await appointmentAPI.createAppointment(appointmentData);
        
        set(state => ({
          appointments: [...state.appointments, newAppointment],
          loading: false
        }));
        
        // Refresh today's and upcoming appointments if needed
        const { fetchTodaysAppointments, fetchUpcomingAppointments } = get();
        // This would need clinicId - we'll handle this in the component
      } catch (error) {
        set({ 
          error: 'Failed to create appointment', 
          loading: false 
        });
      }
    },

    updateAppointment: async (id: string, updates: Partial<Appointment>) => {
      set({ loading: true, error: null });
      
      try {
        const updatedAppointment = await appointmentAPI.updateAppointment(id, updates);
        
        set(state => ({
          appointments: state.appointments.map(apt => 
            apt.id === id ? updatedAppointment : apt
          ),
          todaysAppointments: state.todaysAppointments.map(apt => 
            apt.id === id ? updatedAppointment : apt
          ),
          upcomingAppointments: state.upcomingAppointments.map(apt => 
            apt.id === id ? updatedAppointment : apt
          ),
          selectedAppointment: state.selectedAppointment?.id === id ? updatedAppointment : state.selectedAppointment,
          loading: false
        }));
      } catch (error) {
        set({ 
          error: 'Failed to update appointment', 
          loading: false 
        });
      }
    },

    cancelAppointment: async (id: string, reason?: string) => {
      set({ loading: true, error: null });
      
      try {
        const cancelledAppointment = await appointmentAPI.cancelAppointment(id, reason);
        
        set(state => ({
          appointments: state.appointments.map(apt => 
            apt.id === id ? cancelledAppointment : apt
          ),
          todaysAppointments: state.todaysAppointments.filter(apt => apt.id !== id),
          upcomingAppointments: state.upcomingAppointments.filter(apt => apt.id !== id),
          selectedAppointment: state.selectedAppointment?.id === id ? cancelledAppointment : state.selectedAppointment,
          loading: false
        }));
      } catch (error) {
        set({ 
          error: 'Failed to cancel appointment', 
          loading: false 
        });
      }
    },

    confirmAppointment: async (id: string) => {
      set({ loading: true, error: null });
      
      try {
        const confirmedAppointment = await appointmentAPI.confirmAppointment(id);
        
        set(state => ({
          appointments: state.appointments.map(apt => 
            apt.id === id ? confirmedAppointment : apt
          ),
          todaysAppointments: state.todaysAppointments.map(apt => 
            apt.id === id ? confirmedAppointment : apt
          ),
          upcomingAppointments: state.upcomingAppointments.map(apt => 
            apt.id === id ? confirmedAppointment : apt
          ),
          selectedAppointment: state.selectedAppointment?.id === id ? confirmedAppointment : state.selectedAppointment,
          loading: false
        }));
      } catch (error) {
        set({ 
          error: 'Failed to confirm appointment', 
          loading: false 
        });
      }
    },

    setSelectedAppointment: (appointment: Appointment | null) => {
      set({ selectedAppointment: appointment });
    },

    clearError: () => {
      set({ error: null });
    }
  })
);