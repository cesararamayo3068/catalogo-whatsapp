# Catálogos y pedidos por WhatsApp

Aplicación independiente por comercio: catálogo público, carrito persistente y preparación de pedidos por WhatsApp; panel privado para productos, categorías, imágenes y configuración comercial.

![Vista del catálogo con productos de ejemplo](docs/catalog-preview.jpg)

## Probar en tu equipo

- Tienda: http://localhost:14202
- Panel: http://localhost:14202/admin
- Usuario inicial local: `admin`. La contraseña está en `ADMIN_PASSWORD` del archivo local `.env`, excluido de Git.
- El entorno de desarrollo carga ocho productos ilustrados de cinco categorías cuando la instalación está vacía. Son ejemplos editables y eliminables. No se cargan al iniciar sin el perfil `development`.

El recorrido es explorar → elegir producto y variante → agregar al carrito → completar nombre y localidad → revisar precios actuales → abrir WhatsApp → confirmar manualmente el envío. Abrir el enlace no significa que el comercio haya recibido el mensaje. No hay pago online ni persistencia de datos personales del comprador.

## Arquitectura y stack

Monolito modular Java 21 / Spring Boot 3.5.16 con MVC, JPA/Hibernate, Security, Validation, Flyway y PostgreSQL 17. SPA Angular 21.2.26, CLI/Build 21.2.29, PrimeNG 21.1.10, PrimeIcons 7, TypeScript 5.9 estricto, Reactive Forms, Router, HttpClient y Signals. Maven, JUnit 5, Mockito y Vitest 4.1.12. Dependencias npm bloqueadas en package-lock.json; npm 11.21.1 evita un fallo del resolvedor de npm 10.

