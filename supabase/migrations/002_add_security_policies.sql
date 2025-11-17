-- Enable Row Level Security (RLS) on all tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_recommendations ENABLE ROW LEVEL SECURITY;

-- Create function to get current clinic ID
CREATE OR REPLACE FUNCTION current_clinic_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.clinic_id', true), '');
EXCEPTION
    WHEN undefined_object THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clinics policies
CREATE POLICY "Anyone can view clinics" ON clinics
    FOR SELECT USING (true);

CREATE POLICY "Administrators can manage clinics" ON clinics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view users in their clinic" ON users
    FOR SELECT USING (
        clinic_id = (
            SELECT clinic_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Administrators can manage users in their clinic" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
            AND clinic_id = users.clinic_id
        )
    );

-- Patients policies
CREATE POLICY "Clinic staff can view patients in their clinic" ON patients
    FOR SELECT USING (
        clinic_id = (
            SELECT clinic_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Clinic staff can create patients in their clinic" ON patients
    FOR INSERT WITH CHECK (
        clinic_id = (
            SELECT clinic_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Clinic staff can update patients in their clinic" ON patients
    FOR UPDATE USING (
        clinic_id = (
            SELECT clinic_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Clinic staff can delete patients in their clinic" ON patients
    FOR DELETE USING (
        clinic_id = (
            SELECT clinic_id FROM users WHERE id = auth.uid()
        )
    );

-- Vaccines policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view vaccines" ON vaccines
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Vaccinations policies
CREATE POLICY "Clinic staff can view vaccinations for their patients" ON vaccinations
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM patients 
            WHERE clinic_id = (
                SELECT clinic_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Pediatricians and nurses can create vaccinations" ON vaccinations
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role IN ('pediatrician', 'nurse')
            AND clinic_id = (
                SELECT clinic_id FROM patients WHERE id = patient_id
            )
        )
    );

CREATE POLICY "Pediatricians and nurses can update vaccinations" ON vaccinations
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role IN ('pediatrician', 'nurse')
            AND clinic_id = (
                SELECT clinic_id FROM patients WHERE id = patient_id
            )
        )
    );

-- Appointments policies
CREATE POLICY "Clinic staff can view appointments for their patients" ON appointments
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM patients 
            WHERE clinic_id = (
                SELECT clinic_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Clinic staff can create appointments" ON appointments
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role IN ('pediatrician', 'nurse', 'receptionist')
            AND clinic_id = (
                SELECT clinic_id FROM patients WHERE id = patient_id
            )
        )
    );

CREATE POLICY "Clinic staff can update appointments" ON appointments
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role IN ('pediatrician', 'nurse', 'receptionist')
            AND clinic_id = (
                SELECT clinic_id FROM patients WHERE id = patient_id
            )
        )
    );

-- Inventory policies
CREATE POLICY "Clinic staff can view inventory in their clinic" ON inventory
    FOR SELECT USING (
        clinic_id = (
            SELECT clinic_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Nurses and administrators can manage inventory" ON inventory
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role IN ('nurse', 'administrator')
            AND clinic_id = inventory.clinic_id
        )
    );

-- Medical history policies
CREATE POLICY "Clinic staff can view medical history for their patients" ON medical_history
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM patients 
            WHERE clinic_id = (
                SELECT clinic_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Clinic staff can manage medical history for their patients" ON medical_history
    FOR ALL USING (
        patient_id IN (
            SELECT id FROM patients 
            WHERE clinic_id = (
                SELECT clinic_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Schedule recommendations policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view schedule recommendations" ON schedule_recommendations
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Grant basic permissions to anon and authenticated roles
GRANT SELECT ON clinics TO anon;
GRANT ALL ON clinics TO authenticated;

GRANT SELECT ON users TO anon;
GRANT ALL ON users TO authenticated;

GRANT SELECT ON patients TO anon;
GRANT ALL ON patients TO authenticated;

GRANT SELECT ON vaccines TO anon;
GRANT ALL ON vaccines TO authenticated;

GRANT SELECT ON vaccinations TO anon;
GRANT ALL ON vaccinations TO authenticated;

GRANT SELECT ON appointments TO anon;
GRANT ALL ON appointments TO authenticated;

GRANT SELECT ON inventory TO anon;
GRANT ALL ON inventory TO authenticated;

GRANT SELECT ON medical_history TO anon;
GRANT ALL ON medical_history TO authenticated;

GRANT SELECT ON schedule_recommendations TO anon;
GRANT ALL ON schedule_recommendations TO authenticated;