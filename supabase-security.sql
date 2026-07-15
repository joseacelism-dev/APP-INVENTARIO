-- PinturaStock - seguridad de produccion para Supabase
-- Ejecutar en Supabase SQL Editor con un usuario administrador.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text not null,
  display_name text,
  rol text,
  role text not null check (role in ('gerente', 'produccion', 'vendedor', 'compras')),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  user_email text,
  role text,
  modulo text not null,
  accion text not null,
  entidad text,
  detalle text,
  antes jsonb,
  despues jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.productos (
  id text primary key,
  nombre text not null,
  presentacion text,
  color text,
  stock numeric not null default 0,
  minimo numeric not null default 0,
  precio numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.materias_primas (
  id text primary key,
  nombre text not null,
  categoria text,
  unidad text,
  stock numeric not null default 0,
  minimo numeric not null default 0,
  costo numeric not null default 0,
  proveedor text,
  updated_at timestamptz not null default now()
);

create table if not exists public.pedidos (
  id text primary key,
  vendedor_id uuid references auth.users(id),
  cliente text not null,
  producto text not null references public.productos(id),
  cantidad numeric not null check (cantidad > 0),
  estado text not null,
  total numeric not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ordenes_produccion (
  id text primary key,
  pedido text references public.pedidos(id),
  producto text not null references public.productos(id),
  cantidad numeric not null,
  estado text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ordenes_compra (
  id text primary key,
  pedido text references public.pedidos(id),
  proveedor text,
  estado text not null,
  total numeric not null default 0,
  detalle jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.movimientos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  item text not null,
  cantidad numeric not null,
  documento text,
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

alter table public.profiles enable row level security;
alter table public.audit_log enable row level security;
alter table public.productos enable row level security;
alter table public.materias_primas enable row level security;
alter table public.pedidos enable row level security;
alter table public.ordenes_produccion enable row level security;
alter table public.ordenes_compra enable row level security;
alter table public.movimientos enable row level security;
alter table public.pinturastock_state enable row level security;

create or replace function public.current_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and activo = true
$$;

create or replace function public.is_role(anyarray)
returns boolean
language sql
stable
as $$
  select coalesce(public.current_role() = any($1::text[]), false)
$$;

drop policy if exists profiles_self_read on public.profiles;
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_role(array['gerente']));
create policy profiles_admin_all on public.profiles for all to authenticated using (public.is_role(array['gerente'])) with check (public.is_role(array['gerente']));

drop policy if exists state_authenticated_read on public.pinturastock_state;
drop policy if exists state_authenticated_write on public.pinturastock_state;
drop policy if exists "pinturastock_state_read" on public.pinturastock_state;
drop policy if exists "pinturastock_state_insert" on public.pinturastock_state;
drop policy if exists "pinturastock_state_update" on public.pinturastock_state;
create policy state_authenticated_read on public.pinturastock_state for select to authenticated using (id = 'default');
create policy state_authenticated_write on public.pinturastock_state for all to authenticated
using (id = 'default' and public.is_role(array['gerente']))
with check (id = 'default' and public.is_role(array['gerente']));

create policy productos_read on public.productos for select to authenticated using (true);
create policy productos_write on public.productos for all to authenticated using (public.is_role(array['gerente','produccion'])) with check (public.is_role(array['gerente','produccion']));

create policy mp_read on public.materias_primas for select to authenticated using (true);
create policy mp_write on public.materias_primas for all to authenticated using (public.is_role(array['gerente','produccion','compras'])) with check (public.is_role(array['gerente','produccion','compras']));

create policy pedidos_read on public.pedidos for select to authenticated using (public.is_role(array['gerente','produccion','compras']) or vendedor_id = auth.uid());
create policy pedidos_insert on public.pedidos for insert to authenticated with check (public.is_role(array['gerente','vendedor']) and vendedor_id = auth.uid());
create policy pedidos_update on public.pedidos for update to authenticated using (public.is_role(array['gerente'])) with check (public.is_role(array['gerente']));

create policy op_read on public.ordenes_produccion for select to authenticated using (public.is_role(array['gerente','produccion','compras']));
create policy op_write on public.ordenes_produccion for all to authenticated using (public.is_role(array['gerente','produccion'])) with check (public.is_role(array['gerente','produccion']));

create policy oc_read on public.ordenes_compra for select to authenticated using (public.is_role(array['gerente','compras','produccion']));
create policy oc_write on public.ordenes_compra for all to authenticated using (public.is_role(array['gerente','compras'])) with check (public.is_role(array['gerente','compras']));

create policy movimientos_read on public.movimientos for select to authenticated using (true);
create policy movimientos_write on public.movimientos for insert to authenticated with check (public.is_role(array['gerente','produccion','compras']));

create policy audit_read on public.audit_log for select to authenticated using (public.is_role(array['gerente']));
create policy audit_insert on public.audit_log for insert to authenticated with check (auth.uid() = user_id);

-- Crear usuarios en Authentication > Users y luego asignar perfil:
-- insert into public.profiles (id, email, nombre, role)
-- values ('UUID_DEL_USUARIO', 'vendedor@empresa.com', 'Nombre Vendedor', 'vendedor');

-- Backup manual recomendado:
-- 1. Supabase Dashboard > Project Settings > Database > Backups.
-- 2. Exportar CSV/JSON de tablas criticas antes de cada despliegue.
