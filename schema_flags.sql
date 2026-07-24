-- ============================================================
-- Reportes / flags de corrección — Referenciales Externos
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists referenciales_flags (
  id             uuid        primary key default gen_random_uuid(),
  referencial_id uuid        not null references referenciales(id) on delete cascade,
  motivo         text        not null check (motivo in (
                                'Coordenadas incorrectas', 'Precio erróneo',
                                'Datos incompletos', 'Duplicado', 'Otro'
                              )),
  comentario     text,
  estado         text        not null default 'Pendiente' check (estado in ('Pendiente', 'Revisado', 'Corregido')),
  created_at     timestamptz not null default now()
);

create index if not exists idx_flags_referencial_id on referenciales_flags (referencial_id);
create index if not exists idx_flags_estado         on referenciales_flags (estado);
create index if not exists idx_flags_created_at     on referenciales_flags (created_at desc);

-- Row Level Security — acceso público (ajustar con auth en producción)
alter table referenciales_flags enable row level security;

drop policy if exists "Public access" on referenciales_flags;
create policy "Public access" on referenciales_flags
  for all
  to anon, authenticated
  using (true)
  with check (true);
