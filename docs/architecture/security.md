# Seguridad

La autenticacion usara contraseñas hasheadas, access tokens de corta duracion y refresh tokens revocables. La autorizacion sera RBAC basado en permisos `recurso.accion`.

Los secretos se inyectan por variables de entorno. Los errores de produccion no incluyen stack traces ni detalles internos. Las operaciones criticas generaran auditoria sin registrar credenciales.

## Estado de autenticacion

La base actual incluye usuarios asociados a `organizationId`, contraseñas con bcrypt, access tokens JWT de 15 minutos, refresh tokens de 30 dias almacenados como hash, logout revocable, recuperacion de contraseña mediante tokens SHA-256 de un solo uso y expiracion de 30 minutos, revocacion de sesiones refresh al cambiar contraseña, validacion de bearer tokens y errores de validacion uniformes. MFA queda pendiente.

El endpoint forgot-password devuelve el mismo estado y cuerpo para cuentas existentes e inexistentes. Los tokens y contraseñas no se registran en auditoria ni logs. La URL del enlace se compone desde `FRONTEND_BASE_URL`; el remitente se configura mediante `EMAIL_FROM` y la clave del proveedor mediante `RESEND_API_KEY`.

El login limita a ocho intentos por combinacion de organizacion y correo durante una ventana de 15 minutos. Los contadores se guardan en MongoDB y expiran automaticamente. Esto cubre intentos distribuidos contra una cuenta; todavia falta limitar por IP para controlar abuso que rote entre cuentas.

La autorizacion inicial usa permisos explicitos como `organizations.read` y `organizations.update`, resueltos desde los roles del token. Los endpoints protegidos deben aplicar autenticacion antes de autorizacion.
