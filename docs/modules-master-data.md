# Datos maestros

## Pantalla web inicial

La pantalla **Datos maestros** reúne consultas paginadas y altas para clientes, proveedores, productos, sucursales, almacenes, categorías y unidades. Los campos enviados corresponden a los esquemas Zod de cada endpoint; los códigos/SKU se normalizan en la API.

## Endpoints existentes

- `GET|POST|PATCH /api/v1/customers`
- `GET|POST|PATCH /api/v1/suppliers`
- `GET|POST|PATCH /api/v1/products`
- `GET|POST|PATCH /api/v1/branches`
- `GET|POST|PATCH /api/v1/warehouses`
- `GET|POST|PATCH /api/v1/catalogs/categories`
- `GET|POST|PATCH /api/v1/catalogs/units`

Cada endpoint aplica autenticación, permisos separados de lectura/creación/actualización y el `organizationId` firmado en el token. Los siete catálogos permiten edición parcial y cambio lógico de estado vía `PATCH`; las modificaciones se guardan con auditoría en transacción. Los listados aceptan `active=true|false` (por omisión muestran activos) y limitan la paginación a 100 resultados por página. La web permite buscar, paginar, crear, editar, desactivar y reactivar en cada catálogo. Los formularios de almacén y categoría usan selectores con sucursales/categorías activas. Una sucursal con almacenes activos y una categoría con subcategorías activas no se pueden desactivar.

## Pendiente para completar el módulo

- Mejor manejo de permisos de lectura/escritura por separado en el menú web.
- Importación/exportación e historial de cambios.
