-- Lo mínimo de Supabase para probar las migraciones en PGlite (tests/unit/db): roles, auth.jwt()
-- leyendo los claims de la petición y las dos tablas de Storage que usan las políticas.
-- Nunca se aplica al proyecto real: allí todo esto ya existe.
create role anon nologin;
create role authenticated nologin;
create role supabase_auth_admin nologin;
grant usage on schema public to anon, authenticated, supabase_auth_admin;
-- Como Supabase: todo lo nuevo en public nace con todos los privilegios para anon y authenticated.
-- Las migraciones deben quitarlos explícitamente (RLS no cubre TRUNCATE).
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;

create schema auth;
grant usage on schema auth to anon, authenticated, supabase_auth_admin;
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
grant execute on function auth.jwt() to anon, authenticated, supabase_auth_admin;

create schema storage;
grant usage on schema storage to anon, authenticated;
create table storage.buckets (id text primary key, name text not null, public boolean default false);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets, name text);
alter table storage.objects enable row level security;
grant select, insert on storage.objects to anon, authenticated;
