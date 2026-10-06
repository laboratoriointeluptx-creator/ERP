# Resend: correo transaccional

## Configuracion

Define `RESEND_API_KEY` en el `.env` local para desarrollo. El archivo `.env.example` contiene solo el nombre de la variable, sin valor real. En produccion, configura el mismo nombre como secreto del entorno de ejecucion o como GitHub/secret-manager secret; nunca lo agregues al repositorio, frontend, logs o respuestas HTTP.

La identidad `from` se pasa desde integraciones internas del backend y debe ser un remitente/dominio verificado en Resend. No se acepta desde una ruta publica creada por esta integracion. No existe todavia una configuracion ERP para administrar remitentes por organizacion.

## Arquitectura

`EmailService` depende de la interfaz `EmailProvider`; `ResendEmailProvider` implementa el transporte y obtiene la API key de `env.RESEND_API_KEY` solo al enviar. Los errores del proveedor se convierten a errores sanitizados sin propagar respuestas que pudieran incluir datos sensibles.

El servicio permite correo transaccional, recovery de contraseña, verificacion de email e invitacion de usuarios como plantillas. Las plantillas solo envian mensajes; no crean tokens, usuarios, invitaciones ni estados de cuenta.

El modulo de Notifications puede entregar una notificacion activa de tipo/canal EMAIL a sus destinatarios estaticos `recipients.emails`. La entrega se invoca desde servicios internos, usa contenido de texto plano y actualiza `sentCount`, `failedCount` y `lastSentAt`. No existe aun un dispatcher de eventos que invoque automaticamente esta funcion.

## Pendiente

- Crear flujos reales de recuperacion de contraseña, verificacion de email e invitaciones, incluyendo tokens de un solo uso, expiracion, persistencia, rutas y auditoria.
- Resolver destinatarios de notificaciones configurados por `userIds` y `roleIds`.
- Conectar eventos/workflows, scheduling, cola y politica de reintentos al dispatcher de notificaciones.
- Configurar un remitente verificado y una `RESEND_API_KEY` real para probar entregas externas. No se ejecutaron envios reales durante esta integracion.
