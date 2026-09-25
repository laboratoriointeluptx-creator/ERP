# Render

El archivo raíz `render.yaml` define dos servicios enlazados al mismo repositorio: API Node y web estática Vite. La web obtiene `VITE_API_URL` del URL público generado para la API; Render reconstruye ambos servicios desde `main` al sincronizar el Blueprint.

## Crear servicios

1. En Render, selecciona **New > Blueprint** y conecta `laboratoriointeluptx-creator/ERP`.
2. En la revisión del Blueprint, completa `MONGODB_URI` con la URI de MongoDB Atlas y `MONGODB_DB_NAME` con el mismo nombre de base de datos que usa el `.env` local.
3. Render genera `JWT_SECRET` y `JWT_REFRESH_SECRET`. No reutilices secretos locales ni publiques valores en `render.yaml`.
4. Sincroniza el Blueprint. Se crearán `erp-universal-api` y `erp-universal-web` en Ohio; la API comprueba la base de datos en `/health/ready`.

## Acceso de Atlas

Una vez creado el servicio de API, abre **Connect > Outbound** en Render y agrega a la lista de acceso de red del proyecto Atlas los rangos CIDR de salida de ese servicio. No abras el clúster a todas las IPs. Si Render no puede alcanzar Atlas, el API no pasa su health check y el servicio no completa el deploy.

## Acceso

La web usa el dominio `onrender.com` de su servicio. Para entrar, usa el ID de la organización `LAB-DEMO`, `admin@laboratorio.demo` y la contraseña que configuraste con `SEED_ADMIN_PASSWORD` al crear los datos demo. No se ejecuta el seed en Render; se conserva la base existente de Atlas.

Los planes gratuitos de Render son para evaluación y pueden suspender servicios inactivos; no se recomiendan para producción. Consulta [los límites actuales del plan gratuito](https://render.com/docs/free) antes de usarlo con operaciones reales.
