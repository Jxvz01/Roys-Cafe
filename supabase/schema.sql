-- ============================================
-- Roy's Cafe — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Categories table
CREATE TABLE IF NOT EXISTS categories (
    id   SERIAL PRIMARY KEY,
    name TEXT   NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Menu Items table
CREATE TABLE IF NOT EXISTS menu_items (
    id          UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    description TEXT    DEFAULT '',
    price       TEXT    NOT NULL,
    tag         TEXT    DEFAULT '',
    image_url   TEXT    DEFAULT '',
    display_order INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. Gallery Images table
CREATE TABLE IF NOT EXISTS gallery_images (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url        TEXT NOT NULL,
    alt        TEXT DEFAULT 'Cafe Image',
    storage_path TEXT DEFAULT '',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Row Level Security ──────────────────────
ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone visiting the site)
CREATE POLICY "public_read_categories"     ON categories     FOR SELECT USING (true);
CREATE POLICY "public_read_menu_items"     ON menu_items     FOR SELECT USING (true);
CREATE POLICY "public_read_gallery_images" ON gallery_images FOR SELECT USING (true);

-- Authenticated write access (admin only)
CREATE POLICY "auth_manage_categories"     ON categories     FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_manage_menu_items"     ON menu_items     FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_manage_gallery_images" ON gallery_images FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ── Seed default data (optional) ────────────
INSERT INTO categories (name, display_order) VALUES
    ('Coffee',   1),
    ('Tea',      2),
    ('Pastries', 3)
ON CONFLICT (name) DO NOTHING;
