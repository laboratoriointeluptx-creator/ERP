# Base de datos

MongoDB Atlas y Mongoose seran la persistencia principal. La fase de base de datos definira esquemas, indices justificados, migraciones versionadas y una base de desarrollo separada de produccion.

## Conexion de desarrollo

La URI de desarrollo se configura mediante `MONGODB_URI` en `.env`, nunca en codigo ni en `.env.example`. La plantilla usa un MongoDB local ficticio. Para Atlas, configura en `.env` la URI de una base de desarrollo; si la contraseña contiene caracteres reservados para URI, debe codificarse con percent-encoding.

El usuario de MongoDB debe tener permisos únicamente sobre la base de datos de desarrollo. La IP de ejecución también debe estar autorizada en MongoDB Atlas.

La conexion real no se valida automaticamente mientras la URI conserve `<db_password>`. El proceso de arranque falla de forma controlada si se configura una URI invalida, evitando que la aplicacion opere creyendo que tiene persistencia disponible.

Facturas y pagos se modelan con importes decimales como strings y referencias a la operacion comercial. CFDI, impuestos, redondeos fiscales y asientos contables requieren reglas oficiales y no se generan automaticamente en esta fase.

La contabilidad base incluye plan de cuentas y asientos con débitos y créditos balanceados. El endpoint de registro rechaza asientos desbalanceados; la definición fiscal, periodos contables y cierres requieren configuración empresarial antes de automatizarse.

El dinero se almacenara con una estrategia decimal consistente; las fechas se almacenaran en UTC y cada organizacion tendra timezone configurable. No se ejecutan migraciones destructivas automaticamente.
