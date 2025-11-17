-- Pediatric Clinic Management System Database Schema
-- This migration creates all tables for the vaccination tracking system

-- Create clinics table first (referenced by other tables)
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    license_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table with clinic association
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('pediatrician', 'nurse', 'administrator', 'receptionist')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50),
    clinic_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT users_clinic_fkey 
        FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

-- Create patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    parent_name VARCHAR(200) NOT NULL,
    parent_phone VARCHAR(20),
    parent_email VARCHAR(255),
    address TEXT,
    insurance_id VARCHAR(100),
    medical_record_number VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT patients_clinic_fkey 
        FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

-- Create vaccines table with standard pediatric vaccines
CREATE TABLE vaccines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(20) NOT NULL,
    manufacturer VARCHAR(100),
    cpt_code VARCHAR(20),
    min_age_months INTEGER NOT NULL,
    max_age_months INTEGER,
    dose_number INTEGER DEFAULT 1,
    interval_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vaccinations table
CREATE TABLE vaccinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    vaccine_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    administration_date DATE NOT NULL,
    lot_number VARCHAR(50) NOT NULL,
    expiration_date DATE NOT NULL,
    site VARCHAR(50) CHECK (site IN ('left_deltoid', 'right_deltoid', 'left_thigh', 'right_thigh', 'left_arm', 'right_arm')),
    route VARCHAR(50) DEFAULT 'intramuscular',
    administered_by VARCHAR(100) NOT NULL,
    reaction VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT vaccinations_patient_fkey 
        FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT vaccinations_vaccine_fkey 
        FOREIGN KEY (vaccine_id) REFERENCES vaccines(id),
    CONSTRAINT vaccinations_provider_fkey 
        FOREIGN KEY (provider_id) REFERENCES users(id)
);

-- Create appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    appointment_type VARCHAR(50) DEFAULT 'vaccination',
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT appointments_patient_fkey 
        FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT appointments_provider_fkey 
        FOREIGN KEY (provider_id) REFERENCES users(id)
);

-- Create inventory table
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vaccine_id UUID NOT NULL,
    lot_number VARCHAR(50) NOT NULL,
    quantity_on_hand INTEGER NOT NULL CHECK (quantity_on_hand >= 0),
    expiration_date DATE NOT NULL,
    unit_cost DECIMAL(10,2),
    storage_location VARCHAR(100),
    reorder_level INTEGER DEFAULT 5,
    clinic_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT inventory_vaccine_fkey 
        FOREIGN KEY (vaccine_id) REFERENCES vaccines(id),
    CONSTRAINT inventory_clinic_fkey 
        FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

-- Create medical history table
CREATE TABLE medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    condition_type VARCHAR(50) NOT NULL,
    condition_name VARCHAR(200) NOT NULL,
    diagnosis_date DATE,
    severity VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT medical_history_patient_fkey 
        FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Create schedule recommendations table
CREATE TABLE schedule_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vaccine_id UUID NOT NULL,
    min_age_months INTEGER NOT NULL,
    max_age_months INTEGER,
    dose_number INTEGER DEFAULT 1,
    interval_days INTEGER DEFAULT 0,
    priority VARCHAR(20) DEFAULT 'standard',
    contraindications TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT schedule_recommendations_vaccine_fkey 
        FOREIGN KEY (vaccine_id) REFERENCES vaccines(id)
);

-- Create indexes for performance
CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_dob ON patients(date_of_birth);
CREATE INDEX idx_patients_mrn ON patients(medical_record_number);

CREATE INDEX idx_vaccinations_patient_id ON vaccinations(patient_id);
CREATE INDEX idx_vaccinations_admin_date ON vaccinations(administration_date);
CREATE INDEX idx_vaccinations_vaccine_id ON vaccinations(vaccine_id);
CREATE INDEX idx_vaccinations_provider_id ON vaccinations(provider_id);

CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_provider_id ON appointments(provider_id);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE INDEX idx_inventory_vaccine_id ON inventory(vaccine_id);
CREATE INDEX idx_inventory_expiration ON inventory(expiration_date);
CREATE INDEX idx_inventory_clinic_id ON inventory(clinic_id);
CREATE INDEX idx_inventory_quantity ON inventory(quantity_on_hand);

-- Insert sample clinic
INSERT INTO clinics (name, address, phone, email, license_number) VALUES 
('Sample Pediatric Clinic', '123 Medical Center Dr, Healthcare City, HC 12345', '+1-555-0123', 'admin@pediatricclinic.com', 'CLINIC-LICENSE-001');

