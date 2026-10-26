# Evidencias de la primera versión

Fecha de verificación: 26 de octubre de 2026.

## Instancia actual

- Node 24.19.0 y npm 11.9.0.
- Instalación reproducible con `npm ci --cache /tmp/npm-cache` completada.
- Catálogo inicial: 40 indicadores (15 sociales locales, 15 ecológicos locales, 5 ecológicos globales, 5 sociales globales). Municipio inicial: Alicante, 03014.
- Base pública SQLite: cero observaciones, cero territorios importados, cero informes. No hay umbrales por defecto. No se han consultado ni importado conjuntos estadísticos externos.
- No se han configurado credenciales reales. El panel se bloquea correctamente sin hash y secreto; su flujo autenticado se verifica en una instancia temporal con credenciales efímeras que no se guardan en el proyecto.

## Comprobaciones realizadas

- TypeScript sin errores y compilación de producción de Next.js.
- Siete pruebas de dominio: catálogo y dimensiones, evaluación con/sin dato y umbral, rechazo de simulaciones publicadas y fuentes inválidas, geometrías básicas, CSV con comillas y protección de fórmulas, sesiones y origen, persistencia y revisión con historial.
- Cinco pruebas de navegador completadas (sin fallos ni omisiones). Navegación pública en Chromium: búsqueda, filtro de dimensión, ficha vacía, donut de 40 segmentos, territorio sin geometrías y acceso privado.
- API pública: catálogo completo, observaciones vacías, CSV con cabecera y XLSX válido. API privada devuelve 401 sin sesión y 403 ante otro origen.
- Vistas de 390 px: inicio, catálogo, ficha, territorio, metodología, descargas y acceso privado sin desbordamiento horizontal.
- Administración en servidor y base aislados: inicio de sesión, creación desde formulario, borrador → validado → publicado, exportación XLSX con valor y tipo correctos, importación XLSX como borrador, simulación excluida de la API pública y cierre de sesión.
- Mapa en navegador con geometría ficticia documentada en una base aislada: renderizado Leaflet, selección accesible y ausencia explícita de valores. Informes: borrador no público, publicación y descarga de texto verificadas.
- Integración PostgreSQL 17/PostGIS 3.5 en contenedor local y base `donut_test`: catálogo, geometría válida y SRID 4326, migración espacial ejecutada dos veces, revisión, publicación, rechazo de duplicados y auditoría. Los registros ficticios se usaron exclusivamente en esa base de pruebas, separada de la aplicación; el contenedor y su volumen temporal se eliminaron al finalizar.
- Auditoría de dependencias de producción: cero vulnerabilidades notificadas tras actualizar PostCSS y uuid mediante overrides. Esto no equivale a una auditoría de seguridad completa.

El navegador detectó inicialmente un error de hidratación causado por hijos múltiples de un título SVG y una etiqueta de selector que dificultaba su localización exacta. Ambos fueron corregidos y las pruebas se repitieron con éxito.

## Límites de la entrega

No se ha desplegado ni publicado la aplicación en Internet. No se ha validado restauración de un snapshot en una tarea nueva, ni se ha probado un proveedor PostgreSQL remoto, alta disponibilidad o cargas de producción. No existe comparación entre ciudades, simulador de políticas ni puntuación global.

El mapa admite geometrías documentadas, pero aún no tiene delimitaciones oficiales de Alicante. No hay diagnóstico social o ambiental ni evaluación de sostenibilidad de la ciudad. Fuentes candidatas, licencias reales, datos, anonimización y umbrales necesitan revisión antes de publicarse. No se afirma conformidad WCAG ni certificación de protección de datos.

La administración es de un solo rol. La limitación de intentos es por proceso y no sustituye un control compartido, OIDC/MFA y cuentas individuales cuando se incorporen más operadores. Las copias de seguridad y su restauración deben configurarse antes de alojar información real.

## Reproducción PostgreSQL

La prueba `tests/postgres.integration.ts` requiere una base desechable cuyo nombre termine en `_test`; nunca apuntarla a una base con datos reales. Usa el adaptador de la aplicación y aplica `db/postgis.sql`. Crear una base vacía nueva para cada ejecución, ya que la prueba registra identificadores fijos de fixtures. Los datos de prueba no se presentan como evidencia municipal.

## Configuración reutilizable

Se guardaron `install_script` (Node 24, instalación con lockfile y compilación) y `start_skill` (directorio, proceso, comprobaciones de disponibilidad y conservación de la base). El guardado del borrador se confirmó; no ejecuta ni publica por sí mismo la configuración. El usuario debe revisarla, guardarla y publicar el entorno desde sus ajustes si quiere conservar esta preparación para futuras tareas. No se ha publicado un sitio web.
