import { getTenantRowBySlug } from '../shared/db.js';
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
  const tenant = await getTenantRowBySlug(tenantSlug);
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
    readTenantProjection(tenant),
    readSettingsProjection(tenant),
    readHrProjection(tenant),
    readFinanceProjection(tenant),
    readCustomersProjection(tenant),
    readOrdersProjection(tenant),
    readDeliveryProjection(tenant),
    readCatalogProjection(tenant),
    readMenuProjection(tenant),
    readReviewsProjection(tenant)
  ]);

  return {
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
  };
}
