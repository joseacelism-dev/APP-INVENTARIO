# Conexion Con Supabase

La app sincroniza el estado completo del inventario contra una fila JSON en Supabase.

## Proyecto

```text
SUPABASE_URL=https://urgipxrvwjplpjbbcolk.supabase.co
```

La llave usada en el navegador debe ser una publishable key. No uses `service_role` en frontend.

## SQL Inicial

En Supabase:

1. Abre el proyecto.
2. Entra a `SQL Editor`.
3. Crea un nuevo query.
4. Ejecuta:

```sql
create table if not exists public.pinturastock_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.pinturastock_state enable row level security;

drop policy if exists "pinturastock_state_read" on public.pinturastock_state;
drop policy if exists "pinturastock_state_insert" on public.pinturastock_state;
drop policy if exists "pinturastock_state_update" on public.pinturastock_state;

create policy "pinturastock_state_read"
on public.pinturastock_state
for select
to anon
using (id = 'default');

create policy "pinturastock_state_insert"
on public.pinturastock_state
for insert
to anon
with check (id = 'default');

create policy "pinturastock_state_update"
on public.pinturastock_state
for update
to anon
using (id = 'default')
with check (id = 'default');
```

## GitHub Actions

En el repositorio de GitHub:

1. `Settings`
2. `Secrets and variables`
3. `Actions`
4. `Variables`
5. Agrega:

```text
SUPABASE_URL=https://urgipxrvwjplpjbbcolk.supabase.co
SUPABASE_PUBLISHABLE_KEY=tu_publishable_key
```

El workflow usa estas variables al compilar la web.

## Nota De Seguridad

Esta primera conexion permite que la app web lea y escriba una fila compartida usando una publishable key. Sirve para demo y sincronizacion basica.

Para produccion con datos privados se debe agregar Supabase Auth y cambiar las politicas RLS para que cada usuario o empresa solo acceda a sus propios datos.
