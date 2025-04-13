-- Schema Updates for Nunge Returns Application
-- This script updates the database tables to match our schema definitions

-- ==================== USER MANAGEMENT ====================

-- Update Users Table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Update User Preferences
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS dashboard_layout JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mobile_notifications BOOLEAN DEFAULT true;

-- Add Individual Profiles Table
CREATE TABLE IF NOT EXISTS individual_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    full_name TEXT,
    id_number TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'other')),
    occupation TEXT,
    employer TEXT,
    physical_address TEXT,
    postal_address TEXT,
    county TEXT,
    sub_county TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Business Profiles Table
CREATE TABLE IF NOT EXISTS business_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_email TEXT,
    owner_name TEXT,
    pin_id UUID REFERENCES pins(id),
    business_name TEXT,
    registration_number TEXT,
    business_type TEXT CHECK (business_type IN ('sole_proprietorship', 'partnership', 'limited_company', 'other')),
    industry TEXT,
    registration_date DATE,
    physical_address TEXT,
    postal_address TEXT,
    county TEXT,
    sub_county TEXT,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== SESSION MANAGEMENT ====================

-- Update Sessions Table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS device_info JSONB,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS is_mobile BOOLEAN DEFAULT false;

-- Add Session Steps Table
CREATE TABLE IF NOT EXISTS session_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id),
    step_name TEXT,
    step_data JSONB,
    is_completed BOOLEAN DEFAULT false,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Add Session Activities Table
CREATE TABLE IF NOT EXISTS session_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id),
    activity_type TEXT CHECK (activity_type IN (
        'session_start', 'session_complete', 'session_error', 'form_submit',
        'payment_initiated', 'payment_complete', 'pin_validated',
        'return_submitted', 'return_completed', 'document_uploaded', 'user_action'
    )),
    description TEXT,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== RETURNS MANAGEMENT ====================

-- Update Returns Table
ALTER TABLE returns
ADD COLUMN IF NOT EXISTS session_id UUID,
ADD COLUMN IF NOT EXISTS return_type TEXT CHECK (return_type IN ('individual', 'business', 'corporate')),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS acknowledgment_number TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('unpaid', 'partial', 'paid')) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS amount_due DECIMAL,
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS filing_type TEXT CHECK (filing_type IN ('original', 'amended')) DEFAULT 'original',
ADD COLUMN IF NOT EXISTS amended_return_id UUID REFERENCES returns(id),
ADD COLUMN IF NOT EXISTS is_nil_return BOOLEAN DEFAULT false;

-- Add Return Documents Table
CREATE TABLE IF NOT EXISTS return_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID REFERENCES returns(id),
    document_type TEXT CHECK (document_type IN (
        'p9_form', 'bank_statement', 'payment_receipt',
        'financial_statement', 'supporting_document', 'other'
    )),
    document_name TEXT,
    document_url TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    file_size INTEGER,
    file_type TEXT,
    is_verified BOOLEAN DEFAULT false
);

-- Add Return History Table
CREATE TABLE IF NOT EXISTS return_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID REFERENCES returns(id),
    action TEXT CHECK (action IN (
        'created', 'updated', 'submitted', 'approved',
        'rejected', 'payment_made', 'document_added', 'status_changed'
    )),
    description TEXT,
    performed_by_email TEXT,
    performed_by_name TEXT,
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Add Return Notifications Table
CREATE TABLE IF NOT EXISTS return_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID REFERENCES returns(id),
    recipient_email TEXT,
    recipient_name TEXT,
    notification_type TEXT CHECK (notification_type IN (
        'submission_confirmation', 'processing_update', 'completion_notice',
        'payment_reminder', 'document_request', 'error_notification'
    )),
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== TRANSACTION MANAGEMENT ====================

-- Update Transactions Table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS session_id UUID,
ADD COLUMN IF NOT EXISTS reference_number TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add Transaction Receipts Table
CREATE TABLE IF NOT EXISTS transaction_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id),
    receipt_number TEXT,
    receipt_date TIMESTAMPTZ DEFAULT NOW(),
    receipt_url TEXT,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ
);

