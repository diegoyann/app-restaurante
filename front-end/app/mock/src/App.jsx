import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  startTransition,
} from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  DollarSign,
  Plus,
  Copy,
  Trash2,
  PieChart,
  LogOut,
  User,
  Lock,
  AlertCircle,
  BarChart3,
  Crown,
  ShoppingBag,
  Users,
  Briefcase,
  Settings,
  CreditCard,
  Wallet,
  Save,
  CheckCircle,
  Bell,
  X,
  Calendar,
  CalendarClock,
  Edit,
  List,
  Circle,
  Check,
  Menu,
  ChefHat,
  ImagePlus,
  Camera,
  Search,
  Link2,
  Eye,
  Sparkles,
  Star,
  Bot,
  GripVertical,
} from "lucide-react";
import {
  ComboEditorModal,
  MenuCategoryManager,
  MenuCategoryModal,
  MenuItemFormPanel,
  MenuItemModal,
} from "./features/menu/MenuComponents.jsx";
import {
  createEmptyCategoryForm,
  createEmptyComboForm,
  createEmptyComboGroup,
  createEmptyComboOption,
  createEmptyMenuItemForm,
  createId,
  createInitialMenuCategories,
  formatComboboxLabel,
  getComponentTagLabel,
  getMenuStatusMeta,
  menuStatusOptions,
  normalizeComboCategoryNames,
  normalizeComboOptionLinking,
  resolveLinkedComponentMeta,
  summarizeComboGroups,
} from "./features/menu/menuModel.js";
import { ReviewManagementPage } from "./features/reviews/ReviewManagement.jsx";
import { isAppTabEnabled } from "./config/featureFlags.js";
import OrderOperationsPage from "./features/orders/OrderOperationsPage.jsx";
import DreMonthlyPage from "./features/finance/DreMonthlyPage.jsx";
import ExecutiveDashboardPage from "./features/finance/ExecutiveDashboardPage.jsx";
import {
  buildMonthlyPayrollEntries,
  calculateMonthlyDre,
} from "./features/finance/dreModel.js";
import CashFlowPage from "./features/finance/CashFlowPage.jsx";
import AccountsPayablePage from "./features/finance/AccountsPayablePage.jsx";
import RecurringCostsPage from "./features/finance/RecurringCostsPage.jsx";
import SalesChannelsModal from "./features/finance/SalesChannelsModal.jsx";
import DailyRevenueForm from "./features/finance/DailyRevenueForm.jsx";
import ChannelSettlementsPanel from "./features/finance/ChannelSettlementsPanel.jsx";
import MonthlyClosingPage from "./features/finance/MonthlyClosingPage.jsx";
import { calculateCashCmv } from "./features/finance/cashCmvModel.js";
import {
  describeTransactionType,
  filterObligationsByMonth,
  filterTransactionsByMonth,
} from "./features/finance/financialViewModel.js";
import {
  formatDateOnlyBr,
  localDateIso,
} from "./features/finance/transactionDateModel.js";
import { deletePersistedTransaction } from "./features/finance/transactionActions.js";
import AiBehaviorSettingsPage from "./features/settings/AiBehaviorSettings.jsx";
import {
  createDefaultAiBehaviorSettings,
  normalizeAiBehaviorSettings,
} from "./features/settings/settingsModel.js";
import { createDefaultIngredientUnits } from "./mocks/appStateDefaults.js";
import {
  calculateComponentLineCost,
  calculateIngredientUnitCost,
  calculateRecipeCost,
  getCompatibleUnits,
  getDefaultCompatibleUnit,
  getIngredientCostReferenceFactor,
  getIngredientCostReferenceUnit,
  getIngredientCostReferenceValue,
  resolveSelectableUnitLabel,
} from "./features/catalog/cmvModel.js";
import {
  appApi,
  catalogApi,
  customersApi,
  financeApi,
  hrApi,
  menuApi,
  ordersApi,
  paymentMethodsApi,
  settingsApi,
  supplyChainApi,
} from "./services/api.js";
import { supabase } from "./lib/supabase.js";
import { isMockDataSource } from "./config/dataSource.js";
import { signOutMock } from "./services/mockAuth.js";
import SortableList from "./components/SortableList.jsx";
import SearchableSelect from "./components/SearchableSelect.jsx";
import CatalogExcelTools from "./features/catalog/CatalogExcelTools.jsx";
import WorkforceControlPanel from "./features/hr/WorkforceControlPanel.jsx";
import {
  FinancialBalancesPage,
  InventoryPage,
  PurchasesPage,
  SuppliersPage,
} from "./features/supply-chain/SupplyChainPages.jsx";

// --- CONFIGURAÇÃO ---
const LOGO_URL = "/hero-logo.png";
const USE_BACKEND_BOOTSTRAP = true;
const APP_TAB_IDS = new Set([
  "dashboard",
  "menu",
  "orders",
  "reviews",
  "cmv",
  "estoque",
  "compras",
  "fornecedores",
  "financeiro",
  "recorrentes",
  "saldos",
  "contas-pagar",
  "fluxo-caixa",
  "closing",
  "dre",
  "rh",
  "settings",
  "ai-behavior",
]);
const TAB_PERMISSION_KEYS = Object.freeze({
  dashboard: "dashboard.view",
  menu: "menu.view",
  orders: "menu.view",
  reviews: "reviews.view",
  cmv: "cmv.view",
  estoque: "finance.transactions.view",
  compras: "finance.transactions.view",
  fornecedores: "finance.transactions.view",
  financeiro: "finance.transactions.view",
  recorrentes: "finance.transactions.view",
  "contas-pagar": "finance.transactions.view",
  "fluxo-caixa": "finance.transactions.view",
  saldos: "finance.closing.view",
  dre: "finance.transactions.view",
  closing: "finance.closing.view",
  rh: "people.hr.view",
  settings: "settings.general.view",
  "ai-behavior": "settings.general.view",
});

