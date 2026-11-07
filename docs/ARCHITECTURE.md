# Decisiones de arquitectura

Cada instalación tiene sus propios usuarios, migraciones Flyway, base PostgreSQL y volúmenes.

El backend es un monolito modular por funcionalidad. Las entidades JPA no se serializan desde controllers; los DTOs y mappers delimitan lo que se publica. Los servicios de producto, configuración y checkout contienen las reglas relevantes. Las referencias de categoría usan acceso por métodos para resolver proxies lazy correctamente. Hibernate valida el esquema creado exclusivamente por migraciones Flyway versionadas.

Los productos tienen categoría, precios decimales, promoción, mínimo, disponibilidad, imágenes ordenadas, atributos y variantes. Las imágenes y atributos se normalizan en tablas relacionadas; las variantes tienen UUID estable, precio/disponibilidad propios y atributos flexibles. La versión optimista del producto rechaza ediciones simultáneas desactualizadas.

El pedido no es una entidad persistida. El checkout recibe identificadores y cantidades, consulta los datos actuales, valida reglas y calcula con BigDecimal. Devuelve un mensaje y un enlace oficial wa.me; no registra nombre, teléfono, localidad ni observaciones del comprador. No se registran payloads en logs. Preparar el mensaje o abrir WhatsApp no prueba envío ni recepción y no reserva productos.

Angular usa rutas con carga diferida para separar tienda y panel, un servicio de API con intercambio CSRF para escrituras, Signals para estado y Reactive Forms para formularios. El carrito guarda solo selección y datos orientativos en LocalStorage; suma en centavos enteros, diferencia variantes, valida restauración y deja al servidor la decisión final. Los datos personales del checkout permanecen en memoria y expiran con la vista; la validación visible vence a los cinco minutos o al cambiar datos/carrito.

Spring Security gestiona autenticación de formulario, BCrypt, rotación y cierre de sesión. Cookie de sesión HttpOnly, SameSite=Lax, Secure por defecto; excepción explícita para development. La cookie CSRF es legible por Angular deliberadamente y no contiene autenticación. CORS admite un origen exacto, sin comodines. Los endpoints administrativos requieren ROLE_ADMIN. Bootstrap con variables explícitas solamente cuando no hay usuarios, sin cuenta predeterminada productiva. Límite local y acotado de intentos de login.

Nginx sirve Angular y deriva /api al backend con el mismo origen. Los Dockerfiles son independientes y sus procesos de runtime se ejecutan sin root. Compose crea recursos propios y espera salud de base/backend antes de servir frontend. Las imágenes locales viven en un volumen persistente, tienen nombre generado, se validan y recodifican; ImageStorage permite sustituir el adaptador por uno compatible con S3.

Se mantiene una instalación y una instancia por comercio. Para varias réplicas se requiere resolver sesiones compartidas, rate limiting compartido y almacenamiento común. No se incorporaron microservicios, colas, pagos, facturación ni multitenancy.

Límites explícitos: sin reserva/stock cuantitativo, limpieza automática de archivos sin referencia, recuperación/cambio de contraseña desde el panel, ni garantía de operación fuera de un entorno probado con infraestructura productiva. Las pruebas y documentación comercial no sustituyen revisión de seguridad, backups, restauración y validación con datos reales antes de entregar a un cliente.
