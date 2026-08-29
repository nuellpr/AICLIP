import fs from 'fs';
import path from 'path';
import { Word, parseYouTubeVttWords } from '@clipforge/shared';

export interface CaptionChunk {
  words: Word[];
  start: number;
  end: number;
}

// Convert HTML hex like #FF0000, 8-digit hex #RRGGBBAA, rgba(), or transparent to ASS format &HAABBGGRR
export function hexToAssColor(hex: string): string {
  if (!hex || hex === 'transparent') return '&HFF000000';

  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    const parts = hex.match(/[\d.]+/g);
    if (parts && parts.length >= 3) {
      const r = parseInt(parts[0]).toString(16).padStart(2, '0').toUpperCase();
      const g = parseInt(parts[1]).toString(16).padStart(2, '0').toUpperCase();
      const b = parseInt(parts[2]).toString(16).padStart(2, '0').toUpperCase();
      let assAlpha = '00';
      if (parts.length >= 4) {
        const a = parseFloat(parts[3]);
        assAlpha = Math.round((1 - a) * 255).toString(16).padStart(2, '0').toUpperCase();
      }
      return `&H${assAlpha}${b}${g}${r}`;
    }
  }

  let clean = hex.replace('#', '').trim().toUpperCase();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length === 6) {
    const r = clean.substring(0, 2);
    const g = clean.substring(2, 4);
    const b = clean.substring(4, 6);
    return `&H00${b}${g}${r}`;
  }
  if (clean.length === 8) {
    const r = clean.substring(0, 2);
    const g = clean.substring(2, 4);
    const b = clean.substring(4, 6);
    const a = parseInt(clean.substring(6, 8), 16);
    const assAlpha = (255 - a).toString(16).padStart(2, '0').toUpperCase();
    return `&H${assAlpha}${b}${g}${r}`;
  }
  return '&H00FFFFFF';
}

