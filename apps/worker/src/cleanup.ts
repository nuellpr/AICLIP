import fs from 'fs';
import path from 'path';
import cron from 'node-cron';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function cleanupOldFiles(dirPath: string, maxAgeMs: number, filterPrefix?: string) {
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath);
  const now = Date.now();

  for (const file of files) {
    if (filterPrefix && !file.startsWith(filterPrefix)) continue;

    const fullPath = path.join(dirPath, file);
    try {
      const stats = fs.statSync(fullPath);
      if (stats.isFile() && (now - stats.mtimeMs > maxAgeMs)) {
        fs.unlinkSync(fullPath);
        console.log(`[Cleanup] Deleted old file: ${file}`);
      }
    } catch (e: any) {
      console.error(`[Cleanup] Failed to stat/delete ${file}:`, e.message);
    }
  }
}

export function startCleanupCron() {
  // Run every midnight
  cron.schedule('0 0 * * *', () => {
    console.log('[Cleanup] Running daily cleanup cron job...');
    
    // Clean worker temp files (temp_*, transcript_*, subs_*)
    const workerDir = path.join(__dirname, '..');
    cleanupOldFiles(workerDir, ONE_DAY_MS, 'temp_');
    cleanupOldFiles(workerDir, ONE_DAY_MS, 'transcript_');
    cleanupOldFiles(workerDir, ONE_DAY_MS, 'subs_');

    // Clean Web public renders directory
    const rendersDir = path.join(__dirname, '../../web/public/renders');
    cleanupOldFiles(rendersDir, ONE_DAY_MS * 7); // keep rendered files for 7 days
    
    console.log('[Cleanup] Cleanup complete.');
  });
  
  console.log('Cleanup cron job scheduled (runs daily at midnight).');
}
