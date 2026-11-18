-- =====================================================================
-- RBAC + RLS base para Coldwork ERP.
-- Patrón: rol en tabla user_roles -> inyectado al JWT como claim app_role
-- por un Custom Access Token Hook -> evaluado en políticas RLS.
-- =====================================================================

create type public.app_role as enum ('admin', 'supervisor', 'tecnico', 'operador_packing', 'lectura');

create table public.plantas (
  id     uuid primary key default gen_random_uuid(),
  nombre text not null
);

create table public.user_roles (
  user_id   uuid not null references auth.users (id) on delete cascade,
  role      public.app_role not null,
  planta_id uuid references public.plantas (id),  -- null = todas las plantas
  primary key (user_id)
);

create table public.equipos (
  id                    uuid primary key default gen_random_uuid(),
  codigo                text not null unique,
  tipo                  text not null,          -- cámara, túnel, chiller...
  planta_id             uuid not null references public.plantas (id),
  temperatura_objetivo  numeric(5, 2) not null,
  created_at            timestamptz not null default now()
);

-- RLS activado y FORZADO en todas las tablas de negocio (deny-by-default).
alter table public.plantas    enable row level security;
alter table public.user_roles enable row level security;
alter table public.equipos    enable row level security;
alter table public.equipos    force  row level security;

-- ---------------------------------------------------------------------
-- Custom Access Token Hook: añade app_role y planta_id al JWT.
-- Activar en Dashboard > Authentication > Hooks (o config.toml local).
-- ---------------------------------------------------------------------
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb := event -> 'claims';
  r      record;
begin
  select role, planta_id into r from public.user_roles where user_id = (event ->> 'user_id')::uuid;
  claims := jsonb_set(claims, '{app_role}',  coalesce(to_jsonb(r.role), 'null'::jsonb));
  claims := jsonb_set(claims, '{planta_id}', coalesce(to_jsonb(r.planta_id), 'null'::jsonb));
  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
grant select on table public.user_roles to supabase_auth_admin;

create policy "auth_admin_lee_roles" on public.user_roles
  as permissive for select to supabase_auth_admin using (true);

-- ---------------------------------------------------------------------
-- Helpers: leen el claim del JWT (sin consulta extra por fila).
-- ---------------------------------------------------------------------
create or replace function public.jwt_role() returns public.app_role
language sql stable as $$
  select nullif(auth.jwt() ->> 'app_role', '')::public.app_role
$$;

create or replace function public.jwt_planta() returns uuid
language sql stable as $$
  select nullif(auth.jwt() ->> 'planta_id', '')::uuid
$$;

-- ---------------------------------------------------------------------
-- Políticas
-- ---------------------------------------------------------------------
create policy "usuario_ve_su_rol" on public.user_roles
  for select to authenticated using (user_id = (select auth.uid()));

create policy "plantas_lectura" on public.plantas
  for select to authenticated
  using ((select public.jwt_role()) is not null);

-- Lectura: cualquier rol, limitado a su planta (admin/supervisor sin planta = todas).
create policy "equipos_select" on public.equipos
  for select to authenticated
  using (
    (select public.jwt_role()) is not null
    and ((select public.jwt_planta()) is null or planta_id = (select public.jwt_planta()))
  );

-- Escritura: solo admin y supervisor, y también acotada a su planta.
-- (No se usa "for all": se sumaría a SELECT y ampliaría la lectura por OR de políticas.)
create policy "equipos_insert" on public.equipos
  for insert to authenticated
  with check (
    (select public.jwt_role()) in ('admin', 'supervisor')
    and ((select public.jwt_planta()) is null or planta_id = (select public.jwt_planta()))
  );

create policy "equipos_update" on public.equipos
  for update to authenticated
  using (
    (select public.jwt_role()) in ('admin', 'supervisor')
    and ((select public.jwt_planta()) is null or planta_id = (select public.jwt_planta()))
  )
  with check (
    (select public.jwt_role()) in ('admin', 'supervisor')
    and ((select public.jwt_planta()) is null or planta_id = (select public.jwt_planta()))
  );

create policy "equipos_delete" on public.equipos
  for delete to authenticated
  using ((select public.jwt_role()) = 'admin');

create index on public.equipos (planta_id);
