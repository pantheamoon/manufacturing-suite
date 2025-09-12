-- Manufacturing Operations Suite Database Schema
-- Core Manufacturing System for Cosmetics/Beauty Products

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'production_manager', 'quality_control', 'procurement', 'operator')),
    tenant_id INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tenants (Multi-tenant support)
CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subscription_type TEXT DEFAULT 'basic' CHECK (subscription_type IN ('basic', 'premium', 'enterprise')),
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products and Formulations
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('skincare', 'makeup', 'fragrance', 'haircare', 'bodycare')),
    shelf_life_days INTEGER DEFAULT 730,
    batch_size_liters REAL DEFAULT 100.0,
    is_active BOOLEAN DEFAULT true,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Raw Materials and Ingredients
CREATE TABLE IF NOT EXISTS raw_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    supplier_id INTEGER,
    category TEXT NOT NULL CHECK (category IN ('active', 'base', 'preservative', 'fragrance', 'colorant', 'packaging')),
    unit_of_measure TEXT DEFAULT 'kg' CHECK (unit_of_measure IN ('kg', 'L', 'pieces', 'ml', 'g')),
    cost_per_unit REAL DEFAULT 0.0,
    reorder_point REAL DEFAULT 0.0,
    safety_stock REAL DEFAULT 0.0,
    shelf_life_days INTEGER DEFAULT 365,
    storage_temp_min REAL,
    storage_temp_max REAL,
    is_active BOOLEAN DEFAULT true,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Bill of Materials (BOM)
CREATE TABLE IF NOT EXISTS bom_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    raw_material_id INTEGER NOT NULL,
    quantity_per_batch REAL NOT NULL,
    percentage REAL,
    is_critical BOOLEAN DEFAULT false,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Inventory Management (FEFO - First Expired First Out)
CREATE TABLE IF NOT EXISTS inventory_lots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_material_id INTEGER NOT NULL,
    lot_number TEXT NOT NULL,
    quantity_available REAL NOT NULL DEFAULT 0,
    quantity_reserved REAL NOT NULL DEFAULT 0,
    unit_cost REAL DEFAULT 0.0,
    expiry_date DATE NOT NULL,
    received_date DATE DEFAULT (date('now')),
    supplier_batch_number TEXT,
    quality_status TEXT DEFAULT 'approved' CHECK (quality_status IN ('quarantine', 'approved', 'rejected', 'expired')),
    location TEXT DEFAULT 'warehouse',
    tenant_id INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    UNIQUE(raw_material_id, lot_number, tenant_id)
);

-- Production Lines and Equipment
CREATE TABLE IF NOT EXISTS production_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    capacity_liters_per_hour REAL DEFAULT 100.0,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'down')),
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Electronic Batch Records (EBR)
CREATE TABLE IF NOT EXISTS batch_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_number TEXT UNIQUE NOT NULL,
    product_id INTEGER NOT NULL,
    production_line_id INTEGER,
    planned_quantity REAL NOT NULL,
    actual_quantity REAL DEFAULT 0,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'quality_hold', 'approved', 'rejected', 'shipped')),
    planned_start_date DATETIME,
    actual_start_date DATETIME,
    planned_end_date DATETIME,
    actual_end_date DATETIME,
    operator_id INTEGER,
    supervisor_id INTEGER,
    qa_approved_by INTEGER,
    qa_approved_at DATETIME,
    notes TEXT,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (production_line_id) REFERENCES production_lines(id),
    FOREIGN KEY (operator_id) REFERENCES users(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id),
    FOREIGN KEY (qa_approved_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Batch Material Consumption
CREATE TABLE IF NOT EXISTS batch_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    raw_material_id INTEGER NOT NULL,
    lot_id INTEGER NOT NULL,
    planned_quantity REAL NOT NULL,
    actual_quantity REAL DEFAULT 0,
    consumed_at DATETIME,
    operator_id INTEGER,
    notes TEXT,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batch_records(id),
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id),
    FOREIGN KEY (lot_id) REFERENCES inventory_lots(id),
    FOREIGN KEY (operator_id) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Production Steps and Process Control