-- Add Wallet Table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_email TEXT UNIQUE,
    owner_name TEXT,
    balance DECIMAL DEFAULT 0,
    last_transaction_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Wallet Transactions Table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES wallets(id),
    amount DECIMAL,
    transaction_type TEXT CHECK (transaction_type IN ('deposit', 'withdrawal', 'payment', 'refund')),
    reference_id UUID,
    description TEXT,
    balance_before DECIMAL,
    balance_after DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Payment Verification Table
CREATE TABLE IF NOT EXISTS payment_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id),
    verification_method TEXT CHECK (verification_method IN ('manual', 'automatic', 'callback')),
    verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verified_by_email TEXT,
    verified_by_name TEXT,
    verification_date TIMESTAMPTZ,
    verification_notes TEXT
);

-- ==================== ADMIN DASHBOARD ====================

-- Update User Metrics Table
ALTER TABLE user_metrics
ADD COLUMN IF NOT EXISTS retention_rate DECIMAL;

-- Add Return Metrics Table
CREATE TABLE IF NOT EXISTS return_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE,
    total_returns INTEGER,
    completed_returns INTEGER,
    pending_returns INTEGER,
    error_returns INTEGER,
    average_processing_time DECIMAL,
    started_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Admin Activity Log Table
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_email TEXT,
    admin_name TEXT,
    activity_type TEXT CHECK (activity_type IN (
        'login', 'logout', 'user_management', 'transaction_management',
        'return_management', 'report_generation', 'settings_update',
        'partner_management', 'system_update'
    )),
    description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Add Admin Dashboard Settings Table
CREATE TABLE IF NOT EXISTS admin_dashboard_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_email TEXT UNIQUE,
    admin_name TEXT,
    dashboard_layout JSONB,
    theme TEXT DEFAULT 'light',
    notification_settings JSONB,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Add Admin Reports Table
CREATE TABLE IF NOT EXISTS admin_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_name TEXT,
    report_type TEXT CHECK (report_type IN (
        'user_report', 'transaction_report', 'return_report',
        'financial_report', 'activity_report', 'custom_report'
    )),
    created_by_email TEXT,
    created_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_run TIMESTAMPTZ,
    schedule TEXT CHECK (schedule IN ('one_time', 'daily', 'weekly', 'monthly', 'quarterly')),
    next_run TIMESTAMPTZ,
    report_parameters JSONB,
    report_url TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Add System Status Table
CREATE TABLE IF NOT EXISTS system_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component TEXT CHECK (component IN (
        'web_app', 'api', 'database', 'payment_gateway',
        'kra_integration', 'email_service', 'sms_service', 'file_storage'
    )),
    status TEXT CHECK (status IN ('operational', 'degraded', 'outage')),
    message TEXT,
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    uptime_percentage DECIMAL
);

-- Add Admin Notifications Table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_email TEXT,
    admin_name TEXT,
    notification_type TEXT CHECK (notification_type IN (
        'system_alert', 'new_user', 'new_transaction', 'failed_transaction',
        'new_return', 'return_error', 'kra_status_change'
    )),
    title TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    action_url TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium'
);

-- Add Activity Log Table (for admin dashboard)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT CHECK (type IN (
        'import', 'export', 'create', 'update', 'delete', 'report',
        'filter', 'schedule', 'auth', 'user', 'return', 'transaction',
        'document', 'partner', 'system'
    )),
    title TEXT,
    description TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    status TEXT CHECK (status IN ('success', 'warning', 'error', 'info', 'pending')),
    user_name TEXT,
    user_email TEXT,
    metadata JSONB,
    read BOOLEAN DEFAULT false
);

-- ==================== PARTNER MANAGEMENT ====================

