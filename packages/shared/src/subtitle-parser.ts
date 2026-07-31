export interface Word {
  text: string;
  start: number;
  end: number;
}

export function parseVTTTime(timeStr: string): number {
  const cleanTimeStr = timeStr.trim().split(' ')[0];
  const parts = cleanTimeStr.split(':');
  let seconds = 0;
  if (parts.length === 3) {
    seconds += parseInt(parts[0]) * 3600;
    seconds += parseInt(parts[1]) * 60;
    seconds += parseFloat(parts[2].replace(',', '.'));
  } else if (parts.length === 2) {
    seconds += parseInt(parts[0]) * 60;
    seconds += parseFloat(parts[1].replace(',', '.'));
  }
  return seconds;
}

export function parseYouTubeVttWords(vttContent: string): Word[] {
  const blocks = vttContent.replace(/\r\n/g, '\n').split('\n\n');
  const rawWords: Word[] = [];
  
  for (const block of blocks) {
    const lines = block.split('\n');
    const timeLineIndex = lines.findIndex(l => l.includes('-->'));
    if (timeLineIndex === -1) continue;
    
    const timeParts = lines[timeLineIndex].split('-->');
    const blockStart = parseVTTTime(timeParts[0]);
    const blockEnd = parseVTTTime(timeParts[1]);
    
    // Ignore micro-blocks (e.g. 5ms cue updates from YouTube)
    if (blockEnd - blockStart < 0.02) continue;

    const blockLines = lines.slice(timeLineIndex + 1).filter(l => l.trim().length > 0);
    const hasCTags = blockLines.some(l => l.includes('<c>'));
    
    for (const line of blockLines) {
      if (hasCTags) {
        if (!line.includes('<c>')) continue;
        
        const parts = line.split(/<(\d{2}:\d{2}:\d{2}\.\d{3})>/);
        let currentTime = blockStart;
        
        for (let j = 0; j < parts.length; j++) {
          const part = parts[j];
          if (/^\d{2}:\d{2}:\d{2}\.\d{3}$/.test(part)) {
            currentTime = parseVTTTime(part);
          } else if (part.trim().length > 0) {
            let text = part.replace(/<\/c>/g, '').replace(/<c[^>]*>/g, '').trim();
            if (text) {
              let nextTime = blockEnd;
              if (j + 1 < parts.length && /^\d{2}:\d{2}:\d{2}\.\d{3}$/.test(parts[j+1])) {
                nextTime = parseVTTTime(parts[j+1]);
              }
              
              const words = text.split(/\s+/).filter(w => w.length > 0);
              if (words.length > 0) {
                const duration = Math.max(nextTime - currentTime, 0.1);
                const wordDur = duration / words.length;
                words.forEach((w, idx) => {
                  rawWords.push({
                    text: w,
                    start: currentTime + (idx * wordDur),
                    end: currentTime + ((idx + 1) * wordDur)
                  });
                });
              }
            }
          }
        }
      } else {
        const cleanText = line.replace(/<[^>]*>/g, '').trim();
        if (cleanText) {
          const words = cleanText.split(/\s+/).filter(w => w.length > 0);
          const dur = (blockEnd - blockStart) / Math.max(words.length, 1);
          words.forEach((w, idx) => {
            rawWords.push({
              text: w,
              start: blockStart + (idx * dur),
              end: blockStart + ((idx + 1) * dur)
            });
          });
        }
      }
    }
  }

  // Deduplicate rolling VTT words & fix overlapping timings
  const cleanWords: Word[] = [];
  
  for (let i = 0; i < rawWords.length; i++) {
    const word = rawWords[i];
    const cleanText = word.text.replace(/^[^\w\s\u00C0-\u024F]+|[^\w\s\u00C0-\u024F]+$/g, '').toLowerCase();
    if (!cleanText) continue;

    // Check if this word duplicates any word in the last 15 words (rolling cue deduplication)
    let isDuplicate = false;
    const windowStart = Math.max(0, cleanWords.length - 15);
    for (let k = cleanWords.length - 1; k >= windowStart; k--) {
      const prevWord = cleanWords[k];
      const prevClean = prevWord.text.replace(/^[^\w\s\u00C0-\u024F]+|[^\w\s\u00C0-\u024F]+$/g, '').toLowerCase();
      if (cleanText === prevClean && Math.abs(word.start - prevWord.start) < 4.0) {
        isDuplicate = true;
        break;
      }
    }

    if (isDuplicate) continue;

    // Ensure non-overlapping start/end times with previous clean word
    if (cleanWords.length > 0) {
      const prev = cleanWords[cleanWords.length - 1];
      if (word.start < prev.start) {
        // Out of order timestamps in VTT, skip
        continue;
      }
      if (word.start < prev.end) {
        prev.end = word.start;
      }
    }

    if (word.end <= word.start) word.end = word.start + 0.2;
    cleanWords.push(word);
  }
  
  return cleanWords;
}
