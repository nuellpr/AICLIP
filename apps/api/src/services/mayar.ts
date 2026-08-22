// Mayar.id payment gateway integration
// Docs: https://docs.mayar.id
// Create invoice v2: POST {base}/hl/v2/invoices/create with Bearer API key

export interface MayarItem {
  quantity: number;
  rate: number; // Rupiah, integer
  description: string;
}

export interface MayarCustomer {
  name: string;
  email: string;
  mobile: string; // e.g. 081234567890
}

export interface MayarInvoiceResult {
  id: string;
  transactionId: string;
  link: string; // Payment page URL (user pays here)
  expiredAt: number; // ms timestamp
}

interface CreateMayarInvoiceParams {
  invoiceId: string; // our internal orderId, echoed back via extraData
  customer: MayarCustomer;
  items: MayarItem[];
  expiredAt?: Date;
}

function mockInvoice(invoiceId: string): MayarInvoiceResult {
  console.log('MAYAR_API_KEY not configured. Using Mock invoice for testing mode.');
  return {
    id: `mock-${invoiceId}`,
    transactionId: `mock-trx-${Date.now()}`,
    link: `https://testingmayar.myr.id/invoices/mock-${invoiceId}`,
    expiredAt: Date.now() + 24 * 60 * 60 * 1000,
  };
}

export async function createMayarInvoice(params: CreateMayarInvoiceParams): Promise<MayarInvoiceResult> {
  const apiKey = process.env.MAYAR_API_KEY || '';
  const isProduction = process.env.MAYAR_IS_PRODUCTION === 'true';

  if (!apiKey) {
    return mockInvoice(params.invoiceId);
  }

  const baseUrl = isProduction
    ? 'https://api.mayar.id/hl/v2/invoices/create'
    : 'https://api.mayar.io/hl/v2/invoices/create';

  const payload: Record<string, unknown> = {
    name: params.customer.name,
    email: params.customer.email,
    mobile: params.customer.mobile,
    description: params.items.map((i) => i.description).join(', '),
    items: params.items,
    extraData: { orderId: params.invoiceId }, // echoed back in webhook payload
  };

  if (params.expiredAt) {
    payload.expiredAt = params.expiredAt.toISOString();
  }

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 401) {
      console.warn('Mayar returned 401 Unauthorized (Invalid API Key). Falling back to testing mode...');
      return mockInvoice(params.invoiceId);
    }
    throw new Error(`Mayar API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    id: data.data.id,
    transactionId: data.data.transactionId,
    link: data.data.link,
    expiredAt: data.data.expiredAt,
  };
}

export interface MayarWebhookPayload {
  event?: { received?: string };
  eventType?: string;
  data?: {
    id?: string;
    status?: boolean | string;
    amount?: number;
    customerEmail?: string;
    extraData?: Record<string, unknown> | null;
    custom_field?: Array<Record<string, unknown>> | null;
    [key: string]: unknown;
  };
}

// Mayar webhooks are NOT signed (no HMAC). We verify by:
// 1. event name is payment.received, 2. data.status truthy, 3. amount matches.
export function parseMayarWebhook(payload: MayarWebhookPayload): {
  orderId: string | null;
  paid: boolean;
  amount: number | null;
} {
  const eventName = payload?.event?.received || payload?.eventType || '';
  const d = payload?.data || {};

  const isPaidEvent = eventName === 'payment.received';
  const statusOk = d.status === true || d.status === 'paid' || d.status === 'true';
  const paid = isPaidEvent && statusOk;

  // extraData.orderId is our internal orderId (echoed from invoice creation)
  const extra = d.extraData || {};
  const orderId =
    (extra.orderId as string) ||
    (Array.isArray(d.custom_field) ? (d.custom_field[0]?.value as string) : null) ||
    null;

  return {
    orderId,
    paid,
    amount: typeof d.amount === 'number' ? d.amount : null,
  };
}