export async function generateAssFromVtt(
  vttContent: string,
  startTime: number,
  endTime: number,
  outputPath: string,
  styleOptions: any,
  videoWidth: number = 1080,
  videoHeight: number = 1920
) {
  let offset = styleOptions.offset !== undefined ? Number(styleOptions.offset) : 0; 

  let clipWords: any[] = [];
  
  if (styleOptions.words && Array.isArray(styleOptions.words) && styleOptions.words.length > 0) {
    // Whisper words are relative to the start of the clip (0.0).
    // The downstream code subtracts startTime, so we add startTime here to compensate.
    clipWords = styleOptions.words.map((w: any) => ({
      text: w.text,
      start: Number(w.start) + startTime,
      end: Number(w.end) + startTime
    }));
  } else {
    const allWords = parseYouTubeVttWords(vttContent);
    // Filter words strictly inside the clip timeframe (with 0.5s margin)
    clipWords = allWords.filter(w => w.end >= startTime - 0.5 && w.start <= endTime + 0.5);
  }
  
  const customCaption = styleOptions.caption ? styleOptions.caption.trim() : '';
  const customCaptionLines = customCaption
    ? customCaption.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0)
    : null;

  if (clipWords.length === 0) {
    // Fallback if no VTT words matched in this timeframe
    const rawText = customCaption || styleOptions.fallbackText || 
      vttContent.replace(/^WEBVTT.*$/gm, '')
                .replace(/\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}.*/g, '')
                .replace(/<[^>]*>/g, '')
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.length > 0 && !l.startsWith('Kind:') && !l.startsWith('Language:'))
                .join(' ');
                
    if (rawText && rawText.trim().length > 0) {
      const words = rawText.trim().split(/\s+/).filter((w: string) => w.length > 0);
      const totalDuration = Math.max(endTime - startTime, 1);
      const wordDuration = totalDuration / words.length;
      clipWords = words.map((w: string, idx: number) => ({
        text: w,
        start: startTime + (idx * wordDuration),
        end: startTime + ((idx + 1) * wordDuration)
      }));
    }
  }

  // Ensure clipWords are sorted & strictly non-overlapping
  clipWords.sort((a, b) => a.start - b.start);
  for (let i = 0; i < clipWords.length; i++) {
    if (i < clipWords.length - 1) {
      if (clipWords[i].end >= clipWords[i + 1].start) {
        clipWords[i].end = Math.max(clipWords[i].start + 0.05, clipWords[i + 1].start - 0.01);
      }
    }
    if (clipWords[i].end <= clipWords[i].start) {
      clipWords[i].end = clipWords[i].start + 0.1;
    }
  }

  // Chunking into captions
  const wordsPerCaption = styleOptions.wordsPerCaption || 4;
  const chunks: CaptionChunk[] = [];
  
  for (let i = 0; i < clipWords.length; i += wordsPerCaption) {
    const chunkWords = clipWords.slice(i, i + wordsPerCaption);
    chunks.push({
      words: chunkWords,
      start: chunkWords[0].start,
      end: chunkWords[chunkWords.length - 1].end
    });
  }

  // Ensure non-overlapping chunks
  for (let c = 0; c < chunks.length; c++) {
    if (c < chunks.length - 1) {
      if (chunks[c].end >= chunks[c + 1].start) {
        chunks[c].end = Math.max(chunks[c].start + 0.1, chunks[c + 1].start - 0.01);
      }
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  };

  // Preset Style Mapping
  const fontName = styleOptions.fontFamily || styleOptions.fontName || 'Impact';
  const fontSize = styleOptions.fontSize || 64;
  const primaryColour = hexToAssColor(styleOptions.textColor || styleOptions.colors?.base || '#FFFFFF');
  const activeColour = hexToAssColor(styleOptions.activeWordColor || styleOptions.colors?.active || '#00FF48');
  const outlineColour = hexToAssColor(styleOptions.strokeColor || styleOptions.stroke?.color || '#000000');
  
  const textTransform = styleOptions.textTransform || 'uppercase';
  const animation = styleOptions.animation || 'none';
  
  const isBoxPreset = styleOptions.id === 'box-highlight' || styleOptions.id === 'temp-2' || (styleOptions.backgroundColor && styleOptions.backgroundColor !== 'transparent') || styleOptions.effect?.type === 'boxHighlight' || animation === 'boxHighlight';
  const rawBg = styleOptions.backgroundColor || styleOptions.colors?.bgActive || (isBoxPreset ? 'rgba(0,0,0,0.75)' : '#000000');
  const backColour = hexToAssColor(rawBg);
  
  const strokeWidth = styleOptions.strokeWidth !== undefined ? styleOptions.strokeWidth : (styleOptions.stroke?.widthPx || 5);
  const borderStyle = isBoxPreset ? '3' : '1';
  
  const isItalic = styleOptions.fontStyle === 'italic' || styleOptions.font?.italic ? -1 : 0;
  const alignment = styleOptions.position === 'top' ? '8' : (styleOptions.position === 'center' ? '5' : '2');
  const marginV = styleOptions.marginBottom || 180;

  let assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColour},&H000000FF,${outlineColour},${backColour},-1,${isItalic},0,0,100,100,0,0,${borderStyle},${strokeWidth},0,${alignment},40,40,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const animatedTypes = ['karaoke', 'pop', 'grow', 'bounce', 'shake', 'zoom-in', 'spin', 'swing', 'pulse', 'underline', 'glow', 'wordFocus', 'boxHighlight'];

  let chunkIndex = 0;

  for (const chunk of chunks) {
    let relStart = chunk.start - startTime + offset;
    let relEnd = chunk.end - startTime + offset;
    
    if (relEnd <= 0) continue;
    if (relStart < 0) relStart = 0;
    if (relEnd <= relStart) relEnd = relStart + 0.3;
    // Ensure end doesn't exceed clip duration
    const clipDuration = endTime - startTime;
    if (relStart >= clipDuration) continue;
    if (relEnd > clipDuration + 0.5) relEnd = clipDuration + 0.5;
    
    if (customCaptionLines) {
      const customLine = customCaptionLines[chunkIndex] ?? null;
      chunkIndex++;
      if (customLine !== null) {
        let textLine = customLine;
        if (textTransform === 'uppercase') textLine = textLine.toUpperCase();
        if (textTransform === 'lowercase') textLine = textLine.toLowerCase();
        const startStr = formatTime(relStart);
        const endStr = formatTime(Math.max(relStart + 0.1, relEnd - 0.01));
        assContent += `Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,${textLine}\n`;
        continue;
      }
    }
    
    if (animation === 'typewriter') {
       // Typewriter: cumulative word reveal
       for (let wIdx = 0; wIdx < chunk.words.length; wIdx++) {
         const w = chunk.words[wIdx];
         let wStart = w.start - startTime + offset;
         let nextStart = (wIdx < chunk.words.length - 1)
           ? (chunk.words[wIdx + 1].start - startTime + offset)
           : relEnd;
         if (wStart < 0) wStart = 0;
         let wEnd = Math.max(wStart + 0.05, nextStart - 0.01);
         const cumulativeWords = chunk.words.slice(0, wIdx + 1).map((word, i) => {
           let wordText = word.text;
           if (textTransform === 'uppercase') wordText = wordText.toUpperCase();
           if (textTransform === 'lowercase') wordText = wordText.toLowerCase();
           if (i === wIdx) {
             return `{\\c${activeColour}}${wordText}{\\rDefault}`;
           }
           const spokenColor = hexToAssColor(styleOptions.spokenWordColor || styleOptions.textColor);
           return `{\\c${spokenColor}}${wordText}{\\rDefault}`;
         }).join(' ');
         assContent += `Dialogue: 0,${formatTime(wStart)},${formatTime(wEnd)},Default,,0,0,0,,${cumulativeWords}\n`;
       }
    } else if (animatedTypes.includes(animation)) {
       for (let wIdx = 0; wIdx < chunk.words.length; wIdx++) {
         const w = chunk.words[wIdx];
         let wStart = w.start - startTime + offset;
         let nextStart = (wIdx < chunk.words.length - 1) 
           ? (chunk.words[wIdx + 1].start - startTime + offset) 
           : relEnd;
         
         if (wStart < 0) wStart = 0;
         let wEnd = Math.max(wStart + 0.05, nextStart - 0.01);
         
         let textLine = '';
         for (let i = 0; i < chunk.words.length; i++) {
           let wordText = chunk.words[i].text;
           if (textTransform === 'uppercase') wordText = wordText.toUpperCase();
           if (textTransform === 'lowercase') wordText = wordText.toLowerCase();
           if (i === wIdx) {
              let effect = `{\\c${activeColour}}`;
              if (animation === 'pop') {
                effect += `{\\t(0,100,\\fscx120\\fscy120)}{\\t(100,200,\\fscx100\\fscy100)}`;
              } else if (animation === 'grow') {
                effect += `{\\t(0,200,\\fscx115\\fscy115)}`;
              } else if (animation === 'bounce') {
                effect += `{\\t(0,150,\\fscx130\\fscy130)}{\\t(150,250,\\fscx90\\fscy90)}{\\t(250,300,\\fscx100\\fscy100)}`;
              } else if (animation === 'shake') {
                effect += `{\\t(0,50,\\frz-5)}{\\t(50,100,\\frz5)}{\\t(100,150,\\frz-5)}{\\t(150,200,\\frz0)}`;
              } else if (animation === 'zoom-in') {
                effect += `{\\fscx300\\fscy300\\alpha&HFF&}{\\t(0,150,\\fscx100\\fscy100\\alpha&H00&)}`;
              } else if (animation === 'spin') {
                effect += `{\\t(0,300,\\frz360)}`;
              } else if (animation === 'swing') {
                effect += `{\\t(0,100,\\frz15)}{\\t(100,200,\\frz-15)}{\\t(200,300,\\frz0)}`;
               } else if (animation === 'pulse') {
                 effect += `{\\t(0,100,\\fscx115\\fscy115)}{\\t(100,200,\\fscx100\\fscy100)}{\\t(200,300,\\fscx115\\fscy115)}{\\t(300,400,\\fscx100\\fscy100)}`;
               } else if (animation === 'underline') {
                 effect += `{\\u1}`;
               } else if (animation === 'glow') {
                 const glow = Math.max(4, Math.round(fontSize * 0.12));
                 effect += `{\\3c${activeColour}}{\\bord${glow}}`;
               } else if (animation === 'wordFocus' || animation === 'boxHighlight') {
                 // Just color change, no scale
               }
              textLine += `${effect}${wordText}{\\rDefault} `;
           } else if (i < wIdx) {
              const spokenColor = hexToAssColor(styleOptions.spokenWordColor || styleOptions.textColor);
              textLine += `{\\c${spokenColor}}${wordText}{\\rDefault} `;
           } else {
              textLine += `${wordText} `;
           }
         }
         assContent += `Dialogue: 0,${formatTime(wStart)},${formatTime(wEnd)},Default,,0,0,0,,${textLine.trim()}\n`;
        }
     } else {
       let textLine = chunk.words.map(w => {
         let wt = w.text;
         if (textTransform === 'uppercase') wt = wt.toUpperCase();
         if (textTransform === 'lowercase') wt = wt.toLowerCase();
         return wt;
       }).join(' ');
       
       if (animation === 'bounce') {
          textLine = `{\\fscx0\\fscy0\\t(0,200,\\fscx120\\fscy120)\\t(200,300,\\fscx100\\fscy100)}${textLine}`;
       }
       if (animation === 'grow') {
          textLine = `{\\fscx100\\fscy100\\t(0, ${(relEnd - relStart)*1000}, \\fscx110\\fscy110)}${textLine}`;
       }
       
        const startStr = formatTime(relStart);
        const endStr = formatTime(Math.max(relStart + 0.1, relEnd - 0.01));
        assContent += `Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,${textLine}\n`;
     }
   }

  fs.writeFileSync(outputPath, assContent, 'utf-8');
}
