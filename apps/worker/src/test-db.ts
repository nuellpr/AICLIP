import { prisma } from '@clipforge/database';

async function test() {
  const clip = await prisma.clip.findUnique({
    where: { id: 'cmrt5gi2h0003qky86bcmou5u' }
  });
  console.log(clip);
}
test();
