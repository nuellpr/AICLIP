import { prisma } from '@clipforge/database';

async function check() {
  const clips = await prisma.clip.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3
  });
  console.log(clips.map((c: any) => ({ id: c.id, title: c.title, renderStatus: c.renderStatus, renderedFileKey: c.renderedFileKey })));
}
check();
