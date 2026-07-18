-- Sri Mahalakshmi Poultry AI ERP — Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. UNITS Table
CREATE TABLE IF NOT EXISTS units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Not In Use')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed static units (Max 4 Units)
INSERT INTO units (id, name, status) VALUES
(1, 'Unit 1', 'Active'),
(2, 'Unit 2', 'Active'),
(3, 'Unit 3', 'Active'),
(4, 'Unit 4', 'Active')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. SHEDS Table
CREATE TABLE IF NOT EXISTS sheds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id INT REFERENCES units(id) ON DELETE CASCADE,
    shed_number INT NOT NULL CHECK (shed_number BETWEEN 1 AND 12),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Not In Use')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unit_id, shed_number)
);

-- Seed 12 sheds for each unit
DO $$
DECLARE
    u_id INT;
    s_num INT;
BEGIN
    FOR u_id IN 1..4 LOOP
        FOR s_num IN 1..12 LOOP
            INSERT INTO sheds (unit_id, shed_number, status)
            VALUES (u_id, s_num, 'Active')
            ON CONFLICT (unit_id, shed_number) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 3. DAILY ENTRIES Table
CREATE TABLE IF NOT EXISTS daily_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    unit_id INT REFERENCES units(id) ON DELETE CASCADE,
    shed_number INT NOT NULL,
    
    -- Environmental conditions (Same across sheds of a unit for a given date)
    weather VARCHAR(50) DEFAULT 'Sunny',
    temperature NUMERIC(5,2), -- in °C
    humidity NUMERIC(5,2),    -- in %
    
    -- Bird Metrics
    opening_birds INT NOT NULL,
    mortality INT DEFAULT 0,
    culls INT DEFAULT 0,
    closing_birds INT NOT NULL,
    bird_age_weeks INT DEFAULT 20,
    uniformity NUMERIC(5,2), -- in %
    body_weight NUMERIC(7,2), -- average in grams
    
    -- Input Metrics
    feed_kg NUMERIC(8,2) NOT NULL, -- feed consumed in kg
    water_liters NUMERIC(8,2) NOT NULL, -- water consumed in liters
    
    -- Egg Metrics
    eggs_count INT NOT NULL,
    egg_weight_g NUMERIC(5,2) NOT NULL, -- average weight in grams
    eggs_broken INT DEFAULT 0,
    eggs_dirty INT DEFAULT 0,
    eggs_cracked INT DEFAULT 0,
    
    -- Treatment & Log
    medication TEXT DEFAULT '',
    remarks TEXT DEFAULT '',
    
    -- Calculated Metrics (Computed in backend code prior to insert/update, stored for indexing & efficiency)
    hd_pct NUMERIC(5,2),           -- Hen-Day Production %
    mortality_pct NUMERIC(5,2),    -- Mortality %
    feed_per_bird_g NUMERIC(6,2),  -- Feed consumed per bird in grams
    water_per_bird_ml NUMERIC(6,2),-- Water consumed per bird in ml
    fcr NUMERIC(5,2),              -- Feed Conversion Ratio
    water_to_feed_ratio NUMERIC(5,2),
    egg_mass_kg NUMERIC(8,2),      -- Total mass of eggs in kg
    broken_egg_pct NUMERIC(5,2),   -- Broken eggs / Total eggs %
    performance_score INT,         -- Dynamic Performance Score (0-100)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, unit_id, shed_number)
);

-- Index daily entries for query optimization
CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(date);
CREATE INDEX IF NOT EXISTS idx_daily_entries_unit_shed ON daily_entries(unit_id, shed_number);

-- 4. INVENTORY Table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL CHECK (category IN ('Feed', 'Medicines', 'Vaccines', 'Egg Trays', 'Packaging', 'Chemicals')),
    item_name VARCHAR(100) NOT NULL UNIQUE,
    stock_level NUMERIC(10,2) NOT NULL DEFAULT 0.0,
    reorder_level NUMERIC(10,2) NOT NULL DEFAULT 100.0,
    uom VARCHAR(20) NOT NULL, -- Unit of Measure: kg, bags, liters, vials, units, boxes
    supplier VARCHAR(100),
    expiry_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default inventory items
INSERT INTO inventory (category, item_name, stock_level, reorder_level, uom, supplier, expiry_date) VALUES
('Feed', 'Pre-Lay Feed', 2500.00, 500.00, 'kg', 'Kargil Feed Solutions', NULL),
('Feed', 'Layer Phase-1 Feed', 8500.00, 1500.00, 'kg', 'Kargil Feed Solutions', NULL),
('Medicines', 'Amprolium 9.6% Sol', 45.00, 10.00, 'liters', 'PVS Pharma', '2027-06-30'),
('Vaccines', 'Newcastle LaSota Strain', 25.00, 5.00, 'vials', 'Indovax Pvt Ltd', '2026-12-15'),
('Egg Trays', 'Molded Paper Trays (30 Eggs)', 4500.00, 1000.00, 'units', 'Sri Lakshmi Paper Mills', NULL),
('Packaging', 'Premium Egg Cartons (12 Eggs)', 1200.00, 300.00, 'units', 'Carton Packaging Inc', NULL),
('Chemicals', 'Virkon S Disinfectant', 80.00, 15.00, 'kg', 'Antec Intl', '2027-02-28')
ON CONFLICT (item_name) DO NOTHING;

-- 5. INVENTORY TRANSACTIONS Table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('Purchase', 'Consumption', 'Adjustment')),
    quantity NUMERIC(10,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference VARCHAR(100), -- Invoice Number, Shed Number, etc.
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger function to update stock levels on transaction
CREATE OR REPLACE FUNCTION update_inventory_stock_level()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type = 'Purchase' THEN
        UPDATE inventory 
        SET stock_level = stock_level + NEW.quantity, updated_at = NOW()
        WHERE id = NEW.inventory_id;
    ELSIF NEW.transaction_type = 'Consumption' THEN
        UPDATE inventory 
        SET stock_level = stock_level - NEW.quantity, updated_at = NOW()
        WHERE id = NEW.inventory_id;
    ELSIF NEW.transaction_type = 'Adjustment' THEN
        UPDATE inventory 
        SET stock_level = NEW.quantity, updated_at = NOW() -- Set direct stock
        WHERE id = NEW.inventory_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_inventory_stock
AFTER INSERT ON inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION update_inventory_stock_level();

-- 6. NOTIFICATIONS Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Owner', 'Supervisor', 'All')),
    type VARCHAR(20) NOT NULL DEFAULT 'Info' CHECK (type IN ('Alert', 'Warning', 'Info', 'Success')),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
