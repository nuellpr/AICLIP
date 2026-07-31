import { prisma } from '@clipforge/database';
import youtubedl from 'youtube-dl-exec';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import { generateAssFromVtt } from './src/subtitle';

async function testRender() {
  const clip = await prisma.clip.findFirst({
    where: { renderStatus: 'FAILED' },
    include: { project: true },
    orderBy: { createdAt: 'desc' }
  });

  if (!clip) {
    console.log("No failed clip found");
    return;
  }

  console.log(`Testing render for clip ${clip.id}`);

  const safeTitle = clip.title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || clip.id;
  const filename = `test_${safeTitle}.mp4`;
  const outputPath = path.join(__dirname, 'test_output', filename);
  if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  ffmpeg.setFfmpegPath(ffmpegStatic!);

  const tempPath = path.join(__dirname, `temp_${clip.id}.mp4`);
  const assPath = path.join(__dirname, `subs_${clip.id}.ass`);
  
  const options: any = {
    downloadSections: `*${clip.startTime}-${clip.endTime}`,
    output: tempPath,
    format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    ffmpegLocation: ffmpegStatic,
    noCheckCertificates: true,
    youtubeSkipDashManifest: true
  };

  try {
    console.log('Running yt-dlp...');
    await youtubedl(clip.project.sourceUrl!, options);
    
    console.log('Generating ASS...');
    let styleObj = { fontName: 'Impact', primaryColour: '&H0000FFFF' };
    const subFile = fs.readdirSync(__dirname).find(f => f.startsWith(`transcript_${clip.projectId}_`) && f.endsWith('.vtt'));
    let vttContent = '';
    if (subFile) vttContent = fs.readFileSync(path.join(__dirname, subFile), 'utf-8');
    
    await generateAssFromVtt(vttContent, clip.startTime, clip.endTime, assPath, styleObj);

    console.log('Running FFmpeg...');
    const formattedAssPath = path.basename(assPath);
    let command = ffmpeg(tempPath);
    
    // Simplest filter to test
    const filterComplex = [
      { filter: 'subtitles', options: formattedAssPath, inputs: '0:v', outputs: 'final' }
    ];

    command = command.complexFilter(filterComplex, 'final');

    await new Promise((resolve, reject) => {
      command
        .outputOptions(['-map', '0:a?', '-threads', '0'])
        .outputOptions('-c:v libx264')
        .outputOptions('-preset ultrafast')
        .outputOptions('-c:a aac')
        .output(outputPath)
        .on('stderr', (stderrLine) => {
          console.log('FFMPEG STDERR:', stderrLine);
        })
        .on('end', () => resolve(true))
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });

    console.log("SUCCESS!");
  } catch (err) {
    console.error("FAILED!", err);
  }
}

testRender();
