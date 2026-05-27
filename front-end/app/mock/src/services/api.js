import { DATA_SOURCE_MODE } from '../config/dataSource.js';
import * as realApi from './realApi.js';
import * as mockApi from './mockApi.js';

const adapter = DATA_SOURCE_MODE === 'mock' ? mockApi : realApi;

export const authApi = adapter.authApi;
export const appApi = adapter.appApi;
export const settingsApi = adapter.settingsApi;
export const financeApi = adapter.financeApi;
export const customersApi = adapter.customersApi;
export const paymentMethodsApi = adapter.paymentMethodsApi;
export const ordersApi = adapter.ordersApi;
export const deliveryApi = adapter.deliveryApi;
export const integrationsApi = adapter.integrationsApi;
export const publicMenuApi = adapter.publicMenuApi;
export const hrApi = adapter.hrApi;
export const menuApi = adapter.menuApi;
export const catalogApi = adapter.catalogApi;
export const adminApi = adapter.adminApi;
export const roleProfilesApi = adapter.roleProfilesApi;
