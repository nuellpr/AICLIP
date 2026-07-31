import { prisma } from '@clipforge/database';

async function check() {
  const clips = await prisma.clip.findMany({ include: { project: true } });
  console.log(clips.map(c => ({ id: c.id, status: c.renderStatus, url: c.project.sourceUrl })));
}

check().finally(() => process.exit(0));
