# Demo en Render, Neon y Vercel

1. En Neon creá una base y un rol exclusivos para esta demo. Usá una conexión directa y conservá el host, la base, el usuario y la contraseña.
2. En Render creá un Blueprint a partir de este repositorio. Cargá **DB_URL** con formato jdbc:postgresql://HOST:5432/BASE?sslmode=require, **DB_USER** y **DB_PASSWORD** con los datos de Neon. El servicio usa el perfil demo y su endpoint de salud es /actuator/health.
3. En Vercel importá el repositorio, elegí **frontend** como Root Directory y Node.js 24. Configurá **RENDER_API_ORIGIN** con el origen HTTPS que asignó Render. La configuración del repositorio compila Angular y reenvía /api al backend.

El catálogo usa productos ficticios y permite revisar el mensaje del carrito. El perfil demo oculta el número de WhatsApp y el envío. Dejá ADMIN_USERNAME y ADMIN_PASSWORD sin definir en la demo. En Render Free las imágenes subidas al disco local se perderían al reiniciar.

En Render, **FRONTEND_ORIGIN** debe ser el dominio de producción de Vercel completo, con https:// y sin barra final. Si todavía no conocés ese dominio, usá https://localhost como valor temporal. Cuando Vercel asigne el dominio definitivo, actualizá el valor y volvé a desplegar el backend.
