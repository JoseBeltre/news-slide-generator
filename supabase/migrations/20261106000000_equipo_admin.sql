-- Equipo con rol (§8.5): solo un admin añade o quita personas; el resto del equipo solo ve la lista.
-- El rol admin se da a mano en el proyecto (SQL), nunca aquí ni desde la app: el repositorio es público.
-- Un admin añade siempre como editor; nadie cambia roles con la API (no hay permiso de UPDATE).

alter table public.editors
  add column role text not null default 'editor' check (role in ('editor', 'admin'));

create function public.is_team_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.editors
    where email = lower(coalesce(auth.jwt() ->> 'email', '')) and role = 'admin'
  )
$$;

revoke all on function public.is_team_admin() from public, anon, authenticated;
grant execute on function public.is_team_admin() to authenticated;

drop policy editors_add on public.editors;
create policy editors_add on public.editors for insert to authenticated
  with check (public.is_team_admin() and role = 'editor');

-- Nadie se quita a sí mismo: el equipo nunca queda vacío por accidente.
drop policy editors_remove on public.editors;
create policy editors_remove on public.editors for delete to authenticated
  using (public.is_team_admin() and email <> lower(coalesce(auth.jwt() ->> 'email', '')));
