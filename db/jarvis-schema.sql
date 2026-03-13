-- ============================================================
-- JARVIS SYSTEM SCHEMA — Nunge Returns
-- AI Agents, WhatsApp Bot, Ticketing, Security, Autonomous Ops
-- ============================================================

-- ==================== AI CONVERSATIONS ====================

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'web', 'api')),
    external_id TEXT, -- WhatsApp phone number or web session ID
    user_name TEXT,
    user_email TEXT,
    user_phone TEXT,
    model_used TEXT, -- gemini-2.0-flash, gpt-4o, etc.
    messages JSONB DEFAULT '[]'::jsonb,
    context_summary TEXT, -- compressed context for long conversations
    token_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'escalated')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_channel ON ai_conversations(channel);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_external_id ON ai_conversations(external_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON ai_conversations(status);

-- ==================== AI TASKS ====================

CREATE TABLE IF NOT EXISTS ai_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES ai_conversations(id),
    parent_task_id UUID REFERENCES ai_tasks(id),
    agent_type TEXT NOT NULL, -- orchestrator, kra-filing, kra-pin, kra-account, payment, ticketing, security, devops, nssf, shif
    task_type TEXT NOT NULL, -- file_nil_return, batch_file, terminate_obligation, reset_password, etc.
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'assigned', 'in_progress', 'waiting', 'completed', 'failed', 'dead_letter')),
    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    dependencies UUID[] DEFAULT '{}', -- task IDs that must complete first
    assigned_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_agent_type ON ai_tasks(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_priority ON ai_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_conversation_id ON ai_tasks(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_parent_task_id ON ai_tasks(parent_task_id);

-- ==================== AI TASK LOGS ====================

CREATE TABLE IF NOT EXISTS ai_task_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES ai_tasks(id) ON DELETE CASCADE,
    log_level TEXT DEFAULT 'info' CHECK (log_level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_task_logs_task_id ON ai_task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_task_logs_level ON ai_task_logs(log_level);

-- ==================== TICKETS ====================

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES ai_conversations(id),
    task_id UUID REFERENCES ai_tasks(id),
    ticket_number TEXT UNIQUE, -- TKT-000001 format
    category TEXT NOT NULL CHECK (category IN ('billing', 'technical', 'service', 'account', 'general', 'bug', 'feature_request')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'waiting_agent', 'escalated', 'resolved', 'closed')),
    subject TEXT NOT NULL,
    description TEXT,
    requester_name TEXT,
    requester_email TEXT,
    requester_phone TEXT,
    assigned_to TEXT, -- agent type or human agent email
    escalation_level INTEGER DEFAULT 0, -- 0=AI, 1=Senior AI, 2=Human, 3=Admin
    sla_response_deadline TIMESTAMPTZ,
    sla_resolution_deadline TIMESTAMPTZ,
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_requester_phone ON tickets(requester_phone);

-- ==================== TICKET MESSAGES ====================

CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'ai_agent', 'human_agent', 'system')),
    sender_name TEXT,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_internal BOOLEAN DEFAULT false, -- internal notes not visible to customer
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

-- ==================== WHATSAPP SESSIONS ====================

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT NOT NULL,
    conversation_id UUID REFERENCES ai_conversations(id),
    current_state TEXT DEFAULT 'greeting' CHECK (current_state IN (
        'greeting', 'service_selection', 'data_collection',
        'pin_collection', 'password_collection', 'obligation_selection',
        'payment', 'processing', 'delivery', 'support',
        'status_check', 'idle', 'terminated'
    )),
    service_type TEXT, -- nil_returns_individual, nil_returns_company, terminate_obligation, password_reset, email_change, pin_registration, nssf, shif
    collected_data JSONB DEFAULT '{}'::jsonb, -- KRA PIN, password, selected obligations, etc.
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded')),
    payment_reference TEXT,
    task_id UUID REFERENCES ai_tasks(id),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    timeout_at TIMESTAMPTZ, -- auto-expire session after inactivity
    message_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone ON whatsapp_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_state ON whatsapp_sessions(current_state);
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_sessions_active ON whatsapp_sessions(phone_number) WHERE current_state NOT IN ('terminated', 'idle');

-- ==================== SECURITY EVENTS ====================

CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'prompt_injection', 'rate_limit_exceeded', 'auth_failure',
        'suspicious_request', 'data_access', 'encryption_operation',
        'api_abuse', 'brute_force', 'xss_attempt', 'sql_injection',
        'token_expired', 'unauthorized_access', 'config_change'
    )),
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    source_ip TEXT,
    source_phone TEXT,
    user_agent TEXT,
    endpoint TEXT,
    request_body_hash TEXT, -- SHA-256 hash, not raw body
    details TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_source_ip ON security_events(source_ip);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

