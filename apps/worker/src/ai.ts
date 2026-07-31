import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export async function generateGoldenMoments(vttContent: string, clipCount: number = 5, targetDuration: string = "30-60", searchQuery: string = ""): Promise<{ clips: any[]; error?: string }> {
  // Load AI config
  const configPath = path.resolve(__dirname, '../../../ai-config.json');
  let config: any = { provider: 'google-gemini' };
  
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {}
  }

  const defaultSystemMsg = `Anda adalah seorang ahli strategi konten viral TikTok & Reels tingkat dunia.
Tugas Anda adalah menganalisis subtitle VTT video YouTube ini dan mengekstrak TEPAT ${clipCount} momen emas ("golden moments") yang dijamin akan viral.

ATURAN WAJIB (CRITICAL):
1. Anda HARUS menghasilkan TEPAT ${clipCount} klip. Tidak boleh kurang dan tidak boleh lebih.
2. Durasi tiap klip harus berada di kisaran ${targetDuration} detik. Pilih momen dengan awal dan akhir yang tidak terpotong canggung.
3. 'title', 'hook', dan 'reason' WAJIB ditulis dalam Bahasa Indonesia yang sangat clickbait, emosional, dan bergaya kreator TikTok/Reels Gen-Z. Buat mereka terdengar sangat menarik!
4. 'caption' WAJIB menggunakan teks ucapan asli 100% dari audio/VTT. JANGAN PERNAH MENGUBAH KE BAHASA INDONESIA BAKU/KBBI! Pertahankan kata-kata tidak baku persis seperti yang diucapkan di audio (contoh: 'gak', 'nggak', 'udah', 'dah', 'bikin', 'gimana', 'kayak', 'kalo', 'nyampe', 'lu', 'gue', 'banget', 'pake').
5. 'startTime' dan 'endTime' WAJIB dalam satuan DETIK (float/desimal), BUKAN milidetik! Contoh: untuk VTT timestamp 00:01:31.690, tuliskan startTime: 91.69 (BUKAN 91690). Berikan timestamp yang sangat akurat sesuai letak ucapan di VTT.
6. 'layoutMode': Anda WAJIB memilih salah satu dari [crop_blur, split, gameplay, face, fit_blur] berdasarkan konteks percakapan di klip tersebut.`;

  let systemMsg = config.systemMessage ? config.systemMessage + `\n\nEkstrak ${clipCount} klip.` : defaultSystemMsg;
  
  if (searchQuery && searchQuery.trim() !== "") {
    systemMsg += `\n\nINSTRUKSI KHUSUS DARI PENGGUNA (FIND MOMENTS):
Pengguna memberikan instruksi khusus berikut untuk mencari momen tertentu:
"${searchQuery}"

Anda WAJIB memprioritaskan momen-momen di dalam VTT yang paling relevan dengan instruksi pengguna tersebut di atas momen lainnya. Jika instruksi tidak relevan atau tidak ditemukan, barulah Anda mencari momen viral secara umum.`;
  }

  const prompt = `VTT Content:\n${vttContent.substring(0, 50000)}`;

  if (config.provider === 'openai' || config.provider === 'groq' || config.provider === 'custom') {
    const result = await generateWithOpenAI(config, systemMsg, prompt, clipCount);
    return { clips: result.clips, error: result.error };
  } else {
    const result = await generateWithGemini(config, systemMsg, prompt, clipCount);
    return { clips: result.clips, error: result.error };
  }
}

async function generateWithOpenAI(config: any, systemMsg: string, prompt: string, clipCount: number): Promise<{ clips: any[]; error?: string }> {
  try {
    const openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || undefined,
    });

    const systemMsgWithJson = systemMsg + `\n\nReturn ONLY a JSON object with a "clips" array. Example: {"clips": [{"title": "...", "hook": "...", "startTime": 0, "endTime": 10, "viralScore": 90, "reason": "...", "caption": "...", "layoutMode": "crop_blur"}]}`;

    const completion = await openai.chat.completions.create({
      model: config.model || 'gpt-4o-mini',
      messages: [
        { role: "system", content: systemMsgWithJson },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    let text = completion.choices[0].message.content || '{"clips":[]}';
    
    try {
      require('fs').writeFileSync(require('path').join(__dirname, '../ai_debug_last_response.txt'), text);
    } catch(e) {}
    
    // Robust extraction: find the first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1);
    }
    
    const parsed = JSON.parse(text);
    
    if (parsed.clips && Array.isArray(parsed.clips)) {
      return { clips: parsed.clips.slice(0, clipCount) };
    }
    return { clips: [] };
  } catch (error: any) {
    const errMsg = error?.error?.message || error?.message || String(error);
    console.error('OpenAI/Compatible error:', errMsg);
    try {
      require('fs').writeFileSync(require('path').join(__dirname, '../ai_debug_last_error.txt'), errMsg);
    } catch(e) {}
    return { clips: [], error: errMsg };
  }
}

async function generateWithGemini(config: any, systemMsg: string, prompt: string, clipCount: number): Promise<{ clips: any[]; error?: string }> {
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

    const fullPrompt = `${systemMsg}\n\n${prompt}`;

    const response = await ai.models.generateContent({
      model: config.model || 'gemini-1.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: clipSchema,
      }
    });
    
    const text = response.text || '[]';
    let parsed = JSON.parse(text);
    
    if (Array.isArray(parsed)) {
      return { clips: parsed.slice(0, clipCount) };
    }
    return { clips: [] };
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    console.error('Gemini error:', errMsg);
    return { clips: [], error: errMsg };
  }
}
