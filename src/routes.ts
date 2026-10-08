// Custom API routes for Dappit Base.
// This registers the Netcash webhook endpoint so Netcash can ping it.

import { handleNetcashWebhook } from './webhook';

export const routes = {
  '/api/webhooks/netcash': handleNetcashWebhook,
};
