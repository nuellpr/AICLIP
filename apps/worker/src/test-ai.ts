import { generateGoldenMoments } from './ai';

async function test() {
  const dummyVtt = `WEBVTT

00:00:10.000 --> 00:00:15.000
This is a test subtitle.

00:00:15.000 --> 00:00:20.000
I am testing the AI golden moments generator.

00:00:20.000 --> 00:00:25.000
This is a very funny moment, haha!
`;

  console.log('Generating...');
  const res = await generateGoldenMoments(dummyVtt);
  console.log(res);
}

test().catch(console.error);