-- ==================== SYSTEM HEALTH LOGS ====================

CREATE TABLE IF NOT EXISTS system_health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component TEXT NOT NULL CHECK (component IN (
        'next_app', 'supabase', 'kra_portal', 'evolution_api',
        'gemini_api', 'openai_api', 'mpesa', 'redis',
        'playwright', 'mcp_kra', 'mcp_payment', 'mcp_ticketing', 'mcp_system'
    )),
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down', 'unknown')),
    response_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_health_component ON system_health_logs(component);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON system_health_logs(status);
CREATE INDEX IF NOT EXISTS idx_system_health_checked_at ON system_health_logs(checked_at);

-- ==================== MCP TOOL EXECUTIONS ====================

CREATE TABLE IF NOT EXISTS mcp_tool_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_name TEXT NOT NULL, -- kra-mcp, payment-mcp, ticketing-mcp, system-mcp
    tool_name TEXT NOT NULL,
    task_id UUID REFERENCES ai_tasks(id),
    conversation_id UUID REFERENCES ai_conversations(id),
    input_params JSONB DEFAULT '{}'::jsonb,
    output_result JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'error')),
    execution_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mcp_executions_server ON mcp_tool_executions(server_name);
CREATE INDEX IF NOT EXISTS idx_mcp_executions_tool ON mcp_tool_executions(tool_name);
CREATE INDEX IF NOT EXISTS idx_mcp_executions_task ON mcp_tool_executions(task_id);

-- ==================== AGENT METRICS ====================

CREATE TABLE IF NOT EXISTS agent_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_type TEXT NOT NULL,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tasks_completed INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,
    avg_execution_time_ms INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    model_used TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_type ON agent_metrics(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_date ON agent_metrics(metric_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_metrics_unique ON agent_metrics(agent_type, metric_date, model_used);

-- ==================== TICKET NUMBER SEQUENCE ====================

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START WITH 1;

-- Function to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number := 'TKT-' || LPAD(nextval('ticket_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set ticket number
DROP TRIGGER IF EXISTS set_ticket_number ON tickets;
CREATE TRIGGER set_ticket_number
    BEFORE INSERT ON tickets
    FOR EACH ROW
    WHEN (NEW.ticket_number IS NULL)
    EXECUTE FUNCTION generate_ticket_number();

-- ==================== UPDATED_AT TRIGGERS ====================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_tasks_updated_at ON ai_tasks;
CREATE TRIGGER update_ai_tasks_updated_at
    BEFORE UPDATE ON ai_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_sessions_updated_at ON whatsapp_sessions;
CREATE TRIGGER update_whatsapp_sessions_updated_at
    BEFORE UPDATE ON whatsapp_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by backend)
CREATE POLICY IF NOT EXISTS "Service role full access on ai_conversations"
    ON ai_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role full access on ai_tasks"
    ON ai_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role full access on tickets"
    ON tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role full access on whatsapp_sessions"
    ON whatsapp_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role full access on security_events"
    ON security_events FOR ALL USING (true) WITH CHECK (true);

-- ==================== VIEWS ====================

-- Active tasks view
CREATE OR REPLACE VIEW active_tasks AS
SELECT
    t.id, t.agent_type, t.task_type, t.priority, t.status,
    t.retry_count, t.created_at, t.assigned_at, t.started_at,
    c.channel, c.external_id as requester_id
FROM ai_tasks t
LEFT JOIN ai_conversations c ON t.conversation_id = c.id
WHERE t.status IN ('queued', 'assigned', 'in_progress', 'waiting');

-- Open tickets view
CREATE OR REPLACE VIEW open_tickets AS
SELECT
    t.id, t.ticket_number, t.category, t.priority, t.status,
    t.subject, t.requester_name, t.requester_phone,
    t.escalation_level, t.sla_response_deadline,
    t.created_at, t.first_response_at,
    COUNT(tm.id) as message_count
FROM tickets t
LEFT JOIN ticket_messages tm ON tm.ticket_id = t.id
WHERE t.status NOT IN ('resolved', 'closed')
GROUP BY t.id;

-- System health summary
CREATE OR REPLACE VIEW system_health_summary AS
SELECT DISTINCT ON (component)
    component, status, response_time_ms, error_message, checked_at
FROM system_health_logs
ORDER BY component, checked_at DESC;

-- Agent performance summary
CREATE OR REPLACE VIEW agent_performance AS
SELECT
    agent_type,
    SUM(tasks_completed) as total_completed,
    SUM(tasks_failed) as total_failed,
    ROUND(AVG(avg_execution_time_ms)) as avg_time_ms,
    ROUND(AVG(success_rate), 2) as avg_success_rate,
    SUM(total_tokens_used) as total_tokens
FROM agent_metrics
WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY agent_type;
