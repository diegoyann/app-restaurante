import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  ChefHat,
  DollarSign,
  Loader2,
  LockKeyhole,
  LogOut,
  Menu,
  Package,
  PieChart,
  Receipt,
  Settings,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { appApi, roleProfilesApi } from '../services/api.js';
import { catalogApi, menuApi } from '../services/api.js';
import { supabase } from '../lib/supabase.js';
import { isMockDataSource } from '../config/dataSource.js';
import { signOutMock } from '../services/mockAuth.js';
import RolePermissionsManager from '../features/permissions/RolePermissionsManager.jsx';
import { hasPermission } from '../features/permissions/permissionCatalog.js';
import AccountSecuritySection from '../features/settings/AccountSecuritySection.jsx';
import { ReviewManagementPage } from '../features/reviews/ReviewManagement.jsx';
import { MenuCategoryManager, MenuItemFormPanel } from '../features/menu/MenuComponents.jsx';
import {
  createEmptyCategoryForm,
  createEmptyMenuItemForm,
  createInitialMenuCategories,
  getMenuStatusMeta
} from '../features/menu/menuModel.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return 'Sem data';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data inválida';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

const EMPTY_LIST = [];

function StatCard({ title, value, icon: Icon, colorClass, bgColorClass, iconColorClass }) {
  return (
    <div className="bg-white p-4 xl:p-5 2xl:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all h-full min-h-[110px] xl:min-h-[132px]">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase tracking-tighter truncate mb-1">{title}</p>
        <p className={`text-xl sm:text-2xl xl:text-3xl 2xl:text-4xl font-black ${colorClass} truncate leading-none`}>{value}</p>
      </div>
      <div className={`p-2.5 xl:p-3 2xl:p-4 rounded-xl shrink-0 ml-2 ${bgColorClass}`}>
        {React.createElement(Icon, { size: 20, className: iconColorClass })}
      </div>
    </div>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <div className="bg-white p-5 sm:p-7 xl:p-8 rounded-[1.5rem] border border-gray-100 shadow-sm">
      <div className="mb-6">
        <h3 className="text-[11px] sm:text-xs xl:text-sm font-black text-[#2A1E15] uppercase italic font-sans tracking-tight">{title}</h3>
        {description ? <p className="mt-2 text-sm font-bold text-[#696965]">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

// --- PALETAS DE CORES ---
const palettes = {
    frescor: {
        primary: '#4A6B53',
        primaryDark: '#3B5441',
        primaryLight: '#E8F5E9',
        primaryDarker: '#2A3F30',
        secondary: '#FF9800',
        secondaryHover: '#E68A00',
        secondaryLight: '#FFE0B2',
        bgApp: '#F8F9FA',
        bgCard: '#FFFFFF',
        bgAlt: '#E8F5E9',
        textStrong: '#1f2937',
        accentMin: '#12343B'
    },
    natural: {
        primary: '#3E5A3C',
        primaryDark: '#2F442E',
        primaryLight: '#A3B899',
        primaryDarker: '#1E2C1D',
        secondary: '#DDA73A',
        secondaryHover: '#C5942B',
        secondaryLight: '#F6E3B8',
        bgApp: '#F5F2EB',
        bgCard: '#FFFFFF',
        bgAlt: '#E6E1D5',
        textStrong: '#2C3E2B',
        accentMin: '#12343B'
    },
    premium: {
        primary: '#212529',
        primaryDark: '#1A1D20',
        primaryLight: '#343A40',
        primaryDarker: '#0D0E10',
        secondary: '#E63946',
        secondaryHover: '#D62839',
        secondaryLight: '#FFC0C7',
        bgApp: '#F1F3F5',
        bgCard: '#FFFFFF',
        bgAlt: '#E2E8F0',
        textStrong: '#1A1D20',
        accentMin: '#12343B'
    },
    esfiha: {
        primary: '#2A1E15',
        primaryDark: '#1F120B',
        primaryLight: '#E7DED1',
        primaryDarker: '#2A1E15',
        secondary: '#D4A373',
        secondaryHover: '#C58F5E',
        secondaryLight: '#F3E8DA',
        bgApp: '#FAF6EF',
        bgCard: '#FFFFFF',
        bgAlt: '#F3E8DA',
        textStrong: '#2A1E15',
        textMedium: '#6F6258',
        textWeak: '#9B8E82',
        accentMin: '#3F6F8F',
        success: '#2F8F55',
        error: '#C95C49'
    }
};

export default function TenantWorkspacePage({ tenantSlug }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);
  const [permissionError, setPermissionError] = useState('');
  const [permissionSuccess, setPermissionSuccess] = useState('');
  const [permissionsSaving, setPermissionsSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [openGroups, setOpenGroups] = useState(() => ({ operacional: true, financeiro: false, pessoas: false, sistema: false }));
  const [menuCategoryForm, setMenuCategoryForm] = useState(() => createEmptyCategoryForm());
  const [menuItemForm, setMenuItemForm] = useState(() => createEmptyMenuItemForm('Esfiha'));
  const [menuComponentSearch, setMenuComponentSearch] = useState('');
  const [editingMenuCategoryId, setEditingMenuCategoryId] = useState(null);
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [menuSaving, setMenuSaving] = useState(false);
  const [menuError, setMenuError] = useState('');
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [ingredientForm, setIngredientForm] = useState(() => ({ name: '', unit: 'g', unitCost: '' }));
  const [productForm, setProductForm] = useState(() => ({ name: '', salePrice: '', targetCmvPercent: '', yieldQuantity: '1' }));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const response = await appApi.getBootstrap(tenantSlug);
        if (!cancelled) {
          setPayload(response);
        }
      } catch (apiError) {
        if (!cancelled) {
          setError(apiError.message || 'Falha ao carregar o painel do tenant.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const settings = payload?.settings ?? {};

  // Injeção dinâmica da paleta de cores no :root
  React.useEffect(() => {
    const paletteKey = settings?.colorPalette || 'esfiha';
    const colors = palettes[paletteKey] || palettes.esfiha;
    
    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-dark', colors.primaryDark);
    root.style.setProperty('--color-primary-light', colors.primaryLight);
    root.style.setProperty('--color-primary-darker', colors.primaryDarker);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-secondary-hover', colors.secondaryHover);
    root.style.setProperty('--color-secondary-light', colors.secondaryLight);
    root.style.setProperty('--color-bg-app', colors.bgApp);
    root.style.setProperty('--color-bg-card', colors.bgCard);
    root.style.setProperty('--color-bg-alt', colors.bgAlt);
    root.style.setProperty('--color-text-main', colors.textStrong || '#1A1D20');
    root.style.setProperty('--color-text-medium', colors.textMedium || '#6F5B50');
    root.style.setProperty('--color-text-weak', colors.textWeak || '#B9A89A');
    root.style.setProperty('--color-accent-min', colors.accentMin || '#12343B');
    root.style.setProperty('--color-success', colors.success || '#2F8F55');
    root.style.setProperty('--color-error', colors.error || '#B83A2F');
  }, [settings?.colorPalette]);

  const employees = payload?.employees ?? EMPTY_LIST;
  const transactions = payload?.transactions ?? EMPTY_LIST;
  const recurringCosts = payload?.recurringCosts ?? EMPTY_LIST;
  const ingredients = payload?.ingredients ?? EMPTY_LIST;
  const ingredientUnits = payload?.ingredientUnits ?? EMPTY_LIST;
  const preparations = payload?.preparations ?? EMPTY_LIST;
  const products = payload?.products ?? EMPTY_LIST;
  const menuCategories = payload?.menuCategories ?? EMPTY_LIST;
  const menuItems = payload?.menuItems ?? EMPTY_LIST;
  const reviews = payload?.reviews ?? EMPTY_LIST;
  const roleProfiles = payload?.roleProfiles ?? EMPTY_LIST;
  const currentUserPermissions = useMemo(() => payload?.currentUserPermissions ?? {}, [payload?.currentUserPermissions]);
  const can = (permissionKey) => hasPermission(currentUserPermissions, permissionKey);
  const fallbackMenuCategories = useMemo(() => createInitialMenuCategories(), []);
  const menuCategoryOptions = useMemo(
    () => (menuCategories.length > 0 ? menuCategories : fallbackMenuCategories).map((category) => category.name),
    [fallbackMenuCategories, menuCategories]
  );
  const ingredientUnitOptions = ingredientUnits.length > 0 ? ingredientUnits.map((unit) => unit.label) : ['g', 'ml', 'un', 'kg'];

  useEffect(() => {
    if (!menuCategoryOptions.includes(menuItemForm.category)) {
      setMenuItemForm((prev) => ({ ...prev, category: menuCategoryOptions[0] || '' }));
    }
  }, [menuCategoryOptions, menuItemForm.category]);

  const summary = useMemo(() => {
    const receitaBruta = transactions
      .filter((item) => item.type === 'receita')
      .reduce((acc, item) => acc + Number(item.amount || 0), 0);

    const receitaLiquida = transactions
      .filter((item) => item.type === 'receita')
      .reduce((acc, item) => acc + Number(item.net ?? item.amount ?? 0), 0);

    const despesas = transactions
      .filter((item) => item.type === 'despesa')
      .reduce((acc, item) => acc + Math.abs(Number(item.amount || 0)), 0);

    const totalOrders = transactions.filter((item) => item.type === 'receita').length;
    const ticketMedio = totalOrders > 0 ? receitaBruta / totalOrders : 0;
    const custosFixos = recurringCosts.reduce((acc, item) => acc + Number(item.amount || 0), 0);

    return {
      businessName: settings.businessName || 'Rei das Esfihas',
      receitaBruta,
      receitaLiquida,
      despesas,
      totalOrders,
      ticketMedio,
      custosFixos,
      productsCount: products.length,
      menuItemsCount: menuItems.length,
      employeesCount: employees.length
    };
  }, [employees.length, menuItems.length, products.length, recurringCosts, settings.businessName, transactions]);

  const latestTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 8),
    [transactions]
  );

  const filteredMenuComponentOptions = useMemo(() => {
    const normalizedSearch = menuComponentSearch.trim().toLowerCase();

    return products
      .map((product) => ({
        key: `product:${product.id}`,
        name: product.name,
        subtitle: `${formatCurrency(product.salePrice)} · CMV alvo ${product.targetCmvPercent || 0}%`,
        tag: 'Produto final'
      }))
      .filter((product) => !normalizedSearch || product.name.toLowerCase().includes(normalizedSearch));
  }, [menuComponentSearch, products]);

  const menuDashboard = useMemo(() => {
    const visibleItems = menuItems.filter((item) => item.status === 'active' || item.status === 'seasonal').length;
    const activeItems = menuItems.filter((item) => item.status === 'active').length;
    const highlightedItems = menuItems.filter((item) => item.status === 'seasonal').length;
    const draftItems = menuItems.filter((item) => item.status === 'draft').length;
    const linkedItems = menuItems.filter((item) => (item.linkedComponents || []).length > 0).length;

    return { visibleItems, activeItems, highlightedItems, draftItems, linkedItems };
  }, [menuItems]);

  const catalogSummary = useMemo(() => {
    const averageTargetCmv = products.length
      ? products.reduce((acc, product) => acc + Number(product.targetCmvPercent || 0), 0) / products.length
      : 0;
    const averageSalePrice = products.length
      ? products.reduce((acc, product) => acc + Number(product.salePrice || 0), 0) / products.length
      : 0;

    return { averageTargetCmv, averageSalePrice };
  }, [products]);

  const menuGroups = [
    {
      key: 'operacional',
      label: 'Operacional',
      icon: Briefcase,
      items: [
        { id: 'menu', label: 'Cardápio Operacional', icon: ChefHat, permission: 'menu.view' },
        { id: 'reviews', label: 'Gestão de Avaliações', icon: Star, permission: 'reviews.view' },
        { id: 'cmv', label: 'CMV / Ficha Técnica', icon: Wallet, permission: 'cmv.view' }
      ]
    },
    {
      key: 'financeiro',
      label: 'Financeiro',
      icon: DollarSign,
      items: [
        { id: 'financeiro', label: 'Lançamentos', icon: TrendingUp, permission: 'finance.transactions.view' },
        { id: 'closing', label: 'Fechamento', icon: PieChart, permission: 'finance.closing.view' }
      ]
    },
    {
      key: 'pessoas',
      label: 'Pessoas',
      icon: Users,
      items: [
        { id: 'rh', label: 'RH / Pessoal', icon: Users, permission: 'people.hr.view' }
      ]
    },
    {
      key: 'sistema',
      label: 'Sistema',
      icon: Settings,
      items: [
        { id: 'settings', label: 'Configurações', icon: Settings, permission: 'settings.general.view' },
        { id: 'security', label: 'Segurança', icon: LockKeyhole, permission: 'settings.general.view' },
        { id: 'permissions', label: 'Permissões', icon: ShieldCheck, permission: 'system.permissions.manage' }
      ]
    }
  ];
  const visibleMenuGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => can(item.permission))
    }))
    .filter((group) => group.items.length > 0);
  const canViewDashboard = can('dashboard.view');
  const firstAllowedTab = canViewDashboard
    ? 'dashboard'
    : visibleMenuGroups[0]?.items[0]?.id || '';

  const tabLabels = {
    dashboard: 'Dashboard',
    menu: 'Cardápio Operacional',
    reviews: 'Gestão de Avaliações',
    cmv: 'CMV / Ficha Técnica',
    financeiro: 'Lançamentos',
    closing: 'Fechamento',
    rh: 'RH / Pessoal',
    settings: 'Configurações',
    security: 'Segurança',
    permissions: 'Permissões'
  };

  const activeTabLabel = tabLabels[activeTab] || 'Dashboard';

  useEffect(() => {
    if (!loading && firstAllowedTab && activeTab !== firstAllowedTab) {
      const activePermission = activeTab === 'dashboard'
        ? 'dashboard.view'
        : visibleMenuGroups.flatMap((group) => group.items).find((item) => item.id === activeTab)?.permission;
      if (!activePermission || !hasPermission(currentUserPermissions, activePermission)) {
        setActiveTab(firstAllowedTab);
      }
    }
  }, [activeTab, firstAllowedTab, loading, visibleMenuGroups, currentUserPermissions]);

  const handleSaveRoleProfile = async (profile) => {
    setPermissionsSaving(true);
    setPermissionError('');
    setPermissionSuccess('');

    try {
      const nextPayload = await roleProfilesApi.saveRoleProfile(tenantSlug, profile);
      setPayload(nextPayload);
      setPermissionSuccess('Perfil salvo.');
      return nextPayload.roleProfiles?.find((item) => item.name === profile.name) || null;
    } catch (apiError) {
      setPermissionError(apiError.message || 'Falha ao salvar perfil.');
      return null;
    } finally {
      setPermissionsSaving(false);
    }
  };

  const handleDeleteRoleProfile = async (profileId) => {
    setPermissionsSaving(true);
    setPermissionError('');
    setPermissionSuccess('');

    try {
      const nextPayload = await roleProfilesApi.deleteRoleProfile(tenantSlug, profileId);
      setPayload(nextPayload);
      setPermissionSuccess('Perfil excluído.');
    } catch (apiError) {
      setPermissionError(apiError.message || 'Falha ao excluir perfil.');
    } finally {
      setPermissionsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (isMockDataSource()) {
      await signOutMock();
      navigate('/login', { replace: true });
      return;
    }

    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  const updatePayloadList = (key, nextList) => {
    setPayload((prev) => ({ ...(prev || {}), [key]: nextList }));
  };

  const handleMenuCategoryFormChange = (field, value) => {
    setMenuCategoryForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetMenuCategoryForm = () => {
    setEditingMenuCategoryId(null);
    setMenuCategoryForm(createEmptyCategoryForm());
  };

  const handleSubmitMenuCategory = async (event) => {
    event.preventDefault();
    setMenuSaving(true);
    setMenuError('');

    try {
      const savedCategory = await menuApi.saveCategory(tenantSlug, {
        id: editingMenuCategoryId || undefined,
        name: menuCategoryForm.name
      });
      const nextCategories = editingMenuCategoryId
        ? menuCategories.map((category) => category.id === savedCategory.id ? savedCategory : category)
        : [...menuCategories, savedCategory];
      updatePayloadList('menuCategories', nextCategories);
      resetMenuCategoryForm();
    } catch (apiError) {
      setMenuError(apiError.message || 'Falha ao salvar categoria.');
    } finally {
      setMenuSaving(false);
    }
  };

  const handleEditMenuCategory = (category) => {
    setEditingMenuCategoryId(category.id);
    setMenuCategoryForm({ name: category.name });
  };

  const handleDeleteMenuCategory = async (categoryId) => {
    setMenuSaving(true);
    setMenuError('');

    try {
      await menuApi.deleteCategory(tenantSlug, categoryId);
      updatePayloadList('menuCategories', menuCategories.filter((category) => category.id !== categoryId));
      updatePayloadList('menuItems', menuItems.map((item) => (
        item.category === menuCategories.find((category) => category.id === categoryId)?.name
          ? { ...item, category: '' }
          : item
      )));
    } catch (apiError) {
      setMenuError(apiError.message || 'Falha ao excluir categoria.');
    } finally {
      setMenuSaving(false);
    }
  };

  const handleMenuItemFormChange = (field, value) => {
    setMenuItemForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetMenuItemForm = () => {
    setEditingMenuItemId(null);
    setMenuItemForm(createEmptyMenuItemForm(menuCategoryOptions[0] || ''));
    setMenuComponentSearch('');
  };

  const handleToggleMenuComponent = (componentKey) => {
    setMenuItemForm((prev) => {
      const selected = prev.linkedComponentIds.includes(componentKey);
      return {
        ...prev,
        linkedComponentIds: selected
          ? prev.linkedComponentIds.filter((key) => key !== componentKey)
          : [...prev.linkedComponentIds, componentKey]
      };
    });
  };

  const handleSubmitMenuItem = async (event) => {
    event.preventDefault();
    setMenuSaving(true);
    setMenuError('');

    try {
      const savedItem = await menuApi.saveItem(tenantSlug, {
        id: editingMenuItemId || undefined,
        itemType: 'regular',
        name: menuItemForm.name,
        category: menuItemForm.category,
        description: menuItemForm.description,
        status: menuItemForm.status,
        salePrice: Number(menuItemForm.salePrice) || 0,
        photoPreview: menuItemForm.photoPreview,
        linkedComponents: menuItemForm.linkedComponentIds.map((componentKey) => {
          const [type, rawId] = componentKey.split(':');
          const numericId = Number(rawId);
          return { type, id: Number.isNaN(numericId) ? rawId : numericId };
        })
      });
      const nextItems = editingMenuItemId
        ? menuItems.map((item) => item.id === savedItem.id ? savedItem : item)
        : [savedItem, ...menuItems];
      updatePayloadList('menuItems', nextItems);
      resetMenuItemForm();
    } catch (apiError) {
      setMenuError(apiError.message || 'Falha ao salvar item.');
    } finally {
      setMenuSaving(false);
    }
  };

  const handleEditMenuItem = (item) => {
    setEditingMenuItemId(item.id);
    setMenuItemForm({
      name: item.name || '',
      category: item.category || menuCategoryOptions[0] || '',
      description: item.description || '',
      status: item.status || 'active',
      salePrice: String(item.salePrice || ''),
      photoPreview: item.photoPreview || '',
      linkedComponentIds: (item.linkedComponents || []).map((component) => `${component.type}:${component.id}`)
    });
  };

  const handleDeleteMenuItem = async (itemId) => {
    setMenuSaving(true);
    setMenuError('');

    try {
      await menuApi.deleteItem(tenantSlug, itemId);
      updatePayloadList('menuItems', menuItems.filter((item) => item.id !== itemId));
      if (editingMenuItemId === itemId) resetMenuItemForm();
    } catch (apiError) {
      setMenuError(apiError.message || 'Falha ao excluir item.');
    } finally {
      setMenuSaving(false);
    }
  };

  const handleIngredientFormChange = (field, value) => {
    setIngredientForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProductFormChange = (field, value) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitIngredient = async (event) => {
    event.preventDefault();
    setCatalogSaving(true);
    setCatalogError('');

    try {
      const savedIngredient = await catalogApi.saveIngredient(tenantSlug, {
        name: ingredientForm.name,
        unit: ingredientForm.unit,
        unitCost: Number(ingredientForm.unitCost) || 0,
        packageCost: Number(ingredientForm.unitCost) || 0,
        packageQuantity: 1
      });
      updatePayloadList('ingredients', [savedIngredient, ...ingredients]);
      setIngredientForm({ name: '', unit: ingredientUnitOptions[0] || 'g', unitCost: '' });
    } catch (apiError) {
      setCatalogError(apiError.message || 'Falha ao salvar insumo.');
    } finally {
      setCatalogSaving(false);
    }
  };

  const handleSubmitProduct = async (event) => {
    event.preventDefault();
    setCatalogSaving(true);
    setCatalogError('');

    try {
      const savedProduct = await catalogApi.saveProduct(tenantSlug, {
        name: productForm.name,
        salePrice: Number(productForm.salePrice) || 0,
        targetCmvPercent: Number(productForm.targetCmvPercent) || 0,
        yieldQuantity: Number(productForm.yieldQuantity) || 1,
        recipe: []
      });
      updatePayloadList('products', [savedProduct, ...products]);
      setProductForm({ name: '', salePrice: '', targetCmvPercent: '', yieldQuantity: '1' });
    } catch (apiError) {
      setCatalogError(apiError.message || 'Falha ao salvar produto.');
    } finally {
      setCatalogSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 md:p-6 font-sans">
        <div className="bg-[#FFFFFF] w-full max-w-[440px] rounded-[2rem] p-8 shadow-2xl border border-gray-100 text-center space-y-4 italic">
          <Loader2 size={28} className="mx-auto animate-spin text-[#2A1E15]" />
          <p className="text-sm font-black text-[#2A1E15] uppercase tracking-widest">Carregando painel</p>
          <p className="text-xs font-bold text-[#696965]">Aguarde um instante.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 md:p-6 font-sans">
        <div className="bg-[#FFFFFF] w-full max-w-[520px] rounded-[2rem] p-8 shadow-2xl border border-gray-100 text-center space-y-4 italic">
          <p className="text-sm font-black text-red-700 uppercase tracking-widest">Falha ao carregar o painel</p>
          <p className="text-xs font-bold text-[#696965]">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full bg-[#2A1E15] text-[#FFFFFF] py-3 rounded-2xl font-black uppercase text-xs hover:bg-[#D4A373] transition-all shadow-xl"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell flex min-h-screen bg-[#FFFFFF] text-gray-900 font-sans italic relative">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-[45] lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

        <aside className={`fixed lg:sticky top-0 left-0 z-50 w-64 xl:w-72 2xl:w-80 bg-gradient-to-b from-[#2E1C14] via-[#3A2114] to-[#A85A2B] border-r border-white/15 flex flex-col h-screen transition-transform duration-300 shadow-[10px_0_30px_rgba(42,30,21,0.22)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 xl:p-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-white/8 ring-1 ring-[#D4A373]/35 shadow-sm">
              <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-xl bg-[#D4A373] flex items-center justify-center text-[#3A281B] font-black not-italic">R</div>
            </div>
            <span className="font-black text-lg xl:text-xl 2xl:text-2xl tracking-tighter text-white uppercase not-italic">REI DAS<span className="text-[#D4A373] italic ml-1">ESFIHAS</span></span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-white/60"><Menu size={20} /></button>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto py-2 space-y-1">
          {canViewDashboard && (
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'dashboard'
                ? 'menu-item-active bg-[#EED9B0] text-[#2A1E15] ring-1 ring-[#D4A373]/35 shadow-lg shadow-black/10 font-black'
                : 'text-[#EAD8BF] hover:bg-white/10 hover:text-[#FFF7EA] font-bold'
                }`}
            >
              <BarChart3 size={16} className="shrink-0" />
              <span className="text-xs tracking-tight uppercase">Dashboard</span>
            </button>
          )}

          {visibleMenuGroups.map((group) => {
            const isOpen = openGroups[group.key];
            const hasActive = group.items.some((item) => item.id === activeTab);
            const GroupIcon = group.icon;

            return (
              <div key={group.key}>
                <button
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mt-1 ${hasActive && !isOpen
                    ? 'text-[#F3E8DA] font-black bg-white/10 border border-[#D4A373]/35 shadow-md'
                    : 'text-[#EAD8BF] hover:bg-white/10 hover:text-[#FFF7EA] font-bold border border-transparent'
                    }`}
                >
                  <GroupIcon size={15} className={`shrink-0 ${hasActive && !isOpen ? 'text-[#EED9B0]' : 'text-[#E6CDA8]'}`} />
                  <span className="text-[11px] tracking-[0.18em] uppercase flex-1 text-left">{group.label}</span>
                  <svg className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="ml-3 pl-3 border-l-2 border-[#D4A373]/30 space-y-1 py-2">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${activeTab === item.id
                            ? 'menu-item-active bg-[#EED9B0] text-[#2A1E15] font-black shadow-md shadow-black/10 border-l-4 border-[#D4A373]'
                            : 'text-[#EAD8BF] hover:bg-white/10 hover:text-[#FFF7EA] font-semibold'
                            }`}
                        >
                          <ItemIcon size={14} className={`shrink-0 ${activeTab === item.id ? 'text-[#2A1E15]' : 'text-[#F5E8D3]'}`} />
                          <span className="text-[11px] tracking-[0.08em] uppercase">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/15 bg-black/10 backdrop-blur-sm">
          <button
            onClick={handleLogout}
            className="text-[9px] font-black text-white uppercase tracking-widest hover:text-[#F3E8DA] flex items-center justify-center gap-2 w-full transition-colors"
          >
            <LogOut size={12} /> Sair do Reino
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="h-16 sm:h-20 xl:h-24 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 xl:px-10 2xl:px-12 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-[#2A1E15] bg-gray-50 rounded-xl"><Menu size={20} /></button>
            <h2 className="text-base sm:text-xl xl:text-2xl 2xl:text-3xl font-black text-[#2A1E15] uppercase italic tracking-tighter truncate">{activeTabLabel}</h2>
          </div>
          <div className="bg-[#FFFFFF] border border-[#D4A373]/20 px-2 py-1 xl:px-3 xl:py-1.5 rounded-lg text-[9px] sm:text-[10px] xl:text-xs font-black text-[#D4A373] uppercase tracking-widest italic">Painel Administrativo</div>
        </header>

        <div className="p-4 sm:p-8 xl:p-10 2xl:p-12 max-w-[1800px] 2xl:max-w-[2000px] mx-auto space-y-6 sm:space-y-8 xl:space-y-10 font-sans w-full">
          {activeTab === 'dashboard' && canViewDashboard && (
            <div className="dashboard-page space-y-6 xl:space-y-8">
              <div className="dashboard-stats-grid grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 xl:gap-6">
                {can('dashboard.cards.revenue') && <StatCard title="Receita Bruta" value={formatCurrency(summary.receitaBruta)} icon={TrendingUp} colorClass="text-green-700" bgColorClass="bg-green-50" iconColorClass="text-green-700" />}
                {can('dashboard.cards.orders') && <StatCard title="Pedidos" value={summary.totalOrders} icon={Receipt} colorClass="text-[#696965]" bgColorClass="bg-gray-100" iconColorClass="text-[#696965]" />}
                {can('dashboard.cards.ticket') && <StatCard title="Ticket Médio" value={formatCurrency(summary.ticketMedio)} icon={Wallet} colorClass="text-amber-700" bgColorClass="bg-amber-50" iconColorClass="text-amber-700" />}
                {can('dashboard.cards.cmv') && <StatCard title="CMV Catálogo" value="0.0%" icon={BarChart3} colorClass="text-blue-700" bgColorClass="bg-blue-50" iconColorClass="text-blue-700" />}
                {can('dashboard.cards.markup') && <StatCard title="Markup Médio" value="0.0%" icon={DollarSign} colorClass="text-purple-700" bgColorClass="bg-purple-50" iconColorClass="text-purple-700" />}
                {can('dashboard.cards.fixedCosts') && <StatCard title="Custos Fixos" value={formatCurrency(summary.custosFixos)} icon={CalendarDays} colorClass="text-[#2A1E15]" bgColorClass="bg-[#2A1E15]/10" iconColorClass="text-[#2A1E15]" />}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 xl:gap-8">
                <SectionCard title="Receita por Canal">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#F3E8DA] px-4 py-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#696965]">Receita líquida</span>
                      <span className="text-sm font-black text-[#2A1E15]">{formatCurrency(summary.receitaLiquida)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#F3E8DA] px-4 py-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#696965]">Despesas lançadas</span>
                      <span className="text-sm font-black text-[#2A1E15]">{formatCurrency(summary.despesas)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#F3E8DA] px-4 py-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#696965]">Equipe ativa</span>
                      <span className="text-sm font-black text-[#2A1E15]">{summary.employeesCount}</span>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Resumo Operacional">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#F3E8DA] px-4 py-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#696965]">Produtos</p>
                        <p className="text-sm font-black text-[#2A1E15]">{summary.productsCount}</p>
                      </div>
                      <Package size={18} className="text-[#D4A373]" />
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#F3E8DA] px-4 py-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#696965]">Itens de cardápio</p>
                        <p className="text-sm font-black text-[#2A1E15]">{summary.menuItemsCount}</p>
                      </div>
                      <ChefHat size={18} className="text-[#D4A373]" />
                    </div>
                    <div className="rounded-2xl border border-dashed border-[#D4A373]/40 bg-[#fffaf0] px-4 py-4">
                      <p className="text-sm font-bold text-[#696965]">
                        Nenhum alerta operacional no momento.
                      </p>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {activeTab === 'financeiro' && can('finance.transactions.view') && (
            <SectionCard title="Lançamentos">
              <div className="space-y-3">
                {latestTransactions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#2A1E15]/15 px-4 py-6 text-sm font-semibold text-[#7a6666]">
                    Nenhuma transação cadastrada.
                  </div>
                ) : latestTransactions.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl bg-[#FAF6EF] px-4 py-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight text-[#2A1E15]">{item.note || item.category || item.platform || 'Movimentação'}</p>
                      <p className="mt-1 text-xs font-semibold text-[#7a6666]">{formatDate(item.date)} • {item.type || 'sem tipo'}</p>
                    </div>
                    <p className={`text-sm font-black ${item.type === 'despesa' ? 'text-red-700' : 'text-emerald-700'}`}>
                      {formatCurrency(item.net ?? item.amount ?? 0)}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {activeTab === 'rh' && can('people.hr.view') && (
            <SectionCard title="RH / Pessoal">
              <div className="space-y-3">
                {employees.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#2A1E15]/15 px-4 py-6 text-sm font-semibold text-[#7a6666]">
                    Nenhum colaborador cadastrado.
                  </div>
                ) : employees.map((employee) => (
                  <div key={employee.id} className="rounded-2xl bg-[#FAF6EF] px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight text-[#2A1E15]">{employee.name}</p>
                        <p className="mt-1 text-xs font-semibold text-[#7a6666]">{employee.role || 'Sem cargo'} • {employee.employmentType || 'Sem tipo'}</p>
                      </div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D4A373]">{employee.status || 'ativo'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {activeTab === 'permissions' && can('system.permissions.manage') && (
            <SectionCard title="Perfis e permissões" description="Gerencie os acessos da equipe.">
              <div className="space-y-4">
                {(permissionError || permissionSuccess) && (
                  <div className={`rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.14em] ${permissionError ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
                    {permissionError || permissionSuccess}
                  </div>
                )}
                <RolePermissionsManager
                  roleProfiles={roleProfiles}
                  saving={permissionsSaving}
                  onSaveProfile={handleSaveRoleProfile}
                  onDeleteProfile={handleDeleteRoleProfile}
                />
              </div>
            </SectionCard>
          )}

          {activeTab === 'security' && can('settings.general.view') && (
            <SectionCard title="Segurança" description="Login social e autenticação em duas etapas da sua conta.">
              <AccountSecuritySection />
            </SectionCard>
          )}

          {activeTab === 'menu' && can('menu.view') && (
            <SectionCard title={activeTabLabel}>
              <div className="space-y-6">
                {menuError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-red-700">
                    {menuError}
                  </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <StatCard title="Itens" value={menuItems.length} icon={ChefHat} colorClass="text-[#2A1E15]" bgColorClass="bg-[#2A1E15]/10" iconColorClass="text-[#2A1E15]" />
                  <StatCard title="Disponíveis" value={menuDashboard.activeItems} icon={Package} colorClass="text-green-700" bgColorClass="bg-green-50" iconColorClass="text-green-700" />
                  <StatCard title="Visíveis" value={menuDashboard.visibleItems} icon={Receipt} colorClass="text-amber-700" bgColorClass="bg-amber-50" iconColorClass="text-amber-700" />
                  <StatCard title="Vínculos" value={menuDashboard.linkedItems} icon={Wallet} colorClass="text-blue-700" bgColorClass="bg-blue-50" iconColorClass="text-blue-700" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] gap-5">
                  <MenuCategoryManager
                    categories={menuCategories}
                    categoryForm={menuCategoryForm}
                    editingCategoryId={editingMenuCategoryId}
                    onCategoryFormChange={handleMenuCategoryFormChange}
                    onSubmitCategory={handleSubmitMenuCategory}
                    onEditCategory={handleEditMenuCategory}
                    onDeleteCategory={handleDeleteMenuCategory}
                    onCancelEdit={resetMenuCategoryForm}
                  />

                  <div className="space-y-4">
                    <MenuItemFormPanel
                      menuItemForm={menuItemForm}
                      editingMenuItemId={editingMenuItemId}
                      categoryOptions={menuCategoryOptions}
                      menuComponentSearch={menuComponentSearch}
                      filteredMenuComponentOptions={filteredMenuComponentOptions}
                      onMenuItemFormChange={handleMenuItemFormChange}
                      onSubmitMenuItem={handleSubmitMenuItem}
                      onResetMenuItemForm={resetMenuItemForm}
                      onMenuItemPhotoChange={() => {}}
                      onMenuComponentSearchChange={setMenuComponentSearch}
                      onToggleMenuComponent={handleToggleMenuComponent}
                    />
                    {menuSaving && <p className="text-xs font-black uppercase tracking-widest text-[#D4A373]">Salvando cardápio...</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="text-sm font-black text-[#2A1E15] uppercase tracking-tight">Itens cadastrados</h4>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A373]">{menuDashboard.highlightedItems} destaque(s)</span>
                  </div>

                  {menuItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#2A1E15]/15 px-4 py-6 text-sm font-semibold text-[#7a6666]">
                      Nenhum item cadastrado ainda. O formulário acima continua disponível porque tela vazia não cadastra nada.
                    </div>
                  ) : menuItems.map((item) => {
                    const statusMeta = getMenuStatusMeta(item.status);

                    return (
                      <div key={item.id} className="rounded-2xl bg-[#FAF6EF] px-4 py-4 border border-gray-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-black uppercase tracking-tight text-[#2A1E15]">{item.name}</p>
                          <p className="mt-1 text-xs font-semibold text-[#7a6666]">{item.category || 'Sem categoria'} • {formatCurrency(item.basePrice || item.salePrice || 0)}</p>
                          <p className="mt-2 text-xs font-semibold text-[#7a6666] line-clamp-2">{item.description || 'Sem descrição cadastrada.'}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${statusMeta.badgeClass}`}>{statusMeta.label}</span>
                          <button type="button" onClick={() => handleEditMenuItem(item)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase text-[#2A1E15]">Editar</button>
                          <button type="button" onClick={() => handleDeleteMenuItem(item.id)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-black uppercase text-red-700">Excluir</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionCard>
          )}

          {activeTab === 'reviews' && can('reviews.view') && (
            <ReviewManagementPage initialReviews={reviews} />
          )}

          {activeTab === 'cmv' && can('cmv.view') && (
            <SectionCard title={activeTabLabel}>
              <div className="space-y-6">
                {catalogError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-red-700">
                    {catalogError}
                  </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <StatCard title="Insumos" value={ingredients.length} icon={Receipt} colorClass="text-[#2A1E15]" bgColorClass="bg-[#2A1E15]/10" iconColorClass="text-[#2A1E15]" />
                  <StatCard title="Bases" value={preparations.length} icon={Package} colorClass="text-blue-700" bgColorClass="bg-blue-50" iconColorClass="text-blue-700" />
                  <StatCard title="Produtos" value={products.length} icon={ChefHat} colorClass="text-green-700" bgColorClass="bg-green-50" iconColorClass="text-green-700" />
                  <StatCard title="CMV alvo" value={`${catalogSummary.averageTargetCmv.toFixed(1)}%`} icon={PieChart} colorClass="text-amber-700" bgColorClass="bg-amber-50" iconColorClass="text-amber-700" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <form onSubmit={handleSubmitIngredient} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                    <div>
                      <p className="text-[11px] font-black text-[#D4A373] uppercase tracking-[0.25em]">Insumos</p>
                      <h3 className="text-lg font-black text-[#2A1E15] uppercase tracking-tighter">Cadastro de custo</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_120px_160px] gap-3">
                      <input value={ingredientForm.name} onChange={(event) => handleIngredientFormChange('name', event.target.value)} placeholder="Nome do insumo" className="w-full px-4 py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#D4A373]" required />
                      <select value={ingredientForm.unit} onChange={(event) => handleIngredientFormChange('unit', event.target.value)} className="w-full px-3 py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-[#D4A373]">
                        {ingredientUnitOptions.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                      </select>
                      <input value={ingredientForm.unitCost} onChange={(event) => handleIngredientFormChange('unitCost', event.target.value)} placeholder="Custo" type="number" step="0.0001" className="w-full px-4 py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#D4A373]" required />
                    </div>
                    <button type="submit" disabled={catalogSaving} className="w-full bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md disabled:opacity-60">Cadastrar insumo</button>
                  </form>

                  <form onSubmit={handleSubmitProduct} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                    <div>
                      <p className="text-[11px] font-black text-[#D4A373] uppercase tracking-[0.25em]">Produtos</p>
                      <h3 className="text-lg font-black text-[#2A1E15] uppercase tracking-tighter">Cadastro de produto final</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input value={productForm.name} onChange={(event) => handleProductFormChange('name', event.target.value)} placeholder="Nome do produto" className="w-full px-4 py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#D4A373]" required />
                      <input value={productForm.salePrice} onChange={(event) => handleProductFormChange('salePrice', event.target.value)} placeholder="Preço venda" type="number" step="0.01" className="w-full px-4 py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#D4A373]" required />
                      <input value={productForm.targetCmvPercent} onChange={(event) => handleProductFormChange('targetCmvPercent', event.target.value)} placeholder="CMV alvo %" type="number" step="0.1" className="w-full px-4 py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#D4A373]" />
                      <input value={productForm.yieldQuantity} onChange={(event) => handleProductFormChange('yieldQuantity', event.target.value)} placeholder="Rendimento" type="number" step="0.01" className="w-full px-4 py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#D4A373]" />
                    </div>
                    <button type="submit" disabled={catalogSaving} className="w-full bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md disabled:opacity-60">Cadastrar produto</button>
                  </form>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-[#2A1E15] uppercase tracking-tight">Insumos cadastrados</h4>
                    {ingredients.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#2A1E15]/15 px-4 py-6 text-sm font-semibold text-[#7a6666]">Nenhum insumo cadastrado.</div>
                    ) : ingredients.map((ingredient) => (
                      <div key={ingredient.id} className="rounded-2xl bg-[#FAF6EF] px-4 py-4 border border-gray-100 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight text-[#2A1E15]">{ingredient.name}</p>
                          <p className="mt-1 text-xs font-semibold text-[#7a6666]">{ingredient.unit} • {formatCurrency(ingredient.unitCost || ingredient.packageCost || 0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-[#2A1E15] uppercase tracking-tight">Produtos cadastrados</h4>
                    {products.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#2A1E15]/15 px-4 py-6 text-sm font-semibold text-[#7a6666]">Nenhum produto cadastrado.</div>
                    ) : products.map((product) => (
                      <div key={product.id} className="rounded-2xl bg-[#FAF6EF] px-4 py-4 border border-gray-100 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight text-[#2A1E15]">{product.name}</p>
                          <p className="mt-1 text-xs font-semibold text-[#7a6666]">{formatCurrency(product.salePrice)} • CMV alvo {product.targetCmvPercent || 0}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {(
            (activeTab === 'closing' && can('finance.closing.view'))
            || (activeTab === 'settings' && can('settings.general.view'))
          ) && (
            <SectionCard title={activeTabLabel}>
              <div className="rounded-2xl border border-dashed border-[#2A1E15]/15 px-4 py-8 text-sm font-semibold text-[#7a6666]">
                Nenhum dado cadastrado.
              </div>
            </SectionCard>
          )}
        </div>
      </main>
    </div>
  );
}
