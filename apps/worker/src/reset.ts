import { prisma } from '@clipforge/database';

async function reset() {
  const result = await prisma.clip.updateMany({
    data: { renderStatus: 'QUEUED' }
  });
  console.log(`Reset ${result.count} clips to QUEUED`);
}

reset().catch(console.error).finally(() => process.exit(0));
