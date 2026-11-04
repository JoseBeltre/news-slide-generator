-- P8 · Sincronización local-first (SRS §8.4, §8.5, RNF-11).
-- Una sola iglesia. Solo los correos de `editors` leen y escriben. Cada tabla guarda el registro de
-- Dexie como documento jsonb; `updated_at` (hora de la edición en el equipo) decide los conflictos y
-- `synced_at` (hora de llegada) es el cursor para bajar cambios.
-- El primer editor se inserta a mano en el proyecto, nunca aquí: el repositorio es público.

-- ---------- Equipo ----------
create table public.editors (
  email text primary key check (email = lower(email)),
  added_by text default lower(auth.jwt() ->> 'email'),
  added_at timestamptz not null default now()
);

create function public.is_editor() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.editors where email = lower(coalesce(auth.jwt() ->> 'email', '')))
$$;

alter table public.editors enable row level security;
create policy editors_read on public.editors for select to authenticated using (public.is_editor());
create policy editors_add on public.editors for insert to authenticated with check (public.is_editor());
-- Nadie se quita a sí mismo: el equipo nunca queda vacío por accidente.
create policy editors_remove on public.editors for delete to authenticated
  using (public.is_editor() and email <> lower(coalesce(auth.jwt() ->> 'email', '')));
-- Supabase da todos los privilegios por defecto y RLS no cubre TRUNCATE: se quitan y se da solo lo justo.
revoke all on public.editors from public, anon, authenticated;
grant select, insert, delete on public.editors to authenticated;

-- ---------- Tablas sincronizadas ----------
do $$
declare t text;
begin
  foreach t in array array['announcements', 'ministries', 'images', 'presentations', 'themes', 'settings'] loop
    execute format(
      'create table public.%I (
         id text primary key,
         data jsonb not null,
         updated_at timestamptz not null,
         deleted_at timestamptz,
         synced_at timestamptz not null default clock_timestamp()
       )', t);
    execute format('create index %I on public.%I (synced_at)', t || '_synced_at_idx', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy editors_select on public.%I for select to authenticated using (public.is_editor())', t);
    execute format('create policy editors_insert on public.%I for insert to authenticated with check (public.is_editor())', t);
    execute format('create policy editors_update on public.%I for update to authenticated using (public.is_editor()) with check (public.is_editor())', t);
    -- Sin delete: los borrados son lógicos (deleted_at) para que se propaguen.
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update on public.%I to authenticated', t);
  end loop;
end $$;

-- Sube un lote. Solo reemplaza si la edición que llega es más nueva que la guardada.
create function public.sync_push(p_table text, p_rows jsonb) returns integer
language plpgsql security invoker set search_path = ''
as $$
declare n integer;
begin
  if p_table is null or p_table not in ('announcements', 'ministries', 'images', 'presentations', 'themes', 'settings') then
    raise exception 'tabla no sincronizable: %', p_table using errcode = '22023';
  end if;
  execute format($f$
    with input as (
      select * from jsonb_to_recordset($1) as r(id text, data jsonb, updated_at timestamptz, deleted_at timestamptz)
    ), up as (
      insert into public.%1$I as t (id, data, updated_at, deleted_at, synced_at)
      select id, data, updated_at, deleted_at, clock_timestamp() from input
      on conflict (id) do update
        set data = excluded.data, updated_at = excluded.updated_at, deleted_at = excluded.deleted_at, synced_at = clock_timestamp()
        where excluded.updated_at > t.updated_at
      returning 1
    )
    select count(*)::integer from up
  $f$, p_table) into n using p_rows;
  return n;
end $$;
revoke all on function public.sync_push(text, jsonb) from public, anon;
grant execute on function public.sync_push(text, jsonb) to authenticated;

-- ---------- Funciones para anon ----------
-- Keep-alive (.github/workflows/keep-alive.yml): evita la pausa del plan gratuito.
create function public.ping() returns integer language sql stable as $$ select 1 $$;
grant execute on function public.ping() to anon, authenticated;

-- La pantalla Entrar avisa antes de pedir el código si el correo no es del equipo.
create function public.can_sign_in(p_email text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.editors where email = lower(trim(p_email)))
$$;
grant execute on function public.can_sign_in(text) to anon, authenticated;

-- ---------- Auth hook: before user created ----------
-- Activar en el panel: Authentication → Hooks → Before User Created → public.before_user_created.
create function public.before_user_created(event jsonb) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select case
    when exists (select 1 from public.editors where email = lower(trim(event -> 'user' ->> 'email'))) then '{}'::jsonb
    else jsonb_build_object('error', jsonb_build_object(
      'message', 'Este correo no está en el equipo de Anuncios del Sábado.', 'http_code', 403))
  end
$$;
revoke all on function public.before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.before_user_created(jsonb) to supabase_auth_admin;

-- ---------- Storage: imágenes ----------
-- Privado: solo el equipo. La ruta es la `storagePath` del cliente (images/<sha256>.<ext>).
insert into storage.buckets (id, name, public) values ('images', 'images', false) on conflict (id) do nothing;
create policy images_editors_read on storage.objects for select to authenticated
  using (bucket_id = 'images' and public.is_editor());
create policy images_editors_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and public.is_editor());
