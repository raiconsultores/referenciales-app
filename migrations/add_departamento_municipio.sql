-- ============================================================
-- Migración: agregar columnas departamento y municipio
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

ALTER TABLE referenciales
  ADD COLUMN IF NOT EXISTS departamento text,
  ADD COLUMN IF NOT EXISTS municipio    text;

CREATE INDEX IF NOT EXISTS idx_ref_departamento ON referenciales (departamento);
CREATE INDEX IF NOT EXISTS idx_ref_municipio    ON referenciales (municipio);
