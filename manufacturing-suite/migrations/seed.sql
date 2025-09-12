-- Manufacturing Operations Suite - Seed Data
-- Test data for cosmetics manufacturing system

-- Insert default tenant
INSERT OR IGNORE INTO tenants (id, name, subscription_type) VALUES 
(1, 'LuxeBeauty Manufacturing Co.', 'enterprise');

-- Insert test users (password is 'password123' hashed with bcrypt)
INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, role, tenant_id) VALUES 
('admin@luxebeauty.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah', 'Johnson', 'admin', 1),
('production@luxebeauty.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike', 'Rodriguez', 'production_manager', 1),
('quality@luxebeauty.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emma', 'Chen', 'quality_control', 1),
('procurement@luxebeauty.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'David', 'Thompson', 'procurement', 1),
('operator1@luxebeauty.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Lisa', 'Garcia', 'operator', 1);

-- Insert production lines (A, B, C, and Pilot)
INSERT OR IGNORE INTO production_lines (name, code, capacity_liters_per_hour, status, tenant_id) VALUES 
('Production Line A', 'LINE_A', 150.0, 'available', 1),
('Production Line B', 'LINE_B', 120.0, 'available', 1),
('Production Line C', 'LINE_C', 100.0, 'maintenance', 1),
('Pilot Line', 'PILOT', 25.0, 'available', 1);

-- Insert suppliers
INSERT OR IGNORE INTO suppliers (name, code, contact_person, email, phone, certification_type, quality_rating, delivery_rating, cost_rating, tenant_id) VALUES 
('BioActive Ingredients Ltd', 'BIO001', 'Jennifer Walsh', 'orders@bioactive.com', '+1-555-0101', 'organic', 5, 4, 4, 1),
('Pure Extracts Co', 'PUR002', 'Robert Kim', 'sales@pureextracts.com', '+1-555-0102', 'ecocert', 4, 5, 3, 1),
('Essential Oils International', 'ESS003', 'Maria Santos', 'info@essentialoils.com', '+1-555-0103', 'organic', 5, 5, 4, 1),
('Premium Packaging Solutions', 'PKG004', 'James Wilson', 'orders@premiumpkg.com', '+1-555-0104', 'none', 4, 4, 5, 1),
('ChemSupply Corp', 'CHM005', 'Dr. Lisa Brown', 'procurement@chemsupply.com', '+1-555-0105', 'none', 3, 3, 5, 1);

-- Insert raw materials
INSERT OR IGNORE INTO raw_materials (sku, name, supplier_id, category, unit_of_measure, cost_per_unit, reorder_point, safety_stock, shelf_life_days, tenant_id) VALUES 
-- Active ingredients
('ACT001', 'Hyaluronic Acid (High MW)', 1, 'active', 'kg', 850.00, 5.0, 2.0, 730, 1),
('ACT002', 'Vitamin C (L-Ascorbic Acid)', 1, 'active', 'kg', 1200.00, 3.0, 1.0, 365, 1),
('ACT003', 'Retinol Palmitate', 2, 'active', 'kg', 2100.00, 2.0, 1.0, 545, 1),
('ACT004', 'Niacinamide (Vitamin B3)', 1, 'active', 'kg', 650.00, 5.0, 2.0, 730, 1),
('ACT005', 'Salicylic Acid', 5, 'active', 'kg', 280.00, 10.0, 5.0, 1095, 1),

-- Base ingredients
('BASE001', 'Distilled Water', 5, 'base', 'L', 2.50, 500.0, 100.0, 90, 1),
('BASE002', 'Glycerin (USP)', 2, 'base', 'L', 15.00, 100.0, 25.0, 730, 1),
('BASE003', 'Cetyl Alcohol', 5, 'base', 'kg', 12.00, 50.0, 15.0, 1095, 1),
('BASE004', 'Shea Butter (Refined)', 2, 'base', 'kg', 18.50, 25.0, 10.0, 545, 1),
('BASE005', 'Jojoba Oil (Organic)', 3, 'base', 'L', 85.00, 15.0, 5.0, 730, 1),

-- Preservatives
('PRES001', 'Phenoxyethanol', 5, 'preservative', 'kg', 45.00, 10.0, 3.0, 1095, 1),
('PRES002', 'Sodium Benzoate', 5, 'preservative', 'kg', 25.00, 15.0, 5.0, 1095, 1),
('PRES003', 'Potassium Sorbate', 5, 'preservative', 'kg', 28.00, 12.0, 4.0, 1095, 1),

-- Fragrances
('FRAG001', 'Lavender Essential Oil', 3, 'fragrance', 'L', 120.00, 5.0, 2.0, 365, 1),
('FRAG002', 'Rose Absolute', 3, 'fragrance', 'L', 3500.00, 1.0, 0.5, 545, 1),
('FRAG003', 'Vanilla Extract (Natural)', 3, 'fragrance', 'L', 250.00, 3.0, 1.0, 365, 1),

-- Packaging
('PKG001', '50ml Glass Bottles', 4, 'packaging', 'pieces', 2.50, 1000, 500, 1825, 1),
('PKG002', '30ml Pump Dispensers', 4, 'packaging', 'pieces', 3.75, 500, 200, 1825, 1),
('PKG003', '15ml Eye Cream Jars', 4, 'packaging', 'pieces', 1.85, 800, 300, 1825, 1);

-- Insert products
INSERT OR IGNORE INTO products (sku, name, category, shelf_life_days, batch_size_liters, tenant_id) VALUES 
('PRD001', 'Hydrating Serum Pro', 'skincare', 730, 50.0, 1),
('PRD002', 'Vitamin C Brightening Cream', 'skincare', 545, 75.0, 1),
('PRD003', 'Anti-Aging Night Serum', 'skincare', 545, 40.0, 1),
('PRD004', 'Gentle Daily Moisturizer', 'skincare', 730, 100.0, 1),
('PRD005', 'Organic Face Oil Blend', 'skincare', 365, 25.0, 1);

-- Insert Bill of Materials (BOM) for products
INSERT OR IGNORE INTO bom_items (product_id, raw_material_id, quantity_per_batch, percentage, is_critical, tenant_id) VALUES 
-- Hydrating Serum Pro (PRD001)
(1, 1, 2.5, 5.0, true, 1),    -- Hyaluronic Acid
(1, 4, 1.0, 2.0, true, 1),    -- Niacinamide
(1, 6, 40.0, 80.0, false, 1), -- Distilled Water
(1, 7, 5.0, 10.0, false, 1),  -- Glycerin
(1, 11, 0.5, 1.0, true, 1),   -- Phenoxyethanol
(1, 14, 1.0, 2.0, false, 1),  -- Lavender Essential Oil

-- Vitamin C Brightening Cream (PRD002)
(2, 2, 3.75, 5.0, true, 1),   -- Vitamin C
(2, 6, 52.5, 70.0, false, 1), -- Distilled Water
(2, 7, 7.5, 10.0, false, 1),  -- Glycerin
(2, 9, 3.75, 5.0, false, 1),  -- Shea Butter
(2, 11, 0.75, 1.0, true, 1),  -- Phenoxyethanol
(2, 16, 1.5, 2.0, false, 1),  -- Vanilla Extract

-- Anti-Aging Night Serum (PRD003)
(3, 3, 1.2, 3.0, true, 1),    -- Retinol Palmitate
(3, 1, 1.6, 4.0, true, 1),    -- Hyaluronic Acid
(3, 10, 8.0, 20.0, false, 1), -- Jojoba Oil
(3, 6, 28.0, 70.0, false, 1), -- Distilled Water
(3, 11, 0.4, 1.0, true, 1),   -- Phenoxyethanol
(3, 15, 0.8, 2.0, false, 1);  -- Rose Absolute

-- Insert inventory lots with FEFO considerations (different expiry dates)
INSERT OR IGNORE INTO inventory_lots (raw_material_id, lot_number, quantity_available, unit_cost, expiry_date, received_date, supplier_batch_number, quality_status, tenant_id) VALUES 
-- Hyaluronic Acid lots with different expiry dates
(1, 'HA2024001', 15.5, 850.00, '2024-12-15', '2024-01-15', 'BIO-HA-240115', 'approved', 1),
(1, 'HA2024002', 12.0, 850.00, '2025-02-20', '2024-02-20', 'BIO-HA-240220', 'approved', 1),
(1, 'HA2024003', 8.3, 850.00, '2024-11-30', '2024-01-30', 'BIO-HA-240130', 'approved', 1),

-- Vitamin C lots
(2, 'VC2024001', 5.2, 1200.00, '2024-10-15', '2024-01-15', 'BIO-VC-240115', 'approved', 1),
(2, 'VC2024002', 3.8, 1200.00, '2025-01-10', '2024-02-10', 'BIO-VC-240210', 'approved', 1),

-- Base ingredients with various expiry dates
(6, 'H2O2024001', 850.0, 2.50, '2024-04-15', '2024-01-15', 'CHM-H2O-240115', 'approved', 1),
(6, 'H2O2024002', 1200.0, 2.50, '2024-05-20', '2024-02-20', 'CHM-H2O-240220', 'approved', 1),
(7, 'GLY2024001', 180.5, 15.00, '2025-08-15', '2024-01-15', 'PUR-GLY-240115', 'approved', 1),
(8, 'CET2024001', 75.0, 12.00, '2026-01-15', '2024-01-15', 'CHM-CET-240115', 'approved', 1),
(9, 'SHE2024001', 45.5, 18.50, '2025-06-15', '2024-01-15', 'PUR-SHE-240115', 'approved', 1),
(10, 'JOJ2024001', 25.8, 85.00, '2025-12-15', '2024-01-15', 'ESS-JOJ-240115', 'approved', 1),

-- Preservatives
(11, 'PHE2024001', 22.0, 45.00, '2026-12-15', '2024-01-15', 'CHM-PHE-240115', 'approved', 1),
(12, 'SOD2024001', 28.5, 25.00, '2026-08-15', '2024-01-15', 'CHM-SOD-240115', 'approved', 1),

-- Essential oils and fragrances
(14, 'LAV2024001', 8.2, 120.00, '2024-12-15', '2024-01-15', 'ESS-LAV-240115', 'approved', 1),
(15, 'ROS2024001', 2.1, 3500.00, '2025-04-15', '2024-01-15', 'ESS-ROS-240115', 'approved', 1),
(16, 'VAN2024001', 5.5, 250.00, '2024-11-15', '2024-01-15', 'ESS-VAN-240115', 'approved', 1),

-- Packaging materials
(17, 'BOT2024001', 2500, 2.50, '2027-01-15', '2024-01-15', 'PKG-BOT-240115', 'approved', 1),
(18, 'PMP2024001', 1200, 3.75, '2027-01-15', '2024-01-15', 'PKG-PMP-240115', 'approved', 1),
(19, 'JAR2024001', 1800, 1.85, '2027-01-15', '2024-01-15', 'PKG-JAR-240115', 'approved', 1);

-- Insert batch records with various statuses
INSERT OR IGNORE INTO batch_records (batch_number, product_id, production_line_id, planned_quantity, actual_quantity, status, planned_start_date, actual_start_date, planned_end_date, operator_id, supervisor_id, tenant_id) VALUES 
('BATCH001', 1, 1, 50.0, 49.8, 'approved', '2024-03-15 08:00:00', '2024-03-15 08:15:00', '2024-03-15 16:00:00', 5, 2, 1),
('BATCH002', 2, 2, 75.0, 74.2, 'in_progress', '2024-03-16 08:00:00', '2024-03-16 08:00:00', '2024-03-16 17:00:00', 5, 2, 1),
('BATCH003', 1, 4, 25.0, 0.0, 'planned', '2024-03-17 09:00:00', NULL, '2024-03-17 15:00:00', 5, 2, 1),
('BATCH004', 3, 1, 40.0, 39.5, 'quality_hold', '2024-03-14 08:00:00', '2024-03-14 08:30:00', '2024-03-14 16:30:00', 5, 2, 1),
('BATCH005', 4, 2, 100.0, 0.0, 'planned', '2024-03-18 08:00:00', NULL, '2024-03-18 18:00:00', 5, 2, 1);

-- Insert production steps for batches
INSERT OR IGNORE INTO production_steps (batch_id, step_number, step_name, description, temperature_setpoint, status, tenant_id) VALUES 
-- Steps for BATCH001 (completed)
(1, 1, 'Preparation', 'Prepare and weigh all raw materials', NULL, 'completed', 1),
(1, 2, 'Water Phase', 'Heat water phase to 70°C', 70.0, 'completed', 1),
(1, 3, 'Active Addition', 'Add active ingredients at 40°C', 40.0, 'completed', 1),
(1, 4, 'Homogenization', 'Homogenize for 10 minutes', 25.0, 'completed', 1),
(1, 5, 'Cooling', 'Cool to room temperature', 25.0, 'completed', 1),
(1, 6, 'Final QC', 'Quality control testing', NULL, 'completed', 1),

-- Steps for BATCH002 (in progress)
(2, 1, 'Preparation', 'Prepare and weigh all raw materials', NULL, 'completed', 1),
(2, 2, 'Water Phase', 'Heat water phase to 75°C', 75.0, 'completed', 1),
(2, 3, 'Oil Phase', 'Prepare oil phase at 75°C', 75.0, 'in_progress', 1),
(2, 4, 'Emulsification', 'Combine phases and emulsify', 70.0, 'pending', 1),
(2, 5, 'Active Addition', 'Add Vitamin C at 45°C', 45.0, 'pending', 1),
(2, 6, 'Final Processing', 'Final mixing and cooling', 25.0, 'pending', 1);

-- Insert QC test results
INSERT OR IGNORE INTO qc_tests (batch_id, test_type, specification_min, specification_max, actual_result, pass_fail, tested_at, technician_id, tenant_id) VALUES 
(1, 'ph', 5.5, 6.5, 6.1, 'pass', '2024-03-15 16:30:00', 3, 1),
(1, 'viscosity', 15000, 25000, 18500, 'pass', '2024-03-15 16:45:00', 3, 1),
(1, 'microbial', 0, 100, 5, 'pass', '2024-03-15 17:00:00', 3, 1),
(4, 'ph', 4.5, 5.5, 3.8, 'fail', '2024-03-14 17:00:00', 3, 1),
(4, 'viscosity', 20000, 30000, 22500, 'pass', '2024-03-14 17:15:00', 3, 1);

-- Insert purchase orders
INSERT OR IGNORE INTO purchase_orders (po_number, supplier_id, status, order_date, requested_delivery_date, total_amount, created_by, tenant_id) VALUES 
('PO2024001', 1, 'received', '2024-01-10', '2024-01-15', 12750.00, 4, 1),
('PO2024002', 3, 'shipped', '2024-02-15', '2024-02-25', 5680.00, 4, 1),
('PO2024003', 2, 'sent', '2024-03-10', '2024-03-20', 8450.00, 4, 1),
('PO2024004', 4, 'draft', '2024-03-15', '2024-03-25', 15620.00, 4, 1);

-- Insert PO line items
INSERT OR IGNORE INTO po_line_items (po_id, raw_material_id, quantity_ordered, quantity_received, unit_price, tenant_id) VALUES 
(1, 1, 15.0, 15.0, 850.00, 1),  -- Hyaluronic Acid
(2, 14, 10.0, 8.2, 120.00, 1),  -- Lavender Oil
(2, 15, 3.0, 2.1, 3500.00, 1),  -- Rose Absolute
(3, 7, 50.0, 0.0, 15.00, 1),    -- Glycerin
(3, 9, 25.0, 0.0, 18.50, 1);    -- Shea Butter

-- Insert system alerts
INSERT OR IGNORE INTO system_alerts (alert_type, severity, title, message, entity_type, entity_id, assigned_to, tenant_id) VALUES 
('low_stock', 'high', 'Low Stock Alert: Vitamin C', 'Vitamin C (L-Ascorbic Acid) is below reorder point. Current stock: 9.0 kg', 'inventory', 2, 4, 1),
('expiry_warning', 'medium', 'Expiry Warning: Hyaluronic Acid', 'Lot HA2024003 expires in 30 days. Quantity: 8.3 kg', 'inventory', 1, 2, 1),
('quality_issue', 'high', 'QC Failure: Batch BATCH004', 'pH test failed for Anti-Aging Night Serum batch. Result: 3.8 (Spec: 4.5-5.5)', 'batch', 4, 3, 1),
('maintenance_due', 'medium', 'Maintenance Due: Line C', 'Production Line C requires scheduled maintenance', 'equipment', 3, 2, 1);

-- Insert production schedule
INSERT OR IGNORE INTO production_schedule (schedule_date, production_line_id, batch_id, shift, planned_start_time, planned_end_time, status, priority, tenant_id) VALUES 
('2024-03-16', 2, 2, 'day', '08:00:00', '17:00:00', 'in_progress', 8, 1),
('2024-03-17', 4, 3, 'day', '09:00:00', '15:00:00', 'scheduled', 6, 1),
('2024-03-18', 2, 5, 'day', '08:00:00', '18:00:00', 'scheduled', 7, 1),
('2024-03-19', 1, NULL, 'day', '08:00:00', '16:00:00', 'scheduled', 5, 1);

-- Update foreign key references in raw_materials table
UPDATE raw_materials SET supplier_id = 1 WHERE id IN (1, 2, 4);
UPDATE raw_materials SET supplier_id = 2 WHERE id IN (3, 7, 9);
UPDATE raw_materials SET supplier_id = 3 WHERE id IN (10, 14, 15, 16);
UPDATE raw_materials SET supplier_id = 4 WHERE id IN (17, 18, 19);
UPDATE raw_materials SET supplier_id = 5 WHERE id IN (5, 6, 8, 11, 12, 13);