-- Update PINs Table
ALTER TABLE pins
ADD COLUMN IF NOT EXISTS owner_email TEXT,
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS pin_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS pin_type TEXT CHECK (pin_type IN ('A', 'P')),
ADD COLUMN IF NOT EXISTS is_individual BOOLEAN,
ADD COLUMN IF NOT EXISTS business_details JSONB,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update Partners Table
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS physical_address TEXT,
ADD COLUMN IF NOT EXISTS county TEXT,
ADD COLUMN IF NOT EXISTS registration_documents JSONB;

-- Update Partner Transactions Table
ALTER TABLE partner_transactions
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'mpesa', 'wallet'));

-- Add Partner Applications Table
CREATE TABLE IF NOT EXISTS partner_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT,
    name TEXT,
    company_name TEXT,
    partner_type TEXT CHECK (partner_type IN ('cyber', 'university', 'business')),
    business_registration_number TEXT,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    physical_address TEXT,
    county TEXT,
    reason_for_partnership TEXT,
    expected_transaction_volume TEXT,
    website TEXT,
    social_media_links JSONB,
    documents JSONB,
    status TEXT CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected')) DEFAULT 'submitted',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by_email TEXT,
    reviewed_by_name TEXT,
    review_notes TEXT
);

-- Add Partner Payouts Table
CREATE TABLE IF NOT EXISTS partner_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES partners(id),
    amount DECIMAL,
    payout_date TIMESTAMPTZ,
    status TEXT CHECK (status IN ('scheduled', 'processing', 'completed', 'failed')) DEFAULT 'scheduled',
    payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'mpesa', 'wallet')),
    reference_number TEXT,
    transaction_ids JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notes TEXT
);

-- Add Partner Referrals Table
CREATE TABLE IF NOT EXISTS partner_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES partners(id),
    referral_code TEXT,
    referral_url TEXT,
    discount_percent INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0
);

-- Add Partner Users Table
CREATE TABLE IF NOT EXISTS partner_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT,
    name TEXT,
    partner_id UUID REFERENCES partners(id),
    referral_id UUID REFERENCES partner_referrals(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    first_transaction_id UUID,
    first_transaction_date TIMESTAMPTZ,
    lifetime_transaction_value DECIMAL DEFAULT 0,
    transaction_count INTEGER DEFAULT 0
);

-- Add Partner Analytics Table
CREATE TABLE IF NOT EXISTS partner_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES partners(id),
    date DATE,
    new_users INTEGER,
    active_users INTEGER,
    transaction_count INTEGER,
    transaction_value DECIMAL,
    commission_earned DECIMAL,
    conversion_rate DECIMAL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_pins_owner_email ON pins(owner_email);
CREATE INDEX IF NOT EXISTS idx_pins_pin_number ON pins(pin_number);
CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_returns_pin_id ON returns(pin_id);
CREATE INDEX IF NOT EXISTS idx_returns_session_id ON returns(session_id);
CREATE INDEX IF NOT EXISTS idx_transactions_email ON transactions(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_session_id ON transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);
CREATE INDEX IF NOT EXISTS idx_partner_transactions_partner_id ON partner_transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_user_metrics_metric_date ON user_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_transaction_metrics_metric_date ON transaction_metrics(metric_date);

-- Add Return Documents Table
CREATE TABLE IF NOT EXISTS return_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID REFERENCES returns(id),
    document_type TEXT,
    document_name TEXT,
    document_url TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    file_size INTEGER,
    file_type TEXT,
    description TEXT,
    is_verified BOOLEAN DEFAULT false,
    verified_by TEXT,
    verified_at TIMESTAMPTZ,
    metadata JSONB
);

-- Add Return History Table for tracking document and return changes
CREATE TABLE IF NOT EXISTS return_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID REFERENCES returns(id),
    action TEXT,
    description TEXT,
    performed_by_email TEXT,
    performed_by_name TEXT,
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Create indexes for document tables
CREATE INDEX IF NOT EXISTS idx_return_documents_return_id ON return_documents(return_id);
CREATE INDEX IF NOT EXISTS idx_return_documents_document_type ON return_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_return_history_return_id ON return_history(return_id);
CREATE INDEX IF NOT EXISTS idx_return_history_action ON return_history(action);
