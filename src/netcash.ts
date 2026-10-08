// Netcash integration — hosted mandate signing + webhook handling.
//
// NOTE: Netcash requires a real merchant account (netcash.co.za) for live
// production use. Until you have your credentials, the app runs in "sandbox
// mode": the signup step shows a preview of the mandate page and lets you
// simulate the webhook so the whole flow works end-to-end.

import { pb, type Client } from './pb';

// ---------------------------------------------------------------------------
// Configuration — fill these in when you get your Netcash merchant account.
// ---------------------------------------------------------------------------
export const NETCASH_CONFIG = {
  // Netcash merchant credentials (from netcash.co.za)
  account: import.meta.env.VITE_NETCASH_ACCOUNT ?? '',
  password: import.meta.env.VITE_NETCASH_PASSWORD ?? '',
  serviceKey: import.meta.env.VITE_NETCASH_SERVICE_KEY ?? '',

  // The webhook URL Netcash pings. In production this must be a public URL.
  // Dappit Base exposes a route at: {VITE_PB_URL}/api/webhooks/netcash
  webhookUrl: `${import.meta.env.VITE_PB_URL}/api/webhooks/netcash`,

  // Netcash hosted mandate page (production).
  hostedUrl: 'https://netcash.co.za/secure/debit-order',
  // Sandbox / test endpoint — replace with your test gateway when available.
  sandboxUrl: 'https://sandbox.netcash.co.za/secure/debit-order',

  // Is this a live integration? Flip to true once you have credentials.
  live: Boolean(import.meta.env.VITE_NETCASH_ACCOUNT),
};

// ---------------------------------------------------------------------------
// Build the redirect URL for a client to sign their debit order mandate.
// ---------------------------------------------------------------------------
export function buildMandateUrl(client: Client): string {
  const base = NETCASH_CONFIG.live ? NETCASH_CONFIG.hostedUrl : NETCASH_CONFIG.sandboxUrl;
  const params = new URLSearchParams({
    // Netcash expects these fields on the hosted page.
    // Exact field names come from Netcash's API docs for your account.
    account: NETCASH_CONFIG.account,
    reference: client.id, // unique mandate reference = our client id
    name: client.name,
    email: client.email,
    phone: client.phone,
    amount: String(0), // mandate signing is R0 — the debit amount is set by the mandate
    frequency: 'monthly',
    serviceKey: NETCASH_CONFIG.serviceKey,
    // Where Netcash sends the client after they finish.
    redirectUrl: `${window.location.origin}?mandate=${client.id}`,
    // Where Netcash pings with the result.
    webhookUrl: NETCASH_CONFIG.webhookUrl,
  });
  return `${base}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Simulate the Netcash webhook in sandbox mode.
// This lets you test the full flow (mandate approve + payment success)
// without a live merchant account.
// ---------------------------------------------------------------------------
export async function simulateWebhook(
  clientId: string,
  eventType: 'mandate_approved' | 'payment_success' | 'payment_failed',
  amount?: number,
): Promise<{ ok: boolean; text: string }> {
  try {
    // Record the event.
    await pb.collection('netcash_events').create({
      client: clientId,
      event_type: eventType,
      amount: amount ?? 0,
      reference: clientId,
      raw_payload: { simulated: true, event_type: eventType, amount: amount ?? 0 },
      processed: false,
    });

    // Process it like the real webhook would.
    await processNetcashEvent({
      client: clientId,
      event_type: eventType,
      amount: amount ?? 0,
      reference: clientId,
    });

    return { ok: true, text: 'Webhook processed successfully.' };
  } catch (e) {
    console.error(e);
    return { ok: false, text: 'Failed to process webhook.' };
  }
}

// ---------------------------------------------------------------------------
// Core webhook logic — this is what the backend route calls when Netcash
// pings it. It updates the client record and payment status.
// ---------------------------------------------------------------------------
export async function processNetcashEvent(event: {
  client: string;
  event_type: 'mandate_approved' | 'payment_success' | 'payment_failed' | 'mandate_cancelled';
  amount: number;
  reference: string;
}): Promise<void> {
  const client = await pb.collection('clients').getOne<Client>(event.client);

  switch (event.event_type) {
    case 'mandate_approved': {
      // Mandate signed — mark the client active and start the 30-day
      // waiting period. The waiting period ends 30 days after the FIRST
      // successful payment, so we record the mandate date and compute it
      // from the first payment below.
      await pb.collection('clients').update(event.client, {
        status: 'ready',
        mandateActive: true,
        mandateDate: new Date().toISOString(),
      });
      break;
    }

    case 'payment_success': {
      // A monthly debit succeeded. Flip the current month's payment to paid.
      const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      const existing = await pb
        .collection('payments')
        .getList(1, 1, { filter: `client = "${event.client}" && month = "${month}"` });

      if (existing.items.length > 0) {
        await pb.collection('payments').update(existing.items[0].id, { paid: true });
      } else {
        // First successful payment — create the payment record AND start the
        // 30-day waiting period from today.
        await pb.collection('payments').create({
          client: event.client,
          amount: event.amount,
          month,
          paid: true,
        });
        const waitingEnds = new Date();
        waitingEnds.setDate(waitingEnds.getDate() + 30);
        await pb.collection('clients').update(event.client, {
          status: 'serviced',
          waitingPeriodEnds: waitingEnds.toISOString(),
        });
      }
      break;
    }

    case 'payment_failed': {
      // Debit failed — leave the payment unpaid so the owner can follow up.
      const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      const existing = await pb
        .collection('payments')
        .getList(1, 1, { filter: `client = "${event.client}" && month = "${month}"` });
      if (existing.items.length > 0) {
        await pb.collection('payments').update(existing.items[0].id, { paid: false });
      }
      break;
    }

    case 'mandate_cancelled': {
      await pb.collection('clients').update(event.client, {
        mandateActive: false,
        status: 'pending',
      });
      break;
    }
  }
}
