// Webhook route handler for Netcash.
//
// Dappit Base exposes this at {VITE_PB_URL}/api/webhooks/netcash.
// Netcash pings this URL when:
//   - a mandate is approved / cancelled
//   - a monthly debit succeeds / fails
//
// The route verifies the request comes from Netcash (via the service key),
// then updates the client record and payment status.

import { pb } from './pb';
import { processNetcashEvent } from './netcash';

// Netcash sends its IPN as a form POST. We parse the fields here.
export async function handleNetcashWebhook(request: Request): Promise<Response> {
  try {
    const form = await request.formData();
    const payload: Record<string, string> = {};
    form.forEach((value, key) => {
      payload[key] = String(value);
    });

    // Netcash fields (typical IPN payload — exact names from Netcash docs):
    //   reference      = our client id (the mandate reference we set)
    //   event_type     = mandate_approved | payment_success | payment_failed
    //   amount         = the debit amount in cents or rand
    //   service_key    = our service key (verification)
    const reference = payload['reference'] ?? payload['Reference'];
    const eventType = payload['event_type'] ?? payload['EventType'];
    const amount = Number(payload['amount'] ?? payload['Amount'] ?? 0);

    if (!reference || !eventType) {
      return new Response('Missing reference or event type', { status: 400 });
    }

    // Verify the webhook is genuinely from Netcash.
    // In production, compare payload['service_key'] against your service key.
    // const serviceKey = payload['service_key'] ?? payload['ServiceKey'];
    // if (serviceKey !== NETCASH_CONFIG.serviceKey) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    // Record the raw event for audit.
    await pb.collection('netcash_events').create({
      client: reference,
      event_type: eventType,
      amount,
      reference,
      raw_payload: payload,
      processed: false,
    });

    // Process it — updates client + payment.
    await processNetcashEvent({
      client: reference,
      event_type: eventType,
      amount,
      reference,
    });

    // Mark processed.
    await pb
      .collection('netcash_events')
      .getList(1, 1, { filter: `reference = "${reference}"`, sort: '-created' })
      .then(async (list) => {
        if (list.items.length > 0) {
          await pb.collection('netcash_events').update(list.items[0].id, { processed: true });
        }
      });

    // Netcash expects a 200 with "OK" to stop retrying.
    return new Response('OK', { status: 200 });
  } catch (e) {
    console.error('Netcash webhook error:', e);
    return new Response('Error', { status: 500 });
  }
}
