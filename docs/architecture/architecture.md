# Arquitectura

## Principio

El backend comienza como un monolito modular. Cada modulo controla sus rutas, controladores, servicios, repositorios, modelos, validadores, tipos y pruebas. Las dependencias entre modulos deben pasar por contratos explicitos.

## Capas

- Routes: middleware y registro de endpoints.
- Controllers: transporte HTTP y respuestas.
- Services: reglas de negocio y orquestacion.
- Repositories: persistencia.
- Models: esquemas Mongoose.
- Validators: contratos de entrada.

## Fronteras

Los modulos no acceden directamente a repositorios de otros modulos. Los procesos transversales se coordinan mediante servicios de aplicacion y eventos internos, manteniendo abierta la extraccion futura.

## Multi-tenancy

Toda entidad empresarial tendra `organizationId`. El contexto de autenticacion se aplicara en services y repositories; el frontend nunca sera una frontera de seguridad.

## API

La API publica se versiona bajo `/api/v1` y devuelve respuestas uniformes de exito y error. Se añadiran OpenAPI y autenticacion cuando existan los contratos de identidad.
