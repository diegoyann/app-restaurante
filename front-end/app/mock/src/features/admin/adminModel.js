export const NEW_COMPANY_VALUE = '__new_company__';

export const emptyTenantForm = {
  name: '',
  slug: '',
  companyId: NEW_COMPANY_VALUE,
  companyName: '',
  companySlug: '',
  companyLegalName: '',
  companyCnpj: '',
  companyAddress: '',
  branchName: '',
  branchCode: '',
  isHeadquarters: false,
  importMenuFromHeadquarters: false,
  importCmvFromHeadquarters: false
};

export const emptyIdentityForm = {
  name: '',
  businessName: '',
  companyId: '',
  companyName: '',
  companySlug: '',
  companyLegalName: '',
  companyCnpj: '',
  companyAddress: '',
  branchName: '',
  branchCode: '',
  isHeadquarters: false
};

export const emptyUserForm = {
  id: '',
  name: '',
  email: '',
  password: '',
  role: 'tenant_admin',
  roleProfileId: '',
  accessScope: 'branch'
};

export const emptyEmployeeForm = {
  id: '',
  name: '',
  role: '',
  employmentType: 'fixed',
  salary: '0',
  baseAmount: '0',
  status: 'active',
  notes: ''
};

export function normalizeSettingsForm(settings) {
  return {
    businessName: settings?.businessName || '',
    ifoodTax: String(settings?.ifoodTax ?? 0),
    anotaaiTax: String(settings?.anotaaiTax ?? 0),
    alertDaysBefore: String(settings?.alertDaysBefore ?? 0)
  };
}

export function normalizeEmployeeForm(employee) {
  if (!employee) return emptyEmployeeForm;

  return {
    id: employee.id || '',
    name: employee.name || '',
    role: employee.role || '',
    employmentType: employee.employmentType || 'fixed',
    salary: String(employee.salary ?? 0),
    baseAmount: String(employee.baseAmount ?? 0),
    status: employee.status || 'active',
    notes: employee.notes || ''
  };
}

export function normalizeUserForm(user) {
  if (!user) return emptyUserForm;

  return {
    id: user.id || '',
    name: user.name || '',
    email: user.email || '',
    password: '',
    role: user.role || 'tenant_admin',
    roleProfileId: user.roleProfileId || '',
    accessScope: user.accessScope || 'branch'
  };
}
