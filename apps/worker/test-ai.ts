import { generateGoldenMoments } from './src/ai';

async function test() {
  console.log("Starting test...");
  try {
    const res = await generateGoldenMoments("00:00.000 --> 00:02.000\nHello world, this is a test video about programming.", 2);
    console.log("Result:", res);
  } catch(e) {
    console.error("Test script caught error:", e);
  }
}
test();
