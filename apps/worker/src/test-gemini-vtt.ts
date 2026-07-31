import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  const vttFile = 'transcript_cmrt423lb0008xnfnu5kqqor9_kdxgY-G6aJs.en.vtt';
  const vttContent = fs.readFileSync(path.join(__dirname, '..', vttFile), 'utf-8');
  
  const startTime = 136.72;
  const endTime = 155.40;
  
  const prompt = `You are an expert video editor. I have a YouTube VTT file (which may contain duplicate rolling lines or word-level tags).
Extract the spoken content strictly between ${startTime} seconds and ${endTime} seconds.

1. Clean up any duplicate rolling lines.
2. TRANSLATE the spoken content to Bahasa Indonesia.
3. Chunk the translated text into short phrases (1 to 3 words MAX) for a viral TikTok/Reels style subtitle (Hormozi style).
4. Assign accurate 'start' and 'end' timestamps (in seconds) for each chunk, corresponding to the original speech pace.
5. 'start' and 'end' MUST be relative to ${startTime} (i.e. subtract ${startTime} from the original VTT timestamp so the first subtitle starts near 0.0).

Return ONLY a valid JSON array of objects. No markdown, no backticks.
Format:
[
  { "start": 0.0, "end": 0.5, "text": "Ini adalah" },
  { "start": 0.5, "end": 1.2, "text": "rahasia viral" }
]

VTT Content Snippet (Only the relevant part):
` + vttContent.substring(0, 50000); // we should actually slice the VTT to near the timestamps to save tokens

  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
  });
  
  console.log(response.text);
}
test();
