-- Anuncios públicos (P9, §8.5, RF-70…75): la página /anuncios/publico pide los anuncios vigentes sin sesión.
-- Solo campos públicos: nunca las notas del presentador, los autores ni las fotos; nunca cumpleaños
-- (nombres de miembros) ni flyers. "Hoy" es el de Santo Domingo.

-- La interna recibe la hora para poder probarla; anon no la puede ejecutar, así no pide otra fecha.
create function public._public_notices_at(p_now timestamptz) returns jsonb
language sql stable security definer set search_path = ''
as $$
  with params as (
    select (p_now at time zone 'America/Santo_Domingo')::date::text as today
  ), visible as (
    select a.id, a.data, a.updated_at
    from public.announcements a, params p
    where a.deleted_at is null
      and coalesce(a.data->>'status', '') <> 'borrador'
      and coalesce(a.data->>'typeId', '') not in ('cumpleanos', 'imagen')
      and coalesce((a.data->>'showPublic')::boolean, true)
      and (a.data->>'eventDate' is null or a.data->>'eventDate' >= p.today)
  )
  select jsonb_build_object(
    'today', (select today from params),
    'settings', coalesce((
      select jsonb_strip_nulls(jsonb_build_object(
        'timeFormat', s.data->'timeFormat',
        'currency', s.data->'currency',
        'dateStyle', s.data->'dateStyle'))
      from public.settings s
      where s.id = 'configuracion' and s.deleted_at is null
    ), '{}'::jsonb),
    'notices', coalesce((
      select jsonb_agg(jsonb_build_object(
          'id', v.id,
          'typeId', v.data->'typeId',
          -- Claves de imagen de los tipos publicables (la prueba las compara con las definiciones).
          'values', coalesce(v.data->'values', '{}'::jsonb) - array['fotoPredicador'],
          'eventDate', v.data->'eventDate',
          'updatedAt', coalesce(v.data->'updatedAt', to_jsonb(v.updated_at)))
        order by v.data->>'eventDate' nulls last, v.id)
      from visible v
    ), '[]'::jsonb)
  )
$$;

create function public.public_notices() returns jsonb
language sql stable security definer set search_path = ''
as $$ select public._public_notices_at(now()) $$;

revoke all on function public._public_notices_at(timestamptz) from public, anon, authenticated;
revoke all on function public.public_notices() from public, anon, authenticated;
grant execute on function public.public_notices() to anon, authenticated;
