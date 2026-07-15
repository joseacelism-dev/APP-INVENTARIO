# Preparacion Para Produccion

## Estado Actual

PinturaStock es una app React estatica empaquetada para web, escritorio con Electron y Android con Capacitor.

- Usa Supabase como almacenamiento remoto si `pinturastock_state` existe.
- No usa variables de entorno obligatorias.
- Guarda una copia local en `localStorage`.
- Sincroniza una copia remota JSON en Supabase.
- La autenticacion es local/demo: `gerente / demo1234`.

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

Para produccion multiusuario real se debe agregar backend con:

- Autenticacion servidor-side.
- Roles y permisos verificados en API.
- Base de datos transaccional.
- Backups.
- Auditoria persistente.
- Firma de instaladores Windows con certificado de codigo.

La version actual es adecuada para demo local, prototipo y uso en un solo equipo/dispositivo.
