# Conexion Segura Con Supabase

La app ahora soporta Supabase Auth, sesiones con token, roles y politicas RLS.

## Variables

```text
SUPABASE_URL=https://urgipxrvwjplpjbbcolk.supabase.co
SUPABASE_PUBLISHABLE_KEY=tu_publishable_key
```

Nunca pongas `service_role` en el frontend, GitHub Pages, Electron ni Android.

## Activar Seguridad

1. Entra a Supabase.
2. Abre `SQL Editor`.
3. Ejecuta el archivo:

```text
supabase-security.sql
```

Ese SQL crea:

- perfiles de usuario con roles;
- tablas separadas para productos, materias, pedidos, OP, OC y movimientos;
- auditoria persistente;
- RLS por rol;
- bloqueo del estado JSON compartido para usuarios anonimos.

## Crear Usuarios

1. Supabase > Authentication > Users.
2. Crea usuarios con correo y contrasena.
3. Copia el UUID del usuario.
4. Inserta su perfil:

```sql
insert into public.profiles (id, email, nombre, role)
values ('UUID_DEL_USUARIO', 'vendedor@empresa.com', 'Nombre Vendedor', 'vendedor');
```

Roles disponibles:

```text
gerente
produccion
vendedor
compras
```

## Permisos

- `gerente`: usuario maestro con acceso total.
- `vendedor`: productos, pedidos y movimientos.
- `produccion`: materias, productos, pedidos, produccion, movimientos y reportes.
- `compras`: materias, proveedores, pedidos, compras, movimientos y reportes.

## Crear Usuarios Desde La App

Para que el gerente pueda crear usuarios con correo y contrasena desde el modulo **Usuarios**, debes desplegar la Edge Function:

```powershell
supabase functions deploy create-user
```

La funcion esta en:

```text
supabase/functions/create-user/index.ts
```

La funcion usa `SUPABASE_SERVICE_ROLE_KEY` dentro de Supabase. Nunca pongas esa llave en `config.js`, GitHub, Android o Electron.

Despues de desplegar:

1. Entra a la app con el usuario gerente.
2. Abre **Usuarios**.
3. Crea usuarios con correo, contrasena inicial y rol.

## Estado Actual De La App

La app sigue sincronizando el estado completo en `pinturastock_state`, pero ahora lo hace con token de usuario autenticado. Las tablas normalizadas quedan preparadas para migrar modulo por modulo sin exponer datos.

## Backups

Antes de cada despliegue:

1. Supabase > Project Settings > Database > Backups.
2. Exporta tablas criticas.
3. Guarda CSV/JSON de:
   - `pinturastock_state`
   - `pedidos`
   - `ordenes_compra`
   - `ordenes_produccion`
   - `movimientos`
   - `audit_log`

## Nota

Si todavia no hay usuarios en Supabase Auth, la app conserva el modo demo local. En produccion, crea usuarios reales y ejecuta RLS antes de publicar el dominio.
