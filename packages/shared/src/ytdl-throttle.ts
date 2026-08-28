export function createYtThrottle<T extends (...args: any[]) => Promise<any>>(fn: T, gapMs = 3000): T {
  let tail: Promise<any> = Promise.resolve();
  let last = 0;
  return ((...args: any[]) => {
    const run = tail.then(async () => {
      const wait = last + gapMs - Date.now();
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
      last = Date.now();
      return fn(...args);
    });
    tail = run.catch(() => undefined);
    return run;
  }) as T;
}