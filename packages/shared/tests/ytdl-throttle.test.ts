import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createYtThrottle } from '../src/ytdl-throttle';

describe('createYtThrottle', () => {
  it('passes arguments and return value through', async () => {
    const t = createYtThrottle(async (v: number) => v * 2, 0);
    await expect(t(21)).resolves.toBe(42);
  });

  describe('hard cap (yt-dlp zombie guard)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('rejects a hung call after the hard cap instead of hanging forever', async () => {
      const t = createYtThrottle((_url: string) => new Promise(() => {}), 0);
      const p = t('https://youtu.be/hung');
      await vi.advanceTimersByTimeAsync(600000);
      await expect(p).rejects.toThrow(/hard cap/);
    });

    it('lets the next call run after a hard-cap rejection (serial chain unblocked)', async () => {
      let calls = 0;
      const t = createYtThrottle(async (_url: string) => {
        calls += 1;
        if (calls === 1) return new Promise(() => {});
        return 'ok';
      }, 0);
      const first = t();
      await vi.advanceTimersByTimeAsync(600000);
      await expect(first).rejects.toThrow(/hard cap/);
      const second = t();
      await vi.advanceTimersByTimeAsync(10);
      await expect(second).resolves.toBe('ok');
      expect(calls).toBe(2);
    });
  });
});
