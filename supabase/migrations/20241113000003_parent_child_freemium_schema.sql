-- Parent and Child Management with Freemium Model
-- Migration: 20241113000003_parent_child_freemium_schema.sql

-- Create parent subscription plans (freemium model)
CREATE TABLE parent_subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL, -- 0 for free plan
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
    features JSONB NOT NULL DEFAULT '{}',
    max_children INTEGER NOT NULL DEFAULT 1,
    max_reminders INTEGER NOT NULL DEFAULT 5,
    ai_scheduling_enabled BOOLEAN DEFAULT false,
    advanced_notifications BOOLEAN DEFAULT false,
    export_reports BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default parent subscription plans
INSERT INTO parent_subscription_plans (name, description, price_cents, billing_cycle, features, max_children, max_reminders, ai_scheduling_enabled, advanced_notifications, export_reports) VALUES
('Free', 'Basic vaccination tracking for one child', 0, 'monthly', '{"basic_tracking": true, "email_reminders": true}', 1, 5, false, false, false),
('Premium', 'Advanced features for up to 3 children', 999, 'monthly', '{"basic_tracking": true, "email_reminders": true, "sms_reminders": true, "ai_scheduling": true, "export_reports": true}', 3, 20, true, true, true),
('Family', 'Complete features for unlimited children', 1999, 'monthly', '{"basic_tracking": true, "email_reminders": true, "sms_reminders": true, "ai_scheduling": true, "export_reports": true, "priority_support": true}', 10, 50, true, true, true);

-- Create parents table
CREATE TABLE parents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL DEFAULT 'US',
    postal_code VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create parent subscriptions table
