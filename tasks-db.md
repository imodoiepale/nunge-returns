# Database Tables Structure

## Authentication & Users

```sql
-- Users Table (Extended Clerk Profile)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users,
    full_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT CHECK (role IN ('user', 'admin', 'partner', 'enterprise')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    theme TEXT DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true
);

-- Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    pin TEXT,
    status TEXT CHECK (status IN ('active', 'completed', 'error')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_step TEXT,
    form_data JSONB,
    error_message TEXT
);
```

## KRA Integration

```sql
-- PIN Management
CREATE TABLE pins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    pin_number TEXT UNIQUE,
    pin_type TEXT CHECK (pin_type IN ('A', 'P')),
    is_individual BOOLEAN,
    business_details JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Returns History
CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id),
    pin_id UUID REFERENCES pins(id),
    status TEXT CHECK (status IN ('pending', 'completed', 'error')),
    submission_date TIMESTAMPTZ,
    return_period TEXT,
    return_data JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW()
);

-- KRA Website Status
CREATE TABLE kra_status (
    id SERIAL PRIMARY KEY,
    status TEXT CHECK (status IN ('up', 'down', 'degraded')),
    response_time INTEGER,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Payment System

```sql
-- Payment Plans
CREATE TABLE payment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    price DECIMAL,
    duration INTEGER,
    features JSONB,
    is_active BOOLEAN DEFAULT true
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES sessions(id),
    amount DECIMAL,
    payment_method TEXT,
    mpesa_code TEXT,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE,
    discount_percent INTEGER,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);
```

## Partner System

```sql
-- Partners
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    company_name TEXT,
    partner_type TEXT CHECK (partner_type IN ('cyber', 'university', 'business')),
    commission_rate DECIMAL,
    status TEXT CHECK (status IN ('active', 'pending', 'inactive')),
    started_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner Transactions
CREATE TABLE partner_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES partners(id),
    transaction_id UUID REFERENCES transactions(id),
    commission_amount DECIMAL,
    status TEXT CHECK (status IN ('pending', 'paid')),
    started_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Enterprise Management

```sql
-- Enterprise Requests
CREATE TABLE enterprise_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    company_size TEXT,
    country TEXT,
    timezone TEXT,
    referral_source TEXT,
    additional_details TEXT,
    status TEXT CHECK (status IN ('new', 'contacted', 'converted', 'rejected')),
    started_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Analytics & Metrics

```sql
-- User Metrics
CREATE TABLE user_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE,
    total_users INTEGER,
    active_users INTEGER,
    new_users INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction Metrics
CREATE TABLE transaction_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE,
    total_amount DECIMAL,
    transaction_count INTEGER,
    success_rate DECIMAL,
    started_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Blockchain Integration

```sql
-- Blockchain Transactions
CREATE TABLE blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id),
    transaction_hash TEXT,
    block_number BIGINT,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'failed')),
    started_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Pro User Management

```sql
-- Pro User Subscriptions
CREATE TABLE pro_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    plan_id UUID REFERENCES payment_plans(id),
    status TEXT CHECK (status IN ('active', 'expired', 'cancelled')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT true
);

-- Pro User Dashboard Settings
CREATE TABLE pro_dashboard_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    dashboard_layout JSONB,
    favorite_pins TEXT[],
    notification_preferences JSONB,
    custom_widgets JSONB
);

-- Pro User Returns History
CREATE TABLE pro_returns_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    pin_id UUID REFERENCES pins(id),
    return_type TEXT,
    filing_date TIMESTAMPTZ,
    status TEXT CHECK (status IN ('pending', 'completed', 'error')),
    details JSONB,
    notes TEXT
);

-- Pro User Analytics
CREATE TABLE pro_user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    metric_date DATE,
    returns_filed INTEGER,
    successful_returns INTEGER,
    average_processing_time INTEGER,
    total_amount_paid DECIMAL,
    started_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pro User Scheduled Returns
CREATE TABLE pro_scheduled_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    pin_id UUID REFERENCES pins(id),
    schedule_type TEXT CHECK (schedule_type IN ('monthly', 'quarterly', 'annually')),
    next_filing_date TIMESTAMPTZ,
    last_filed_date TIMESTAMPTZ,
    status TEXT CHECK (status IN ('active', 'paused', 'completed')),
    configuration JSONB
);
