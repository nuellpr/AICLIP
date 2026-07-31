import fs from 'fs';
import path from 'path';
import { generateAssFromVtt } from './subtitle';

async function test() {
  const vttFile = 'transcript_cmrt5ek9c000hxnfnp9sw2kcf_8mZ6r8mZ6r8.en.vtt'; // I don't know the exact youtube ID, so I'll find it
  const files = fs.readdirSync(path.join(__dirname, '..'));
  const subFile = files.find(f => f.startsWith(`transcript_cmrt5ek9c000hxnfnp9sw2kcf_`) && f.endsWith('.vtt'));
  
  if (!subFile) {
    console.error('VTT not found');
    return;
  }
  
  const vttContent = fs.readFileSync(path.join(__dirname, '..', subFile), 'utf-8');
  
  const startTime = 108.24;
  const endTime = 153.00;
  
  await generateAssFromVtt(
    vttContent,
    startTime,
    endTime,
    path.join(__dirname, '../test_ass.ass'),
    { fontName: 'Impact' }
  );
  console.log('Done');
}
test();
