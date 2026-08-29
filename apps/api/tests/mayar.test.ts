import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseMayarWebhook, verifyMayarInvoicePaid } from '../src/services/mayar';

function setEnv(patch: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

const ENV_KEYS = ['MAYAR_API_KEY', 'MAYAR_IS_PRODUCTION', 'NODE_ENV'];
const envBackup = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));

afterEach(() => {
  setEnv(envBackup);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('parseMayarWebhook', () => {
  it('recognizes a paid webhook and extracts orderId from extraData', () => {
    const parsed = parseMayarWebhook({
      eventType: 'payment.received',
      data: { status: true, amount: 30000, extraData: { orderId: 'TRX-1' } },
    });
    expect(parsed).toEqual({ orderId: 'TRX-1', paid: true, amount: 30000 });
  });

  it('accepts status "paid" as paid', () => {
    expect(parseMayarWebhook({ eventType: 'payment.received', data: { status: 'paid' } }).paid).toBe(true);
  });

  it('marks other events as unpaid even if status is truthy', () => {
    const parsed = parseMayarWebhook({ eventType: 'invoice.created', data: { status: true } });
    expect(parsed.paid).toBe(false);
  });

  it('extracts orderId from custom_field when extraData is missing', () => {
    const parsed = parseMayarWebhook({
      eventType: 'payment.received',
      data: { status: true, custom_field: [{ value: 'TRX-2' }] },
    });
    expect(parsed.orderId).toBe('TRX-2');
  });
});

describe('verifyMayarInvoicePaid', () => {
  it('skips pull verification in dev/testing when no API key is set', async () => {
    setEnv({ MAYAR_API_KEY: undefined, NODE_ENV: 'test' });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(verifyMayarInvoicePaid('inv-1')).resolves.toEqual({ outcome: 'skipped' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses to trust the webhook in production when no API key is set (no free credits)', async () => {
    setEnv({ MAYAR_API_KEY: undefined, NODE_ENV: 'production' });
    await expect(verifyMayarInvoicePaid('inv-1')).resolves.toEqual({ outcome: 'error' });
  });

  it('calls the Mayar invoice API with the key and reports paid with amount', async () => {
    setEnv({ MAYAR_API_KEY: 'sk-test', NODE_ENV: 'test', MAYAR_IS_PRODUCTION: 'true' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { status: 'PAID', amount: 30000 } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(verifyMayarInvoicePaid('inv-9')).resolves.toEqual({ outcome: 'paid', amount: 30000 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.mayar.id/hl/v2/invoices/inv-9');
    expect(init.headers.Authorization).toBe('Bearer sk-test');
  });

  it('reports unpaid when the invoice status is not paid', async () => {
    setEnv({ MAYAR_API_KEY: 'sk-test', NODE_ENV: 'test' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { status: 'unpaid', amount: 30000 } }),
    }));
    await expect(verifyMayarInvoicePaid('inv-2')).resolves.toEqual({ outcome: 'unpaid' });
  });

  it('returns error on HTTP failure so the webhook gets retried (no credit)', async () => {
    setEnv({ MAYAR_API_KEY: 'sk-test', NODE_ENV: 'test' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(verifyMayarInvoicePaid('inv-3')).resolves.toEqual({ outcome: 'error' });
  });

  it('returns error when the API call throws', async () => {
    setEnv({ MAYAR_API_KEY: 'sk-test', NODE_ENV: 'test' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    await expect(verifyMayarInvoicePaid('inv-4')).resolves.toEqual({ outcome: 'error' });
  });
});