Las versiones se verificaron con los peers de PrimeNG y las referencias oficiales de [Angular](https://angular.dev/reference/versions), [PrimeNG 21](https://v21.primeng.org/installation) y [Spring Boot 3.5](https://docs.spring.io/spring-boot/3.5/system-requirements.html).

```text
backend/src/main/java/com/catalog/
  admin/       usuarios, bootstrap y dashboard
  business/    configuración comercial, DTO y servicio
  category/    categorías y API
  product/     productos, variantes, DTO, búsqueda y CRUD
  order/       cálculo y preparación del mensaje, sin persistir clientes
  security/    sesión, CSRF, CORS y límite de intentos de login
  storage/     interfaz de almacenamiento y adaptador local
  common/      errores ProblemDetail
  config/      datos exclusivos de desarrollo
backend/src/main/resources/db/migration/
frontend/src/app/
  core/        API, modelos, estado de tienda, carrito y guard
  shared/      tarjetas de producto
  layouts/     tienda y administración
  features/    catálogo, detalle, carrito, checkout y panel
```

Controllers devuelven DTOs, no entidades. El carrito muestra importes estimados, sumados en centavos enteros. El servidor recalcula con BigDecimal, valida categorías activas, disponibilidad, variante, cantidades y pedido mínimo. Las ediciones de productos usan bloqueo optimista por versión.

## Instalar desde un clon limpio

Requisitos: Docker Desktop con contenedores Linux y Compose v2. No requiere Java, Node ni volúmenes externos ya preparados. Desde la raíz del repositorio:

```powershell
git clone https://github.com/cesararamayo3068/catalogo-whatsapp.git
cd catalogo-whatsapp
Copy-Item .env.example .env
# Reemplazar DB_PASSWORD y ADMIN_PASSWORD por valores aleatorios propios.
# ADMIN_PASSWORD debe tener de 16 a 72 caracteres; el usuario, de 3 a 100.
docker compose up --build -d
docker compose ps
```

El frontend espera a que el backend esté saludable, y este espera a PostgreSQL. La primera construcción descarga dependencias. Los puertos se enlazan únicamente a localhost:

| Servicio | Dirección |
| --- | --- |
| Tienda y panel | http://localhost:14202 |
| Backend | http://localhost:18082 |
| Salud | http://localhost:18082/actuator/health |
| OpenAPI en desarrollo | http://localhost:18082/swagger-ui/index.html |
| PostgreSQL | localhost:55434, DB/usuario commerce |

Para ver errores: `docker compose logs backend`. Detener sin perder datos: `docker compose stop`. `docker compose down` conserva volúmenes; **down -v elimina la base y las imágenes**.

## Configuración

| Variable | Uso |
| --- | --- |
| DB_PASSWORD | Obligatoria, contraseña PostgreSQL |
| ADMIN_USERNAME / ADMIN_PASSWORD | Crea el primer administrador solo si admin_user está vacío; no sobrescribe usuarios existentes |
| DB_PORT / BACKEND_PORT / FRONTEND_PORT | Puertos locales, 55434 / 18082 / 14202 |
| DB_URL / DB_USER | Conexión JDBC y usuario al ejecutar fuera de Compose |
| FRONTEND_ORIGIN | Origen exacto autorizado por CORS |
| SPRING_PROFILES_ACTIVE | development solo para trabajo local; habilita datos iniciales y Swagger |
| COOKIE_SECURE | true por defecto; desarrollo permite HTTP local |
| STORAGE_DIRECTORY | Directorio persistente de imágenes, /uploads en Compose |
| PORT | Puerto interno de Spring, 8080 |

No publicar .env, credenciales ni copias de la base. El bootstrap cifra la contraseña con BCrypt. Puede retirarse la contraseña de bootstrap del entorno después de crear la cuenta; cambiar la variable no cambia una contraseña existente. Esta versión no incluye recuperación de contraseña por email ni gestión de múltiples administradores: la rotación debe realizarla el operador mediante un procedimiento controlado de actualización de hash.

## Usar el panel

1. Entrar en /admin y autenticarte.
2. En **Mi negocio**, configurar nombre, logo/banner, color, bienvenida, dirección, teléfono, WhatsApp, email, redes, moneda, modalidad, mínimo y condiciones. WhatsApp requiere código de país y solo dígitos. La configuración vive en PostgreSQL.
3. En **Categorías**, crear y ordenar categorías. Desactivar una categoría también oculta sus productos en la tienda. Solo se elimina si no tiene productos.
4. En **Productos**, crear, editar, activar/desactivar o eliminar. Se pueden cargar hasta ocho fotos, elegir portada, precios, promoción, cantidad mínima, variantes con precio/disponibilidad propios y características personalizadas.
5. Los productos sin disponibilidad permanecen visibles pero no se agregan al carrito. Los inactivos se ocultan. El dashboard muestra cantidades reales del catálogo, sin ventas o ingresos inventados.

Cada variante representa una combinación flexible, por ejemplo M / Azul, 10 mm / Acero o 256 GB / Negro. Los identificadores se conservan al editar una variante; se rechazan variantes de otro producto. Un precio de variante vacío usa promoción/precio base del producto. El carrito distingue variantes y vuelve a validar todo al preparar el pedido.

## Imágenes

PNG y JPG, hasta 5 MB de entrada, 4096 px por lado y 16 megapíxeles. Se verifica contenido real con ImageIO, se recodifica a PNG, se descartan metadatos y se genera un nombre UUID. No se aceptan SVG de usuarios, ejecutables ni nombres de ruta suministrados por el cliente. Solo la administración autenticada puede subir archivos. La base guarda referencias, no binarios.

ImageStorage permite añadir un adaptador compatible con S3. El volumen product_images persiste los archivos. La eliminación de una referencia no borra físicamente imágenes, porque pueden estar compartidas por productos o marca; queda pendiente recolección de archivos sin uso. Las ilustraciones SVG incluidas son recursos propios para los ejemplos, no fotos reales de productos.

## API

- GET /api/public/business, /categories, /products y /products/{id}
- GET /api/public/products?query=texto&category=1&featured=true&available=true&sort=newest&page=0&size=12
- POST /api/public/checkout/prepare: nombre, localidad, teléfono/observaciones opcionales y líneas con productId, variantId, quantity; no admite precios del comprador
- GET /api/auth/csrf, POST /api/auth/login (form-urlencoded username/password), GET /api/auth/me, POST /api/auth/logout
- GET /api/admin/dashboard
- GET/POST /api/admin/products; GET/PUT/DELETE /api/admin/products/{id}
- GET/POST /api/admin/categories; PUT/DELETE /api/admin/categories/{id}
- GET/PUT /api/admin/business
- POST /api/admin/images (multipart file), GET /api/public/images/{nombre}

Paginación con items, page, totalPages y totalElements. Máximo 100 productos por página. Errores de dominio/validación con ProblemDetail y campos inválidos. Todos los endpoints administrativos exigen ROLE_ADMIN.

Para escrituras, primero GET /api/auth/csrf y luego enviar su token en X-XSRF-TOKEN conservando cookies. Angular hace este intercambio automáticamente. Login y logout rotan/limpian la sesión y el siguiente token se obtiene nuevamente. La sesión usa JSESSIONID HttpOnly, SameSite=Lax y Secure en producción; no se almacenan tokens de autenticación en LocalStorage. El login admite 15 intentos por IP cada 10 minutos y por instancia; un despliegue con varias réplicas requiere compartir ese límite y las sesiones o afinidad apropiada.

## Desarrollo sin Docker

Backend: JDK 21, Maven 3.9 y PostgreSQL. Configurar DB_URL, DB_USER, DB_PASSWORD, ADMIN_USERNAME, ADMIN_PASSWORD; solo localmente usar SPRING_PROFILES_ACTIVE=development. En backend/: `mvn spring-boot:run`.

Frontend: Node 22.12+ (rama 22), npm 11.21.1. En frontend/: `npm ci` y `npm start`. Angular usa 4200; ajustar FRONTEND_ORIGIN a http://localhost:4200. El proxy de desarrollo dirige /api a localhost:8080; editar proxy.conf.json si cambia el backend.

## Pruebas

```powershell
# backend/
mvn verify
# frontend/
npm ci
npm test
npm run build
# Raíz del repositorio, con Compose iniciado y .env configurado
pwsh -File scripts/verify.ps1
pwsh -File scripts/integration.ps1
```

La integración usa PostgreSQL real a través de la API, crea registros temporales, comprueba CRUD, variantes, precios actualizados, bloqueo optimista, mínimos, ocultación por categoría, login/logout y CSRF, y limpia los registros en finally. Cambia temporalmente el WhatsApp y pedido mínimo durante la prueba y luego los restaura: ejecutarla exclusivamente en desarrollo. No abre WhatsApp ni envía mensajes. No ejecutar mientras un comercio atiende pedidos.

Las pruebas unitarias verifican aritmética decimal, promociones, variantes, disponibilidad, mínimos, codificación de enlaces, validación de formularios, carrito persistente, login, autorización y archivos. Los resultados y límites de verificación se registran en docs/STATUS.md.

## Producción y nueva instalación por cliente

1. Crear base y almacenamiento persistentes independientes por cliente y configurar secretos propios.
2. Construir las imágenes y ejecutar Spring sin development (Swagger y datos de ejemplo deshabilitados). Compose incluido es solo desarrollo; no copiarlo sin adaptar perfiles, red y TLS.
3. Servir Angular con HTTPS y proxy /api al backend bajo el mismo dominio. El nginx incluido resuelve backend:8080 en la red Compose. Adaptar upstream si se despliegan por separado.
4. Mantener COOKIE_SECURE=true y origen CORS exacto. No cambiar SameSite o separar dominios sin revisar el flujo de cookies/CSRF. Limitar el acceso público a PostgreSQL.
5. Crear la cuenta inicial con variables de bootstrap, entrar y personalizar desde Mi negocio. No usar credenciales del desarrollo local.
6. Cargar los productos reales, confirmar el destino de WhatsApp y probar un pedido manual completo antes de entregar.
7. Programar backups coordinados de PostgreSQL y archivos, y probar restauración en otro entorno. Migraciones Flyway nuevas para cambios de esquema; no editar las ya aplicadas.

Los contenedores de runtime Java y nginx se ejecutan sin root. Un hosting con filesystem efímero pierde imágenes al reiniciar: usar volumen persistente o un adaptador externo S3 antes de desplegar allí. Frontend/backend se construyen por separado. No se publicó ningún despliegue remoto.

## Costos y límites

Opciones económicas: VPS con Docker y proxy HTTPS, o frontend estático/proxy con backend Java y PostgreSQL administrados. El VPS agrupa gastos pero requiere actualización, monitoreo y copias; los servicios administrados cobran cómputo, memoria, disco, transferencia y backups. Sumar dominio/renovación y almacenamiento de objetos si se usa. Verificar tarifas y condiciones comerciales actuales antes de contratar; no se presupone uso gratuito ilimitado ni se dan cotizaciones sin verificación.

No incluye pagos, facturación, control de stock numérico/reservas, historial de ventas, SaaS multi-tenant, recuperación por email ni WhatsApp Business API. La disponibilidad se confirma con el vendedor y puede cambiar después de preparar el mensaje. La validación del checkout expira visualmente a los cinco minutos; no reserva productos. La escala de esta versión es un comercio y una instancia de backend por instalación. Revisar avisos de dependencias, límites de infraestructura, seguridad y experiencia con datos reales antes de ofrecerla con compromisos comerciales de disponibilidad.

Mejoras previstas: almacenamiento S3, limpieza de imágenes huérfanas, cambio/recuperación de contraseña, inventario y reservas si el negocio lo requiere, y una suite de navegador automática en CI.
