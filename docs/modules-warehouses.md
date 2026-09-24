# Almacenes

## Endpoints

- `GET /api/v1/warehouses?page=1&limit=25`: lista almacenes activos de la organización del token, ordenados por nombre y paginados.
- `POST /api/v1/warehouses`: crea un almacén con código, nombre y una sucursal opcional.

Ambos endpoints requieren autenticación y sus permisos `warehouses.read` y `warehouses.create`. La organización nunca se acepta del body. Si se envía `branchId`, debe pertenecer a la misma organización y estar activa.

Los códigos son únicos por organización. Si existe un código duplicado, la API devuelve `WAREHOUSE_CODE_EXISTS`. El servicio de recepción de compras solo acepta almacenes activos de la organización actual.
