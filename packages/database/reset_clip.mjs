import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const clipId = 'cms5huqpy0009vjyxchdfdwwg';

// Reset render status
await prisma.clip.update({
  where: { id: clipId },
  data: { renderStatus: 'QUEUED' }
});
console.log('Clip status reset to QUEUED');

// Delete old rendered file
const rendersDir = 'C:\\Users\\Nuel\\Downloads\\clip\\AICLIP\\apps\\api\\public\\renders';
const oldFile = path.join(rendersDir, 'BINGUNG NYARI KODOK SAMPE LUPA JALAN.mp4');
if (fs.existsSync(oldFile)) {
  fs.unlinkSync(oldFile);
  console.log('Deleted old rendered MP4');
}

// Delete whisper cache
const whisperFile = path.join(rendersDir, `whisper_${clipId}.json`);
if (fs.existsSync(whisperFile)) {
  fs.unlinkSync(whisperFile);
  console.log('Deleted old whisper cache');
}

// Delete old temp files
const workerDir = 'C:\\Users\\Nuel\\Downloads\\clip\\AICLIP\\apps\\worker';
const tempFiles = fs.readdirSync(workerDir).filter(f => f.includes(clipId));
for (const f of tempFiles) {
  fs.unlinkSync(path.join(workerDir, f));
  console.log('Deleted temp file:', f);
}

await prisma.$disconnect();
console.log('Done');