-- Insert standard pediatric vaccines
INSERT INTO vaccines (name, abbreviation, manufacturer, cpt_code, min_age_months, max_age_months, dose_number, interval_days) VALUES
('Hepatitis B', 'HepB', 'Merck', '90744', 0, 18, 1, 0),
('Hepatitis B', 'HepB', 'Merck', '90744', 2, 18, 2, 60),
('Hepatitis B', 'HepB', 'Merck', '90744', 6, 18, 3, 120),
('Diphtheria, Tetanus, Pertussis', 'DTaP', 'Sanofi', '90700', 2, 72, 1, 0),
('Diphtheria, Tetanus, Pertussis', 'DTaP', 'Sanofi', '90700', 4, 72, 2, 60),
('Diphtheria, Tetanus, Pertussis', 'DTaP', 'Sanofi', '90700', 6, 72, 3, 60),
('Diphtheria, Tetanus, Pertussis', 'DTaP', 'Sanofi', '90700', 15, 72, 4, 270),
('Haemophilus influenzae type b', 'Hib', 'GSK', '90647', 2, 59, 1, 0),
('Haemophilus influenzae type b', 'Hib', 'GSK', '90647', 4, 59, 2, 60),
('Haemophilus influenzae type b', 'Hib', 'GSK', '90647', 6, 59, 3, 60),
('Pneumococcal Conjugate', 'PCV13', 'Pfizer', '90670', 2, 59, 1, 0),
('Pneumococcal Conjugate', 'PCV13', 'Pfizer', '90670', 4, 59, 2, 60),
('Pneumococcal Conjugate', 'PCV13', 'Pfizer', '90670', 6, 59, 3, 60),
('Pneumococcal Conjugate', 'PCV13', 'Pfizer', '90670', 12, 59, 4, 180),
('Poliovirus', 'IPV', 'Sanofi', '90713', 2, 72, 1, 0),
('Poliovirus', 'IPV', 'Sanofi', '90713', 4, 72, 2, 60),
('Poliovirus', 'IPV', 'Sanofi', '90713', 6, 72, 3, 60),
('Measles, Mumps, Rubella', 'MMR', 'Merck', '90707', 12, 144, 1, 0),
('Measles, Mumps, Rubella', 'MMR', 'Merck', '90707', 12, 144, 2, 1095),
('Varicella', 'VAR', 'Merck', '90716', 12, 144, 1, 0),
('Varicella', 'VAR', 'Merck', '90716', 12, 144, 2, 1095);

-- Insert schedule recommendations
INSERT INTO schedule_recommendations (vaccine_id, min_age_months, max_age_months, dose_number, interval_days, priority, contraindications) VALUES
-- Birth vaccines
((SELECT id FROM vaccines WHERE abbreviation = 'HepB' AND dose_number = 1), 0, 1, 1, 0, 'high', 'severe allergic reaction to previous dose'),
-- 2 month vaccines
((SELECT id FROM vaccines WHERE abbreviation = 'DTaP' AND dose_number = 1), 2, 3, 1, 0, 'high', 'severe allergic reaction to previous dose'),
((SELECT id FROM vaccines WHERE abbreviation = 'Hib' AND dose_number = 1), 2, 3, 1, 0, 'high', 'severe allergic reaction to previous dose'),
((SELECT id FROM vaccines WHERE abbreviation = 'PCV13' AND dose_number = 1), 2, 3, 1, 0, 'high', 'severe allergic reaction to previous dose'),
((SELECT id FROM vaccines WHERE abbreviation = 'IPV' AND dose_number = 1), 2, 3, 1, 0, 'high', 'severe allergic reaction to previous dose'),
-- 4 month vaccines
((SELECT id FROM vaccines WHERE abbreviation = 'DTaP' AND dose_number = 2), 4, 5, 2, 60, 'high', 'severe allergic reaction to previous dose'),
((SELECT id FROM vaccines WHERE abbreviation = 'Hib' AND dose_number = 2), 4, 5, 2, 60, 'high', 'severe allergic reaction to previous dose'),
((SELECT id FROM vaccines WHERE abbreviation = 'PCV13' AND dose_number = 2), 4, 5, 2, 60, 'high', 'severe allergic reaction to previous dose'),
((SELECT id FROM vaccines WHERE abbreviation = 'IPV' AND dose_number = 2), 4, 5, 2, 60, 'high', 'severe allergic reaction to previous dose'),
-- 6 month vaccines
((SELECT id FROM vaccines WHERE abbreviation = 'DTaP' AND dose_number = 3), 6, 7, 3, 60, 'high', 'severe allergic reaction to previous dose'),
((SELECT id FROM vaccines WHERE abbreviation = 'Hib' AND dose_number = 3), 6, 7, 3, 60, 'high', 'severe allergic reaction to previous dose'),
((SELECT id FROM vaccines WHERE abbreviation = 'PCV13' AND dose_number = 3), 6, 7, 3, 60, 'high', 'severe allergic reaction to previous dose'),
((SELECT id FROM vaccines WHERE abbreviation = 'IPV' AND dose_number = 3), 6, 7, 3, 60, 'high', 'severe allergic reaction to previous dose'),
-- 12 month vaccines
((SELECT id FROM vaccines WHERE abbreviation = 'MMR' AND dose_number = 1), 12, 15, 1, 0, 'high', 'severe allergic reaction to previous dose; immunocompromised'),
((SELECT id FROM vaccines WHERE abbreviation = 'VAR' AND dose_number = 1), 12, 15, 1, 0, 'high', 'severe allergic reaction to previous dose; immunocompromised'),
((SELECT id FROM vaccines WHERE abbreviation = 'PCV13' AND dose_number = 4), 12, 15, 4, 180, 'high', 'severe allergic reaction to previous dose');