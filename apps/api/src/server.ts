import { app } from './app.js';
import { env } from './config/env.js';
import { connectToDatabase } from './infrastructure/database.js';

const start = async (): Promise<void> => {
  await connectToDatabase();
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`ERP API listening on port ${env.PORT}`);
  });
};

start().catch((error: unknown) => {
  console.error('Unable to start ERP API', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
