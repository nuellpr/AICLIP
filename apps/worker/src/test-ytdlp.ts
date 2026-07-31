import youtubedl from 'youtube-dl-exec';

async function test() {
  try {
    const res = await youtubedl('https://youtu.be/RiNoZrnoNl4', {
      dumpJson: true,
      noWarnings: true,
      callHome: false,
      noCheckCertificates: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true
    }) as any;
    console.log(res.title);
  } catch (err) {
    console.error(err);
  }
}
test();
