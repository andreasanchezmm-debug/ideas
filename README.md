# Donut Alicante

Plataforma pública de bienestar social y sostenibilidad basada en la Economía del Donut. Primera versión para Alicante, preparada para almacenar otros municipios sin implementar comparaciones.

**Sin cifras inventadas:** 40 definiciones iniciales, cero observaciones, informes o mapas precargados. Las referencias del catálogo son fuentes candidatas, no integraciones ni datos ya verificados.

## Requisitos y arranque

Node.js 24 (por `node:sqlite`), npm 11. El checkout existente es suficiente.

```bash
npm ci --cache /tmp/npm-cache
npm run dev
```

Producción local:

```bash
npm run build
npm start
```

SQLite crea `.data/donut.sqlite` en el primer acceso; catálogo y municipio se insertan de forma idempotente sin sobreescribir ediciones. Mantener `.data` en disco persistente. `SQLITE_PATH` permite otra ruta. No compartir SQLite entre servidores.

## Acceso privado

El sitio público funciona sin credenciales. El panel está bloqueado hasta configurar `ADMIN_PASSWORD_HASH` y `SESSION_SECRET`; no existe contraseña predeterminada.

```bash
npm run admin:password
```

Ejecutar en una terminal privada: la entrada es visible y el comando devuelve un hash scrypt y un secreto aleatorio. Guardar ambos valores en `.env.local` (ignorado por Git) o en el gestor de secretos del despliegue. No compartir los valores ni incluirlos en tickets. Reiniciar Next.js después de configurarlos. La contraseña original solo la necesita el administrador.

El acceso requiere HTTPS en producción. El administrador tiene permisos de publicación; los visitantes nunca necesitan registrarse. Para producción con más operadores se recomienda OIDC/MFA y cuentas individuales en una iteración posterior.

## Uso editorial

1. Editar definiciones en Administración → Indicadores. Umbral vacío significa que no se evalúa.
2. Añadir municipios y territorios únicamente con identificadores, geometrías y referencias documentadas. Un territorio pertenece a un municipio y no recibe automáticamente datos de su conjunto.
3. Crear una observación con todos los metadatos, o importar CSV/XLSX usando la plantilla del panel. Fechas como texto ISO; `reuseAllowed` true/false; `territoryId` vacío para municipal. `housingContext` es JSON opcional. Valores con punto decimal.
4. Revisar cobertura, unidad exacta y versión del indicador, fuente, condiciones de acceso, licencia, incertidumbre y privacidad. Guardar validado y después publicado. Importaciones siempre como borradores; se informa del resultado por fila.
5. Las correcciones conservan antes/después en Historial y vuelven a pasar por validación. No modificar una serie cambiándole unidades o metodología: crear otro indicador.
6. Los informes se editan como texto y se publican desde su sección. No se admite HTML ni archivos ejecutables.

No importar datos personales, domicilios ni microdatos. Comprobar supresión de celdas pequeñas y ausencia de reidentificación antes de publicar agregados. No usar las fuentes sin revisar sus condiciones de acceso y reutilización.

## PostgreSQL y PostGIS

Configurar `DATABASE_URL` en el entorno. No desactivar TLS ni la verificación de certificados: usar los requisitos del proveedor. La aplicación utiliza `pg` en lugar de SQLite automáticamente. No copia datos entre bases: una migración de contenidos requiere exportación privada revisada, y las exportaciones públicas no incluyen borradores.

Para desarrollo local puede iniciarse un contenedor PostGIS (solo loopback; no usar trust en servidores públicos):

```bash
docker run --name donut-postgis-dev -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=donut -p 127.0.0.1:55432:5432 -d postgis/postgis:17-3.5
```

Arrancar una vez la aplicación con `DATABASE_URL=postgresql://postgres@127.0.0.1:55432/donut` para crear las tablas. Después, aplicar `db/postgis.sql` con `psql` o `docker exec -i donut-postgis-dev psql -U postgres -d donut < db/postgis.sql`. La migración es repetible y añade relaciones, unicidad de series, geometrías WGS84 e índice espacial. El volumen del contenedor de ejemplo no sustituye una estrategia de persistencia y copias.

## Verificaciones

```bash
npm test
npm run typecheck
npm run build
npm audit --omit=dev
```

Las pruebas de dominio usan una base temporal aislada, datos ficticios marcados en sus metadatos y no escriben en la base del observatorio. Incluyen validación/publicación, auditoría, compatibilidad de unidades, pertenencia territorial, simulaciones, fuentes obligatorias, exportación y autenticación.

`npm run test:e2e` ejecuta Playwright contra el servidor indicado en `BASE_URL` (por defecto el puerto local 3000). Necesita Chromium instalado; `CHROMIUM_PATH` permite seleccionar el ejecutable. No inicia el servidor ni publica nada.

API pública: `/api/data`, `?type=catalog`, `?type=territories`, `?type=reports`, `?type=report&id=...` (informe público en texto), `?format=csv|xlsx`. Filtros: `city`, `indicator`, `period`, `territory` (o `municipal`). API administrativa autenticada en `/api/admin`. Las descargas filtran publicación y permiso de reutilización.

Consulta [arquitectura, modelo de datos, diseño y fases](docs/ARQUITECTURA.md) y [evidencias y límites](docs/VALIDACION.md).
