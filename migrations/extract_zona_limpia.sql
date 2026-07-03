-- ============================================================
-- Paso 2: Extraer zona limpia desde descripcion
-- Ejecutar DESPUÉS de rename_zona_to_descripcion.sql
-- ============================================================

UPDATE referenciales
SET zona = CASE
  -- "km. X" o "km X" → "Km. X"
  WHEN descripcion ~* 'km\.?\s+(\d+(?:[.,]\d+)?)'
    THEN 'Km. ' || replace(
           (regexp_match(descripcion, 'km\.?\s+(\d+(?:[.,]\d+)?)', 'i'))[1],
           ',', '.'
         )
  -- "zona X" → "Zona X"
  WHEN descripcion ~* 'zona\s+(\d+)'
    THEN 'Zona ' || (regexp_match(descripcion, 'zona\s+(\d+)', 'i'))[1]
  -- Sin zona ni km → NULL
  ELSE NULL
END
WHERE zona IS NULL;
