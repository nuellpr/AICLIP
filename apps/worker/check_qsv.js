const cp = require('child_process');
const f = require('ffmpeg-static');
try {
  const result = cp.execSync(`"${f}" -encoders | findstr qsv`, { encoding: 'utf-8' });
  console.log(result);
} catch (e) {
  console.log('No qsv found or error');
}
