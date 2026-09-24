import { Router } from 'express';
import type { ApiSuccess } from '../../shared/http.js';

export type DatabaseHealth = () => {
  status: 'not_configured' | 'connecting' | 'connected' | 'disconnected';
  configured: boolean;
};

export const healthRouter = (getDatabaseHealth: DatabaseHealth): Router => {
  const router = Router();

  router.get('/', (_request, response) => {
    const body: ApiSuccess<{ status: string; timestamp: string }> = {
      success: true,
      data: { status: 'ok', timestamp: new Date().toISOString() },
    };
    response.json(body);
  });

  router.get('/database', (_request, response) => {
    const body: ApiSuccess<ReturnType<DatabaseHealth>> = {
      success: true,
      data: getDatabaseHealth(),
    };
    response.json(body);
  });

  router.get('/ready', (_request, response) => {
    const database = getDatabaseHealth();
    const ready = database.status === 'connected';
    const body: ApiSuccess<{ ready: boolean; database: ReturnType<DatabaseHealth> }> = {
      success: true,
      data: { ready, database },
    };
    response.status(ready ? 200 : 503).json(body);
  });

  return router;
};
