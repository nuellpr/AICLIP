import { prisma } from '@clipforge/database';
async function reset() {
  await prisma.clip.updateMany({ where: { renderStatus: 'RENDERING' }, data: { renderStatus: 'QUEUED' } });
  console.log('Reset done');
}
reset();
