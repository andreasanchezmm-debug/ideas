# Demo navegable con ejemplos ficticios

El proyecto completo está desarrollado en Next.js, pero un repositorio de GitHub no es un alojamiento web. Para permitir una primera visita sin instalar nada, esta entrega incorpora una demo estática independiente. Reutiliza las definiciones, el donut, la gráfica histórica, los estilos y la lógica de exportación del proyecto.

## Contenido

- Catálogo de 40 indicadores y filtros de dimensión, búsqueda y periodo.
- Ocho indicadores con tres observaciones ficticias cada uno (2022–2024): renta mediana, desempleo, electricidad, agua, huella de carbono, huella material, exposición a riesgo laboral y contratación social.
- Ficha interactiva, tabla histórica y CSV/Excel de las 24 filas de ejemplo.
- Aviso persistente «DEMO INTERACTIVA · DATOS FICTICIOS», etiquetas en tarjetas, fichas, tablas, metadatos y nombres de descarga.
- Sin diagnósticos, umbrales, puntuaciones, geometrías inventadas ni comparación entre ciudades.

Los ejemplos están en `lib/demo.ts`. Son cifras arbitrarias que **no describen Alicante**. La fuente indicada es el propio archivo del proyecto, no un organismo oficial. Las referencias institucionales del catálogo se presentan por separado como fuentes candidatas para futuros datos reales.

No se insertan estas cifras en SQLite o PostgreSQL. La API pública y la regla de no publicar simulaciones en el observatorio siguen sin cambios. El permiso de mostrar ejemplos se limita a esta demo claramente diferenciada. La demo no ofrece panel administrativo ni simula persistencia; esas funciones pertenecen a la aplicación Next.js.

## Construir y verificar

```bash
npm ci --cache /tmp/npm-cache
npm run demo:build
npm run demo:test
```

La prueba de Chromium arranca el servidor estático, comprueba el catálogo, filtros, ficha e histórico, valores por periodo, ausencia de datos en otros indicadores, CSV/XLSX con metadatos ficticios y pantalla móvil. No consulta APIs externas.

Para consultar el resultado localmente: `npm run demo:preview`. Los archivos listos para servir están en `demo-dist` (ignorado por Git).

## Publicación en GitHub Pages

`npm run demo:publish` envía exclusivamente los archivos estáticos a la rama `gh-pages`, mediante un índice temporal de Git. No cambia de rama ni toca el índice de trabajo del proyecto, no utiliza force-push y conserva el padre de despliegues anteriores. Requiere permiso de escritura en el repositorio.

**Enviar la rama no certifica que el alojamiento esté activado.** Si aún no está activo, el propietario debe abrir:

https://github.com/andreasanchezmm-debug/ideas/settings/pages

En «Build and deployment», seleccionar «Deploy from a branch», rama `gh-pages`, carpeta `/(root)`, y guardar. GitHub indicará si la cuenta y la visibilidad del repositorio permiten Pages, y mostrará el estado del despliegue. Si ya hay un método de publicación personalizado, conservarlo y adaptar su configuración en lugar de reemplazarlo sin revisar.

Dirección prevista, **solo operativa tras activar y completar el despliegue**:

https://andreasanchezmm-debug.github.io/ideas/

El entorno actual bloquea la conexión a la API de GitHub y a ese dominio de Pages (el proxy responde 403 a CONNECT). Por ello, no puede confirmarse aquí la activación ni el acceso público, aunque sí se verifica la compilación, el funcionamiento local en Chromium y la presencia de los archivos en la rama remota. No confundir este bloqueo de comprobación con un error demostrado de la web.

Para publicar la aplicación completa con administración y datos persistentes hará falta un alojamiento Node.js y PostgreSQL o almacenamiento persistente para SQLite; GitHub Pages solo sirve la demo estática.
