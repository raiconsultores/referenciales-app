-- ============================================================
-- Fotos de Referenciales RAI — tabla + bucket de Storage
-- Ejecutar en: Supabase > SQL Editor
--
-- Bucket PRIVADO: solo usuarios autenticados pueden subir/ver fotos.
-- La app genera URLs firmadas (1 hora) al vuelo, no usa URLs públicas.
-- Este script es seguro de volver a correr (idempotente) — incluye la
-- migración desde la versión anterior (bucket público + columna `url`).
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tabla de fotos
-- ------------------------------------------------------------
create table if not exists referenciales_rai_fotos (
  id             uuid        primary key default gen_random_uuid(),
  referencial_id uuid        not null references referenciales_rai(id) on delete cascade,
  path           text        not null, -- ruta del objeto en Storage (no la URL)
  nombre         text,
  orden          integer     not null default 1,
  created_at     timestamptz not null default now()
);

-- Migración: si la tabla venía de la versión con URL pública, renombrar la columna
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'referenciales_rai_fotos' and column_name = 'url'
  ) and not exists (
    select 1 from information_schema.columns
    where table_name = 'referenciales_rai_fotos' and column_name = 'path'
  ) then
    alter table referenciales_rai_fotos rename column url to path;
  end if;
end $$;

create index if not exists idx_rai_fotos_referencial_id on referenciales_rai_fotos (referencial_id);
create index if not exists idx_rai_fotos_orden          on referenciales_rai_fotos (referencial_id, orden);

-- Row Level Security — solo usuarios autenticados
alter table referenciales_rai_fotos enable row level security;

drop policy if exists "Public access" on referenciales_rai_fotos;
drop policy if exists "Authenticated access" on referenciales_rai_fotos;
create policy "Authenticated access" on referenciales_rai_fotos
  for all
  to authenticated
  using (true)
  with check (true);

-- ------------------------------------------------------------
-- Bucket de Storage — PRIVADO (las fotos se sirven vía signed URL)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'referenciales-rai-fotos',
  'referenciales-rai-fotos',
  false,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public             = false,
  file_size_limit    = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

-- Políticas de acceso al bucket (storage.objects) — solo usuarios autenticados
drop policy if exists "Public read referenciales-rai-fotos"   on storage.objects;
drop policy if exists "Public insert referenciales-rai-fotos" on storage.objects;
drop policy if exists "Public delete referenciales-rai-fotos" on storage.objects;
drop policy if exists "Authenticated read referenciales-rai-fotos"   on storage.objects;
drop policy if exists "Authenticated insert referenciales-rai-fotos" on storage.objects;
drop policy if exists "Authenticated delete referenciales-rai-fotos" on storage.objects;

create policy "Authenticated read referenciales-rai-fotos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'referenciales-rai-fotos');

create policy "Authenticated insert referenciales-rai-fotos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'referenciales-rai-fotos');

create policy "Authenticated delete referenciales-rai-fotos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'referenciales-rai-fotos');
