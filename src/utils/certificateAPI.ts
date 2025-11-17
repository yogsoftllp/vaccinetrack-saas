import { supabase } from './supabase';

export interface VaccinationCertificate {
  id: string;
  patient_id: string;
  patient_name: string;
  date_of_birth: string;
  patient_address: string;
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  clinic_email: string;
  issuing_provider: string;
  issue_date: string;
  vaccinations: {
    vaccine_name: string;
    vaccine_type: string;
    lot_number: string;
    manufacturer: string;
    administration_date: string;
    site: string;
    route: string;
    dose_number: string;
    provider_name: string;
    next_due_date?: string;
  }[];
  qr_code?: string;
  certificate_number: string;
  valid_until: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  template_type: 'standard' | 'international' | 'custom';
  layout: any;
  fields: string[];
  is_active: boolean;
  created_at: string;
}

class CertificateAPI {
  async generateCertificate(patientId: string, vaccinationIds: string[], issuingProvider: string = 'System'): Promise<VaccinationCertificate> {
    try {
      // Fetch patient data
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;

      // Fetch clinic data
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', patient.clinic_id)
        .single();

      if (clinicError) throw clinicError;

      // Fetch vaccination records
      const { data: vaccinations, error: vaxError } = await supabase
        .from('vaccinations')
        .select(`
          *,
          provider:users!vaccinations_administered_by_fkey(name),
          inventory:vaccine_lot_number(batch_number, manufacturer, expiry_date)
        `)
        .in('id', vaccinationIds)
        .eq('patient_id', patientId)
        .eq('status', 'completed');

      if (vaxError) throw vaxError;

      // Format vaccination data
      const formattedVaccinations = vaccinations?.map(vaccination => ({
        vaccine_name: vaccination.vaccine_name,
        vaccine_type: this.getVaccineType(vaccination.vaccine_name),
        lot_number: vaccination.vaccine_lot_number,
        manufacturer: vaccination.inventory?.manufacturer || 'Unknown',
        administration_date: vaccination.administration_date,
        site: vaccination.site || 'Left Deltoid',
        route: vaccination.route || 'Intramuscular',
        dose_number: vaccination.dose_number || '1',
        provider_name: vaccination.provider?.name || 'Unknown Provider',
        next_due_date: vaccination.next_due_date
      })) || [];

      // Generate certificate number
      const certificateNumber = this.generateCertificateNumber();
      const issueDate = new Date().toISOString().split('T')[0];
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const certificate: VaccinationCertificate = {
        id: this.generateUUID(),
        patient_id: patient.id,
        patient_name: `${patient.first_name} ${patient.last_name}`,
        date_of_birth: patient.date_of_birth,
        patient_address: `${patient.address}, ${patient.city}, ${patient.state} ${patient.zip_code}`,
        clinic_name: clinic.name,
        clinic_address: `${clinic.address}, ${clinic.city}, ${clinic.state} ${clinic.zip_code}`,
        clinic_phone: clinic.phone,
        clinic_email: clinic.email,
        issuing_provider: issuingProvider,
        issue_date: issueDate,
        vaccinations: formattedVaccinations,
        certificate_number: certificateNumber,
        valid_until: validUntil.toISOString().split('T')[0]
      };

      // Save certificate to database
      await this.saveCertificate(certificate);

      return certificate;
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw error;
    }
  }

  async getPatientCertificates(patientId: string): Promise<VaccinationCertificate[]> {
    try {
      const { data, error } = await supabase
        .from('vaccination_certificates')
        .select('*')
        .eq('patient_id', patientId)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient certificates:', error);
      throw error;
    }
  }

  async getCertificate(certificateId: string): Promise<VaccinationCertificate | null> {
    try {
      const { data, error } = await supabase
        .from('vaccination_certificates')
        .select('*')
        .eq('id', certificateId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching certificate:', error);
      throw error;
    }
  }

  async downloadCertificatePDF(certificateId: string): Promise<Blob> {
    try {
      const certificate = await this.getCertificate(certificateId);
      if (!certificate) {
        throw new Error('Certificate not found');
      }

      // Generate PDF content
      const pdfContent = this.generatePDFContent(certificate);
      
      // In a real implementation, you would use a PDF library like jsPDF or pdfmake
      // For now, we'll create a simple text-based PDF
      const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
      return pdfBlob;
    } catch (error) {
      console.error('Error downloading certificate PDF:', error);
      throw error;
    }
  }

  async verifyCertificate(certificateNumber: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('vaccination_certificates')
        .select('valid_until')
        .eq('certificate_number', certificateNumber)
        .single();

      if (error) throw error;
      if (!data) return false;

      // Check if certificate is still valid
      const validUntil = new Date(data.valid_until);
      const today = new Date();
      return today <= validUntil;
    } catch (error) {
      console.error('Error verifying certificate:', error);
      return false;
    }
  }

  async getCertificateTemplates(): Promise<CertificateTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching certificate templates:', error);
      throw error;
    }
  }

  private async saveCertificate(certificate: VaccinationCertificate): Promise<void> {
    try {
      const { error } = await supabase
        .from('vaccination_certificates')
        .insert({
          id: certificate.id,
          patient_id: certificate.patient_id,
          certificate_number: certificate.certificate_number,
          issue_date: certificate.issue_date,
          valid_until: certificate.valid_until,
          issuing_provider: certificate.issuing_provider,
          vaccinations: certificate.vaccinations,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving certificate:', error);
      throw error;
    }
  }

  private generateCertificateNumber(): string {
    const prefix = 'VC';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private getVaccineType(vaccineName: string): string {
    const vaccineTypes: { [key: string]: string } = {
      'MMR': 'Live Attenuated',
      'DTaP': 'Toxoid',
      'IPV': 'Inactivated',
      'Hepatitis B': 'Recombinant',
      'Hib': 'Conjugate',
      'PCV13': 'Conjugate',
      'Varicella': 'Live Attenuated',
      'HPV': 'Recombinant',
      'Influenza': 'Inactivated'
    };

    return vaccineTypes[vaccineName] || 'Unknown';
  }

  private generatePDFContent(certificate: VaccinationCertificate): string {
    // This is a simplified PDF content generator
    // In a real implementation, you would use a proper PDF library
    return `
VACCINATION CERTIFICATE

Certificate Number: ${certificate.certificate_number}
Issue Date: ${certificate.issue_date}
Valid Until: ${certificate.valid_until}

PATIENT INFORMATION
Name: ${certificate.patient_name}
Date of Birth: ${certificate.date_of_birth}
Address: ${certificate.patient_address}

CLINIC INFORMATION
Clinic Name: ${certificate.clinic_name}
Address: ${certificate.clinic_address}
Phone: ${certificate.clinic_phone}
Email: ${certificate.clinic_email}

VACCINATION RECORDS
${certificate.vaccinations.map(vax => `
Vaccine: ${vax.vaccine_name}
Type: ${vax.vaccine_type}
Lot Number: ${vax.lot_number}
Manufacturer: ${vax.manufacturer}
Administration Date: ${vax.administration_date}
Site: ${vax.site}
Route: ${vax.route}
Dose Number: ${vax.dose_number}
Provider: ${vax.provider_name}
${vax.next_due_date ? `Next Due: ${vax.next_due_date}` : ''}
`).join('')}

Issuing Provider: ${certificate.issuing_provider}

This certificate is issued in accordance with CDC guidelines and state regulations.
    `.trim();
  }
}

export const certificateAPI = new CertificateAPI();