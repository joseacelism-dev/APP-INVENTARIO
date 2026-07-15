# Deployment En GitHub Pages

## 1. Subir El Proyecto

Esta carpeta completa es la que debe subirse al repositorio:

```text
Software inventario pinturas
```

El workflow `.github/workflows/pages.yml` publica automaticamente la version web de produccion cada vez que haya un push a `main`.

## 2. Activar Pages En GitHub

En el repositorio:

1. Entra a `Settings`.
2. Entra a `Pages`.
3. En `Build and deployment`, selecciona `GitHub Actions`.
4. Guarda los cambios si GitHub lo solicita.

## 3. Conectar Dominio

En `Settings > Pages > Custom domain`, escribe el dominio que vas a usar.

Ejemplos:

```text
tudominio.com
www.tudominio.com
```

GitHub recomienda agregar primero el dominio en Pages antes de configurar DNS.

## 4. DNS Para Dominio Raiz

Para un dominio raiz como `tudominio.com`, crea estos registros `A`:

```text
@  A  185.199.108.153
@  A  185.199.109.153
@  A  185.199.110.153
@  A  185.199.111.153
```

Opcionalmente, para IPv6:

```text
@  AAAA  2606:50c0:8000::153
@  AAAA  2606:50c0:8001::153
@  AAAA  2606:50c0:8002::153
@  AAAA  2606:50c0:8003::153
```

## 5. DNS Para www

Para `www.tudominio.com`, crea este registro:

```text
www  CNAME  TU-USUARIO.github.io
```

Reemplaza `TU-USUARIO` por tu usuario u organizacion de GitHub.

## 6. HTTPS

Cuando GitHub detecte correctamente el dominio, activa:

```text
Enforce HTTPS
```

La propagacion DNS puede tardar hasta 24 horas.
