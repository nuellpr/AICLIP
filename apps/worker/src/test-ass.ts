import fs from 'fs';
import path from 'path';
import { generateAssFromVtt } from './subtitle';

async function test() {
  const vttFile = 'transcript_cmrt423lb0008xnfnu5kqqor9_kdxgY-G6aJs.en.vtt';
  const vttContent = fs.readFileSync(path.join(__dirname, '..', vttFile), 'utf-8');
  
  await generateAssFromVtt(
    vttContent,
    136.72, // Example start time from user screenshot
    155.4,  // Example end time
    path.join(__dirname, '../test_ass.ass'),
    {}
  );
  console.log('Done');
}
test();
