-- Phase 3: Content Management & AI Assistant Tables

-- Notices Table
CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('academic', 'administrative', 'event', 'emergency', 'general')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    version INTEGER DEFAULT 1,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_notices_status_created ON notices(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_category ON notices(category);
CREATE INDEX IF NOT EXISTS idx_notices_expires ON notices(expires_at);
CREATE INDEX IF NOT EXISTS idx_notices_created_by ON notices(created_by);

-- Full-text search index for notices
CREATE INDEX IF NOT EXISTS idx_notices_title_content_fts ON notices USING gin(to_tsvector('english', title || ' ' || content));

-- Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('computer', 'projector', 'furniture', 'lab_equipment', 'audio_visual')),
    location VARCHAR(200),
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'retired')),
    maintenance_schedule TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    version INTEGER DEFAULT 1,
    created_by UUID,
    updated_by UUID,
    status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON equipment(location);
CREATE INDEX IF NOT EXISTS idx_equipment_type_status ON equipment(type, status);
CREATE INDEX IF NOT EXISTS idx_equipment_created_by ON equipment(created_by);

-- AI Queries Table
CREATE TABLE IF NOT EXISTS ai_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text TEXT NOT NULL,
    session_id UUID,
    user_id UUID NOT NULL,
    response_text TEXT,
    context_sources JSONB,
    confidence FLOAT,
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_queries_user ON ai_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_queries_created ON ai_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_queries_session ON ai_queries(session_id);

-- Full-text search index for AI queries
CREATE INDEX IF NOT EXISTS idx_ai_queries_text_fts ON ai_queries USING gin(to_tsvector('english', query_text));

-- AI Feedback Table
CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID NOT NULL REFERENCES ai_queries(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_query ON ai_feedback(query_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON ai_feedback(rating);

-- Notice State History
CREATE TABLE IF NOT EXISTS notice_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
    from_state VARCHAR(50),
    to_state VARCHAR(50) NOT NULL,
    trigger_name VARCHAR(50),
    user_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notice_state_notice ON notice_state_history(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_state_created ON notice_state_history(created_at);

-- Equipment State History
CREATE TABLE IF NOT EXISTS equipment_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    from_state VARCHAR(50),
    to_state VARCHAR(50) NOT NULL,
    trigger_name VARCHAR(50),
    user_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_state_equipment ON equipment_state_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_state_created ON equipment_state_history(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_notices_modtime
    BEFORE UPDATE ON notices
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_equipment_modtime
    BEFORE UPDATE ON equipment
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Cleanup function for old records
CREATE OR REPLACE FUNCTION cleanup_old_records()
RETURNS void AS $$
BEGIN
    DELETE FROM ai_queries
    WHERE created_at < NOW() - INTERVAL '90 days';

    DELETE FROM ai_feedback
    WHERE created_at < NOW() - INTERVAL '90 days';

    DELETE FROM notice_state_history
    WHERE created_at < NOW() - INTERVAL '1 year';

    DELETE FROM equipment_state_history
    WHERE created_at < NOW() - INTERVAL '1 year';

    DELETE FROM notices
    WHERE status = 'deleted' AND deleted_at < NOW() - INTERVAL '30 days';

    DELETE FROM equipment
    WHERE status = 'retired' AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- View for active notices
CREATE OR REPLACE VIEW v_active_notices AS
SELECT id, title, content, category, priority, status, expires_at, created_at
FROM notices
WHERE status = 'published'
AND (expires_at IS NULL OR expires_at > NOW());

-- View for equipment summary
CREATE OR REPLACE VIEW v_equipment_summary AS
SELECT
    type,
    status,
    COUNT(*) as count
FROM equipment
WHERE status != 'retired'
GROUP BY type, status;
