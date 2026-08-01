import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export const MAX_VTT_CHARS = 4000;

export function limitVttContent(vttContent: string, maxChars: number = MAX_VTT_CHARS): string {
  if (vttContent.length <= maxChars) return vttContent;
  const cues = vttContent.split(/\r?\n\r?\n/).filter((c) => c.trim().length > 0);
  const step = Math.max(1, Math.ceil(vttContent.length / maxChars));
  const sampled: string[] = [];
  for (let i = 0; i < cues.length; i += step) sampled.push(cues[i]);
  if (sampled[sampled.length - 1] !== cues[cues.length - 1]) {
    sampled.push(cues[cues.length - 1]);
  }
  let result = sampled.join('\n\n');
  if (result.length > maxChars) {
    result = result.substring(0, maxChars);
  }
  return result;
}

export function getVttWindow(vttContent: string, windowIndex: number, maxChars: number = MAX_VTT_CHARS): string {
  if (vttContent.length <= maxChars) return vttContent;
  const offset = (windowIndex * maxChars) % vttContent.length;
  let window = vttContent.substring(offset, offset + maxChars);
  if (window.length < maxChars / 2) {
    window = vttContent.substring(0, maxChars);
  }
  const firstCue = window.indexOf('\n\n');
  if (firstCue > 0) window = window.substring(firstCue + 2);
  const lastCue = window.lastIndexOf('\n\n');
  if (lastCue > 0) window = window.substring(0, lastCue);
  return window.trim();
}

export async function generateGoldenMoments(vttContent: string, clipCount: number = 5, targetDuration: string = "30-60", searchQuery: string = "", videoFilePath?: string): Promise<{ clips: any[]; error?: string }> {
  // Load AI config
  const configPath = path.resolve(__dirname, '../../../ai-config.json');
  let config: any = { provider: 'google-gemini' };
  
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {}
  }

  console.log(`AI provider: ${config.provider || 'google-gemini'}, model: ${config.model || '(default)'}, baseUrl: ${config.baseUrl || '(default)'}`);

  const defaultSystemMsg = `Anda adalah seorang ahli strategi konten viral TikTok & Reels tingkat dunia.
Tugas Anda adalah menganalisis subtitle VTT video YouTube ini (dan konteks visual video jika tersedia) dan mengekstrak TEPAT ${clipCount} momen emas ("golden moments") yang dijamin akan viral.

ATURAN WAJIB (CRITICAL):
1. Anda HARUS menghasilkan TEPAT ${clipCount} klip. Tidak boleh kurang dan tidak boleh lebih.
2. Durasi tiap klip harus berada di kisaran ${targetDuration} detik. Pilih momen dengan awal dan akhir yang tidak terpotong canggung.
3. 'title', 'hook', dan 'reason' WAJIB ditulis dalam Bahasa Indonesia yang sangat clickbait, emosional, dan bergaya kreator TikTok/Reels Gen-Z. Buat mereka terdengar sangat menarik!
4. 'caption' WAJIB menggunakan teks ucapan asli 100% dari audio/VTT. JANGAN PERNAH MENGUBAH KE BAHASA INDONESIA BAKU/KBBI! Pertahankan kata-kata tidak baku persis seperti yang diucapkan di audio (contoh: 'gak', 'nggak', 'udah', 'dah', 'bikin', 'gimana', 'kayak', 'kalo', 'nyampe', 'lu', 'gue', 'banget', 'pake').
5. 'startTime' dan 'endTime' WAJIB dalam satuan DETIK (float/desimal), BUKAN milidetik! Contoh: untuk VTT timestamp 00:01:31.690, tuliskan startTime: 91.69 (BUKAN 91690). Berikan timestamp yang sangat akurat sesuai letak ucapan di VTT.
6. 'layoutMode': Anda WAJIB memilih salah satu dari [crop_blur, split, gameplay, face, fit_blur] berdasarkan konteks percakapan/visual di klip tersebut.`;

  let systemMsg = config.systemMessage ? config.systemMessage + `\n\nEkstrak ${clipCount} klip.` : defaultSystemMsg;
  
  if (searchQuery && searchQuery.trim() !== "") {
    systemMsg += `\n\nINSTRUKSI KHUSUS DARI PENGGUNA (FIND MOMENTS):
Pengguna memberikan instruksi khusus berikut untuk mencari momen tertentu:
"${searchQuery}"

Anda WAJIB memprioritaskan momen-momen di dalam VTT/Video yang paling relevan dengan instruksi pengguna tersebut di atas momen lainnya. Jika instruksi tidak relevan atau tidak ditemukan, barulah Anda mencari momen viral secara umum.`;
  }

  const prompt = `VTT Content:\n${limitVttContent(vttContent)}`;

  if (config.provider === 'openai' || config.provider === 'groq' || config.provider === 'custom') {
    const result = await generateWithOpenAI(config, systemMsg, vttContent, clipCount, targetDuration, searchQuery);
    return { clips: result.clips, error: result.error };
  } else {
    const result = await generateWithGemini(config, systemMsg, prompt, clipCount, videoFilePath);
    return { clips: result.clips, error: result.error };
  }
}

