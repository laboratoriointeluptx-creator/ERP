# Recuperacion de contraseña

## Configuracion

- `FRONTEND_BASE_URL`: URL HTTPS/HTTP del frontend, sin query ni fragmento. El enlace apunta a `/reset-password?token=...`.
- `EMAIL_FROM`: remitente verificado en Resend. No contiene secretos.
- `RESEND_API_KEY`: clave de Resend ya configurada como secreto de entorno; no se escribe en el codigo ni se devuelve por API.

Los valores se configuran en el entorno local o en el secret manager del despliegue. `.env.example` documenta los nombres y placeholders, nunca credenciales reales.

## Endpoints

- `POST /api/v1/auth/forgot-password`: recibe `organizationId` y `email`; responde siempre con el mismo `202` y cuerpo para cuentas existentes o inexistentes.
- `POST /api/v1/auth/reset-password`: recibe el token y `newPassword` (12-128 caracteres).

## Seguridad y persistencia

El token se genera con 32 bytes aleatorios, se guarda como SHA-256, expira en 30 minutos y se consume mediante una actualizacion atomica. El cambio de password, consumo, invalidacion de otros recovery tokens, revocacion de sesiones refresh y auditoria ocurren en una transaccion MongoDB.

La contraseña usa el servicio bcrypt existente. Ni el token ni la contraseña se guardan en auditoria o logs. Los access JWT existentes son stateless y pueden seguir vigentes hasta su expiracion de 15 minutos; las sesiones refresh quedan revocadas inmediatamente.

Recovery requiere que MongoDB soporte transacciones (Atlas replica set), `RESEND_API_KEY`, un remitente admitido/verificado y `FRONTEND_BASE_URL`. Si Resend falla, el endpoint forgot mantiene su respuesta generica y registra solo un codigo de error sanitizado; el usuario puede solicitar otro enlace.
