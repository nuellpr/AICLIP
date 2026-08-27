import crypto from 'crypto';

export interface IpaymuInvoiceResult {
  id: string; // sid / SessionId
  transactionId: string;
  link: string; // Url payment page
  expiredAt: number;
}

interface CreateIpaymuInvoiceParams {
  referenceId: string;
  productName: string;
  price: number; // IDR int
  qty?: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  returnUrl?: string;
  notifyUrl?: string;
  cancelUrl?: string;
}

function mockInvoice(referenceId: string): IpaymuInvoiceResult {
  console.log('IPAYMU_VA / IPAYMU_API_KEY not configured. Using Mock invoice.');
  return {
    id: `mock-ipaymu-${referenceId}`,
    transactionId: `mock-trx-${Date.now()}`,
    link: `https://sandbox.ipaymu.com/payment/mock-${referenceId}`,
    expiredAt: Date.now() + 24 * 60 * 60 * 1000,
  };
}

function getConfig() {
  const va = process.env.IPAYMU_VA || '';
  const apiKey = process.env.IPAYMU_API_KEY || '';
  const isProduction = process.env.IPAYMU_IS_PRODUCTION === 'true';
  const baseUrl = isProduction ? 'https://my.ipaymu.com' : 'https://sandbox.ipaymu.com';
  return { va, apiKey, isProduction, baseUrl };
}

function sha256HexLower(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex').toLowerCase();
}

export function buildIpaymuSignature(method: string, va: string, apiKey: string, bodyJson: string): string {
  const bodyHash = sha256HexLower(bodyJson);
  const stringToSign = `${method}:${va}:${bodyHash}:${apiKey}`;
  return crypto.createHmac('sha256', apiKey).update(stringToSign).digest('hex').toLowerCase();
}

export async function createIpaymuRedirectInvoice(params: CreateIpaymuInvoiceParams): Promise<IpaymuInvoiceResult> {
  const { va, apiKey, baseUrl } = getConfig();
  if (!va || !apiKey) return mockInvoice(params.referenceId);

  const body: Record<string, unknown> = {
    product: [params.productName],
    qty: [String(params.qty ?? 1)],
    price: [String(params.price)],
    returnUrl: params.returnUrl || process.env.IPAYMU_RETURN_URL || `${process.env.APP_URL || 'http://localhost:3000'}/dashboard/billing?payment=success`,
    notifyUrl: params.notifyUrl || process.env.IPAYMU_NOTIFY_URL || `${process.env.API_URL || 'http://localhost:3001'}/api/payment/ipaymu-callback`,
    cancelUrl: params.cancelUrl || process.env.IPAYMU_CANCEL_URL || `${process.env.APP_URL || 'http://localhost:3000'}/dashboard/billing?payment=cancel`,
    referenceId: params.referenceId,
    buyerName: params.buyerName,
    buyerEmail: params.buyerEmail,
    buyerPhone: params.buyerPhone,
  };

  const bodyJson = JSON.stringify(body);
  const signature = buildIpaymuSignature('POST', va, apiKey, bodyJson);
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14); // YYYYMMDDHHmmss, cukup pakai UTC; iPaymu juga terima format ts lain
  // Lebih presisi: pakai WIB timestamp YYYYMMDDHHmmss
  // Alternatif: gunakan Date.now format — iPaymu tidak strict validasi timestamp selain header ada
  const ts = (() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  })();

  const res = await fetch(`${baseUrl}/api/v2/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'va': va,
      'signature': signature,
      'timestamp': ts || timestamp,
    },
    body: bodyJson,
  });

  if (!res.ok) {
    const txt = await res.text();
    // fallback mock on auth error to keep dev flow
    if (res.status === 401) {
      console.warn('iPaymu 401 Unauthorized -> fallback mock');
      return mockInvoice(params.referenceId);
    }
    throw new Error(`iPaymu API error (${res.status}): ${txt}`);
  }

  const data = await res.json() as any;
  // Expected: { Status: 200, Data: { SessionId, TransactionId, Url, ReferenceId } }
  if (data.Status !== 200 && data.status !== 200) {
    throw new Error(`iPaymu error: ${JSON.stringify(data)}`);
  }
  const d = data.Data || data.data || {};
  return {
    id: String(d.SessionId || d.sessionId || d.sid || params.referenceId),
    transactionId: String(d.TransactionId || d.transactionId || d.trx_id || ''),
    link: String(d.Url || d.url || ''),
    expiredAt: d.ExpiredAt ? new Date(d.ExpiredAt).getTime() : Date.now() + 24 * 60 * 60 * 1000,
  };
}

// ------- Callback validation (sesuai docs.ipaymu.com/id/docs/callback) -------
function normalizeData(raw: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in raw) {
    let val = raw[key];
    if (val === null || val === undefined) {
      result[key] = val;
      continue;
    }
    if (key === 'is_escrow') {
      result[key] = val === true || val === 'true' || val === '1' || val === 1;
    } else if (['trx_id', 'status_code', 'transaction_status_code', 'paid_off'].includes(key)) {
      result[key] = parseInt(String(val), 10);
    } else if (key === 'additional_info') {
      if (val === '[]' || val === '') result[key] = [];
      else if (Array.isArray(val)) result[key] = val;
      else {
        try { const p = JSON.parse(String(val)); result[key] = Array.isArray(p) ? p : val; } catch { result[key] = val; }
      }
    } else {
      result[key] = String(val);
    }
  }
  if (!Object.prototype.hasOwnProperty.call(result, 'additional_info')) {
    result['additional_info'] = [];
  }
  if (result.signature) delete result.signature;
  return result;
}

function ksort(obj: Record<string, any>): Record<string, any> {
  return Object.keys(obj).sort((a, b) => a.localeCompare(b)).reduce((acc: Record<string, any>, k) => { acc[k] = obj[k]; return acc; }, {});
}

export function verifyIpaymuCallbackSignature(rawBody: Record<string, any>, receivedSignature: string | undefined): boolean {
  const va = process.env.IPAYMU_VA || '';
  if (!va) return true; // no VA configured -> skip verification (dev)
  if (!receivedSignature) return false;
  const normalized = normalizeData(rawBody);
  const sorted = ksort(normalized);
  let jsonBody = JSON.stringify(sorted);
  jsonBody = jsonBody.replace(/\//g, '\\/');
  const calc = crypto.createHmac('sha256', va).update(jsonBody).digest('hex').toLowerCase();
  return calc.toLowerCase() === receivedSignature.toLowerCase();
}

export function parseIpaymuCallback(payload: any): { orderId: string | null; paid: boolean; amount: number | null } {
  const referenceId = payload.reference_id || payload.referenceId || payload.ReferenceId || null;
  // status_code 1 = berhasil, 0 = pending, -2 = expired; also status text 'berhasil'
  const scRaw = payload.status_code ?? payload.statusCode;
  const sc = scRaw !== undefined ? parseInt(String(scRaw), 10) : null;
  const statusText = String(payload.status || '').toLowerCase();
  const paid = sc === 1 || statusText === 'berhasil' || statusText === 'success';
  let amount: number | null = null;
  const amtRaw = payload.amount ?? payload.total ?? payload.sub_total;
  if (amtRaw !== undefined && amtRaw !== null && String(amtRaw).trim() !== '') {
    const n = parseInt(String(amtRaw), 10);
    amount = isNaN(n) ? null : n;
  }
  return { orderId: referenceId ? String(referenceId) : null, paid, amount };
}
