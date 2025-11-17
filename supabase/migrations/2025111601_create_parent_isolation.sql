-- Create parent users table (separate from clinic users)
CREATE TABLE parent_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    phone VARCHAR,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create parent subscription plans (different from clinic plans)
CREATE TABLE parent_subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    price_monthly NUMERIC NOT NULL,
    price_yearly NUMERIC NOT NULL,
    features JSONB DEFAULT '{}',
    max_children INTEGER DEFAULT 1,
    max_notifications_per_month INTEGER DEFAULT 50,
    includes_sms BOOLEAN DEFAULT FALSE,
    includes_email BOOLEAN DEFAULT TRUE,
    includes_push BOOLEAN DEFAULT TRUE,
    storage_gb INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    stripe_product_id VARCHAR,
    stripe_price_monthly_id VARCHAR,
    stripe_price_yearly_id VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create parent subscriptions table
CREATE TABLE parent_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_user_id UUID NOT NULL REFERENCES parent_users(id),
    plan_id UUID NOT NULL REFERENCES parent_subscription_plans(id),
    status VARCHAR CHECK (status IN ('active', 'trial', 'cancelled', 'expired', 'suspended')) DEFAULT 'trial',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR,
    stripe_subscription_id VARCHAR,
    stripe_payment_method_id VARCHAR,
    auto_renew BOOLEAN DEFAULT TRUE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_user_id)
);

-- Create children table for parents
CREATE TABLE parent_children (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_user_id UUID NOT NULL REFERENCES parent_users(id),
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR CHECK (gender IN ('male', 'female', 'other')),
    medical_record_number VARCHAR,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vaccination reminders table
CREATE TABLE vaccination_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_user_id UUID NOT NULL REFERENCES parent_users(id),
    child_id UUID NOT NULL REFERENCES parent_children(id),
    vaccine_name VARCHAR NOT NULL,
    scheduled_date DATE NOT NULL,
    reminder_type VARCHAR CHECK (reminder_type IN ('email', 'sms', 'push', 'in_app')) DEFAULT 'email',
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    notification_message TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create parent notification preferences
CREATE TABLE parent_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_user_id UUID NOT NULL REFERENCES parent_users(id),
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,
    reminder_days_before INTEGER DEFAULT 7,
    reminder_time TIME DEFAULT '09:00:00',
    timezone VARCHAR DEFAULT 'UTC',
    language VARCHAR DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_user_id)
);

-- Create parent activity logs
CREATE TABLE parent_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_user_id UUID NOT NULL REFERENCES parent_users(id),
    action VARCHAR NOT NULL,
    resource_type VARCHAR,
    resource_id VARCHAR,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for all parent tables
ALTER TABLE parent_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for parent isolation
CREATE POLICY "Parents can only see their own data" ON parent_users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Anyone can view active subscription plans" ON parent_subscription_plans
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Parents can only see their own subscriptions" ON parent_subscriptions
    FOR ALL USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can only see their own children" ON parent_children
    FOR ALL USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can only see their own reminders" ON vaccination_reminders
    FOR ALL USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can only see their own notification preferences" ON parent_notification_preferences
    FOR ALL USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can only see their own activity logs" ON parent_activity_logs
    FOR SELECT USING (parent_user_id = auth.uid());

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON parent_users TO anon, authenticated;
GRANT INSERT ON parent_users TO anon, authenticated;
GRANT UPDATE ON parent_users TO authenticated;
GRANT DELETE ON parent_users TO authenticated;

GRANT SELECT ON parent_subscription_plans TO anon, authenticated;

GRANT SELECT ON parent_subscriptions TO anon, authenticated;
GRANT INSERT ON parent_subscriptions TO authenticated;
GRANT UPDATE ON parent_subscriptions TO authenticated;

GRANT SELECT ON parent_children TO anon, authenticated;
GRANT INSERT ON parent_children TO authenticated;
GRANT UPDATE ON parent_children TO authenticated;
GRANT DELETE ON parent_children TO authenticated;

GRANT SELECT ON vaccination_reminders TO anon, authenticated;
GRANT INSERT ON vaccination_reminders TO authenticated;
GRANT UPDATE ON vaccination_reminders TO authenticated;
GRANT DELETE ON vaccination_reminders TO authenticated;

GRANT SELECT ON parent_notification_preferences TO anon, authenticated;
GRANT INSERT ON parent_notification_preferences TO authenticated;
GRANT UPDATE ON parent_notification_preferences TO authenticated;

GRANT SELECT ON parent_activity_logs TO anon, authenticated;
GRANT INSERT ON parent_activity_logs TO authenticated;

-- Insert default parent subscription plans
INSERT INTO parent_subscription_plans (
    name, description, price_monthly, price_yearly, features,
    max_children, max_notifications_per_month, includes_sms, includes_email, includes_push,
    storage_gb, stripe_product_id
) VALUES 
(
    'Free Plan',
    'Perfect for parents with one child. Basic vaccination reminders via email.',
    0.00, 0.00,
    '{"basic_reminders": true, "email_notifications": true, "vaccination_schedule": true}',
    1, 20, false, true, false,
    1, 'prod_free_parent'
),
(
    'Pro Plan',
    'For growing families. Multiple children, SMS notifications, and priority support.',
    9.99, 99.99,
    '{"basic_reminders": true, "email_notifications": true, "sms_notifications": true, "push_notifications": true, "vaccination_schedule": true, "priority_support": true}',
    5, 200, true, true, true,
    10, 'prod_pro_parent'
),
(
    'Family Plus',
    'Complete family protection. Unlimited children, all notification types, and premium features.',
    19.99, 199.99,
    '{"basic_reminders": true, "email_notifications": true, "sms_notifications": true, "push_notifications": true, "vaccination_schedule": true, "priority_support": true, "premium_features": true, "custom_schedules": true}',
    999, 999, true, true, true,
    50, 'prod_family_plus'
);