# ERP Universal

ERP modular multiempresa para comercio, servicios, distribucion y operaciones empresariales.

Repositorio: https://github.com/laboratoriointeluptx-creator/ERP

## Estado

Fases iniciales: workspace TypeScript, API Express versionada, MongoDB/Mongoose, health checks, organizaciones tenant-scoped, autenticacion JWT, RBAC inicial, seed de desarrollo y pruebas HTTP.

## Arquitectura

El proyecto usa un monolito modular preparado para extraer modulos posteriormente. Consulta [docs/architecture/initial-analysis.md](docs/architecture/initial-analysis.md) y [docs/architecture/architecture.md](docs/architecture/architecture.md).

## Requisitos

- Node.js 20 LTS o superior.
- npm 10 o superior.
- MongoDB Atlas de desarrollo para la fase de persistencia.

## Instalacion

```bash
npm install
copy .env.example .env
npm run typecheck
npm test
```

En PowerShell, `Copy-Item .env.example .env` es equivalente a `copy`.

## Desarrollo del API

```bash
npm run dev --workspace apps/api
```

El API escucha por defecto en `http://localhost:3000`.

## Scripts

- `npm run typecheck`: valida TypeScript en los workspaces.
- `npm test`: ejecuta las pruebas.
- `npm run build`: compila el API.
- `npm run lint`: ejecuta la comprobacion TypeScript usada como lint inicial.

CI ejecuta `npm ci`, auditoria de dependencias, typecheck, tests y build en cada pull request y push a `main`.

## Estructura

```text
apps/api       Backend REST
apps/web       Cliente web futuro con React Native Web
apps/mobile    Cliente mobile futuro con React Native
packages       Codigo compartido
infrastructure Entorno y despliegue
 tests          Pruebas transversales
docs            Arquitectura y contratos
```

## Seguridad

No subas `.env`. Las credenciales deben existir solo en el entorno de ejecucion. El API no expone secretos ni detalles internos en respuestas de error.
