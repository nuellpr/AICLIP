import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegStatic!);

const tempPath = path.join(__dirname, '../temp_cmrt258280001zmb9jq4wl8ai.mp4');
const assPath = path.join(__dirname, '../subs_cmrt258280001zmb9jq4wl8ai.ass');
const outputPath = path.join(__dirname, '../test_output.mp4');

const formattedAssPath = path.basename(assPath);
console.log('Formatted ASS path:', formattedAssPath);

ffmpeg(tempPath)
  .videoFilters([
    'crop=ih*9/16:ih:iw/2-ih*9/32:0',
    `subtitles=${formattedAssPath}`
  ])
  .outputOptions('-c:v libx264')
  .outputOptions('-preset fast')
  .outputOptions('-c:a aac')
  .output(outputPath)
  .on('start', (cmdLine) => console.log('Started with command:', cmdLine))
  .on('end', () => console.log('Finished successfully'))
  .on('error', (err, stdout, stderr) => {
    console.error('FFmpeg render error:', err.message);
    console.error('FFmpeg stderr:', stderr);
  })
  .run();
