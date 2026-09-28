# Seguridad

La autenticacion usara contraseñas hasheadas, access tokens de corta duracion y refresh tokens revocables. La autorizacion sera RBAC basado en permisos `recurso.accion`.

Los secretos se inyectan por variables de entorno. Los errores de produccion no incluyen stack traces ni detalles internos. Las operaciones criticas generaran auditoria sin registrar credenciales.

## Estado de autenticacion

La base actual incluye usuarios asociados a `organizationId`, contraseñas con bcrypt, access tokens JWT de 15 minutos, refresh tokens de 30 dias almacenados como hash, logout revocable, validacion de bearer tokens y errores de validacion uniformes. Recuperacion de contraseña y MFA quedan para la siguiente iteracion; no se simulan como terminados.

El login limita a ocho intentos por combinacion de organizacion y correo durante una ventana de 15 minutos. Los contadores se guardan en MongoDB y expiran automaticamente. Esto cubre intentos distribuidos contra una cuenta; todavia falta limitar por IP para controlar abuso que rote entre cuentas.

La autorizacion inicial usa permisos explicitos como `organizations.read` y `organizations.update`, resueltos desde los roles del token. Los endpoints protegidos deben aplicar autenticacion antes de autorizacion.
