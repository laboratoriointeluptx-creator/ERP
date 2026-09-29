# Usuarios

La administración de usuarios pertenece a la organización del administrador autenticado. Todas las rutas requieren token y permiso específico; el cliente no puede indicar otra organización.

## Endpoints

- `GET /api/v1/users`: lista usuarios de la organización con búsqueda por correo/nombre, filtro `active` y paginación de hasta 100 registros. Requiere `users.read`.
- `POST /api/v1/users`: crea una cuenta con correo, nombre, apellido y contraseña temporal de al menos 12 caracteres. Requiere `users.create`; las cuentas nuevas reciben únicamente el rol `user`.
- `PATCH /api/v1/users/:id/status`: activa o desactiva una cuenta de la misma organización. Requiere `users.update`.

La web dispone de una pantalla de administración de usuarios para consultar, buscar, filtrar, paginar, crear y activar/desactivar cuentas. La navegación se muestra a usuarios con rol `admin`; el servidor valida cada permiso de todas formas.

Las altas y cambios de estado se guardan junto con su evento de auditoría. La desactivación revoca las sesiones de actualización existentes. El access token JWT ya emitido puede seguir siendo válido hasta su expiración, que actualmente es de 15 minutos.

El hash de contraseña nunca se incluye en la respuesta. El administrador entrega la contraseña inicial por un canal seguro; todavía no existe invitación por correo ni flujo de cambio obligatorio al primer acceso. Las rutas no permiten asignar el rol `admin`; el alta inicial del administrador continúa siendo responsabilidad del seed controlado.
