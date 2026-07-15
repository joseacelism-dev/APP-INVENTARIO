# Preparacion Para Produccion

## Estado Actual

PinturaStock es una app React estatica empaquetada para web, escritorio con Electron y Android con Capacitor.

- Usa Supabase como almacenamiento remoto si `pinturastock_state` existe.
- Soporta Supabase Auth con correo/contrasena.
- Usa roles de aplicacion: `gerente`, `produccion`, `vendedor`, `compras`.
- El gerente es el usuario maestro con acceso total.
- No usa variables de entorno obligatorias.
- Guarda una copia local en `localStorage`.
- Sincroniza una copia remota JSON en Supabase usando token de usuario cuando Auth esta activo.
- La autenticacion local/demo queda solo como respaldo cuando Supabase no esta configurado.

## Builds

Build web precompilado:

```powershell
npm.cmd run build:web
```

Salida:

```text
dist/web
```

Instalador Windows:

```powershell
npm.cmd run dist
```

APK Android debug:

```powershell
npm.cmd run android:sync
cd android
.\gradlew.bat assembleDebug
```

## Variables De Entorno

Variables actuales:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

Ver `.env.example` y `SUPABASE_SETUP.md`.

## Notas De Seguridad

Antes de publicar con datos reales:

- Ejecutar `supabase-security.sql`.
- Crear usuarios en Supabase Auth.
- Registrar cada usuario en `public.profiles`.
- Desplegar la Edge Function `create-user` para que el gerente cree usuarios desde la app.
- Verificar que RLS quede activo.
- Crear backups antes de cada despliegue.
- Revisar `audit_log` periodicamente.
- Firma de instaladores Windows con certificado de codigo.

La version actual ya incluye controles de frontend y SQL de seguridad. La proteccion fuerte depende de ejecutar las politicas RLS en Supabase.
