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

export interface VaccinationReport {
  total_vaccinations: number;
  completed_vaccinations: number;
  overdue_vaccinations: number;
  upcoming_vaccinations: number;
  completion_rate: number;
  vaccine_breakdown: {
    vaccine_name: string;
    administered_count: number;
    scheduled_count: number;
    overdue_count: number;
  }[];
}

export interface PatientReport {
  total_patients: number;
  active_patients: number;
  new_patients_this_month: number;
  age_distribution: {
    age_group: string;
    count: number;
    percentage: number;
  }[];
  vaccination_status: {
    fully_vaccinated: number;
    partially_vaccinated: number;
    not_vaccinated: number;
  };
}

export interface AppointmentReport {
  total_appointments: number;
  scheduled_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  provider_utilization: {
    provider_name: string;
    total_appointments: number;
    completed_appointments: number;
    cancellation_rate: number;
  }[];
  monthly_trends: {
    month: string;
    appointments: number;
    completed: number;
    cancelled: number;
  }[];
}

export interface InventoryReport {
  total_vaccines: number;
  low_stock_vaccines: number;
  expired_vaccines: number;
  vaccines_expiring_soon: number;
  stock_value: number;
  vaccine_details: {
    vaccine_name: string;
    current_stock: number;
    min_stock: number;
    expiry_date: string;
    batch_number: string;
    status: 'sufficient' | 'low' | 'expired' | 'expiring_soon';
  }[];
}

export interface FinancialReport {
  total_revenue: number;
  monthly_revenue: number;
  revenue_by_service: {
    service_type: string;
    revenue: number;
    percentage: number;
  }[];
  outstanding_payments: number;
  payment_methods: {
    method: string;
    amount: number;
    percentage: number;
  }[];
}

export interface ComplianceReport {
  vaccination_compliance_rate: number;
  documentation_completeness: number;
  consent_form_completion: number;
  adverse_event_reporting: number;
  quality_metrics: {
    metric_name: string;
    score: number;
    target: number;
    status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  }[];
}

export interface DashboardStats {
  total_patients: number;
  total_vaccinations: number;
  upcoming_appointments: number;
  overdue_vaccinations: number;
  low_stock_alerts: number;
  monthly_growth: {
    patients: number;
    vaccinations: number;
    appointments: number;
  };
}

class ReportingAPI {
  async getVaccinationReport(tenantId: string, dateRange?: { start: string; end: string }): Promise<VaccinationReport> {
    try {
      let query = supabase
        .from('vaccinations')
        .select('*, patients!inner(tenant_id)')
        .eq('patients.tenant_id', tenantId);

      if (dateRange) {
        query = query
          .gte('scheduled_date', dateRange.start)
          .lte('scheduled_date', dateRange.end);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const total = data?.length || 0;
      const completed = data?.filter(v => v.status === 'completed').length || 0;
      const overdue = data?.filter(v => v.status === 'overdue').length || 0;
      const upcoming = data?.filter(v => v.status === 'scheduled').length || 0;

      // Get vaccine breakdown
      const vaccineBreakdown: any = {};
      data?.forEach(vaccination => {
        const vaccineName = vaccination.vaccine_name;
        if (!vaccineBreakdown[vaccineName]) {
          vaccineBreakdown[vaccineName] = {
            vaccine_name: vaccineName,
            administered_count: 0,
            scheduled_count: 0,
            overdue_count: 0
          };
        }
        
        if (vaccination.status === 'completed') {
          vaccineBreakdown[vaccineName].administered_count++;
        } else if (vaccination.status === 'scheduled') {
          vaccineBreakdown[vaccineName].scheduled_count++;
        } else if (vaccination.status === 'overdue') {
          vaccineBreakdown[vaccineName].overdue_count++;
        }
      });

      return {
        total_vaccinations: total,
        completed_vaccinations: completed,
        overdue_vaccinations: overdue,
        upcoming_vaccinations: upcoming,
        completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
        vaccine_breakdown: Object.values(vaccineBreakdown)
      };
    } catch (error) {
      console.error('Error fetching vaccination report:', error);
      throw error;
    }
  }

  async getPatientReport(tenantId: string): Promise<PatientReport> {
    try {
      const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;

      const total = patients?.length || 0;
      const active = patients?.filter(p => p.status === 'active').length || 0;

      // Get new patients this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const newThisMonth = patients?.filter(p => 
        new Date(p.created_at) >= startOfMonth
      ).length || 0;

      // Age distribution
      const ageGroups = {
        '0-1 years': 0,
        '1-5 years': 0,
        '6-12 years': 0,
        '13-18 years': 0
      };

      patients?.forEach(patient => {
        const age = this.calculateAge(patient.date_of_birth);
        if (age <= 1) ageGroups['0-1 years']++;
        else if (age <= 5) ageGroups['1-5 years']++;
        else if (age <= 12) ageGroups['6-12 years']++;
        else if (age <= 18) ageGroups['13-18 years']++;
      });

      const ageDistribution = Object.entries(ageGroups).map(([group, count]) => ({
        age_group: group,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }));

      // Vaccination status
      const vaccinationStatus = await this.getVaccinationStatusForPatients(patients || []);

      return {
        total_patients: total,
        active_patients: active,
        new_patients_this_month: newThisMonth,
        age_distribution: ageDistribution,
        vaccination_status: vaccinationStatus
      };
    } catch (error) {
      console.error('Error fetching patient report:', error);
      throw error;
    }
  }