CREATE TABLE parent_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES parent_subscription_plans(id),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'cancelled', 'past_due')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create children table
CREATE TABLE children (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    blood_group VARCHAR(10),
    birth_weight_kg DECIMAL(5,2),
    birth_height_cm DECIMAL(5,2),
    allergies TEXT[],
    medical_conditions TEXT[],
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    pediatrician_name VARCHAR(200),
    pediatrician_phone VARCHAR(20),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vaccination schedules table (AI-generated)
CREATE TABLE vaccination_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(200) NOT NULL,
    vaccine_code VARCHAR(50) NOT NULL,
    recommended_age_months INTEGER NOT NULL,
    recommended_age_display VARCHAR(100) NOT NULL,
    due_date DATE NOT NULL,
    min_age_months INTEGER NOT NULL,
    max_age_months INTEGER,
    dose_number INTEGER DEFAULT 1,
    total_doses INTEGER DEFAULT 1,
    is_mandatory BOOLEAN DEFAULT true,
    country_code VARCHAR(2) NOT NULL DEFAULT 'US',
    region_code VARCHAR(10),
    notes TEXT,
    created_by VARCHAR(50) DEFAULT 'AI_SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create parent vaccination records table
CREATE TABLE parent_vaccination_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(200) NOT NULL,
    vaccine_code VARCHAR(50) NOT NULL,
    dose_number INTEGER DEFAULT 1,
    total_doses INTEGER DEFAULT 1,
    vaccination_date DATE NOT NULL,
    age_at_vaccination_months DECIMAL(5,2) NOT NULL,
    provider_name VARCHAR(200),
    provider_phone VARCHAR(20),
    batch_number VARCHAR(100),
    expiration_date DATE,
    site VARCHAR(50),
    route VARCHAR(50),
    side_effects TEXT[],
    notes TEXT,
    documents JSONB DEFAULT '[]',
    is_verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(200),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vaccination reminders table
CREATE TABLE vaccination_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES vaccination_schedules(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('email', 'sms', 'push')),
    days_before_due INTEGER NOT NULL DEFAULT 7,
    scheduled_date DATE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create parent notifications table
CREATE TABLE parent_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vaccination guidelines table (for AI scheduling)
CREATE TABLE vaccination_guidelines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code VARCHAR(2) NOT NULL,
    region_code VARCHAR(10),
    vaccine_name VARCHAR(200) NOT NULL,
    vaccine_code VARCHAR(50) NOT NULL,
    recommended_age_months INTEGER NOT NULL,
    min_age_months INTEGER NOT NULL,
    max_age_months INTEGER,
    dose_number INTEGER DEFAULT 1,
    total_doses INTEGER DEFAULT 1,
    is_mandatory BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    contraindications TEXT[],
    side_effects TEXT[],
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default US vaccination guidelines
INSERT INTO vaccination_guidelines (country_code, vaccine_name, vaccine_code, recommended_age_months, min_age_months, max_age_months, dose_number, total_doses, priority) VALUES
('US', 'Hepatitis B', 'HEP_B', 0, 0, 1, 1, 3, 1),
('US', 'Hepatitis B', 'HEP_B', 2, 1, 3, 2, 3, 1),
('US', 'Hepatitis B', 'HEP_B', 6, 6, 18, 3, 3, 1),
('US', 'DTaP', 'DTaP', 2, 6, 8, 1, 5, 2),
('US', 'DTaP', 'DTaP', 4, 10, 16, 2, 5, 2),
('US', 'DTaP', 'DTaP', 6, 14, 20, 3, 5, 2),
('US', 'DTaP', 'DTaP', 15, 12, 18, 4, 5, 2),
('US', 'DTaP', 'DTaP', 48, 48, 84, 5, 5, 2),
('US', 'Polio', 'IPV', 2, 6, 8, 1, 4, 3),
('US', 'Polio', 'IPV', 4, 10, 16, 2, 4, 3),
('US', 'Polio', 'IPV', 6, 14, 20, 3, 4, 3),
('US', 'Polio', 'IPV', 48, 48, 84, 4, 4, 3),
('US', 'Hib', 'Hib', 2, 6, 8, 1, 4, 4),
('US', 'Hib', 'Hib', 4, 10, 16, 2, 4, 4),
('US', 'Hib', 'Hib', 6, 14, 20, 3, 4, 4),
('US', 'Hib', 'Hib', 12, 12, 18, 4, 4, 4),
('US', 'PCV13', 'PCV13', 2, 6, 8, 1, 4, 5),
('US', 'PCV13', 'PCV13', 4, 10, 16, 2, 4, 5),
('US', 'PCV13', 'PCV13', 6, 14, 20, 3, 4, 5),
('US', 'PCV13', 'PCV13', 12, 12, 18, 4, 4, 5),
('US', 'Rotavirus', 'RV', 2, 6, 8, 1, 3, 6),
('US', 'Rotavirus', 'RV', 4, 10, 16, 2, 3, 6),
('US', 'Rotavirus', 'RV', 6, 14, 24, 3, 3, 6),
('US', 'MMR', 'MMR', 12, 12, 18, 1, 2, 7),
('US', 'MMR', 'MMR', 48, 48, 84, 2, 2, 7),
('US', 'Varicella', 'VAR', 12, 12, 18, 1, 2, 8),
('US', 'Varicella', 'VAR', 48, 48, 84, 2, 2, 8),
('US', 'Hepatitis A', 'HEP_A', 12, 12, 24, 1, 2, 9),
('US', 'Hepatitis A', 'HEP_A', 18, 18, 36, 2, 2, 9);

-- Create parent activity logs table
CREATE TABLE parent_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_parents_email ON parents(email);
CREATE INDEX idx_parents_phone ON parents(phone);
CREATE INDEX idx_children_parent_id ON children(parent_id);
CREATE INDEX idx_children_dob ON children(date_of_birth);
CREATE INDEX idx_vaccination_schedules_child_id ON vaccination_schedules(child_id);
CREATE INDEX idx_vaccination_schedules_due_date ON vaccination_schedules(due_date);
CREATE INDEX idx_vaccination_schedules_country ON vaccination_schedules(country_code);
CREATE INDEX idx_parent_vaccination_records_child_id ON parent_vaccination_records(child_id);
CREATE INDEX idx_vaccination_reminders_child_id ON vaccination_reminders(child_id);
CREATE INDEX idx_vaccination_reminders_scheduled_date ON vaccination_reminders(scheduled_date);
CREATE INDEX idx_parent_notifications_parent_id ON parent_notifications(parent_id);
CREATE INDEX idx_parent_notifications_unread ON parent_notifications(parent_id, is_read) WHERE is_read = false;
CREATE INDEX idx_vaccination_guidelines_country ON vaccination_guidelines(country_code, is_active);
CREATE INDEX idx_parent_activity_logs_parent_id ON parent_activity_logs(parent_id);
CREATE INDEX idx_parent_activity_logs_created_at ON parent_activity_logs(created_at);

-- Enable RLS
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Parents
CREATE POLICY "Parents can view own profile" ON parents FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Parents can update own profile" ON parents FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Parents can insert own profile" ON parents FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for Parent Subscriptions
CREATE POLICY "Parents can view own subscriptions" ON parent_subscriptions FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Parents can update own subscriptions" ON parent_subscriptions FOR UPDATE USING (auth.uid() = parent_id);

-- RLS Policies for Children
CREATE POLICY "Parents can view own children" ON children FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Parents can insert children" ON children FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Parents can update own children" ON children FOR UPDATE USING (auth.uid() = parent_id);
CREATE POLICY "Parents can delete own children" ON children FOR DELETE USING (auth.uid() = parent_id);

-- RLS Policies for Vaccination Schedules
CREATE POLICY "Parents can view own children schedules" ON vaccination_schedules FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM children WHERE children.id = vaccination_schedules.child_id AND children.parent_id = auth.uid()
    )
);
CREATE POLICY "Parents can update own children schedules" ON vaccination_schedules FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM children WHERE children.id = vaccination_schedules.child_id AND children.parent_id = auth.uid()
    )
);