CREATE TABLE IF NOT EXISTS production_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    description TEXT,
    temperature_setpoint REAL,
    temperature_actual REAL,
    time_duration_minutes INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    started_at DATETIME,
    completed_at DATETIME,
    operator_id INTEGER,
    notes TEXT,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batch_records(id),
    FOREIGN KEY (operator_id) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Quality Control Testing
CREATE TABLE IF NOT EXISTS qc_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    test_type TEXT NOT NULL CHECK (test_type IN ('viscosity', 'ph', 'color', 'odor', 'microbial', 'stability', 'packaging')),
    specification_min REAL,
    specification_max REAL,
    actual_result REAL,
    text_result TEXT,
    pass_fail TEXT CHECK (pass_fail IN ('pass', 'fail', 'pending')),
    test_method TEXT,
    tested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    technician_id INTEGER,
    approved_by INTEGER,
    approved_at DATETIME,
    notes TEXT,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batch_records(id),
    FOREIGN KEY (technician_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Suppliers Management
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    country TEXT,
    certification_type TEXT CHECK (certification_type IN ('organic', 'kosher', 'halal', 'ecocert', 'none')),
    quality_rating INTEGER DEFAULT 5 CHECK (quality_rating BETWEEN 1 AND 5),
    delivery_rating INTEGER DEFAULT 5 CHECK (delivery_rating BETWEEN 1 AND 5),
    cost_rating INTEGER DEFAULT 5 CHECK (cost_rating BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT true,
    last_audit_date DATE,
    next_audit_date DATE,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_number TEXT UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'acknowledged', 'shipped', 'received', 'cancelled')),
    order_date DATE DEFAULT (date('now')),
    requested_delivery_date DATE,
    actual_delivery_date DATE,
    total_amount REAL DEFAULT 0.0,
    currency TEXT DEFAULT 'USD',
    created_by INTEGER,
    approved_by INTEGER,
    approved_at DATETIME,
    notes TEXT,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Purchase Order Line Items
CREATE TABLE IF NOT EXISTS po_line_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_id INTEGER NOT NULL,
    raw_material_id INTEGER NOT NULL,
    quantity_ordered REAL NOT NULL,
    quantity_received REAL DEFAULT 0,
    unit_price REAL NOT NULL,
    line_total REAL GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED,
    delivery_date DATE,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Stock Transactions (Audit Trail)
CREATE TABLE IF NOT EXISTS stock_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_material_id INTEGER NOT NULL,
    lot_id INTEGER,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receipt', 'consumption', 'adjustment', 'transfer', 'waste')),
    quantity REAL NOT NULL,
    reference_type TEXT CHECK (reference_type IN ('purchase_order', 'batch_record', 'adjustment', 'transfer')),
    reference_id INTEGER,
    notes TEXT,
    created_by INTEGER,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id),
    FOREIGN KEY (lot_id) REFERENCES inventory_lots(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Production Schedule
CREATE TABLE IF NOT EXISTS production_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_date DATE NOT NULL,
    production_line_id INTEGER NOT NULL,
    batch_id INTEGER,
    shift TEXT CHECK (shift IN ('day', 'night', 'both')),
    planned_start_time TIME,
    planned_end_time TIME,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    notes TEXT,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (production_line_id) REFERENCES production_lines(id),
    FOREIGN KEY (batch_id) REFERENCES batch_records(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- System Alerts and Notifications
CREATE TABLE IF NOT EXISTS system_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'expiry_warning', 'quality_issue', 'maintenance_due', 'batch_delay')),
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT CHECK (entity_type IN ('batch', 'inventory', 'equipment', 'supplier')),
    entity_id INTEGER,
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    assigned_to INTEGER,
    tenant_id INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_batch_records_status ON batch_records(status);
CREATE INDEX IF NOT EXISTS idx_batch_records_product ON batch_records(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_expiry ON inventory_lots(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_material ON inventory_lots(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_production_schedule_date ON production_schedule(schedule_date);
CREATE INDEX IF NOT EXISTS idx_qc_tests_batch ON qc_tests(batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_material ON stock_transactions(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON system_alerts(is_read, severity);