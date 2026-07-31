import { GoogleGenAI, Type } from '@google/genai';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const clipSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Judul" },
      hook: { type: Type.STRING, description: "Hook" },
      startTime: { type: Type.NUMBER, description: "Start time" },
      endTime: { type: Type.NUMBER, description: "End time" },
      viralScore: { type: Type.NUMBER, description: "Score" },
      reason: { type: Type.STRING, description: "Reason" },
      caption: { type: Type.STRING, description: "Caption" }
    },
    required: ["title", "hook", "startTime", "endTime", "viralScore", "reason", "caption"]
  }
};

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: "Generate 2 clips from this video about programming.",
      config: {
        responseMimeType: 'application/json',
        responseSchema: clipSchema,
      }
    });
    console.log(response.text);
  } catch (err: any) {
    console.error("ERROR:");
    console.error(err.message);
  }
}
test();