function getTabFromLocationHash() {
  if (typeof window === "undefined") return "dashboard";

  const tab = window.location.hash.replace(/^#/, "").trim();
  return APP_TAB_IDS.has(tab) && isAppTabEnabled(tab) ? tab : "dashboard";
}
const isImportedFinancialTransaction = (transaction) =>
  /import|legacy|spreadsheet|planilha/i.test(
    `${transaction?.sourceType || ""} ${transaction?.note || ""}`,
  );
const MENU_DESCRIPTION_PREVIEW_LIMIT = 70;
const normalizeSortOrder = (items = []) =>
  items.map((item, index) => ({
    ...item,
    sortOrder: Number.isInteger(item.sortOrder) ? item.sortOrder : index,
  }));
const sortBySortOrder = (items = []) =>
  [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
const withSequentialSortOrder = (items = []) =>
  items.map((item, index) => ({ ...item, sortOrder: index }));

// --- COMPONENTES UI ---
const Logo = ({ className = "w-10 h-10" }) => {
  const [error, setError] = useState(false);
  if (error)
    return (
      <div
        className={`${className} bg-[#2A1E15] rounded-xl flex items-center justify-center shadow-lg`}
      >
        <Crown className="text-[#F6B52E]" size={20} />
      </div>
    );
  return (
    <img
      src={LOGO_URL}
      alt="Logo"
      className={`${className} object-contain rounded-xl drop-shadow-md`}
      onError={() => setError(true)}
    />
  );
};

const StatCard = ({
  title,
  value,
  icon,
  colorClass,
  bgColorClass,
  iconColorClass,
  variant = "",
}) => (
  <div
    className={`metric-card ${variant} bg-white p-4 xl:p-5 2xl:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all h-full min-h-[110px] xl:min-h-[132px] overflow-visible`}
  >
    <div className="min-w-0 flex-1">
      <p className="metric-card__label text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase tracking-tighter truncate mb-1">
        {title}
      </p>
      <p
        className={`metric-card__value whitespace-nowrap text-[clamp(1rem,1.8vw,1.875rem)] font-black ${colorClass} leading-tight tabular-nums`}
      >
        {value}
      </p>
    </div>
    <div
      className={`metric-icon-box p-2.5 xl:p-3 2xl:p-4 rounded-xl shrink-0 ml-2 ${bgColorClass}`}
    >
      {React.createElement(icon, {
        size: 20,
        className: `metric-icon ${iconColorClass}`,
      })}
    </div>
  </div>
);

const CustomInput = ({
  label,
  icon: Icon,
  type,
  value: propValue,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  name,
  step,
  ...props
}) => {
  const isCurrency = type === "currency";
  const inputRef = React.useRef(null);
  const [isCurrencyFocused, setIsCurrencyFocused] = React.useState(false);

  const [localValue, setLocalValue] = React.useState(() => {
    if (propValue !== undefined) return propValue;
    if (defaultValue !== undefined) return defaultValue;
    return "";
  });

  React.useEffect(() => {
    if (propValue !== undefined) {
      setLocalValue(propValue);
    }
  }, [propValue]);

  React.useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const form = input.form;
    if (!form) return;

    const handleReset = () => {
      setLocalValue(defaultValue !== undefined ? defaultValue : "");
    };

    form.addEventListener("reset", handleReset);
    return () => {
      form.removeEventListener("reset", handleReset);
    };
  }, [defaultValue]);

  const decimals = React.useMemo(() => {
    if (!step) return 2;
    const stepStr = String(step);
    if (stepStr.includes(".")) {
      return stepStr.split(".")[1].length;
    }
    return 2;
  }, [step]);

  const displayValue = React.useMemo(() => {
    if (!isCurrency) return localValue;
    if (localValue === undefined || localValue === null || localValue === "")
      return "";
    if (isCurrencyFocused) return String(localValue).replace(".", ",");
    const clean = String(localValue).replace(",", ".");
    const num = parseFloat(clean);
    if (isNaN(num)) return "";
    return num.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }, [localValue, isCurrency, decimals, isCurrencyFocused]);

  const handleChange = (e) => {
    if (!isCurrency) {
      setLocalValue(e.target.value);
      onChange?.(e);
      return;
    }

    const rawValue = e.target.value;
    if (rawValue === "") {
      setLocalValue("");
      if (onChange) {
        const synthEvent = { ...e, target: { ...e.target, value: "", name } };
        onChange(synthEvent);
      }
      return;
    }

    const normalized = rawValue
      .replace(/\s/g, "")
      .replace(/R\$/gi, "")
      .replace(/\.(?=.*[,.])/g, "")
      .replace(",", ".")
      .replace(/[^\d.]/g, "");
    const parts = normalized.split(".");
    const editableValue =
      parts.length > 1
        ? `${parts.shift()}.${parts.join("").slice(0, decimals)}`
        : parts[0];
    if (!editableValue) {
      setLocalValue("");
      if (onChange) {
        const synthEvent = { ...e, target: { ...e.target, value: "", name } };
        onChange(synthEvent);
      }
      return;
    }

    setLocalValue(editableValue);

    if (onChange) {
      const synthEvent = {
        ...e,
        target: { ...e.target, value: editableValue, name },
      };
      onChange(synthEvent);
    }
  };

  return (
    <div className="space-y-1 w-full">
      {label && (
        <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F6258]"
            size={16}
          />
        )}
        {isCurrency && name && (
          <input type="hidden" name={name} value={localValue} />
        )}
        <input
          {...props}
          ref={inputRef}
          name={isCurrency ? undefined : name}
          type={isCurrency ? "text" : type}
          inputMode={isCurrency ? "decimal" : props.inputMode}
          value={displayValue}
          onChange={handleChange}
          onFocus={(event) => {
            if (isCurrency) setIsCurrencyFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            if (isCurrency) setIsCurrencyFocused(false);
            onBlur?.(event);
          }}
          className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4A373] outline-none transition-all text-sm xl:text-base font-medium`}
        />
      </div>
    </div>
  );
};

const LegacyMenuCategoryManager = ({
  categories,
  categoryForm,
  editingCategoryId,
  onCategoryFormChange,
  onSubmitCategory,
  onEditCategory,
  onDeleteCategory,
  onCancelEdit,
  isModalContent = false,
}) => (
  <div
    className={
      isModalContent
        ? "space-y-5"
        : "bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-5"
    }
  >
    {!isModalContent && (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black text-[#D4A373] uppercase tracking-[0.25em]">
            Categorias
          </p>
          <h3 className="text-lg font-black text-[#2A1E15] uppercase tracking-tighter">
            Organização do cardápio
          </h3>
        </div>
        {editingCategoryId && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-[10px] font-black text-[#6F6258] border border-gray-200 px-4 py-2 rounded-full uppercase hover:border-[#2A1E15] hover:text-[#2A1E15] transition-all w-full sm:w-auto"
          >
            Cancelar edição
          </button>
        )}
      </div>
    )}

    <form
      onSubmit={onSubmitCategory}
      className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_220px] gap-3"
    >
      <CustomInput
        label="Nome da categoria"
        value={categoryForm.name}
        onChange={(e) => onCategoryFormChange("name", e.target.value)}
        required
      />
      <button
        type="submit"
        className="bg-[#2A1E15] text-[#FFFFFF] h-11 mt-auto rounded-xl font-black uppercase text-[10px] shadow-md"
      >
        {editingCategoryId ? "Salvar categoria" : "Cadastrar categoria"}
      </button>
    </form>

    <div className="menu-category-manager-list">
      {categories.map((category) => (
        <div key={category.id} className="menu-category-manager-item">
          <p className="text-sm font-black text-[#2A1E15] uppercase tracking-tight">
            {category.name}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditCategory(category)}
              className="menu-action-button menu-action-button--edit"
            >
              <Edit size={14} /> Editar
            </button>
            <button
              type="button"
              onClick={() => onDeleteCategory(category.id)}
              className="menu-action-button menu-action-button--delete"
            >
              <Trash2 size={14} /> Excluir
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const LegacyMenuItemFormPanel = ({
  menuItemForm,
  editingMenuItemId,
  categoryOptions,
  menuComponentSearch,
  filteredMenuComponentOptions,
  onMenuItemFormChange,
  onSubmitMenuItem,
  onResetMenuItemForm,
  onMenuItemPhotoChange,
  onMenuComponentSearchChange,
  onToggleMenuComponent,
  isModalContent = false,
}) => (
  <div
    className={
      isModalContent
        ? "space-y-6"
        : "bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6"
    }
  >
    {!isModalContent && (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black text-[#D4A373] uppercase tracking-[0.25em]">
            Itens
          </p>
          <h3 className="text-lg font-black text-[#2A1E15] uppercase tracking-tighter">
            Cadastro de item
          </h3>
        </div>
        {editingMenuItemId && (
          <button
            type="button"
            onClick={onResetMenuItemForm}
            className="text-[10px] font-black text-[#6F6258] border border-gray-200 px-4 py-2 rounded-full uppercase hover:border-[#2A1E15] hover:text-[#2A1E15] transition-all w-full sm:w-auto"
          >
            Cancelar edição
          </button>
        )}
      </div>
    )}

    <form onSubmit={onSubmitMenuItem} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CustomInput
          label="Nome do item"
          value={menuItemForm.name}
          onChange={(e) => onMenuItemFormChange("name", e.target.value)}
          required
        />
        <CustomInput
          label="Preço"
          type="currency"
          step="0.01"
          value={menuItemForm.salePrice}
          onChange={(e) => onMenuItemFormChange("salePrice", e.target.value)}
          required
        />
        <div className="space-y-1">
          <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
            Categoria
          </label>
          <select
            value={menuItemForm.category}
            onChange={(e) => onMenuItemFormChange("category", e.target.value)}
            className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
            required
          >
            <option value="">Selecione</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {formatComboboxLabel(category)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
            Visibilidade
          </label>
          <select
            value={menuItemForm.status}
            onChange={(e) => onMenuItemFormChange("status", e.target.value)}
            className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
          >
            {menuStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
          Descrição
        </label>
        <textarea
          value={menuItemForm.description}
          onChange={(e) => onMenuItemFormChange("description", e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-[#FFFFFF] border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#D4A373] outline-none transition-all text-sm xl:text-base font-medium resize-none"
          placeholder="Descreva sabor, recheio, acompanhamentos ou diferenciais do item."
          required
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4">
        <div className="space-y-3">
          <div className="menu-photo-dropzone">
            {menuItemForm.photoPreview ? (
              <img
                src={menuItemForm.photoPreview}
                alt={menuItemForm.name || "Preview do item"}
                className="menu-photo-preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-2 px-6">
                <ImagePlus size={28} className="text-[#D4A373]" />
                <p className="text-xs font-black text-[#2A1E15] uppercase tracking-widest">
                  Foto do item
                </p>
                <p className="text-[11px] text-[#6F6258] font-semibold">
                  Imagem ilustrativa para o cardápio digital.
                </p>
              </div>
            )}
          </div>
          <label className="bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md flex items-center justify-center gap-2 cursor-pointer">
            <Camera size={15} /> Selecionar foto
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onMenuItemPhotoChange}
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-[#2A1E15] uppercase">
                Receitas vinculadas
              </p>
              <p className="text-[11px] text-[#6F6258] font-semibold">
                Aqui entram só os produtos finais do catálogo. Insumo e base
                interna não pertencem a essa etapa.
              </p>
            </div>
            <div className="menu-link-counter">
              {menuItemForm.linkedComponentIds.length} selecionado(s)
            </div>
          </div>

          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F6258]"
            />
            <input
              type="text"
              value={menuComponentSearch}
              onChange={(e) => onMenuComponentSearchChange(e.target.value)}
              placeholder="Buscar produto final para vincular..."
              className="w-full pl-10 pr-4 py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#D4A373]"
            />
          </div>

          <div className="menu-component-list custom-scrollbar">
            {filteredMenuComponentOptions.map((component) => {
              const selected = menuItemForm.linkedComponentIds.includes(
                component.key,
              );

              return (
                <button
                  key={component.key}
                  type="button"
                  onClick={() => onToggleMenuComponent(component.key)}
                  className={`menu-component-option ${selected ? "menu-component-option--selected" : ""}`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selected ? "bg-[#2A1E15] border-[#2A1E15] text-white" : "border-gray-300 text-transparent"}`}
                    >
                      <Check size={12} />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-black text-[#2A1E15] uppercase truncate">
                        {component.name}
                      </p>
                      <p className="text-[11px] text-[#6F6258] font-semibold leading-relaxed">
                        {component.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="menu-component-tag">{component.tag}</span>
                </button>
              );
            })}

            {filteredMenuComponentOptions.length === 0 && (
              <div className="menu-empty-state">
                <Sparkles size={16} className="text-[#D4A373]" />
                <span>
                  Nenhum relacionamento encontrado para o filtro informado.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md"
      >
        {editingMenuItemId ? "Salvar item" : "Cadastrar item"}
      </button>
    </form>
  </div>
);

const LegacyMenuCategoryModal = ({
  isOpen,
  onClose,
  categories,
  categoryForm,
  editingCategoryId,
  onCategoryFormChange,
  onSubmitCategory,
  onEditCategory,
  onDeleteCategory,
  onCancelEdit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] p-5 sm:p-7 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[11px] font-black text-[#D4A373] uppercase tracking-[0.25em]">
              Categorias
            </p>
            <h3 className="text-2xl font-black text-[#2A1E15] uppercase tracking-tighter">
              Organização do cardápio
            </h3>
            <p className="text-xs font-semibold text-[#7a6262] mt-2">
              Cadastre, renomeie ou limpe categorias sem deixar esse formulário
              aberto ocupando a tela inteira.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <MenuCategoryManager
          categories={categories}
          categoryForm={categoryForm}
          editingCategoryId={editingCategoryId}
          onCategoryFormChange={onCategoryFormChange}
          onSubmitCategory={onSubmitCategory}
          onEditCategory={onEditCategory}
          onDeleteCategory={onDeleteCategory}
          onCancelEdit={onCancelEdit}
          isModalContent
        />
      </div>
    </div>
  );
};

const LegacyMenuItemModal = ({
  isOpen,
  onClose,
  menuItemForm,
  editingMenuItemId,
  categoryOptions,
  menuComponentSearch,
  filteredMenuComponentOptions,
  onMenuItemFormChange,
  onSubmitMenuItem,
  onResetMenuItemForm,
  onMenuItemPhotoChange,
  onMenuComponentSearchChange,
  onToggleMenuComponent,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] p-5 sm:p-7 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[11px] font-black text-[#D4A373] uppercase tracking-[0.25em]">
              Itens
            </p>
            <h3 className="text-2xl font-black text-[#2A1E15] uppercase tracking-tighter">
              Cadastro de item
            </h3>
            <p className="text-xs font-semibold text-[#7a6262] mt-2">
              Abra, preencha, salva e sai. Muito melhor do que deixar o
              formulário plantado na página o tempo todo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <MenuItemFormPanel
          menuItemForm={menuItemForm}
          editingMenuItemId={editingMenuItemId}
          categoryOptions={categoryOptions}
          menuComponentSearch={menuComponentSearch}
          filteredMenuComponentOptions={filteredMenuComponentOptions}
          onMenuItemFormChange={onMenuItemFormChange}
          onSubmitMenuItem={onSubmitMenuItem}
          onResetMenuItemForm={onResetMenuItemForm}
          onMenuItemPhotoChange={onMenuItemPhotoChange}
          onMenuComponentSearchChange={onMenuComponentSearchChange}
          onToggleMenuComponent={onToggleMenuComponent}
          isModalContent
        />
      </div>
    </div>
  );
};

const LegacyComboEditorModal = ({
  isOpen,
  onClose,
  comboForm,
  editingComboId,
  categoryOptions,
  menuComponentOptions,
  catalogMetrics,
  ingredients,
  onComboFormChange,
  onComboPhotoChange,
  onSubmitCombo,
  onAddComboGroup,
  onDuplicateComboGroup,
  onRemoveComboGroup,
  onComboGroupChange,
  onAddComboOption,
  onRemoveComboOption,
  onComboOptionChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-6xl rounded-[2.5rem] p-5 sm:p-7 shadow-2xl border border-gray-100 max-h-[94vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] font-black text-[#D4A373] uppercase tracking-[0.25em]">
              Combos
            </p>
            <h3 className="text-2xl font-black text-[#2A1E15] uppercase tracking-tighter">
              {editingComboId ? "Editar combo" : "Novo combo"}
            </h3>
            <p className="text-xs font-semibold text-[#7a6262] mt-2">
              Editor por grupos, com preço base, adicionais por opção e controle
              direto de disponibilidade.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmitCombo} className="space-y-6">
          <div className="combo-editor-shell">
            <div className="combo-editor-shell__media">
              <div className="menu-photo-dropzone">
                {comboForm.photoPreview ? (
                  <img
                    src={comboForm.photoPreview}
                    alt={comboForm.name || "Preview do combo"}
                    className="menu-photo-preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center gap-2 px-6">
                    <ImagePlus size={28} className="text-[#D4A373]" />
                    <p className="text-xs font-black text-[#2A1E15] uppercase tracking-widest">
                      Foto do combo
                    </p>
                    <p className="text-[11px] text-[#6F6258] font-semibold">
                      Use uma capa forte. Combo sem cara de produto vende pior.
                    </p>
                  </div>
                )}
              </div>
              <label className="bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md flex items-center justify-center gap-2 cursor-pointer">
                <Camera size={15} /> Selecionar foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onComboPhotoChange}
                />
              </label>
              <div className="combo-editor-shell__summary">
                <span className="combo-editor-shell__summary-label">
                  Resumo
                </span>
                <strong>{summarizeComboGroups(comboForm.comboGroups)}</strong>
                <span>
                  {comboForm.comboGroups.reduce(
                    (acc, group) => acc + group.options.length,
                    0,
                  )}{" "}
                  opção(ões) configurada(s)
                </span>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomInput
                  label="Nome do combo"
                  value={comboForm.name}
                  onChange={(e) => onComboFormChange("name", e.target.value)}
                  required
                />
                <CustomInput
                  label="Preço base"
                  type="currency"
                  step="0.01"
                  value={comboForm.basePrice}
                  onChange={(e) =>
                    onComboFormChange("basePrice", e.target.value)
                  }
                  required
                />
                <div className="space-y-1">
                  <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                    Categoria
                  </label>
                  <select
                    value={comboForm.category}
                    onChange={(e) =>
                      onComboFormChange("category", e.target.value)
                    }
                    className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
                    required
                  >
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {formatComboboxLabel(category)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                    Visibilidade
                  </label>
                  <select
                    value={comboForm.status}
                    onChange={(e) =>
                      onComboFormChange("status", e.target.value)
                    }
                    className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
                  >
                    {menuStatusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                  Descrição
                </label>
                <textarea
                  value={comboForm.description}
                  onChange={(e) =>
                    onComboFormChange("description", e.target.value)
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-[#FFFFFF] border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#D4A373] outline-none transition-all text-sm xl:text-base font-medium resize-none"
                  placeholder="Explique a lógica do combo, quantidade, proposta e percepção de valor."
                  required
                />
              </div>
            </div>
          </div>

          <div className="combo-editor-groups">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black text-[#D4A373] uppercase tracking-[0.25em]">
                  Grupos do combo
                </p>
                <h4 className="text-xl font-black text-[#2A1E15] uppercase tracking-tighter">
                  Monte a estrutura como na operação real
                </h4>
              </div>
              <button
                type="button"
                onClick={onAddComboGroup}
                className="menu-compact-action"
              >
                <Plus size={14} />
                <span>Novo grupo</span>
              </button>
            </div>

            <div className="space-y-4">
              {comboForm.comboGroups.map((group) => (
                <div key={group.id} className="combo-group-card">
                  <div className="combo-group-card__header">
                    <div className="combo-group-card__grid">
                      <CustomInput
                        label="Nome do grupo"
                        value={group.name}
                        onChange={(e) =>
                          onComboGroupChange(group.id, "name", e.target.value)
                        }
                        required
                      />
                      <CustomInput
                        label="Mínimo"
                        type="number"
                        min="0"
                        step="1"
                        value={group.minSelect}
                        onChange={(e) =>
                          onComboGroupChange(
                            group.id,
                            "minSelect",
                            e.target.value,
                          )
                        }
                        required
                      />
                      <CustomInput
                        label="Máximo"
                        type="number"
                        min="1"
                        step="1"
                        value={group.maxSelect}
                        onChange={(e) =>
                          onComboGroupChange(
                            group.id,
                            "maxSelect",
                            e.target.value,
                          )
                        }
                        required
                      />
                    </div>
                    <div className="combo-group-card__actions">
                      <span className="combo-group-card__range">
                        De {group.minSelect || 0} a {group.maxSelect || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDuplicateComboGroup(group.id)}
                        className="menu-action-button menu-action-button--edit"
                      >
                        <Copy size={14} /> Duplicar
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveComboGroup(group.id)}
                        className="menu-action-button menu-action-button--delete"
                        disabled={comboForm.comboGroups.length === 1}
                      >
                        <Trash2 size={14} /> Remover
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {group.options.map((option) => {
                      const linkedMeta = resolveLinkedComponentMeta(
                        option.linkedComponentRef,
                        catalogMetrics,
                        ingredients,
                        formatMoney,
                      );

                      return (
                        <div key={option.id} className="combo-option-row">
                          <div className="combo-option-row__main">
                            <CustomInput
                              label="Opção"
                              value={option.name}
                              onChange={(e) =>
                                onComboOptionChange(
                                  group.id,
                                  option.id,
                                  "name",
                                  e.target.value,
                                )
                              }
                              required
                            />
                            <div className="space-y-1">
                              <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                                Vínculo técnico
                              </label>
                              <select
                                value={option.linkedComponentRef}
                                onChange={(e) =>
                                  onComboOptionChange(
                                    group.id,
                                    option.id,
                                    "linkedComponentRef",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
                              >
                                <option value="">Manual / sem vínculo</option>
                                {menuComponentOptions.map((component) => (
                                  <option
                                    key={component.key}
                                    value={component.key}
                                  >
                                    {formatComboboxLabel(
                                      `${component.name} · ${component.tag}`,
                                    )}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="combo-option-row__pricing">
                            <CustomInput
                              label="Adicional"
                              type="currency"
                              min="0"
                              step="0.01"
                              value={option.extraPrice}
                              onChange={(e) =>
                                onComboOptionChange(
                                  group.id,
                                  option.id,
                                  "extraPrice",
                                  e.target.value,
                                )
                              }
                            />
                            <CustomInput
                              label="Máx."
                              type="number"
                              min="1"
                              step="1"
                              value={option.maxQty}
                              onChange={(e) =>
                                onComboOptionChange(
                                  group.id,
                                  option.id,
                                  "maxQty",
                                  e.target.value,
                                )
                              }
                            />
                            <label className="combo-option-row__toggle">
                              <span>Esgotar</span>
                              <button
                                type="button"
                                onClick={() =>
                                  onComboOptionChange(
                                    group.id,
                                    option.id,
                                    "isAvailable",
                                    !option.isAvailable,
                                  )
                                }
                                className={`combo-option-row__switch ${option.isAvailable ? "combo-option-row__switch--active" : ""}`}
                              >
                                <span className="combo-option-row__switch-knob" />
                              </button>
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                onRemoveComboOption(group.id, option.id)
                              }
                              className="menu-action-button menu-action-button--delete"
                            >
                              <Trash2 size={14} /> Excluir
                            </button>
                          </div>
                          {linkedMeta && (
                            <div className="combo-option-row__link">
                              <span className="menu-component-tag">
                                {linkedMeta.tag}
                              </span>
                              <span className="combo-option-row__link-text">
                                {linkedMeta.name}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onAddComboOption(group.id)}
                      className="menu-compact-action menu-compact-action--ghost"
                    >
                      <Plus size={14} />
                      <span>Nova opção</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#2A1E15] text-[#FFFFFF] h-12 rounded-xl font-black uppercase text-[11px] shadow-md"
          >
            {editingComboId ? "Salvar combo" : "Cadastrar combo"}
          </button>
        </form>
      </div>
    </div>
  );
};

const EmployeeRoleModal = ({ isOpen, onClose, roles, setRoles }) => {
  const [newRoleName, setNewRoleName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  if (!isOpen) return null;

  const handleAddNew = () => {
    if (!newRoleName.trim()) return;
    setRoles((prev) => [...prev, { id: Date.now(), name: newRoleName.trim() }]);
    setNewRoleName("");
  };

  const handleSaveEdit = (id) => {
    if (!editingValue.trim()) return;
    setRoles((prev) =>
      prev.map((role) =>
        role.id === id ? { ...role, name: editingValue.trim() } : role,
      ),
    );
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-6 font-sans italic">
          <h3 className="text-xl font-black text-[#2A1E15] uppercase tracking-tighter flex items-center gap-2">
            <Briefcase size={20} /> Cargos RH
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="Novo cargo..."
            className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-[#D4A373] text-sm font-bold"
          />
          <button
            onClick={handleAddNew}
            className="bg-[#2A1E15] text-white px-4 rounded-xl hover:bg-[#3A281B] transition-all flex items-center justify-center"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group border border-transparent hover:border-[#D4A373]/30"
            >
              {editingId === role.id ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="flex-1 p-1 bg-white border border-[#D4A373] rounded-md outline-none text-xs font-bold uppercase"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(role.id)}
                    className="p-1 text-green-600"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 text-gray-400"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-bold text-[#6F6258] uppercase text-xs truncate mr-2">
                    {role.name}
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingId(role.id);
                        setEditingValue(role.name);
                      }}
                      className="text-blue-600 hover:scale-110 transition-transform"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() =>
                        setRoles((prev) =>
                          prev.filter((item) => item.id !== role.id),
                        )
                      }
                      className="text-red-600 hover:scale-110 transition-transform"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PreparationManagerModal = ({
  isOpen,
  onClose,
  preparations,
  onEditPreparation,
  onDeletePreparation,
}) => {
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleDelete = async (preparationId) => {
    setDeletingId(preparationId);
    setError("");

    try {
      await onDeletePreparation(preparationId);
    } catch (apiError) {
      setError(apiError.message || "Não foi possível excluir a receita base.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6 font-sans italic shrink-0">
          <h3 className="text-xl font-black text-[#2A1E15] uppercase tracking-tighter flex items-center gap-2">
            <Briefcase size={20} /> Receitas Base
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <p className="mb-4 text-xs font-bold text-red-600 uppercase">
            {error}
          </p>
        )}

        <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {preparations.length === 0 && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs font-bold text-[#6F6258] uppercase">
              Nenhuma receita base cadastrada.
            </div>
          )}

          {preparations.map((preparation) => (
            <div
              key={preparation.id}
              className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-[#D4A373]/30"
            >
              <div className="min-w-0">
                <p className="font-black text-[#2A1E15] uppercase truncate">
                  {preparation.name}
                </p>
                <p className="text-xs text-[#6F6258] font-bold uppercase">
                  Rendimento: {preparation.yieldQuantity}{" "}
                  {preparation.yieldUnit} • {preparation.recipe?.length || 0}{" "}
                  componente(s)
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onEditPreparation(preparation)}
                  className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                  title="Editar receita base"
                >
                  <Edit size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(preparation.id)}
                  disabled={deletingId === preparation.id}
                  className="p-2 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                  title="Excluir receita base"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PreparationModal = ({
  isOpen,
  onClose,
  preparationForm,
  onPreparationFormChange,
  preparationRecipeDraft,
  onAddPreparationRecipeLine,
  onPreparationRecipeDraftChange,
  onRemovePreparationRecipeLine,
  onSubmit,
  editingPreparationId,
  ingredientUnits,
  ingredients,
  preparations,
  isSaving = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 font-sans italic shrink-0">
          <h3 className="text-xl font-black text-[#2A1E15] uppercase tracking-tighter flex items-center gap-2">
            <Briefcase size={20} />{" "}
            {editingPreparationId
              ? "Editar Receita Base"
              : "Registrar Receita Base"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <CustomInput
                label="Nome da Receita Base"
                value={preparationForm.name}
                onChange={(e) =>
                  onPreparationFormChange("name", e.target.value)
                }
                required
              />
              <CustomInput
                label="Rendimento da Receita"
                type="number"
                step="0.01"
                value={preparationForm.yieldQuantity}
                onChange={(e) =>
                  onPreparationFormChange("yieldQuantity", e.target.value)
                }
                required
              />
              <div className="space-y-1">
                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                  Unidade do Rendimento
                </label>
                <SearchableSelect
                  value={resolveUnitValue(
                    ingredientUnits,
                    preparationForm.yieldUnit,
                  )}
                  onChange={(val) => onPreparationFormChange("yieldUnit", val)}
                  options={ingredientUnits.map((unit) => ({
                    value: unit.label,
                    label: formatComboboxLabel(unit.label),
                  }))}
                  placeholder="Selecione"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-black text-[#2A1E15] uppercase">
                  Composição da Receita
                </p>
                <button
                  type="button"
                  onClick={onAddPreparationRecipeLine}
                  className="text-[10px] font-black text-[#D4A373] border border-[#D4A373] px-3 py-2 rounded-full uppercase hover:bg-[#C58F5E] hover:text-[#2B2520] transition-all w-full sm:w-auto"
                >
                  Adicionar Item
                </button>
              </div>

              <div className="space-y-3">
                {preparationRecipeDraft.map((line, index) => {
                  const baseUnit = getComponentBaseUnit(
                    line.componentRef,
                    ingredients,
                    preparations,
                  );
                  const compatibleUnits = getCompatibleUnits(
                    baseUnit,
                    ingredientUnits,
                  );

                  return (
                    <div
                      key={line.id}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_130px_110px_48px] gap-3 items-end"
                    >
                      <div className="space-y-1">
                        <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                          Componente {index + 1}
                        </label>
                        <SearchableSelect
                          value={line.componentRef}
                          onChange={(val) =>
                            onPreparationRecipeDraftChange(
                              line.id,
                              "componentRef",
                              val,
                            )
                          }
                          options={[
                            {
                              label: "Insumos",
                              options: ingredients.map((ingredient) => ({
                                value: `ingredient:${ingredient.id}`,
                                label: formatComboboxLabel(ingredient.name),
                              })),
                            },
                            {
                              label: "Receitas Base",
                              options: preparations.map((preparation) => ({
                                value: `preparation:${preparation.id}`,
                                label: formatComboboxLabel(preparation.name),
                              })),
                            },
                          ]}
                          placeholder="Selecione"
                        />
                      </div>

                      <CustomInput
                        label="Quantidade"
                        type="number"
                        step="0.01"
                        value={line.quantity}
                        onChange={(e) =>
                          onPreparationRecipeDraftChange(
                            line.id,
                            "quantity",
                            e.target.value,
                          )
                        }
                        required
                      />

                      <div className="space-y-1">
                        <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                          Unidade
                        </label>
                        <SearchableSelect
                          value={resolveCompatibleUnitValue(
                            ingredientUnits,
                            baseUnit,
                            line.quantityUnit,
                          )}
                          onChange={(val) =>
                            onPreparationRecipeDraftChange(
                              line.id,
                              "quantityUnit",
                              val,
                            )
                          }
                          options={compatibleUnits.map((unit) => ({
                            value: unit.label,
                            label: formatComboboxLabel(unit.label),
                          }))}
                          disabled={!line.componentRef}
                          placeholder="Selecione"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemovePreparationRecipeLine(line.id)}
                        disabled={preparationRecipeDraft.length === 1}
                        className={`h-11 rounded-xl transition-colors ${preparationRecipeDraft.length === 1 ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-red-50 text-red-500 hover:bg-red-100"}`}
                      >
                        <Trash2 size={16} className="mx-auto" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 border-t border-gray-100 bg-white shrink-0">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving
                ? "Salvando..."
                : editingPreparationId
                  ? "Atualizar Receita Base"
                  : "Salvar Receita Base"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const IngredientModal = ({
  isOpen,
  onClose,
  ingredientForm,
  onIngredientFormChange,
  onSubmit,
  ingredientUnits,
  isSaving = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 font-sans italic shrink-0">
          <h3 className="text-xl font-black text-[#2A1E15] uppercase tracking-tighter flex items-center gap-2">
            <Receipt size={20} /> Editar Insumo
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomInput
                label="Nome do Insumo"
                value={ingredientForm.name}
                onChange={(e) => onIngredientFormChange("name", e.target.value)}
                required
              />
              <div className="space-y-1">
                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                  Unidade
                </label>
                <SearchableSelect
                  value={resolveUnitValue(ingredientUnits, ingredientForm.unit)}
                  onChange={(val) => onIngredientFormChange("unit", val)}
                  options={ingredientUnits.map((unit) => ({
                    value: unit.label,
                    label: formatComboboxLabel(unit.label),
                  }))}
                  placeholder="Selecione"
                />
              </div>
              <CustomInput
                label={`Custo por ${getIngredientCostReferenceUnit(ingredientForm.unit)}`}
                type="currency"
                step="0.01"
                value={ingredientForm.unitCost}
                onChange={(e) =>
                  onIngredientFormChange("unitCost", e.target.value)
                }
                required
              />
            </div>
          </div>

          <div className="p-5 sm:p-6 border-t border-gray-100 bg-white shrink-0">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Salvando..." : "Salvar Insumo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProductModal = ({
  isOpen,
  onClose,
  productForm,
  onProductFormChange,
  productRecipeDraft,
  onAddRecipeLine,
  onRecipeDraftChange,
  onRemoveRecipeLine,
  onSubmit,
  ingredientUnits,
  ingredients,
  preparations,
  isSaving = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 font-sans italic shrink-0">
          <h3 className="text-xl font-black text-[#2A1E15] uppercase tracking-tighter flex items-center gap-2">
            <ShoppingBag size={20} /> Editar Produto
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomInput
                label="Produto"
                value={productForm.name}
                onChange={(e) => onProductFormChange("name", e.target.value)}
                required
              />
              <CustomInput
                label="Preço de Venda"
                type="currency"
                step="0.01"
                value={productForm.salePrice}
                onChange={(e) =>
                  onProductFormChange("salePrice", e.target.value)
                }
                required
              />
              <CustomInput
                label="Rendimento"
                type="number"
                step="0.01"
                value={productForm.yieldQuantity}
                onChange={(e) =>
                  onProductFormChange("yieldQuantity", e.target.value)
                }
                required
              />
              <CustomInput
                label="CMV Alvo (%)"
                type="number"
                step="0.1"
                value={productForm.targetCmvPercent}
                onChange={(e) =>
                  onProductFormChange("targetCmvPercent", e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-black text-[#2A1E15] uppercase">
                  Receita / Componentes
                </p>
                <button
                  type="button"
                  onClick={onAddRecipeLine}
                  className="text-[10px] font-black text-[#D4A373] border border-[#D4A373] px-3 py-2 rounded-full uppercase hover:bg-[#C58F5E] hover:text-[#2B2520] transition-all w-full sm:w-auto"
                >
                  Adicionar Componente
                </button>
              </div>

              <div className="space-y-3">
                {productRecipeDraft.map((line, index) => {
                  const baseUnit = getComponentBaseUnit(
                    line.componentRef,
                    ingredients,
                    preparations,
                  );
                  const compatibleUnits = getCompatibleUnits(
                    baseUnit,
                    ingredientUnits,
                  );

                  return (
                    <div
                      key={line.id}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_130px_110px_48px] gap-3 items-end"
                    >
                      <div className="space-y-1">
                        <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                          Componente {index + 1}
                        </label>
                        <SearchableSelect
                          value={line.componentRef}
                          onChange={(val) =>
                            onRecipeDraftChange(line.id, "componentRef", val)
                          }
                          options={[
                            {
                              label: "Insumos",
                              options: ingredients.map((ingredient) => ({
                                value: `ingredient:${ingredient.id}`,
                                label: formatComboboxLabel(ingredient.name),
                              })),
                            },
                            {
                              label: "Receitas Base",
                              options: preparations.map((preparation) => ({
                                value: `preparation:${preparation.id}`,
                                label: formatComboboxLabel(preparation.name),
                              })),
                            },
                          ]}
                          placeholder="Selecione"
                        />
                      </div>

                      <CustomInput
                        label="Quantidade"
                        type="number"
                        step="0.01"
                        value={line.quantity}
                        onChange={(e) =>
                          onRecipeDraftChange(
                            line.id,
                            "quantity",
                            e.target.value,
                          )
                        }
                        required
                      />

                      <div className="space-y-1">
                        <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                          Unidade
                        </label>
                        <SearchableSelect
                          value={resolveCompatibleUnitValue(
                            ingredientUnits,
                            baseUnit,
                            line.quantityUnit,
                          )}
                          onChange={(val) =>
                            onRecipeDraftChange(line.id, "quantityUnit", val)
                          }
                          options={compatibleUnits.map((unit) => ({
                            value: unit.label,
                            label: formatComboboxLabel(unit.label),
                          }))}
                          disabled={!line.componentRef}
                          placeholder="Selecione"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveRecipeLine(line.id)}
                        disabled={productRecipeDraft.length === 1}
                        className={`h-11 rounded-xl transition-colors ${productRecipeDraft.length === 1 ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-red-50 text-red-500 hover:bg-red-100"}`}
                      >
                        <Trash2 size={16} className="mx-auto" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 border-t border-gray-100 bg-white shrink-0">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Salvando..." : "Salvar Produto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SimpleOptionsModal = ({
  isOpen,
  onClose,
  title,
  options,
  setOptions,
}) => {
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newValue.trim()) return;
    setOptions((prev) => [...prev, { id: Date.now(), name: newValue.trim() }]);
    setNewValue("");
  };

  const handleSave = (id) => {
    if (!editingValue.trim()) return;
    setOptions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, name: editingValue.trim() } : item,
      ),
    );
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-6 font-sans italic">
          <h3 className="text-xl font-black text-[#2A1E15] uppercase tracking-tighter">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Novo item..."
            className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-[#D4A373] text-sm font-bold"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="bg-[#2A1E15] text-white px-4 rounded-xl hover:bg-[#3A281B] transition-all flex items-center justify-center"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
          {options.map((option) => (
            <div
              key={option.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-transparent hover:border-[#D4A373]/30"
            >
              {editingId === option.id ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="flex-1 p-1 bg-white border border-[#D4A373] rounded-md outline-none text-xs font-bold uppercase"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleSave(option.id)}
                    className="p-1 text-green-600"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="p-1 text-gray-400"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-bold text-[#6F6258] uppercase text-xs truncate mr-2">
                    {option.name}
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(option.id);
                        setEditingValue(option.name);
                      }}
                      className="text-blue-600 hover:scale-110 transition-transform"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setOptions((prev) =>
                          prev.filter((item) => item.id !== option.id),
                        )
                      }
                      className="text-red-600 hover:scale-110 transition-transform"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PayrollAdjustmentsModal = ({
  isOpen,
  onClose,
  employee,
  competenceMonth,
  onCompetenceChange,
  statement,
  adjustments,
  draft,
  onDraftChange,
  onAddAdjustment,
  onCancelAdjustment,
  isSaving = false,
  error = "",
}) => {
  const [cancelling, setCancelling] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  if (!isOpen || !employee) return null;

  const activeAdjustments = (adjustments || []).filter(
    (item) => item.status !== "CANCELLED",
  );
  const cancelledAdjustments = (adjustments || []).filter(
    (item) => item.status === "CANCELLED",
  );
  const categoryOptions = [
    { value: "EXTRA_ADVANCE", label: "Adiantamento extra" },
    { value: "STORE_PURCHASE", label: "Compra na loja" },
    { value: "ALLOWANCE", label: "Vale" },
    { value: "OTHER", label: "Outro" },
  ];

  const confirmCancellation = async () => {
    if (!cancelling || !cancellationReason.trim()) return;
    await onCancelAdjustment(cancelling, cancellationReason.trim());
    setCancelling(null);
    setCancellationReason("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-xl font-black text-[#2A1E15] uppercase tracking-tighter">
              Ajustes / Descontos
            </h3>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
              {employee.name} | {employee.role} | competência {competenceMonth}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div className="grid gap-3 rounded-2xl border border-stone-200 bg-[#FFF8EC] p-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-xs font-black uppercase text-[#6F6258]">
              Salário
              <strong className="mt-1 block text-sm text-[#2A1E15]">
                {formatMoney(statement?.salary || employee.salary)}
              </strong>
            </label>
            <label className="text-xs font-black uppercase text-[#6F6258]">
              Primeiro pagamento {statement?.advancePercentage || employee.firstPaymentPercentage || 40}%
              <strong className="mt-1 block text-sm text-[#2A1E15]">
                {formatMoney(statement?.advanceAmount)}
              </strong>
            </label>
            <label className="text-xs font-black uppercase text-[#6F6258]">
              Pagamento final {statement?.salaryPercentage || employee.finalPaymentPercentage || 60}%
              <strong className="mt-1 block text-sm text-[#2A1E15]">
                {formatMoney(statement?.baseSalaryPayment)}
              </strong>
            </label>
            <label className="text-xs font-black uppercase text-[#6F6258]">
              Total de descontos
              <strong className="mt-1 block text-sm text-red-700">
                {formatMoney(statement?.totalDiscounts)}
              </strong>
            </label>
            <label className="text-xs font-black uppercase text-[#6F6258]">
              Líquido final
              <strong className="mt-1 block text-sm text-green-800">
                {formatMoney(statement?.finalSalaryPayment)}
              </strong>
            </label>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-black uppercase text-red-800">
              Faltas da competência: {statement?.absenceCount || 0}
            </p>
            <div className="mt-2 space-y-1 text-xs font-bold text-red-900">
              {(statement?.absences || []).map((absence) => (
                <p key={absence.date}>
                  {formatDateBr(absence.date)} — Falta —{" "}
                  {formatMoney(absence.amount)}
                </p>
              ))}
              {!statement?.absenceCount && <p>Nenhuma falta calculada.</p>}
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              onAddAdjustment();
            }}
            className="bg-stone-50 rounded-2xl p-4 border border-stone-200"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1 text-xs font-black uppercase text-[#6F6258]">
                Competência
                <input
                  type="month"
                  value={competenceMonth}
                  onChange={(event) => onCompetenceChange(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold"
                />
              </label>
              <p className="text-xs font-bold text-[#6F6258] sm:pb-2">
                O ajuste reduz somente a parcela final e não cria outra despesa
                no DRE.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-end">
              <label className="space-y-1 text-xs font-black uppercase text-[#6F6258]">
                Data
                <input
                  required
                  type="date"
                  value={draft?.adjustmentDate || ""}
                  onChange={(event) =>
                    onDraftChange("adjustmentDate", event.target.value)
                  }
                  className="block h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-bold"
                />
              </label>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-[#6F6258] tracking-widest">
                  Categoria
                </label>
                <SearchableSelect
                  value={draft?.category || "OTHER"}
                  onChange={(val) => onDraftChange("category", val)}
                  options={categoryOptions}
                  placeholder="Selecione"
                />
              </div>
              <label className="space-y-1 text-xs font-black uppercase text-[#6F6258]">
                Descrição
                <input
                  required
                  value={draft?.description || ""}
                  onChange={(event) =>
                    onDraftChange("description", event.target.value)
                  }
                  className="block h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-bold normal-case"
                  placeholder="Ex.: compra de produtos"
                />
              </label>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-[#6F6258] tracking-widest">
                  Valor
                </label>
                <CustomInput
                  type="currency"
                  step="0.01"
                  value={draft?.amount || ""}
                  onChange={(e) => onDraftChange("amount", e.target.value)}
                />
              </div>
              <label className="space-y-1 text-xs font-black uppercase text-[#6F6258]">
                Observação
                <input
                  value={draft?.note || ""}
                  onChange={(event) =>
                    onDraftChange("note", event.target.value)
                  }
                  className="block h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-bold normal-case"
                />
              </label>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#2A1E15] text-[#FFFFFF] h-11 px-4 rounded-xl font-black uppercase text-xs shadow-md"
              >
                {isSaving ? "Salvando..." : "Adicionar ajuste"}
              </button>
            </div>
          </form>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800"
            >
              {error}
            </p>
          )}

          <div className="space-y-2">
            <p className="text-xs font-black uppercase text-[#6F6258]">
              Ajustes ativos
            </p>
            {activeAdjustments.length === 0 && (
              <p className="text-xs font-bold uppercase text-gray-400 tracking-widest">
                Sem ajustes lançados nesta competência.
              </p>
            )}
            {activeAdjustments.map((adjustment) => (
              <div
                key={adjustment.id}
                className="bg-white rounded-xl border border-stone-200 p-3 flex gap-3 items-center justify-between"
              >
                <div>
                  <p className="text-sm font-black text-[#2A1E15]">
                    {adjustment.categoryLabel} — {adjustment.description}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#6F6258]">
                    {formatDateBr(adjustment.adjustmentDate)} ·{" "}
                    {formatMoney(adjustment.amount)}
                    {adjustment.note ? ` · ${adjustment.note}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCancelling(adjustment);
                    setCancellationReason("");
                  }}
                  className="text-red-400 hover:text-red-600"
                  aria-label={`Cancelar ajuste ${adjustment.description}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {cancelledAdjustments.length > 0 && (
            <details className="rounded-2xl border border-stone-200 p-4">
              <summary className="cursor-pointer text-xs font-black uppercase text-[#6F6258]">
                Histórico cancelado ({cancelledAdjustments.length})
              </summary>
              <div className="mt-3 space-y-2">
                {cancelledAdjustments.map((adjustment) => (
                  <div
                    key={adjustment.id}
                    className="rounded-xl bg-stone-100 p-3 text-xs text-[#6F6258]"
                  >
                    <strong>
                      {adjustment.categoryLabel} — {adjustment.description} —{" "}
                      {formatMoney(adjustment.amount)}
                    </strong>
                    <p>
                      {formatDateBr(adjustment.adjustmentDate)} · Cancelado:{" "}
                      {adjustment.cancellationReason}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        <div className="p-5 sm:p-6 border-t border-gray-100 bg-white shrink-0 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-stone-100 text-[#2A1E15] h-11 rounded-xl font-black uppercase text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
      {cancelling && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h4 className="text-lg font-black text-[#2A1E15]">
              Cancelar ajuste
            </h4>
            <p className="mt-2 text-sm font-bold text-[#6F6258]">
              O registro será preservado no histórico e deixará de descontar a
              folha.
            </p>
            <label className="mt-4 block text-xs font-black uppercase text-[#6F6258]">
              Motivo
              <input
                autoFocus
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 p-3 text-sm font-bold normal-case"
              />
            </label>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setCancelling(null)}
                className="flex-1 rounded-xl bg-stone-100 p-3 text-xs font-black uppercase"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!cancellationReason.trim() || isSaving}
                onClick={confirmCancellation}
                className="flex-1 rounded-xl bg-red-700 p-3 text-xs font-black uppercase text-white disabled:opacity-50"
              >
                Confirmar cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EmployeeModal = ({
  isOpen,
  onClose,
  onSubmit,
  employeeRoles,
  employee,
  setEmployee,
  isEditing,
  isSaving = false,
  error = "",
}) => {
  if (!isOpen) return null;

  const isFixed = employee.employmentType === "fixed";
  const dailyRateTypes = Array.isArray(employee.dailyRateTypes)
    ? employee.dailyRateTypes
    : [];
  const scheduledDaysOff = Array.isArray(employee.scheduledDaysOff)
    ? employee.scheduledDaysOff
    : [];
  const normalizedRole = String(employee.role || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const isManagement = normalizedRole.startsWith("geren");
  const addSpecificDayOff = () => {
    if (
      !employee.newDayOffDate ||
      scheduledDaysOff.some(
        (item) =>
          item.kind === "DATE" &&
          item.offDate === employee.newDayOffDate &&
          item.active !== false,
      )
    )
      return;
    setEmployee((previous) => ({
      ...previous,
      scheduledDaysOff: [
        ...(previous.scheduledDaysOff || []),
        {
          clientKey: `day-off-${Date.now()}`,
          kind: "DATE",
          weekday: null,
          offDate: previous.newDayOffDate,
          note: "",
          active: true,
        },
      ],
      newDayOffDate: "",
    }));
  };
  const addDailyRateType = () =>
    setEmployee((previous) => ({
      ...previous,
      dailyRateTypes: [
        ...(previous.dailyRateTypes || []),
        {
          clientKey: `daily-rate-${Date.now()}`,
          name: "",
          amount: "",
          appliesWeekdays: true,
          appliesWeekends: true,
          active: true,
        },
      ],
    }));
  const updateDailyRateType = (index, field, value) =>
    setEmployee((previous) => ({
      ...previous,
      dailyRateTypes: (previous.dailyRateTypes || []).map(
        (type, currentIndex) =>
          currentIndex === index ? { ...type, [field]: value } : type,
      ),
    }));
  const removeDailyRateType = (index) =>
    setEmployee((previous) => ({
      ...previous,
      dailyRateTypes: (previous.dailyRateTypes || []).filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 shrink-0">
          <h3 className="text-xl font-black text-[#2A1E15] uppercase tracking-tighter">
            {isEditing ? "Editar Funcionário" : "Cadastrar Funcionário"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {error && (
              <p
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800"
              >
                {error}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <CustomInput
                label="Nome Completo"
                value={employee.name}
                onChange={(e) =>
                  setEmployee((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
              <CustomInput
                label="Telefone"
                value={employee.phone}
                onChange={(e) =>
                  setEmployee((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
              <CustomInput
                label="E-mail"
                type="email"
                value={employee.email}
                onChange={(e) =>
                  setEmployee((prev) => ({ ...prev, email: e.target.value }))
                }
              />
              <CustomInput
                label="Estado Civil"
                value={employee.maritalStatus}
                onChange={(e) =>
                  setEmployee((prev) => ({
                    ...prev,
                    maritalStatus: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <CustomInput
                label="Endereço"
                value={employee.address}
                onChange={(e) =>
                  setEmployee((prev) => ({ ...prev, address: e.target.value }))
                }
              />
              <div className="space-y-1">
                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                  Tipo de Vínculo
                </label>
                <SearchableSelect
                  value={employee.employmentType}
                  onChange={(val) =>
                    setEmployee((prev) => ({
                      ...prev,
                      employmentType: val,
                      dailyRateTypes:
                        val === "external" &&
                        !(prev.dailyRateTypes || []).length
                          ? [
                              {
                                clientKey: `daily-rate-${Date.now()}`,
                                name: "Diária padrão",
                                amount: "",
                                appliesWeekdays: true,
                                appliesWeekends: true,
                                active: true,
                              },
                            ]
                          : prev.dailyRateTypes || [],
                    }))
                  }
                  options={[
                    { value: "fixed", label: "Fixo" },
                    { value: "external", label: "Por Fora" },
                  ]}
                  placeholder="Selecione"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                  Status
                </label>
                <SearchableSelect
                  value={employee.status}
                  onChange={(val) =>
                    setEmployee((prev) => ({ ...prev, status: val }))
                  }
                  options={[
                    { value: "active", label: "Ativo" },
                    { value: "inactive", label: "Inativo" },
                  ]}
                  placeholder="Selecione"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                  Cargo / Função
                </label>
                <SearchableSelect
                  value={employee.role}
                  onChange={(val) =>
                    setEmployee((prev) => ({
                      ...prev,
                      role: val,
                      ...(String(val)
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase()
                        .startsWith("geren")
                        ? {
                            controlAttendance: false,
                            attendanceControlFrom: "",
                            weeklyDayOff: "",
                            monthlySundayOffOrdinal: "",
                          }
                        : {}),
                    }))
                  }
                  options={employeeRoles.map((role) => ({
                    value: role.name,
                    label: role.name,
                  }))}
                  placeholder="Selecione"
                />
              </div>
              {isFixed ? (
                <>
                  <CustomInput
                    label="Salário"
                    type="currency"
                    step="0.01"
                    value={employee.salary}
                    onChange={(e) =>
                      setEmployee((prev) => ({
                        ...prev,
                        salary: e.target.value,
                      }))
                    }
                    required
                  />
                  <CustomInput
                    label="Admissão"
                    type="date"
                    value={employee.admissionDate}
                    onChange={(e) =>
                      setEmployee((prev) => ({
                        ...prev,
                        admissionDate: e.target.value,
                      }))
                    }
                  />
                  <CustomInput
                    label="Observações"
                    value={employee.notes}
                    onChange={(e) =>
                      setEmployee((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                  />
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                      Tipo de Pagamento
                    </label>
                    <SearchableSelect
                      value={employee.paymentMode}
                      onChange={(val) =>
                        setEmployee((prev) => ({ ...prev, paymentMode: val }))
                      }
                      options={[
                        { value: "weekly", label: "Semanal" },
                        { value: "one_off", label: "Avulso" },
                      ]}
                      placeholder="Selecione"
                    />
                  </div>
                  {employee.paymentMode === "weekly" ? (
                    <div className="space-y-1">
                      <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                        Dia da Semana
                      </label>
                      <SearchableSelect
                        value={employee.weekday}
                        onChange={(val) =>
                          setEmployee((prev) => ({ ...prev, weekday: val }))
                        }
                        options={[
                          { value: "1", label: "Segunda" },
                          { value: "2", label: "Terça" },
                          { value: "3", label: "Quarta" },
                          { value: "4", label: "Quinta" },
                          { value: "5", label: "Sexta" },
                        ]}
                        placeholder="Selecione"
                      />
                    </div>
                  ) : (
                    <CustomInput
                      label="Data do Pagamento"
                      type="date"
                      value={employee.specificDate}
                      onChange={(e) =>
                        setEmployee((prev) => ({
                          ...prev,
                          specificDate: e.target.value,
                        }))
                      }
                    />
                  )}
                </>
              )}
            </div>

            {isFixed && (
              <section className="rounded-2xl border border-[#D4A373]/35 bg-white p-4 sm:p-5">
                <h4 className="text-sm font-black uppercase text-[#2A1E15]">
                  Regra de pagamento individual
                </h4>
                <p className="mt-1 text-xs font-bold text-[#6F6258]">
                  Preenchida com o padrão da empresa. As duas parcelas devem
                  totalizar 100%.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <CustomInput
                    label="Primeiro pagamento (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={employee.firstPaymentPercentage ?? ""}
                    onChange={(event) =>
                      setEmployee((previous) => ({
                        ...previous,
                        firstPaymentPercentage: event.target.value,
                      }))
                    }
                    required
                  />
                  <CustomInput
                    label="Pagamento final (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={employee.finalPaymentPercentage ?? ""}
                    onChange={(event) =>
                      setEmployee((previous) => ({
                        ...previous,
                        finalPaymentPercentage: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <p className={`mt-3 text-xs font-black ${Math.abs(Number(employee.firstPaymentPercentage || 0) + Number(employee.finalPaymentPercentage || 0) - 100) < 0.001 ? "text-green-700" : "text-red-700"}`}>
                  Total: {Number(employee.firstPaymentPercentage || 0) + Number(employee.finalPaymentPercentage || 0)}%
                </p>
              </section>
            )}

            {isFixed && (
              <section className="rounded-2xl border border-[#D4A373]/35 bg-[#FFF8EC] p-4 sm:p-5">
                <h4 className="text-sm font-black uppercase text-[#2A1E15]">
                  Presença, faltas e folgas
                </h4>
                <label className="mt-4 flex items-center gap-3 text-xs font-black uppercase text-[#2A1E15]">
                  <input
                    type="checkbox"
                    disabled
                    checked={!isManagement}
                    onChange={() => {}}
                    className="h-5 w-5 accent-[#8A5A2B]"
                  />
                  Controlar presença/faltas
                </label>
                <p className="mt-1 text-xs font-bold text-[#6F6258]">
                  {isManagement
                    ? "Gerência possui jornada flexível: folgas e faltas automáticas ficam desativadas."
                    : "Obrigatório para os demais funcionários fixos. A escala define folgas e faltas automáticas."}
                </p>
                {!isManagement && (
                  <div className="mt-4 space-y-4">
                    <CustomInput
                      label="Controlar faltas a partir de"
                      type="date"
                      value={employee.attendanceControlFrom || ""}
                      onChange={(event) =>
                        setEmployee((previous) => ({
                          ...previous,
                          attendanceControlFrom: event.target.value,
                        }))
                      }
                      required
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="ml-1 text-[11px] font-black uppercase tracking-wider text-[#6F6258]">
                          Dia da folga semanal
                        </label>
                        <SearchableSelect
                          value={String(employee.weeklyDayOff ?? "")}
                          onChange={(value) =>
                            setEmployee((previous) => ({
                              ...previous,
                              weeklyDayOff: value,
                            }))
                          }
                          options={[
                            { value: "1", label: "Segunda-feira" },
                            { value: "2", label: "Terça-feira" },
                            { value: "3", label: "Quarta-feira" },
                            { value: "4", label: "Quinta-feira" },
                            { value: "5", label: "Sexta-feira" },
                            { value: "6", label: "Sábado" },
                            { value: "0", label: "Domingo" },
                          ]}
                          placeholder="Selecione"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="ml-1 text-[11px] font-black uppercase tracking-wider text-[#6F6258]">
                          Domingo de folga no mês
                        </label>
                        <SearchableSelect
                          value={String(employee.monthlySundayOffOrdinal ?? "")}
                          onChange={(value) =>
                            setEmployee((previous) => ({
                              ...previous,
                              monthlySundayOffOrdinal: value,
                            }))
                          }
                          options={[1, 2, 3, 4, 5].map((ordinal) => ({
                            value: String(ordinal),
                            label: `${ordinal}º domingo do mês`,
                          }))}
                          placeholder="Selecione"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#6F6258]">
                        Folgas específicas adicionais
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#6F6258]">
                        Use somente para datas excepcionais além da folga
                        semanal e do domingo mensal.
                      </p>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <input
                          aria-label="Data da folga específica"
                          type="date"
                          value={employee.newDayOffDate || ""}
                          onChange={(event) =>
                            setEmployee((previous) => ({
                              ...previous,
                              newDayOffDate: event.target.value,
                            }))
                          }
                          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold"
                        />
                        <button
                          type="button"
                          onClick={addSpecificDayOff}
                          className="rounded-xl bg-[#2A1E15] px-4 py-2 text-xs font-black uppercase text-white"
                        >
                          Adicionar folga
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {scheduledDaysOff
                          .filter(
                            (item) =>
                              item.kind === "DATE" && item.active !== false,
                          )
                          .map((item) => (
                            <span
                              key={item.id || item.clientKey}
                              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-[#2A1E15]"
                            >
                              {formatDateBr(item.offDate)}
                              <button
                                type="button"
                                onClick={() =>
                                  setEmployee((previous) => ({
                                    ...previous,
                                    scheduledDaysOff: (
                                      previous.scheduledDaysOff || []
                                    ).filter((current) => current !== item),
                                  }))
                                }
                                className="text-red-600"
                                aria-label={`Remover folga de ${formatDateBr(item.offDate)}`}
                              >
                                <X size={13} />
                              </button>
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {!isFixed && (
              <>
                <section className="rounded-2xl border border-[#D4A373]/35 bg-[#FFF8EC] p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-sm font-black uppercase text-[#2A1E15]">
                        Tipos de Diária
                      </h4>
                      <p className="mt-1 text-xs font-bold text-[#6F6258]">
                        Cadastre cada turno ou regra de valor. Mais de um tipo
                        pode ser marcado no mesmo dia.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addDailyRateType}
                      className="rounded-xl bg-[#2A1E15] px-4 py-2 text-[10px] font-black uppercase text-white"
                    >
                      Adicionar tipo
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {dailyRateTypes.map((type, index) => (
                      <div
                        key={type.id || type.clientKey || index}
                        className="grid grid-cols-1 gap-3 rounded-xl border border-stone-200 bg-white p-3 md:grid-cols-[minmax(180px,1fr)_150px_auto_auto_auto] md:items-end"
                      >
                        <CustomInput
                          label="Nome do tipo"
                          value={type.name || ""}
                          onChange={(event) =>
                            updateDailyRateType(
                              index,
                              "name",
                              event.target.value,
                            )
                          }
                          placeholder="Ex.: Diária Noite"
                          required
                        />
                        <CustomInput
                          label="Valor"
                          type="currency"
                          step="0.01"
                          value={type.amount ?? ""}
                          onChange={(event) =>
                            updateDailyRateType(
                              index,
                              "amount",
                              event.target.value,
                            )
                          }
                          required
                        />
                        <label className="flex items-center gap-2 pb-3 text-[10px] font-black uppercase text-[#6F6258]">
                          <input
                            type="checkbox"
                            checked={type.appliesWeekdays !== false}
                            onChange={(event) =>
                              updateDailyRateType(
                                index,
                                "appliesWeekdays",
                                event.target.checked,
                              )
                            }
                            className="h-4 w-4 accent-[#8A5A2B]"
                          />{" "}
                          Seg–Sex
                        </label>
                        <label className="flex items-center gap-2 pb-3 text-[10px] font-black uppercase text-[#6F6258]">
                          <input
                            type="checkbox"
                            checked={type.appliesWeekends !== false}
                            onChange={(event) =>
                              updateDailyRateType(
                                index,
                                "appliesWeekends",
                                event.target.checked,
                              )
                            }
                            className="h-4 w-4 accent-[#8A5A2B]"
                          />{" "}
                          Sáb–Dom
                        </label>
                        <button
                          type="button"
                          onClick={() => removeDailyRateType(index)}
                          className="mb-1 rounded-lg p-2 text-red-600 hover:bg-red-50"
                          aria-label={`Remover ${type.name || "Tipo de Diária"}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))}
                    {!dailyRateTypes.length && (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-black text-amber-900">
                        Adicione ao menos um Tipo de Diária.
                      </p>
                    )}
                  </div>
                </section>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomInput
                    label="Data de Início"
                    type="date"
                    value={employee.startDate}
                    onChange={(e) =>
                      setEmployee((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                  <CustomInput
                    label="Observações"
                    value={employee.notes}
                    onChange={(e) =>
                      setEmployee((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                  />
                </div>
              </>
            )}
          </div>

          <div className="p-5 sm:p-6 border-t border-gray-100 bg-white shrink-0">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving
                ? "Salvando..."
                : isEditing
                  ? "Salvar Funcionário"
                  : "Cadastrar Funcionário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteEmployeeModal = ({
  employee,
  isSaving,
  error,
  onClose,
  onConfirm,
}) => {
  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#2A1E15]/55 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-[#D4A373]/30 bg-white shadow-2xl">
        <div className="p-6 sm:p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Trash2 size={25} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight text-[#2A1E15]">
            Retirar da folha?
          </h3>
          <p className="mt-3 text-sm font-bold leading-relaxed text-[#6F6258]">
            <strong className="text-[#2A1E15]">{employee.name}</strong> sairá da
            folha ativa, mas o cadastro, jornadas e pagamentos permanecerão no
            histórico.
          </p>
          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-black text-red-700"
            >
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-stone-100 bg-[#FFF8EC] p-5 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-stone-200 px-4 py-3 text-xs font-black uppercase text-[#2A1E15] transition-colors hover:bg-stone-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-xs font-black uppercase text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isSaving ? "Retirando..." : "Retirar da folha"}
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteMenuCategoryModal = ({
  category,
  itemCount,
  isSaving,
  onClose,
  onConfirm,
}) => {
  if (!category) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#2A1E15]/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-menu-category-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-[#D4A373]/30 bg-white shadow-2xl">
        <div className="p-6 sm:p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Trash2 size={25} />
          </div>
          <h3
            id="delete-menu-category-title"
            className="text-xl font-black uppercase tracking-tight text-[#2A1E15]"
          >
            Excluir categoria?
          </h3>
          <p className="mt-3 text-sm font-bold leading-relaxed text-[#6F6258]">
            A categoria{" "}
            <strong className="text-[#2A1E15]">{category.name}</strong> será
            excluída.
            {itemCount > 0
              ? ` Os ${itemCount} item(ns) vinculados continuarão cadastrados, mas ficarão sem categoria.`
              : " Ela não possui itens vinculados."}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-stone-100 bg-[#FFF8EC] p-5 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-stone-200 px-4 py-3 text-xs font-black uppercase text-[#2A1E15] transition-colors hover:bg-stone-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-xs font-black uppercase text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isSaving ? "Excluindo..." : "Excluir e manter itens"}
          </button>
        </div>
      </div>
    </div>
  );
};

const formatMoney = (value) => `R$ ${Number(value || 0).toFixed(2)}`;

const formatDateBr = (value) => {
  const date =
    value instanceof Date
      ? value
      : /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))
        ? new Date(`${value}T00:00:00`)
        : new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("pt-BR");
};

const enrichObligationsWithFixedPayroll = (
  obligations = [],
  statements = [],
  competenceMonth = "",
) => {
  const byEmployee = new Map(
    statements.map((statement) => [String(statement.employeeId), statement]),
  );
  return obligations.map((obligation) => {
    if (
      obligation.economicCategory !== "FOLHA_FIXA" ||
      obligation.competenceMonth !== competenceMonth ||
      (obligation.payrollDetail?.salary != null &&
        obligation.payrollDetail?.installment)
    )
      return obligation;
    const statement = byEmployee.get(String(obligation.employeeId));
    if (!statement) return obligation;
    const installment =
      String(obligation.sourceId || "").endsWith(":ADVANCE") ||
      /adiantamento/i.test(obligation.description || "")
        ? "ADVANCE"
        : "SALARY";
    return {
      ...obligation,
      payrollDetail: { ...statement, installment },
    };
  });
};

const normalizeDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const parseIsoDate = (value) => {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
};

const toIsoDate = (date) => {
  const normalized = normalizeDate(date);
  if (!normalized) return "";
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, "0");
  const day = String(normalized.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const EmployeePaymentHistoryModal = ({ employee, closings, onClose }) => {
  useEffect(() => {
    if (!employee) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [employee, onClose]);

  if (!employee) return null;

  const paidClosings = closings
    .filter((closing) => Number(closing.paidAmount) > 0)
    .sort((a, b) =>
      String(b.paidAt || b.periodEnd || "").localeCompare(
        String(a.paidAt || a.periodEnd || ""),
      ),
    );
  const monthlyGroups = paidClosings.reduce((groups, closing) => {
    const reference = String(closing.periodStart || closing.paidAt || "").slice(
      0,
      7,
    );
    const key = /^\d{4}-\d{2}$/.test(reference) ? reference : "sem-competencia";
    const existing = groups.get(key) || [];
    existing.push(closing);
    groups.set(key, existing);
    return groups;
  }, new Map());
  const groupedPayments = [...monthlyGroups.entries()].sort(([a], [b]) =>
    b.localeCompare(a),
  );
  const totalPaid = paidClosings.reduce(
    (sum, closing) => sum + (Number(closing.paidAmount) || 0),
    0,
  );
  const titleId = `employee-payment-history-${employee.id}`;

  const formatCompetency = (key) => {
    if (key === "sem-competencia") return "Competência não informada";
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  };

  const statusMeta = {
    paid: { label: "Pago", className: "bg-green-100 text-green-800" },
    partial: {
      label: "Pagamento parcial",
      className: "bg-amber-100 text-amber-800",
    },
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#2A1E15]/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-[#D4A373]/30 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 p-5 sm:p-7">
          <div>
            <p className="text-[10px] font-black uppercase text-[#8A5A2B]">
              Histórico financeiro do funcionário
            </p>
            <h3
              id={titleId}
              className="mt-2 text-balance text-xl font-black uppercase tracking-tight text-[#2A1E15] sm:text-2xl"
            >
              {employee.name}
            </h3>
            <p className="mt-1 text-pretty text-sm font-bold text-[#6F6258]">
              Pagamentos efetivamente registrados, agrupados pela competência
              trabalhada.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar histórico de pagamentos"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-[#2A1E15] transition-colors hover:bg-stone-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-7">
          {paidClosings.length > 0 ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-stone-100 p-4">
                  <p className="text-[9px] font-black uppercase text-[#6F6258]">
                    Competências
                  </p>
                  <p className="mt-1 text-xl font-black tabular-nums text-[#2A1E15]">
                    {groupedPayments.length}
                  </p>
                </div>
                <div className="rounded-2xl bg-stone-100 p-4">
                  <p className="text-[9px] font-black uppercase text-[#6F6258]">
                    Pagamentos
                  </p>
                  <p className="mt-1 text-xl font-black tabular-nums text-[#2A1E15]">
                    {paidClosings.length}
                  </p>
                </div>
                <div className="col-span-2 rounded-2xl bg-green-50 p-4 sm:col-span-1">
                  <p className="text-[9px] font-black uppercase text-green-800">
                    Total pago
                  </p>
                  <p className="mt-1 text-xl font-black tabular-nums text-green-800">
                    {formatMoney(totalPaid)}
                  </p>
                </div>
              </div>

              {groupedPayments.map(([competency, payments]) => {
                const monthPaid = payments.reduce(
                  (sum, payment) => sum + (Number(payment.paidAmount) || 0),
                  0,
                );
                const monthExpected = payments.reduce(
                  (sum, payment) => sum + (Number(payment.totalPayment) || 0),
                  0,
                );
                return (
                  <section
                    key={competency}
                    className="overflow-hidden rounded-2xl border border-stone-200"
                  >
                    <div className="flex flex-col gap-3 bg-[#FFF8EC] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <h4 className="text-base font-black capitalize text-[#2A1E15]">
                        {formatCompetency(competency)}
                      </h4>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-black tabular-nums">
                        <span className="text-[#6F6258]">
                          Previsto: {formatMoney(monthExpected)}
                        </span>
                        <span className="text-green-800">
                          Pago: {formatMoney(monthPaid)}
                        </span>
                      </div>
                    </div>
                    <div className="divide-y divide-stone-100">
                      {payments.map((payment) => {
                        const meta =
                          statusMeta[payment.status] || statusMeta.partial;
                        return (
                          <div
                            key={payment.id}
                            className="grid gap-3 p-4 sm:grid-cols-[1.3fr_1fr_auto] sm:items-center"
                          >
                            <div>
                              <p className="text-sm font-black text-[#2A1E15]">
                                {formatDateBr(payment.periodStart)} a{" "}
                                {formatDateBr(payment.periodEnd)}
                              </p>
                              <p className="mt-1 text-xs font-bold text-[#6F6258]">
                                Pago em {formatDateBr(payment.paidAt)}
                                {payment.expectedPaymentDate
                                  ? ` · previsão ${formatDateBr(payment.expectedPaymentDate)}`
                                  : ""}
                              </p>
                              {payment.note && (
                                <p className="mt-1 text-xs text-[#6F6258]">
                                  {payment.note}
                                </p>
                              )}
                            </div>
                            <div className="text-xs font-bold tabular-nums text-[#6F6258]">
                              <p>
                                Diárias: {formatMoney(payment.totalDailyRates)}
                              </p>
                              <p>
                                Entregas:{" "}
                                {formatMoney(payment.totalDeliveryFees)}
                              </p>
                            </div>
                            <div className="sm:text-right">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase ${meta.className}`}
                              >
                                {meta.label}
                              </span>
                              <p className="mt-2 text-base font-black tabular-nums text-green-800">
                                {formatMoney(payment.paidAmount)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center sm:p-12">
              <Wallet className="mx-auto text-stone-400" size={34} />
              <h4 className="mt-4 text-balance text-lg font-black text-[#2A1E15]">
                Nenhum pagamento realizado registrado
              </h4>
              <p className="mx-auto mt-2 max-w-lg text-pretty text-sm font-bold text-[#6F6258]">
                O cadastro e as jornadas continuam preservados, mas ainda não
                existe valor pago persistido para este funcionário.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-stone-100 bg-[#FFF8EC] p-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#2A1E15] px-4 py-3 text-xs font-black uppercase text-white sm:ml-auto sm:block sm:w-auto sm:min-w-32"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Resolve o intervalo do extrato financeiro a partir do tipo de filtro selecionado.
 */
const buildClosingRange = (filterType, referenceDate, rangeStart, rangeEnd) => {
  const baseReference =
    normalizeDate(parseIsoDate(referenceDate) || new Date()) || new Date();

  if (filterType === "dia") {
    return {
      start: baseReference,
      end: baseReference,
      label: `Fechamento do dia ${formatDateBr(baseReference)}`,
    };
  }

  if (filterType === "mes") {
    const start = new Date(
      baseReference.getFullYear(),
      baseReference.getMonth(),
      1,
    );
    const end = new Date(
      baseReference.getFullYear(),
      baseReference.getMonth() + 1,
      0,
    );
    return {
      start,
      end,
      label: `Fechamento de ${baseReference.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
    };
  }

  if (filterType === "quinzena") {
    const end = baseReference;
    const start = new Date(baseReference);
    start.setDate(start.getDate() - 14);
    return {
      start: normalizeDate(start),
      end,
      label: `Fechamento quinzenal até ${formatDateBr(end)}`,
    };
  }

  const startCandidate =
    normalizeDate(parseIsoDate(rangeStart) || baseReference) || baseReference;
  const endCandidate =
    normalizeDate(parseIsoDate(rangeEnd) || baseReference) || baseReference;
  const start = startCandidate <= endCandidate ? startCandidate : endCandidate;
  const end = endCandidate >= startCandidate ? endCandidate : startCandidate;

  return {
    start,
    end,
    label: `Período de ${formatDateBr(start)} até ${formatDateBr(end)}`,
  };
};

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const isHoliday = (date, holidayDates = []) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  const iso = date.toISOString().slice(0, 10);
  return holidayDates.includes(iso);
};

const isBusinessDay = (date, holidayDates = []) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  return !isWeekend(date) && !isHoliday(date, holidayDates);
};

const getNthBusinessDay = (year, monthIndex, nth, holidayDates = []) => {
  let current = new Date(year, monthIndex, 1);
  let count = 0;

  while (current.getMonth() === monthIndex) {
    if (isBusinessDay(current, holidayDates)) {
      count += 1;
      if (count === nth) return new Date(current);
    }
    current.setDate(current.getDate() + 1);
  }

  return null;
};

const getNextBusinessDayFromFixedDate = (
  year,
  monthIndex,
  day,
  holidayDates = [],
) => {
  const current = new Date(year, monthIndex, day);

  while (!isBusinessDay(current, holidayDates)) {
    current.setDate(current.getDate() + 1);
  }

  return new Date(current);
};

const getNextWeekdayDate = (weekdayNumber) => {
  const today = new Date();
  const target = Number(weekdayNumber);
  const current = new Date(today);
  const currentWeekday = current.getDay();
  let diff = target - currentWeekday;
  if (diff < 0) diff += 7;
  if (diff === 0) diff = 7;
  current.setDate(current.getDate() + diff);
  return current;
};

const parseComponentValue = (value) => {
  const [componentType, rawId] = String(value || "").split(":");

  return {
    componentType,
    componentId: rawId || "",
  };
};

const idsEqual = (left, right) => String(left) === String(right);

const findById = (items, id) =>
  items.find((current) => idsEqual(current.id, id));

const resolveUnitValue = (units, unitLabel) =>
  resolveSelectableUnitLabel(units, unitLabel);

const resolveCompatibleUnitValue = (units, sourceUnit, unitLabel) =>
  resolveSelectableUnitLabel(getCompatibleUnits(sourceUnit, units), unitLabel);

const getComponentBaseUnit = (componentRef, ingredients, preparations) => {
  const parsed = parseComponentValue(componentRef);

  if (parsed.componentType === "ingredient") {
    return findById(ingredients, parsed.componentId)?.unit || "";
  }

  if (parsed.componentType === "preparation") {
    return findById(preparations, parsed.componentId)?.yieldUnit || "";
  }

  return "";
};

const buildPreparationCostMap = (preparations, ingredients) => {
  const cache = new Map();

  const resolveComponentUnitCost = (
    componentType,
    componentId,
    stack = new Set(),
  ) => {
    const componentKey = String(componentId);

    if (componentType === "ingredient") {
      return calculateIngredientUnitCost(findById(ingredients, componentId));
    }

    if (componentType === "preparation") {
      if (cache.has(componentKey)) return cache.get(componentKey);
      if (stack.has(componentKey)) return 0;

      const preparation = findById(preparations, componentId);
      if (!preparation) return 0;

      const nextStack = new Set(stack);
      nextStack.add(componentKey);

      const totalCost = calculateRecipeCost(preparation.recipe, (item) => {
        const component =
          item.componentType === "ingredient"
            ? findById(ingredients, item.componentId)
            : findById(preparations, item.componentId);
        return {
          sourceUnit:
            item.componentType === "ingredient"
              ? component?.unit
              : component?.yieldUnit,
          unitCost: resolveComponentUnitCost(
            item.componentType,
            item.componentId,
            nextStack,
          ),
        };
      });

      const yieldQuantity = Number(preparation.yieldQuantity) || 1;
      const unitCost = totalCost / yieldQuantity;

      cache.set(componentKey, unitCost);
      return unitCost;
    }

    return 0;
  };

  preparations.forEach((preparation) => {
    resolveComponentUnitCost("preparation", preparation.id);
  });

  return cache;
};

const calculatePreparationMetrics = (
  preparation,
  ingredients,
  preparations,
  preparationCostMap,
) => {
  const totalCost = calculateRecipeCost(preparation.recipe, (item) => {
    const componentSourceUnit =
      item.componentType === "ingredient"
        ? findById(ingredients, item.componentId)?.unit
        : findById(preparations, item.componentId)?.yieldUnit;
    const componentUnitCost =
      item.componentType === "ingredient"
        ? calculateIngredientUnitCost(findById(ingredients, item.componentId))
        : preparationCostMap.get(String(item.componentId)) || 0;

    return { sourceUnit: componentSourceUnit, unitCost: componentUnitCost };
  });

  return {
    totalCost,
    unitCost: preparationCostMap.get(String(preparation.id)) || 0,
  };
};

const calculateProductMetrics = (
  product,
  ingredients,
  preparations,
  preparationCostMap,
) => {
  const recipeCost = calculateRecipeCost(product.recipe, (item) => {
    const componentSourceUnit =
      item.componentType === "ingredient"
        ? findById(ingredients, item.componentId)?.unit
        : findById(preparations, item.componentId)?.yieldUnit;
    const componentUnitCost =
      item.componentType === "ingredient"
        ? calculateIngredientUnitCost(findById(ingredients, item.componentId))
        : preparationCostMap.get(String(item.componentId)) || 0;

    return { sourceUnit: componentSourceUnit, unitCost: componentUnitCost };
  });

  const yieldQuantity = Number(product.yieldQuantity) || 1;
  const unitCost = recipeCost / yieldQuantity;
  const salePrice = Number(product.salePrice) || 0;
  const targetCmvPercent = Number(product.targetCmvPercent) || 30;
  const cmvPercent = salePrice > 0 ? (unitCost / salePrice) * 100 : 0;
  const suggestedPrice =
    targetCmvPercent > 0 ? unitCost / (targetCmvPercent / 100) : 0;
  const grossMargin = salePrice - unitCost;
  const marginPercent = salePrice > 0 ? (grossMargin / salePrice) * 100 : 0;
  const markupPercent = unitCost > 0 ? (grossMargin / unitCost) * 100 : 0;

  return {
    recipeCost,
    unitCost,
    salePrice,
    targetCmvPercent,
    cmvPercent,
    suggestedPrice,
    grossMargin,
    marginPercent,
    markupPercent,
  };
};

// --- PALETAS DE CORES ---
const palettes = {
  frescor: {
    primary: "#4A6B53",
    primaryDark: "#3B5441",
    primaryLight: "#E8F5E9",
    primaryDarker: "#2A3F30",
    secondary: "#FF9800",
    secondaryHover: "#E68A00",
    secondaryLight: "#FFE0B2",
    bgApp: "#F8F9FA",
    bgCard: "#FFFFFF",
    bgAlt: "#E8F5E9",
    textStrong: "#1f2937",
    accentMin: "#12343B",
  },
  natural: {
    primary: "#3E5A3C",
    primaryDark: "#2F442E",
    primaryLight: "#A3B899",
    primaryDarker: "#1E2C1D",
    secondary: "#DDA73A",
    secondaryHover: "#C5942B",
    secondaryLight: "#F6E3B8",
    bgApp: "#F5F2EB",
    bgCard: "#FFFFFF",
    bgAlt: "#E6E1D5",
    textStrong: "#2C3E2B",
    accentMin: "#12343B",
  },
  premium: {
    primary: "#212529",
    primaryDark: "#1A1D20",
    primaryLight: "#343A40",
    primaryDarker: "#0D0E10",
    secondary: "#E63946",
    secondaryHover: "#D62839",
    secondaryLight: "#FFC0C7",
    bgApp: "#F1F3F5",
    bgCard: "#FFFFFF",
    bgAlt: "#E2E8F0",
    textStrong: "#1A1D20",
    accentMin: "#12343B",
  },
  esfiha: {
    primary: "#2A1E15",
    primaryDark: "#3A281B",
    primaryLight: "#E7DED1",
    primaryDarker: "#2B2520",
    secondary: "#D4A373",
    secondaryHover: "#C58F5E",
    secondaryLight: "#F3E8DA",
    bgApp: "#FAF6EF",
    bgCard: "#FFFFFF",
    bgAlt: "#F3E8DA",
    textStrong: "#2B2520",
    textMedium: "#6F6258",
    textWeak: "#9C8F84",
    accentMin: "#3F6F8F",
    success: "#3F8F52",
    error: "#C95C49",
  },
};

// --- APLICAÇÃO PRINCIPAL ---
export default function App({ tenantSlug = "default" }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(tenantSlug !== "default");
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState("");
  const [activeTab, setActiveTab] = useState(getTabFromLocationHash);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(() => ({
    operacional: true,
    suprimentos: false,
    financeiro: false,
    pessoas: false,
    sistema: false,
  }));
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [financeError, setFinanceError] = useState("");
  const [financeSuccess, setFinanceSuccess] = useState("");
  const [rhError, setRhError] = useState("");
  const [isFinanceSubmitting, setIsFinanceSubmitting] = useState(false);
  const [savingMutations, setSavingMutations] = useState({});
  const savingMutationRef = useRef(new Set());
  const [aiBehaviorError, setAiBehaviorError] = useState("");
  const [aiBehaviorSuccess, setAiBehaviorSuccess] = useState("");
  const [settingsCapsLockOn, setSettingsCapsLockOn] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [highlightedCostIds, setHighlightedCostIds] = useState([]);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPreparationModalOpen, setIsPreparationModalOpen] = useState(false);
  const [isPreparationManagerModalOpen, setIsPreparationManagerModalOpen] =
    useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isFinanceCategoryModalOpen, setIsFinanceCategoryModalOpen] =
    useState(false);
  const [isDiscountCategoryModalOpen, setIsDiscountCategoryModalOpen] =
    useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isEmployeeDiscountsModalOpen, setIsEmployeeDiscountsModalOpen] =
    useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [employeePendingDeletion, setEmployeePendingDeletion] = useState(null);
  const [paymentHistoryEmployee, setPaymentHistoryEmployee] = useState(null);
  const [selectedEmployeeIdForDiscounts, setSelectedEmployeeIdForDiscounts] =
    useState(null);
  const [rhView, setRhView] = useState("fixed");
  const [employeeWorkLogs, setEmployeeWorkLogs] = useState([]);
  const [extraWeeklyClosings, setExtraWeeklyClosings] = useState([]);

  const isSavingMutation = (key) => Boolean(savingMutations[key]);
  const runSavingMutation = async (key, action) => {
    if (savingMutationRef.current.has(key)) return null;

    savingMutationRef.current.add(key);
    setSavingMutations((prev) => ({ ...prev, [key]: true }));

    try {
      return await action();
    } finally {
      savingMutationRef.current.delete(key);
      setSavingMutations((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const currentMonthYear = new Date().toISOString().slice(0, 7);
  const [fixedPayrollMonth, setFixedPayrollMonth] = useState(currentMonthYear);
  const [fixedPayrollLoading, setFixedPayrollLoading] = useState(true);
  const [fixedPayrollData, setFixedPayrollData] = useState(() => ({
    competenceMonth: currentMonthYear,
    statements: [],
    scheduledDaysOff: [],
    adjustments: [],
  }));
  const [payrollAdjustmentDraft, setPayrollAdjustmentDraft] = useState(() => ({
    adjustmentDate: new Date().toISOString().slice(0, 10),
    category: "OTHER",
    description: "",
    amount: "",
    note: "",
  }));
  const [payrollAdjustmentError, setPayrollAdjustmentError] = useState("");

  // Configurações
  const [settings, setSettings] = useState(() => ({
    ifoodTax: 23,
    anotaaiTax: 5,
    appPassword: "admin",
    passwordReminder: 'A senha padrão é "admin".',
    businessName: "Rei das Esfihas",
    alertDaysBefore: 3,
    colorPalette: "esfiha",
  }));
  const [aiBehaviorSettings, setAiBehaviorSettings] = useState(() =>
    createDefaultAiBehaviorSettings(),
  );

  // Injeção dinâmica da paleta de cores no :root
  React.useEffect(() => {
    const paletteKey = settings?.colorPalette || "esfiha";
    const colors = palettes[paletteKey] || palettes.esfiha;

    const root = document.documentElement;
    root.style.setProperty("--color-primary", colors.primary);
    root.style.setProperty("--color-primary-dark", colors.primaryDark);
    root.style.setProperty("--color-primary-light", colors.primaryLight);
    root.style.setProperty("--color-primary-darker", colors.primaryDarker);
    root.style.setProperty("--color-secondary", colors.secondary);
    root.style.setProperty("--color-secondary-hover", colors.secondaryHover);
    root.style.setProperty("--color-secondary-light", colors.secondaryLight);
    root.style.setProperty("--color-bg-app", colors.bgApp);
    root.style.setProperty("--color-bg-card", colors.bgCard);
    root.style.setProperty("--color-bg-alt", colors.bgAlt);
    root.style.setProperty("--color-text-main", colors.textStrong || "#1A1D20");
    root.style.setProperty(
      "--color-text-medium",
      colors.textMedium || "#6F5B50",
    );
    root.style.setProperty("--color-text-weak", colors.textWeak || "#B9A89A");
    root.style.setProperty("--color-accent-min", colors.accentMin || "#12343B");
    root.style.setProperty("--color-success", colors.success || "#2F8F55");
    root.style.setProperty("--color-error", colors.error || "#B83A2F");
  }, [settings?.colorPalette]);

  // Categorias
  const [costCategories, setCostCategories] = useState(() => [
    { id: 1, name: "Aluguel" },
    { id: 2, name: "Energia Elétrica" },
    { id: 3, name: "Água" },
    { id: 4, name: "Internet" },
    { id: 5, name: "Contador" },
  ]);

  const [employeeRoles, setEmployeeRoles] = useState(() => [
    { id: 1, name: "Esfiharia" },
    { id: 2, name: "Atendimento" },
    { id: 3, name: "Pizzaiolo" },
    { id: 4, name: "Gerência" },
  ]);

  const [discountCategories, setDiscountCategories] = useState(() => [
    { id: 1, name: "Falta" },
    { id: 2, name: "Atraso" },
    { id: 3, name: "Adiantamento" },
    { id: 4, name: "Outros" },
  ]);

  // RH
  const [employees, setEmployees] = useState(() => [
    {
      id: 1,
      name: "João da Massa",
      phone: "",
      email: "",
      address: "",
      maritalStatus: "",
      role: "Esfiharia",
      notes: "",
      employmentType: "fixed",
      status: "active",
      salary: 2200,
      admissionDate: "",
      discounts: [{ id: 1, category: "Falta", amount: 0 }],
    },
    {
      id: 2,
      name: "Maria do Balcão",
      phone: "",
      email: "",
      address: "",
      maritalStatus: "",
      role: "Atendimento",
      notes: "",
      employmentType: "fixed",
      status: "active",
      salary: 1800,
      admissionDate: "",
      discounts: [{ id: 1, category: "Outros", amount: 0 }],
    },
    {
      id: 3,
      name: "Carlos da Fornalha",
      phone: "",
      email: "",
      address: "",
      maritalStatus: "",
      role: "Pizzaiolo",
      notes: "Prestador semanal",
      employmentType: "external",
      status: "active",
      paymentMode: "weekly",
      baseAmount: 450,
      weekday: "5",
      specificDate: "",
      startDate: "",
    },
  ]);
  const [employeeForm, setEmployeeForm] = useState(() => ({
    name: "",
    phone: "",
    email: "",
    address: "",
    maritalStatus: "",
    role: "",
    notes: "",
    employmentType: "fixed",
    status: "active",
    salary: "",
    admissionDate: "",
    discounts: [],
    paymentMode: "weekly",
    baseAmount: "",
    weekday: "1",
    specificDate: "",
    startDate: "",
    dailyRateTypes: [],
    controlAttendance: true,
    attendanceControlFrom: new Date().toISOString().slice(0, 10),
    weeklyDayOff: "",
    monthlySundayOffOrdinal: "",
    firstPaymentPercentage: 40,
    finalPaymentPercentage: 60,
    scheduledDaysOff: [],
    newDayOffDate: "",
  }));

  const [payrollConfig, setPayrollConfig] = useState(() => ({
    salaryPercentage: 60,
    salaryBusinessDayOrdinal: 5,
    advancePercentage: 40,
    advanceFixedDay: 20,
    advanceBusinessDayPolicy: "next",
    holidayDates: [],
    mealCostPerWorkday: 15,
    extraKitchenDailyRate: 70,
    extraMotoboyDailyRate: 60,
  }));

  const [ingredients, setIngredients] = useState(() => [
    {
      id: 1,
      name: "Farinha",
      unit: "G",
      packageQuantity: 1000,
      packageCost: 4.4,
      unitCost: 0.0044,
    },
    {
      id: 2,
      name: "Carne Moída",
      unit: "G",
      packageQuantity: 1000,
      packageCost: 32.0,
      unitCost: 0.032,
    },
    {
      id: 3,
      name: "Queijo Mussarela",
      unit: "G",
      packageQuantity: 1000,
      packageCost: 28.0,
      unitCost: 0.028,
    },
    {
      id: 4,
      name: "Molho de Tomate",
      unit: "G",
      packageQuantity: 1000,
      packageCost: 9.0,
      unitCost: 0.009,
    },
    {
      id: 5,
      name: "Embalagem",
      unit: "UN",
      packageQuantity: 1,
      packageCost: 0.35,
      unitCost: 0.35,
    },
  ]);

  const [ingredientUnits, setIngredientUnits] = useState(() =>
    createDefaultIngredientUnits(),
  );

  const [editingIngredientId, setEditingIngredientId] = useState(null);
  const [ingredientForm, setIngredientForm] = useState(() => ({
    name: "",
    unit: "G",
    unitCost: "",
    category: "",
    stockMinimum: "",
    primarySupplierId: "",
    active: true,
  }));
  const [financeFormType, setFinanceFormType] = useState("receita");
  const [financeSourceFilter, setFinanceSourceFilter] = useState("MANUAL");
  const todayIsoDate = toIsoDate(new Date());
  const [closingFilterType, setClosingFilterType] = useState("mes");
  const [closingReferenceDate, setClosingReferenceDate] =
    useState(todayIsoDate);
  const [closingRangeStart, setClosingRangeStart] = useState(todayIsoDate);
  const [closingRangeEnd, setClosingRangeEnd] = useState(todayIsoDate);
  const [dreMonth, setDreMonth] = useState(todayIsoDate.slice(0, 7));
  const [closingMonth, setClosingMonth] = useState(todayIsoDate.slice(0, 7));
  const [dashboardMonth, setDashboardMonth] = useState(
    todayIsoDate.slice(0, 7),
  );
  const [financeMonth, setFinanceMonth] = useState(todayIsoDate.slice(0, 7));
  const [accountsPayableView, setAccountsPayableView] = useState("OBLIGATIONS");
  const [cmvCashMonth, setCmvCashMonth] = useState(todayIsoDate.slice(0, 7));

  const [preparationForm, setPreparationForm] = useState(() => ({
    name: "",
    yieldQuantity: "1",
    yieldUnit: "G",
  }));
  const [editingPreparationId, setEditingPreparationId] = useState(null);

  const [preparations, setPreparations] = useState(() => [
    {
      id: 1,
      name: "Carne Moída Temperada",
      yieldQuantity: 1,
      yieldUnit: "KG",
      recipe: [
        {
          componentType: "ingredient",
          componentId: 2,
          quantity: 0.85,
          quantityUnit: "KG",
        },
        {
          componentType: "ingredient",
          componentId: 4,
          quantity: 120,
          quantityUnit: "G",
        },
      ],
    },
  ]);

  const [products, setProducts] = useState(() => [
    {
      id: 1,
      name: "Esfiha de Carne",
      salePrice: 8.0,
      yieldQuantity: 1,
      targetCmvPercent: 30,
      recipe: [
        {
          componentType: "ingredient",
          componentId: 1,
          quantity: 90,
          quantityUnit: "G",
        },
        {
          componentType: "preparation",
          componentId: 1,
          quantity: 70,
          quantityUnit: "G",
        },
        {
          componentType: "ingredient",
          componentId: 5,
          quantity: 1,
          quantityUnit: "UN",
        },
      ],
    },
    {
      id: 2,
      name: "Pizza Brotinho",
      salePrice: 24.0,
      yieldQuantity: 1,
      targetCmvPercent: 32,
      recipe: [
        {
          componentType: "ingredient",
          componentId: 1,
          quantity: 220,
          quantityUnit: "G",
        },
        {
          componentType: "ingredient",
          componentId: 3,
          quantity: 140,
          quantityUnit: "G",
        },
        {
          componentType: "ingredient",
          componentId: 4,
          quantity: 90,
          quantityUnit: "G",
        },
        {
          componentType: "ingredient",
          componentId: 5,
          quantity: 1,
          quantityUnit: "UN",
        },
      ],
    },
  ]);

  const [menuCategories, setMenuCategories] = useState(() =>
    createInitialMenuCategories(),
  );
  const [menuItems, setMenuItems] = useState(() => [
    {
      id: 1,
      itemType: "regular",
      name: "Esfiha Premium de Carne",
      category: "Esfiha",
      description:
        "Massa leve com recheio bem temperado, toque de limão e apresentação individual.",
      status: "active",
      salePrice: 11.9,
      photoPreview: "",
      linkedComponents: [
        { type: "product", id: 1 },
        { type: "ingredient", id: 5 },
      ],
      comboGroups: [],
      basePrice: null,
      createdAt: "2026-04-01T12:00:00.000Z",
    },
    {
      id: 2,
      itemType: "regular",
      name: "Pizza Brotinho Casa",
      category: "Pizza",
      description:
        "Massa artesanal, molho da casa, queijo derretido e sabor clássico para compartilhar.",
      status: "seasonal",
      salePrice: 29.9,
      photoPreview: "",
      linkedComponents: [
        { type: "product", id: 2 },
        { type: "preparation", id: 1 },
      ],
      comboGroups: [],
      basePrice: null,
      createdAt: "2026-04-05T18:30:00.000Z",
    },
    {
      id: 3,
      itemType: "combo",
      name: "Banquete Real",
      category: "Combo",
      description:
        "Combo grande com sabores clássicos e uma bebida obrigatória, inspirado no fluxo operacional de marketplaces.",
      status: "active",
      salePrice: null,
      basePrice: 80,
      photoPreview: "",
      linkedComponents: [],
      comboGroups: [
        {
          id: createId(),
          name: "Clássicas",
          minSelect: 15,
          maxSelect: 15,
          options: [
            {
              id: createId(),
              name: "Carne",
              photoPreview: "",
              extraPrice: 0,
              maxQty: 15,
              isAvailable: true,
              linkedComponentRef: "product:1",
            },
            {
              id: createId(),
              name: "Calabresa",
              photoPreview: "",
              extraPrice: 0,
              maxQty: 15,
              isAvailable: true,
              linkedComponentRef: "",
            },
            {
              id: createId(),
              name: "Queijo",
              photoPreview: "",
              extraPrice: 0,
              maxQty: 15,
              isAvailable: true,
              linkedComponentRef: "",
            },
            {
              id: createId(),
              name: "Frango",
              photoPreview: "",
              extraPrice: 0,
              maxQty: 15,
              isAvailable: false,
              linkedComponentRef: "",
            },
          ],
        },
        {
          id: createId(),
          name: "Bebidas",
          minSelect: 1,
          maxSelect: 1,
          options: [
            {
              id: createId(),
              name: "Kuat 2L",
              photoPreview: "",
              extraPrice: 0,
              maxQty: 1,
              isAvailable: true,
              linkedComponentRef: "",
            },
            {
              id: createId(),
              name: "Fanta Laranja 2L",
              photoPreview: "",
              extraPrice: 0,
              maxQty: 1,
              isAvailable: true,
              linkedComponentRef: "",
            },
            {
              id: createId(),
              name: "Coca-Cola Original 2L",
              photoPreview: "",
              extraPrice: 6,
              maxQty: 1,
              isAvailable: false,
              linkedComponentRef: "",
            },
          ],
        },
      ],
      createdAt: "2026-04-05T18:30:00.000Z",
    },
  ]);
  const [menuItemForm, setMenuItemForm] = useState(() =>
    createEmptyMenuItemForm("Esfiha"),
  );
  const [comboForm, setComboForm] = useState(() =>
    createEmptyComboForm("Combo"),
  );
  const [menuCategoryForm, setMenuCategoryForm] = useState(() =>
    createEmptyCategoryForm(),
  );
  const [menuSearchTerm, setMenuSearchTerm] = useState("");
  const [menuComponentSearch, setMenuComponentSearch] = useState("");
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [editingComboId, setEditingComboId] = useState(null);
  const [editingMenuCategoryId, setEditingMenuCategoryId] = useState(null);
  const [isMenuCategoryModalOpen, setIsMenuCategoryModalOpen] = useState(false);
  const [menuCategoryPendingDeletion, setMenuCategoryPendingDeletion] =
    useState(null);
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [comboError, setComboError] = useState("");
  const [expandedMenuCategories, setExpandedMenuCategories] = useState(() => ({
    Esfiha: true,
    Pizza: true,
  }));
  const [expandedMenuItems, setExpandedMenuItems] = useState(() => ({
    1: false,
    2: false,
    3: true,
  }));

  const [productRecipeDraft, setProductRecipeDraft] = useState(() => [
    { id: Date.now(), componentRef: "", quantity: "", quantityUnit: "" },
  ]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [productForm, setProductForm] = useState(() => ({
    name: "",
    salePrice: "",
    yieldQuantity: "1",
    targetCmvPercent: "30",
  }));

  const [preparationRecipeDraft, setPreparationRecipeDraft] = useState(() => [
    { id: Date.now() + 1, componentRef: "", quantity: "", quantityUnit: "" },
  ]);

  const [productSearchTerm, setProductSearchTerm] = useState("");

  // Custos Fixos
  const [recurringCosts, setRecurringCosts] = useState(() => [
    { id: 1, desc: "Aluguel", amount: 3000, dueDay: 10, lastPaidMonth: "" },
    {
      id: 2,
      desc: "Energia Elétrica",
      amount: 850,
      dueDay: 15,
      lastPaidMonth: "",
    },
  ]);

  const [salesChannels, setSalesChannels] = useState(() => [
    { id: 1, name: "ifood" },
    { id: 2, name: "anotaai" },
  ]);

  const [financeExpenseCategories, setFinanceExpenseCategories] = useState(
    () => [
      { id: 1, name: "Compra de Insumos" },
      { id: 2, name: "Fornecedor" },
      { id: 3, name: "Manutenção" },
      { id: 4, name: "Marketing" },
      { id: 5, name: "Imposto" },
      { id: 6, name: "Retirada" },
      { id: 7, name: "Outras Saídas" },
    ],
  );

  // Vendas
  const [transactions, setTransactions] = useState(() => [
    {
      id: 1,
      date: "2024-04-09",
      platform: "ifood",
      payment: "online",
      amount: 1200.0,
      tax: 23,
      net: 924.0,
      type: "receita",
      category: "ifood",
      note: "Pedidos iFood",
    },
    {
      id: 2,
      date: "2024-04-09",
      platform: "anotaai",
      payment: "pix",
      amount: 650.0,
      tax: 5,
      net: 617.5,
      type: "receita",
      category: "anotaai",
      note: "Pedidos Anota AI",
    },
    {
      id: 3,
      date: "2024-04-09",
      platform: "despesa",
      payment: "pix",
      amount: 180.0,
      tax: 0,
      net: -180.0,
      type: "despesa",
      category: "Compra de Insumos",
      note: "Reposição de hortifruti",
    },
  ]);
  const [financialObligations, setFinancialObligations] = useState([]);
  const [, setFinancialPayments] = useState([]);
  const [dailyCashReconciliations, setDailyCashReconciliations] = useState([]);
  const [channelSettlements, setChannelSettlements] = useState([]);
  const [supplyChainData, setSupplyChainData] = useState(() => ({
    suppliers: [],
    orders: [],
    inventoryCounts: [],
    inventory: {
      stock: [],
      totalValue: 0,
      ingredientCount: 0,
      belowMinimumCount: 0,
    },
    monthlyInventorySummaries: [],
    priceHistory: [],
    auditEvents: [],
  }));
  const [financialBalances, setFinancialBalances] = useState(() => ({
    periods: [],
    movements: [],
  }));
  const [
    recurringCostDuplicateCandidates,
    setRecurringCostDuplicateCandidates,
  ] = useState([]);
  const [currentUserPermissions, setCurrentUserPermissions] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveryDrivers, setDeliveryDrivers] = useState([]);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);

  const canAccessTab = (tab) =>
    !currentUserPermissions ||
    Boolean(currentUserPermissions[TAB_PERMISSION_KEYS[tab]]);

  const activateTab = (tab) => {
    if (!APP_TAB_IDS.has(tab) || !isAppTabEnabled(tab) || !canAccessTab(tab))
      return;

    setActiveTab(tab);
    setSidebarOpen(false);

    if (window.location.hash !== `#${tab}`) {
      window.location.hash = tab;
    }
  };

  useEffect(() => {
    const syncTabFromHash = () => setActiveTab(getTabFromLocationHash());

    window.addEventListener("hashchange", syncTabFromHash);
    syncTabFromHash();

    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  useEffect(() => {
    setIsCatModalOpen(false);
    setIsRoleModalOpen(false);
    setIsChannelModalOpen(false);
    setIsFinanceCategoryModalOpen(false);
    setIsDiscountCategoryModalOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (
      currentUserPermissions &&
      !currentUserPermissions[TAB_PERMISSION_KEYS[activeTab]]
    ) {
      setActiveTab("dashboard");
      setSidebarOpen(false);
      if (window.location.hash !== "#dashboard")
        window.location.hash = "dashboard";
    }
  }, [currentUserPermissions, activeTab]);

  useEffect(() => {
    let cancelled = false;

    const resolvedTenantSlug = tenantSlug !== "default" ? tenantSlug : "";

    if (!USE_BACKEND_BOOTSTRAP) {
      setSession(true);
      setBootstrapError("");
      setBootstrapLoading(false);
      return undefined;
    }

    if (!resolvedTenantSlug) {
      setBootstrapLoading(false);
      setBootstrapError("Sessão não encontrada. Faça login novamente.");
      return undefined;
    }

    const loadBootstrap = async () => {
      setBootstrapLoading(true);
      setBootstrapError("");

      try {
        const [payload, supplyData, balanceData] = await Promise.all([
          appApi.getBootstrap(resolvedTenantSlug),
          supplyChainApi.getData(resolvedTenantSlug).catch(() => null),
          financeApi.getBalances(resolvedTenantSlug).catch(() => null),
        ]);

        if (cancelled) return;

        startTransition(() => {
          const loadedEmployees = payload.employees || [];
          const persistedRoles = payload.employeeRoles || [];
          const persistedRoleKeys = new Set(
            persistedRoles.map((role) =>
              String(role.name || "")
                .trim()
                .toLocaleLowerCase("pt-BR"),
            ),
          );
          const rolesRecoveredFromEmployees = loadedEmployees
            .map((employee) => String(employee.role || "").trim())
            .filter(
              (role) =>
                role && !persistedRoleKeys.has(role.toLocaleLowerCase("pt-BR")),
            )
            .filter(
              (role, index, roles) =>
                roles.findIndex(
                  (candidate) =>
                    candidate.toLocaleLowerCase("pt-BR") ===
                    role.toLocaleLowerCase("pt-BR"),
                ) === index,
            )
            .map((name, index) => ({
              id: `employee-role-recovered-${index}`,
              name,
            }));
          setSettings(payload.settings || {});
          setAiBehaviorSettings(
            normalizeAiBehaviorSettings(payload.aiBehaviorSettings),
          );
          setPayrollConfig(payload.payrollConfig || {});
          setEmployees(loadedEmployees);
          setRecurringCosts(payload.recurringCosts || []);
          setSalesChannels(payload.salesChannels || []);
          setFinanceExpenseCategories(payload.financeExpenseCategories || []);
          setTransactions(payload.transactions || []);
          setFinancialObligations(payload.financialObligations || []);
          setFinancialPayments(payload.financialPayments || []);
          setDailyCashReconciliations(payload.dailyCashReconciliations || []);
          setChannelSettlements(payload.channelSettlements || []);
          setSupplyChainData(
            supplyData || {
              suppliers: [],
              orders: [],
              inventoryCounts: [],
              inventory: { stock: [] },
              monthlyInventorySummaries: [],
            },
          );
          setFinancialBalances(balanceData || { periods: [], movements: [] });
          setRecurringCostDuplicateCandidates(
            payload.recurringCostDuplicateCandidates || [],
          );
          setCurrentUserPermissions(payload.currentUserPermissions || {});
          setCustomers(payload.customers || []);
          setPaymentMethods(payload.paymentMethods || []);
          setOrders(payload.orders || []);
          setDeliveryDrivers(payload.deliveryDrivers || []);
          setEmployeeRoles([...persistedRoles, ...rolesRecoveredFromEmployees]);
          setDiscountCategories(payload.discountCategories || []);
          setEmployeeWorkLogs(payload.employeeWorkLogs || []);
          setExtraWeeklyClosings(payload.extraWeeklyClosings || []);
          setIngredients(payload.ingredients || []);
          setIngredientUnits(createDefaultIngredientUnits());
          setPreparations(payload.preparations || []);
          setProducts(payload.products || []);
          setMenuCategories(normalizeSortOrder(payload.menuCategories || []));
          setMenuItems(normalizeSortOrder(payload.menuItems || []));
          setSession(true);
        });
      } catch (apiError) {
        if (cancelled) return;
        setBootstrapError(
          apiError.message || "Falha ao carregar os dados iniciais.",
        );
      } finally {
        if (!cancelled) {
          setBootstrapLoading(false);
        }
      }
    };

    loadBootstrap();

    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const refreshFixedPayroll = async (month = fixedPayrollMonth) => {
    setFixedPayrollLoading(true);
    try {
      const data = await hrApi.getFixedPayroll(tenantSlug, month);
      setFixedPayrollData(
        data || {
          competenceMonth: month,
          statements: [],
          scheduledDaysOff: [],
          adjustments: [],
        },
      );
      return data;
    } finally {
      setFixedPayrollLoading(false);
    }
  };

  useEffect(() => {
    if (!tenantSlug || tenantSlug === "default" || bootstrapLoading) return;
    let cancelled = false;
    setFixedPayrollLoading(true);
    hrApi
      .getFixedPayroll(tenantSlug, fixedPayrollMonth)
      .then((data) => {
        if (!cancelled) setFixedPayrollData(data);
      })
      .catch((error) => {
        if (!cancelled)
          setRhError(
            error.message || "Não foi possível carregar a folha fixa.",
          );
      })
      .finally(() => {
        if (!cancelled) setFixedPayrollLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, fixedPayrollMonth, bootstrapLoading]);

  // Lógica de Alertas
  const activeAlerts = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    return recurringCosts.filter((cost) => {
      if (cost.lastPaidMonth === currentMonthYear) return false;
      const daysUntil = cost.dueDay - currentDay;
      const isDueSoon = daysUntil >= 0 && daysUntil <= settings.alertDaysBefore;
      const isExactlyToday = daysUntil === 0;
      const alreadyDismissed = dismissedAlerts.includes(
        `${cost.id}-${today.getMonth()}`,
      );
      return isExactlyToday || (isDueSoon && !alreadyDismissed);
    });
  }, [
    recurringCosts,
    settings.alertDaysBefore,
    dismissedAlerts,
    currentMonthYear,
  ]);

  const prioritizedAlerts = useMemo(
    () =>
      [...activeAlerts].sort((a, b) => {
        if (a.dueDay !== b.dueDay) return a.dueDay - b.dueDay;
        return b.amount - a.amount;
      }),
    [activeAlerts],
  );

  const sortedRecurringCosts = useMemo(() => {
    const withoutLegacyPayroll = recurringCosts.filter((cost) => {
      const category = String(cost.category || "").toUpperCase();
      const description = String(cost.desc || cost.description || "");
      return (
        !["FOLHA_FIXA", "FOLHA_EXTRA", "REFEICAO"].includes(category) &&
        !/folha\s*(fixa|extra)|sal[aá]rio|vale[- ]?refei[cç][aã]o/i.test(
          description,
        )
      );
    });
    if (highlightedCostIds.length === 0) return withoutLegacyPayroll;

    return [...withoutLegacyPayroll].sort((a, b) => {
      const aHighlighted = highlightedCostIds.includes(a.id) ? 1 : 0;
      const bHighlighted = highlightedCostIds.includes(b.id) ? 1 : 0;

      if (aHighlighted !== bHighlighted) return bHighlighted - aHighlighted;
      if (a.dueDay !== b.dueDay) return a.dueDay - b.dueDay;
      return b.amount - a.amount;
    });
  }, [recurringCosts, highlightedCostIds]);

  const handleDeleteRecurringCost = async (cost) => {
    const result = await runSavingMutation(
      `delete-recurring-cost-${cost.id}`,
      () => financeApi.deleteRecurringCost(tenantSlug, cost.id),
    );
    if (!result)
      throw new Error(
        "O servidor não confirmou o arquivamento do cadastro recorrente.",
      );
    setRecurringCosts((prev) => prev.filter((item) => item.id !== cost.id));
    return result;
  };

  const catalogMetrics = useMemo(() => {
    const preparationCostMap = buildPreparationCostMap(
      preparations,
      ingredients,
    );

    const preparationSummaries = preparations.map((preparation) => ({
      ...preparation,
      metrics: calculatePreparationMetrics(
        preparation,
        ingredients,
        preparations,
        preparationCostMap,
      ),
    }));

    const productSummaries = products.map((product) => ({
      ...product,
      metrics: calculateProductMetrics(
        product,
        ingredients,
        preparations,
        preparationCostMap,
      ),
    }));

    const totalUnitCost = productSummaries.reduce(
      (acc, product) => acc + product.metrics.unitCost,
      0,
    );
    const totalSalePrice = productSummaries.reduce(
      (acc, product) => acc + product.metrics.salePrice,
      0,
    );
    const averageCmvPercent =
      productSummaries.length > 0
        ? productSummaries.reduce(
            (acc, product) => acc + product.metrics.cmvPercent,
            0,
          ) / productSummaries.length
        : 0;
    const averageMarkupPercent =
      productSummaries.length > 0
        ? productSummaries.reduce(
            (acc, product) => acc + product.metrics.markupPercent,
            0,
          ) / productSummaries.length
        : 0;

    return {
      preparationSummaries,
      productSummaries,
      totalUnitCost,
      totalSalePrice,
      averageCmvPercent,
      averageMarkupPercent,
    };
  }, [products, ingredients, preparations]);

  const cashCmvPayrollEntries = useMemo(
    () =>
      buildMonthlyPayrollEntries({
        month: cmvCashMonth,
        employees,
        employeeWorkLogs,
      }),
    [cmvCashMonth, employees, employeeWorkLogs],
  );
  const cashCmv = useMemo(
    () =>
      calculateCashCmv({
        month: cmvCashMonth,
        transactions,
        obligations: financialObligations,
        payrollEntries: cashCmvPayrollEntries,
        inventoryCmvSummaries: supplyChainData.monthlyInventorySummaries || [],
      }),
    [
      cashCmvPayrollEntries,
      cmvCashMonth,
      financialObligations,
      supplyChainData.monthlyInventorySummaries,
      transactions,
    ],
  );

  const menuComponentOptions = useMemo(() => {
    const productOptions = catalogMetrics.productSummaries.map((product) => ({
      key: `product:${product.id}`,
      type: "product",
      id: product.id,
      name: product.name,
      salePrice: product.metrics.salePrice,
      subtitle: `Preço base ${formatMoney(product.metrics.salePrice)}`,
      tag: "Produto final",
    }));

    return productOptions;
  }, [catalogMetrics.productSummaries]);

  const filteredMenuComponentOptions = useMemo(() => {
    const normalizedSearch = menuComponentSearch.trim().toLowerCase();

    if (!normalizedSearch) return menuComponentOptions;

    return menuComponentOptions.filter(
      (component) =>
        component.name.toLowerCase().includes(normalizedSearch) ||
        component.tag.toLowerCase().includes(normalizedSearch) ||
        component.subtitle.toLowerCase().includes(normalizedSearch),
    );
  }, [menuComponentOptions, menuComponentSearch]);

  const menuComponentOptionByKey = useMemo(
    () =>
      new Map(
        menuComponentOptions.map((component) => [component.key, component]),
      ),
    [menuComponentOptions],
  );

  const menuCategoryOptions = useMemo(
    () => menuCategories.map((category) => category.name),
    [menuCategories],
  );

  const comboLinkCategoryOptions = useMemo(
    () =>
      menuCategoryOptions.reduce((acc, category) => {
        const registeredItemsCount = menuItems.filter(
          (item) => item.category === category && item.id !== editingComboId,
        ).length;
        if (registeredItemsCount === 0) return acc;

        acc.push({
          value: category,
          label: `${category} (${registeredItemsCount})`,
        });
        return acc;
      }, []),
    [editingComboId, menuCategoryOptions, menuItems],
  );

  const comboLinkItemsByCategory = useMemo(
    () =>
      menuItems.reduce((acc, item) => {
        if (item.id === editingComboId) return acc;

        const categoryKey = item.category || "Sem categoria";
        if (!acc[categoryKey]) {
          acc[categoryKey] = [];
        }

        const hasBasePrice =
          typeof item.basePrice === "number" && item.basePrice > 0;
        const priceValue = hasBasePrice
          ? item.basePrice
          : Number(item.salePrice) || 0;

        acc[categoryKey].push({
          key: `menu-item:${item.id}`,
          type: "menu-item",
          id: item.id,
          name: item.name,
          subtitle: `${item.itemType === "combo" ? "Combo" : "Item"} • ${formatMoney(priceValue)}`,
          tag:
            item.itemType === "combo" ? "Combo cadastrado" : "Item cadastrado",
        });

        return acc;
      }, {}),
    [editingComboId, menuItems],
  );

  const menuDashboard = useMemo(() => {
    const activeCount = menuItems.filter(
      (item) => item.status === "active",
    ).length;
    const highlightedCount = menuItems.filter(
      (item) => item.status === "seasonal",
    ).length;
    const itemsWithPhoto = menuItems.filter((item) => item.photoPreview).length;
    const visibleCount = menuItems.filter(
      (item) => item.status !== "inactive",
    ).length;

    return {
      activeCount,
      highlightedCount,
      itemsWithPhoto,
      visibleCount,
    };
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    const normalizedSearch = menuSearchTerm.trim().toLowerCase();

    if (!normalizedSearch) return menuItems;

    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch) ||
        item.comboGroups?.some(
          (group) =>
            group.name.toLowerCase().includes(normalizedSearch) ||
            group.options.some((option) =>
              option.name.toLowerCase().includes(normalizedSearch),
            ),
        ),
    );
  }, [menuItems, menuSearchTerm]);

  const handleReorderMenuCategories = async (nextCategories) => {
    const previousCategories = menuCategories;
    const orderedCategories = withSequentialSortOrder(nextCategories);
    setMenuCategories(orderedCategories);

    try {
      const savedCategories = await menuApi.reorderCategories(
        tenantSlug,
        orderedCategories.map((category) => ({
          id: category.id,
          sortOrder: category.sortOrder,
        })),
      );
      setMenuCategories(normalizeSortOrder(savedCategories));
    } catch (apiError) {
      setMenuCategories(previousCategories);
      setSettingsError(
        apiError.message || "Não foi possível reordenar as categorias.",
      );
    }
  };

  const handleReorderMenuItems = async (categoryName, nextItems) => {
    if (menuSearchTerm.trim()) return;

    const previousItems = menuItems;
    const orderedItems = withSequentialSortOrder(nextItems);
    const orderMap = new Map(
      orderedItems.map((item) => [item.id, item.sortOrder]),
    );

    setMenuItems((current) =>
      current.map((item) =>
        orderMap.has(item.id)
          ? { ...item, sortOrder: orderMap.get(item.id) }
          : item,
      ),
    );

    try {
      const savedItems = await menuApi.reorderItems(
        tenantSlug,
        orderedItems.map((item) => ({
          id: item.id,
          sortOrder: item.sortOrder,
        })),
      );
      setMenuItems(normalizeSortOrder(savedItems));
    } catch (apiError) {
      setMenuItems(previousItems);
      setSettingsError(
        apiError.message ||
          `Não foi possível reordenar os itens de ${categoryName}.`,
      );
    }
  };

  const menuItemsByCategory = useMemo(() => {
    const grouped = menuCategories.map((category) => ({
      id: category.id,
      name: category.name,
      items: sortBySortOrder(
        filteredMenuItems.filter((item) => item.category === category.name),
      ),
    }));

    const uncategorizedItems = sortBySortOrder(
      filteredMenuItems.filter(
        (item) => !menuCategoryOptions.includes(item.category),
      ),
    );

    if (uncategorizedItems.length > 0) {
      grouped.push({
        id: "uncategorized",
        name: "Sem categoria",
        items: uncategorizedItems,
      });
    }

    return grouped.filter(
      (group) => group.items.length > 0 || menuSearchTerm.trim() === "",
    );
  }, [filteredMenuItems, menuCategories, menuCategoryOptions, menuSearchTerm]);

  const menuOperationalSummary = useMemo(() => {
    const totalItems = menuItems.length;
    const emptyCategories = menuCategories.filter(
      (category) => !menuItems.some((item) => item.category === category.name),
    ).length;
    const draftCount = menuItems.filter(
      (item) => item.status === "draft",
    ).length;
    const inactiveCount = menuItems.filter(
      (item) => item.status === "inactive",
    ).length;
    const linkedItems = menuItems.filter(
      (item) => item.linkedComponents?.length > 0,
    ).length;
    const comboCount = menuItems.filter(
      (item) => item.itemType === "combo",
    ).length;
    const comboOptionsCount = menuItems
      .filter((item) => item.itemType === "combo")
      .reduce(
        (acc, item) =>
          acc +
          item.comboGroups.reduce(
            (groupAcc, group) => groupAcc + group.options.length,
            0,
          ),
        0,
      );
    const photoCoverage =
      totalItems > 0
        ? Math.round((menuDashboard.itemsWithPhoto / totalItems) * 100)
        : 0;
    const visibilityCoverage =
      totalItems > 0
        ? Math.round((menuDashboard.visibleCount / totalItems) * 100)
        : 0;

    return {
      totalItems,
      emptyCategories,
      draftCount,
      inactiveCount,
      linkedItems,
      comboCount,
      comboOptionsCount,
      photoCoverage,
      visibilityCoverage,
      categoryHealth: menuCategories.map((category) => {
        const items = menuItems.filter(
          (item) => item.category === category.name,
        );
        const visibleItems = items.filter(
          (item) => item.status !== "inactive",
        ).length;
        const highlightedItems = items.filter(
          (item) => item.status === "seasonal",
        ).length;

        return {
          id: category.id,
          name: category.name,
          itemsCount: items.length,
          visibleItems,
          highlightedItems,
        };
      }),
    };
  }, [
    menuCategories,
    menuDashboard.itemsWithPhoto,
    menuDashboard.visibleCount,
    menuItems,
  ]);

  const payrollSummary = useMemo(() => {
    const [year, monthNumber] = fixedPayrollMonth.split("-").map(Number);
    const monthIndex = monthNumber - 1;
    const holidayDates = payrollConfig.holidayDates || [];
    const fixedEmployees = employees.filter(
      (employee) =>
        employee.employmentType === "fixed" && employee.status !== "inactive",
    );

    const salaryReference = new Date(year, monthIndex + 1, 1);
    const salaryPaymentDate = getNthBusinessDay(
      salaryReference.getFullYear(),
      salaryReference.getMonth(),
      payrollConfig.salaryBusinessDayOrdinal,
      holidayDates,
    );

    const advancePaymentDate = getNextBusinessDayFromFixedDate(
      year,
      monthIndex,
      payrollConfig.advanceFixedDay,
      holidayDates,
    );

    const employeesBreakdown = fixedEmployees.map((employee) => {
      const statement = (fixedPayrollData.statements || []).find(
        (item) => String(item.employeeId) === String(employee.id),
      );
      const grossSalary = Number(statement?.salary ?? employee.salary) || 0;
      const advancePercentage = Number(
        statement?.advancePercentage ??
          employee.firstPaymentPercentage ??
          payrollConfig.advancePercentage,
      );
      const salaryPercentage = Number(
        statement?.salaryPercentage ??
          employee.finalPaymentPercentage ??
          payrollConfig.salaryPercentage,
      );
      const advanceAmount =
        Number(statement?.advanceAmount) ||
        grossSalary * (advancePercentage / 100);
      const grossSalaryPayment =
        Number(statement?.baseSalaryPayment) ||
        grossSalary * (salaryPercentage / 100);
      const absenceAmount = Number(statement?.absenceAmount) || 0;
      const otherDiscountAmount = Number(statement?.otherDiscountAmount) || 0;
      const extraDiscount = Number(statement?.totalDiscounts) || 0;
      const finalSalaryPayment =
        statement?.finalSalaryPayment == null
          ? Math.max(grossSalaryPayment - extraDiscount, 0)
          : Number(statement.finalSalaryPayment);
      const netSalary = advanceAmount + finalSalaryPayment;

      return {
        ...employee,
        statement,
        absences: statement?.absences || [],
        adjustments: statement?.adjustments || [],
        absenceAmount,
        otherDiscountAmount,
        grossSalary,
        advancePercentage,
        salaryPercentage,
        extraDiscount,
        advanceAmount,
        grossSalaryPayment,
        netSalary,
        finalSalaryPayment,
      };
    });

    const totals = employeesBreakdown.reduce(
      (acc, employee) => {
        acc.grossPayroll += employee.grossSalary;
        acc.advanceTotal += employee.advanceAmount;
        acc.salaryPaymentTotal += employee.finalSalaryPayment;
        acc.extraDiscountTotal += employee.extraDiscount;
        acc.netPayroll += employee.netSalary;
        return acc;
      },
      {
        grossPayroll: 0,
        advanceTotal: 0,
        salaryPaymentTotal: 0,
        extraDiscountTotal: 0,
        netPayroll: 0,
      },
    );

    return {
      salaryPaymentDate,
      advancePaymentDate,
      employeesBreakdown,
      totals,
    };
  }, [
    employees,
    payrollConfig,
    fixedPayrollData.statements,
    fixedPayrollMonth,
  ]);

  const externalWorkersSummary = useMemo(() => {
    const workers = employees
      .filter((employee) => employee.employmentType === "external")
      .map((employee) => {
        const nextPaymentDate =
          employee.paymentMode === "weekly"
            ? getNextWeekdayDate(employee.weekday)
            : employee.specificDate
              ? new Date(`${employee.specificDate}T00:00:00`)
              : null;

        return {
          ...employee,
          nextPaymentDate,
          baseAmountNumber:
            Number(employee.dailyRateTypes?.[0]?.amount) ||
            Number(employee.baseAmount) ||
            0,
          dailyRateSummary: (employee.dailyRateTypes || [])
            .filter((type) => type.active !== false)
            .map((type) => `${type.name}: ${formatMoney(type.amount)}`),
        };
      });

    return workers;
  }, [employees]);

  const payrollAlerts = useMemo(() => {
    const today = new Date();
    const normalize = (date) =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const baseToday = normalize(today);

    const items = [
      {
        id: "salary",
        title: "Pagamento final",
        date: payrollSummary.salaryPaymentDate,
        amount: payrollSummary.totals.salaryPaymentTotal,
        description: `5º dia útil de ${payrollSummary.salaryPaymentDate.toLocaleDateString("pt-BR", { month: "long" })} · competência ${today.toLocaleDateString("pt-BR", { month: "long" })}`,
      },
      {
        id: "advance",
        title: "Primeiro pagamento",
        date: payrollSummary.advancePaymentDate,
        amount: payrollSummary.totals.advanceTotal,
        description: `Dia ${payrollConfig.advanceFixedDay} ou próximo dia útil`,
      },
      ...externalWorkersSummary
        .filter(
          (worker) => worker.status !== "inactive" && worker.nextPaymentDate,
        )
        .map((worker) => ({
          id: `external-${worker.id}`,
          title: "Pagamento Por Fora",
          date: worker.nextPaymentDate,
          amount: worker.baseAmountNumber,
          description: `${worker.name} | ${worker.paymentMode === "weekly" ? "Semanal" : "Avulso"}`,
          targetTab: "rh",
          targetRhView: "external",
          targetEmployeeId: worker.id,
        })),
    ].filter((item) => item.date);

    return items
      .map((item) => {
        const diffMs = normalize(item.date).getTime() - baseToday.getTime();
        return {
          ...item,
          daysUntil: Math.ceil(diffMs / (1000 * 60 * 60 * 24)),
        };
      })
      .sort((a, b) => a.date - b.date);
  }, [payrollSummary, payrollConfig.advanceFixedDay, externalWorkersSummary]);

  const hrCostEntries = useMemo(
    () =>
      buildMonthlyPayrollEntries({
        month: dreMonth,
        employees,
        employeeWorkLogs,
      }),
    [dreMonth, employees, employeeWorkLogs],
  );
  const closingPayrollEntries = useMemo(
    () =>
      buildMonthlyPayrollEntries({
        month: closingMonth,
        employees,
        employeeWorkLogs,
      }),
    [closingMonth, employees, employeeWorkLogs],
  );

  const unifiedAlerts = useMemo(() => {
    const costAlerts = prioritizedAlerts.map((alert) => ({
      id: `cost-${alert.id}`,
      title: "Vencimento",
      label: `${alert.desc} (DIA ${alert.dueDay})`,
      amount: alert.amount,
      targetTab: "contas-pagar",
      targetRhView: null,
      targetEmployeeId: null,
      rawId: alert.id,
    }));

    const rhAlerts = payrollAlerts.map((alert) => ({
      id: alert.id,
      title: alert.title,
      label: alert.description,
      amount: alert.amount,
      targetTab: alert.targetTab || "rh",
      targetRhView: alert.targetRhView || "fixed",
      targetEmployeeId: alert.targetEmployeeId || null,
      rawId: alert.id,
    }));

    return [...costAlerts, ...rhAlerts].sort((a, b) => b.amount - a.amount);
  }, [prioritizedAlerts, payrollAlerts]);

  const primaryAlert = unifiedAlerts[0] || null;
  const additionalAlertsCount = Math.max(unifiedAlerts.length - 1, 0);

  const closingRange = useMemo(
    () =>
      buildClosingRange(
        closingFilterType,
        closingReferenceDate,
        closingRangeStart,
        closingRangeEnd,
      ),
    [
      closingFilterType,
      closingReferenceDate,
      closingRangeStart,
      closingRangeEnd,
    ],
  );

  const closingSummary = useMemo(() => {
    const isInsideClosingRange = (date) => {
      const normalized = normalizeDate(date);
      if (!normalized) return false;
      return normalized >= closingRange.start && normalized <= closingRange.end;
    };

    const filteredTransactions = transactions
      .map((transaction) => ({
        ...transaction,
        parsedDate: normalizeDate(parseIsoDate(transaction.date)),
      }))
      .filter((transaction) => isInsideClosingRange(transaction.parsedDate));

    const recurringCostEntries = recurringCosts
      .filter((cost) => cost.lastPaidMonth)
      .map((cost) => {
        const [year, month] = String(cost.lastPaidMonth).split("-").map(Number);
        if (!year || !month) return null;
        const safeDay = Math.min(
          Number(cost.dueDay) || 1,
          new Date(year, month, 0).getDate(),
        );
        const paymentDate = new Date(year, month - 1, safeDay);
        return {
          id: `fixed-${cost.id}-${cost.lastPaidMonth}`,
          kind: "custo_fixo",
          title: cost.desc,
          category: "Custo Fixo",
          date: normalizeDate(paymentDate),
          amount: Number(cost.amount) || 0,
          note: "Custo fixo marcado como pago",
        };
      })
      .filter((entry) => entry && isInsideClosingRange(entry.date));

    const payrollEntries = payrollAlerts
      .filter((alert) => alert.date && isInsideClosingRange(alert.date))
      .map((alert) => ({
        id: `payroll-${alert.id}`,
        kind: "folha",
        title: alert.title,
        category: "Folha / RH",
        date: normalizeDate(alert.date),
        amount: Number(alert.amount) || 0,
        note: alert.description,
      }));

    const ledgerEntries = [
      ...filteredTransactions.map((transaction) => ({
        id: `transaction-${transaction.id}`,
        kind: transaction.type,
        title: transaction.type === "receita" ? "Entrada" : "Saída",
        category: transaction.category,
        date: transaction.parsedDate,
        amount: Number(transaction.amount) || 0,
        net: Number(transaction.net) || 0,
        payment: transaction.payment,
        platform: transaction.platform,
        note: transaction.note || "",
      })),
      ...recurringCostEntries,
      ...payrollEntries,
    ].sort((a, b) => b.date - a.date);

    const receitaBruta = filteredTransactions
      .filter((transaction) => transaction.type === "receita")
      .reduce((acc, transaction) => acc + (Number(transaction.amount) || 0), 0);

    const receitaLiquida = filteredTransactions
      .filter((transaction) => transaction.type === "receita")
      .reduce((acc, transaction) => acc + (Number(transaction.net) || 0), 0);

    const taxasCanais = filteredTransactions
      .filter((transaction) => transaction.type === "receita")
      .reduce(
        (acc, transaction) =>
          acc +
          ((Number(transaction.amount) || 0) - (Number(transaction.net) || 0)),
        0,
      );

    const saidasLancadas = filteredTransactions
      .filter((transaction) => transaction.type === "despesa")
      .reduce((acc, transaction) => acc + (Number(transaction.amount) || 0), 0);

    const custosFixos = recurringCostEntries.reduce(
      (acc, entry) => acc + entry.amount,
      0,
    );
    const folhaSalarial = payrollEntries.reduce(
      (acc, entry) => acc + entry.amount,
      0,
    );
    const saldoPeriodo =
      receitaLiquida - saidasLancadas - custosFixos - folhaSalarial;

    if (closingFilterType === "mes") {
      const competenceMonth = `${closingRange.start.getFullYear()}-${String(closingRange.start.getMonth() + 1).padStart(2, "0")}`;
      const monthlyPayrollEntries = buildMonthlyPayrollEntries({
        month: competenceMonth,
        employees,
        employeeWorkLogs,
      });
      const dre = calculateMonthlyDre({
        month: competenceMonth,
        transactions,
        recurringCosts,
        payrollEntries: monthlyPayrollEntries,
        obligations: financialObligations,
        inventoryCmvSummaries: supplyChainData.monthlyInventorySummaries || [],
      });
      const monthObligations = filterObligationsByMonth(
        financialObligations,
        competenceMonth,
      );
      const obligationLedger = monthObligations.map((item) => ({
        id: `obligation-${item.id}`,
        kind: "obrigacao",
        title: item.description,
        category: String(item.economicCategory || "Obrigação").replaceAll(
          "_",
          " ",
        ),
        date: normalizeDate(
          parseIsoDate(item.dueDate || `${competenceMonth}-01`),
        ),
        amount: Number(item.totalAmount || 0),
        note: `Competência ${competenceMonth}`,
      }));
      const transactionLedger = ledgerEntries.filter(
        (entry) => entry.kind === "receita" || entry.kind === "despesa",
      );

      return {
        ledgerEntries: [...transactionLedger, ...obligationLedger].sort(
          (a, b) => b.date - a.date,
        ),
        receitasCount: dre.sourceCounts.revenues,
        despesasCount: dre.sourceCounts.expenses + monthObligations.length,
        receitaBruta: dre.revenueGross,
        receitaLiquida: dre.revenueNet,
        taxasCanais: dre.revenueDeductions,
        saidasLancadas:
          dre.costOfSales +
          dre.sellingExpenses +
          dre.financialExpenses +
          dre.incomeTaxes,
        custosFixos: dre.administrativeExpenses,
        folhaSalarial: 0,
        saldoPeriodo: dre.netIncome,
        accountingBasis: "COMPETENCE",
      };
    }

    return {
      ledgerEntries,
      receitasCount: filteredTransactions.filter(
        (transaction) => transaction.type === "receita",
      ).length,
      despesasCount: filteredTransactions.filter(
        (transaction) => transaction.type === "despesa",
      ).length,
      receitaBruta,
      receitaLiquida,
      taxasCanais,
      saidasLancadas,
      custosFixos,
      folhaSalarial,
      saldoPeriodo,
      accountingBasis: "CASH",
    };
  }, [
    closingFilterType,
    closingRange,
    employeeWorkLogs,
    employees,
    financialObligations,
    payrollAlerts,
    recurringCosts,
    supplyChainData.monthlyInventorySummaries,
    transactions,
  ]);

  const financeTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, financeMonth),
    [transactions, financeMonth],
  );
  const visibleFinanceTransactions = useMemo(
    () =>
      financeTransactions.filter((transaction) => {
        if (financeSourceFilter === "ALL") return true;
        const imported = isImportedFinancialTransaction(transaction);
        return financeSourceFilter === "IMPORTED" ? imported : !imported;
      }),
    [financeTransactions, financeSourceFilter],
  );
  // Handlers
  const handleCreateCustomer = async (payload) => {
    const customer = await customersApi.saveCustomer(tenantSlug, payload);
    setCustomers((prev) => [
      customer,
      ...prev.filter((current) => current.id !== customer.id),
    ]);
    return customer;
  };

  const handleCreatePaymentMethod = async (payload) => {
    const paymentMethod = await paymentMethodsApi.savePaymentMethod(
      tenantSlug,
      payload,
    );
    setPaymentMethods((prev) => [
      ...prev.filter((current) => current.id !== paymentMethod.id),
      paymentMethod,
    ]);
    return paymentMethod;
  };

  const handleCreateOrder = async (payload) => {
    const order = await ordersApi.saveOrder(tenantSlug, payload);
    setOrders((prev) => [
      order,
      ...prev.filter((current) => current.id !== order.id),
    ]);
    return order;
  };

  const handleUpdateOrder = async (payload) => {
    const order = await ordersApi.saveOrder(tenantSlug, payload);
    setOrders((prev) =>
      prev.map((current) => (current.id === order.id ? order : current)),
    );
    return order;
  };

  /** Registra somente entradas e saídas realizadas/manualizadas. */
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const type = String(fd.get("type") || "");
    const amount = parseFloat(fd.get("amount")) || 0;
    const reference = String(fd.get("reference") || "").trim();
    const payment = String(fd.get("payment") || "").trim();
    const date = String(fd.get("date") || "").trim();

    setFinanceError("");
    setFinanceSuccess("");

    if (!["receita", "despesa"].includes(type)) {
      setFinanceError("Selecione o tipo de lançamento.");
      return;
    }

    if (amount <= 0) {
      setFinanceError("Informe um valor maior que zero.");
      return;
    }

    if (!reference) {
      setFinanceError(
        type === "receita"
          ? "Selecione o canal da entrada."
          : "Selecione a categoria da saída.",
      );
      return;
    }

    if (!payment) {
      setFinanceError("Selecione a forma de pagamento.");
      return;
    }

    if (!date) {
      setFinanceError("Informe a data do lançamento.");
      return;
    }

    setIsFinanceSubmitting(true);
    try {
      const payload = {
        type,
        date,
        payment,
        amount,
        reference,
        dueDay: parseInt(fd.get("dueDay"), 10) || 1,
        note: fd.get("note") || "",
        economicCategory: fd.get("economicCategory") || "",
        financialOrigin: fd.get("financialOrigin") || "",
        forecastType: fd.get("forecastType") || "FIXED",
      };

      const response = await financeApi.createTransaction(tenantSlug, payload);

      setTransactions((prev) => [response.transaction, ...prev]);
      setDreMonth(date.slice(0, 7));

      e.target.reset();
      setFinanceFormType("receita");
      setFinanceSuccess(
        type === "receita"
          ? "Entrada registrada com sucesso. A DRE foi atualizada para o mês deste lançamento."
          : "Saída registrada com sucesso. A DRE foi atualizada para o mês deste lançamento.",
      );
    } catch (apiError) {
      setFinanceError(
        apiError.message || "Não foi possível registrar o lançamento agora.",
      );
    } finally {
      setIsFinanceSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    setFinanceError("");
    setFinanceSuccess("");
    setIsFinanceSubmitting(true);
    try {
      await deletePersistedTransaction({
        tenantSlug,
        transactionId,
        deleteTransaction: (slug, id) =>
          financeApi.deleteTransaction(slug, id),
        updateTransactions: setTransactions,
      });
      setFinanceSuccess("Lançamento excluído definitivamente.");
    } catch (apiError) {
      setFinanceError(
        apiError.message || "Não foi possível excluir o lançamento agora.",
      );
    } finally {
      setIsFinanceSubmitting(false);
    }
  };

  const handleCreateRecurringCost = async (payload) => {
    setIsFinanceSubmitting(true);
    try {
      const recurringCost = await financeApi.createRecurringCost(tenantSlug, {
        desc: payload.description,
        amount: payload.amount,
        dueDay: payload.dueDay,
        category: payload.economicCategory,
        forecastType: payload.forecastType,
        recurrence: payload.recurrence,
        weekday: payload.weekday,
        effectiveFrom: payload.startDate,
        note: payload.note,
      });
      if (!recurringCost?.id)
        throw new Error("O servidor não confirmou o cadastro recorrente.");
      const bootstrap = await appApi.getBootstrap(tenantSlug);
      setRecurringCosts(bootstrap.recurringCosts || []);
      setFinancialObligations(bootstrap.financialObligations || []);
      return recurringCost;
    } finally {
      setIsFinanceSubmitting(false);
    }
  };

  const handleSaveSalesChannel = async (payload) => {
    setIsFinanceSubmitting(true);
    try {
      const channel = payload.id
        ? await financeApi.updateSalesChannel(tenantSlug, payload)
        : await financeApi.createSalesChannel(tenantSlug, payload);
      setSalesChannels((prev) =>
        payload.id
          ? prev.map((item) => (item.id === channel.id ? channel : item))
          : [...prev, channel],
      );
      return channel;
    } finally {
      setIsFinanceSubmitting(false);
    }
  };

  const handleSaveDailyRevenue = async (payload) => {
    setIsFinanceSubmitting(true);
    setFinanceError("");
    setFinanceSuccess("");
    try {
      await financeApi.saveDailyRevenue(tenantSlug, payload);
      const bootstrap = await appApi.getBootstrap(tenantSlug);
      setTransactions(bootstrap.transactions || []);
      setDailyCashReconciliations(bootstrap.dailyCashReconciliations || []);
      setChannelSettlements(bootstrap.channelSettlements || []);
      setDreMonth(payload.date.slice(0, 7));
      setFinanceMonth(payload.date.slice(0, 7));
      setFinanceSuccess(
        "Entrada diária salva sem duplicar a receita. Caixa, banco e recebíveis foram separados.",
      );
    } finally {
      setIsFinanceSubmitting(false);
    }
  };

  const handleReceiveChannelSettlement = async (payload) => {
    setIsFinanceSubmitting(true);
    try {
      await financeApi.receiveChannelSettlement(tenantSlug, payload);
      const bootstrap = await appApi.getBootstrap(tenantSlug);
      setTransactions(bootstrap.transactions || []);
      setChannelSettlements(bootstrap.channelSettlements || []);
      setFinanceSuccess(
        "Repasse confirmado no banco sem criar receita duplicada.",
      );
    } finally {
      setIsFinanceSubmitting(false);
    }
  };

  const handleDeleteSalesChannel = async (id) => {
    setIsFinanceSubmitting(true);
    try {
      await financeApi.deleteSalesChannel(tenantSlug, id);
      setSalesChannels((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setIsFinanceSubmitting(false);
    }
  };

  const handleCatalogExcelImport = async ({ ingredientsRows, recipeRows }) => {
    const nextIngredients = [...ingredients];
    const idMap = new Map(
      ingredients.map((item) => [String(item.id), item.id]),
    );
    for (const row of ingredientsRows) {
      const name = String(row.Nome || "").trim();
      if (!name) continue;
      const importedId = String(row["ID do insumo"] || "").trim();
      const existing =
        ingredients.find((item) => String(item.id) === importedId) ||
        ingredients.find(
          (item) => item.name.toLowerCase() === name.toLowerCase(),
        );
      const saved = await catalogApi.saveIngredient(tenantSlug, {
        id: existing?.id,
        name,
        unit: String(row.Unidade || existing?.unit || "un").trim(),
        unitCost: Number(row["Custo unitário"]) || 0,
      });
      const index = nextIngredients.findIndex((item) => item.id === saved.id);
      if (index >= 0) nextIngredients[index] = saved;
      else nextIngredients.push(saved);
      if (importedId) idMap.set(importedId, saved.id);
    }
    const grouped = recipeRows.reduce((groups, row) => {
      const key = String(row["ID do produto"] || row.Produto || "").trim();
      if (!key) return groups;
      (groups[key] ||= []).push(row);
      return groups;
    }, {});
    const nextProducts = [...products];
    for (const rows of Object.values(grouped)) {
      const first = rows[0];
      const name = String(first.Produto || "").trim();
      if (!name) continue;
      const importedId = String(first["ID do produto"] || "").trim();
      const existing =
        products.find((item) => String(item.id) === importedId) ||
        products.find((item) => item.name.toLowerCase() === name.toLowerCase());
      const recipe = rows
        .map((row) => {
          const type = String(row["Tipo do componente"] || "ingredient").trim();
          const sourceId = String(row["ID do componente"] || "").trim();
          const componentId =
            type === "ingredient" ? idMap.get(sourceId) || sourceId : sourceId;
          if (!componentId)
            throw new Error(`Componente inválido no produto ${name}.`);
          return {
            componentType: type,
            componentId,
            quantity: Number(row.Quantidade) || 0,
            quantityUnit: String(row.Unidade || "").trim(),
          };
        })
        .filter((line) => line.quantity > 0);
      if (!recipe.length)
        throw new Error(
          `A ficha técnica de ${name} precisa ter ao menos um componente com quantidade.`,
        );
      const saved = await catalogApi.saveProduct(tenantSlug, {
        id: existing?.id,
        name,
        salePrice: Number(first["Preço de venda"]) || 0,
        yieldQuantity: Number(first.Rendimento) || 1,
        targetCmvPercent: Number(first["CMV alvo (%)"]) || 30,
        recipe,
      });
      const index = nextProducts.findIndex((item) => item.id === saved.id);
      if (index >= 0) nextProducts[index] = saved;
      else nextProducts.push(saved);
    }
    setIngredients(nextIngredients);
    setProducts(nextProducts);
    setSettingsError("");
  };

  const refreshFinancialObligations = async () => {
    const result = await financeApi.getObligations(tenantSlug);
    setFinancialObligations(result.obligations || []);
    setRecurringCostDuplicateCandidates(result.duplicateCandidates || []);
    return result;
  };

  useEffect(() => {
    if (
      bootstrapLoading ||
      activeTab !== "contas-pagar" ||
      !tenantSlug ||
      tenantSlug === "default"
    )
      return;
    let cancelled = false;
    Promise.all([
      financeApi.getObligations(tenantSlug),
      hrApi.getFixedPayroll(tenantSlug, financeMonth),
    ])
      .then(([result, payrollData]) => {
        if (cancelled) return;
        const obligations = enrichObligationsWithFixedPayroll(
          result.obligations || [],
          payrollData.statements || [],
          financeMonth,
        );
        setFinancialObligations(obligations);
        setRecurringCostDuplicateCandidates(result.duplicateCandidates || []);
      })
      .catch((error) => {
        if (!cancelled)
          setFinanceError(
            error.message || "Não foi possível detalhar as contas a pagar.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, tenantSlug, bootstrapLoading, financeMonth]);

  const handleResolveRecurringCostDuplicate = async (payload) => {
    const result = await runSavingMutation(
      `obligation-duplicate-${payload.id}`,
      () => financeApi.resolveObligationDuplicate(tenantSlug, payload),
    );
    if (!result) return;
    await refreshFinancialObligations();
  };

  const handlePayFinancialObligation = async (payload) => {
    const result = await runSavingMutation(
      `obligation-payment-${payload.obligationId}`,
      () => financeApi.addObligationPayment(tenantSlug, payload),
    );
    if (!result) return;
    setFinancialPayments((prev) => [
      result.payment,
      ...prev.filter((item) => item.id !== result.payment.id),
    ]);
    if (result.obligation.extraWeeklyClosingId) {
      setExtraWeeklyClosings((prev) =>
        prev.map((item) =>
          String(item.id) === String(result.obligation.extraWeeklyClosingId)
            ? {
                ...item,
                paidAmount: result.obligation.paidAmount,
                paidAt:
                  result.obligation.status === "PAID"
                    ? result.payment.paymentDate
                    : null,
                status:
                  result.obligation.status === "PAID" ? "paid" : "partial",
              }
            : item,
        ),
      );
    }
    await refreshFinancialObligations();
    const reconciliations = await financeApi.getCashReconciliations(tenantSlug);
    setDailyCashReconciliations(reconciliations || []);
  };

  const handleUpdateFinancialObligation = async (payload) => {
    const result = await runSavingMutation(
      `obligation-update-${payload.id}`,
      () => financeApi.updateObligation(tenantSlug, payload),
    );
    if (result)
      setFinancialObligations((prev) =>
        prev.map((item) => (item.id === result.id ? result : item)),
      );
  };

  const handleSaveCashReconciliation = async (payload) => {
    await runSavingMutation(`cash-reconciliation-${payload.date}`, () =>
      financeApi.saveCashReconciliation(tenantSlug, payload),
    );
    const rows = await financeApi.getCashReconciliations(tenantSlug);
    setDailyCashReconciliations(rows || []);
  };

  const refreshSupplyChain = async ({ refreshCatalog = false } = {}) => {
    const [supplyData, balanceData, obligationData, bootstrap] =
      await Promise.all([
        supplyChainApi.getData(tenantSlug),
        financeApi.getBalances(tenantSlug),
        financeApi.getObligations(tenantSlug),
        refreshCatalog
          ? appApi.getBootstrap(tenantSlug)
          : Promise.resolve(null),
      ]);
    setSupplyChainData(supplyData || {});
    setFinancialBalances(balanceData || { periods: [], movements: [] });
    setFinancialObligations(obligationData.obligations || []);
    setRecurringCostDuplicateCandidates(
      obligationData.duplicateCandidates || [],
    );
    if (bootstrap) {
      setIngredients(bootstrap.ingredients || []);
      setTransactions(bootstrap.transactions || []);
      setFinancialPayments(bootstrap.financialPayments || []);
    }
  };

  const runSupplyMutation = async (key, action, options) => {
    const result = await runSavingMutation(key, action);
    if (result) await refreshSupplyChain(options);
    return result;
  };

  const handleSaveSupplier = (payload) =>
    runSupplyMutation("supplier-save", () =>
      supplyChainApi.saveSupplier(tenantSlug, payload),
    );
  const handleDeleteSupplier = (id) =>
    runSupplyMutation(`supplier-delete-${id}`, () =>
      supplyChainApi.deleteSupplier(tenantSlug, id),
    );
  const handleSavePurchaseOrder = (payload) =>
    runSupplyMutation("purchase-order-save", () =>
      supplyChainApi.saveOrder(tenantSlug, payload),
    );
  const handlePurchaseOrderStatus = (payload) =>
    runSupplyMutation(`purchase-order-status-${payload.id}`, () =>
      supplyChainApi.changeOrderStatus(tenantSlug, payload),
    );
  const handleReceivePurchaseOrder = (payload) =>
    runSupplyMutation(
      `purchase-receipt-${payload.purchaseOrderId}`,
      () => supplyChainApi.receiveOrder(tenantSlug, payload),
      { refreshCatalog: true },
    );
  const handleReversePurchaseReceipt = (payload) =>
    runSupplyMutation(
      `purchase-receipt-reverse-${payload.id}`,
      () => supplyChainApi.reverseReceipt(tenantSlug, payload),
      { refreshCatalog: true },
    );
  const handleSaveInventory = (payload) =>
    runSupplyMutation(
      `inventory-save-${payload.competenceMonth}-${payload.countType}`,
      () => supplyChainApi.saveInventory(tenantSlug, payload),
    );
  const handleInventoryStatus = (payload) =>
    runSupplyMutation(`inventory-status-${payload.id}`, () =>
      supplyChainApi.changeInventoryStatus(tenantSlug, payload),
    );
  const handleSaveBalancePeriod = (payload) =>
    runSupplyMutation(`balance-save-${payload.competenceMonth}`, () =>
      financeApi.saveBalancePeriod(tenantSlug, payload),
    );
  const handleSaveAccountMovement = (payload) =>
    runSupplyMutation(`balance-movement-${payload.date}-${payload.kind}`, () =>
      financeApi.saveAccountMovement(tenantSlug, payload),
    );
  const handleReverseAccountMovement = (payload) =>
    runSupplyMutation(`balance-movement-reverse-${payload.id}`, () =>
      financeApi.reverseAccountMovement(tenantSlug, payload),
    );
  const handleBalanceStatus = (payload) =>
    runSupplyMutation(`balance-status-${payload.id}`, () =>
      financeApi.changeBalanceStatus(tenantSlug, payload),
    );
  const handleIntegratedClose = (payload) => {
    const month = payload.competenceMonth;
    const payrollEntries = buildMonthlyPayrollEntries({
      month,
      employees,
      employeeWorkLogs,
    });
    const dreSnapshot = calculateMonthlyDre({
      month,
      transactions,
      recurringCosts,
      payrollEntries,
      obligations: financialObligations,
      inventoryCmvSummaries: supplyChainData.monthlyInventorySummaries || [],
    });
    return runSupplyMutation(`integrated-close-${month}`, () =>
      financeApi.closeIntegratedMonth(tenantSlug, { ...payload, dreSnapshot }),
    );
  };

  const createEmptyEmployeeForm = () => ({
    name: "",
    phone: "",
    email: "",
    address: "",
    maritalStatus: "",
    role: "",
    notes: "",
    employmentType: "fixed",
    status: "active",
    salary: "",
    admissionDate: "",
    discounts: [],
    paymentMode: "weekly",
    baseAmount: "",
    weekday: "1",
    specificDate: "",
    startDate: "",
    dailyRateTypes: [],
    controlAttendance: true,
    attendanceControlFrom: new Date().toISOString().slice(0, 10),
    weeklyDayOff: "",
    monthlySundayOffOrdinal: "",
    firstPaymentPercentage: payrollConfig.advancePercentage ?? 40,
    finalPaymentPercentage: payrollConfig.salaryPercentage ?? 60,
    scheduledDaysOff: [],
    newDayOffDate: "",
  });

  const openCreateEmployeeModal = (type = "fixed") => {
    setRhError("");
    setEditingEmployeeId(null);
    setEmployeeForm({
      ...createEmptyEmployeeForm(),
      employmentType: type,
      dailyRateTypes:
        type === "external"
          ? [
              {
                clientKey: `daily-rate-${Date.now()}`,
                name: "Diária padrão",
                amount: "",
                appliesWeekdays: true,
                appliesWeekends: true,
                active: true,
              },
            ]
          : [],
    });
    setIsEmployeeModalOpen(true);
  };

  const openEditEmployeeModal = (employee) => {
    setRhError("");
    setEditingEmployeeId(employee.id);
    setEmployeeForm({
      ...createEmptyEmployeeForm(),
      ...employee,
      salary: employee.salary || "",
      baseAmount: employee.baseAmount || "",
      dailyRateTypes: (employee.dailyRateTypes || []).map((type) => ({
        ...type,
      })),
      scheduledDaysOff: (employee.scheduledDaysOff || [])
        .filter((item) => item.active !== false)
        .map((item) => ({ ...item })),
      weeklyDayOff:
        employee.weeklyDayOff ??
        (employee.scheduledDaysOff || []).find(
          (item) => item.kind === "WEEKLY" && item.active !== false,
        )?.weekday ??
        "",
      monthlySundayOffOrdinal: employee.monthlySundayOffOrdinal ?? "",
      firstPaymentPercentage:
        employee.firstPaymentPercentage ?? payrollConfig.advancePercentage ?? 40,
      finalPaymentPercentage:
        employee.finalPaymentPercentage ?? payrollConfig.salaryPercentage ?? 60,
    });
    setIsEmployeeModalOpen(true);
  };

  const handleSubmitEmployee = async (e) => {
    e.preventDefault();
    if (isSavingMutation("employee")) return;

    const isFixed = employeeForm.employmentType === "fixed";
    const isManagement = String(employeeForm.role || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .startsWith("geren");
    const dailyRateTypes = !isFixed
      ? (employeeForm.dailyRateTypes || []).map((type) => ({
          id: type.id || undefined,
          name: String(type.name || "").trim(),
          amount: parseFloat(type.amount) || 0,
          appliesWeekdays: type.appliesWeekdays !== false,
          appliesWeekends: type.appliesWeekends !== false,
          active: type.active !== false,
        }))
      : [];
    const payload = {
      id: editingEmployeeId || undefined,
      name: employeeForm.name.trim(),
      phone: employeeForm.phone,
      email: employeeForm.email,
      address: employeeForm.address,
      maritalStatus: employeeForm.maritalStatus,
      role: employeeForm.role,
      notes: employeeForm.notes,
      employmentType: employeeForm.employmentType,
      status: employeeForm.status,
      discounts: isFixed
        ? editingEmployeeId
          ? employees.find((item) => item.id === editingEmployeeId)
              ?.discounts || []
          : []
        : [],
      salary: isFixed ? parseFloat(employeeForm.salary) || 0 : 0,
      admissionDate: isFixed ? employeeForm.admissionDate : "",
      paymentMode: !isFixed ? employeeForm.paymentMode : "",
      baseAmount: !isFixed ? Number(dailyRateTypes[0]?.amount || 0) : 0,
      dailyRateTypes,
      weekday:
        !isFixed && employeeForm.paymentMode === "weekly"
          ? employeeForm.weekday
          : "",
      specificDate:
        !isFixed && employeeForm.paymentMode === "one_off"
          ? employeeForm.specificDate
          : "",
      startDate: !isFixed ? employeeForm.startDate : "",
      controlAttendance:
        isFixed && !isManagement,
      attendanceControlFrom:
        isFixed && !isManagement
          ? employeeForm.attendanceControlFrom
          : "",
      weeklyDayOff:
        isFixed && !isManagement
          ? employeeForm.weeklyDayOff
          : null,
      monthlySundayOffOrdinal:
        isFixed && !isManagement
          ? employeeForm.monthlySundayOffOrdinal
          : null,
      firstPaymentPercentage: isFixed
        ? Number(employeeForm.firstPaymentPercentage)
        : null,
      finalPaymentPercentage: isFixed
        ? Number(employeeForm.finalPaymentPercentage)
        : null,
    };

    if (!payload.name)
      return setRhError("Informe o nome completo do funcionário.");
    if (!payload.role)
      return setRhError(
        "Selecione um cargo. Se a lista estiver vazia, cadastre um cargo em “Cargos RH”.",
      );
    if (isFixed && payload.salary <= 0)
      return setRhError("Informe um salário maior que zero.");
    if (isFixed && payload.controlAttendance && !payload.attendanceControlFrom)
      return setRhError("Informe a data inicial do controle de faltas.");
    if (
      isFixed &&
      payload.controlAttendance &&
      (payload.weeklyDayOff === "" || payload.weeklyDayOff == null)
    )
      return setRhError("Informe o dia da folga semanal.");
    if (
      isFixed &&
      payload.controlAttendance &&
      (payload.monthlySundayOffOrdinal === "" ||
        payload.monthlySundayOffOrdinal == null)
    )
      return setRhError("Informe qual domingo do mês será a folga.");
    if (
      isFixed &&
      Math.abs(
        payload.firstPaymentPercentage + payload.finalPaymentPercentage - 100,
      ) > 0.001
    )
      return setRhError(
        "A regra individual de pagamento deve totalizar exatamente 100%.",
      );
    if (!isFixed && !payload.dailyRateTypes.length)
      return setRhError("Adicione ao menos um Tipo de Diária.");
    if (
      !isFixed &&
      payload.dailyRateTypes.some((type) => !type.name || type.amount <= 0)
    )
      return setRhError(
        "Preencha o nome e um valor maior que zero em todos os Tipos de Diária.",
      );
    if (
      !isFixed &&
      payload.dailyRateTypes.some(
        (type) => !type.appliesWeekdays && !type.appliesWeekends,
      )
    )
      return setRhError(
        "Cada Tipo de Diária deve valer durante a semana, no fim de semana ou nos dois períodos.",
      );

    await runSavingMutation("employee", async () => {
      try {
        setRhError("");
        const savedEmployee = await hrApi.saveEmployee(tenantSlug, payload);

        if (isFixed) {
          const originalDaysOff = editingEmployeeId
            ? (
                employees.find((item) => item.id === editingEmployeeId)
                  ?.scheduledDaysOff || []
              ).filter((item) => item.active !== false)
            : [];
          const desiredDaysOff = payload.controlAttendance
            ? (employeeForm.scheduledDaysOff || []).filter(
                (item) => item.active !== false && item.kind === "DATE",
              )
            : [];
          for (const dayOff of desiredDaysOff) {
            await hrApi.saveScheduledDayOff(tenantSlug, {
              ...dayOff,
              employeeId: savedEmployee.id,
            });
          }
          for (const removed of originalDaysOff.filter(
            (item) =>
              item.id &&
              !desiredDaysOff.some((desired) => desired.id === item.id),
          )) {
            await hrApi.cancelScheduledDayOff(tenantSlug, {
              id: removed.id,
              reason: "Removida na edição do cadastro do funcionário.",
            });
          }
        }

        const [refreshedBootstrap, obligationData, payrollData] =
          await Promise.all([
            appApi.getBootstrap(tenantSlug),
            financeApi.getObligations(tenantSlug),
            hrApi.getFixedPayroll(tenantSlug, fixedPayrollMonth),
          ]);

        setEmployees((prev) => {
          return (
            refreshedBootstrap.employees ||
            (editingEmployeeId
              ? prev.map((item) =>
                  item.id === editingEmployeeId ? savedEmployee : item,
                )
              : [...prev, savedEmployee])
          );
        });
        setFinancialObligations(obligationData.obligations || []);
        setFixedPayrollData(payrollData);

        setIsEmployeeModalOpen(false);
        setEditingEmployeeId(null);
        setEmployeeForm(createEmptyEmployeeForm());
      } catch (error) {
        setRhError(
          error.message || "Não foi possível salvar o funcionário agora.",
        );
      }
    });
  };

  const requestDeleteEmployee = (employee) => {
    if (!employee?.id) return;
    setRhError("");
    setEmployeePendingDeletion(employee);
  };

  const handleDeleteEmployee = async () => {
    const employee = employeePendingDeletion;
    if (!employee?.id || isSavingMutation(`delete-employee-${employee.id}`))
      return;

    const result = await runSavingMutation(
      `delete-employee-${employee.id}`,
      () => hrApi.deleteEmployee(tenantSlug, employee.id),
    );
    if (!result) {
      setRhError(
        "O banco não confirmou a retirada do funcionário. O cadastro permanece ativo.",
      );
      return;
    }
    setEmployees((prev) =>
      prev.map((item) =>
        String(item.id) === String(employee.id)
          ? { ...item, status: "inactive" }
          : item,
      ),
    );
    setEmployeePendingDeletion(null);
  };

  const handleRestoreEmployee = async (employee) => {
    if (!employee?.id || isSavingMutation(`restore-employee-${employee.id}`))
      return;

    try {
      const restored = await runSavingMutation(
        `restore-employee-${employee.id}`,
        () =>
          hrApi.saveEmployee(tenantSlug, {
            ...employee,
            status: "active",
          }),
      );
      if (restored) {
        setEmployees((prev) =>
          prev.map((item) =>
            String(item.id) === String(restored.id) ? restored : item,
          ),
        );
      }
    } catch (error) {
      setSettingsError(
        error.message || "Não foi possível reativar o funcionário.",
      );
    }
  };

  const handleSaveWorkLog = async (payload) => {
    try {
      const saved = await runSavingMutation(
        `work-log-${payload.employeeId}`,
        () => hrApi.saveWorkLog(tenantSlug, payload),
      );
      if (!saved) return;
      setEmployeeWorkLogs((prev) => {
        const existingIndex = prev.findIndex(
          (item) =>
            String(item.id) === String(saved.id) ||
            (String(item.employeeId) === String(saved.employeeId) &&
              item.workDate === saved.workDate),
        );
        if (existingIndex < 0) return [saved, ...prev];
        return prev.map((item, index) =>
          index === existingIndex ? saved : item,
        );
      });
      const bootstrap = await appApi.getBootstrap(tenantSlug);
      setExtraWeeklyClosings(bootstrap.extraWeeklyClosings || []);
      await refreshFinancialObligations();
      if (payload.workDate?.slice(0, 7) === fixedPayrollMonth)
        await refreshFixedPayroll();
    } catch (error) {
      setSettingsError(
        error.message || "Não foi possível registrar a conferência diária.",
      );
    }
  };

  const handleSavePayrollConfig = async () => {
    try {
      const saved = await runSavingMutation("payroll-config", () =>
        hrApi.savePayrollConfig(tenantSlug, payrollConfig),
      );
      if (saved) setPayrollConfig(saved);
    } catch (error) {
      setSettingsError(
        error.message || "Não foi possível salvar as configurações de RH.",
      );
    }
  };

  const openEmployeeDiscountsModal = (employeeId) => {
    setSelectedEmployeeIdForDiscounts(employeeId);
    setPayrollAdjustmentError("");
    const today = new Date().toISOString().slice(0, 10);
    setPayrollAdjustmentDraft({
      adjustmentDate:
        today.slice(0, 7) === fixedPayrollMonth
          ? today
          : `${fixedPayrollMonth}-01`,
      category: "OTHER",
      description: "",
      amount: "",
      note: "",
    });
    setIsEmployeeDiscountsModalOpen(true);
  };

  const handleSavePayrollAdjustment = async () => {
    if (!selectedEmployeeIdForDiscounts) return;
    const amount = Number(payrollAdjustmentDraft.amount);
    if (
      !payrollAdjustmentDraft.adjustmentDate ||
      !payrollAdjustmentDraft.description.trim() ||
      amount <= 0
    ) {
      setPayrollAdjustmentError(
        "Informe data, descrição e valor maior que zero.",
      );
      return;
    }
    try {
      setPayrollAdjustmentError("");
      await runSavingMutation("payroll-adjustment", () =>
        hrApi.savePayrollAdjustment(tenantSlug, {
          ...payrollAdjustmentDraft,
          employeeId: selectedEmployeeIdForDiscounts,
          competenceMonth: fixedPayrollMonth,
          amount,
        }),
      );
      await Promise.all([refreshFixedPayroll(), refreshFinancialObligations()]);
      setPayrollAdjustmentDraft((previous) => ({
        ...previous,
        description: "",
        amount: "",
        note: "",
      }));
    } catch (error) {
      setPayrollAdjustmentError(
        error.message || "Não foi possível salvar o ajuste.",
      );
    }
  };

  const handleCancelPayrollAdjustment = async (adjustment, reason) => {
    try {
      setPayrollAdjustmentError("");
      await runSavingMutation(
        `cancel-payroll-adjustment-${adjustment.id}`,
        () =>
          hrApi.cancelPayrollAdjustment(tenantSlug, {
            id: adjustment.id,
            reason,
          }),
      );
      await Promise.all([refreshFixedPayroll(), refreshFinancialObligations()]);
    } catch (error) {
      setPayrollAdjustmentError(
        error.message || "Não foi possível cancelar o ajuste.",
      );
      throw error;
    }
  };

  const selectedEmployeeForDiscounts = useMemo(
    () =>
      employees.find(
        (employee) => employee.id === selectedEmployeeIdForDiscounts,
      ) || null,
    [employees, selectedEmployeeIdForDiscounts],
  );
  const selectedFixedPayrollStatement = useMemo(
    () =>
      (fixedPayrollData.statements || []).find(
        (statement) =>
          String(statement.employeeId) ===
          String(selectedEmployeeIdForDiscounts),
      ) || null,
    [fixedPayrollData.statements, selectedEmployeeIdForDiscounts],
  );
  const selectedPayrollAdjustments = useMemo(
    () =>
      (fixedPayrollData.adjustments || []).filter(
        (adjustment) =>
          String(adjustment.employeeId) ===
          String(selectedEmployeeIdForDiscounts),
      ),
    [fixedPayrollData.adjustments, selectedEmployeeIdForDiscounts],
  );

  const resetIngredientForm = () => {
    setEditingIngredientId(null);
    setIngredientForm({
      name: "",
      unit: ingredientUnits[0]?.label || "G",
      unitCost: "",
      category: "",
      stockMinimum: "",
      primarySupplierId: "",
      active: true,
    });
  };

  const resetPreparationForm = () => {
    setEditingPreparationId(null);
    setPreparationForm({
      name: "",
      yieldQuantity: "1",
      yieldUnit: ingredientUnits[0]?.label || "G",
    });
    setPreparationRecipeDraft([
      { id: Date.now() + 1, componentRef: "", quantity: "", quantityUnit: "" },
    ]);
  };

  useEffect(() => {
    const resolvedUnit = resolveUnitValue(ingredientUnits, ingredientForm.unit);
    if (resolvedUnit && resolvedUnit !== ingredientForm.unit) {
      setIngredientForm((prev) => ({
        ...prev,
        unit: resolvedUnit,
      }));
      return;
    }

    if (!resolvedUnit) {
      setIngredientForm((prev) => ({
        ...prev,
        unit: ingredientUnits[0]?.label || "",
      }));
    }
  }, [ingredientUnits, ingredientForm.unit]);

  useEffect(() => {
    const resolvedUnit = resolveUnitValue(
      ingredientUnits,
      preparationForm.yieldUnit,
    );
    if (resolvedUnit && resolvedUnit !== preparationForm.yieldUnit) {
      setPreparationForm((prev) => ({
        ...prev,
        yieldUnit: resolvedUnit,
      }));
      return;
    }

    if (!resolvedUnit) {
      setPreparationForm((prev) => ({
        ...prev,
        yieldUnit: ingredientUnits[0]?.label || "",
      }));
    }
  }, [ingredientUnits, preparationForm.yieldUnit]);

  useEffect(() => {
    if (activeTab !== "financeiro" && highlightedCostIds.length > 0) {
      setHighlightedCostIds([]);
    }
  }, [activeTab, highlightedCostIds]);

  useEffect(() => {
    if (activeTab === "costs") {
      setActiveTab("financeiro");
    }
  }, [activeTab]);

  const handleIngredientFormChange = (field, value) => {
    setIngredientForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitIngredient = async (e) => {
    e.preventDefault();
    if (isSavingMutation("ingredient")) return;
    const referenceCost = parseFloat(ingredientForm.unitCost) || 0;
    const referenceFactor = getIngredientCostReferenceFactor(
      ingredientForm.unit,
    );

    const payload = {
      name: ingredientForm.name.trim(),
      unit:
        resolveUnitValue(ingredientUnits, ingredientForm.unit) ||
        ingredientForm.unit,
      packageQuantity: referenceFactor,
      packageCost: referenceCost,
      unitCost:
        referenceFactor > 0 ? referenceCost / referenceFactor : referenceCost,
      category: ingredientForm.category.trim(),
      stockMinimum:
        ingredientForm.stockMinimum === ""
          ? null
          : Number(ingredientForm.stockMinimum),
      primarySupplierId: ingredientForm.primarySupplierId || null,
      active: ingredientForm.active,
    };

    if (!payload.name || !payload.unit || payload.unitCost <= 0) return;

    await runSavingMutation("ingredient", async () => {
      try {
        const savedIngredient = await catalogApi.saveIngredient(tenantSlug, {
          id: editingIngredientId || undefined,
          ...payload,
        });

        if (editingIngredientId) {
          setIngredients((prev) =>
            prev.map((ingredient) =>
              ingredient.id === savedIngredient.id
                ? savedIngredient
                : ingredient,
            ),
          );
        } else {
          setIngredients((prev) => [...prev, savedIngredient]);
        }

        setSettingsError("");
        resetIngredientForm();
        setIsIngredientModalOpen(false);
      } catch (apiError) {
        setSettingsError(
          apiError.message || "Não foi possível salvar o insumo.",
        );
      }
    });
  };

  const handleEditIngredient = (ingredient) => {
    setEditingIngredientId(ingredient.id);
    setIngredientForm({
      name: ingredient.name,
      unit:
        resolveUnitValue(ingredientUnits, ingredient.unit) || ingredient.unit,
      unitCost: String(
        Number(getIngredientCostReferenceValue(ingredient)).toFixed(2),
      ),
      category: ingredient.category || "",
      stockMinimum: ingredient.stockMinimum ?? "",
      primarySupplierId: ingredient.primarySupplierId || "",
      active: ingredient.active !== false,
    });
    setIsIngredientModalOpen(true);
  };

  const closeIngredientModal = () => {
    setIsIngredientModalOpen(false);
    resetIngredientForm();
  };

  const handleDeleteIngredient = async (ingredientId) => {
    try {
      const ingredient = ingredients.find((item) => item.id === ingredientId);
      if (!ingredient) return;
      const saved = await catalogApi.saveIngredient(tenantSlug, {
        ...ingredient,
        active: false,
      });
      setSettingsError("");
      setIngredients((prev) =>
        prev.map((item) => (item.id === ingredientId ? saved : item)),
      );

      if (editingIngredientId === ingredientId) {
        resetIngredientForm();
      }
    } catch (apiError) {
      setSettingsError(
        apiError.message || "Não foi possível remover o insumo.",
      );
    }
  };

  const handleAddRecipeLine = () => {
    setProductRecipeDraft((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        componentRef: "",
        quantity: "",
        quantityUnit: "",
      },
    ]);
  };

  const handleRecipeDraftChange = (id, field, value) => {
    setProductRecipeDraft((prev) =>
      prev.map((line) => {
        if (line.id !== id) return line;

        if (field === "componentRef") {
          const baseUnit = getComponentBaseUnit(
            value,
            ingredients,
            preparations,
          );
          return {
            ...line,
            componentRef: value,
            quantityUnit: getDefaultCompatibleUnit(baseUnit, ingredientUnits),
          };
        }

        return { ...line, [field]: value };
      }),
    );
  };

  const handleRemoveRecipeLine = (id) => {
    setProductRecipeDraft((prev) => prev.filter((line) => line.id !== id));
  };

  const handleProductFormChange = (field, value) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetProductEditForm = () => {
    setEditingProductId(null);
    setIsProductModalOpen(false);
    setProductForm({
      name: "",
      salePrice: "",
      yieldQuantity: "1",
      targetCmvPercent: "30",
    });
    setProductRecipeDraft([
      { id: Date.now(), componentRef: "", quantity: "", quantityUnit: "" },
    ]);
  };

  const buildProductRecipePayload = () =>
    productRecipeDraft
      .filter(
        (line) =>
          line.componentRef && line.quantityUnit && Number(line.quantity) > 0,
      )
      .map((line) => {
        const parsed = parseComponentValue(line.componentRef);
        const baseUnit = getComponentBaseUnit(
          line.componentRef,
          ingredients,
          preparations,
        );
        return {
          componentType: parsed.componentType,
          componentId: parsed.componentId,
          quantity: Number(line.quantity),
          quantityUnit:
            resolveCompatibleUnitValue(
              ingredientUnits,
              baseUnit,
              line.quantityUnit,
            ) || line.quantityUnit,
        };
      });

  const handlePreparationFormChange = (field, value) => {
    setPreparationForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddPreparationRecipeLine = () => {
    setPreparationRecipeDraft((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        componentRef: "",
        quantity: "",
        quantityUnit: "",
      },
    ]);
  };

  const handlePreparationRecipeDraftChange = (id, field, value) => {
    setPreparationRecipeDraft((prev) =>
      prev.map((line) => {
        if (line.id !== id) return line;

        if (field === "componentRef") {
          const baseUnit = getComponentBaseUnit(
            value,
            ingredients,
            preparations,
          );
          return {
            ...line,
            componentRef: value,
            quantityUnit: getDefaultCompatibleUnit(baseUnit, ingredientUnits),
          };
        }

        return { ...line, [field]: value };
      }),
    );
  };

  const handleRemovePreparationRecipeLine = (id) => {
    setPreparationRecipeDraft((prev) => prev.filter((line) => line.id !== id));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (isSavingMutation("product")) return;
    const fd = new FormData(e.target);
    const recipe = buildProductRecipePayload();

    if (recipe.length === 0) return;

    await runSavingMutation("product", async () => {
      try {
        const savedProduct = await catalogApi.saveProduct(tenantSlug, {
          name: fd.get("name"),
          salePrice: parseFloat(fd.get("salePrice")) || 0,
          yieldQuantity: parseFloat(fd.get("yieldQuantity")) || 1,
          targetCmvPercent: parseFloat(fd.get("targetCmvPercent")) || 30,
          recipe,
        });

        setProducts((prev) => [...prev, savedProduct]);
        setSettingsError("");
        setProductRecipeDraft([
          { id: Date.now(), componentRef: "", quantity: "", quantityUnit: "" },
        ]);
        e.target.reset();
      } catch (apiError) {
        setSettingsError(
          apiError.message || "Não foi possível salvar o produto.",
        );
      }
    });
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || "",
      salePrice: String(product.salePrice || ""),
      yieldQuantity: String(product.yieldQuantity || 1),
      targetCmvPercent: String(product.targetCmvPercent || 30),
    });
    const recipeDraft = (product.recipe || []).map((line) => {
      const componentRef = `${line.componentType}:${line.componentId}`;
      const baseUnit = getComponentBaseUnit(
        componentRef,
        ingredients,
        preparations,
      );
      return {
        id: Date.now() + Math.random(),
        componentRef,
        quantity: String(Number(line.quantity || 0).toFixed(2)),
        quantityUnit:
          resolveCompatibleUnitValue(
            ingredientUnits,
            baseUnit,
            line.quantityUnit,
          ) ||
          line.quantityUnit ||
          baseUnit,
      };
    });
    setProductRecipeDraft(
      recipeDraft.length > 0
        ? recipeDraft
        : [
            {
              id: Date.now(),
              componentRef: "",
              quantity: "",
              quantityUnit: "",
            },
          ],
    );
    setIsProductModalOpen(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (isSavingMutation("product")) return;
    if (!editingProductId) return;

    const recipe = buildProductRecipePayload();
    if (!productForm.name.trim() || recipe.length === 0) return;

    await runSavingMutation("product", async () => {
      try {
        const savedProduct = await catalogApi.saveProduct(tenantSlug, {
          id: editingProductId,
          name: productForm.name.trim(),
          salePrice: parseFloat(productForm.salePrice) || 0,
          yieldQuantity: parseFloat(productForm.yieldQuantity) || 1,
          targetCmvPercent: parseFloat(productForm.targetCmvPercent) || 30,
          recipe,
        });

        setProducts((prev) =>
          prev.map((product) =>
            idsEqual(product.id, savedProduct.id) ? savedProduct : product,
          ),
        );
        setSettingsError("");
        resetProductEditForm();
      } catch (apiError) {
        setSettingsError(
          apiError.message || "Não foi possível salvar o produto.",
        );
      }
    });
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await catalogApi.deleteProduct(tenantSlug, productId);
      setSettingsError("");
      setProducts((prev) => prev.filter((item) => item.id !== productId));
      if (idsEqual(editingProductId, productId)) {
        resetProductEditForm();
      }
    } catch (apiError) {
      setSettingsError(
        apiError.message || "Não foi possível remover o produto.",
      );
    }
  };

  const resetMenuItemForm = () => {
    setEditingMenuItemId(null);
    setMenuItemForm(createEmptyMenuItemForm(menuCategoryOptions[0] || ""));
    setMenuComponentSearch("");
  };

  const resetComboForm = () => {
    setEditingComboId(null);
    setComboForm(
      createEmptyComboForm(
        menuCategoryOptions.find((category) => category === "Combo") ||
          menuCategoryOptions[0] ||
          "Combo",
      ),
    );
  };

  const closeMenuItemModal = () => {
    setIsMenuItemModalOpen(false);
    resetMenuItemForm();
  };

  const closeComboModal = () => {
    setIsComboModalOpen(false);
    setComboError("");
    resetComboForm();
  };

  const handleMenuItemFormChange = (field, value) => {
    setMenuItemForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMenuItemPhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setMenuItemForm((prev) => ({ ...prev, photoPreview: "" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMenuItemForm((prev) => ({
        ...prev,
        photoPreview: typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleComboPhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setComboForm((prev) => ({ ...prev, photoPreview: "" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setComboForm((prev) => ({
        ...prev,
        photoPreview: typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleToggleMenuComponent = (componentKey) => {
    const component = menuComponentOptionByKey.get(componentKey);

    setMenuItemForm((prev) => {
      const alreadySelected = prev.linkedComponentIds[0] === componentKey;

      if (alreadySelected) {
        return {
          ...prev,
          salePrice: "",
          priceEditable: false,
          linkedComponentIds: [],
        };
      }

      return {
        ...prev,
        salePrice: component ? String(component.salePrice || "") : "",
        priceEditable: false,
        linkedComponentIds: component ? [componentKey] : [],
      };
    });
  };

  const handleComboFormChange = (field, value) => {
    setComboForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddComboGroup = () => {
    setComboForm((prev) => ({
      ...prev,
      comboGroups: [
        ...prev.comboGroups,
        createEmptyComboGroup(`Grupo ${prev.comboGroups.length + 1}`),
      ],
    }));
  };

  const handleDuplicateComboGroup = (groupId) => {
    setComboForm((prev) => {
      const group = prev.comboGroups.find((item) => item.id === groupId);
      if (!group) return prev;

      const duplicated = {
        ...group,
        id: createId(),
        name: `${group.name} Cópia`,
        options: group.options.map((option) => ({
          ...option,
          id: createId(),
        })),
      };

      return {
        ...prev,
        comboGroups: [...prev.comboGroups, duplicated],
      };
    });
  };

  const handleRemoveComboGroup = (groupId) => {
    setComboForm((prev) => {
      if (prev.comboGroups.length === 1) return prev;
      return {
        ...prev,
        comboGroups: prev.comboGroups.filter((group) => group.id !== groupId),
      };
    });
  };

  const handleComboGroupChange = (groupId, field, value) => {
    setComboForm((prev) => ({
      ...prev,
      comboGroups: prev.comboGroups.map((group) =>
        group.id === groupId ? { ...group, [field]: value } : group,
      ),
    }));
  };

  const handleReorderComboGroups = (nextGroups) => {
    setComboForm((prev) => ({
      ...prev,
      comboGroups: withSequentialSortOrder(nextGroups),
    }));
  };

  const handleAddComboOption = (groupId) => {
    setComboForm((prev) => ({
      ...prev,
      comboGroups: prev.comboGroups.map((group) =>
        group.id === groupId
          ? { ...group, options: [...group.options, createEmptyComboOption()] }
          : group,
      ),
    }));
  };

  const handleRemoveComboOption = (groupId, optionId) => {
    setComboForm((prev) => ({
      ...prev,
      comboGroups: prev.comboGroups.map((group) => {
        if (group.id !== groupId) return group;
        if (group.options.length === 1) return group;
        return {
          ...group,
          options: group.options.filter((option) => option.id !== optionId),
        };
      }),
    }));
  };

  const handleComboOptionChange = (groupId, optionId, field, value) => {
    setComboForm((prev) => ({
      ...prev,
      comboGroups: prev.comboGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((option) => {
                if (option.id !== optionId) return option;
                if (field === "linkedCategoryNames") {
                  const linkedCategoryNames = Array.isArray(value) ? value : [];
                  const linkedCategoryName = linkedCategoryNames[0] || "";
                  const linkedComponentRefs = normalizeComboOptionLinking(
                    option,
                  ).linkedComponentRefs.filter((componentRef) => {
                    const parsed = parseComponentValue(componentRef);
                    const linkedItem =
                      parsed.componentType === "menu-item"
                        ? findById(menuItems, parsed.componentId)
                        : null;
                    return (
                      linkedItem &&
                      linkedCategoryNames.includes(linkedItem.category)
                    );
                  });

                  return {
                    ...option,
                    linkedCategoryName,
                    linkedCategoryNames,
                    linkedComponentRef: linkedComponentRefs[0] || "",
                    linkedComponentRefs,
                  };
                }
                if (field === "linkedComponentRef") {
                  return {
                    ...option,
                    linkedComponentRef: value,
                    linkedComponentRefs: value ? [value] : [],
                  };
                }
                if (field === "linkedCategoryName") {
                  const linkedCategoryNames = value ? [value] : [];
                  return {
                    ...option,
                    linkedCategoryName: value,
                    linkedCategoryNames,
                    linkedComponentRef: "",
                    linkedComponentRefs: [],
                  };
                }
                if (field === "linkedComponentRefs") {
                  const linkedComponentRefs = Array.isArray(value) ? value : [];
                  return {
                    ...option,
                    linkedComponentRef: linkedComponentRefs[0] || "",
                    linkedComponentRefs,
                  };
                }
                return { ...option, [field]: value };
              }),
            }
          : group,
      ),
    }));
  };

  const handleReorderComboOptions = (groupId, nextOptions) => {
    setComboForm((prev) => ({
      ...prev,
      comboGroups: prev.comboGroups.map((group) =>
        group.id === groupId
          ? { ...group, options: withSequentialSortOrder(nextOptions) }
          : group,
      ),
    }));
  };

  const handleSubmitMenuItem = async (e) => {
    e.preventDefault();
    if (isSavingMutation("menuItem")) return;
    const selectedComponentKey = menuItemForm.linkedComponentIds[0] || "";
    const selectedProductId =
      parseComponentValue(selectedComponentKey).componentId;
    const selectedProduct = products.find((product) =>
      idsEqual(product.id, selectedProductId),
    );
    const nextSalePrice = parseFloat(menuItemForm.salePrice) || 0;

    const payload = {
      name: menuItemForm.name.trim(),
      category: menuItemForm.category,
      description: menuItemForm.description.trim(),
      status: menuItemForm.status,
      salePrice: nextSalePrice,
      photoPreview: menuItemForm.photoPreview,
      linkedComponents: selectedComponentKey
        ? [
            {
              type: "product",
              id: selectedProductId,
            },
          ]
        : [],
      createdAt: new Date().toISOString(),
    };

    if (
      !payload.name ||
      !payload.description ||
      payload.salePrice <= 0 ||
      !selectedProduct
    )
      return;

    await runSavingMutation("menuItem", async () => {
      try {
        let syncedProduct = null;
        if (
          menuItemForm.priceEditable &&
          Number(selectedProduct.salePrice || 0) !== nextSalePrice
        ) {
          syncedProduct = await catalogApi.saveProduct(tenantSlug, {
            id: selectedProduct.id,
            name: selectedProduct.name,
            salePrice: nextSalePrice,
            yieldQuantity: selectedProduct.yieldQuantity || 1,
            targetCmvPercent: selectedProduct.targetCmvPercent || 30,
            recipe: selectedProduct.recipe || [],
          });
        }

        const savedItem = await menuApi.saveItem(tenantSlug, {
          id: editingMenuItemId || undefined,
          itemType: "regular",
          ...payload,
        });

        if (syncedProduct) {
          setProducts((prev) =>
            prev.map((product) =>
              idsEqual(product.id, syncedProduct.id) ? syncedProduct : product,
            ),
          );
        }

        if (editingMenuItemId) {
          setMenuItems((prev) =>
            prev.map((item) => (item.id === savedItem.id ? savedItem : item)),
          );
        } else {
          setMenuItems((prev) => [...prev, savedItem]);
        }

        resetMenuItemForm();
        setIsMenuItemModalOpen(false);
        e.target.reset();
      } catch (apiError) {
        setSettingsError(
          apiError.message || "Não foi possível salvar o item do cardápio.",
        );
      }
    });
  };

  const handleEditMenuItem = (item) => {
    const linkedProductRef = (item.linkedComponents || []).find(
      (component) => component.type === "product",
    );
    const linkedProduct = linkedProductRef
      ? products.find((product) => idsEqual(product.id, linkedProductRef.id))
      : null;

    setEditingMenuItemId(item.id);
    setMenuItemForm({
      name: item.name,
      category: item.category,
      description: item.description,
      status: item.status,
      salePrice: String(linkedProduct?.salePrice ?? item.salePrice ?? ""),
      priceEditable: false,
      photoPreview: item.photoPreview || "",
      linkedComponentIds: linkedProduct ? [`product:${linkedProduct.id}`] : [],
    });
    setIsMenuItemModalOpen(true);
  };

  const handleSubmitCombo = async (e) => {
    e.preventDefault();
    if (isSavingMutation("combo")) return;
    setComboError("");

    const normalizedGroups = comboForm.comboGroups.map((group) => ({
      ...group,
      name: group.name.trim(),
      minSelect: Number(group.minSelect) || 0,
      maxSelect: Number(group.maxSelect) || 0,
      options: group.options.map((option) => {
        const normalizedLinking = normalizeComboOptionLinking(option);
        return {
          ...option,
          name: option.name.trim(),
          extraPrice: Number(option.extraPrice) || 0,
          maxQty: Number(option.maxQty) || 0,
          isAvailable: Boolean(option.isAvailable),
          linkedCategoryName: normalizedLinking.linkedCategoryName,
          linkedCategoryNames: normalizedLinking.linkedCategoryNames,
          linkedComponentRef: normalizedLinking.linkedComponentRef,
          linkedComponentRefs: normalizedLinking.linkedComponentRefs,
        };
      }),
    }));

    const invalidGroup = normalizedGroups.some(
      (group) =>
        !group.name ||
        group.maxSelect < 1 ||
        group.minSelect > group.maxSelect ||
        group.options.length === 0 ||
        group.options
          .filter((option) => option.isAvailable)
          .reduce((total, option) => total + option.maxQty, 0) <
          group.minSelect ||
        group.options.some(
          (option) =>
            !option.name || option.maxQty < 1 || option.extraPrice < 0,
        ),
    );

    const payload = {
      itemType: "combo",
      name: comboForm.name.trim(),
      category: comboForm.category,
      description: comboForm.description.trim(),
      status: comboForm.status,
      salePrice: null,
      basePrice: Number(comboForm.basePrice) || 0,
      photoPreview: comboForm.photoPreview,
      linkedComponents: [],
      comboGroups: normalizedGroups,
      createdAt: new Date().toISOString(),
    };

    if (!payload.name || !payload.description || payload.basePrice < 0) {
      setComboError("Preencha nome, descrição e um preço base válido.");
      return;
    }
    if (invalidGroup) {
      setComboError(
        "Revise os grupos: o mínimo exigido precisa ser atendido pela soma das quantidades das opções disponíveis.",
      );
      return;
    }

    await runSavingMutation("combo", async () => {
      try {
        const savedCombo = await menuApi.saveItem(tenantSlug, {
          id: editingComboId || undefined,
          ...payload,
        });

        if (editingComboId) {
          setMenuItems((prev) =>
            prev.map((item) => (item.id === savedCombo.id ? savedCombo : item)),
          );
        } else {
          setMenuItems((prev) => [...prev, savedCombo]);
        }

        closeComboModal();
      } catch (apiError) {
        setComboError(apiError.message || "Não foi possível salvar o combo.");
      }
    });
  };

  const handleEditCombo = (item) => {
    setEditingComboId(item.id);
    setComboForm({
      name: item.name,
      category: item.category,
      description: item.description,
      status: item.status,
      basePrice: String(item.basePrice ?? ""),
      photoPreview: item.photoPreview || "",
      comboGroups: item.comboGroups.map((group) => ({
        ...group,
        minSelect: String(group.minSelect),
        maxSelect: String(group.maxSelect),
        options: group.options.map((option) => ({
          ...option,
          extraPrice: String(option.extraPrice ?? 0),
          maxQty: String(option.maxQty ?? 1),
          linkedComponentRefs:
            normalizeComboOptionLinking(option).linkedComponentRefs,
          linkedComponentRef:
            normalizeComboOptionLinking(option).linkedComponentRef,
          linkedCategoryNames: normalizeComboCategoryNames({
            ...option,
            linkedCategoryName:
              option.linkedCategoryName ||
              (() => {
                const [componentType, rawId] = String(
                  option.linkedComponentRef || "",
                ).split(":");
                if (componentType !== "menu-item") return "";

                const linkedItem = findById(menuItems, rawId);
                return linkedItem?.category || "";
              })(),
          }),
          linkedCategoryName:
            option.linkedCategoryName ||
            (() => {
              const [componentType, rawId] = String(
                option.linkedComponentRef || "",
              ).split(":");
              if (componentType !== "menu-item") return "";

              const linkedItem = findById(menuItems, rawId);
              return linkedItem?.category || "";
            })(),
        })),
      })),
    });
    setComboError("");
    setIsComboModalOpen(true);
  };

  const handleDeleteMenuItem = async (itemId) => {
    try {
      await menuApi.deleteItem(tenantSlug, itemId);
      setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
      setExpandedMenuItems((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });

      if (editingMenuItemId === itemId) {
        resetMenuItemForm();
      }
      if (editingComboId === itemId) {
        resetComboForm();
      }
    } catch (apiError) {
      setSettingsError(
        apiError.message || "Não foi possível remover o item do cardápio.",
      );
    }
  };

  const handleMenuCategoryFormChange = (field, value) => {
    setMenuCategoryForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetMenuCategoryForm = () => {
    setEditingMenuCategoryId(null);
    setMenuCategoryForm(createEmptyCategoryForm());
  };

  const closeMenuCategoryModal = () => {
    setIsMenuCategoryModalOpen(false);
    resetMenuCategoryForm();
  };

  const handleSubmitMenuCategory = async (e) => {
    e.preventDefault();
    if (isSavingMutation("menuCategory")) return;

    const normalizedName = menuCategoryForm.name.trim();
    if (!normalizedName) return;

    await runSavingMutation("menuCategory", async () => {
      try {
        const savedCategory = await menuApi.saveCategory(tenantSlug, {
          id: editingMenuCategoryId || undefined,
          name: normalizedName,
        });

        if (editingMenuCategoryId) {
          const previousCategory = menuCategories.find(
            (category) => category.id === editingMenuCategoryId,
          );
          setMenuCategories((prev) =>
            prev.map((category) =>
              category.id === savedCategory.id ? savedCategory : category,
            ),
          );

          if (
            previousCategory &&
            previousCategory.name !== savedCategory.name
          ) {
            setMenuItems((prev) =>
              prev.map((item) =>
                item.category === previousCategory.name
                  ? { ...item, category: savedCategory.name }
                  : item,
              ),
            );
            setExpandedMenuCategories((prev) => {
              const next = { ...prev };
              delete next[previousCategory.name];
              next[savedCategory.name] = true;
              return next;
            });
            setMenuItemForm((prev) =>
              prev.category === previousCategory.name
                ? { ...prev, category: savedCategory.name }
                : prev,
            );
            setComboForm((prev) =>
              prev.category === previousCategory.name
                ? { ...prev, category: savedCategory.name }
                : prev,
            );
          }
        } else {
          setMenuCategories((prev) => [...prev, savedCategory]);
          setExpandedMenuCategories((prev) => ({
            ...prev,
            [savedCategory.name]: true,
          }));

          if (!menuItemForm.category) {
            setMenuItemForm((prev) => ({
              ...prev,
              category: savedCategory.name,
            }));
          }
          if (!comboForm.category) {
            setComboForm((prev) => ({ ...prev, category: savedCategory.name }));
          }
        }

        resetMenuCategoryForm();
        setIsMenuCategoryModalOpen(false);
      } catch (apiError) {
        setSettingsError(
          apiError.message || "Não foi possível salvar a categoria.",
        );
      }
    });
  };

  const handleEditMenuCategory = (category) => {
    setEditingMenuCategoryId(category.id);
    setMenuCategoryForm({ name: category.name });
    setIsMenuCategoryModalOpen(true);
  };

  const handleDeleteMenuCategory = async () => {
    const category = menuCategoryPendingDeletion;
    if (!category) return;
    const categoryId = category.id;

    try {
      const result = await runSavingMutation(
        `delete-menu-category-${categoryId}`,
        () => menuApi.deleteCategory(tenantSlug, categoryId),
      );
      if (!result) return;
      setMenuCategories((prev) =>
        prev.filter((item) => item.id !== categoryId),
      );
      setMenuItems((prev) =>
        prev.map((item) =>
          item.category === category.name ? { ...item, category: "" } : item,
        ),
      );
      setExpandedMenuCategories((prev) => {
        const next = { ...prev };
        delete next[category.name];
        return next;
      });

      if (menuItemForm.category === category.name) {
        setMenuItemForm((prev) => ({
          ...prev,
          category:
            menuCategoryOptions.find((name) => name !== category.name) || "",
        }));
      }
      if (comboForm.category === category.name) {
        setComboForm((prev) => ({
          ...prev,
          category:
            menuCategoryOptions.find((name) => name !== category.name) ||
            "Combo",
        }));
      }

      if (editingMenuCategoryId === categoryId) {
        resetMenuCategoryForm();
      }
      setMenuCategoryPendingDeletion(null);
    } catch (apiError) {
      setSettingsError(
        apiError.message || "Não foi possível remover a categoria.",
      );
    }
  };

  const toggleMenuCategoryExpansion = (categoryName) => {
    setExpandedMenuCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const toggleMenuItemExpansion = (itemId) => {
    setExpandedMenuItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleAddPreparation = async (e) => {
    e.preventDefault();
    if (isSavingMutation("preparation")) return;

    const recipe = preparationRecipeDraft
      .filter(
        (line) =>
          line.componentRef && line.quantityUnit && Number(line.quantity) > 0,
      )
      .map((line) => {
        const parsed = parseComponentValue(line.componentRef);
        const baseUnit = getComponentBaseUnit(
          line.componentRef,
          ingredients,
          preparations,
        );
        return {
          componentType: parsed.componentType,
          componentId: parsed.componentId,
          quantity: Number(line.quantity),
          quantityUnit:
            resolveCompatibleUnitValue(
              ingredientUnits,
              baseUnit,
              line.quantityUnit,
            ) || line.quantityUnit,
        };
      });

    if (!preparationForm.name.trim() || recipe.length === 0) return;

    await runSavingMutation("preparation", async () => {
      try {
        const savedPreparation = await catalogApi.savePreparation(tenantSlug, {
          id: editingPreparationId || undefined,
          name: preparationForm.name.trim(),
          yieldQuantity: parseFloat(preparationForm.yieldQuantity) || 1,
          yieldUnit:
            resolveUnitValue(ingredientUnits, preparationForm.yieldUnit) ||
            ingredientUnits[0]?.label ||
            "G",
          recipe,
        });

        setPreparations((prev) =>
          editingPreparationId
            ? prev.map((preparation) =>
                idsEqual(preparation.id, savedPreparation.id)
                  ? savedPreparation
                  : preparation,
              )
            : [...prev, savedPreparation],
        );
        setSettingsError("");
        resetPreparationForm();
        setIsPreparationModalOpen(false);
      } catch (apiError) {
        setSettingsError(
          apiError.message || "Não foi possível salvar a receita base.",
        );
      }
    });
  };

  const handleEditPreparation = (preparation) => {
    setEditingPreparationId(preparation.id);
    setPreparationForm({
      name: preparation.name,
      yieldQuantity: String(preparation.yieldQuantity || 1),
      yieldUnit:
        resolveUnitValue(ingredientUnits, preparation.yieldUnit) ||
        ingredientUnits[0]?.label ||
        "G",
    });
    const recipeDraft = (preparation.recipe || []).map((line) => ({
      id: Date.now() + Math.random(),
      componentRef: `${line.componentType}:${line.componentId}`,
      quantity: String(line.quantity || ""),
      quantityUnit:
        resolveCompatibleUnitValue(
          ingredientUnits,
          getComponentBaseUnit(
            `${line.componentType}:${line.componentId}`,
            ingredients,
            preparations,
          ),
          line.quantityUnit,
        ) ||
        getComponentBaseUnit(
          `${line.componentType}:${line.componentId}`,
          ingredients,
          preparations,
        ),
    }));
    setPreparationRecipeDraft(
      recipeDraft.length > 0
        ? recipeDraft
        : [
            {
              id: Date.now() + 1,
              componentRef: "",
              quantity: "",
              quantityUnit: "",
            },
          ],
    );
    setIsPreparationManagerModalOpen(false);
    setIsPreparationModalOpen(true);
  };

  const handleDeletePreparation = async (preparationId) => {
    try {
      await catalogApi.deletePreparation(tenantSlug, preparationId);
      setSettingsError("");
      setPreparations((prev) =>
        prev.filter((preparation) => !idsEqual(preparation.id, preparationId)),
      );

      if (idsEqual(editingPreparationId, preparationId)) {
        resetPreparationForm();
        setIsPreparationModalOpen(false);
      }
    } catch (apiError) {
      setSettingsError(
        apiError.message || "Não foi possível remover a receita base.",
      );
    }
  };

  const handleUpdateCost = async (cost, changes) => {
    try {
      const recurringCost = await financeApi.updateRecurringCost(tenantSlug, {
        ...cost,
        ...changes,
        desc: cost.desc,
        effectiveFrom:
          changes.recurrence === "SPECIAL"
            ? cost.effectiveFrom
            : `${financeMonth}-01`,
      });
      const bootstrap = await appApi.getBootstrap(tenantSlug);
      setRecurringCosts(bootstrap.recurringCosts || []);
      setFinancialObligations(bootstrap.financialObligations || []);
      return recurringCost;
    } catch (error) {
      setSettingsError("Não foi possível atualizar o custo fixo.");
      throw error;
    }
  };

  const handlePasswordKeyboardState = (event) => {
    setSettingsCapsLockOn(event.getModifierState("CapsLock"));
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newPassword = fd.get("appPassword")?.toString() || "";
    const confirmPassword = fd.get("confirmPassword")?.toString() || "";

    setSettingsError("");
    setSettingsSuccess("");

    if (newPassword || confirmPassword) {
      if (newPassword.length < 4) {
        setSettingsError("A nova senha precisa ter pelo menos 4 caracteres.");
        return;
      }

      if (newPassword !== confirmPassword) {
        setSettingsError("A confirmação da senha não confere.");
        return;
      }
    }

    try {
      const nextSettings = await settingsApi.updateGeneral(tenantSlug, {
        ifoodTax: parseFloat(fd.get("ifoodTax")) || 0,
        anotaaiTax: parseFloat(fd.get("anotaaiTax")) || 0,
        appPassword: newPassword || settings.appPassword,
        passwordReminder:
          fd.get("passwordReminder") || settings.passwordReminder,
        businessName: fd.get("businessName") || settings.businessName,
        alertDaysBefore: parseInt(fd.get("alertDaysBefore")) || 0,
      });

      setSettings(nextSettings);
      setSettingsSuccess("Configurações salvas com sucesso.");
      setActiveTab("dashboard");
    } catch (apiError) {
      setSettingsError(
        apiError.message || "Não foi possível salvar as configurações.",
      );
    }
  };

  const handleSaveAiBehaviorSettings = async (payload) => {
    setAiBehaviorError("");
    setAiBehaviorSuccess("");

    const normalizedInstructions = payload.additionalInstructions.trim();

    if (normalizedInstructions.length > 150) {
      setAiBehaviorError(
        "As instruções adicionais precisam ficar em até 150 caracteres.",
      );
      return;
    }

    try {
      const nextSettings = await settingsApi.updateAiBehavior(tenantSlug, {
        ...payload,
        additionalInstructions: normalizedInstructions,
      });

      setAiBehaviorSettings(normalizeAiBehaviorSettings(nextSettings));
      setAiBehaviorSuccess("Comportamento da IA salvo com sucesso.");
    } catch (apiError) {
      setAiBehaviorError(
        apiError.message || "Não foi possível salvar o comportamento da IA.",
      );
    }
  };

  const handleLogout = async () => {
    setSession(null);
    navigate("/login", { replace: true });
    try {
      if (isMockDataSource()) {
        await signOutMock();
      } else {
        await Promise.race([
          supabase.auth.signOut({ scope: "local" }),
          new Promise((resolve) => window.setTimeout(resolve, 1500)),
        ]);
      }
    } catch {
      // A navegação local já encerrou o acesso à tela; a sessão será revalidada no próximo login.
    }
  };

  if (bootstrapLoading) {
    return (
      <div className="min-h-screen bg-[#2A1E15] flex items-center justify-center p-4 md:p-6 font-sans">
        <div className="bg-[#FFFFFF] w-full max-w-[440px] rounded-[2rem] p-8 shadow-2xl border border-gray-100 text-center space-y-4 italic">
          <Logo className="w-16 h-16 mx-auto" />
          <p className="text-sm font-black text-[#2A1E15] uppercase tracking-widest">
            Carregando painel
          </p>
          <p className="text-xs font-bold text-[#6F6258]">
            Aguarde um instante.
          </p>
        </div>
      </div>
    );
  }

  if (bootstrapError) {
    return (
      <div className="min-h-screen bg-[#2A1E15] flex items-center justify-center p-4 md:p-6 font-sans">
        <div className="bg-[#FFFFFF] w-full max-w-[520px] rounded-[2rem] p-8 shadow-2xl border border-gray-100 text-center space-y-4 italic">
          <Logo className="w-16 h-16 mx-auto" />
          <p className="text-sm font-black text-red-700 uppercase tracking-widest">
            Falha ao carregar o backend
          </p>
          <p className="text-xs font-bold text-[#6F6258]">{bootstrapError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full bg-[#2A1E15] text-[#FFFFFF] py-3 rounded-2xl font-black uppercase text-xs hover:bg-[#3A281B] transition-all shadow-xl"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#2A1E15] flex items-center justify-center p-4 md:p-6 font-sans">
        <div className="bg-[#FFFFFF] w-full max-w-[440px] xl:max-w-[520px] rounded-[2rem] p-8 sm:p-10 xl:p-12 shadow-2xl border border-gray-100 italic">
          <div className="flex flex-col items-center mb-8 text-center font-black">
            <Logo className="w-20 h-20 xl:w-24 xl:h-24 mb-4" />
            <h1 className="text-2xl xl:text-3xl font-black text-[#2A1E15] tracking-tight uppercase tracking-tighter">
              {settings.businessName}
            </h1>
            <p className="text-[#6F6258] text-[11px] xl:text-xs font-bold uppercase tracking-widest mt-1">
              Painel Administrativo
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-sm font-bold text-[#6F6258] text-center">
              Sessão não encontrada. Faça login para acessar o dashboard.
            </p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full bg-[#2A1E15] text-[#FFFFFF] py-4 rounded-2xl font-black uppercase text-xs hover:bg-[#3A281B] transition-all shadow-xl"
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell flex min-h-screen bg-[#FFFFFF] text-gray-900 font-sans italic relative">
      {isCatModalOpen && (
        <LegacyMenuCategoryModal
          isOpen={isCatModalOpen}
          onClose={() => setIsCatModalOpen(false)}
          categories={costCategories}
          setCategories={setCostCategories}
        />
      )}
      {isRoleModalOpen && (
        <EmployeeRoleModal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          roles={employeeRoles}
          setRoles={setEmployeeRoles}
        />
      )}
      <SalesChannelsModal
        open={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        channels={salesChannels}
        onSave={handleSaveSalesChannel}
        onDelete={handleDeleteSalesChannel}
        busy={isFinanceSubmitting}
      />
      {isFinanceCategoryModalOpen && (
        <SimpleOptionsModal
          isOpen={isFinanceCategoryModalOpen}
          onClose={() => setIsFinanceCategoryModalOpen(false)}
          title="Categorias Financeiras"
          options={financeExpenseCategories}
          setOptions={setFinanceExpenseCategories}
        />
      )}
      {isDiscountCategoryModalOpen && (
        <SimpleOptionsModal
          isOpen={isDiscountCategoryModalOpen}
          onClose={() => setIsDiscountCategoryModalOpen(false)}
          title="Categorias de Desconto"
          options={discountCategories}
          setOptions={setDiscountCategories}
        />
      )}
      {isEmployeeDiscountsModalOpen && (
        <PayrollAdjustmentsModal
          isOpen={isEmployeeDiscountsModalOpen}
          onClose={() => setIsEmployeeDiscountsModalOpen(false)}
          employee={selectedEmployeeForDiscounts}
          competenceMonth={fixedPayrollMonth}
          onCompetenceChange={(month) => {
            setFixedPayrollMonth(month);
            setPayrollAdjustmentDraft((previous) => ({
              ...previous,
              adjustmentDate: `${month}-01`,
            }));
          }}
          statement={selectedFixedPayrollStatement}
          adjustments={selectedPayrollAdjustments}
          draft={payrollAdjustmentDraft}
          onDraftChange={(field, value) =>
            setPayrollAdjustmentDraft((previous) => ({
              ...previous,
              [field]: value,
            }))
          }
          onAddAdjustment={handleSavePayrollAdjustment}
          onCancelAdjustment={handleCancelPayrollAdjustment}
          isSaving={isSavingMutation("payroll-adjustment")}
          error={payrollAdjustmentError}
        />
      )}
      {isEmployeeModalOpen && (
        <EmployeeModal
          isOpen={isEmployeeModalOpen}
          onClose={() => setIsEmployeeModalOpen(false)}
          onSubmit={handleSubmitEmployee}
          employeeRoles={employeeRoles}
          employee={employeeForm}
          setEmployee={setEmployeeForm}
          isEditing={Boolean(editingEmployeeId)}
          isSaving={isSavingMutation("employee")}
          error={rhError}
        />
      )}
      <DeleteEmployeeModal
        employee={employeePendingDeletion}
        isSaving={Boolean(
          employeePendingDeletion &&
          isSavingMutation(`delete-employee-${employeePendingDeletion.id}`),
        )}
        error={rhError}
        onClose={() => setEmployeePendingDeletion(null)}
        onConfirm={handleDeleteEmployee}
      />
      <EmployeePaymentHistoryModal
        employee={paymentHistoryEmployee}
        closings={
          paymentHistoryEmployee
            ? extraWeeklyClosings.filter(
                (closing) =>
                  String(closing.employeeId) ===
                  String(paymentHistoryEmployee.id),
              )
            : []
        }
        onClose={() => setPaymentHistoryEmployee(null)}
      />
      {isPreparationManagerModalOpen && (
        <PreparationManagerModal
          isOpen={isPreparationManagerModalOpen}
          onClose={() => setIsPreparationManagerModalOpen(false)}
          preparations={preparations}
          onEditPreparation={handleEditPreparation}
          onDeletePreparation={handleDeletePreparation}
        />
      )}
      {isPreparationModalOpen && (
        <PreparationModal
          isOpen={isPreparationModalOpen}
          onClose={() => {
            setIsPreparationModalOpen(false);
            resetPreparationForm();
          }}
          preparationForm={preparationForm}
          onPreparationFormChange={handlePreparationFormChange}
          preparationRecipeDraft={preparationRecipeDraft}
          onAddPreparationRecipeLine={handleAddPreparationRecipeLine}
          onPreparationRecipeDraftChange={handlePreparationRecipeDraftChange}
          onRemovePreparationRecipeLine={handleRemovePreparationRecipeLine}
          onSubmit={handleAddPreparation}
          editingPreparationId={editingPreparationId}
          ingredientUnits={ingredientUnits}
          ingredients={ingredients}
          preparations={preparations}
          isSaving={isSavingMutation("preparation")}
        />
      )}
      {isIngredientModalOpen && (
        <IngredientModal
          isOpen={isIngredientModalOpen}
          onClose={closeIngredientModal}
          ingredientForm={ingredientForm}
          onIngredientFormChange={handleIngredientFormChange}
          onSubmit={handleSubmitIngredient}
          ingredientUnits={ingredientUnits}
          isSaving={isSavingMutation("ingredient")}
        />
      )}

      {isProductModalOpen && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={resetProductEditForm}
          productForm={productForm}
          onProductFormChange={handleProductFormChange}
          productRecipeDraft={productRecipeDraft}
          onAddRecipeLine={handleAddRecipeLine}
          onRecipeDraftChange={handleRecipeDraftChange}
          onRemoveRecipeLine={handleRemoveRecipeLine}
          onSubmit={handleUpdateProduct}
          ingredientUnits={ingredientUnits}
          ingredients={ingredients}
          preparations={preparations}
          isSaving={isSavingMutation("product")}
        />
      )}
      {isMenuCategoryModalOpen && (
        <MenuCategoryModal
          isOpen={isMenuCategoryModalOpen}
          onClose={closeMenuCategoryModal}
          categories={menuCategories}
          categoryForm={menuCategoryForm}
          editingCategoryId={editingMenuCategoryId}
          onCategoryFormChange={handleMenuCategoryFormChange}
          onSubmitCategory={handleSubmitMenuCategory}
          onEditCategory={handleEditMenuCategory}
          onDeleteCategory={(categoryId) =>
            setMenuCategoryPendingDeletion(
              menuCategories.find((item) => item.id === categoryId) || null,
            )
          }
          onCancelEdit={resetMenuCategoryForm}
          onReorderCategories={handleReorderMenuCategories}
          CustomInput={CustomInput}
          isSaving={isSavingMutation("menuCategory")}
        />
      )}
      <DeleteMenuCategoryModal
        category={menuCategoryPendingDeletion}
        itemCount={
          menuCategoryPendingDeletion
            ? menuItems.filter(
                (item) => item.category === menuCategoryPendingDeletion.name,
              ).length
            : 0
        }
        isSaving={Boolean(
          menuCategoryPendingDeletion &&
          isSavingMutation(
            `delete-menu-category-${menuCategoryPendingDeletion.id}`,
          ),
        )}
        onClose={() => setMenuCategoryPendingDeletion(null)}
        onConfirm={handleDeleteMenuCategory}
      />
      {isMenuItemModalOpen && (
        <MenuItemModal
          isOpen={isMenuItemModalOpen}
          onClose={closeMenuItemModal}
          menuItemForm={menuItemForm}
          editingMenuItemId={editingMenuItemId}
          categoryOptions={menuCategoryOptions}
          menuComponentSearch={menuComponentSearch}
          filteredMenuComponentOptions={filteredMenuComponentOptions}
          onMenuItemFormChange={handleMenuItemFormChange}
          onSubmitMenuItem={handleSubmitMenuItem}
          onResetMenuItemForm={resetMenuItemForm}
          onMenuItemPhotoChange={handleMenuItemPhotoChange}
          onMenuComponentSearchChange={setMenuComponentSearch}
          onToggleMenuComponent={handleToggleMenuComponent}
          CustomInput={CustomInput}
          isSaving={isSavingMutation("menuItem")}
        />
      )}
      {isComboModalOpen && (
        <ComboEditorModal
          isOpen={isComboModalOpen}
          onClose={closeComboModal}
          comboForm={comboForm}
          editingComboId={editingComboId}
          categoryOptions={menuCategoryOptions}
          comboLinkCategoryOptions={comboLinkCategoryOptions}
          comboLinkItemsByCategory={comboLinkItemsByCategory}
          catalogMetrics={catalogMetrics}
          ingredients={ingredients}
          menuItems={menuItems}
          onComboFormChange={handleComboFormChange}
          onComboPhotoChange={handleComboPhotoChange}
          onSubmitCombo={handleSubmitCombo}
          onAddComboGroup={handleAddComboGroup}
          onDuplicateComboGroup={handleDuplicateComboGroup}
          onRemoveComboGroup={handleRemoveComboGroup}
          onComboGroupChange={handleComboGroupChange}
          onReorderComboGroups={handleReorderComboGroups}
          onAddComboOption={handleAddComboOption}
          onRemoveComboOption={handleRemoveComboOption}
          onComboOptionChange={handleComboOptionChange}
          onReorderComboOptions={handleReorderComboOptions}
          formatMoney={formatMoney}
          CustomInput={CustomInput}
          error={comboError}
          isSaving={isSavingMutation("combo")}
        />
      )}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[45] lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 w-64 xl:w-72 2xl:w-80 bg-gradient-to-b from-[#2E1C14] via-[#3A2114] to-[#A85A2B] border-r border-white/15 flex flex-col h-screen transition-transform duration-300 shadow-[10px_0_30px_rgba(42,30,21,0.22)] ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-6 xl:p-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-white/8 ring-1 ring-[#D4A373]/35 shadow-sm">
              <Logo className="w-8 h-8 xl:w-10 xl:h-10" />
            </div>
            <span className="font-black text-lg xl:text-xl 2xl:text-2xl tracking-tighter text-white uppercase not-italic">
              REI DAS<span className="text-[#F6B52E] italic ml-1">ESFIHAS</span>
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-white/60"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-3 overflow-y-auto py-2 space-y-1">
          {/* ── Item simples: Painel Real ── */}
          <a
            href="#dashboard"
            onClick={(event) => {
              event.preventDefault();
              activateTab("dashboard");
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
              activeTab === "dashboard"
                ? "menu-item-active bg-[#EED9B0] text-[#2A1E15] ring-1 ring-[#D4A373]/35 shadow-lg shadow-black/10 font-black"
                : "text-[#EAD8BF] hover:bg-white/10 hover:text-[#FFF7EA] font-bold"
            }`}
          >
            <LayoutDashboard size={16} className="shrink-0" />
            <span className="text-xs tracking-tight uppercase">Dashboard</span>
          </a>

          {/* ── Grupo: Operacional ── */}
          {[
            {
              key: "operacional",
              label: "Operacional",
              icon: Briefcase,
              items: [
                { id: "menu", label: "Cardápio Operacional", icon: ChefHat },
                { id: "orders", label: "Pedidos", icon: ShoppingBag },
                { id: "reviews", label: "Gestão de Avaliações", icon: Star },
                { id: "cmv", label: "CMV / Ficha Técnica", icon: Wallet },
              ],
            },
            {
              key: "suprimentos",
              label: "Estoque e Compras",
              icon: ShoppingBag,
              items: [
                { id: "estoque", label: "Estoque / Inventário", icon: Wallet },
                {
                  id: "compras",
                  label: "Pedidos de Compra",
                  icon: ShoppingBag,
                },
                { id: "fornecedores", label: "Fornecedores", icon: Briefcase },
              ],
            },
            {
              key: "financeiro",
              label: "Financeiro",
              icon: DollarSign,
              items: [
                { id: "financeiro", label: "Lançamentos", icon: TrendingUp },
                {
                  id: "contas-pagar",
                  label: "Contas a Pagar",
                  icon: CreditCard,
                },
                { id: "fluxo-caixa", label: "Fluxo de Caixa", icon: Wallet },
                {
                  id: "saldos",
                  label: "Saldos / Conciliação",
                  icon: DollarSign,
                },
                { id: "dre", label: "DRE Mensal", icon: Receipt },
                { id: "closing", label: "Fechamento", icon: PieChart },
              ],
            },
            {
              key: "pessoas",
              label: "Pessoas",
              icon: Users,
              items: [{ id: "rh", label: "RH / Pessoal", icon: Users }],
            },
            {
              key: "sistema",
              label: "Sistema",
              icon: Settings,
              items: [
                { id: "settings", label: "Configurações", icon: Settings },
                { id: "ai-behavior", label: "Comportamento da IA", icon: Bot },
              ],
            },
          ]
            .map((group) => ({
              ...group,
              items: group.items.filter(
                (item) => isAppTabEnabled(item.id) && canAccessTab(item.id),
              ),
            }))
            .filter((group) => group.items.length > 0)
            .map((group) => {
              const isOpen = openGroups[group.key];
              const hasActive = group.items.some((i) => i.id === activeTab);
              return (
                <div key={group.key}>
                  {/* Cabeçalho do grupo */}
                  <button
                    onClick={() =>
                      setOpenGroups((prev) => ({
                        ...prev,
                        [group.key]: !prev[group.key],
                      }))
                    }
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mt-1 ${
                      hasActive && !isOpen
                        ? "text-[#F3E8DA] font-black bg-white/10 border border-[#D4A373]/35 shadow-md"
                        : "text-[#EAD8BF] hover:bg-white/10 hover:text-[#FFF7EA] font-bold border border-transparent"
                    }`}
                  >
                    <group.icon
                      size={15}
                      className={`shrink-0 ${hasActive && !isOpen ? "text-[#EED9B0]" : "text-[#E6CDA8]"}`}
                    />
                    <span className="text-[11px] tracking-[0.18em] uppercase flex-1 text-left">
                      {group.label}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : "rotate-0"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Submenus */}
                  <div
                    className={`overflow-hidden transition-all duration-200 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="ml-3 pl-3 border-l-2 border-[#D4A373]/30 space-y-1 py-2">
                      {group.items.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={(event) => {
                            event.preventDefault();
                            activateTab(item.id);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                            activeTab === item.id
                              ? "menu-item-active bg-[#EED9B0] text-[#2A1E15] font-black shadow-md shadow-black/10 border-l-4 border-[#D4A373]"
                              : "text-[#EAD8BF] hover:bg-white/10 hover:text-[#FFF7EA] font-semibold"
                          }`}
                        >
                          <item.icon
                            size={14}
                            className={`shrink-0 ${activeTab === item.id ? "text-[#2A1E15]" : "text-[#F5E8D3]"}`}
                          />
                          <span className="text-[11px] tracking-[0.08em] uppercase">
                            {item.label}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
        </nav>
        <div className="p-6 border-t border-[#7a3738] bg-black/10 backdrop-blur-sm">
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
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#2A1E15] bg-gray-50 rounded-xl"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-base sm:text-xl xl:text-2xl 2xl:text-3xl font-black text-[#2A1E15] uppercase italic tracking-tighter truncate">
              {activeTab}
            </h2>
          </div>
          <div className="bg-[#FFFFFF] border border-[#D4A373]/20 px-2 py-1 xl:px-3 xl:py-1.5 rounded-lg text-[9px] sm:text-[10px] xl:text-xs font-black text-[#D4A373] uppercase tracking-widest italic">
            Painel Administrativo
          </div>
        </header>

        <div className="p-4 sm:p-8 xl:p-10 2xl:p-12 max-w-[1800px] 2xl:max-w-[2000px] mx-auto space-y-6 sm:space-y-8 xl:space-y-10 font-sans w-full">
          {/* Notificações */}
          <div className="space-y-2">
            {primaryAlert && (
              <div className="payment-alert flex items-center justify-between gap-3 p-3 rounded-2xl shadow-md">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(primaryAlert.targetTab || "financeiro");
                    if (primaryAlert.rawId) {
                      setHighlightedCostIds(
                        prioritizedAlerts.map((alert) => alert.id),
                      );
                      setAccountsPayableView("RECURRENCES");
                    } else if (primaryAlert.targetTab === "rh") {
                      setRhView(primaryAlert.targetRhView || "fixed");
                    }
                    setSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 overflow-hidden text-left flex-1"
                >
                  <Bell
                    size={14}
                    className="payment-alert__icon shrink-0 animate-pulse"
                  />
                  <p className="text-[9px] sm:text-xs font-bold uppercase tracking-tight truncate">
                    {primaryAlert.title}:{" "}
                    <span className="payment-alert__label font-black">
                      {primaryAlert.label}
                    </span>
                    {additionalAlertsCount > 0 && (
                      <span className="payment-alert__count ml-2 rounded-full bg-white/60 px-2 py-0.5 normal-case tracking-normal">
                        · {additionalAlertsCount} outro(s) alerta(s)
                      </span>
                    )}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDismissedAlerts((prev) => [
                      ...prev,
                      ...prioritizedAlerts.map(
                        (alert) => `${alert.id}-${new Date().getMonth()}`,
                      ),
                    ])
                  }
                  className="p-1 shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {activeTab === "dashboard" && (
            <ExecutiveDashboardPage
              month={dashboardMonth}
              onMonthChange={setDashboardMonth}
              transactions={transactions}
              recurringCosts={recurringCosts}
              employees={employees}
              employeeWorkLogs={employeeWorkLogs}
              obligations={financialObligations}
              inventoryCmvSummaries={
                supplyChainData.monthlyInventorySummaries || []
              }
            />
          )}

          {activeTab === "menu" && (
            <div className="space-y-6 xl:space-y-8">
              <section className="menu-command-center">
                <div className="menu-command-center__headline">
                  <div className="space-y-3">
                    <p className="menu-command-center__eyebrow">
                      Operação do catálogo
                    </p>
                    <div className="space-y-2">
                      <h3 className="menu-command-center__title">
                        Cardápio operacional sem cara de planilha perdida
                      </h3>
                      <p className="menu-command-center__description">
                        Cadastro, visibilidade, foto e vínculo técnico ficam no
                        mesmo fluxo. A ideia aqui é simples: você bate o olho e
                        entende onde o catálogo está forte, onde está frouxo e o
                        que ainda trava a publicação.
                      </p>
                    </div>
                  </div>

                  <div className="menu-command-center__signal">
                    <span className="menu-command-center__signal-label">
                      Cobertura visual
                    </span>
                    <strong>{menuOperationalSummary.photoCoverage}%</strong>
                    <span>
                      {menuDashboard.itemsWithPhoto}/
                      {menuOperationalSummary.totalItems || 0} itens com foto
                    </span>
                  </div>
                </div>

                <div className="menu-command-center__metrics">
                  <div className="menu-health-card">
                    <span className="menu-health-card__label">Exposição</span>
                    <strong className="menu-health-card__value">
                      {menuOperationalSummary.visibilityCoverage}%
                    </strong>
                    <p className="menu-health-card__text">
                      {menuDashboard.visibleCount} item(ns) exposto(s) no
                      cardápio.
                    </p>
                  </div>
                  <div className="menu-health-card">
                    <span className="menu-health-card__label">
                      Categorias vazias
                    </span>
                    <strong className="menu-health-card__value">
                      {menuOperationalSummary.emptyCategories}
                    </strong>
                    <p className="menu-health-card__text">
                      Categoria sem item cadastrado só ocupa espaço e piora
                      navegação.
                    </p>
                  </div>
                  <div className="menu-health-card">
                    <span className="menu-health-card__label">Rascunhos</span>
                    <strong className="menu-health-card__value">
                      {menuOperationalSummary.draftCount}
                    </strong>
                    <p className="menu-health-card__text">
                      Itens ainda sem acabamento operacional para entrar em
                      produção.
                    </p>
                  </div>
                  <div className="menu-health-card">
                    <span className="menu-health-card__label">
                      Vínculos técnicos
                    </span>
                    <strong className="menu-health-card__value">
                      {menuOperationalSummary.linkedItems}
                    </strong>
                    <p className="menu-health-card__text">
                      Itens com conexão real com produto, base ou complemento.
                    </p>
                  </div>
                </div>

                <div className="menu-command-center__footer">
                  <div className="menu-command-pill">
                    <Sparkles size={14} />
                    <span>
                      {menuDashboard.highlightedCount} destaque(s) da casa
                    </span>
                  </div>
                  <div className="menu-command-pill">
                    <Eye size={14} />
                    <span>
                      {menuDashboard.activeCount} item(ns) prontos para vender
                    </span>
                  </div>
                  <div className="menu-command-pill">
                    <Link2 size={14} />
                    <span>
                      {Math.max(
                        menuOperationalSummary.totalItems -
                          menuOperationalSummary.linkedItems,
                        0,
                      )}{" "}
                      item(ns) ainda sem vínculo
                    </span>
                  </div>
                  <div className="menu-command-pill">
                    <Camera size={14} />
                    <span>
                      {Math.max(
                        menuOperationalSummary.totalItems -
                          menuDashboard.itemsWithPhoto,
                        0,
                      )}{" "}
                      item(ns) pedindo foto decente
                    </span>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 xl:gap-8">
                <StatCard
                  title="Itens do Cardápio"
                  value={menuItems.length}
                  icon={ChefHat}
                  colorClass="text-[#2A1E15]"
                  bgColorClass="bg-[#2A1E15]/10"
                  iconColorClass="text-[#2A1E15]"
                />
                <StatCard
                  title="Disponíveis"
                  value={menuDashboard.activeCount}
                  icon={CheckCircle}
                  colorClass="text-green-700"
                  bgColorClass="bg-green-50"
                  iconColorClass="text-green-700"
                />
                <StatCard
                  title="Com Foto"
                  value={menuDashboard.itemsWithPhoto}
                  icon={Camera}
                  colorClass="text-blue-700"
                  bgColorClass="bg-blue-50"
                  iconColorClass="text-blue-700"
                />
                <StatCard
                  title="Visíveis"
                  value={menuDashboard.visibleCount}
                  icon={Eye}
                  colorClass="text-amber-700"
                  bgColorClass="bg-amber-50"
                  iconColorClass="text-amber-700"
                />
              </div>

              <div className="menu-bottom-zone">
                <div className="menu-bottom-toolbar">
                  <div className="menu-bottom-toolbar__intro">
                    <p className="menu-command-center__eyebrow">
                      Categorias, itens e produção
                    </p>
                    <h4 className="menu-bottom-toolbar__title">
                      A base operacional fica inteira aqui embaixo
                    </h4>
                    <p className="menu-bottom-toolbar__description">
                      Organização e edição viram ação curta. Produção continua
                      tomando a área útil da tela, como deveria desde o começo.
                    </p>
                  </div>

                  <div className="menu-compact-actions">
                    <button
                      type="button"
                      onClick={() => {
                        resetMenuCategoryForm();
                        setIsMenuCategoryModalOpen(true);
                      }}
                      className="menu-compact-action"
                    >
                      <List size={14} />
                      <span>Organização</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetMenuItemForm();
                        setIsMenuItemModalOpen(true);
                      }}
                      className="menu-compact-action"
                    >
                      <ChefHat size={14} />
                      <span>Novo item</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetComboForm();
                        setComboError("");
                        setIsComboModalOpen(true);
                      }}
                      className="menu-compact-action"
                    >
                      <Plus size={14} />
                      <span>Novo combo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        document
                          .getElementById("menu-production-panel")
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          })
                      }
                      className="menu-compact-action menu-compact-action--ghost"
                    >
                      <Eye size={14} />
                      <span>Produção</span>
                    </button>
                  </div>

                  <div className="menu-bottom-toolbar__signals">
                    <span className="menu-inline-signal">
                      {menuCategories.length} categorias
                    </span>
                    <span className="menu-inline-signal">
                      {menuItems.length} itens
                    </span>
                    <span className="menu-inline-signal">
                      {menuOperationalSummary.comboCount} combos
                    </span>
                    <span className="menu-inline-signal">
                      {menuOperationalSummary.emptyCategories} vazias
                    </span>
                    <span className="menu-inline-signal">
                      {menuDashboard.itemsWithPhoto} com foto
                    </span>
                  </div>
                </div>

                <div
                  className="menu-catalog-panel menu-catalog-panel--full"
                  id="menu-production-panel"
                >
                  <div className="menu-catalog-panel__header">
                    <div>
                      <p className="text-[11px] font-black text-[#D4A373] uppercase tracking-[0.25em]">
                        Leitura operacional
                      </p>
                      <h3 className="text-lg font-black text-[#2A1E15] uppercase tracking-tighter">
                        Categorias e itens em produção
                      </h3>
                      <p className="menu-catalog-panel__description">
                        O catálogo precisa mostrar rápido o que está vendável, o
                        que está escondido e o que ainda está frouxo.
                      </p>
                    </div>
                    <div className="menu-link-counter">
                      {menuDashboard.highlightedCount} destaque(s)
                    </div>
                  </div>

                  <div className="menu-catalog-panel__toolbar">
                    <div className="relative">
                      <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F6258]"
                      />
                      <input
                        type="text"
                        value={menuSearchTerm}
                        onChange={(e) => setMenuSearchTerm(e.target.value)}
                        placeholder="Buscar categoria ou item do cardápio..."
                        className="w-full pl-10 pr-4 py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#D4A373]"
                      />
                    </div>

                    <div className="menu-status-summary">
                      <div className="menu-status-chip menu-status-chip--available">
                        <span className="menu-status-chip__value">
                          {menuDashboard.activeCount}
                        </span>
                        <span>Disponíveis</span>
                      </div>
                      <div className="menu-status-chip menu-status-chip--highlight">
                        <span className="menu-status-chip__value">
                          {menuDashboard.highlightedCount}
                        </span>
                        <span>Destaques</span>
                      </div>
                      <div className="menu-status-chip menu-status-chip--draft">
                        <span className="menu-status-chip__value">
                          {menuOperationalSummary.draftCount}
                        </span>
                        <span>Rascunhos</span>
                      </div>
                      <div className="menu-status-chip menu-status-chip--inactive">
                        <span className="menu-status-chip__value">
                          {menuOperationalSummary.inactiveCount}
                        </span>
                        <span>Ocultos</span>
                      </div>
                    </div>
                  </div>

                  <div className="menu-category-strip">
                    {menuOperationalSummary.categoryHealth.map((category) => (
                      <div
                        key={category.id}
                        className="menu-category-strip__card"
                      >
                        <p className="menu-category-strip__label">
                          {category.name}
                        </p>
                        <strong className="menu-category-strip__value">
                          {category.itemsCount}
                        </strong>
                        <span className="menu-category-strip__meta">
                          {category.visibleItems} visível(eis)
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="menu-accordion-list custom-scrollbar">
                    {(() => {
                      const realCategoryGroups = menuItemsByCategory.filter(
                        (group) => group.id !== "uncategorized",
                      );
                      const uncategorizedCategoryGroups =
                        menuItemsByCategory.filter(
                          (group) => group.id === "uncategorized",
                        );
                      const renderCategoryGroup = (
                        categoryGroup,
                        categoryHandleProps = null,
                      ) => {
                        const categoryExpanded =
                          expandedMenuCategories[categoryGroup.name] ?? false;
                        const visibleItems = categoryGroup.items.filter(
                          (item) => item.status !== "inactive",
                        ).length;
                        const highlightedItems = categoryGroup.items.filter(
                          (item) => item.status === "seasonal",
                        ).length;
                        const canReorderCategory =
                          Boolean(categoryHandleProps) &&
                          !menuSearchTerm.trim() &&
                          categoryGroup.id !== "uncategorized";

                        return (
                          <div
                            key={categoryGroup.id}
                            className="menu-category-accordion"
                          >
                            {canReorderCategory && (
                              <button
                                type="button"
                                className="menu-drag-handle menu-drag-handle--category"
                                aria-label={`Reordenar categoria ${categoryGroup.name}`}
                                {...categoryHandleProps}
                              >
                                <GripVertical size={15} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                toggleMenuCategoryExpansion(categoryGroup.name)
                              }
                              className="menu-category-accordion__trigger"
                            >
                              <div className="menu-category-accordion__heading">
                                <p className="menu-category-accordion__eyebrow">
                                  Categoria
                                </p>
                                <p className="text-sm font-black text-[#2A1E15] uppercase tracking-tight">
                                  {categoryGroup.name}
                                </p>
                              </div>
                              <div className="menu-category-accordion__meta">
                                <span className="menu-category-badge">
                                  {categoryGroup.items.length} item(ns)
                                </span>
                                <span className="menu-category-badge menu-category-badge--soft">
                                  {visibleItems} visível(eis)
                                </span>
                                {highlightedItems > 0 && (
                                  <span className="menu-category-badge menu-category-badge--highlight">
                                    {highlightedItems} destaque(s)
                                  </span>
                                )}
                                <svg
                                  className={`menu-chevron ${categoryExpanded ? "menu-chevron--open" : ""}`}
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.5"
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            </button>

                            {categoryExpanded && (
                              <div className="menu-category-accordion__content">
                                {categoryGroup.items.length > 0 ? (
                                  <SortableList
                                    items={categoryGroup.items}
                                    disabled={
                                      Boolean(menuSearchTerm.trim()) ||
                                      categoryGroup.id === "uncategorized"
                                    }
                                    className="space-y-3"
                                    onReorder={(nextItems) =>
                                      handleReorderMenuItems(
                                        categoryGroup.name,
                                        nextItems,
                                      )
                                    }
                                    renderItem={({ item, handleProps }) => {
                                      const statusMeta = getMenuStatusMeta(
                                        item.status,
                                      );
                                      const itemExpanded =
                                        expandedMenuItems[item.id] ?? false;
                                      const linkedDetails = (
                                        item.linkedComponents || []
                                      )
                                        .map((component) => {
                                          if (component.type === "product") {
                                            const product =
                                              catalogMetrics.productSummaries.find(
                                                (productItem) =>
                                                  productItem.id ===
                                                  component.id,
                                              );
                                            return product
                                              ? {
                                                  name: product.name,
                                                  detail: `Preço base ${formatMoney(product.metrics.salePrice)}`,
                                                  tag: getComponentTagLabel(
                                                    component.type,
                                                  ),
                                                }
                                              : null;
                                          }

                                          if (
                                            component.type === "preparation"
                                          ) {
                                            const preparation =
                                              catalogMetrics.preparationSummaries.find(
                                                (preparationItem) =>
                                                  preparationItem.id ===
                                                  component.id,
                                              );
                                            return preparation
                                              ? {
                                                  name: preparation.name,
                                                  detail: `${preparation.yieldQuantity} ${preparation.yieldUnit}`,
                                                  tag: getComponentTagLabel(
                                                    component.type,
                                                  ),
                                                }
                                              : null;
                                          }

                                          if (component.type === "ingredient") {
                                            const ingredient = ingredients.find(
                                              (ingredientItem) =>
                                                ingredientItem.id ===
                                                component.id,
                                            );
                                            return ingredient
                                              ? {
                                                  name: ingredient.name,
                                                  detail: "Uso complementar",
                                                  tag: getComponentTagLabel(
                                                    component.type,
                                                  ),
                                                }
                                              : null;
                                          }

                                          return null;
                                        })
                                        .filter(Boolean);
                                      const comboSummary =
                                        item.itemType === "combo"
                                          ? summarizeComboGroups(
                                              item.comboGroups,
                                            )
                                          : null;
                                      const comboGroups =
                                        item.itemType === "combo"
                                          ? item.comboGroups
                                          : [];
                                      const itemDescription = String(
                                        item.description || "",
                                      ).trim();
                                      const hasLongDescription =
                                        itemDescription.length >
                                        MENU_DESCRIPTION_PREVIEW_LIMIT;
                                      const descriptionId = `menu-item-accordion-description-${item.id}`;

                                      return (
                                        <div className="menu-item-accordion">
                                          {!menuSearchTerm.trim() &&
                                            categoryGroup.id !==
                                              "uncategorized" && (
                                              <button
                                                type="button"
                                                className="menu-drag-handle menu-drag-handle--item"
                                                aria-label={`Reordenar item ${item.name}`}
                                                {...handleProps}
                                              >
                                                <GripVertical size={15} />
                                              </button>
                                            )}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              toggleMenuItemExpansion(item.id)
                                            }
                                            className="menu-item-accordion__trigger"
                                            aria-expanded={itemExpanded}
                                          >
                                            <div className="menu-item-accordion__summary">
                                              <div className="menu-item-accordion__thumb">
                                                {item.photoPreview ? (
                                                  <img
                                                    src={item.photoPreview}
                                                    alt={item.name}
                                                    className="menu-item-accordion__image"
                                                  />
                                                ) : (
                                                  <div className="menu-item-accordion__placeholder">
                                                    <Eye size={16} />
                                                  </div>
                                                )}
                                              </div>
                                              <div className="min-w-0 text-left">
                                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                  {item.itemType ===
                                                    "combo" && (
                                                    <span className="menu-component-tag">
                                                      Combo
                                                    </span>
                                                  )}
                                                  <span
                                                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${statusMeta.badgeClass}`}
                                                  >
                                                    {statusMeta.label}
                                                  </span>
                                                  {linkedDetails.length > 0 && (
                                                    <span className="menu-component-tag">
                                                      {linkedDetails.length}{" "}
                                                      vínculo(s)
                                                    </span>
                                                  )}
                                                  {item.itemType ===
                                                    "combo" && (
                                                    <span className="menu-component-tag">
                                                      {comboGroups.length}{" "}
                                                      grupo(s)
                                                    </span>
                                                  )}
                                                </div>
                                                <p className="text-sm font-black text-[#2A1E15] uppercase tracking-tight truncate leading-tight">
                                                  {item.name}
                                                </p>
                                                <p
                                                  id={descriptionId}
                                                  className={`menu-item-accordion__description ${itemExpanded ? "menu-item-accordion__description--expanded" : ""}`}
                                                >
                                                  {itemDescription}
                                                </p>
                                                {item.itemType === "combo" && (
                                                  <p className="menu-item-accordion__support">
                                                    {comboSummary}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="menu-item-accordion__aside">
                                              <div className="text-right shrink-0">
                                                <p className="text-[9px] font-black text-[#6F6258] uppercase tracking-widest hidden sm:block">
                                                  {item.itemType === "combo"
                                                    ? "A partir de"
                                                    : "Preço"}
                                                </p>
                                                <p className="text-sm font-black text-[#2A1E15] whitespace-nowrap">
                                                  {formatMoney(
                                                    item.itemType === "combo"
                                                      ? item.basePrice || 0
                                                      : item.salePrice || 0,
                                                  )}
                                                </p>
                                                <p className="menu-item-accordion__support">
                                                  {item.itemType === "combo"
                                                    ? `${comboGroups.reduce((acc, group) => acc + group.options.length, 0)} opção(ões)`
                                                    : linkedDetails.length > 0
                                                      ? `${linkedDetails.length} vínculo(s)`
                                                      : "Sem vínculo"}
                                                </p>
                                              </div>
                                              <svg
                                                className={`menu-chevron ${itemExpanded ? "menu-chevron--open" : ""}`}
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth="2.5"
                                                  d="M19 9l-7 7-7-7"
                                                />
                                              </svg>
                                            </div>
                                          </button>
                                          {hasLongDescription ? (
                                            <div className="menu-item-accordion__description-action">
                                              <button
                                                type="button"
                                                aria-controls={descriptionId}
                                                aria-expanded={itemExpanded}
                                                onClick={() =>
                                                  toggleMenuItemExpansion(
                                                    item.id,
                                                  )
                                                }
                                                className="menu-item-accordion__description-toggle"
                                              >
                                                {itemExpanded
                                                  ? "Ver menos"
                                                  : "Ver mais"}
                                              </button>
                                            </div>
                                          ) : null}

                                          {itemExpanded && (
                                            <div className="menu-item-accordion__content">
                                              <div className="menu-item-accordion__body">
                                                <div className="menu-item-detail-card">
                                                  <p className="menu-item-detail-card__label">
                                                    Descrição
                                                  </p>
                                                  <p className="menu-item-detail-card__text">
                                                    {item.description}
                                                  </p>
                                                </div>
                                                <div className="menu-item-detail-card">
                                                  <p className="menu-item-detail-card__label">
                                                    {item.itemType === "combo"
                                                      ? "Preço base"
                                                      : "Status"}
                                                  </p>
                                                  <p className="menu-item-detail-card__text">
                                                    {item.itemType === "combo"
                                                      ? formatMoney(
                                                          item.basePrice || 0,
                                                        )
                                                      : statusMeta.label}
                                                  </p>
                                                </div>
                                              </div>

                                              {item.itemType === "combo" ? (
                                                <div className="space-y-3">
                                                  <div className="flex items-center justify-between gap-3">
                                                    <p className="text-[10px] font-black text-[#6F6258] uppercase tracking-widest">
                                                      Grupos do combo
                                                    </p>
                                                    <span className="text-[10px] font-black text-[#2A1E15] uppercase">
                                                      {comboGroups.length}{" "}
                                                      grupo(s)
                                                    </span>
                                                  </div>
                                                  <div className="combo-preview-grid">
                                                    {comboGroups.map(
                                                      (group) => (
                                                        <div
                                                          key={group.id}
                                                          className="combo-preview-card"
                                                        >
                                                          <div className="flex items-center justify-between gap-3">
                                                            <div>
                                                              <p className="combo-preview-card__eyebrow">
                                                                Grupo
                                                              </p>
                                                              <p className="combo-preview-card__title">
                                                                {group.name}
                                                              </p>
                                                            </div>
                                                            <span className="menu-component-tag">
                                                              De{" "}
                                                              {group.minSelect}{" "}
                                                              a{" "}
                                                              {group.maxSelect}
                                                            </span>
                                                          </div>
                                                          <div className="space-y-2 mt-3">
                                                            {group.options.map(
                                                              (option) => (
                                                                <div
                                                                  key={
                                                                    option.id
                                                                  }
                                                                  className={`combo-preview-option ${option.isAvailable ? "" : "combo-preview-option--disabled"}`}
                                                                >
                                                                  <div>
                                                                    <p className="combo-preview-option__name">
                                                                      {
                                                                        option.name
                                                                      }
                                                                    </p>
                                                                    <p className="combo-preview-option__meta">
                                                                      {option.extraPrice >
                                                                      0
                                                                        ? `+ ${formatMoney(option.extraPrice)}`
                                                                        : "R$ 0,00"}{" "}
                                                                      • Máx.{" "}
                                                                      {
                                                                        option.maxQty
                                                                      }
                                                                    </p>
                                                                  </div>
                                                                  <span
                                                                    className={`combo-preview-option__status ${option.isAvailable ? "combo-preview-option__status--active" : ""}`}
                                                                  >
                                                                    {option.isAvailable
                                                                      ? "Ativo"
                                                                      : "Esgotado"}
                                                                  </span>
                                                                </div>
                                                              ),
                                                            )}
                                                          </div>
                                                        </div>
                                                      ),
                                                    )}
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="space-y-2">
                                                  <div className="flex items-center justify-between gap-3">
                                                    <p className="text-[10px] font-black text-[#6F6258] uppercase tracking-widest">
                                                      Relacionamentos
                                                    </p>
                                                    <span className="text-[10px] font-black text-[#2A1E15] uppercase">
                                                      {linkedDetails.length}{" "}
                                                      item(ns)
                                                    </span>
                                                  </div>
                                                  <div className="menu-related-grid">
                                                    {linkedDetails.length >
                                                    0 ? (
                                                      linkedDetails.map(
                                                        (detail, index) => (
                                                          <div
                                                            key={`${item.id}-${detail.name}-${index}`}
                                                            className="menu-related-card"
                                                          >
                                                            <span className="menu-component-tag">
                                                              {detail.tag}
                                                            </span>
                                                            <p className="text-sm font-black text-[#2A1E15] uppercase tracking-tight mt-3">
                                                              {detail.name}
                                                            </p>
                                                            <p className="text-[11px] text-[#6F6258] font-semibold mt-1">
                                                              {detail.detail}
                                                            </p>
                                                          </div>
                                                        ),
                                                      )
                                                    ) : (
                                                      <div className="menu-empty-state">
                                                        <Sparkles
                                                          size={16}
                                                          className="text-[#D4A373]"
                                                        />
                                                        <span>
                                                          Nenhum relacionamento
                                                          adicional para este
                                                          item.
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              )}

                                              <div className="flex items-center justify-end gap-2 pt-2">
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    item.itemType === "combo"
                                                      ? handleEditCombo(item)
                                                      : handleEditMenuItem(item)
                                                  }
                                                  className="menu-action-button menu-action-button--edit"
                                                >
                                                  <Edit size={14} /> Editar
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleDeleteMenuItem(
                                                      item.id,
                                                    )
                                                  }
                                                  className="menu-action-button menu-action-button--delete"
                                                >
                                                  <Trash2 size={14} /> Excluir
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }}
                                  />
                                ) : (
                                  <div className="menu-empty-state">
                                    <ChefHat
                                      size={18}
                                      className="text-[#D4A373]"
                                    />
                                    <span>Nenhum item nesta categoria.</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      };

                      return (
                        <>
                          <SortableList
                            items={realCategoryGroups}
                            disabled={Boolean(menuSearchTerm.trim())}
                            className="menu-accordion-list__sortable"
                            onReorder={(nextGroups) => {
                              const nextCategories = nextGroups
                                .map((group) =>
                                  menuCategories.find(
                                    (category) => category.id === group.id,
                                  ),
                                )
                                .filter(Boolean);
                              handleReorderMenuCategories(nextCategories);
                            }}
                            renderItem={({
                              item: categoryGroup,
                              handleProps,
                            }) =>
                              renderCategoryGroup(categoryGroup, handleProps)
                            }
                          />
                          {uncategorizedCategoryGroups.map((categoryGroup) =>
                            renderCategoryGroup(categoryGroup),
                          )}
                        </>
                      );
                    })()}

                    {menuItemsByCategory.length === 0 && (
                      <div className="menu-empty-state menu-empty-state--large">
                        <ChefHat size={18} className="text-[#D4A373]" />
                        <span>Nenhum item de cardápio encontrado.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <OrderOperationsPage
              tenantSlug={tenantSlug}
              menuItems={menuItems}
              menuCategories={menuCategories}
              orders={orders}
              customers={customers}
              paymentMethods={paymentMethods}
              deliveryDrivers={deliveryDrivers}
              autoAcceptOrders={autoAcceptOrders}
              onCreateCustomer={handleCreateCustomer}
              onCreateOrder={handleCreateOrder}
              onUpdateOrder={handleUpdateOrder}
              onCreatePaymentMethod={handleCreatePaymentMethod}
              onToggleAutoAcceptOrders={() =>
                setAutoAcceptOrders((current) => !current)
              }
            />
          )}

          {activeTab === "reviews" && (
            <div className="max-w-7xl mx-auto">
              <ReviewManagementPage />
            </div>
          )}

          {activeTab === "cmv" && (
            <div className="space-y-6 xl:space-y-8">
              <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-[#2A1E15] uppercase tracking-tighter">
                    CMV de caixa
                  </h3>
                  <p className="mt-1 text-xs font-bold text-[#6F6258]">
                    CMV provisório = (gasto com insumos − refeição dos
                    funcionários) ÷ faturamento oficial.
                  </p>
                </div>
                <CatalogExcelTools
                  ingredients={ingredients}
                  products={products}
                  preparations={preparations}
                  onImport={handleCatalogExcelImport}
                />
                <label className="w-full sm:w-56">
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-[#6F6258]">
                    Competência
                  </span>
                  <input
                    type="date"
                    value={`${cmvCashMonth}-01`}
                    onChange={(event) =>
                      setCmvCashMonth(event.target.value.slice(0, 7))
                    }
                    onClick={(event) => event.currentTarget.showPicker?.()}
                    className="w-full rounded-xl border border-[#D4A373]/45 bg-[#FFF8EC] px-3 py-2 font-black text-[#2A1E15] outline-none focus:ring-2 focus:ring-[#D4A373]"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 xl:gap-8">
                <StatCard
                  variant="metric-card--cmv-neutral"
                  title="Insumos"
                  value={ingredients.length}
                  icon={Receipt}
                  colorClass="text-[#2A1E15]"
                  bgColorClass="bg-[#2A1E15]/10"
                  iconColorClass="text-[#2A1E15]"
                />
                <StatCard
                  variant="metric-card--cmv-product"
                  title="Produtos"
                  value={products.length}
                  icon={ShoppingBag}
                  colorClass="text-blue-700"
                  bgColorClass="bg-blue-50"
                  iconColorClass="text-blue-700"
                />
                <StatCard
                  variant="metric-card--cmv-health"
                  title={
                    cashCmv.status === "CLOSED" ? "CMV Real" : "CMV Provisório"
                  }
                  value={`${cashCmv.percentage.toFixed(2)}%`}
                  icon={PieChart}
                  colorClass={
                    cashCmv.percentage > 35 ? "text-red-700" : "text-green-700"
                  }
                  bgColorClass={
                    cashCmv.percentage > 35 ? "bg-red-50" : "bg-green-50"
                  }
                  iconColorClass={
                    cashCmv.percentage > 35 ? "text-red-700" : "text-green-700"
                  }
                />
                <StatCard
                  variant="metric-card--cmv-markup"
                  title="Markup Médio"
                  value={`${catalogMetrics.averageMarkupPercent.toFixed(1)}%`}
                  icon={DollarSign}
                  colorClass="text-amber-700"
                  bgColorClass="bg-amber-50"
                  iconColorClass="text-amber-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-stone-100 bg-white p-4">
                  <p className="text-[9px] font-black uppercase text-[#6F6258]">
                    Faturamento oficial
                  </p>
                  <p className="mt-2 font-black text-[#2A1E15]">
                    {formatMoney(cashCmv.revenue)}
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-100 bg-white p-4">
                  <p className="text-[9px] font-black uppercase text-[#6F6258]">
                    Insumos bruto
                  </p>
                  <p className="mt-2 font-black text-[#2A1E15]">
                    {formatMoney(cashCmv.grossInputCost)}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-[9px] font-black uppercase text-amber-800">
                    (-) Refeição funcionários
                  </p>
                  <p className="mt-2 font-black text-amber-900">
                    {formatMoney(cashCmv.mealDeduction)}
                  </p>
                </div>
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-[9px] font-black uppercase text-green-800">
                    Base considerada no CMV
                  </p>
                  <p className="mt-2 font-black text-green-900">
                    {formatMoney(cashCmv.inputCost)}
                  </p>
                </div>
              </div>

              {settingsError && (
                <p
                  role="alert"
                  className="text-xs text-red-700 font-bold bg-red-50 p-4 rounded-2xl border border-red-100 uppercase tracking-wide"
                >
                  {settingsError}
                </p>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
                <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-black text-[#2A1E15] uppercase mb-6 tracking-tighter">
                    Cadastro de Insumos
                  </h3>
                  <form
                    onSubmit={handleSubmitIngredient}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end"
                  >
                    <CustomInput
                      label="Nome do Insumo"
                      value={ingredientForm.name}
                      onChange={(e) =>
                        handleIngredientFormChange("name", e.target.value)
                      }
                      required
                    />
                    <div className="space-y-1">
                      <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                        Unidade
                      </label>
                      <SearchableSelect
                        value={resolveUnitValue(
                          ingredientUnits,
                          ingredientForm.unit,
                        )}
                        onChange={(val) =>
                          handleIngredientFormChange("unit", val)
                        }
                        options={ingredientUnits.map((unit) => ({
                          value: unit.label,
                          label: formatComboboxLabel(unit.label),
                        }))}
                        placeholder="Selecione"
                      />
                    </div>
                    <CustomInput
                      label={`Custo por ${getIngredientCostReferenceUnit(ingredientForm.unit)}`}
                      type="currency"
                      step="0.01"
                      value={ingredientForm.unitCost}
                      onChange={(e) =>
                        handleIngredientFormChange("unitCost", e.target.value)
                      }
                      required
                    />
                    <CustomInput
                      label="Categoria"
                      value={ingredientForm.category}
                      onChange={(e) =>
                        handleIngredientFormChange("category", e.target.value)
                      }
                    />
                    <CustomInput
                      label="Estoque mínimo (opcional)"
                      type="number"
                      min="0"
                      step="any"
                      value={ingredientForm.stockMinimum}
                      onChange={(e) =>
                        handleIngredientFormChange(
                          "stockMinimum",
                          e.target.value,
                        )
                      }
                    />
                    <div className="space-y-1">
                      <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                        Fornecedor principal
                      </label>
                      <select
                        value={ingredientForm.primarySupplierId}
                        onChange={(e) =>
                          handleIngredientFormChange(
                            "primarySupplierId",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium"
                      >
                        <option value="">Não definido</option>
                        {(supplyChainData.suppliers || [])
                          .filter((supplier) => supplier.active)
                          .map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 pb-2 text-xs font-black uppercase text-[#6F6258]">
                      <input
                        type="checkbox"
                        checked={ingredientForm.active}
                        onChange={(e) =>
                          handleIngredientFormChange("active", e.target.checked)
                        }
                      />{" "}
                      Insumo ativo
                    </label>
                    <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3">
                      <button
                        type="submit"
                        disabled={isSavingMutation("ingredient")}
                        className="flex-1 bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingMutation("ingredient")
                          ? "Salvando..."
                          : editingIngredientId
                            ? "Salvar Insumo"
                            : "Registrar Insumo"}
                      </button>
                      {editingIngredientId && (
                        <button
                          type="button"
                          onClick={resetIngredientForm}
                          className="flex-1 bg-gray-100 text-[#6F6258] h-11 rounded-xl font-black uppercase text-[10px]"
                        >
                          Cancelar Edição
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="mt-6 flex flex-col gap-4">
                    <div className="relative">
                      <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F6258]"
                      />
                      <input
                        type="text"
                        placeholder="Buscar insumo..."
                        value={ingredientSearch}
                        onChange={(e) => setIngredientSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:border-[#D4A373] focus:ring-1 focus:ring-[#D4A373] outline-none text-sm font-semibold text-[#2A1E15] bg-gray-50/50"
                      />
                    </div>
                    <div className="max-h-[26rem] overflow-y-auto pr-2 space-y-3">
                      {ingredients
                        .filter((ingredient) =>
                          ingredient.name
                            .toLowerCase()
                            .includes(ingredientSearch.toLowerCase()),
                        )
                        .map((ingredient) => (
                          <div
                            key={ingredient.id}
                            className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <p className="font-black text-[#2A1E15] uppercase truncate">
                                {ingredient.name}{" "}
                                {ingredient.active === false && (
                                  <span className="text-red-700">
                                    · inativo
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-[#6F6258] font-bold uppercase">
                                Custo por{" "}
                                {getIngredientCostReferenceUnit(
                                  ingredient.unit,
                                )}
                                :{" "}
                                {formatMoney(
                                  getIngredientCostReferenceValue(ingredient),
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditIngredient(ingredient)}
                                className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                                title="Editar insumo"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteIngredient(ingredient.id)
                                }
                                disabled={ingredient.active === false}
                                className="p-2 text-red-400 hover:text-red-600 transition-colors disabled:opacity-30"
                                title="Inativar insumo sem apagar histórico"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <h3 className="text-lg font-black text-[#2A1E15] uppercase tracking-tighter">
                      Ficha Técnica do Produto
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsPreparationManagerModalOpen(true)}
                        className="text-[10px] font-black text-[#D4A373] border border-[#D4A373] px-3 py-2 rounded-full uppercase hover:bg-[#C58F5E] hover:text-[#2B2520] transition-all w-full sm:w-auto"
                      >
                        Editar Receitas
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          resetPreparationForm();
                          setIsPreparationModalOpen(true);
                        }}
                        className="text-[10px] font-black text-[#D4A373] border border-[#D4A373] px-3 py-2 rounded-full uppercase hover:bg-[#C58F5E] hover:text-[#2B2520] transition-all w-full sm:w-auto"
                      >
                        Registrar Receita
                      </button>
                    </div>
                  </div>
                  <form onSubmit={handleAddProduct} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CustomInput label="Produto" name="name" required />
                      <CustomInput
                        label="Preço de Venda"
                        name="salePrice"
                        type="currency"
                        step="0.01"
                        required
                      />
                      <CustomInput
                        label="Rendimento"
                        name="yieldQuantity"
                        type="number"
                        step="0.01"
                        defaultValue="1"
                        required
                      />
                      <CustomInput
                        label="CMV Alvo (%)"
                        name="targetCmvPercent"
                        type="number"
                        step="0.1"
                        defaultValue="30"
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-[#2A1E15] uppercase">
                          Receita / Componentes
                        </p>
                        <button
                          type="button"
                          onClick={handleAddRecipeLine}
                          className="text-[10px] font-black text-[#D4A373] border border-[#D4A373] px-3 py-2 rounded-full uppercase hover:bg-[#C58F5E] hover:text-[#2B2520] transition-all"
                        >
                          Adicionar Componente
                        </button>
                      </div>

                      {productRecipeDraft.map((line) => {
                        const baseUnit = getComponentBaseUnit(
                          line.componentRef,
                          ingredients,
                          preparations,
                        );
                        const compatibleUnits = getCompatibleUnits(
                          baseUnit,
                          ingredientUnits,
                        );

                        return (
                          <div
                            key={line.id}
                            className="grid grid-cols-1 sm:grid-cols-[1fr_130px_110px_48px] gap-3 items-end"
                          >
                            <div className="space-y-1">
                              <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                                Componente
                              </label>
                              <SearchableSelect
                                value={line.componentRef}
                                onChange={(val) =>
                                  handleRecipeDraftChange(
                                    line.id,
                                    "componentRef",
                                    val,
                                  )
                                }
                                options={[
                                  {
                                    label: "Insumos",
                                    options: ingredients.map((ingredient) => ({
                                      value: `ingredient:${ingredient.id}`,
                                      label: formatComboboxLabel(
                                        ingredient.name,
                                      ),
                                    })),
                                  },
                                  {
                                    label: "Receitas Base",
                                    options: preparations.map(
                                      (preparation) => ({
                                        value: `preparation:${preparation.id}`,
                                        label: formatComboboxLabel(
                                          preparation.name,
                                        ),
                                      }),
                                    ),
                                  },
                                ]}
                                placeholder="Selecione"
                              />
                            </div>

                            <CustomInput
                              label="Quantidade"
                              type="number"
                              step="0.01"
                              value={line.quantity}
                              onChange={(e) =>
                                handleRecipeDraftChange(
                                  line.id,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                              required
                            />

                            <div className="space-y-1">
                              <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                                Unidade
                              </label>
                              <SearchableSelect
                                value={resolveCompatibleUnitValue(
                                  ingredientUnits,
                                  baseUnit,
                                  line.quantityUnit,
                                )}
                                onChange={(val) =>
                                  handleRecipeDraftChange(
                                    line.id,
                                    "quantityUnit",
                                    val,
                                  )
                                }
                                options={compatibleUnits.map((unit) => ({
                                  value: unit.label,
                                  label: formatComboboxLabel(unit.label),
                                }))}
                                disabled={!line.componentRef}
                                placeholder="Selecione"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveRecipeLine(line.id)}
                              disabled={productRecipeDraft.length === 1}
                              className={`h-11 rounded-xl transition-colors ${productRecipeDraft.length === 1 ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-red-50 text-red-500 hover:bg-red-100"}`}
                            >
                              <Trash2 size={16} className="mx-auto" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingMutation("product")}
                      className="w-full bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingMutation("product")
                        ? "Salvando..."
                        : "Cadastrar Produto"}
                    </button>
                  </form>
                </div>
              </div>

              {/* ── Campo de busca ── */}
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-[#6F6258]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  placeholder="Buscar produto por nome..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#D4A373] focus:border-transparent shadow-sm transition-all"
                />
                {productSearchTerm && (
                  <button
                    onClick={() => setProductSearchTerm("")}
                    className="absolute inset-y-0 right-3 flex items-center px-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* ── Grid de cards de produtos ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-5">
                {catalogMetrics.productSummaries
                  .filter((p) =>
                    p.name
                      .toLowerCase()
                      .includes(productSearchTerm.toLowerCase().trim()),
                  )
                  .map((product) => {
                    const cmvOk =
                      product.metrics.cmvPercent <=
                      product.metrics.targetCmvPercent;
                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                      >
                        {/* ── Header: Nome do produto ── */}
                        <div className="bg-[#3B2415] px-4 py-3 rounded-t-2xl">
                          <h3 className="cmv-product-card__name text-sm font-black text-[#FFFFFF] uppercase tracking-tight leading-tight">
                            {product.name}
                          </h3>
                          <p className="text-xs text-[#FFE6C4] font-bold mt-0.5">
                            Venda: {formatMoney(product.metrics.salePrice)}
                          </p>
                        </div>

                        {/* ── Métricas em grid de badges ── */}
                        <div className="px-4 pt-4 pb-3">
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="flex flex-col items-center px-2 py-1.5 bg-[#2A1E15]/5 rounded-lg">
                              <span className="text-[8px] font-bold text-[#6F6258] uppercase tracking-wider leading-tight">
                                Custo Receita
                              </span>
                              <span className="text-xs font-black text-[#2A1E15]">
                                {formatMoney(product.metrics.recipeCost)}
                              </span>
                            </div>
                            <div className="flex flex-col items-center px-2 py-1.5 bg-amber-50 rounded-lg">
                              <span className="text-[8px] font-bold text-[#6F6258] uppercase tracking-wider leading-tight">
                                Markup
                              </span>
                              <span className="text-xs font-black text-amber-700">
                                {product.metrics.markupPercent.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                            <div
                              className={`flex flex-col items-center px-2 py-1.5 rounded-lg ${cmvOk ? "bg-green-50" : "bg-red-50"}`}
                            >
                              <span className="text-[8px] font-bold text-[#6F6258] uppercase tracking-wider leading-tight">
                                CMV Atual
                              </span>
                              <span
                                className={`text-xs font-black ${cmvOk ? "text-green-700" : "text-red-600"}`}
                              >
                                {product.metrics.cmvPercent.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex flex-col items-center px-2 py-1.5 bg-amber-50/60 rounded-lg border border-amber-100">
                              <span className="text-[8px] font-bold text-[#6F6258] uppercase tracking-wider leading-tight">
                                Preço Sug.
                              </span>
                              <span className="text-xs font-black text-amber-600">
                                {formatMoney(product.metrics.suggestedPrice)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ── Componentes em lista full-width ── */}
                        {product.recipe.length > 0 && (
                          <div className="border-t border-gray-100 px-4 py-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                            {product.recipe.map((item, index) => {
                              const ingredient =
                                item.componentType === "ingredient"
                                  ? findById(ingredients, item.componentId)
                                  : null;
                              const preparation =
                                item.componentType === "preparation"
                                  ? findById(preparations, item.componentId)
                                  : null;
                              const componentName =
                                ingredient?.name ||
                                preparation?.name ||
                                "Componente removido";
                              const componentUnit =
                                item.quantityUnit ||
                                ingredient?.unit ||
                                preparation?.yieldUnit ||
                                "";
                              const componentUnitCost =
                                item.componentType === "ingredient"
                                  ? calculateIngredientUnitCost(ingredient)
                                  : catalogMetrics.preparationSummaries.find(
                                      (c) => idsEqual(c.id, item.componentId),
                                    )?.metrics.unitCost || 0;
                              const sourceUnit =
                                ingredient?.unit ||
                                preparation?.yieldUnit ||
                                componentUnit;
                              const { lineCost } = calculateComponentLineCost({
                                quantity: item.quantity,
                                quantityUnit: componentUnit,
                                componentSourceUnit: sourceUnit,
                                componentUnitCost,
                              });

                              return (
                                <div
                                  key={`${product.id}-${index}`}
                                  className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-b-0"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm shrink-0">🧂</span>
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-black text-[#2A1E15] uppercase leading-tight truncate">
                                        {componentName}
                                      </p>
                                      <p className="text-[9px] text-[#6F6258] font-semibold">
                                        {item.quantity} {componentUnit}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-black text-gray-600 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 shrink-0">
                                    {formatMoney(lineCost)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* ── Footer com indicadores ── */}
                        <div className="border-t border-gray-100 px-4 py-2.5 mt-auto">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-bold">
                            <span className="text-[#2A1E15]">
                              Lucro bruto:{" "}
                              <strong className="font-black">
                                {formatMoney(product.metrics.grossMargin)}
                              </strong>
                            </span>
                            <span className="text-[#6F6258]">
                              CMV alvo:{" "}
                              <strong className="font-black">
                                {product.metrics.targetCmvPercent.toFixed(1)}%
                              </strong>
                            </span>
                            <span className="text-blue-600">
                              Margem s/ venda:{" "}
                              <strong className="font-black">
                                {product.metrics.marginPercent.toFixed(1)}%
                              </strong>
                            </span>
                          </div>
                          <div className="flex justify-end gap-3 mt-2">
                            <button
                              type="button"
                              onClick={() => handleEditProduct(product)}
                              className="flex items-center gap-1 text-[9px] font-bold text-blue-500 hover:text-blue-700 uppercase tracking-wide transition-colors"
                            >
                              <Edit size={11} /> Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="flex items-center gap-1 text-[9px] font-bold text-red-400 hover:text-red-600 uppercase tracking-wide transition-colors"
                            >
                              <Trash2 size={11} /> Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {catalogMetrics.productSummaries.filter((p) =>
                  p.name
                    .toLowerCase()
                    .includes(productSearchTerm.toLowerCase().trim()),
                ).length === 0 && (
                  <p className="text-center text-sm font-bold text-[#6F6258] py-8 uppercase tracking-widest col-span-full">
                    Nenhum produto encontrado para &ldquo;{productSearchTerm}
                    &rdquo;
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "costs" && null}

          {activeTab === "financeiro" && (
            <div className="space-y-6">
              <div className="bg-white p-6 sm:p-10 rounded-[2rem] border border-gray-100 shadow-sm italic">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-8">
                  <div>
                    <h3 className="text-lg font-black text-[#2A1E15] uppercase tracking-tighter">
                      Lançamentos manuais
                    </h3>
                    <p className="mt-1 text-xs font-bold not-italic text-[#6F6258]">
                      Somente entradas e saídas avulsas. Recorrências,
                      obrigações e pagamentos possuem telas próprias.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsChannelModalOpen(true)}
                      className="rounded-xl bg-[#2A1E15] px-4 py-2 text-[9px] font-black uppercase text-white"
                    >
                      Gerenciar canais
                    </button>
                    <label className="rounded-xl border border-[#D4A373]/40 bg-[#FFF8EC] px-3 py-1.5 text-[9px] font-black uppercase text-[#6F6258]">
                      <span className="mr-2">Competência</span>
                      <input
                        type="month"
                        value={financeMonth}
                        onChange={(event) =>
                          setFinanceMonth(event.target.value)
                        }
                        className="bg-transparent font-black text-[#2A1E15] outline-none"
                        aria-label="Competência dos lançamentos financeiros"
                      />
                    </label>
                  </div>
                </div>
                {(financeError || financeSuccess) && (
                  <p
                    role={financeError ? "alert" : "status"}
                    className={`mb-5 p-4 rounded-2xl text-xs font-bold ${financeError ? "text-red-700 bg-red-50 border border-red-100" : "text-green-800 bg-green-50 border border-green-100"}`}
                  >
                    {financeError || financeSuccess}
                  </p>
                )}
                {financeFormType === "receita" ? (
                  <DailyRevenueForm
                    channels={salesChannels}
                    onSave={handleSaveDailyRevenue}
                    onSwitchExpense={() => setFinanceFormType("despesa")}
                    busy={isFinanceSubmitting}
                  />
                ) : (
                  <form
                    noValidate
                    onSubmit={handleAddTransaction}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-end italic"
                  >
                    <div className="md:col-span-2 xl:col-span-3">
                      <button
                        type="button"
                        onClick={() => {
                          setFinanceFormType("receita");
                          setFinanceError("");
                        }}
                        className="rounded-xl bg-stone-100 px-4 py-3 text-[10px] font-black uppercase text-[#2A1E15]"
                      >
                        ← Voltar para lançamentos
                      </button>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#6F6258] uppercase ml-1 not-italic tracking-widest">
                        Tipo
                      </label>
                      <SearchableSelect
                        name="type"
                        value={financeFormType}
                        onChange={setFinanceFormType}
                        options={[
                          { value: "receita", label: "Entrada" },
                          { value: "despesa", label: "Saída" },
                        ]}
                        placeholder="Selecione"
                      />
                    </div>
                    <CustomInput
                      label={
                        financeFormType === "receita"
                          ? "Valor de Entrada"
                          : "Valor de Saída"
                      }
                      name="amount"
                      type="currency"
                      step="0.01"
                      required
                    />
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#6F6258] uppercase ml-1 not-italic tracking-widest">
                        {financeFormType === "receita" ? "Canal" : "Categoria"}
                      </label>
                      <SearchableSelect
                        name="reference"
                        required
                        options={(financeFormType === "receita"
                          ? salesChannels
                          : financeExpenseCategories
                        ).map((item) => ({
                          value: item.name,
                          label: item.name,
                        }))}
                        placeholder="Selecione"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#6F6258] uppercase ml-1 not-italic tracking-widest">
                        Pagamento
                      </label>
                      <SearchableSelect
                        name="payment"
                        defaultValue="pix"
                        required
                        options={[
                          { value: "pix", label: "PIX" },
                          { value: "cartao", label: "Cartão" },
                          { value: "online", label: "Online" },
                          { value: "dinheiro", label: "Dinheiro" },
                        ]}
                        placeholder="Selecione"
                      />
                    </div>
                    {financeFormType === "despesa" && (
                      <div className="space-y-1">
                        <label className="ml-1 text-[9px] font-black uppercase not-italic tracking-widest text-[#6F6258]">
                          Categoria econômica
                        </label>
                        <select
                          name="economicCategory"
                          defaultValue="OUTROS"
                          className="h-11 w-full rounded-xl border border-[#D9C5A7] bg-white px-3 text-sm font-bold"
                        >
                          <option value="INSUMO">Insumo / CMV</option>
                          <option value="MARKETING">Marketing / vendas</option>
                          <option value="IMPOSTO">Imposto</option>
                          <option value="FINANCEIRO">Despesa financeira</option>
                          <option value="OUTROS">Outros</option>
                        </select>
                      </div>
                    )}
                    {financeFormType === "despesa" && (
                      <div className="space-y-1">
                        <label className="ml-1 text-[9px] font-black uppercase not-italic tracking-widest text-[#6F6258]">
                          Origem do dinheiro
                        </label>
                        <select
                          name="financialOrigin"
                          defaultValue="BANK"
                          className="h-11 w-full rounded-xl border border-[#D9C5A7] bg-white px-3 text-sm font-bold"
                        >
                          <option value="BANK">Conta / banco</option>
                          <option value="CASH">Dinheiro físico</option>
                        </select>
                      </div>
                    )}
                    <CustomInput
                      label="Data"
                      name="date"
                      type="date"
                      defaultValue={localDateIso()}
                      required
                    />
                    <CustomInput label="Observação" name="note" />
                    <button
                      type="submit"
                      disabled={isFinanceSubmitting}
                      className="bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-lg disabled:opacity-60 disabled:cursor-wait"
                    >
                      {isFinanceSubmitting ? "Registrando..." : "Lançar"}
                    </button>
                  </form>
                )}
              </div>
              <ChannelSettlementsPanel
                settlements={channelSettlements}
                onReceive={handleReceiveChannelSettlement}
                busy={isFinanceSubmitting}
              />
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h4 className="text-sm font-black text-[#2A1E15] uppercase tracking-widest">
                      Lançamentos da competência
                    </h4>
                    <span className="text-[10px] font-black text-[#6F6258] uppercase">
                      {visibleFinanceTransactions.length} de{" "}
                      {financeTransactions.length} registros em {financeMonth}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["MANUAL", "Manuais"],
                      ["IMPORTED", "Histórico importado"],
                      ["ALL", "Todos"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFinanceSourceFilter(value)}
                        className={`rounded-xl px-3 py-2 text-[9px] font-black uppercase ${financeSourceFilter === value ? "bg-[#2A1E15] text-white" : "bg-stone-100 text-[#6F6258]"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {visibleFinanceTransactions.map((t) => {
                    const presentation = describeTransactionType(t);
                    return (
                      <div
                        key={t.id}
                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between italic"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-1 h-8 rounded-full ${presentation.tone === "income" ? (t.platform === "ifood" ? "bg-[#2A1E15]" : "bg-[#D4A373]") : presentation.tone === "control" ? "bg-blue-400" : "bg-red-500"}`}
                          />
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-[#2A1E15] uppercase truncate font-sans">
                              {presentation.label} - {t.category}
                            </p>
                            <p className="text-[9px] font-bold text-gray-400 font-mono uppercase">
                              {formatDateOnlyBr(t.date)} |{" "}
                              {presentation.tone === "income"
                                ? `${t.platform} | ${t.payment}`
                                : `${t.payment || "sem forma"} | ${t.category}`}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              {isImportedFinancialTransaction(t) && (
                                <span className="rounded bg-blue-50 px-2 py-0.5 text-[8px] font-black uppercase text-blue-700">
                                  Importado
                                </span>
                              )}
                              {t.note && (
                                <p className="text-[9px] font-bold text-gray-400 truncate uppercase">
                                  {t.note}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p
                            className={`text-xs font-black tracking-tighter tabular-nums ${presentation.tone === "income" ? "text-green-700" : presentation.tone === "control" ? "text-blue-700" : "text-red-600"}`}
                          >
                            {presentation.sign && `${presentation.sign} `}
                            {formatMoney(Math.abs(Number(t.amount) || 0))}
                          </p>
                          <button
                            type="button"
                            disabled={isFinanceSubmitting}
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="text-gray-200 hover:text-red-500 transition-colors"
                            aria-label={`Excluir lançamento ${t.note || t.category || t.id}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {visibleFinanceTransactions.length === 0 && (
                    <p className="py-8 text-center text-sm font-bold text-[#6F6258]">
                      Nenhum lançamento nesta competência e origem.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "recorrentes" && (
            <RecurringCostsPage
              costs={sortedRecurringCosts}
              categories={costCategories}
              onCreate={handleCreateRecurringCost}
              onUpdate={handleUpdateCost}
              onArchive={handleDeleteRecurringCost}
              onOpenCostCategories={() => setIsCatModalOpen(true)}
              onOpenFinanceCategories={() =>
                setIsFinanceCategoryModalOpen(true)
              }
              isSaving={
                isFinanceSubmitting ||
                Object.keys(savingMutations).some((key) =>
                  key.includes("recurring-cost"),
                )
              }
            />
          )}

          {activeTab === "rh" && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setRhView("fixed")}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${rhView === "fixed" ? "bg-[#2A1E15] text-[#FFFFFF]" : "bg-stone-100 text-[#2A1E15]"}`}
                  >
                    Funcionários Fixos
                  </button>
                  <button
                    type="button"
                    onClick={() => setRhView("external")}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${rhView === "external" ? "bg-[#2A1E15] text-[#FFFFFF]" : "bg-stone-100 text-[#2A1E15]"}`}
                  >
                    Funcionários Por Fora
                  </button>
                  <button
                    type="button"
                    onClick={() => setRhView("workforce")}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${rhView === "workforce" ? "bg-[#2A1E15] text-[#FFFFFF]" : "bg-stone-100 text-[#2A1E15]"}`}
                  >
                    Conferência e Fechamentos
                  </button>
                  <button
                    type="button"
                    onClick={() => setRhView("history")}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${rhView === "history" ? "bg-[#2A1E15] text-[#FFFFFF]" : "bg-stone-100 text-[#2A1E15]"}`}
                  >
                    Histórico de Funcionários
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                  {rhView === "fixed" && (
                    <button
                      onClick={() => setIsRoleModalOpen(true)}
                      className="text-[10px] font-black text-[#D4A373] border border-[#D4A373] px-3 py-2 rounded-full uppercase hover:bg-[#C58F5E] hover:text-[#2B2520] transition-all w-full sm:w-auto"
                    >
                      Cargos RH
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      openCreateEmployeeModal(
                        rhView === "fixed" ? "fixed" : "external",
                      )
                    }
                    disabled={rhView === "workforce" || rhView === "history"}
                    className="text-[10px] font-black bg-[#2A1E15] text-[#FFFFFF] px-4 py-2 rounded-full uppercase shadow-md hover:bg-[#C58F5E] hover:text-[#2B2520] transition-all w-full sm:w-auto"
                  >
                    Cadastrar Funcionário
                  </button>
                </div>
              </div>

              {rhView === "fixed" && (
                <>
                  <div className="flex justify-end">
                    <label className="w-full sm:w-56">
                      <span className="mb-1 block text-[10px] font-black uppercase text-[#6F6258]">
                        Competência da folha
                      </span>
                      <input
                        type="month"
                        value={fixedPayrollMonth}
                        onChange={(event) =>
                          setFixedPayrollMonth(event.target.value)
                        }
                        className="w-full rounded-xl border border-[#D4A373]/40 bg-[#FFF8EC] px-4 py-3 text-sm font-black text-[#2A1E15]"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                      title="Folha Bruta"
                      value={formatMoney(payrollSummary.totals.grossPayroll)}
                      icon={Users}
                      colorClass="text-[#2A1E15]"
                      bgColorClass="bg-stone-100"
                      iconColorClass="text-[#2A1E15]"
                    />
                    <StatCard
                      title="Pagamento final"
                      value={formatMoney(
                        payrollSummary.totals.salaryPaymentTotal,
                      )}
                      icon={DollarSign}
                      colorClass="text-[#2A1E15]"
                      bgColorClass="bg-stone-100"
                      iconColorClass="text-[#2A1E15]"
                    />
                    <StatCard
                      title="Primeiro pagamento"
                      value={formatMoney(payrollSummary.totals.advanceTotal)}
                      icon={Wallet}
                      colorClass="text-[#2A1E15]"
                      bgColorClass="bg-stone-100"
                      iconColorClass="text-[#2A1E15]"
                    />
                    <StatCard
                      title="Descontos"
                      value={formatMoney(
                        payrollSummary.totals.extraDiscountTotal,
                      )}
                      icon={Receipt}
                      colorClass="text-[#2A1E15]"
                      bgColorClass="bg-stone-100"
                      iconColorClass="text-[#2A1E15]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payrollAlerts
                      .filter(
                        (alert) => !String(alert.id).startsWith("external-"),
                      )
                      .map((alert) => (
                        <div
                          key={alert.id}
                          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-[#6F6258] uppercase tracking-widest">
                              {alert.title}
                            </p>
                            <p className="text-sm font-black text-[#2A1E15] uppercase truncate">
                              {formatDateBr(alert.date)}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {alert.description}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-black text-[#2A1E15]">
                              {formatMoney(alert.amount)}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">
                              {alert.daysUntil === 0
                                ? "Hoje"
                                : alert.daysUntil > 0
                                  ? `Em ${alert.daysUntil} dia(s)`
                                  : "Vencido"}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm italic">
                    <h3 className="text-lg font-black text-[#2A1E15] uppercase flex items-center gap-2 mb-6 tracking-tighter">
                      <Briefcase size={20} /> Regras de Pagamento RH
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                      <CustomInput
                        label="Salário (%)"
                        type="number"
                        step="0.1"
                        value={payrollConfig.salaryPercentage}
                        onChange={(e) =>
                          setPayrollConfig((prev) => ({
                            ...prev,
                            salaryPercentage: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                      <CustomInput
                        label="Dia Útil do Salário"
                        type="number"
                        step="1"
                        value={payrollConfig.salaryBusinessDayOrdinal}
                        onChange={(e) =>
                          setPayrollConfig((prev) => ({
                            ...prev,
                            salaryBusinessDayOrdinal:
                              parseInt(e.target.value) || 1,
                          }))
                        }
                      />
                      <CustomInput
                        label="Vale (%)"
                        type="number"
                        step="0.1"
                        value={payrollConfig.advancePercentage}
                        onChange={(e) =>
                          setPayrollConfig((prev) => ({
                            ...prev,
                            advancePercentage: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                      <CustomInput
                        label="Dia do Vale"
                        type="number"
                        step="1"
                        value={payrollConfig.advanceFixedDay}
                        onChange={(e) =>
                          setPayrollConfig((prev) => ({
                            ...prev,
                            advanceFixedDay: parseInt(e.target.value) || 20,
                          }))
                        }
                      />
                      <CustomInput
                        label="Refeição por dia (R$)"
                        type="number"
                        min="0"
                        step="0.01"
                        value={payrollConfig.mealCostPerWorkday}
                        onChange={(e) =>
                          setPayrollConfig((prev) => ({
                            ...prev,
                            mealCostPerWorkday: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                      <CustomInput
                        label="Diária extra cozinha (R$)"
                        type="number"
                        min="0"
                        step="0.01"
                        value={payrollConfig.extraKitchenDailyRate}
                        onChange={(e) =>
                          setPayrollConfig((prev) => ({
                            ...prev,
                            extraKitchenDailyRate:
                              parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                      <CustomInput
                        label="Diária extra motoboy (R$)"
                        type="number"
                        min="0"
                        step="0.01"
                        value={payrollConfig.extraMotoboyDailyRate}
                        onChange={(e) =>
                          setPayrollConfig((prev) => ({
                            ...prev,
                            extraMotoboyDailyRate:
                              parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                      <button
                        type="button"
                        onClick={handleSavePayrollConfig}
                        disabled={isSavingMutation("payroll-config")}
                        className="h-12 rounded-xl bg-[#2A1E15] text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
                      >
                        {isSavingMutation("payroll-config")
                          ? "Salvando..."
                          : "Salvar regras RH"}
                      </button>
                    </div>
                    <p className="mt-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider not-italic">
                      Dia útil está sendo calculado localmente por fim de
                      semana. Para feriado nacional automático, depois eu posso
                      plugar BrasilAPI. Estadual e municipal eu prefiro lista
                      manual.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {payrollSummary.employeesBreakdown.map((emp) => (
                      <div
                        key={emp.id}
                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm italic"
                      >
                        <div className="grid grid-cols-1 xl:grid-cols-[minmax(320px,1.2fr)_minmax(0,2fr)] gap-4 items-start">
                          <div className="min-w-0 pr-0 xl:pr-4">
                            <p className="font-black text-[#2A1E15] uppercase text-base italic break-words leading-tight whitespace-normal">
                              {emp.name}
                            </p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest break-words mt-2 whitespace-normal">
                              {emp.role}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                              {emp.phone || "SEM TELEFONE"}{" "}
                              {emp.email ? `| ${emp.email}` : ""}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 min-w-0">
                            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200">
                              <p className="text-[10px] font-black uppercase text-[#6F6258]">
                                Salário
                              </p>
                              <p className="text-sm font-black text-[#2A1E15]">
                                {formatMoney(emp.grossSalary)}
                              </p>
                            </div>
                            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200">
                              <p className="text-[10px] font-black uppercase text-[#6F6258]">
                                Faltas
                              </p>
                              <p className="text-sm font-black text-[#2A1E15]">
                                {emp.statement?.absenceCount || 0} ·{" "}
                                {formatMoney(emp.absenceAmount)}
                              </p>
                            </div>
                            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200">
                              <p className="text-[10px] font-black uppercase text-[#6F6258]">
                                Total descontos
                              </p>
                              <p className="text-sm font-black text-gray-900">
                                {formatMoney(emp.extraDiscount)}
                              </p>
                            </div>
                            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200">
                              <p className="text-[10px] font-black uppercase text-[#6F6258]">
                                Primeiro pagamento {emp.advancePercentage}%
                              </p>
                              <p className="text-sm font-black text-[#2A1E15]">
                                {formatMoney(emp.advanceAmount)}
                              </p>
                            </div>
                            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200">
                              <p className="text-[10px] font-black uppercase text-[#6F6258]">
                                Líquido final {emp.salaryPercentage}%
                              </p>
                              <p className="text-sm font-black text-[#2A1E15]">
                                {formatMoney(emp.finalSalaryPayment)}
                              </p>
                            </div>
                          </div>
                        </div>
                        {(emp.absences.length > 0 ||
                          emp.adjustments.length > 0) && (
                          <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                            <div className="rounded-xl bg-red-50 p-3 text-red-900">
                              <strong>Faltas da competência</strong>
                              {emp.absences.map((absence) => (
                                <p key={absence.date}>
                                  {formatDateBr(absence.date)} —{" "}
                                  {formatMoney(absence.amount)}
                                </p>
                              ))}
                              {emp.absences.length === 0 && (
                                <p>Nenhuma falta.</p>
                              )}
                            </div>
                            <div className="rounded-xl bg-amber-50 p-3 text-amber-900">
                              <strong>Ajustes / Descontos</strong>
                              {emp.adjustments.map((adjustment) => (
                                <p key={adjustment.id}>
                                  {adjustment.categoryLabel} —{" "}
                                  {formatMoney(adjustment.amount)}
                                </p>
                              ))}
                              {emp.adjustments.length === 0 && (
                                <p>Nenhum ajuste.</p>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="mt-4 flex flex-wrap gap-3 items-center justify-between">
                          <div className="flex flex-wrap gap-3">
                            <span className="px-3 py-2 rounded-full bg-green-50 text-green-700 text-xs font-black uppercase">
                              Salário em{" "}
                              {formatDateBr(payrollSummary.salaryPaymentDate)}
                            </span>
                            <span className="px-3 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase">
                              Vale em{" "}
                              {formatDateBr(payrollSummary.advancePaymentDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openEmployeeDiscountsModal(emp.id)}
                              className="bg-stone-100 text-[#2A1E15] h-10 px-4 rounded-xl font-black uppercase text-[10px]"
                            >
                              Ajustes / Descontos
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditEmployeeModal(emp)}
                              className="bg-stone-200 text-[#2A1E15] h-10 px-4 rounded-xl font-black uppercase text-[10px]"
                            >
                              Ver/Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDeleteEmployee(emp)}
                              disabled={isSavingMutation(
                                `delete-employee-${emp.id}`,
                              )}
                              className="text-gray-300 hover:text-red-500 disabled:opacity-50"
                              aria-label={`Retirar ${emp.name} da folha`}
                              title={`Retirar ${emp.name} da folha`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {rhView === "external" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                      title="Prestadores Ativos"
                      value={
                        externalWorkersSummary.filter(
                          (worker) => worker.status !== "inactive",
                        ).length
                      }
                      icon={Users}
                      colorClass="text-[#2A1E15]"
                      bgColorClass="bg-stone-100"
                      iconColorClass="text-[#2A1E15]"
                    />
                    <StatCard
                      title="Próx. Pagamentos"
                      value={
                        externalWorkersSummary.filter(
                          (worker) => worker.nextPaymentDate,
                        ).length
                      }
                      icon={Calendar}
                      colorClass="text-[#2A1E15]"
                      bgColorClass="bg-stone-100"
                      iconColorClass="text-[#2A1E15]"
                    />
                    <StatCard
                      title="Total Previsto"
                      value={formatMoney(
                        externalWorkersSummary.reduce(
                          (acc, worker) => acc + worker.baseAmountNumber,
                          0,
                        ),
                      )}
                      icon={Wallet}
                      colorClass="text-[#2A1E15]"
                      bgColorClass="bg-stone-100"
                      iconColorClass="text-[#2A1E15]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payrollAlerts
                      .filter((alert) =>
                        String(alert.id).startsWith("external-"),
                      )
                      .map((alert) => (
                        <div
                          key={alert.id}
                          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-[#6F6258] uppercase tracking-widest">
                              {alert.title}
                            </p>
                            <p className="text-sm font-black text-[#2A1E15] uppercase truncate">
                              {formatDateBr(alert.date)}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {alert.description}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-black text-[#2A1E15]">
                              {formatMoney(alert.amount)}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">
                              {alert.daysUntil === 0
                                ? "Hoje"
                                : alert.daysUntil > 0
                                  ? `Em ${alert.daysUntil} dia(s)`
                                  : "Vencido"}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="space-y-3">
                    {externalWorkersSummary
                      .filter((worker) => worker.status !== "inactive")
                      .map((worker) => (
                        <div
                          key={worker.id}
                          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="min-w-0 max-w-full">
                              <p className="font-black text-[#2A1E15] uppercase text-base break-words leading-tight whitespace-normal">
                                {worker.name}
                              </p>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest break-words mt-2 whitespace-normal">
                                {worker.role}
                              </p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                                {worker.phone || "SEM TELEFONE"}{" "}
                                {worker.email ? `| ${worker.email}` : ""}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 min-w-0 xl:min-w-[620px]">
                              <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200">
                                <p className="text-[10px] font-black uppercase text-[#6F6258]">
                                  Tipos de Diária
                                </p>
                                {worker.dailyRateSummary.length ? (
                                  <div className="mt-1 space-y-1">
                                    {worker.dailyRateSummary.map((summary) => (
                                      <p
                                        key={summary}
                                        className="text-xs font-black text-[#2A1E15]"
                                      >
                                        {summary}
                                      </p>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs font-black text-red-700">
                                    Não configurado
                                  </p>
                                )}
                              </div>
                              <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200">
                                <p className="text-[10px] font-black uppercase text-[#6F6258]">
                                  Frequência
                                </p>
                                <p className="text-sm font-black text-[#2A1E15] uppercase">
                                  {worker.paymentMode === "weekly"
                                    ? "Semanal"
                                    : "Avulso"}
                                </p>
                              </div>
                              <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200">
                                <p className="text-[10px] font-black uppercase text-[#6F6258]">
                                  Próx. Data
                                </p>
                                <p className="text-sm font-black text-[#2A1E15]">
                                  {worker.nextPaymentDate
                                    ? formatDateBr(worker.nextPaymentDate)
                                    : "--"}
                                </p>
                              </div>
                              <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200">
                                <p className="text-[10px] font-black uppercase text-[#6F6258]">
                                  Status
                                </p>
                                <p className="text-sm font-black text-[#2A1E15] uppercase">
                                  {worker.status === "active"
                                    ? "Ativo"
                                    : "Inativo"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-3 items-center justify-between">
                            <div className="flex flex-wrap gap-3">
                              <span className="px-3 py-2 rounded-full bg-stone-100 text-[#2A1E15] text-xs font-black uppercase">
                                {worker.paymentMode === "weekly"
                                  ? [
                                      "Domingo",
                                      "Segunda",
                                      "Terça",
                                      "Quarta",
                                      "Quinta",
                                      "Sexta",
                                      "Sábado",
                                    ][Number(worker.weekday)] || "Semanal"
                                  : "Pagamento Avulso"}
                              </span>
                              {worker.notes && (
                                <span className="px-3 py-2 rounded-full bg-stone-100 text-[#2A1E15] text-xs font-black uppercase">
                                  {worker.notes}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-3 items-center">
                              <button
                                type="button"
                                onClick={() => openEditEmployeeModal(worker)}
                                className="text-[#2A1E15] hover:text-[#D4A373]"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDeleteEmployee(worker)}
                                disabled={isSavingMutation(
                                  `delete-employee-${worker.id}`,
                                )}
                                className="text-gray-300 hover:text-red-500 disabled:opacity-50"
                                aria-label={`Retirar ${worker.name} da folha`}
                                title={`Retirar ${worker.name} da folha`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}

              {rhView === "workforce" && (
                <WorkforceControlPanel
                  employees={employees}
                  payrollConfig={payrollConfig}
                  workLogs={employeeWorkLogs}
                  weeklyClosings={extraWeeklyClosings}
                  onSaveLog={handleSaveWorkLog}
                  onOpenAccountsPayable={() => activateTab("contas-pagar")}
                  isSaving={Object.keys(savingMutations).some(
                    (key) =>
                      key.startsWith("work-log-") ||
                      key.startsWith("weekly-closing-"),
                  )}
                />
              )}

              {rhView === "history" && (
                <div className="space-y-5">
                  <div className="rounded-[2rem] border border-[#D4A373]/30 bg-[#FFF8EC] p-6 sm:p-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8A5A2B]">
                      Arquivo de pessoal
                    </p>
                    <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-[#2A1E15]">
                      Funcionários fora da folha ativa
                    </h3>
                    <p className="mt-2 text-sm font-bold text-[#6F6258]">
                      Consulte aqui os dados e valores históricos. Reativar
                      devolve o funcionário à folha sem perder o histórico.
                    </p>
                  </div>
                  {employees
                    .filter((employee) => employee.status === "inactive")
                    .map((employee) => {
                      const logs = employeeWorkLogs.filter(
                        (log) =>
                          String(log.employeeId) === String(employee.id) &&
                          log.worked,
                      );
                      const closings = extraWeeklyClosings.filter(
                        (closing) =>
                          String(closing.employeeId) === String(employee.id),
                      );
                      const paidTotal = closings.reduce(
                        (sum, closing) =>
                          sum + (Number(closing.paidAmount) || 0),
                        0,
                      );
                      const workCost = logs.reduce(
                        (sum, log) =>
                          sum +
                          (Number(log.dailyRate) || 0) +
                          (Number(log.deliveryFee) || 0),
                        0,
                      );
                      return (
                        <div
                          key={employee.id}
                          className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="text-base font-black uppercase text-[#2A1E15]">
                                {employee.name}
                              </p>
                              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[#6F6258]">
                                {employee.employmentType === "fixed"
                                  ? "Fixo"
                                  : "Por fora"}{" "}
                                · {employee.role}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                              <div className="rounded-xl bg-stone-100 p-3">
                                <p className="text-[9px] font-black uppercase text-[#6F6258]">
                                  Salário/Base
                                </p>
                                <p className="font-black text-[#2A1E15]">
                                  {formatMoney(
                                    employee.employmentType === "fixed"
                                      ? employee.salary
                                      : employee.baseAmount,
                                  )}
                                </p>
                              </div>
                              <div className="rounded-xl bg-stone-100 p-3">
                                <p className="text-[9px] font-black uppercase text-[#6F6258]">
                                  Jornadas
                                </p>
                                <p className="font-black text-[#2A1E15]">
                                  {logs.length}
                                </p>
                              </div>
                              <div className="rounded-xl bg-stone-100 p-3">
                                <p className="text-[9px] font-black uppercase text-[#6F6258]">
                                  Gerado
                                </p>
                                <p className="font-black text-[#2A1E15]">
                                  {formatMoney(workCost)}
                                </p>
                              </div>
                              <div className="rounded-xl bg-green-50 p-3">
                                <p className="text-[9px] font-black uppercase text-green-800">
                                  Pago
                                </p>
                                <p className="font-black text-green-800">
                                  {formatMoney(paidTotal)}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRestoreEmployee(employee)}
                              disabled={isSavingMutation(
                                `restore-employee-${employee.id}`,
                              )}
                              className="rounded-xl bg-[#2A1E15] px-4 py-3 text-[10px] font-black uppercase text-white disabled:opacity-50"
                            >
                              {isSavingMutation(
                                `restore-employee-${employee.id}`,
                              )
                                ? "Reativando..."
                                : "Reativar na folha"}
                            </button>
                          </div>
                          <div className="mt-4 flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs font-bold text-[#6F6258]">
                              {
                                closings.filter(
                                  (closing) => Number(closing.paidAmount) > 0,
                                ).length
                              }{" "}
                              pagamento(s) realizado(s) registrado(s)
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setPaymentHistoryEmployee(employee)
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D4A373]/50 bg-[#FFF8EC] px-4 py-3 text-[10px] font-black uppercase text-[#2A1E15] transition-colors hover:bg-[#F7E7CE]"
                            >
                              <Eye size={15} /> Ver histórico de pagamentos
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  {employees.every(
                    (employee) => employee.status !== "inactive",
                  ) && (
                    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-xs font-bold uppercase tracking-widest text-[#6F6258]">
                      Nenhum funcionário arquivado.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "closing" && (
            <MonthlyClosingPage
              month={closingMonth}
              onMonthChange={setClosingMonth}
              transactions={transactions}
              recurringCosts={recurringCosts}
              payrollEntries={closingPayrollEntries}
              obligations={financialObligations}
              reconciliations={dailyCashReconciliations}
              balancePeriods={financialBalances.periods || []}
              inventorySummaries={
                supplyChainData.monthlyInventorySummaries || []
              }
            />
          )}

          {activeTab === "closing-legacy" && (
            <div className="max-w-6xl 2xl:max-w-7xl mx-auto italic font-black space-y-6">
              <div className="bg-white p-6 sm:p-10 rounded-[2rem] border border-gray-100 shadow-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 rotate-12 opacity-5">
                  <Logo className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl sm:text-3xl xl:text-4xl font-black text-[#2A1E15] uppercase tracking-tighter font-sans">
                    Extrato Financeiro
                  </h3>
                  <p className="text-xs font-bold text-[#6F6258] uppercase tracking-widest mt-2">
                    {closingRange.label}
                  </p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-[#8A5A2B]">
                    {closingSummary.accountingBasis === "COMPETENCE"
                      ? "Base por competência — reconciliada com Dashboard e DRE"
                      : "Base caixa — considera datas efetivas dos lançamentos"}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 relative z-10">
                  <div className="space-y-1 xl:col-span-2">
                    <label className="text-[9px] font-black text-[#6F6258] uppercase ml-1 tracking-widest not-italic">
                      Visualização
                    </label>
                    <SearchableSelect
                      value={closingFilterType}
                      onChange={setClosingFilterType}
                      options={[
                        { value: "dia", label: "Fechamento do Dia" },
                        { value: "mes", label: "Fechamento do Mês" },
                        { value: "quinzena", label: "Fechamento Quinzenal" },
                        {
                          value: "intervalo",
                          label: "Intervalo Personalizado",
                        },
                      ]}
                      placeholder="Selecione"
                    />
                  </div>

                  {closingFilterType !== "intervalo" && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#6F6258] uppercase ml-1 tracking-widest not-italic">
                        Data de Referência
                      </label>
                      <input
                        type="date"
                        value={closingReferenceDate}
                        onChange={(e) =>
                          setClosingReferenceDate(e.target.value)
                        }
                        className="w-full px-3 py-2.5 bg-[#FFFFFF] border border-gray-200 rounded-xl font-bold text-sm outline-none not-italic focus:ring-2 focus:ring-[#D4A373]"
                      />
                    </div>
                  )}

                  {closingFilterType === "intervalo" && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-[#6F6258] uppercase ml-1 tracking-widest not-italic">
                          Data Inicial
                        </label>
                        <input
                          type="date"
                          value={closingRangeStart}
                          onChange={(e) => setClosingRangeStart(e.target.value)}
                          className="w-full px-3 py-2.5 bg-[#FFFFFF] border border-gray-200 rounded-xl font-bold text-sm outline-none not-italic focus:ring-2 focus:ring-[#D4A373]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-[#6F6258] uppercase ml-1 tracking-widest not-italic">
                          Data Final
                        </label>
                        <input
                          type="date"
                          value={closingRangeEnd}
                          onChange={(e) => setClosingRangeEnd(e.target.value)}
                          className="w-full px-3 py-2.5 bg-[#FFFFFF] border border-gray-200 rounded-xl font-bold text-sm outline-none not-italic focus:ring-2 focus:ring-[#D4A373]"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                  title="Entradas Líquidas"
                  value={formatMoney(closingSummary.receitaLiquida)}
                  icon={TrendingUp}
                  colorClass="text-green-700"
                  bgColorClass="bg-green-50"
                  iconColorClass="text-green-700"
                />
                <StatCard
                  title="Saídas Lançadas"
                  value={formatMoney(closingSummary.saidasLancadas)}
                  icon={Receipt}
                  colorClass="text-red-600"
                  bgColorClass="bg-red-50"
                  iconColorClass="text-red-600"
                />
                <StatCard
                  title="Custos + RH"
                  value={formatMoney(
                    closingSummary.custosFixos + closingSummary.folhaSalarial,
                  )}
                  icon={Users}
                  colorClass="text-[#2A1E15]"
                  bgColorClass="bg-[#2A1E15]/10"
                  iconColorClass="text-[#2A1E15]"
                />
                <StatCard
                  title="Saldo do Período"
                  value={formatMoney(closingSummary.saldoPeriodo)}
                  icon={Wallet}
                  colorClass="text-blue-700"
                  bgColorClass="bg-blue-50"
                  iconColorClass="text-blue-700"
                />
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                    <p className="text-[10px] font-black uppercase text-[#6F6258]">
                      Entradas Brutas
                    </p>
                    <p className="text-lg font-black text-green-700">
                      {formatMoney(closingSummary.receitaBruta)}
                    </p>
                  </div>
                  <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                    <p className="text-[10px] font-black uppercase text-[#6F6258]">
                      Taxas de Canal
                    </p>
                    <p className="text-lg font-black text-amber-700">
                      {formatMoney(closingSummary.taxasCanais)}
                    </p>
                  </div>
                  <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                    <p className="text-[10px] font-black uppercase text-[#6F6258]">
                      Itens no Extrato
                    </p>
                    <p className="text-lg font-black text-[#2A1E15]">
                      {closingSummary.ledgerEntries.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mb-4">
                  <h4 className="text-sm font-black text-[#2A1E15] uppercase tracking-widest">
                    Movimentações do Período
                  </h4>
                  <span className="text-[10px] font-black text-[#6F6258] uppercase">
                    {closingSummary.receitasCount} entrada(s) •{" "}
                    {closingSummary.despesasCount} saída(s)
                  </span>
                </div>

                <div className="space-y-3">
                  {closingSummary.ledgerEntries.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-stone-50 px-4 py-8 text-center">
                      <p className="text-xs font-black text-[#6F6258] uppercase tracking-widest">
                        Nenhuma movimentação encontrada para o período
                        selecionado.
                      </p>
                    </div>
                  )}

                  {closingSummary.ledgerEntries.map((entry) => {
                    const isIncome = entry.kind === "receita";
                    const isFixedCost = entry.kind === "custo_fixo";
                    const isPayroll = entry.kind === "folha";
                    return (
                      <div
                        key={entry.id}
                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-1 h-10 rounded-full ${isIncome ? "bg-green-600" : isFixedCost ? "bg-[#D4A373]" : isPayroll ? "bg-[#2A1E15]" : "bg-red-500"}`}
                          />
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-[#2A1E15] uppercase truncate font-sans">
                              {entry.title} • {entry.category}
                            </p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                              {formatDateBr(entry.date)}
                              {entry.payment ? ` | ${entry.payment}` : ""}
                              {entry.platform ? ` | ${entry.platform}` : ""}
                            </p>
                            {entry.note && (
                              <p className="text-[10px] font-bold text-gray-500 uppercase truncate mt-1">
                                {entry.note}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className={`text-sm font-black ${isIncome ? "text-green-700" : "text-red-600"}`}
                          >
                            {isIncome ? "+" : "-"} {formatMoney(entry.amount)}
                          </p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">
                            {isFixedCost
                              ? "Custo fixo"
                              : isPayroll
                                ? "Despesa RH"
                                : isIncome
                                  ? "Entrada"
                                  : "Saída"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "dre" && (
            <DreMonthlyPage
              month={dreMonth}
              onMonthChange={setDreMonth}
              transactions={transactions}
              recurringCosts={recurringCosts}
              payrollEntries={hrCostEntries}
              obligations={financialObligations}
              inventoryCmvSummaries={
                supplyChainData.monthlyInventorySummaries || []
              }
            />
          )}

          {activeTab === "fornecedores" && (
            <SuppliersPage
              ingredients={ingredients}
              data={supplyChainData}
              onSave={handleSaveSupplier}
              onDelete={handleDeleteSupplier}
              busy={
                isSavingMutation("supplier-save") ||
                Object.keys(savingMutations).some((key) =>
                  key.startsWith("supplier-delete-"),
                )
              }
            />
          )}

          {activeTab === "compras" && (
            <PurchasesPage
              ingredients={ingredients}
              data={supplyChainData}
              storeName={settings.businessName}
              onSave={handleSavePurchaseOrder}
              onStatus={handlePurchaseOrderStatus}
              onReceive={handleReceivePurchaseOrder}
              onReverse={handleReversePurchaseReceipt}
              onOpenSuppliers={() => activateTab("fornecedores")}
              busy={Object.keys(savingMutations).some((key) =>
                key.startsWith("purchase-"),
              )}
            />
          )}

          {activeTab === "estoque" && (
            <InventoryPage
              ingredients={ingredients}
              data={supplyChainData}
              onSave={handleSaveInventory}
              onStatus={handleInventoryStatus}
              busy={Object.keys(savingMutations).some((key) =>
                key.startsWith("inventory-"),
              )}
            />
          )}

          {activeTab === "saldos" && (
            <FinancialBalancesPage
              balances={financialBalances}
              inventorySummaries={
                supplyChainData.monthlyInventorySummaries || []
              }
              onSavePeriod={handleSaveBalancePeriod}
              onSaveMovement={handleSaveAccountMovement}
              onReverseMovement={handleReverseAccountMovement}
              onStatus={handleBalanceStatus}
              onIntegratedClose={handleIntegratedClose}
              busy={Object.keys(savingMutations).some(
                (key) =>
                  key.startsWith("balance-") || key.startsWith("integrated-"),
              )}
            />
          )}

          {activeTab === "contas-pagar" && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2 rounded-2xl border border-stone-100 bg-white p-2 shadow-sm">
                <button
                  type="button"
                  onClick={() => setAccountsPayableView("OBLIGATIONS")}
                  className={`rounded-xl px-4 py-3 text-[10px] font-black uppercase ${accountsPayableView === "OBLIGATIONS" ? "bg-[#2A1E15] text-white" : "text-[#6F6258]"}`}
                >
                  Obrigações da competência
                </button>
                <button
                  type="button"
                  onClick={() => setAccountsPayableView("RECURRENCES")}
                  className={`rounded-xl px-4 py-3 text-[10px] font-black uppercase ${accountsPayableView === "RECURRENCES" ? "bg-[#2A1E15] text-white" : "text-[#6F6258]"}`}
                >
                  Regras recorrentes
                </button>
              </div>
              {accountsPayableView === "OBLIGATIONS" ? (
                <AccountsPayablePage
                  month={financeMonth}
                  onMonthChange={(month) => {
                    setFinanceMonth(month);
                    setFixedPayrollMonth(month);
                  }}
                  obligations={enrichObligationsWithFixedPayroll(
                    financialObligations,
                    fixedPayrollData.statements || [],
                    financeMonth,
                  )}
                  fixedPayrollStatements={fixedPayrollData.statements || []}
                  isPayrollDetailLoading={fixedPayrollLoading}
                  duplicateCandidates={recurringCostDuplicateCandidates}
                  onPay={handlePayFinancialObligation}
                  onUpdate={handleUpdateFinancialObligation}
                  onResolveDuplicate={handleResolveRecurringCostDuplicate}
                  isSaving={Object.keys(savingMutations).some((key) =>
                    key.startsWith("obligation-"),
                  )}
                />
              ) : (
                <RecurringCostsPage
                  costs={sortedRecurringCosts}
                  categories={costCategories}
                  onCreate={handleCreateRecurringCost}
                  onUpdate={handleUpdateCost}
                  onArchive={handleDeleteRecurringCost}
                  onOpenCostCategories={() => setIsCatModalOpen(true)}
                  onOpenFinanceCategories={() =>
                    setIsFinanceCategoryModalOpen(true)
                  }
                  isSaving={
                    isFinanceSubmitting ||
                    Object.keys(savingMutations).some((key) =>
                      key.includes("recurring-cost"),
                    )
                  }
                />
              )}
            </div>
          )}

          {activeTab === "fluxo-caixa" && (
            <CashFlowPage
              month={cmvCashMonth}
              onMonthChange={setCmvCashMonth}
              reconciliations={dailyCashReconciliations}
              onSaveReconciliation={handleSaveCashReconciliation}
            />
          )}

          {activeTab === "settings" && (
            <div className="max-w-5xl 2xl:max-w-6xl mx-auto font-black italic">
              <div className="bg-white p-6 sm:p-10 rounded-[2rem] border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-[#2A1E15] uppercase mb-8 flex items-center gap-3 font-sans">
                  <Settings size={22} /> Configurações
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setIsFinanceCategoryModalOpen(true)}
                    className="bg-[#D4A373]/10 text-[#2A1E15] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#D4A373]/20"
                  >
                    Cadastrar Categorias Financeiras
                  </button>
                </div>
                <form onSubmit={handleUpdateSettings} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans italic tracking-tighter">
                    <CustomInput
                      label="Nome da Esfiharia"
                      name="businessName"
                      defaultValue={settings.businessName}
                    />
                    <CustomInput
                      label="Aviso Vencimento (Dias)"
                      name="alertDaysBefore"
                      type="number"
                      defaultValue={settings.alertDaysBefore}
                    />
                    <CustomInput
                      label="Taxa iFood (%)"
                      name="ifoodTax"
                      type="number"
                      step="0.1"
                      defaultValue={settings.ifoodTax}
                    />
                    <CustomInput
                      label="Taxa Anota AI (%)"
                      name="anotaaiTax"
                      type="number"
                      step="0.1"
                      defaultValue={settings.anotaaiTax}
                    />
                    <div className="space-y-1">
                      <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                        Nova Senha
                      </label>
                      <input
                        name="appPassword"
                        type="password"
                        onKeyUp={handlePasswordKeyboardState}
                        onKeyDown={handlePasswordKeyboardState}
                        className="w-full px-4 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4A373] outline-none transition-all text-sm xl:text-base font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                        Confirmar Senha
                      </label>
                      <input
                        name="confirmPassword"
                        type="password"
                        onKeyUp={handlePasswordKeyboardState}
                        onKeyDown={handlePasswordKeyboardState}
                        className="w-full px-4 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4A373] outline-none transition-all text-sm xl:text-base font-medium"
                      />
                    </div>
                    <CustomInput
                      label="Lembrete de Senha"
                      name="passwordReminder"
                      type="text"
                      defaultValue={settings.passwordReminder}
                    />
                  </div>
                  {settingsCapsLockOn && (
                    <p className="text-[10px] text-amber-700 font-bold bg-amber-50 p-3 rounded-xl border border-amber-100 uppercase tracking-wider">
                      Caps Lock está ativado.
                    </p>
                  )}
                  {settingsError && (
                    <p className="text-[10px] text-red-600 font-bold bg-red-50 p-3 rounded-xl border border-red-100 uppercase tracking-wider">
                      {settingsError}
                    </p>
                  )}
                  {settingsSuccess && (
                    <p className="text-[10px] text-green-700 font-bold bg-green-50 p-3 rounded-xl border border-green-100 uppercase tracking-wider">
                      {settingsSuccess}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="w-full bg-[#2A1E15] text-[#FFFFFF] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#D4A373] shadow-xl"
                  >
                    Salvar
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "ai-behavior" && (
            <AiBehaviorSettingsPage
              value={aiBehaviorSettings}
              onSave={handleSaveAiBehaviorSettings}
              errorMessage={aiBehaviorError}
              successMessage={aiBehaviorSuccess}
            />
          )}
        </div>
      </main>
    </div>
  );
}
