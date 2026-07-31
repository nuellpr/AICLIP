import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const clips = await prisma.clip.findMany({
  where: {
    OR: [
      { title: { contains: 'BINGUNG' } },
      { title: { contains: 'KODOK' } }
    ]
  }
});
console.log(JSON.stringify(clips, null, 2));
await prisma.$disconnect();
