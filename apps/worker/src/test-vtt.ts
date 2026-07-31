import fs from 'fs';
import path from 'path';

function parseVTTTime(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  let seconds = 0;
  if (parts.length === 3) {
    seconds += parseInt(parts[0]) * 3600;
    seconds += parseInt(parts[1]) * 60;
    seconds += parseFloat(parts[2]);
  } else if (parts.length === 2) {
    seconds += parseInt(parts[0]) * 60;
    seconds += parseFloat(parts[1]);
  }
  return seconds;
}

function parseWordLevelVTT(vttContent: string) {
  const blocks = vttContent.replace(/\r\n/g, '\n').split('\n\n');
  const words: { text: string; start: number }[] = [];
  
  for (const block of blocks) {
    const lines = block.split('\n');
    const timeLineIndex = lines.findIndex(l => l.includes('-->'));
    if (timeLineIndex === -1) continue;
    
    const timeParts = lines[timeLineIndex].split('-->');
    const blockStart = parseVTTTime(timeParts[0].split(' ')[0]);
    
    // Process text lines
    const textLines = lines.slice(timeLineIndex + 1);
    for (const line of textLines) {
      if (!line.trim()) continue;
      
      // A line might look like: "Okay, <00:00:01.880><c>welcome </c><00:00:02.120><c>to </c>"
      // We can split by '<c>'
      // But we need to be careful with the first word which might not have a tag, or the tags format.
      // Let's match all text and their preceding time tag if any.
      
      const regex = /(?:<(\d{2}:\d{2}:\d{2}\.\d{3})>)?(?:<c>)?([^<]+)(?:<\/c>)?/g;
      let match;
      while ((match = regex.exec(line)) !== null) {
        const timeTag = match[1];
        let text = match[2];
        
        // Remove trailing tags like </c> if they got caught, though regex should handle it
        text = text.replace(/<\/c>/g, '').trim();
        
        if (!text) continue;
        
        let start = blockStart;
        if (timeTag) {
          start = parseVTTTime(timeTag);
        }
        
        // Only add if it's not already added at this exact time (to handle rolling duplicates)
        // Check the last few words
        const isDuplicate = words.slice(-10).some(w => w.text === text && Math.abs(w.start - start) < 0.05);
        if (!isDuplicate) {
          words.push({ text, start });
        }
      }
    }
  }
  
  return words;
}

const vttContent = fs.readFileSync(path.join(__dirname, '..', 'transcript_cmrt423lb0008xnfnu5kqqor9_kdxgY-G6aJs.en.vtt'), 'utf-8');
const words = parseWordLevelVTT(vttContent);
console.log(words.slice(0, 50));
