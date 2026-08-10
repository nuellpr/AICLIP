import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import path from 'path';
import fastifyStatic from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import routes from './routes';
import authRoutes from './auth';
import paymentRoutes from './paymentRoutes';

export function buildServer(opts: { rateLimitMax?: number } = {}): FastifyInstance {
  const server = Fastify({
    logger: true,
  });

  const corsOrigin = process.env.CORS_ORIGIN || '*';
  server.register(cors, {
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map(s => s.trim()),
  });

  server.register(fastifyStatic, {
    root: path.join(__dirname, '../public'),
    prefix: '/', // So /renders/file.mp4 works
  });

  const rateLimitMax = opts.rateLimitMax ?? parseInt(process.env.RATE_LIMIT_MAX || '100');
  server.register(rateLimit, { max: rateLimitMax, timeWindow: '1 minute' });
  server.addHook('onRequest', async (request, reply) => {
    // Explicit global hook: the plugin's onRoute mutation only covers
    // routes inside encapsulated plugins on Fastify 4, not root routes.
    await server.rateLimit().call(server, request, reply);
  });

  const jwtSecret = process.env.AUTH_SECRET || 'dev-insecure-secret-change-in-production';
  if (!process.env.AUTH_SECRET) {
    server.log.warn('AUTH_SECRET not set — using insecure development secret!');
  }
  server.register(jwt, { secret: jwtSecret, sign: { expiresIn: '7d' } });

  server.register(routes, { prefix: '/api' });
  server.register(authRoutes, { prefix: '/api' });
  server.register(paymentRoutes, { prefix: '/api/payment' });

  server.get('/health', async (request, reply) => {
    return { status: 'ok', service: 'api' };
  });

  server.get('/ready', async (request, reply) => {
    return { status: 'ready' };
  });

  return server;
}

if (require.main === module) {
  const server = buildServer();

  const start = async () => {
    try {
      const port = parseInt(process.env.PORT || '3001');
      await server.listen({ port, host: '0.0.0.0' });
      console.log(`API listening on port ${port}`);
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  };

  start();
}
