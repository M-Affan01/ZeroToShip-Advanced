-- ============================================================================
-- Sentinel-Sync: The Adaptive Campus Intelligence Hub
-- Phase 1: Test Seed Data
-- Version: v1.0
-- Date: 2026-07-24
-- ============================================================================

-- ============================================================================
-- 0. RESET SEQUENCES (schema.sql DO blocks may have consumed IDs)
-- ============================================================================
SELECT setval('users_user_id_seq', 1, false);
SELECT setval('campus_services_item_id_seq', 1, false);
SELECT setval('service_logs_log_id_seq', 1, false);


-- ============================================================================
-- 1. INSERT TEST USERS
-- ============================================================================
INSERT INTO users (name, email, password_hash) VALUES
('Dr. Sarah Ahmed', 'sarah.ahmed@campus.edu', 'STATIC_HASH_1'),
('Prof. James Wilson', 'james.wilson@campus.edu', 'STATIC_HASH_2'),
('Admin Maria Khan', 'maria.khan@campus.edu', 'STATIC_HASH_3'),
('Lab Technician Raj Patel', 'raj.patel@campus.edu', 'STATIC_HASH_4'),
('Librarian Emma Davis', 'emma.davis@campus.edu', 'STATIC_HASH_5');


-- ============================================================================
-- 2. INSERT TEST CAMPUS SERVICES
-- ============================================================================
INSERT INTO campus_services (
    service_name, service_type, status, last_updated_by,
    quantity_available, location
) VALUES
('Central Computer Lab', 'Lab', 'Available', 1, 45, 'Science Building, Rm 101'),
('Engineering Workshop', 'Lab', 'Available', 1, 12, 'Engineering Hall, Rm 205'),
('Campus Main Cafe', 'Food', 'Low Stock', 2, 8, 'Student Center, 1st Floor'),
('Library Study Commons', 'Library', 'Available', 3, 50, 'Library Main Floor'),
('Quiet Study Room A', 'Library', 'Low Stock', 3, 1, 'Library, 3rd Floor'),
('Computer Lab 3', 'Lab', 'Maintenance', 4, 0, 'Tech Building, Rm 302'),
('Mobile Learning Lab', 'Lab', 'Available', 4, 20, 'Education Building, Rm 110'),
('Campus Shuttle Service', 'Transport', 'Low Stock', 5, 3, 'Main Entrance'),
('Late Night Cafe', 'Food', 'Out of Service', 2, 0, 'Dormitory Building'),
('Medical Equipment Lab', 'Lab', 'Low Stock', 1, 5, 'Health Sciences Center');


-- ============================================================================
-- 3. INSERT TEST SERVICE LOGS (Audit Trail)
-- ============================================================================
INSERT INTO service_logs (
    item_id, user_id, old_status, new_status, action_type
) VALUES
-- Creation logs
(1, 1, NULL, 'Available', 'CREATE'),
(2, 1, NULL, 'Available', 'CREATE'),
(3, 2, NULL, 'Low Stock', 'CREATE'),
(4, 3, NULL, 'Available', 'CREATE'),
(5, 3, NULL, 'Available', 'CREATE'),
(6, 4, NULL, 'Maintenance', 'CREATE'),
(7, 4, NULL, 'Available', 'CREATE'),
(8, 5, NULL, 'Available', 'CREATE'),
(9, 2, NULL, 'Out of Service', 'CREATE'),
(10, 1, NULL, 'Low Stock', 'CREATE'),
-- Status change logs
(3, 2, 'Low Stock', 'Out of Service', 'STATUS_CHANGE'),
(3, 2, 'Out of Service', 'Low Stock', 'STATUS_CHANGE'),
(1, 1, 'Available', 'Low Stock', 'STATUS_CHANGE'),
(6, 4, 'Maintenance', 'Available', 'STATUS_CHANGE'),
(10, 1, 'Low Stock', 'Maintenance', 'STATUS_CHANGE');


-- ============================================================================
-- SEED DATA INSERTION COMPLETE
-- ============================================================================
