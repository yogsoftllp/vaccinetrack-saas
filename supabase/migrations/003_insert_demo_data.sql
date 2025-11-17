-- Insert demo clinic
INSERT INTO clinics (name, address, phone, email, license_number) VALUES 
('Demo Pediatric Clinic', '123 Medical Center Dr, Healthcare City, HC 12345', '+1-555-0123', 'admin@democlinic.com', 'DEMO-CLINIC-001')
ON CONFLICT DO NOTHING;

-- Insert demo users with different roles
INSERT INTO users (id, email, role, first_name, last_name, license_number, clinic_id, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'doctor@clinic.com', 'pediatrician', 'Sarah', 'Johnson', 'MD-12345', (SELECT id FROM clinics WHERE name = 'Demo Pediatric Clinic'), true),
('550e8400-e29b-41d4-a716-446655440002', 'nurse@clinic.com', 'nurse', 'Michael', 'Brown', 'RN-67890', (SELECT id FROM clinics WHERE name = 'Demo Pediatric Clinic'), true),
('550e8400-e29b-41d4-a716-446655440003', 'admin@clinic.com', 'administrator', 'Jennifer', 'Davis', 'ADMIN-11111', (SELECT id FROM clinics WHERE name = 'Demo Pediatric Clinic'), true),
('550e8400-e29b-41d4-a716-446655440004', 'receptionist@clinic.com', 'receptionist', 'Emily', 'Wilson', 'REC-22222', (SELECT id FROM clinics WHERE name = 'Demo Pediatric Clinic'), true)
ON CONFLICT (id) DO NOTHING;

-- Insert demo patients
INSERT INTO patients (clinic_id, first_name, last_name, date_of_birth, gender, parent_name, parent_phone, parent_email, address, insurance_id, medical_record_number) VALUES 
((SELECT id FROM clinics WHERE name = 'Demo Pediatric Clinic'), 'Emma', 'Johnson', '2023-01-15', 'female', 'Sarah Johnson', '+1-555-1234', 'sarah.j@email.com', '456 Oak St, Healthcare City, HC 12345', 'INS-001234', 'MRN-000001'),
((SELECT id FROM clinics WHERE name = 'Demo Pediatric Clinic'), 'Liam', 'Smith', '2023-03-20', 'male', 'Jessica Smith', '+1-555-5678', 'jessica.s@email.com', '789 Pine St, Healthcare City, HC 12345', 'INS-002345', 'MRN-000002'),
((SELECT id FROM clinics WHERE name = 'Demo Pediatric Clinic'), 'Olivia', 'Davis', '2023-02-10', 'female', 'Maria Davis', '+1-555-9012', 'maria.d@email.com', '321 Elm St, Healthcare City, HC 12345', 'INS-003456', 'MRN-000003'),
((SELECT id FROM clinics WHERE name = 'Demo Pediatric Clinic'), 'Noah', 'Wilson', '2023-04-05', 'male', 'David Wilson', '+1-555-3456', 'david.w@email.com', '654 Maple St, Healthcare City, HC 12345', 'INS-004567', 'MRN-000004')
ON CONFLICT (medical_record_number) DO NOTHING;

-- Insert demo inventory
INSERT INTO inventory (vaccine_id, lot_number, quantity_on_hand, expiration_date, unit_cost, storage_location, reorder_level, clinic_id) VALUES 
((SELECT id FROM vaccines WHERE abbreviation = 'HepB' AND dose_number = 1), 'LOT-2024-001', 50, '2025-06-30', 25.50, 'Refrigerator A1', 10, (SELECT id FROM clinics WHERE name = 'Demo Pediatric Clinic')),
((SELECT id FROM vaccines WHERE abbreviation = 'DTaP' AND dose_number = 1), 'LOT-2024-002', 30, '2025-08-15', 35.75, 'Refrigerator A2', 5, (SELECT id FROM clinics WHERE name = 'Demo Pediatric Clinic')),
((SELECT id FROM vaccines WHERE abbreviation = 'Hib' AND dose_number = 1), 'LOT-2024-003', 25, '2025-07-20', 28.90, 'Refrigerator B1', 5, (SELECT id FROM clinics WHERE name = 'Demo Pediatric Clinic')),
((SELECT id FROM vaccines WHERE abbreviation = 'PCV13' AND dose_number = 1), 'LOT-2024-004', 20, '2025-09-10', 45.25, 'Refrigerator B2', 5, (SELECT id FROM clinics WHERE name = 'Demo Pediatric Clinic'))
ON CONFLICT DO NOTHING;

-- Insert demo appointments
INSERT INTO appointments (patient_id, provider_id, appointment_date, appointment_time, duration_minutes, appointment_type, status, notes) VALUES 
((SELECT id FROM patients WHERE medical_record_number = 'MRN-000001'), (SELECT id FROM users WHERE email = 'doctor@clinic.com'), CURRENT_DATE + INTERVAL '1 day', '10:00:00', 30, 'vaccination', 'scheduled', '2-month vaccines due'),
((SELECT id FROM patients WHERE medical_record_number = 'MRN-000002'), (SELECT id FROM users WHERE email = 'doctor@clinic.com'), CURRENT_DATE + INTERVAL '2 days', '14:30:00', 30, 'vaccination', 'scheduled', 'Follow-up vaccination'),
((SELECT id FROM patients WHERE medical_record_number = 'MRN-000003'), (SELECT id FROM users WHERE email = 'doctor@clinic.com'), CURRENT_DATE, '09:30:00', 30, 'consultation', 'completed', 'Well-baby check'),
((SELECT id FROM patients WHERE medical_record_number = 'MRN-000004'), (SELECT id FROM users WHERE email = 'doctor@clinic.com'), CURRENT_DATE + INTERVAL '3 days', '11:00:00', 30, 'vaccination', 'scheduled', 'First vaccination series')
ON CONFLICT DO NOTHING;

-- Insert demo medical history
INSERT INTO medical_history (patient_id, condition_type, condition_name, diagnosis_date, severity, is_active, notes) VALUES 
((SELECT id FROM patients WHERE medical_record_number = 'MRN-000001'), 'allergy', 'Egg allergy', '2023-01-20', 'mild', true, 'Monitor for vaccine reactions'),
((SELECT id FROM patients WHERE medical_record_number = 'MRN-000002'), 'chronic', 'Asthma', '2023-04-01', 'moderate', true, 'Use caution with certain vaccines'),
((SELECT id FROM patients WHERE medical_record_number = 'MRN-000003'), 'developmental', 'Speech delay', '2023-08-01', 'mild', true, 'Early intervention recommended')
ON CONFLICT DO NOTHING;