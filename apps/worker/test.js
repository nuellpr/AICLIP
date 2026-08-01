const cp = require('child_process');
const f = require('ffmpeg-static');
console.log(cp.execSync(`"${f}" -h filter=crop`, {encoding: 'utf8'}));
