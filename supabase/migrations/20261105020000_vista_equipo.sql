-- Vista del equipo (P9, spec §6.5): la página /anuncios/publico, abierta con la sesión del equipo, trae
-- también lo que solo va en las slides (predicador y contacto privado; la foto nunca, vive en el almacenamiento
-- privado) y no mira el interruptor de Configuración.
-- Una sola consulta para las dos vistas: `_notices_at(p_now, p_team)`; la pública la llama con false.

create function public._notices_at(p_now timestamptz, p_team boolean) returns jsonb
language sql stable security definer set search_path = ''
as $$
  with params as (
    select (p_now at time zone 'America/Santo_Domingo')::date::text as today
  ), config as (
    select s.data from public.settings s where s.id = 'configuracion' and s.deleted_at is null
  ), switch as (
    select p_team or coalesce((select data->>'publicPage' from config), 'todos') <> 'equipo' as enabled
  ), visible as (
    select a.id, a.data, a.updated_at
    from public.announcements a, params p, switch w
    where w.enabled
      and a.deleted_at is null
      and coalesce(a.data->>'status', '') <> 'borrador'
      and coalesce(a.data->>'typeId', '') not in ('cumpleanos', 'imagen')
      and coalesce((a.data->>'showPublic')::boolean, true)
      and (a.data->>'eventDate' is null or a.data->>'eventDate' >= p.today)
  )
  select jsonb_build_object(
    'today', (select today from params),
    'enabled', (select enabled from switch),
    'settings', coalesce((
      select jsonb_strip_nulls(jsonb_build_object(
        'timeFormat', c.data->'timeFormat',
        'currency', c.data->'currency',
        'dateStyle', c.data->'dateStyle'))
      from config c
    ), '{}'::jsonb),
    'notices', coalesce((
      select jsonb_agg(jsonb_build_object(
          'id', v.id,
          'typeId', v.data->'typeId',
          -- Fuera siempre la foto; para la congregación, además, los campos de solo slides (la prueba
          -- compara esta lista con las definiciones: `audience: 'slides'` y las imágenes).
          'values', coalesce(v.data->'values', '{}'::jsonb)
            - (case when p_team then array['fotoPredicador'] else array['predicador', 'fotoPredicador', 'contacto'] end),
          'eventDate', v.data->'eventDate',
          'updatedAt', coalesce(v.data->'updatedAt', to_jsonb(v.updated_at)))
        order by v.data->>'eventDate' nulls last, v.id)
      from visible v
    ), '[]'::jsonb)
  )
$$;

create or replace function public._public_notices_at(p_now timestamptz) returns jsonb
language sql stable security definer set search_path = ''
as $$ select public._notices_at(p_now, false) $$;

create function public._team_notices_at(p_now timestamptz) returns jsonb
language sql stable security definer set search_path = ''
as $$ select public._notices_at(p_now, true) $$;

-- Solo un editor: con sesión pero fuera del equipo, error (PostgREST responde 403 y la página usa la pública).
create function public.team_notices() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_editor() then
    raise exception 'Solo el equipo puede ver esta vista' using errcode = '42501';
  end if;
  return public._team_notices_at(now());
end
$$;

revoke all on function public._notices_at(timestamptz, boolean) from public, anon, authenticated;
revoke all on function public._team_notices_at(timestamptz) from public, anon, authenticated;
revoke all on function public.team_notices() from public, anon, authenticated;
grant execute on function public.team_notices() to authenticated;
