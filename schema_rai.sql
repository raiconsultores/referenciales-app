-- ============================================================
-- Referenciales RAI — Guatemala
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists referenciales_rai (
  id                     uuid          primary key default gen_random_uuid(),
  no_avaluo              text,
  fecha_captura          date,
  tipo                   text          not null check (tipo in ('Casa', 'Apartamento', 'Terreno', 'Comercio', 'Oficina')),
  direccion_original     text          not null,
  calle_avenida_numero   text,
  calle_avenida          text,
  numero                 text,
  zona                   text,
  colonia                text,
  municipio              text,
  departamento           text,
  lat                    numeric(9,6),
  lng                    numeric(9,6),
  m2_terreno             numeric(10,2) check (m2_terreno > 0),
  m2_construccion        numeric(10,2) check (m2_construccion > 0),
  habitaciones           integer       check (habitaciones >= 0),
  banos                  integer       check (banos >= 0),
  parqueos               integer       check (parqueos >= 0),
  antiguedad             integer       check (antiguedad >= 0),
  estado_conservacion    text          check (estado_conservacion in ('Excelente', 'Bueno', 'Regular', 'Malo')),
  moneda                 text          check (moneda in ('GTQ', 'USD')),
  precio_original        numeric(14,2) check (precio_original >= 0),
  tipo_cambio            numeric(8,4),
  -- Calculado en la aplicación al guardar (GTQ = precio_original; USD = precio_original * tipo_cambio)
  precio_quetzales       numeric(14,2) check (precio_quetzales >= 0),
  -- Columnas calculadas automáticamente por Postgres
  precio_m2_terreno      numeric(14,2) generated always as (
    case when m2_terreno is not null and m2_terreno > 0
         then round(precio_quetzales / m2_terreno, 2)
         else null end
  ) stored,
  precio_m2_construccion numeric(14,2) generated always as (
    case when m2_construccion is not null and m2_construccion > 0
         then round(precio_quetzales / m2_construccion, 2)
         else null end
  ) stored,
  fuente                 text,
  contacto               text,
  url                    text,
  observaciones          text,
  created_at             timestamptz   not null default now()
);

-- Índices para filtros frecuentes
create index if not exists idx_rai_tipo         on referenciales_rai (tipo);
create index if not exists idx_rai_zona         on referenciales_rai (zona);
create index if not exists idx_rai_colonia      on referenciales_rai (colonia);
create index if not exists idx_rai_departamento on referenciales_rai (departamento);
create index if not exists idx_rai_municipio    on referenciales_rai (municipio);
create index if not exists idx_rai_no_avaluo    on referenciales_rai (no_avaluo);
create index if not exists idx_rai_created_at   on referenciales_rai (created_at desc);

-- Row Level Security — acceso público (ajustar con auth en producción)
alter table referenciales_rai enable row level security;

drop policy if exists "Public access" on referenciales_rai;
create policy "Public access" on referenciales_rai
  for all
  to anon, authenticated
  using (true)
  with check (true);
