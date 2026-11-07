# Estado verificado

3 de noviembre de 2026. Aplicación local funcional en http://localhost:14202; panel en /admin.

## Funcionalidades implementadas

- Catálogo PostgreSQL real: categorías, búsqueda por nombre/SKU, filtros, destacados, disponibilidad, orden por nombre/precio actual/fecha y paginación.
- Detalle de producto: galería, descripción, atributos, variantes genéricas, precio y cantidad mínima.
- Carrito: diferencias por variante, cantidades enteras, mínimos, quitar líneas, total en centavos y restauración validada desde LocalStorage. Se rechazan importes que exceden la precisión segura en centavos del navegador.
- Checkout Reactive Forms: datos en memoria, revalidación remota, cálculo BigDecimal, mínimos, precios actuales, vista previa y enlace wa.me con el WhatsApp configurado. La validación visible vence a los cinco minutos y al cambiar datos/carrito. No persiste datos de compradores ni simula envíos.
- Panel: login/logout con BCrypt y sesión, guard Angular y autorización Spring, dashboard de catálogo, CRUD de productos/categorías, activación, variantes, características e imágenes.
- Mi negocio: nombre, descripción, logo/banner, color, contacto, WhatsApp, redes, moneda, modalidad, mínimo, bienvenida y condiciones desde PostgreSQL.
- Almacenamiento local persistente, validación y recodificación de imágenes PNG/JPG, interfaz extensible a S3.
- Flyway V1 y V2, Dockerfiles independientes, Compose con salud y volúmenes propios, documentación y variables de entorno.

El entorno development contiene ocho productos ilustrados y cinco categorías de ejemplo, editables desde el panel. No se cargan sin ese perfil. El número de WhatsApp se configura por instalación desde el panel y se guarda en la base local.

## Evidencia de verificación

| Verificación | Resultado |
| --- | --- |
| Maven verify con Java 21 | 23 pruebas aprobadas, cero errores/fallos |
| Angular/Vitest sobre el árbol final | 12 pruebas aprobadas, cero fallos |
| Compilación productiva Angular | Correcta; alrededor de 558 kB iniciales |
| Construcción de ambos Dockerfiles | Correcta; backend verifica sus pruebas durante la construcción |
| Flyway y validación Hibernate | Correctas contra PostgreSQL 17 real |
| scripts/verify.ps1 | Angular, proxy API, configuración, CSRF y bloqueo anónimo correctos |
| scripts/integration.ps1 | Login/sesión, autorización, CSRF, categorías, productos, variantes, características, imágenes, búsqueda/paginación, precios actualizados, concurrencia, mínimos, disponibilidad, enlace y logout correctos |

La integración crea datos temporales y los elimina, y restaura la configuración en finally. Genera un pequeño archivo de imagen de prueba sin referencia al finalizar; la limpieza de archivos huérfanos sigue siendo manual. Solo debe ejecutarse en desarrollo. No envía mensajes de WhatsApp.

En navegador se comprobó el recorrido catálogo → detalle → dos variantes diferentes → carrito → formulario → mensaje validado con total y enlace correctos. También se verificaron el login, los conteos reales del dashboard, la carga del editor de producto, el guardado con confirmación «Producto guardado» y el logout desde el navegador. Se inspeccionó la grilla de productos en vista angosta y se corrigió el desborde del menú administrativo. El panel se comprobó a 390 px de viewport sin desborde del documento. Las capturas catalog-preview.jpg y admin-mobile.jpg conservan evidencia visual. La cobertura de navegador es manual; no hay aún una suite end-to-end automática en CI. Captura local: catalog-mobile.jpg.

## Dependencias y límites

npm 11.21.1, CLI/Build Angular 21.2.29, Vitest 4.1.12 y Vite 7.3.7. La auditoría npm con omisión de dependencias de desarrollo informó cero vulnerabilidades. La auditoría completa informó 16 avisos moderados en herramientas de desarrollo, sin altos ni críticos; no se forzaron cambios de versiones mayores. Esto no constituye una auditoría integral de seguridad de la aplicación o de las imágenes Docker.

No se incluyen pagos, facturación, stock numérico/reservas, ventas persistidas, multitenancy ni recuperación/cambio de contraseña desde el panel. La limpieza de imágenes sin referencia y el adaptador S3 son mejoras pendientes. No se realizó un despliegue remoto ni una prueba de operación productiva, backups o recuperación. Antes de entregar a un cliente: TLS, secretos propios, perfil sin development, almacenamiento durable, backups probados y validación con sus datos reales.

Para detener los contenedores conservando datos, ejecutar docker compose stop desde la raíz del repositorio.
