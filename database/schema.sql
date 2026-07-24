-- ============================================================================
-- Sentinel-Sync: The Adaptive Campus Intelligence Hub
-- Phase 1: Database Schema Definition
-- Version: v1.0
-- Date: 2026-07-24
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE users (
    user_id SERIAL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- Primary Key Constraint
    CONSTRAINT pk_users PRIMARY KEY (user_id),

    -- Unique Constraint (Email must be unique)
    CONSTRAINT uk_users_email UNIQUE (email),

    -- Check Constraints
    CONSTRAINT ck_users_email_format CHECK (
        email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT ck_users_name_length CHECK (LENGTH(name) >= 2),
    CONSTRAINT ck_users_password_hash_length CHECK (LENGTH(password_hash) >= 8)
);

-- Index for email lookups
CREATE INDEX idx_users_email ON users(email);


-- ============================================================================
-- 2. CAMPUS_SERVICES TABLE
-- ============================================================================
CREATE TABLE campus_services (
    item_id SERIAL,
    service_name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    last_updated_by INTEGER,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quantity_available INTEGER DEFAULT 0,
    location VARCHAR(100),

    -- Primary Key Constraint
    CONSTRAINT pk_campus_services PRIMARY KEY (item_id),

    -- Foreign Key Constraint (Referential Integrity)
    CONSTRAINT fk_campus_services_last_updated_by
        FOREIGN KEY (last_updated_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    -- Check Constraints
    CONSTRAINT ck_campus_services_status CHECK (
        status IN ('Available', 'Low Stock', 'Maintenance', 'Out of Service')
    ),
    CONSTRAINT ck_campus_services_service_type CHECK (
        service_type IN ('Lab', 'Food', 'Library', 'Transport', 'Other')
    ),
    CONSTRAINT ck_campus_services_quantity CHECK (quantity_available >= 0),
    CONSTRAINT ck_campus_services_service_name_length CHECK (LENGTH(service_name) >= 3)
);

-- Indexes for performance optimization
CREATE INDEX idx_campus_services_service_name ON campus_services(service_name);
CREATE INDEX idx_campus_services_status ON campus_services(status);
CREATE INDEX idx_campus_services_service_type ON campus_services(service_type);
CREATE INDEX idx_campus_services_last_updated_by ON campus_services(last_updated_by);


-- ============================================================================
-- 3. SERVICE_LOGS TABLE (Audit Trail)
-- ============================================================================
CREATE TABLE service_logs (
    log_id SERIAL,
    item_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    action_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Primary Key Constraint
    CONSTRAINT pk_service_logs PRIMARY KEY (log_id),

    -- Foreign Key Constraints (Referential Integrity)
    CONSTRAINT fk_service_logs_item_id
        FOREIGN KEY (item_id)
        REFERENCES campus_services(item_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_service_logs_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    -- Check Constraints
    CONSTRAINT ck_service_logs_action_type CHECK (
        action_type IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'RESTOCK')
    ),
    CONSTRAINT ck_service_logs_old_status CHECK (
        old_status IS NULL OR
        old_status IN ('Available', 'Low Stock', 'Maintenance', 'Out of Service')
    ),
    CONSTRAINT ck_service_logs_new_status CHECK (
        new_status IS NULL OR
        new_status IN ('Available', 'Low Stock', 'Maintenance', 'Out of Service')
    ),
    CONSTRAINT ck_service_logs_status_change CHECK (
        (action_type = 'STATUS_CHANGE' AND (old_status IS NOT NULL OR new_status IS NOT NULL)) OR
        (action_type != 'STATUS_CHANGE')
    )
);

-- Indexes for performance optimization
CREATE INDEX idx_service_logs_item_id ON service_logs(item_id);
CREATE INDEX idx_service_logs_user_id ON service_logs(user_id);
CREATE INDEX idx_service_logs_created_at ON service_logs(created_at);


-- ============================================================================
-- 4. ERROR_LOGS TABLE (Audit for Database Errors)
-- ============================================================================
CREATE TABLE error_logs (
    error_id SERIAL,
    error_message TEXT NOT NULL,
    error_context TEXT,
    error_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_query TEXT,

    -- Primary Key Constraint
    CONSTRAINT pk_error_logs PRIMARY KEY (error_id)
);

-- Index for timestamp-based queries
CREATE INDEX idx_error_logs_timestamp ON error_logs(error_timestamp);


-- ============================================================================
-- 5. ADDITIONAL UNIQUE CONSTRAINT
-- ============================================================================

-- Business Rule: Service name must be unique per location
ALTER TABLE campus_services
    ADD CONSTRAINT uk_campus_services_name_location
    UNIQUE (service_name, location);


-- ============================================================================
-- 6. TRIGGER FUNCTIONS
-- ============================================================================

-- Function: Automatically update last_updated_at timestamp
CREATE OR REPLACE FUNCTION update_last_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Apply timestamp logic on UPDATE operations
CREATE TRIGGER update_campus_services_timestamp
    BEFORE UPDATE ON campus_services
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_at_column();


-- ============================================================================
-- 7. VALIDATION FUNCTIONS
-- ============================================================================

-- Function: Validate status transitions
CREATE OR REPLACE FUNCTION validate_service_status(
    p_current_status VARCHAR(20),
    p_new_status VARCHAR(20)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_valid_transition BOOLEAN := FALSE;
BEGIN
    CASE p_current_status
        WHEN 'Available' THEN
            v_valid_transition := p_new_status IN ('Low Stock', 'Maintenance');
        WHEN 'Low Stock' THEN
            v_valid_transition := p_new_status IN ('Available', 'Out of Service');
        WHEN 'Maintenance' THEN
            v_valid_transition := p_new_status = 'Available';
        WHEN 'Out of Service' THEN
            v_valid_transition := p_new_status = 'Available';
        ELSE
            v_valid_transition := FALSE;
    END CASE;

    RETURN v_valid_transition;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ============================================================================
-- 8. AUTO-STATUS UPDATE TRIGGER (Phase 2 Placeholder)
-- ============================================================================

-- Function: Automatically update status based on quantity
CREATE OR REPLACE FUNCTION auto_update_status_by_quantity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status NOT IN ('Maintenance', 'Out of Service') THEN
        IF NEW.quantity_available = 0 THEN
            NEW.status := 'Out of Service';
        ELSIF NEW.quantity_available < 10 AND NEW.quantity_available > 0 THEN
            NEW.status := 'Low Stock';
        ELSIF NEW.quantity_available >= 10 THEN
            NEW.status := 'Available';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- NOTE: Trigger disabled in Phase 1, will be enabled in Phase 2
-- CREATE TRIGGER auto_update_status_before_update
--     BEFORE UPDATE ON campus_services
--     FOR EACH ROW
--     EXECUTE FUNCTION auto_update_status_by_quantity();


-- ============================================================================
-- 9. AUDIT LOGGING TRIGGER (Phase 2 Placeholder)
-- ============================================================================

-- Function: Log service status changes for audit trail
CREATE OR REPLACE FUNCTION log_service_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO service_logs (
            item_id,
            user_id,
            old_status,
            new_status,
            action_type
        ) VALUES (
            NEW.item_id,
            NEW.last_updated_by,
            OLD.status,
            NEW.status,
            'STATUS_CHANGE'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- NOTE: Trigger disabled in Phase 1, will be enabled in Phase 2
-- CREATE TRIGGER log_status_changes
--     AFTER UPDATE ON campus_services
--     FOR EACH ROW
--     WHEN (OLD.status IS DISTINCT FROM NEW.status)
--     EXECUTE FUNCTION log_service_change();


-- ============================================================================
-- 10. REFERENTIAL INTEGRITY VALIDATION
-- ============================================================================

-- Function: Check all foreign key relationships
CREATE OR REPLACE FUNCTION validate_referential_integrity()
RETURNS TABLE(
    check_name TEXT,
    is_valid BOOLEAN,
    invalid_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        'campus_services_last_updated_by'::TEXT as check_name,
        (COUNT(*) = 0) as is_valid,
        COUNT(*)::INTEGER as invalid_count
    FROM campus_services cs
    LEFT JOIN users u ON cs.last_updated_by = u.user_id
    WHERE cs.last_updated_by IS NOT NULL AND u.user_id IS NULL;

    RETURN QUERY
    SELECT
        'service_logs_item_id'::TEXT,
        (COUNT(*) = 0),
        COUNT(*)::INTEGER
    FROM service_logs sl
    LEFT JOIN campus_services cs ON sl.item_id = cs.item_id
    WHERE cs.item_id IS NULL;

    RETURN QUERY
    SELECT
        'service_logs_user_id'::TEXT,
        (COUNT(*) = 0),
        COUNT(*)::INTEGER
    FROM service_logs sl
    LEFT JOIN users u ON sl.user_id = u.user_id
    WHERE u.user_id IS NULL;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 11. STATUS CONSISTENCY VALIDATION
-- ============================================================================

-- Function: Check that status values are consistent with business rules
CREATE OR REPLACE FUNCTION validate_status_consistency()
RETURNS TABLE(
    check_name TEXT,
    is_valid BOOLEAN,
    invalid_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        'low_stock_consistency'::TEXT,
        (COUNT(*) = 0),
        COUNT(*)::INTEGER
    FROM campus_services
    WHERE status = 'Low Stock'
      AND (quantity_available = 0 OR quantity_available >= 10);

    RETURN QUERY
    SELECT
        'available_consistency'::TEXT,
        (COUNT(*) = 0),
        COUNT(*)::INTEGER
    FROM campus_services
    WHERE status = 'Available'
      AND quantity_available < 10;

    RETURN QUERY
    SELECT
        'out_of_service_consistency'::TEXT,
        (COUNT(*) = 0),
        COUNT(*)::INTEGER
    FROM campus_services
    WHERE status = 'Out of Service'
      AND quantity_available > 0;

    RETURN QUERY
    SELECT
        'maintenance_consistency'::TEXT,
        (COUNT(*) = 0),
        COUNT(*)::INTEGER
    FROM campus_services
    WHERE status = 'Maintenance'
      AND quantity_available > 0;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 12. BUSINESS RULE VALIDATION
-- ============================================================================

-- Function: Validate business rule compliance
CREATE OR REPLACE FUNCTION validate_business_rules()
RETURNS TABLE(
    rule_name TEXT,
    is_compliant BOOLEAN,
    violation_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        'email_format'::TEXT,
        (COUNT(*) = 0),
        COUNT(*)::INTEGER
    FROM users
    WHERE email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';

    RETURN QUERY
    SELECT
        'duplicate_service_name_location'::TEXT,
        (COUNT(*) = 0),
        COUNT(*)::INTEGER
    FROM (
        SELECT service_name, location, COUNT(*)
        FROM campus_services
        GROUP BY service_name, location
        HAVING COUNT(*) > 1
    ) duplicates;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 13. CLEANUP ORPHANED RECORDS
-- ============================================================================

-- Function: Remove orphaned records and maintain data integrity
CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS TABLE(
    operation_type TEXT,
    records_affected INTEGER
) AS $$
DECLARE
    v_count INTEGER;
BEGIN
    WITH deleted_logs AS (
        DELETE FROM service_logs
        WHERE item_id NOT IN (SELECT item_id FROM campus_services)
        RETURNING log_id
    )
    SELECT COUNT(*) INTO v_count FROM deleted_logs;

    RETURN QUERY SELECT 'deleted_orphan_logs'::TEXT, v_count;

    WITH updated_services AS (
        UPDATE campus_services
        SET last_updated_by = NULL
        WHERE last_updated_by IS NOT NULL
          AND last_updated_by NOT IN (SELECT user_id FROM users)
        RETURNING item_id
    )
    SELECT COUNT(*) INTO v_count FROM updated_services;

    RETURN QUERY SELECT 'cleared_invalid_user_references'::TEXT, v_count;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 14. RESTOCK SERVICE FUNCTION
-- ============================================================================

-- Function: Update service quantity and log the action
CREATE OR REPLACE FUNCTION restock_service(
    p_item_id INTEGER,
    p_additional_quantity INTEGER,
    p_user_id INTEGER
)
RETURNS TABLE(
    new_quantity INTEGER,
    new_status VARCHAR(20)
) AS $$
DECLARE
    v_current_quantity INTEGER;
    v_current_status VARCHAR(20);
    v_new_quantity INTEGER;
    v_new_status VARCHAR(20);
BEGIN
    SELECT quantity_available, status
    INTO v_current_quantity, v_current_status
    FROM campus_services
    WHERE item_id = p_item_id;

    IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id) THEN
        RAISE EXCEPTION 'Invalid user_id: %', p_user_id;
    END IF;

    IF p_additional_quantity <= 0 THEN
        RAISE EXCEPTION 'Additional quantity must be positive: %', p_additional_quantity;
    END IF;

    v_new_quantity := v_current_quantity + p_additional_quantity;

    IF v_new_quantity >= 10 THEN
        v_new_status := 'Available';
    ELSIF v_new_quantity > 0 THEN
        v_new_status := 'Low Stock';
    ELSE
        v_new_status := 'Out of Service';
    END IF;

    UPDATE campus_services
    SET
        quantity_available = v_new_quantity,
        status = v_new_status,
        last_updated_by = p_user_id,
        last_updated_at = CURRENT_TIMESTAMP
    WHERE item_id = p_item_id;

    INSERT INTO service_logs (
        item_id,
        user_id,
        old_status,
        new_status,
        action_type
    ) VALUES (
        p_item_id,
        p_user_id,
        v_current_status,
        v_new_status,
        'RESTOCK'
    );

    RETURN QUERY SELECT v_new_quantity, v_new_status;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 15. ERROR HANDLING FUNCTIONS
-- ============================================================================

-- Function: Log database errors for debugging
CREATE OR REPLACE FUNCTION log_error(
    p_error_message TEXT,
    p_error_context TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO error_logs (error_message, error_context, error_query)
    VALUES (
        p_error_message,
        p_error_context,
        CURRENT_QUERY()
    );

    RAISE NOTICE 'Error logged: % at %', p_error_message, CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function: Standardized error handling
CREATE OR REPLACE FUNCTION handle_database_error(
    p_error_code TEXT,
    p_error_message TEXT
)
RETURNS TABLE(
    error_response JSON
) AS $$
DECLARE
    v_error_json JSON;
BEGIN
    CASE p_error_code
        WHEN '23505' THEN
            v_error_json := json_build_object(
                'code', 'UNIQUE_VIOLATION',
                'message', 'A record with this unique value already exists',
                'details', p_error_message
            );
        WHEN '23503' THEN
            v_error_json := json_build_object(
                'code', 'FOREIGN_KEY_VIOLATION',
                'message', 'Referenced record does not exist',
                'details', p_error_message
            );
        WHEN '23514' THEN
            v_error_json := json_build_object(
                'code', 'CHECK_VIOLATION',
                'message', 'Data does not meet validation rules',
                'details', p_error_message
            );
        ELSE
            v_error_json := json_build_object(
                'code', 'UNKNOWN_ERROR',
                'message', 'An unexpected error occurred',
                'details', p_error_message
            );
    END CASE;

    PERFORM log_error(p_error_message, 'Error Handler');

    RETURN QUERY SELECT v_error_json;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 16. TEST DATA GENERATOR
-- ============================================================================

-- Function: Generate test data for validation
CREATE OR REPLACE FUNCTION generate_test_data(
    p_user_count INTEGER DEFAULT 5,
    p_service_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    test_results JSON
) AS $$
DECLARE
    v_user_names TEXT[] := ARRAY['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
    v_service_names TEXT[] := ARRAY['Lab', 'Cafe', 'Library', 'Computer Lab', 'Study Room', 'Workshop', 'Shuttle', 'Canteen', 'Studio', 'Gym'];
    v_service_types TEXT[] := ARRAY['Lab', 'Food', 'Library', 'Lab', 'Library', 'Lab', 'Transport', 'Food', 'Other', 'Other'];
    v_statuses TEXT[] := ARRAY['Available', 'Low Stock', 'Available', 'Maintenance', 'Available', 'Available', 'Available', 'Out of Service', 'Available', 'Low Stock'];
    v_quantities INTEGER[] := ARRAY[45, 8, 50, 0, 1, 12, 3, 0, 15, 5];
    v_locations TEXT[] := ARRAY['Science Building', 'Student Center', 'Library Main', 'Tech Building', 'Library 3rd', 'Engineering Hall', 'Main Entrance', 'Dormitory', 'Arts Building', 'Health Center'];
    v_user_id INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'Users table does not exist. Run schema first.';
    END IF;

    FOR i IN 1..LEAST(p_user_count, array_length(v_user_names, 1)) LOOP
        INSERT INTO users (name, email, password_hash)
        VALUES (
            v_user_names[i] || ' Test',
            LOWER(v_user_names[i]) || '.test@campus.edu',
            'TEST_HASH_' || i || '_' || md5(random()::TEXT)
        );
    END LOOP;

    SELECT user_id INTO v_user_id FROM users ORDER BY user_id DESC LIMIT 1;

    FOR i IN 1..LEAST(p_service_count, array_length(v_service_names, 1)) LOOP
        INSERT INTO campus_services (
            service_name,
            service_type,
            status,
            last_updated_by,
            quantity_available,
            location
        ) VALUES (
            'Test ' || v_service_names[i],
            v_service_types[i],
            v_statuses[i],
            v_user_id,
            v_quantities[i],
            v_locations[i]
        );

        INSERT INTO service_logs (
            item_id,
            user_id,
            old_status,
            new_status,
            action_type
        ) VALUES (
            currval('campus_services_item_id_seq'),
            v_user_id,
            NULL,
            v_statuses[i],
            'CREATE'
        );
    END LOOP;

    RETURN QUERY SELECT json_build_object(
        'users_created', p_user_count,
        'services_created', p_service_count,
        'status', 'COMPLETED'
    );
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 17. TEST RUNNER
-- ============================================================================

-- Function: Run all validation tests
CREATE OR REPLACE FUNCTION run_all_tests()
RETURNS TABLE(
    test_group TEXT,
    passed BOOLEAN,
    details TEXT
) AS $$
DECLARE
    v_validation_results RECORD;
BEGIN
    FOR v_validation_results IN
        SELECT * FROM validate_referential_integrity()
    LOOP
        RETURN QUERY SELECT
            'Referential Integrity'::TEXT,
            v_validation_results.is_valid,
            CASE
                WHEN v_validation_results.is_valid
                THEN 'All foreign keys valid'
                ELSE v_validation_results.invalid_count || ' invalid references found'
            END;
    END LOOP;

    FOR v_validation_results IN
        SELECT * FROM validate_status_consistency()
    LOOP
        RETURN QUERY SELECT
            'Status Consistency'::TEXT,
            v_validation_results.is_valid,
            CASE
                WHEN v_validation_results.is_valid
                THEN 'All statuses consistent'
                ELSE v_validation_results.invalid_count || ' inconsistent statuses found'
            END;
    END LOOP;

    FOR v_validation_results IN
        SELECT * FROM validate_business_rules()
    LOOP
        RETURN QUERY SELECT
            'Business Rules'::TEXT,
            v_validation_results.is_compliant,
            CASE
                WHEN v_validation_results.is_compliant
                THEN 'All business rules satisfied'
                ELSE v_validation_results.violation_count || ' rule violations found'
            END;
    END LOOP;

    RETURN QUERY SELECT
        'Data Counts'::TEXT,
        (SELECT COUNT(*) FROM users) > 0,
        'Users: ' || (SELECT COUNT(*) FROM users) ||
        ', Services: ' || (SELECT COUNT(*) FROM campus_services) ||
        ', Logs: ' || (SELECT COUNT(*) FROM service_logs);

    RETURN QUERY SELECT
        'Timestamp Trigger'::TEXT,
        EXISTS (
            SELECT 1 FROM pg_trigger
            WHERE tgname = 'update_campus_services_timestamp'
        ),
        CASE
            WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_campus_services_timestamp')
            THEN 'Trigger exists and is enabled'
            ELSE 'Trigger missing or disabled'
        END;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 18. VALIDATION VIEWS
-- ============================================================================

-- View: Service Status Summary
CREATE OR REPLACE VIEW v_service_status_summary AS
SELECT
    service_type,
    COUNT(*) as total_services,
    COUNT(CASE WHEN status = 'Available' THEN 1 END) as available_count,
    COUNT(CASE WHEN status = 'Low Stock' THEN 1 END) as low_stock_count,
    COUNT(CASE WHEN status = 'Maintenance' THEN 1 END) as maintenance_count,
    COUNT(CASE WHEN status = 'Out of Service' THEN 1 END) as out_of_service_count,
    SUM(quantity_available) as total_items_available,
    ROUND(AVG(quantity_available)::numeric, 2) as avg_items_per_service
FROM campus_services
GROUP BY service_type
ORDER BY service_type;

-- View: Service Details with User Info
CREATE OR REPLACE VIEW v_service_details AS
SELECT
    cs.item_id,
    cs.service_name,
    cs.service_type,
    cs.status,
    cs.quantity_available,
    cs.location,
    cs.last_updated_at,
    u.user_id as updated_by_user_id,
    u.name as updated_by_name,
    u.email as updated_by_email,
    CASE
        WHEN cs.quantity_available < 10 AND cs.status != 'Out of Service'
        THEN 'Restock Recommended'
        ELSE 'OK'
    END as restock_recommendation,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - cs.last_updated_at))::INTEGER as days_since_update
FROM campus_services cs
LEFT JOIN users u ON cs.last_updated_by = u.user_id;

-- View: User Activity Log
CREATE OR REPLACE VIEW v_user_activity AS
SELECT
    u.user_id,
    u.name,
    u.email,
    COUNT(DISTINCT cs.item_id) as services_managed,
    COUNT(DISTINCT sl.log_id) as audit_actions_performed,
    MAX(sl.created_at) as last_action_timestamp,
    COUNT(CASE WHEN sl.action_type = 'CREATE' THEN 1 END) as times_created_services,
    COUNT(CASE WHEN sl.action_type = 'UPDATE' THEN 1 END) as times_updated_services,
    COUNT(CASE WHEN sl.action_type = 'STATUS_CHANGE' THEN 1 END) as times_changed_status,
    COUNT(CASE WHEN sl.action_type = 'DELETE' THEN 1 END) as times_deleted_services,
    (COUNT(DISTINCT cs.item_id) * 10 + COUNT(sl.log_id) * 5) as engagement_score
FROM users u
LEFT JOIN campus_services cs ON u.user_id = cs.last_updated_by
LEFT JOIN service_logs sl ON u.user_id = sl.user_id
GROUP BY u.user_id, u.name, u.email
ORDER BY engagement_score DESC;


-- ============================================================================
-- 19. PREDEFINED STATIC QUERY VIEWS (FST §6)
-- ============================================================================

-- Query 1: All Services with Status
CREATE OR REPLACE VIEW v_all_services_with_status AS
SELECT
    cs.item_id,
    cs.service_name,
    cs.service_type,
    cs.status,
    cs.quantity_available,
    cs.location,
    cs.last_updated_at,
    u.name as updated_by_name
FROM campus_services cs
LEFT JOIN users u ON cs.last_updated_by = u.user_id
ORDER BY cs.service_type, cs.service_name;

-- Query 2: Low Stock Alert
CREATE OR REPLACE VIEW v_low_stock_alert AS
SELECT
    service_name,
    service_type,
    quantity_available,
    status,
    location
FROM campus_services
WHERE quantity_available < 10
  AND status != 'Out of Service'
ORDER BY quantity_available ASC;

-- Query 3: Service Change History
CREATE OR REPLACE VIEW v_service_change_history AS
SELECT
    sl.log_id,
    sl.action_type,
    sl.old_status,
    sl.new_status,
    sl.created_at,
    u.name as performed_by,
    cs.service_name
FROM service_logs sl
JOIN users u ON sl.user_id = u.user_id
JOIN campus_services cs ON sl.item_id = cs.item_id
ORDER BY sl.created_at DESC;

-- Query 4: Services by Type
CREATE OR REPLACE VIEW v_services_by_type AS
SELECT
    service_type,
    COUNT(*) as total_services,
    COUNT(CASE WHEN status = 'Available' THEN 1 END) as available,
    COUNT(CASE WHEN status = 'Low Stock' THEN 1 END) as low_stock,
    COUNT(CASE WHEN status = 'Maintenance' THEN 1 END) as maintenance,
    COUNT(CASE WHEN status = 'Out of Service' THEN 1 END) as out_of_service,
    SUM(quantity_available) as total_items
FROM campus_services
GROUP BY service_type
ORDER BY service_type;

-- Query 5: User Activity Summary
CREATE OR REPLACE VIEW v_user_activity_summary AS
SELECT
    u.user_id,
    u.name,
    u.email,
    COUNT(DISTINCT cs.item_id) as services_managed,
    COUNT(sl.log_id) as total_actions,
    MAX(sl.created_at) as last_action
FROM users u
LEFT JOIN campus_services cs ON u.user_id = cs.last_updated_by
LEFT JOIN service_logs sl ON u.user_id = sl.user_id
GROUP BY u.user_id, u.name, u.email
ORDER BY total_actions DESC;


-- ============================================================================
-- SCHEMA CREATION COMPLETE
-- ============================================================================


-- ============================================================================
-- 20. STATIC TEST CASES (LST §13)
-- ============================================================================

-- ============================================================================
-- TEST CASE: CONSTRAINT ENFORCEMENT (LST §13.1)
-- ============================================================================

-- TC-01: Insert duplicate email (should fail with unique_violation)
-- TEST: INSERT INTO users (name, email, password_hash) VALUES ('Test Duplicate', 'alice@campus.edu', 'TEST_HASH');

-- TC-02: Insert invalid status (should fail with check_violation)
-- TEST: INSERT INTO campus_services (service_name, service_type, status, last_updated_by) VALUES ('Test Service', 'Lab', 'InvalidStatus', 1);

-- TC-03: Insert negative quantity (should fail with check_violation)
-- TEST: INSERT INTO campus_services (service_name, service_type, status, last_updated_by, quantity_available) VALUES ('Test Service', 'Lab', 'Available', 1, -5);

-- TC-04: Insert invalid foreign key (should fail with foreign_key_violation)
-- TEST: INSERT INTO campus_services (service_name, service_type, status, last_updated_by) VALUES ('Test Service', 'Lab', 'Available', 999);


-- ============================================================================
-- TEST CASE: TRIGGER EXECUTION (LST §13.2)
-- ============================================================================

-- TC-05: UPDATE service without timestamp (timestamp trigger should auto-update)
-- TEST: UPDATE campus_services SET quantity_available = 50 WHERE item_id = 1;
-- EXPECTED: last_updated_at should be automatically updated to current timestamp

-- TC-06: Multiple consecutive updates (each should show different timestamp)
-- TEST: UPDATE campus_services SET quantity_available = 45 WHERE item_id = 1;
-- TEST: UPDATE campus_services SET quantity_available = 40 WHERE item_id = 1;
-- EXPECTED: Each update should have a different last_updated_at value


-- ============================================================================
-- TEST CASE: FUNCTION LOGIC (LST §13.3)
-- ============================================================================

-- TC-07: Validate status transition (should return TRUE for valid transitions)
-- TEST: SELECT validate_service_status('Available', 'Low Stock');  -- Expected: TRUE
-- TEST: SELECT validate_service_status('Available', 'Available');  -- Expected: FALSE

-- TC-08: Restock service (quantity increased, status updated)
-- TEST: SELECT * FROM restock_service(3, 20, 1);  -- Restock Campus Main Cafe
-- EXPECTED: new_quantity = 28, new_status = 'Available'

-- TC-09: Check data integrity (should return all valid)
-- TEST: SELECT * FROM validate_referential_integrity();
-- EXPECTED: All is_valid = TRUE

-- TC-10: Run all tests (all tests should pass)
-- TEST: SELECT * FROM run_all_tests();
-- EXPECTED: All test_group rows have passed = TRUE


-- ============================================================================
-- TEST CASE: CONSTRAINT VALIDATION (Inline Tests)
-- ============================================================================

-- Test: Schema Existence
DO $$
BEGIN
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'users'
    ), 'Users table missing';
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'campus_services'
    ), 'Campus_services table missing';
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'service_logs'
    ), 'Service_logs table missing';
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'error_logs'
    ), 'Error_logs table missing';
END $$;

-- Test: Unique Email Constraint
DO $$
BEGIN
    -- This should succeed
    INSERT INTO users (name, email, password_hash)
    VALUES ('Test Unique', 'test.unique@campus.edu', 'TEST_HASH_UNIQUE');

    -- This should fail (duplicate email)
    BEGIN
        INSERT INTO users (name, email, password_hash)
        VALUES ('Test Duplicate', 'test.unique@campus.edu', 'TEST_HASH_DUPLICATE');
        RAISE EXCEPTION 'Unique constraint should have failed';
    EXCEPTION
        WHEN unique_violation THEN
            RAISE NOTICE 'Email constraint working correctly';
    END;

    -- Cleanup
    DELETE FROM users WHERE email = 'test.unique@campus.edu';
END $$;

-- Test: Foreign Key Constraint
DO $$
BEGIN
    BEGIN
        INSERT INTO campus_services (
            service_name, service_type, status, last_updated_by
        ) VALUES ('Test FK Service', 'Lab', 'Available', 999);
        RAISE EXCEPTION 'Foreign key constraint should have failed';
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'Foreign key constraint working correctly';
    END;
END $$;

-- Test: Status Enum Validation
DO $$
DECLARE
    v_invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_invalid_count
    FROM campus_services
    WHERE status NOT IN ('Available', 'Low Stock', 'Maintenance', 'Out of Service');

    IF v_invalid_count > 0 THEN
        RAISE EXCEPTION 'Status constraint violated: % invalid statuses', v_invalid_count;
    ELSE
        RAISE NOTICE 'Status constraint validated: All statuses valid';
    END IF;
END $$;

-- Test: Referential Integrity
DO $$
DECLARE
    v_orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_orphaned_count
    FROM campus_services cs
    LEFT JOIN users u ON cs.last_updated_by = u.user_id
    WHERE cs.last_updated_by IS NOT NULL AND u.user_id IS NULL;

    IF v_orphaned_count > 0 THEN
        RAISE EXCEPTION 'Referential integrity violated: % orphaned records', v_orphaned_count;
    ELSE
        RAISE NOTICE 'Referential integrity validated: No orphaned records';
    END IF;
END $$;


-- ============================================================================
-- STATIC TEST CASES COMPLETE
-- ============================================================================
