import { MOCK_TENANT_RECORDS } from '../mocks/sharedMockData.js';

const VALID_DATA_SOURCES = new Set(['real', 'mock']);
const DEFAULT_DATA_SOURCE = 'real';

export const DATA_SOURCE_MODE = VALID_DATA_SOURCES.has(import.meta.env.VITE_DATA_SOURCE)
  ? import.meta.env.VITE_DATA_SOURCE
  : DEFAULT_DATA_SOURCE;

export function isMockDataSource() {
  return DATA_SOURCE_MODE === 'mock';
}

export function getTenantRevenueChartMock(tenantSlug) {
  const tenant = MOCK_TENANT_RECORDS.find((item) => item.slug === tenantSlug);
  return tenant?.revenueChart ? JSON.parse(JSON.stringify(tenant.revenueChart)) : [];
}
