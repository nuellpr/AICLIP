import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@clipforge/database';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.code(401).send({ error: 'Token tidak valid atau kedaluwarsa. Silakan login kembali.' });
  }
}

// SSE (EventSource) cannot send Authorization headers, so accept ?token= as fallback.
export async function sseAuthenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    return;
  } catch (err) {}

  const token = (request.query as any)?.token;
  if (!token) {
    return reply.code(401).send({ error: 'Autentikasi diperlukan. Silakan login terlebih dahulu.' });
  }
  try {
    const payload = (request.server as any).jwt.verify(token);
    (request as any).user = payload;
  } catch (err) {
    return reply.code(401).send({ error: 'Token tidak valid atau kedaluwarsa. Silakan login kembali.' });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.code(401).send({ error: 'Autentikasi diperlukan. Silakan login terlebih dahulu.' });
  }

  const { sub } = request.user as any;
  const user = await prisma.user.findUnique({ where: { id: sub } });
  if (!user || (user as any).role !== 'ADMIN') {
    return reply.code(403).send({ error: 'Akses ditolak. Hanya administrator yang diizinkan.' });
  }
}

export function getUserId(request: FastifyRequest): string {
  return (request.user as any).sub;
}

export async function loadOwnedClip(clipId: string, userId: string): Promise<any | null> {
  const clip = await prisma.clip.findUnique({
    where: { id: clipId },
    include: { project: true },
  });
  if (!clip || clip.project.userId !== userId) return null;
  return clip;
}
