import crypto from 'crypto';

export interface MidtransItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface MidtransCustomer {
  first_name: string;
  email: string;
}

export interface CreateSnapTransactionParams {
  orderId: string;
  amount: number;
  items: MidtransItem[];
  customer: MidtransCustomer;
}

export async function createSnapTransaction(params: CreateSnapTransactionParams): Promise<{ token: string; redirect_url: string }> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-DUMMY_KEY';
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  const baseUrl = isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;

  const payload = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    item_details: params.items,
    customer_details: {
      first_name: params.customer.first_name,
      email: params.customer.email,
    },
  };

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Midtrans API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    token: data.token,
    redirect_url: data.redirect_url,
  };
}

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-DUMMY_KEY';
  const rawString = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const calculatedHash = crypto.createHash('sha512').update(rawString).digest('hex');
  return calculatedHash.toLowerCase() === signatureKey.toLowerCase();
}
