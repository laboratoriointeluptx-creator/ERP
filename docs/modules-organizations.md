# Organizations

## Endpoints

- `GET /api/v1/organizations/me`: devuelve la organizacion del `organizationId` incluido en el access token.
- `PATCH /api/v1/organizations/me`: actualiza nombre, zona horaria o moneda de la organizacion actual.

Ambos endpoints requieren `Authorization: Bearer <access_token>`. El cliente no puede seleccionar otro tenant mediante un parametro; el contexto proviene del token y el repositorio verifica el `organizationId`.

## Modelo e indices

La coleccion `organizations` usa `code` unico y un indice para organizaciones activas ordenadas por fecha. Los defaults son `UTC`, `MXN` y `active: true`.

## Bootstrap

La creacion inicial se realizara mediante un seed de desarrollo controlado. No existe un endpoint publico de alta porque eso permitiria crear tenants sin un flujo de administracion o invitacion definido.

## Seed de desarrollo

Con `.env` configurado, ejecuta desde la raiz:

```powershell
npm.cmd run seed --workspace apps/api
```

El seed es idempotente y solo crea o actualiza los datos demo identificados por codigo y correo. No elimina colecciones ni datos. Crea la organizacion `LAB-DEMO` y el usuario `admin@laboratorio.demo`. Antes de ejecutarlo, configura `SEED_ADMIN_PASSWORD` en el entorno local; el secreto no tiene valor por defecto ni se registra en logs.
