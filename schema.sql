-- ============================================================
-- Referenciales Inmobiliarios — Guatemala
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- Habilitar extensión UUID si no está activa
create extension if not exists "pgcrypto";

create table if not exists referenciales (
  id                     uuid          primary key default gen_random_uuid(),
  tipo                   text          not null check (tipo in ('Casa', 'Apartamento', 'Terreno')),
  zona                   text          not null,
  direccion              text          not null,
  precio_total           numeric(14,2) not null check (precio_total >= 0),
  m2_terreno             numeric(10,2) check (m2_terreno > 0),
  m2_construccion        numeric(10,2) check (m2_construccion > 0),
  -- Columnas calculadas automáticamente por Postgres
  precio_m2_terreno      numeric(14,2) generated always as (
    case when m2_terreno is not null and m2_terreno > 0
         then round(precio_total / m2_terreno, 2)
         else null end
  ) stored,
  precio_m2_construccion numeric(14,2) generated always as (
    case when m2_construccion is not null and m2_construccion > 0
         then round(precio_total / m2_construccion, 2)
         else null end
  ) stored,
  fecha                  text          not null,
  lat                    numeric(9,6),
  lng                    numeric(9,6),
  observaciones          text,
  created_at             timestamptz   not null default now()
);

-- Índices para filtros frecuentes
create index if not exists idx_ref_tipo       on referenciales (tipo);
create index if not exists idx_ref_zona       on referenciales (zona);
create index if not exists idx_ref_created_at on referenciales (created_at desc);

-- Row Level Security — acceso público (ajustar con auth en producción)
alter table referenciales enable row level security;

drop policy if exists "Public access" on referenciales;
create policy "Public access" on referenciales
  for all
  to anon, authenticated
  using (true)
  with check (true);
