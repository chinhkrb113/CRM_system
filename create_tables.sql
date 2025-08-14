-- Create database and tables for CRM system
CREATE DATABASE IF NOT EXISTS db_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_crm;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'MANAGER', 'SALES', 'SUPPORT') DEFAULT 'SALES',
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(36) PRIMARY KEY,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    company VARCHAR(255),
    jobTitle VARCHAR(255),
    status ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST') DEFAULT 'NEW',
    source ENUM('WEBSITE', 'SOCIAL_MEDIA', 'REFERRAL', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'OTHER') NOT NULL,
    score SMALLINT,
    notes TEXT,
    customFields JSON,
    ownerId VARCHAR(36),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ownerId) REFERENCES users(id)
);

-- Create interactions table
CREATE TABLE IF NOT EXISTS interactions (
    id VARCHAR(36) PRIMARY KEY,
    leadId VARCHAR(36) NOT NULL,
    userId VARCHAR(36) NOT NULL,
    type ENUM('CALL', 'EMAIL', 'MEETING', 'NOTE', 'SMS') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    scheduledAt TIMESTAMP,
    duration INT,
    outcome VARCHAR(255),
    followUpRequired BOOLEAN DEFAULT FALSE,
    followUpDate TIMESTAMP,
    completedAt TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (leadId) REFERENCES leads(id),
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(36) PRIMARY KEY,
    leadId VARCHAR(36) NOT NULL,
    userId VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduledAt TIMESTAMP NOT NULL,
    duration INT DEFAULT 60,
    location VARCHAR(255),
    meetingType VARCHAR(255) DEFAULT 'IN_PERSON',
    reminderMinutes INT,
    status ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'SCHEDULED',
    notes TEXT,
    outcome VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (leadId) REFERENCES leads(id),
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    leadId VARCHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
    paymentLink VARCHAR(255) NOT NULL,
    description TEXT,
    expiresAt TIMESTAMP,
    metadata JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (leadId) REFERENCES leads(id)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36),
    leadId VARCHAR(36),
    action VARCHAR(255) NOT NULL,
    entity VARCHAR(255) NOT NULL,
    entityId VARCHAR(36) NOT NULL,
    oldData JSON,
    newData JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (leadId) REFERENCES leads(id)
);

-- Insert sample data for testing
INSERT INTO users (id, email, password, firstName, lastName, role) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'admin@crm.com', '$2b$10$hash', 'Admin', 'User', 'ADMIN'),
('550e8400-e29b-41d4-a716-446655440001', 'sales@crm.com', '$2b$10$hash', 'Sales', 'Rep', 'SALES');

INSERT INTO leads (id, firstName, lastName, email, phone, company, status, source, ownerId) VALUES 
('660e8400-e29b-41d4-a716-446655440000', 'John', 'Doe', 'john@example.com', '+1234567890', 'Example Corp', 'NEW', 'WEBSITE', '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440001', 'Jane', 'Smith', 'jane@example.com', '+1234567891', 'Test Inc', 'CONTACTED', 'REFERRAL', '550e8400-e29b-41d4-a716-446655440001');

SELECT 'Database and tables created successfully!' as message;