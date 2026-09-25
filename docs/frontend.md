# Frontend web y mobile

Web y mobile consumiran `@erp-universal/api-client` y `@erp-universal/types`. La autenticacion no se implementara dos veces: cada plataforma proveera almacenamiento de token mediante un adapter.

La seleccion de Expo/React Native Web queda pendiente de fijar junto con versiones compatibles de React, React Native y Expo. Antes de generar aplicaciones ejecutables se debe validar web, Android y TypeScript en CI.

La primera pantalla mobile ya usa Expo SDK 57 y React Native 0.81, y su typecheck pasa. El audit del tooling mobile conserva vulnerabilidades transitivas en Metro/Image-size y uuid; no se aplicara `npm audit fix --force` hasta validar una actualización compatible. El CI audita API y web mientras este riesgo de tooling queda visible y documentado.

El dashboard debe ocultar modulos sin permisos y representar estados de carga, error y vacio. La logica de negocio permanecera en servicios y hooks compartidos, no en pantallas.
# Dashboard web

El dashboard solicita inicio de sesión con ID de organización, correo y contraseña. Configura `VITE_API_URL` en `apps/web/.env` con la URL de la API; su valor predeterminado en desarrollo es `http://localhost:3000`.

El access token y refresh token permanecen en memoria y se eliminan al cerrar sesión o recargar la página. Al actualizar los datos, la web renueva el access token si venció. La API entrega métricas y actividad reciente tenant-scoped, y omite las secciones para las que el rol no tiene permisos. Las métricas son conteos de registros; no representan importes ni indicadores contables. El dashboard móvil todavía usa datos de muestra.