  async getAppointmentReport(tenantId: string, dateRange?: { start: string; end: string }): Promise<AppointmentReport> {
    try {
      let query = supabase
        .from('appointments')
        .select('*, provider:users!appointments_provider_id_fkey(name), patient:patients!appointments_patient_id_fkey(name)')
        .eq('tenant_id', tenantId);

      if (dateRange) {
        query = query
          .gte('appointment_date', dateRange.start)
          .lte('appointment_date', dateRange.end);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const total = data?.length || 0;
      const scheduled = data?.filter(a => a.status === 'scheduled').length || 0;
      const completed = data?.filter(a => a.status === 'completed').length || 0;
      const cancelled = data?.filter(a => a.status === 'cancelled').length || 0;
      const noShow = data?.filter(a => a.status === 'no_show').length || 0;

      // Provider utilization
      const providerStats: any = {};
      data?.forEach(appointment => {
        const providerName = appointment.provider?.name || 'Unknown';
        if (!providerStats[providerName]) {
          providerStats[providerName] = {
            provider_name: providerName,
            total_appointments: 0,
            completed_appointments: 0,
            cancellation_rate: 0
          };
        }
        
        providerStats[providerName].total_appointments++;
        if (appointment.status === 'completed') {
          providerStats[providerName].completed_appointments++;
        }
      });

      // Calculate cancellation rates
      Object.values(providerStats).forEach((stats: any) => {
        const cancelled = data?.filter(a => 
          a.provider?.name === stats.provider_name && a.status === 'cancelled'
        ).length || 0;
        stats.cancellation_rate = Math.round((cancelled / stats.total_appointments) * 100);
      });

      // Monthly trends (last 6 months)
      const monthlyTrends = await this.getMonthlyAppointmentTrends(tenantId);

      return {
        total_appointments: total,
        scheduled_appointments: scheduled,
        completed_appointments: completed,
        cancelled_appointments: cancelled,
        no_show_appointments: noShow,
        provider_utilization: Object.values(providerStats),
        monthly_trends: monthlyTrends
      };
    } catch (error) {
      console.error('Error fetching appointment report:', error);
      throw error;
    }
  }

  async getInventoryReport(tenantId: string): Promise<InventoryReport> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          vaccines (*)
        `)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      const total = data?.length || 0;
      const lowStock = data?.filter(item => item.current_stock <= item.reorder_point).length || 0;
      const expired = data?.filter(item => {
        const vaccine = item.vaccines;
        return vaccine && new Date(vaccine.expiration_date) < new Date();
      }).length || 0;

      const expiringSoon = data?.filter(item => {
        const vaccine = item.vaccines;
        if (!vaccine) return false;
        
        const expiryDate = new Date(vaccine.expiration_date);
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        return expiryDate > today && expiryDate <= thirtyDaysFromNow;
      }).length || 0;

      const stockValue = data?.reduce((total, item) => {
        const vaccine = item.vaccines;
        if (!vaccine) return total;
        return total + (item.current_stock * vaccine.unit_cost);
      }, 0) || 0;

      const vaccineDetails = data?.map(item => {
        const vaccine = item.vaccines;
        if (!vaccine) return null;

        const expiryDate = new Date(vaccine.expiration_date);
        const today = new Date();
        let status: 'sufficient' | 'low' | 'expired' | 'expiring_soon' = 'sufficient';

        if (expiryDate < today) {
          status = 'expired';
        } else if (item.current_stock <= item.reorder_point) {
          status = 'low';
        } else {
          const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          if (expiryDate <= thirtyDaysFromNow) {
            status = 'expiring_soon';
          }
        }

        return {
          vaccine_name: vaccine.name,
          current_stock: item.current_stock,
          min_stock: item.reorder_point,
          expiry_date: vaccine.expiration_date,
          batch_number: vaccine.lot_number,
          status
        };
      }).filter(Boolean) || [];

      return {
        total_vaccines: total,
        low_stock_vaccines: lowStock,
        expired_vaccines: expired,
        vaccines_expiring_soon: expiringSoon,
        stock_value: Math.round(stockValue * 100) / 100,
        vaccine_details: vaccineDetails
      };
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      throw error;
    }
  }

  async getDashboardStats(tenantId: string): Promise<DashboardStats> {
    try {
      const [
        patientStats,
        vaccinationStats,
        appointmentStats,
        inventoryStats
      ] = await Promise.all([
        this.getPatientCount(tenantId),
        this.getVaccinationCount(tenantId),
        this.getUpcomingAppointmentsCount(tenantId),
        this.getOverdueVaccinationsCount(tenantId),
        this.getLowStockAlerts(tenantId)
      ]);

      const monthlyGrowth = await this.getMonthlyGrowth(tenantId);

      return {
        total_patients: patientStats,
        total_vaccinations: vaccinationStats,
        upcoming_appointments: appointmentStats,
        overdue_vaccinations: await this.getOverdueVaccinationsCount(tenantId),
        low_stock_alerts: await this.getLowStockAlerts(tenantId),
        monthly_growth: monthlyGrowth
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private async getVaccinationStatusForPatients(patients: any[]): Promise<any> {
    const patientIds = patients.map(p => p.id);
    
    const { data: vaccinations } = await supabase
      .from('vaccinations')
      .select('patient_id, status')
      .in('patient_id', patientIds);

    const vaccinationMap: any = {};
    vaccinations?.forEach(v => {
      if (!vaccinationMap[v.patient_id]) {
        vaccinationMap[v.patient_id] = { completed: 0, total: 0 };
      }
      vaccinationMap[v.patient_id].total++;
      if (v.status === 'completed') {
        vaccinationMap[v.patient_id].completed++;
      }
    });

    let fullyVaccinated = 0;
    let partiallyVaccinated = 0;
    let notVaccinated = 0;

    patients.forEach(patient => {
      const status = vaccinationMap[patient.id];
      if (!status) {
        notVaccinated++;
      } else if (status.completed === status.total) {
        fullyVaccinated++;
      } else {
        partiallyVaccinated++;
      }
    });

    return {
      fully_vaccinated: fullyVaccinated,
      partially_vaccinated: partiallyVaccinated,
      not_vaccinated: notVaccinated
    };
  }

  private async getMonthlyAppointmentTrends(tenantId: string): Promise<any[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const { data } = await supabase
      .from('appointments')
      .select('appointment_date, status')
      .eq('tenant_id', tenantId)
      .gte('appointment_date', sixMonthsAgo.toISOString());

    const monthlyData: any = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      monthlyData[monthKey] = { month: monthKey, appointments: 0, completed: 0, cancelled: 0 };
    }

    data?.forEach(appointment => {
      const date = new Date(appointment.appointment_date);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].appointments++;
        if (appointment.status === 'completed') {
          monthlyData[monthKey].completed++;
        } else if (appointment.status === 'cancelled') {
          monthlyData[monthKey].cancelled++;
        }
      }
    });

    return Object.values(monthlyData);
  }

  private async getPatientCount(tenantId: string): Promise<number> {
    const { count } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    
    return count || 0;
  }

  private async getVaccinationCount(tenantId: string): Promise<number> {
    const { count } = await supabase
      .from('vaccinations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    
    return count || 0;
  }

  private async getUpcomingAppointmentsCount(tenantId: string): Promise<number> {
    const today = new Date().toISOString();
    const { count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'scheduled')
      .gte('appointment_date', today);
    
    return count || 0;
  }

  private async getOverdueVaccinationsCount(tenantId: string): Promise<number> {
    const today = new Date().toISOString();
    const { count } = await supabase
      .from('vaccinations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'overdue');
    
    return count || 0;
  }

  private async getLowStockAlerts(tenantId: string): Promise<number> {
    const { count } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .lte('current_stock', 'reorder_point');
    
    return count || 0;
  }

  private async getMonthlyGrowth(tenantId: string): Promise<any> {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const thisMonth = new Date();
    
    // Get patient growth
    const { count: lastMonthPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .lt('created_at', lastMonth.toISOString());

    const { count: thisMonthPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .lt('created_at', thisMonth.toISOString());

    // Get vaccination growth
    const { count: lastMonthVaccinations } = await supabase
      .from('vaccinations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .lt('created_at', lastMonth.toISOString());

    const { count: thisMonthVaccinations } = await supabase
      .from('vaccinations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .lt('created_at', thisMonth.toISOString());

    // Get appointment growth
    const { count: lastMonthAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .lt('created_at', lastMonth.toISOString());

    const { count: thisMonthAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .lt('created_at', thisMonth.toISOString());

    return {
      patients: thisMonthPatients && lastMonthPatients ? 
        Math.round(((thisMonthPatients - lastMonthPatients) / lastMonthPatients) * 100) : 0,
      vaccinations: thisMonthVaccinations && lastMonthVaccinations ? 
        Math.round(((thisMonthVaccinations - lastMonthVaccinations) / lastMonthVaccinations) * 100) : 0,
      appointments: thisMonthAppointments && lastMonthAppointments ? 
        Math.round(((thisMonthAppointments - lastMonthAppointments) / lastMonthAppointments) * 100) : 0
    };
  }
}

export const reportingAPI = new ReportingAPI();