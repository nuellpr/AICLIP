import youtubedl from 'youtube-dl-exec';
import path from 'path';
import fs from 'fs';

async function test() {
  const options: any = {
    writeAutoSubs: true,
    skipDownload: true,
    subFormat: 'vtt',
    output: path.join(__dirname, '../test_transcript_%(id)s.%(ext)s'),
    noCheckCertificates: true,
    cookies: path.join(__dirname, '../cookies.txt'),
    jsRuntimes: 'node'
  };
  console.log('Downloading subs...');
  await youtubedl('https://youtu.be/RiNoZrnoNl4', options);
  
  const files = fs.readdirSync(path.join(__dirname, '..'));
  const subFile = files.find(f => f.startsWith('test_transcript_') && f.endsWith('.vtt'));
  console.log('Downloaded file:', subFile);
}
test().catch(console.error);
