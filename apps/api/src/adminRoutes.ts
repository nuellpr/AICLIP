import { FastifyInstance } from 'fastify';
import { prisma } from '@clipforge/database';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { authenticate, requireAdmin } from './guards';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const projectQueue = new Queue('projectQueue', { connection });
const renderQueue = new Queue('renderQueue', { connection });

export default async function adminRoutes(server: FastifyInstance) {
  // 1. Overall Stats & Daily Chart Data
  server.get('/stats', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    try {
      const totalUsers = await prisma.user.count();
      const totalProjects = await prisma.project.count();
      const totalClips = await prisma.clip.count({ where: { renderStatus: 'READY' } });

      const transactions = await (prisma as any).transaction.findMany({
        where: { status: 'SETTLEMENT' },
        select: { amount: true },
      });
      const totalRevenue = transactions.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

      // Last 7 days video processing stats
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const recentClips = await prisma.clip.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
        select: { createdAt: true },
      });

      const dailyMap: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        dailyMap[dateStr] = 0;
      }

      recentClips.forEach((clip) => {
        const dateStr = new Date(clip.createdAt).toISOString().split('T')[0];
        if (dailyMap[dateStr] !== undefined) {
          dailyMap[dateStr]++;
        }
      });

      const dailyStats = Object.keys(dailyMap).map((date) => ({
        date,
        count: dailyMap[date],
      }));

      return reply.send({
        totalUsers,
        totalProjects,
        totalClips,
        totalRevenue,
        dailyStats,
      });
    } catch (err: any) {
      server.log.error('Admin stats error:', err);
      return reply.status(500).send({ error: 'Gagal mengambil data statistik admin' });
    }
  });

  // 2. BullMQ & Redis Monitoring
  server.get('/queues', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    try {
      const [projectCounts, renderCounts] = await Promise.all([
        projectQueue.getJobCounts('active', 'waiting', 'completed', 'failed', 'delayed'),
        renderQueue.getJobCounts('active', 'waiting', 'completed', 'failed', 'delayed'),
      ]);

      const redisStatus = connection.status; // 'ready', 'connecting', etc.

      return reply.send({
        redis: {
          status: redisStatus,
          url: redisUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Mask credentials
        },
        queues: [
          {
            name: 'projectQueue (AI Clipping)',
            active: projectCounts.active || 0,
            waiting: projectCounts.waiting || 0,
            completed: projectCounts.completed || 0,
            failed: projectCounts.failed || 0,
            delayed: projectCounts.delayed || 0,
          },
          {
            name: 'renderQueue (FFmpeg Video)',
            active: renderCounts.active || 0,
            waiting: renderCounts.waiting || 0,
            completed: renderCounts.completed || 0,
            failed: renderCounts.failed || 0,
            delayed: renderCounts.delayed || 0,
          },
        ],
      });
    } catch (err: any) {
      server.log.error('Admin queues error:', err);
      return reply.status(500).send({ error: 'Gagal mengambil data antrean server' });
    }
  });

  // 3. User Management List
  server.get('/users', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          subscriptions: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { projects: true },
          },
        },
      });

      const formattedUsers = users.map((u) => {
        const sub = u.subscriptions[0];
        return {
          id: u.id,
          email: u.email,
          name: u.name || 'User',
          role: (u as any).role || 'USER',
          createdAt: u.createdAt,
          plan: sub?.plan || 'FREE',
          credits: sub?.credits ?? 25,
          projectCount: u._count.projects,
        };
      });

      return reply.send({ users: formattedUsers });
    } catch (err: any) {
      server.log.error('Admin users error:', err);
      return reply.status(500).send({ error: 'Gagal mengambil daftar pengguna' });
    }
  });

  // 4. Manual Credit Top-Up / Edit by Admin
  server.post('/users/:userId/credits', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      const body = request.body as { creditsToAdd?: number; mode?: 'ADD' | 'SET' };
      const amount = body.creditsToAdd ?? 50;
      const mode = body.mode || 'ADD';

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.status(404).send({ error: 'Pengguna tidak ditemukan' });
      }

      let sub = await prisma.subscription.findFirst({ where: { userId } });
      if (!sub) {
        sub = await prisma.subscription.create({
          data: {
            userId,
            plan: 'FREE',
            status: 'ACTIVE',
            credits: mode === 'SET' ? amount : amount,
          },
        });
      } else {
        const newCredits = mode === 'SET' ? amount : Math.max(0, sub.credits + amount);
        sub = await prisma.subscription.update({
          where: { id: sub.id },
          data: { credits: newCredits, status: 'ACTIVE' },
        });
      }

      return reply.send({
        status: 'success',
        userId,
        newCredits: sub.credits,
        message: `Berhasil ${mode === 'SET' ? 'mengubah' : 'menambahkan'} kredit menjadi ${sub.credits} menit.`,
      });
    } catch (err: any) {
      server.log.error('Admin add credits error:', err);
      return reply.status(500).send({ error: 'Gagal memperbarui kredit pengguna' });
    }
  });

  // 5. Update User Role (ADMIN / USER)
  server.patch('/users/:userId/role', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      const body = request.body as { role?: string };
      const newRole = (body.role || 'USER').toUpperCase();

      if (!['USER', 'ADMIN'].includes(newRole)) {
        return reply.status(400).send({ error: 'Role tidak valid. Harus USER atau ADMIN.' });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole } as any,
      });

      return reply.send({
        status: 'success',
        userId: updatedUser.id,
        role: (updatedUser as any).role,
      });
    } catch (err: any) {
      server.log.error('Admin update role error:', err);
      return reply.status(500).send({ error: 'Gagal memperbarui role pengguna' });
    }
  });
}
