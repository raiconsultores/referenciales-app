-- ============================================================
-- Paso 1: Renombrar zona → descripcion, agregar zona limpia
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- Eliminar el índice que apunta a la columna que vamos a renombrar
DROP INDEX IF EXISTS idx_ref_zona;

-- Renombrar zona → descripcion
ALTER TABLE referenciales RENAME COLUMN zona TO descripcion;

-- Crear índice sobre descripcion
CREATE INDEX IF NOT EXISTS idx_ref_descripcion ON referenciales (descripcion);

-- Agregar la nueva columna zona (zona limpia extraída de descripcion)
ALTER TABLE referenciales ADD COLUMN IF NOT EXISTS zona text;

CREATE INDEX IF NOT EXISTS idx_ref_zona ON referenciales (zona);
