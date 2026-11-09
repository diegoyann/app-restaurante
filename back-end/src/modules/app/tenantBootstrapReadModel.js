import { getTenantRowBySlug } from '../shared/db.js';
import { jsonByteLength, measureBootstrapSpan } from '../../lib/bootstrapTrace.js';
import { readCatalogProjection } from './projections/catalogProjection.js';
import { readCustomersProjection } from './projections/customersProjection.js';
import { readDeliveryProjection } from './projections/deliveryProjection.js';
import { readFinanceProjection } from './projections/financeProjection.js';
import { readHrProjection } from './projections/hrProjection.js';
import { readMenuProjection } from './projections/menuProjection.js';
import { readOrdersProjection } from './projections/ordersProjection.js';
import { readReviewsProjection } from './projections/reviewsProjection.js';
import { readSettingsProjection } from './projections/settingsProjection.js';
import { readTenantProjection } from './projections/tenantProjection.js';

export async function getTenantBootstrap(tenantSlug) {
  const tenant = await measureBootstrapSpan('tenant.resolution', () => getTenantRowBySlug(tenantSlug));
  const measureProjection = (name, action) => measureBootstrapSpan(
    `projection.${name}`,
    action,
    (result) => ({ payloadBytes: jsonByteLength(result) })
  );
  const [
    tenantProjection,
    settingsProjection,
    hrProjection,
    financeProjection,
    customersProjection,
    ordersProjection,
    deliveryProjection,
    catalogProjection,
    menuProjection,
    reviewsProjection
  ] = await Promise.all([
    measureProjection('tenant', () => readTenantProjection(tenant)),
    measureProjection('settings', () => readSettingsProjection(tenant)),
    measureProjection('hr', () => readHrProjection(tenant)),
    measureProjection('finance', () => readFinanceProjection(tenant)),
    measureProjection('customers', () => readCustomersProjection(tenant)),
    measureProjection('orders', () => readOrdersProjection(tenant)),
    measureProjection('delivery', () => readDeliveryProjection(tenant)),
    measureProjection('catalog', () => readCatalogProjection(tenant)),
    measureProjection('menu', () => readMenuProjection(tenant)),
    measureProjection('reviews', () => readReviewsProjection(tenant))
  ]);

  return measureBootstrapSpan('response.assembly.projections', async () => ({
    ...tenantProjection,
    ...settingsProjection,
    ...hrProjection,
    ...financeProjection,
    ...customersProjection,
    ...ordersProjection,
    ...deliveryProjection,
    ...catalogProjection,
    ...menuProjection,
    ...reviewsProjection
  }));
}
