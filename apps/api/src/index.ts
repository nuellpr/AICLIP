import Fastify from 'fastify';
import cors from '@fastify/cors';
import path from 'path';
import fastifyStatic from '@fastify/static';
import routes from './routes';

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

server.register(routes, { prefix: '/api' });

server.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'api' };
});

server.get('/ready', async (request, reply) => {
  return { status: 'ready' };
});

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

// Trigger restart
