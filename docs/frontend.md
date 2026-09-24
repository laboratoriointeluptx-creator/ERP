# Frontend web y mobile

Web y mobile consumiran `@erp-universal/api-client` y `@erp-universal/types`. La autenticacion no se implementara dos veces: cada plataforma proveera almacenamiento de token mediante un adapter.

La seleccion de Expo/React Native Web queda pendiente de fijar junto con versiones compatibles de React, React Native y Expo. Antes de generar aplicaciones ejecutables se debe validar web, Android y TypeScript en CI.

La primera pantalla mobile ya usa Expo SDK 57 y React Native 0.81, y su typecheck pasa. El audit del tooling mobile conserva vulnerabilidades transitivas en Metro/Image-size y uuid; no se aplicara `npm audit fix --force` hasta validar una actualización compatible. El CI audita API y web mientras este riesgo de tooling queda visible y documentado.

El dashboard debe ocultar modulos sin permisos y representar estados de carga, error y vacio. La logica de negocio permanecera en servicios y hooks compartidos, no en pantallas.