-- RLS Policies for Parent Vaccination Records
CREATE POLICY "Parents can view own children records" ON parent_vaccination_records FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM children WHERE children.id = parent_vaccination_records.child_id AND children.parent_id = auth.uid()
    )
);
CREATE POLICY "Parents can insert children records" ON parent_vaccination_records FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM children WHERE children.id = parent_vaccination_records.child_id AND children.parent_id = auth.uid()
    )
);
CREATE POLICY "Parents can update own children records" ON parent_vaccination_records FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM children WHERE children.id = parent_vaccination_records.child_id AND children.parent_id = auth.uid()
    )
);
CREATE POLICY "Parents can delete own children records" ON parent_vaccination_records FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM children WHERE children.id = parent_vaccination_records.child_id AND children.parent_id = auth.uid()
    )
);

-- RLS Policies for Vaccination Reminders
CREATE POLICY "Parents can view own children reminders" ON vaccination_reminders FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM children WHERE children.id = vaccination_reminders.child_id AND children.parent_id = auth.uid()
    )
);
CREATE POLICY "Parents can update own children reminders" ON vaccination_reminders FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM children WHERE children.id = vaccination_reminders.child_id AND children.parent_id = auth.uid()
    )
);

-- RLS Policies for Parent Notifications
CREATE POLICY "Parents can view own notifications" ON parent_notifications FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Parents can update own notifications" ON parent_notifications FOR UPDATE USING (auth.uid() = parent_id);

-- RLS Policies for Vaccination Guidelines (read-only for all)
CREATE POLICY "Anyone can view active guidelines" ON vaccination_guidelines FOR SELECT USING (is_active = true);

-- RLS Policies for Parent Activity Logs
CREATE POLICY "Parents can view own activity logs" ON parent_activity_logs FOR SELECT USING (auth.uid() = parent_id);

-- Grant permissions to authenticated users
GRANT ALL ON parents TO authenticated;
GRANT ALL ON parent_subscriptions TO authenticated;
GRANT ALL ON children TO authenticated;
GRANT ALL ON vaccination_schedules TO authenticated;
GRANT ALL ON parent_vaccination_records TO authenticated;
GRANT ALL ON vaccination_reminders TO authenticated;
GRANT ALL ON parent_notifications TO authenticated;
GRANT SELECT ON vaccination_guidelines TO authenticated;
GRANT SELECT ON parent_subscription_plans TO authenticated;
GRANT ALL ON parent_activity_logs TO authenticated;

-- Grant SELECT to anon for guidelines
GRANT SELECT ON vaccination_guidelines TO anon;
GRANT SELECT ON parent_subscription_plans TO anon;