function buildCompactSystemMessage(systemMsg: string, clipCount: number, targetDuration: string, searchQuery: string): string {
  let msg = `Anda adalah ahli strategi konten viral TikTok & Reels. Analisis VTT video dan ekstrak TEPAT ${clipCount} momen emas yang akan viral.`;
  msg += `\nAturan: (1) Hasilkan TEPAT ${clipCount} klip. (2) Durasi tiap klip ${targetDuration} detik. (3) title, hook, reason dalam Bahasa Indonesia yang clickbait, emosional, gaya Gen-Z. (4) caption = teks ucapan ASLI dari VTT, pertahankan kata tidak baku (gak, nggak, udah, bikin, gimana, kayak, lu, gue, banget, pake). JANGAN ubah ke bahasa baku. (5) startTime & endTime dalam DETIK (bukan milidetik). (6) layoutMode pilih salah satu: crop_blur, split, gameplay, face, fit_blur.`;
  if (searchQuery && searchQuery.trim() !== "") {
    msg += `\nPrioritaskan momen yang relevan dengan instruksi pengguna: "${searchQuery}".`;
  }
  return msg;
}

async function generateWithOpenAI(config: any, systemMsg: string, vttContent: string, clipCount: number, targetDuration: string = "30-60", searchQuery: string = ""): Promise<{ clips: any[]; error?: string }> {
  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY_MS = 2000;
  const attemptErrors: string[] = [];

  // Use a very compact system message to minimize token usage
  const systemMsgWithJson = `Analyze VTT subtitles. Extract EXACTLY ${clipCount} viral clip moments.
Rules: title/hook/reason in Indonesian clickbait style. caption = exact spoken text from VTT (keep informal words). startTime/endTime in SECONDS (float). layoutMode: one of crop_blur/split/gameplay/face/fit_blur. Duration ${targetDuration}s each.${searchQuery ? ` Focus on: "${searchQuery}".` : ''}
Reply with ONLY JSON: {"clips":[{"title":"...","hook":"...","startTime":0,"endTime":30,"viralScore":90,"reason":"...","caption":"...","layoutMode":"fit_blur"}]}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`AI analysis attempt ${attempt}/${MAX_ATTEMPTS} (provider=${config.provider}, model=${config.model || 'default'})`);
      const openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl || undefined,
        timeout: 120000,
        maxRetries: 0,
      });

      // Send less VTT content to reduce token usage — critical for reasoning models
      const vttWindow = limitVttContent(vttContent, 2500);
      const prompt = `VTT:\n${vttWindow}`;

      const completion = await openai.chat.completions.create({
        model: config.model || 'gpt-4o-mini',
        messages: [
          { role: "system", content: systemMsgWithJson },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 16000,
      });

      let text = completion.choices[0].message.content || '';
      const finishReason = completion.choices[0].finish_reason || '';
      
      try {
        require('fs').writeFileSync(require('path').join(__dirname, `../ai_debug_attempt_${attempt}.txt`), text || `(empty, finish_reason=${finishReason})`);
      } catch(e) {}

      if (!text.trim()) {
      attemptErrors.push(`Attempt ${attempt}: empty content (finish_reason=${finishReason})`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      continue;
      }
      
      // Robust extraction: find the first { and last }
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
        text = text.substring(firstBrace, lastBrace + 1);
      }
      
      const parsed = JSON.parse(text);
      
      if (parsed.clips && Array.isArray(parsed.clips) && parsed.clips.length > 0) {
        try {
          require('fs').writeFileSync(require('path').join(__dirname, '../ai_debug_last_response.txt'), text);
        } catch(e) {}
        return { clips: parsed.clips.slice(0, clipCount) };
      }
      attemptErrors.push(`Attempt ${attempt}: JSON had no clips (finish_reason=${finishReason})`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    } catch (error: any) {
      const errMsg = error?.error?.message || error?.message || String(error);
      attemptErrors.push(`Attempt ${attempt}: ${errMsg}`);
      console.error('OpenAI/Compatible error:', errMsg);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  const errMsg = attemptErrors.slice(-12).join('; ');
  try {
    require('fs').writeFileSync(require('path').join(__dirname, '../ai_debug_last_error.txt'), errMsg);
  } catch(e) {}
  return { clips: [], error: errMsg };
}

async function generateWithGemini(config: any, systemMsg: string, prompt: string, clipCount: number, videoFilePath?: string): Promise<{ clips: any[]; error?: string }> {
  const MAX_ATTEMPTS = 3;
  let lastError = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // Fallback to process.env if config key is missing
      const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });

      const clipSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            hook: { type: Type.STRING },
            startTime: { type: Type.NUMBER },
            endTime: { type: Type.NUMBER },
            viralScore: { type: Type.NUMBER },
            reason: { type: Type.STRING },
            caption: { type: Type.STRING },
            layoutMode: { type: Type.STRING, description: "Pilihan: crop_blur, split, gameplay, face, fit_blur" }
          },
          required: ["title", "hook", "startTime", "endTime", "viralScore", "reason", "caption", "layoutMode"]
        }
      };

      let contents: any[] = [systemMsg + '\n\n' + prompt];
      let uploadedFile: any = null;

      if (videoFilePath && fs.existsSync(videoFilePath)) {
        console.log('Uploading video to Gemini File API for multimodal analysis...');
        try {
          uploadedFile = await ai.files.upload({ file: videoFilePath, config: { mimeType: 'video/mp4' } });
          console.log(`Video uploaded as ${uploadedFile.name}. Polling for ACTIVE state...`);
          
          let fileInfo = await ai.files.get({ name: uploadedFile.name });
          let pollAttempts = 0;
          while (fileInfo.state === 'PROCESSING' && pollAttempts < 30) {
            await new Promise(r => setTimeout(r, 5000));
            fileInfo = await ai.files.get({ name: uploadedFile.name });
            pollAttempts++;
          }
          
          if (fileInfo.state === 'ACTIVE') {
            console.log('Video is ACTIVE. Proceeding with multimodal generation.');
            contents = [uploadedFile, systemMsg + '\n\n' + prompt];
          } else {
            console.warn(`Video state is ${fileInfo.state}, proceeding without video context.`);
          }
        } catch (err: any) {
          console.warn('Failed to upload/process video in Gemini API:', err.message);
        }
      }

      console.log(`Sending request to Gemini API (Attempt ${attempt}/${MAX_ATTEMPTS})...`);
      const response = await ai.models.generateContent({
        model: config.model || 'gemini-1.5-flash',
        contents: contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: clipSchema,
        }
      });
      
      // Cleanup video from Gemini if uploaded
      if (uploadedFile) {
        try {
          await ai.files.delete({ name: uploadedFile.name });
          console.log(`Cleaned up temporary video file ${uploadedFile.name} from Gemini API.`);
        } catch (e: any) {
          console.warn(`Failed to clean up file ${uploadedFile.name}:`, e.message);
        }
      }
      
      const text = response.text || '[]';
      let parsed = JSON.parse(text);
      
      if (Array.isArray(parsed)) {
        return { clips: parsed.slice(0, clipCount) };
      }
      return { clips: [] };
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      lastError = errMsg;
      console.warn(`Gemini API Error (Attempt ${attempt}/${MAX_ATTEMPTS}):`, errMsg);
      
      if (attempt < MAX_ATTEMPTS) {
        // If it's a rate limit error (429 or quota exceeded), wait 40 seconds. Otherwise wait 5 seconds.
        const waitTime = (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded')) ? 40000 : 5000;
        console.log(`Waiting ${waitTime / 1000} seconds before retrying...`);
        await new Promise(r => setTimeout(r, waitTime));
      }
    }
  }
  return { clips: [], error: lastError };
}
