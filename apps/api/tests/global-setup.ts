import { execSync } from 'child_process';
import path from 'path';

export default function setup() {
  const databaseDir = path.resolve(process.cwd(), '../../packages/database');
  execSync('npx prisma db push --schema prisma/schema.prisma --skip-generate --accept-data-loss', {
    cwd: databaseDir,
    env: { ...process.env, DATABASE_URL: 'file:../dev.test.db' },
    stdio: 'pipe',
  });
}
