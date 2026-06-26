-- ============================================================
-- Actualizar departamento y municipio en registros existentes
-- Ejecutar DESPUÉS de add_departamento_municipio.sql
-- ============================================================

UPDATE referenciales
SET
  departamento = CASE
    -- Guatemala: municipios nombrados (antes que la regla zona numérica)
    WHEN zona ILIKE '%san juan sacatep%' OR zona ILIKE '%ciudad quetzal%'            THEN 'Guatemala'
    WHEN zona ILIKE '%mixco%'                                                         THEN 'Guatemala'
    WHEN zona ILIKE '%villa nueva%'       OR zona ILIKE '%villanueva%'                THEN 'Guatemala'
    WHEN zona ILIKE '%san miguel petapa%' OR zona ILIKE '%petapa%'                    THEN 'Guatemala'
    WHEN zona ILIKE '%villa canales%'                                                 THEN 'Guatemala'
    WHEN zona ILIKE '%santa catarina pinula%'                                         THEN 'Guatemala'
    WHEN zona ILIKE '%san jos%'           AND zona ILIKE '%pinula%'                   THEN 'Guatemala'
    WHEN zona ILIKE '%fraijanes%'                                                     THEN 'Guatemala'
    WHEN zona ILIKE '%amatitl%'                                                       THEN 'Guatemala'
    -- Zona numérica → Guatemala
    WHEN zona ~* 'zona\s+\d+'                                                        THEN 'Guatemala'
    -- Resto de departamentos
    WHEN zona ILIKE '%coatepeque%'                                                    THEN 'Quetzaltenango'
    WHEN zona ILIKE '%quetzaltenango%'    OR zona ILIKE '%xela%'                      THEN 'Quetzaltenango'
    WHEN zona ILIKE '%alta verapaz%'      OR zona ILIKE '%cobán%' OR zona ILIKE '%coban%' THEN 'Alta Verapaz'
    WHEN zona ILIKE '%sacatep%'           OR zona ILIKE '%antigua%'                   THEN 'Sacatepéquez'
    WHEN zona ILIKE '%chimaltenango%'                                                 THEN 'Chimaltenango'
    WHEN zona ILIKE '%escuintla%'         OR zona ILIKE '%palín%' OR zona ILIKE '%palin%' OR zona ILIKE '%tiquisate%' THEN 'Escuintla'
    WHEN zona ILIKE '%chiquimulilla%'                                                 THEN 'Santa Rosa'
    WHEN zona ILIKE '%santa rosa%'        OR zona ILIKE '%cuilapa%' OR zona ILIKE '%taxisco%' OR zona ILIKE '%oratorio%' THEN 'Santa Rosa'
    WHEN zona ILIKE '%zacapa%'                                                        THEN 'Zacapa'
    WHEN zona ILIKE '%esquipulas%'        OR zona ILIKE '%chiquimula%'                THEN 'Chiquimula'
    WHEN zona ILIKE '%huehuetenango%'                                                 THEN 'Huehuetenango'
    WHEN zona ILIKE '%retalhuleu%'                                                    THEN 'Retalhuleu'
    WHEN zona ILIKE '%mazatenango%'       OR zona ILIKE '%suchitep%'                  THEN 'Suchitepéquez'
    WHEN zona ILIKE '%flores%'            OR zona ILIKE '%san benito%' OR zona ILIKE '%petén%' OR zona ILIKE '%peten%' THEN 'Petén'
    ELSE NULL
  END,

  municipio = CASE
    -- Guatemala: específicos primero
    WHEN zona ILIKE '%san juan sacatep%'  OR zona ILIKE '%ciudad quetzal%'            THEN 'San Juan Sacatepéquez'
    WHEN zona ILIKE '%mixco%'                                                         THEN 'Mixco'
    WHEN zona ILIKE '%villa nueva%'       OR zona ILIKE '%villanueva%'                THEN 'Villa Nueva'
    WHEN zona ILIKE '%san miguel petapa%' OR zona ILIKE '%petapa%'                    THEN 'San Miguel Petapa'
    WHEN zona ILIKE '%villa canales%'                                                 THEN 'Villa Canales'
    WHEN zona ILIKE '%santa catarina pinula%'                                         THEN 'Santa Catarina Pinula'
    WHEN zona ILIKE '%san jos%'           AND zona ILIKE '%pinula%'                   THEN 'San José Pinula'
    WHEN zona ILIKE '%fraijanes%'                                                     THEN 'Fraijanes'
    WHEN zona ILIKE '%amatitl%'                                                       THEN 'Amatitlán'
    WHEN zona ~* 'zona\s+\d+'                                                        THEN 'Ciudad de Guatemala'
    -- Quetzaltenango
    WHEN zona ILIKE '%coatepeque%'                                                    THEN 'Coatepeque'
    WHEN zona ILIKE '%colomba%'                                                       THEN 'Colomba Costa Cuca'
    WHEN zona ILIKE '%san mateo%' AND (zona ILIKE '%quetzaltenango%' OR zona ILIKE '%xela%') THEN 'San Mateo'
    WHEN zona ILIKE '%quetzaltenango%'    OR zona ILIKE '%xela%'                      THEN 'Quetzaltenango'
    -- Alta Verapaz
    WHEN zona ILIKE '%carch%'                                                         THEN 'San Pedro Carchá'
    WHEN zona ILIKE '%cobán%' OR zona ILIKE '%coban%' OR zona ILIKE '%alta verapaz%'  THEN 'Cobán'
    -- Sacatepéquez
    WHEN zona ILIKE '%san lucas sacatep%'                                             THEN 'San Lucas Sacatepéquez'
    WHEN zona ILIKE '%santa luc%'         AND zona ILIKE '%milpas%'                   THEN 'Santa Lucía Milpas Altas'
    WHEN zona ILIKE '%antigua%'           OR zona ILIKE '%sacatep%'                   THEN 'Antigua Guatemala'
    -- Escuintla
    WHEN zona ILIKE '%palín%'             OR zona ILIKE '%palin%'                     THEN 'Palín'
    WHEN zona ILIKE '%tiquisate%'                                                     THEN 'Tiquisate'
    WHEN zona ILIKE '%escuintla%'                                                     THEN 'Escuintla'
    -- Santa Rosa (chiquimulilla antes de chiquimula)
    WHEN zona ILIKE '%chiquimulilla%'                                                 THEN 'Chiquimulilla'
    WHEN zona ILIKE '%cuilapa%'                                                       THEN 'Cuilapa'
    WHEN zona ILIKE '%taxisco%'                                                       THEN 'Taxisco'
    WHEN zona ILIKE '%oratorio%'                                                      THEN 'Oratorio'
    -- Chiquimula
    WHEN zona ILIKE '%esquipulas%'                                                    THEN 'Esquipulas'
    WHEN zona ILIKE '%chiquimula%'                                                    THEN 'Chiquimula'
    -- Suchitepéquez
    WHEN zona ILIKE '%mazatenango%'                                                   THEN 'Mazatenango'
    -- Petén
    WHEN zona ILIKE '%flores%'                                                        THEN 'Flores'
    WHEN zona ILIKE '%san benito%'                                                    THEN 'San Benito'
    ELSE NULL
  END;
