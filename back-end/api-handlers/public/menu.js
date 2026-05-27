import { getTenantBootstrap } from '../../src/modules/public/index.js';
import {
  badRequest,
  getTenantSlug,
  handleOptions,
  methodNotAllowed,
  sendError,
  sendJson
} from '../_shared/http.js';

function isVisibleMenuItem(item) {
  return item.status === 'active' || item.status === 'seasonal';
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const tenantSlug = getTenantSlug(req);
  if (!tenantSlug) return badRequest(res, 'Informe o tenant na query ?tenant=slug.');

  try {
    if (req.method !== 'GET') {
      return methodNotAllowed(res, ['GET']);
    }

    const bootstrap = await getTenantBootstrap(tenantSlug);
    const visibleItems = bootstrap.menuItems.filter(isVisibleMenuItem);
    const visibleCategoryNames = new Set(visibleItems.map((item) => item.category).filter(Boolean));

    return sendJson(res, 200, {
      tenant: {
        slug: bootstrap.tenant.slug,
        name: bootstrap.tenant.name,
        businessName: bootstrap.tenant.businessName
      },
      categories: bootstrap.menuCategories.filter((category) => visibleCategoryNames.has(category.name)),
      items: visibleItems,
      paymentMethods: bootstrap.paymentMethods.filter((method) => method.status === 'active')
    });
  } catch (error) {
    return sendError(res, error, 400);
  }
}
