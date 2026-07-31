import { execSync } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';

console.log('Using ffmpeg path:', ffmpegStatic);
execSync(`"${ffmpegStatic}" -y -f lavfi -i color=c=black:s=640x360:r=30 -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -c:v libx264 -c:a aac dummy.mp4`, { stdio: 'inherit' });
console.log('dummy.mp4 generated');
