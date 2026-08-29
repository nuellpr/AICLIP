export function createYtThrottle<T extends (...args: any[]) => Promise<any>>(fn: T, gapMs = 3000): T {
  // ponytail: hard cap 10 menit/call — kalau yt-dlp zombie (gantung selamanya), rantai
  // serial tidak boleh macet permanen; semua project berikutnya timeout palsu.
  const HARD_CAP_MS = 600000;
  let tail: Promise<any> = Promise.resolve();
  let last = 0;
  return ((...args: any[]) => {
    const run = tail.then(async () => {
      const wait = last + gapMs - Date.now();
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
      last = Date.now();
      return Promise.race([
        fn(...args),
        new Promise((_, rej) => setTimeout(() => rej(new Error(`yt-dlp hard cap ${HARD_CAP_MS / 1000}s — panggilan dibuang agar antrean lanjut`)), HARD_CAP_MS))
      ]);
    });
    tail = run.catch(() => undefined);
    return run;
  }) as T;
}