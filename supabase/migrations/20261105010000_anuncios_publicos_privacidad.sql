-- Anuncios públicos v2 (P9, spec §6.1 y §6.3): sin datos personales y con el interruptor de Configuración.
-- - Se quitan los campos que solo van en las slides (predicador, su foto y el contacto privado); la prueba
--   compara esta lista con las definiciones (`audience: 'slides'` y las imágenes).
-- - `enabled`: false si Configuración dice "Solo el equipo" (`publicPage = 'equipo'`); entonces sin anuncios.
-- Los permisos de la migración anterior se mantienen: create or replace no los cambia.
create or replace function public._public_notices_at(p_now timestamptz) returns jsonb
language sql stable security definer set search_path = ''
as $$
  with params as (
    select (p_now at time zone 'America/Santo_Domingo')::date::text as today
  ), config as (
    select s.data from public.settings s where s.id = 'configuracion' and s.deleted_at is null
  ), switch as (
    select coalesce((select data->>'publicPage' from config), 'todos') <> 'equipo' as enabled
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
          'values', coalesce(v.data->'values', '{}'::jsonb) - array['predicador', 'fotoPredicador', 'contacto'],
          'eventDate', v.data->'eventDate',
          'updatedAt', coalesce(v.data->'updatedAt', to_jsonb(v.updated_at)))
        order by v.data->>'eventDate' nulls last, v.id)
      from visible v
    ), '[]'::jsonb)
  )
$$;
