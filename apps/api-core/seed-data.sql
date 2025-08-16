-- Sample data for CRM system testing
-- Insert sample users
INSERT INTO User (id, email, password, firstName, lastName, role, isActive, createdAt, updatedAt) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@crm.com', '$2b$12$LQv3c1yqBwEHxE03gsaC8ue5jhNnpM4HdlzL9.4rF0qhcJ9C3QZ8W', 'Admin', 'User', 'ADMIN', 1, datetime('now'), datetime('now')),
('550e8400-e29b-41d4-a716-446655440002', 'manager@crm.com', '$2b$12$LQv3c1yqBwEHxE03gsaC8ue5jhNnpM4HdlzL9.4rF0qhcJ9C3QZ8W', 'Manager', 'User', 'MANAGER', 1, datetime('now'), datetime('now')),
('550e8400-e29b-41d4-a716-446655440003', 'sales@crm.com', '$2b$12$LQv3c1yqBwEHxE03gsaC8ue5jhNnpM4HdlzL9.4rF0qhcJ9C3QZ8W', 'Sales', 'Rep', 'SALES', 1, datetime('now'), datetime('now')),
('550e8400-e29b-41d4-a716-446655440004', 'support@crm.com', '$2b$12$LQv3c1yqBwEHxE03gsaC8ue5jhNnpM4HdlzL9.4rF0qhcJ9C3QZ8W', 'Support', 'Agent', 'SUPPORT', 1, datetime('now'), datetime('now'));

-- Insert sample leads
INSERT INTO Lead (id, name, email, phone, company, jobTitle, status, source, score, notes, customFields, ownerId, createdAt, updatedAt) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'John Doe', 'john.doe@example.com', '+1234567890', 'Tech Corp', 'CTO', 'NEW', 'WEBSITE', 85, 'Interested in enterprise solution', '{"budget": "$50000", "timeline": "Q2 2024"}', '550e8400-e29b-41d4-a716-446655440003', datetime('now'), datetime('now')),
('660e8400-e29b-41d4-a716-446655440002', 'Jane Smith', 'jane.smith@company.com', '+1234567891', 'Business Inc', 'CEO', 'CONTACTED', 'REFERRAL', 92, 'High priority lead', '{"budget": "$100000", "timeline": "Q1 2024"}', '550e8400-e29b-41d4-a716-446655440003', datetime('now'), datetime('now')),
('660e8400-e29b-41d4-a716-446655440003', 'Bob Johnson', 'bob.johnson@startup.com', '+1234567892', 'Startup LLC', 'Founder', 'QUALIFIED', 'SOCIAL_MEDIA', 78, 'Looking for cost-effective solution', '{"budget": "$25000", "timeline": "Q3 2024"}', '550e8400-e29b-41d4-a716-446655440003', datetime('now'), datetime('now')),
('660e8400-e29b-41d4-a716-446655440004', 'Alice Brown', 'alice.brown@enterprise.com', '+1234567893', 'Enterprise Corp', 'VP Sales', 'PROPOSAL', 'EMAIL_CAMPAIGN', 95, 'Ready to move forward', '{"budget": "$200000", "timeline": "Q1 2024"}', '550e8400-e29b-41d4-a716-446655440003', datetime('now'), datetime('now'));

-- Insert sample interactions
INSERT INTO Interaction (id, leadId, userId, type, subject, description, scheduledAt, completedAt, notes, outcome, createdAt, updatedAt) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'CALL', 'Initial Contact', 'First call to discuss requirements', datetime('now', '+1 day'), NULL, 'Scheduled for tomorrow', NULL, datetime('now'), datetime('now')),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'EMAIL', 'Follow-up Email', 'Sent product information and pricing', datetime('now', '-1 day'), datetime('now', '-1 day'), 'Email sent successfully', 'Positive response received', datetime('now'), datetime('now')),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'MEETING', 'Demo Session', 'Product demonstration meeting', datetime('now', '+2 days'), NULL, 'Demo scheduled', NULL, datetime('now'), datetime('now'));

-- Insert sample appointments
INSERT INTO Appointment (id, leadId, userId, title, description, scheduledAt, duration, location, meetingType, reminderMinutes, status, notes, outcome, createdAt, updatedAt) VALUES
('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Discovery Call', 'Initial discovery call to understand requirements', datetime('now', '+1 day'), 60, 'Virtual', 'VIDEO_CALL', 15, 'SCHEDULED', 'Reminder set', NULL, datetime('now'), datetime('now')),
('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'Product Demo', 'Comprehensive product demonstration', datetime('now', '+3 days'), 90, 'Client Office', 'IN_PERSON', 30, 'SCHEDULED', 'Bring demo materials', NULL, datetime('now'), datetime('now')),
('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Contract Discussion', 'Final contract terms discussion', datetime('now', '+5 days'), 120, 'Conference Room A', 'IN_PERSON', 60, 'SCHEDULED', 'Prepare contract documents', NULL, datetime('now'), datetime('now'));

-- Insert sample payments
INSERT INTO Payment (id, leadId, amount, currency, status, paymentLink, description, expiresAt, metadata, createdAt, updatedAt) VALUES
('990e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', 50000.00, 'USD', 'PENDING', 'https://payment.crm.com/pay/990e8400-e29b-41d4-a716-446655440001', 'Initial payment for enterprise solution', datetime('now', '+30 days'), '{"invoice_id": "INV-2024-001", "payment_method": "bank_transfer"}', datetime('now'), datetime('now')),
('990e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 25000.00, 'USD', 'PAID', 'https://payment.crm.com/pay/990e8400-e29b-41d4-a716-446655440002', 'Startup package payment', datetime('now', '+30 days'), '{"invoice_id": "INV-2024-002", "payment_method": "credit_card", "transaction_id": "txn_123456"}', datetime('now'), datetime('now'));

-- Insert sample audit logs
INSERT INTO AuditLog (id, userId, action, entity, entityId, oldData, newData, createdAt) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'CREATE', 'LEAD', '660e8400-e29b-41d4-a716-446655440001', NULL, '{"name": "John Doe", "email": "john.doe@example.com", "status": "NEW"}', datetime('now')),
('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'UPDATE', 'LEAD', '660e8400-e29b-41d4-a716-446655440002', '{"status": "NEW"}', '{"status": "CONTACTED"}', datetime('now')),
('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'CREATE', 'APPOINTMENT', '880e8400-e29b-41d4-a716-446655440001', NULL, '{"title": "Discovery Call", "status": "SCHEDULED"}', datetime('now'));