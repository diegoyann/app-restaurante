import React, { useState, useEffect, useMemo, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
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
    Bot
} from 'lucide-react';
import {
    ComboEditorModal,
    MenuCategoryManager,
    MenuCategoryModal,
    MenuItemFormPanel,
    MenuItemModal
} from './features/menu/MenuComponents.jsx';
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
    resolveLinkedComponentMeta,
    summarizeComboGroups
} from './features/menu/menuModel.js';
import { ReviewManagementPage } from './features/reviews/ReviewManagement.jsx';
import OrderOperationsPage from './features/orders/OrderOperationsPage.jsx';
import AiBehaviorSettingsPage from './features/settings/AiBehaviorSettings.jsx';
import { createDefaultAiBehaviorSettings, normalizeAiBehaviorSettings } from './features/settings/settingsModel.js';
import { createDefaultIngredientUnits } from './mocks/appStateDefaults.js';
import {
    calculateComponentLineCost,
    calculateIngredientUnitCost,
    calculateRecipeCost,
    getCompatibleUnits,
    getDefaultCompatibleUnit,
    getIngredientCostReferenceFactor,
    getIngredientCostReferenceUnit,
    getIngredientCostReferenceValue,
    resolveSelectableUnitLabel
} from './features/catalog/cmvModel.js';
import {
    appApi,
    catalogApi,
    customersApi,
    financeApi,
    hrApi,
    menuApi,
    ordersApi,
    paymentMethodsApi,
    settingsApi
} from './services/api.js';
import { supabase } from './lib/supabase.js';
import { isMockDataSource } from './config/dataSource.js';
import { signOutMock } from './services/mockAuth.js';

// --- CONFIGURAÇÃO ---
const LOGO_URL = "/hero-logo.png";
const USE_BACKEND_BOOTSTRAP = true;
const USE_REVENUE_CHART_MOCK = false;
const MENU_DESCRIPTION_PREVIEW_LIMIT = 70;
const MONTHLY_REVENUE_CHART_MOCK = [
    { day: '01', bruto: 4200, liquido: 3610, pedidos: 32 },
    { day: '02', bruto: 5100, liquido: 4380, pedidos: 39 },
    { day: '03', bruto: 3900, liquido: 3340, pedidos: 28 },
    { day: '04', bruto: 6800, liquido: 5860, pedidos: 47 },
    { day: '05', bruto: 7200, liquido: 6230, pedidos: 51 },
    { day: '06', bruto: 6100, liquido: 5270, pedidos: 43 },
    { day: '07', bruto: 4700, liquido: 4060, pedidos: 34 },
    { day: '08', bruto: 5300, liquido: 4580, pedidos: 38 },
    { day: '09', bruto: 4900, liquido: 4230, pedidos: 35 },
    { day: '10', bruto: 7600, liquido: 6570, pedidos: 55 },
    { day: '11', bruto: 8400, liquido: 7260, pedidos: 61 },
    { day: '12', bruto: 7900, liquido: 6820, pedidos: 58 },
    { day: '13', bruto: 5600, liquido: 4840, pedidos: 41 },
    { day: '14', bruto: 6000, liquido: 5180, pedidos: 44 },
    { day: '15', bruto: 8700, liquido: 7520, pedidos: 63 }
];

// --- COMPONENTES UI ---
const Logo = ({ className = "w-10 h-10" }) => {
    const [error, setError] = useState(false);
    if (error) return <div className={`${className} bg-[#2A1E15] rounded-xl flex items-center justify-center shadow-lg`}><Crown className="text-[#F6B52E]" size={20} /></div>;
    return <img src={LOGO_URL} alt="Logo" className={`${className} object-contain rounded-xl drop-shadow-md`} onError={() => setError(true)} />;
};

const StatCard = ({ title, value, icon, colorClass, bgColorClass, iconColorClass }) => (
    <div className="bg-white p-4 xl:p-5 2xl:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all h-full min-h-[110px] xl:min-h-[132px]">
        <div className="min-w-0 flex-1">
            <p className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase tracking-tighter truncate mb-1">{title}</p>
            <p className={`text-xl sm:text-2xl xl:text-3xl 2xl:text-4xl font-black ${colorClass} truncate leading-none`}>{value}</p>
        </div>
        <div className={`metric-icon-box p-2.5 xl:p-3 2xl:p-4 rounded-xl shrink-0 ml-2 ${bgColorClass}`}>
            {React.createElement(icon, { size: 20, className: `metric-icon ${iconColorClass}` })}
        </div>
    </div>
);

const CustomInput = ({ label, icon: Icon, ...props }) => (
    <div className="space-y-1 w-full">
        <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F6258]" size={16} />}
            <input {...props} className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4A373] outline-none transition-all text-sm xl:text-base font-medium`} />
        </div>
    </div>
);


const LegacyMenuCategoryManager = ({
    categories,
    categoryForm,
    editingCategoryId,
    onCategoryFormChange,
    onSubmitCategory,
    onEditCategory,
    onDeleteCategory,
    onCancelEdit,
    isModalContent = false
}) => (
    <div className={isModalContent ? 'space-y-5' : 'bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-5'}>
        {!isModalContent && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[11px] font-black text-[#D4A373] uppercase tracking-[0.25em]">Categorias</p>
                    <h3 className="text-lg font-black text-[#2A1E15] uppercase tracking-tighter">Organização do cardápio</h3>
                </div>
                {editingCategoryId && (
                    <button type="button" onClick={onCancelEdit} className="text-[10px] font-black text-[#6F6258] border border-gray-200 px-4 py-2 rounded-full uppercase hover:border-[#2A1E15] hover:text-[#2A1E15] transition-all w-full sm:w-auto">
                        Cancelar edição
                    </button>
                )}
            </div>
        )}

        <form onSubmit={onSubmitCategory} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_220px] gap-3">
            <CustomInput label="Nome da categoria" value={categoryForm.name} onChange={(e) => onCategoryFormChange('name', e.target.value)} required />
            <button type="submit" className="bg-[#2A1E15] text-[#FFFFFF] h-11 mt-auto rounded-xl font-black uppercase text-[10px] shadow-md">
                {editingCategoryId ? 'Salvar categoria' : 'Cadastrar categoria'}
            </button>
        </form>

        <div className="menu-category-manager-list">
            {categories.map((category) => (
                <div key={category.id} className="menu-category-manager-item">
                    <p className="text-sm font-black text-[#2A1E15] uppercase tracking-tight">{category.name}</p>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => onEditCategory(category)} className="menu-action-button menu-action-button--edit">
                            <Edit size={14} /> Editar
                        </button>
                        <button type="button" onClick={() => onDeleteCategory(category.id)} className="menu-action-button menu-action-button--delete">
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
    isModalContent = false
}) => (
    <div className={isModalContent ? 'space-y-6' : 'bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6'}>
        {!isModalContent && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[11px] font-black text-[#D4A373] uppercase tracking-[0.25em]">Itens</p>
                    <h3 className="text-lg font-black text-[#2A1E15] uppercase tracking-tighter">Cadastro de item</h3>
                </div>
                {editingMenuItemId && (
                    <button type="button" onClick={onResetMenuItemForm} className="text-[10px] font-black text-[#6F6258] border border-gray-200 px-4 py-2 rounded-full uppercase hover:border-[#2A1E15] hover:text-[#2A1E15] transition-all w-full sm:w-auto">
                        Cancelar edição
                    </button>
                )}
            </div>
        )}

        <form onSubmit={onSubmitMenuItem} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CustomInput label="Nome do item" value={menuItemForm.name} onChange={(e) => onMenuItemFormChange('name', e.target.value)} required />
                <CustomInput label="Preço" type="number" step="0.01" value={menuItemForm.salePrice} onChange={(e) => onMenuItemFormChange('salePrice', e.target.value)} required />
                <div className="space-y-1">
                    <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Categoria</label>
                    <select value={menuItemForm.category} onChange={(e) => onMenuItemFormChange('category', e.target.value)} className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]" required>
                        <option value="">Selecione</option>
                        {categoryOptions.map((category) => (
                            <option key={category} value={category}>{formatComboboxLabel(category)}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Visibilidade</label>
                    <select value={menuItemForm.status} onChange={(e) => onMenuItemFormChange('status', e.target.value)} className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]">
                        {menuStatusOptions.map((status) => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Descrição</label>
                <textarea value={menuItemForm.description} onChange={(e) => onMenuItemFormChange('description', e.target.value)} rows={4} className="w-full px-4 py-3 bg-[#FFFFFF] border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#D4A373] outline-none transition-all text-sm xl:text-base font-medium resize-none" placeholder="Descreva sabor, recheio, acompanhamentos ou diferenciais do item." required />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4">
                <div className="space-y-3">
                    <div className="menu-photo-dropzone">
                        {menuItemForm.photoPreview ? (
                            <img src={menuItemForm.photoPreview} alt={menuItemForm.name || 'Preview do item'} className="menu-photo-preview" />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center gap-2 px-6">
                                <ImagePlus size={28} className="text-[#D4A373]" />
                                <p className="text-xs font-black text-[#2A1E15] uppercase tracking-widest">Foto do item</p>
                                <p className="text-[11px] text-[#6F6258] font-semibold">Imagem ilustrativa para o cardápio digital.</p>
                            </div>
                        )}
                    </div>
                    <label className="bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md flex items-center justify-center gap-2 cursor-pointer">
                        <Camera size={15} /> Selecionar foto
                        <input type="file" accept="image/*" className="hidden" onChange={onMenuItemPhotoChange} />
                    </label>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-black text-[#2A1E15] uppercase">Receitas vinculadas</p>
                            <p className="text-[11px] text-[#6F6258] font-semibold">Aqui entram só os produtos finais do catálogo. Insumo e base interna não pertencem a essa etapa.</p>
                        </div>
                        <div className="menu-link-counter">{menuItemForm.linkedComponentIds.length} selecionado(s)</div>
                    </div>

                    <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F6258]" />
                        <input type="text" value={menuComponentSearch} onChange={(e) => onMenuComponentSearchChange(e.target.value)} placeholder="Buscar produto final para vincular..." className="w-full pl-10 pr-4 py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#D4A373]" />
                    </div>

                    <div className="menu-component-list custom-scrollbar">
                        {filteredMenuComponentOptions.map((component) => {
                            const selected = menuItemForm.linkedComponentIds.includes(component.key);

                            return (
                                <button key={component.key} type="button" onClick={() => onToggleMenuComponent(component.key)} className={`menu-component-option ${selected ? 'menu-component-option--selected' : ''}`}>
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'bg-[#2A1E15] border-[#2A1E15] text-white' : 'border-gray-300 text-transparent'}`}>
                                            <Check size={12} />
                                        </div>
                                        <div className="min-w-0 text-left">
                                            <p className="text-xs font-black text-[#2A1E15] uppercase truncate">{component.name}</p>
                                            <p className="text-[11px] text-[#6F6258] font-semibold leading-relaxed">{component.subtitle}</p>
                                        </div>
                                    </div>
                                    <span className="menu-component-tag">{component.tag}</span>
                                </button>
                            );
                        })}

                        {filteredMenuComponentOptions.length === 0 && (
                            <div className="menu-empty-state">
                                <Sparkles size={16} className="text-[#D4A373]" />
                                <span>Nenhum relacionamento encontrado para o filtro informado.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button type="submit" className="w-full bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md">
                {editingMenuItemId ? 'Salvar item' : 'Cadastrar item'}
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
    onCancelEdit
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-3xl rounded-[2.5rem] p-5 sm:p-7 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                        <p className="text-[11px] font-black text-[#D4A373] uppercase tracking-[0.25em]">Categorias</p>
                        <h3 className="text-2xl font-black text-[#2A1E15] uppercase tracking-tighter">Organização do cardápio</h3>
                        <p className="text-xs font-semibold text-[#7a6262] mt-2">Cadastre, renomeie ou limpe categorias sem deixar esse formulário aberto ocupando a tela inteira.</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"><X size={20} /></button>
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
    onToggleMenuComponent
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-5xl rounded-[2.5rem] p-5 sm:p-7 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                        <p className="text-[11px] font-black text-[#D4A373] uppercase tracking-[0.25em]">Itens</p>
                        <h3 className="text-2xl font-black text-[#2A1E15] uppercase tracking-tighter">Cadastro de item</h3>
                        <p className="text-xs font-semibold text-[#7a6262] mt-2">Abra, preencha, salva e sai. Muito melhor do que deixar o formulário plantado na página o tempo todo.</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"><X size={20} /></button>
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
    onComboOptionChange
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-6xl rounded-[2.5rem] p-5 sm:p-7 shadow-2xl border border-gray-100 max-h-[94vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <p className="text-[11px] font-black text-[#D4A373] uppercase tracking-[0.25em]">Combos</p>
                        <h3 className="text-2xl font-black text-[#2A1E15] uppercase tracking-tighter">{editingComboId ? 'Editar combo' : 'Novo combo'}</h3>
                        <p className="text-xs font-semibold text-[#7a6262] mt-2">Editor por grupos, com preço base, adicionais por opção e controle direto de disponibilidade.</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"><X size={20} /></button>
                </div>

                <form onSubmit={onSubmitCombo} className="space-y-6">
                    <div className="combo-editor-shell">
                        <div className="combo-editor-shell__media">
                            <div className="menu-photo-dropzone">
                                {comboForm.photoPreview ? (
                                    <img src={comboForm.photoPreview} alt={comboForm.name || 'Preview do combo'} className="menu-photo-preview" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center gap-2 px-6">
                                        <ImagePlus size={28} className="text-[#D4A373]" />
                                        <p className="text-xs font-black text-[#2A1E15] uppercase tracking-widest">Foto do combo</p>
                                        <p className="text-[11px] text-[#6F6258] font-semibold">Use uma capa forte. Combo sem cara de produto vende pior.</p>
                                    </div>
                                )}
                            </div>
                            <label className="bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md flex items-center justify-center gap-2 cursor-pointer">
                                <Camera size={15} /> Selecionar foto
                                <input type="file" accept="image/*" className="hidden" onChange={onComboPhotoChange} />
                            </label>
                            <div className="combo-editor-shell__summary">
                                <span className="combo-editor-shell__summary-label">Resumo</span>
                                <strong>{summarizeComboGroups(comboForm.comboGroups)}</strong>
                                <span>{comboForm.comboGroups.reduce((acc, group) => acc + group.options.length, 0)} opção(ões) configurada(s)</span>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CustomInput label="Nome do combo" value={comboForm.name} onChange={(e) => onComboFormChange('name', e.target.value)} required />
                                <CustomInput label="Preço base" type="number" step="0.01" value={comboForm.basePrice} onChange={(e) => onComboFormChange('basePrice', e.target.value)} required />
                                <div className="space-y-1">
                                    <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Categoria</label>
                                    <select value={comboForm.category} onChange={(e) => onComboFormChange('category', e.target.value)} className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]" required>
                                        {categoryOptions.map((category) => (
                                            <option key={category} value={category}>{formatComboboxLabel(category)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Visibilidade</label>
                                    <select value={comboForm.status} onChange={(e) => onComboFormChange('status', e.target.value)} className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]">
                                        {menuStatusOptions.map((status) => (
                                            <option key={status.value} value={status.value}>{status.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Descrição</label>
                                <textarea value={comboForm.description} onChange={(e) => onComboFormChange('description', e.target.value)} rows={4} className="w-full px-4 py-3 bg-[#FFFFFF] border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#D4A373] outline-none transition-all text-sm xl:text-base font-medium resize-none" placeholder="Explique a lógica do combo, quantidade, proposta e percepção de valor." required />
                            </div>
                        </div>
                    </div>

                    <div className="combo-editor-groups">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-black text-[#D4A373] uppercase tracking-[0.25em]">Grupos do combo</p>
                                <h4 className="text-xl font-black text-[#2A1E15] uppercase tracking-tighter">Monte a estrutura como na operação real</h4>
                            </div>
                            <button type="button" onClick={onAddComboGroup} className="menu-compact-action">
                                <Plus size={14} />
                                <span>Novo grupo</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {comboForm.comboGroups.map((group) => (
                                <div key={group.id} className="combo-group-card">
                                    <div className="combo-group-card__header">
                                        <div className="combo-group-card__grid">
                                            <CustomInput label="Nome do grupo" value={group.name} onChange={(e) => onComboGroupChange(group.id, 'name', e.target.value)} required />
                                            <CustomInput label="Mínimo" type="number" min="0" step="1" value={group.minSelect} onChange={(e) => onComboGroupChange(group.id, 'minSelect', e.target.value)} required />
                                            <CustomInput label="Máximo" type="number" min="1" step="1" value={group.maxSelect} onChange={(e) => onComboGroupChange(group.id, 'maxSelect', e.target.value)} required />
                                        </div>
                                        <div className="combo-group-card__actions">
                                            <span className="combo-group-card__range">De {group.minSelect || 0} a {group.maxSelect || 0}</span>
                                            <button type="button" onClick={() => onDuplicateComboGroup(group.id)} className="menu-action-button menu-action-button--edit">
                                                <Copy size={14} /> Duplicar
                                            </button>
                                            <button type="button" onClick={() => onRemoveComboGroup(group.id)} className="menu-action-button menu-action-button--delete" disabled={comboForm.comboGroups.length === 1}>
                                                <Trash2 size={14} /> Remover
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {group.options.map((option) => {
                                            const linkedMeta = resolveLinkedComponentMeta(option.linkedComponentRef, catalogMetrics, ingredients, formatMoney);

                                            return (
                                            <div key={option.id} className="combo-option-row">
                                                <div className="combo-option-row__main">
                                                    <CustomInput label="Opção" value={option.name} onChange={(e) => onComboOptionChange(group.id, option.id, 'name', e.target.value)} required />
                                                    <div className="space-y-1">
                                                        <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Vínculo técnico</label>
                                                        <select value={option.linkedComponentRef} onChange={(e) => onComboOptionChange(group.id, option.id, 'linkedComponentRef', e.target.value)} className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]">
                                                            <option value="">Manual / sem vínculo</option>
                                                            {menuComponentOptions.map((component) => (
                                                                <option key={component.key} value={component.key}>{formatComboboxLabel(`${component.name} · ${component.tag}`)}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="combo-option-row__pricing">
                                                    <CustomInput label="Adicional" type="number" min="0" step="0.01" value={option.extraPrice} onChange={(e) => onComboOptionChange(group.id, option.id, 'extraPrice', e.target.value)} />
                                                    <CustomInput label="Máx." type="number" min="1" step="1" value={option.maxQty} onChange={(e) => onComboOptionChange(group.id, option.id, 'maxQty', e.target.value)} />
                                                    <label className="combo-option-row__toggle">
                                                        <span>Esgotar</span>
                                                        <button type="button" onClick={() => onComboOptionChange(group.id, option.id, 'isAvailable', !option.isAvailable)} className={`combo-option-row__switch ${option.isAvailable ? 'combo-option-row__switch--active' : ''}`}>
                                                            <span className="combo-option-row__switch-knob" />
                                                        </button>
                                                    </label>
                                                    <button type="button" onClick={() => onRemoveComboOption(group.id, option.id)} className="menu-action-button menu-action-button--delete">
                                                        <Trash2 size={14} /> Excluir
                                                    </button>
                                                </div>
                                                {linkedMeta && (
                                                    <div className="combo-option-row__link">
                                                        <span className="menu-component-tag">{linkedMeta.tag}</span>
                                                        <span className="combo-option-row__link-text">{linkedMeta.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex justify-end">
                                        <button type="button" onClick={() => onAddComboOption(group.id)} className="menu-compact-action menu-compact-action--ghost">
                                            <Plus size={14} />
                                            <span>Nova opção</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-[#2A1E15] text-[#FFFFFF] h-12 rounded-xl font-black uppercase text-[11px] shadow-md">
                        {editingComboId ? 'Salvar combo' : 'Cadastrar combo'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const EmployeeRoleModal = ({ isOpen, onClose, roles, setRoles }) => {
    const [newRoleName, setNewRoleName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingValue, setEditingValue] = useState('');

    if (!isOpen) return null;

    const handleAddNew = () => {
        if (!newRoleName.trim()) return;
        setRoles(prev => [...prev, { id: Date.now(), name: newRoleName.trim() }]);
        setNewRoleName('');
    };

    const handleSaveEdit = (id) => {
        if (!editingValue.trim()) return;
        setRoles(prev => prev.map(role => role.id === id ? { ...role, name: editingValue.trim() } : role));
        setEditingId(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-6 font-sans italic">
                    <h3 className="text-xl font-black text-[#2A1E15] uppercase tracking-tighter flex items-center gap-2">
                        <Briefcase size={20} /> Cargos RH
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="Novo cargo..."
                        className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-[#D4A373] text-sm font-bold"
                    />
                    <button onClick={handleAddNew} className="bg-[#2A1E15] text-white px-4 rounded-xl hover:bg-[#3A281B] transition-all flex items-center justify-center">
                        <Plus size={18} />
                    </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {roles.map(role => (
                        <div key={role.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group border border-transparent hover:border-[#D4A373]/30">
                            {editingId === role.id ? (
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="text"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="flex-1 p-1 bg-white border border-[#D4A373] rounded-md outline-none text-xs font-bold uppercase"
                                        autoFocus
                                    />
                                    <button onClick={() => handleSaveEdit(role.id)} className="p-1 text-green-600"><Check size={16} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-1 text-gray-400"><X size={16} /></button>
                                </div>
                            ) : (
                                <>
                                    <span className="font-bold text-[#6F6258] uppercase text-xs truncate mr-2">{role.name}</span>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => { setEditingId(role.id); setEditingValue(role.name); }} className="text-blue-600 hover:scale-110 transition-transform"><Edit size={14} /></button>
                                        <button onClick={() => setRoles(prev => prev.filter(item => item.id !== role.id))} className="text-red-600 hover:scale-110 transition-transform"><Trash2 size={14} /></button>
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

const PreparationManagerModal = ({ isOpen, onClose, preparations, onEditPreparation, onDeletePreparation }) => {
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleDelete = async (preparationId) => {
        setDeletingId(preparationId);
        setError('');

        try {
            await onDeletePreparation(preparationId);
        } catch (apiError) {
            setError(apiError.message || 'Não foi possível excluir a receita base.');
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
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                </div>

                {error && <p className="mb-4 text-xs font-bold text-red-600 uppercase">{error}</p>}

                <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                    {preparations.length === 0 && (
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs font-bold text-[#6F6258] uppercase">
                            Nenhuma receita base cadastrada.
                        </div>
                    )}

                    {preparations.map((preparation) => (
                        <div key={preparation.id} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-[#D4A373]/30">
                            <div className="min-w-0">
                                <p className="font-black text-[#2A1E15] uppercase truncate">{preparation.name}</p>
                                <p className="text-xs text-[#6F6258] font-bold uppercase">
                                    Rendimento: {preparation.yieldQuantity} {preparation.yieldUnit} • {preparation.recipe?.length || 0} componente(s)
                                </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button type="button" onClick={() => onEditPreparation(preparation)} className="p-2 text-blue-600 hover:text-blue-800 transition-colors" title="Editar receita base">
                                    <Edit size={16} />
                                </button>
                                <button type="button" onClick={() => handleDelete(preparation.id)} disabled={deletingId === preparation.id} className="p-2 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50" title="Excluir receita base">
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
    preparations
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 font-sans italic shrink-0">
                    <h3 className="text-xl font-black text-[#2A1E15] uppercase tracking-tighter flex items-center gap-2">
                        <Briefcase size={20} /> {editingPreparationId ? 'Editar Receita Base' : 'Registrar Receita Base'}
                    </h3>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <CustomInput label="Nome da Receita Base" value={preparationForm.name} onChange={(e) => onPreparationFormChange('name', e.target.value)} required />
                            <CustomInput label="Rendimento da Receita" type="number" step="0.01" value={preparationForm.yieldQuantity} onChange={(e) => onPreparationFormChange('yieldQuantity', e.target.value)} required />
                            <div className="space-y-1">
                                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Unidade do Rendimento</label>
                                <select
                                    value={resolveUnitValue(ingredientUnits, preparationForm.yieldUnit)}
                                    onChange={(e) => onPreparationFormChange('yieldUnit', e.target.value)}
                                    className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
                                >
                                    {ingredientUnits.map((unit) => (
                                        <option key={`yield-unit-${unit.id}`} value={unit.label}>{formatComboboxLabel(unit.label)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm font-black text-[#2A1E15] uppercase">Composição da Receita</p>
                                <button type="button" onClick={onAddPreparationRecipeLine} className="text-[10px] font-black text-[#D4A373] border border-[#D4A373] px-3 py-2 rounded-full uppercase hover:bg-[#C58F5E] hover:text-[#2B2520] transition-all w-full sm:w-auto">
                                    Adicionar Item
                                </button>
                            </div>

                            <div className="space-y-3">
                                {preparationRecipeDraft.map((line, index) => {
                                    const baseUnit = getComponentBaseUnit(line.componentRef, ingredients, preparations);
                                    const compatibleUnits = getCompatibleUnits(baseUnit, ingredientUnits);

                                    return (
                                        <div key={line.id} className="grid grid-cols-1 sm:grid-cols-[1fr_130px_110px_48px] gap-3 items-end">
                                            <div className="space-y-1">
                                                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                                                    Componente {index + 1}
                                                </label>
                                                <select
                                                    value={line.componentRef}
                                                    onChange={(e) => onPreparationRecipeDraftChange(line.id, 'componentRef', e.target.value)}
                                                    className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
                                                >
                                                    <option value="">Selecione</option>
                                                    <optgroup label="Insumos">
                                                        {ingredients.map((ingredient) => (
                                                            <option key={`prep-ingredient-${ingredient.id}`} value={`ingredient:${ingredient.id}`}>
                                                                {formatComboboxLabel(ingredient.name)}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                    <optgroup label="Receitas Base">
                                                        {preparations.map((preparation) => (
                                                            <option key={`prep-preparation-${preparation.id}`} value={`preparation:${preparation.id}`}>
                                                                {formatComboboxLabel(preparation.name)}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                </select>
                                            </div>

                                            <CustomInput
                                                label="Quantidade"
                                                type="number"
                                                step="0.01"
                                                value={line.quantity}
                                                onChange={(e) => onPreparationRecipeDraftChange(line.id, 'quantity', e.target.value)}
                                                required
                                            />

                                            <div className="space-y-1">
                                                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Unidade</label>
                                                <select
                                                    value={resolveCompatibleUnitValue(ingredientUnits, baseUnit, line.quantityUnit)}
                                                    onChange={(e) => onPreparationRecipeDraftChange(line.id, 'quantityUnit', e.target.value)}
                                                    className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
                                                    disabled={!line.componentRef}
                                                >
                                                    <option value="">Selecione</option>
                                                    {compatibleUnits.map((unit) => (
                                                        <option key={`prep-line-unit-${line.id}-${unit.id}`} value={unit.label}>{formatComboboxLabel(unit.label)}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => onRemovePreparationRecipeLine(line.id)}
                                                disabled={preparationRecipeDraft.length === 1}
                                                className={`h-11 rounded-xl transition-colors ${preparationRecipeDraft.length === 1 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                                            >
                                                <Trash2 size={16} className="mx-auto" />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6 border-t border-gray-100 bg-white shrink-0">
                        <button type="submit" className="w-full bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md">
                            {editingPreparationId ? 'Atualizar Receita Base' : 'Salvar Receita Base'}
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
    preparations
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 font-sans italic shrink-0">
                    <h3 className="text-xl font-black text-[#2A1E15] uppercase tracking-tighter flex items-center gap-2">
                        <ShoppingBag size={20} /> Editar Produto
                    </h3>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <CustomInput label="Produto" value={productForm.name} onChange={(e) => onProductFormChange('name', e.target.value)} required />
                            <CustomInput label="Preço de Venda" type="number" step="0.01" value={productForm.salePrice} onChange={(e) => onProductFormChange('salePrice', e.target.value)} required />
                            <CustomInput label="Rendimento" type="number" step="0.01" value={productForm.yieldQuantity} onChange={(e) => onProductFormChange('yieldQuantity', e.target.value)} required />
                            <CustomInput label="CMV Alvo (%)" type="number" step="0.1" value={productForm.targetCmvPercent} onChange={(e) => onProductFormChange('targetCmvPercent', e.target.value)} required />
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm font-black text-[#2A1E15] uppercase">Receita / Componentes</p>
                                <button type="button" onClick={onAddRecipeLine} className="text-[10px] font-black text-[#D4A373] border border-[#D4A373] px-3 py-2 rounded-full uppercase hover:bg-[#C58F5E] hover:text-[#2B2520] transition-all w-full sm:w-auto">
                                    Adicionar Componente
                                </button>
                            </div>

                            <div className="space-y-3">
                                {productRecipeDraft.map((line, index) => {
                                    const baseUnit = getComponentBaseUnit(line.componentRef, ingredients, preparations);
                                    const compatibleUnits = getCompatibleUnits(baseUnit, ingredientUnits);

                                    return (
                                        <div key={line.id} className="grid grid-cols-1 sm:grid-cols-[1fr_130px_110px_48px] gap-3 items-end">
                                            <div className="space-y-1">
                                                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">
                                                    Componente {index + 1}
                                                </label>
                                                <select
                                                    value={line.componentRef}
                                                    onChange={(e) => onRecipeDraftChange(line.id, 'componentRef', e.target.value)}
                                                    className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
                                                >
                                                    <option value="">Selecione</option>
                                                    <optgroup label="Insumos">
                                                        {ingredients.map((ingredient) => (
                                                            <option key={`edit-product-ingredient-${ingredient.id}`} value={`ingredient:${ingredient.id}`}>
                                                                {formatComboboxLabel(ingredient.name)}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                    <optgroup label="Receitas Base">
                                                        {preparations.map((preparation) => (
                                                            <option key={`edit-product-preparation-${preparation.id}`} value={`preparation:${preparation.id}`}>
                                                                {formatComboboxLabel(preparation.name)}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                </select>
                                            </div>

                                            <CustomInput
                                                label="Quantidade"
                                                type="number"
                                                step="0.01"
                                                value={line.quantity}
                                                onChange={(e) => onRecipeDraftChange(line.id, 'quantity', e.target.value)}
                                                required
                                            />

                                            <div className="space-y-1">
                                                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Unidade</label>
                                                <select
                                                    value={resolveCompatibleUnitValue(ingredientUnits, baseUnit, line.quantityUnit)}
                                                    onChange={(e) => onRecipeDraftChange(line.id, 'quantityUnit', e.target.value)}
                                                    className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
                                                    disabled={!line.componentRef}
                                                >
                                                    <option value="">Selecione</option>
                                                    {compatibleUnits.map((unit) => (
                                                        <option key={`edit-product-line-unit-${line.id}-${unit.id}`} value={unit.label}>{formatComboboxLabel(unit.label)}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => onRemoveRecipeLine(line.id)}
                                                disabled={productRecipeDraft.length === 1}
                                                className={`h-11 rounded-xl transition-colors ${productRecipeDraft.length === 1 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
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
                        <button type="submit" className="w-full bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md">
                            Salvar Produto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SimpleOptionsModal = ({ isOpen, onClose, title, options, setOptions }) => {
    const [newValue, setNewValue] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingValue, setEditingValue] = useState('');

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!newValue.trim()) return;
        setOptions((prev) => [...prev, { id: Date.now(), name: newValue.trim() }]);
        setNewValue('');
    };

    const handleSave = (id) => {
        if (!editingValue.trim()) return;
        setOptions((prev) => prev.map((item) => item.id === id ? { ...item, name: editingValue.trim() } : item));
        setEditingId(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-6 font-sans italic">
                    <h3 className="text-xl font-black text-[#2A1E15] uppercase tracking-tighter">{title}</h3>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder="Novo item..."
                        className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-[#D4A373] text-sm font-bold"
                    />
                    <button type="button" onClick={handleAdd} className="bg-[#2A1E15] text-white px-4 rounded-xl hover:bg-[#3A281B] transition-all flex items-center justify-center">
                        <Plus size={18} />
                    </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                    {options.map((option) => (
                        <div key={option.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-transparent hover:border-[#D4A373]/30">
                            {editingId === option.id ? (
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="text"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="flex-1 p-1 bg-white border border-[#D4A373] rounded-md outline-none text-xs font-bold uppercase"
                                        autoFocus
                                    />
                                    <button type="button" onClick={() => handleSave(option.id)} className="p-1 text-green-600"><Check size={16} /></button>
                                    <button type="button" onClick={() => setEditingId(null)} className="p-1 text-gray-400"><X size={16} /></button>
                                </div>
                            ) : (
                                <>
                                    <span className="font-bold text-[#6F6258] uppercase text-xs truncate mr-2">{option.name}</span>
                                    <div className="flex gap-2 shrink-0">
                                        <button type="button" onClick={() => { setEditingId(option.id); setEditingValue(option.name); }} className="text-blue-600 hover:scale-110 transition-transform"><Edit size={14} /></button>
                                        <button type="button" onClick={() => setOptions((prev) => prev.filter((item) => item.id !== option.id))} className="text-red-600 hover:scale-110 transition-transform"><Trash2 size={14} /></button>
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

const EmployeeDiscountsModal = ({
    isOpen,
    onClose,
    employee,
    discountDraft,
    onDraftChange,
    onAddDiscount,
    onUpdateDiscountCategory,
    onUpdateDiscountValue,
    onRemoveDiscount,
    discountCategories
}) => {
    if (!isOpen || !employee) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-[#2A1E15] uppercase tracking-tighter">Ver Descontos</h3>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">{employee.name} | {employee.role}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3 items-end">
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase text-[#6F6258] tracking-widest">Categoria do Desconto</label>
                                <select
                                    value={discountDraft?.category || discountCategories[0]?.name || 'Outros'}
                                    onChange={(e) => onDraftChange('category', e.target.value)}
                                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-sm font-black uppercase text-[#6F6258] outline-none"
                                >
                                    {discountCategories.map(category => (
                                        <option key={category.id} value={category.name}>{formatComboboxLabel(category.name)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase text-[#6F6258] tracking-widest">Valor</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={discountDraft?.amount || ''}
                                    onChange={(e) => onDraftChange('amount', e.target.value)}
                                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-base font-black text-[#2A1E15] outline-none"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={onAddDiscount}
                                className="bg-[#2A1E15] text-[#FFFFFF] h-11 px-4 rounded-xl font-black uppercase text-xs shadow-md"
                            >
                                Adicionar Desconto
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {(employee.discounts || []).length === 0 && (
                            <p className="text-xs font-bold uppercase text-gray-400 tracking-widest">Sem descontos lançados.</p>
                        )}
                        {(employee.discounts || []).map((discount) => (
                            <div key={discount.id} className="bg-white rounded-xl border border-stone-200 p-3 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                                    <select
                                        value={discount.category}
                                        onChange={(e) => onUpdateDiscountCategory(discount.id, e.target.value)}
                                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-sm font-black uppercase text-[#6F6258] outline-none"
                                    >
                                        {discountCategories.map(category => (
                                            <option key={category.id} value={category.name}>{formatComboboxLabel(category.name)}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={discount.amount}
                                        onChange={(e) => onUpdateDiscountValue(discount.id, e.target.value)}
                                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-base font-black text-[#2A1E15] outline-none"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onRemoveDiscount(discount.id)}
                                    className="text-red-400 hover:text-red-600"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-5 sm:p-6 border-t border-gray-100 bg-white shrink-0 flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-stone-100 text-[#2A1E15] h-11 rounded-xl font-black uppercase text-xs"
                    >
                        Fechar
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-xs shadow-md"
                    >
                        Salvar
                    </button>
                </div>
            </div>
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
    isEditing
}) => {
    if (!isOpen) return null;

    const isFixed = employee.employmentType === 'fixed';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 shrink-0">
                    <h3 className="text-xl font-black text-[#2A1E15] uppercase tracking-tighter">
                        {isEditing ? 'Editar Funcionário' : 'Cadastrar Funcionário'}
                    </h3>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <CustomInput label="Nome Completo" value={employee.name} onChange={(e) => setEmployee((prev) => ({ ...prev, name: e.target.value }))} required />
                            <CustomInput label="Telefone" value={employee.phone} onChange={(e) => setEmployee((prev) => ({ ...prev, phone: e.target.value }))} />
                            <CustomInput label="E-mail" type="email" value={employee.email} onChange={(e) => setEmployee((prev) => ({ ...prev, email: e.target.value }))} />
                            <CustomInput label="Estado Civil" value={employee.maritalStatus} onChange={(e) => setEmployee((prev) => ({ ...prev, maritalStatus: e.target.value }))} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <CustomInput label="Endereço" value={employee.address} onChange={(e) => setEmployee((prev) => ({ ...prev, address: e.target.value }))} />
                            <div className="space-y-1">
                                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Tipo de Vínculo</label>
                                <select
                                    value={employee.employmentType}
                                    onChange={(e) => setEmployee((prev) => ({ ...prev, employmentType: e.target.value }))}
                                    className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
                                >
                                    <option value="fixed">Fixo</option>
                                    <option value="external">Por Fora</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Status</label>
                                <select
                                    value={employee.status}
                                    onChange={(e) => setEmployee((prev) => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
                                >
                                    <option value="active">Ativo</option>
                                    <option value="inactive">Inativo</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Cargo / Função</label>
                                <select
                                    value={employee.role}
                                    onChange={(e) => setEmployee((prev) => ({ ...prev, role: e.target.value }))}
                                    className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
                                >
                                    <option value="">Selecione</option>
                                    {employeeRoles.map((role) => (
                                        <option key={role.id} value={role.name}>{role.name}</option>
                                    ))}
                                </select>
                            </div>
                            {isFixed ? (
                                <>
                                    <CustomInput label="Salário" type="number" step="0.01" value={employee.salary} onChange={(e) => setEmployee((prev) => ({ ...prev, salary: e.target.value }))} required />
                                    <CustomInput label="Admissão" type="date" value={employee.admissionDate} onChange={(e) => setEmployee((prev) => ({ ...prev, admissionDate: e.target.value }))} />
                                    <CustomInput label="Observações" value={employee.notes} onChange={(e) => setEmployee((prev) => ({ ...prev, notes: e.target.value }))} />
                                </>
                            ) : (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Tipo de Pagamento</label>
                                        <select
                                            value={employee.paymentMode}
                                            onChange={(e) => setEmployee((prev) => ({ ...prev, paymentMode: e.target.value }))}
                                            className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
                                        >
                                            <option value="weekly">Semanal</option>
                                            <option value="one_off">Avulso</option>
                                        </select>
                                    </div>
                                    <CustomInput label="Valor Base" type="number" step="0.01" value={employee.baseAmount} onChange={(e) => setEmployee((prev) => ({ ...prev, baseAmount: e.target.value }))} required />
                                    {employee.paymentMode === 'weekly' ? (
                                        <div className="space-y-1">
                                            <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Dia da Semana</label>
                                            <select
                                                value={employee.weekday}
                                                onChange={(e) => setEmployee((prev) => ({ ...prev, weekday: e.target.value }))}
                                                className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
                                            >
                                                <option value="1">Segunda</option>
                                                <option value="2">Terça</option>
                                                <option value="3">Quarta</option>
                                                <option value="4">Quinta</option>
                                                <option value="5">Sexta</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <CustomInput label="Data do Pagamento" type="date" value={employee.specificDate} onChange={(e) => setEmployee((prev) => ({ ...prev, specificDate: e.target.value }))} />
                                    )}
                                </>
                            )}
                        </div>

                        {!isFixed && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <CustomInput label="Data de Início" type="date" value={employee.startDate} onChange={(e) => setEmployee((prev) => ({ ...prev, startDate: e.target.value }))} />
                                <CustomInput label="Observações" value={employee.notes} onChange={(e) => setEmployee((prev) => ({ ...prev, notes: e.target.value }))} />
                            </div>
                        )}
                    </div>

                    <div className="p-5 sm:p-6 border-t border-gray-100 bg-white shrink-0">
                        <button type="submit" className="w-full bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md">
                            {isEditing ? 'Salvar Funcionário' : 'Cadastrar Funcionário'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const formatMoney = (value) => `R$ ${Number(value || 0).toFixed(2)}`;

const formatDateBr = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('pt-BR');
};

const normalizeDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const parseIsoDate = (value) => {
    if (!value) return null;
    const [year, month, day] = String(value).split('-').map(Number);
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
    if (!normalized) return '';
    const year = normalized.getFullYear();
    const month = String(normalized.getMonth() + 1).padStart(2, '0');
    const day = String(normalized.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Resolve o intervalo do extrato financeiro a partir do tipo de filtro selecionado.
 */
const buildClosingRange = (filterType, referenceDate, rangeStart, rangeEnd) => {
    const baseReference = normalizeDate(parseIsoDate(referenceDate) || new Date()) || new Date();

    if (filterType === 'dia') {
        return {
            start: baseReference,
            end: baseReference,
            label: `Fechamento do dia ${formatDateBr(baseReference)}`
        };
    }

    if (filterType === 'mes') {
        const start = new Date(baseReference.getFullYear(), baseReference.getMonth(), 1);
        const end = new Date(baseReference.getFullYear(), baseReference.getMonth() + 1, 0);
        return {
            start,
            end,
            label: `Fechamento de ${baseReference.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
        };
    }

    if (filterType === 'quinzena') {
        const end = baseReference;
        const start = new Date(baseReference);
        start.setDate(start.getDate() - 14);
        return {
            start: normalizeDate(start),
            end,
            label: `Fechamento quinzenal até ${formatDateBr(end)}`
        };
    }

    const startCandidate = normalizeDate(parseIsoDate(rangeStart) || baseReference) || baseReference;
    const endCandidate = normalizeDate(parseIsoDate(rangeEnd) || baseReference) || baseReference;
    const start = startCandidate <= endCandidate ? startCandidate : endCandidate;
    const end = endCandidate >= startCandidate ? endCandidate : startCandidate;

    return {
        start,
        end,
        label: `Período de ${formatDateBr(start)} até ${formatDateBr(end)}`
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

const getNextBusinessDayFromFixedDate = (year, monthIndex, day, holidayDates = []) => {
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
    const [componentType, rawId] = String(value || '').split(':');

    return {
        componentType,
        componentId: rawId || ''
    };
};

const idsEqual = (left, right) => String(left) === String(right);

const findById = (items, id) => items.find((current) => idsEqual(current.id, id));

const normalizeComboCategoryNames = (option = {}) => {
    const values = Array.isArray(option.linkedCategoryNames)
        ? option.linkedCategoryNames
        : [];
    const fallback = option.linkedCategoryName ? [option.linkedCategoryName] : [];

    return [...values, ...fallback].reduce((acc, categoryName) => {
        const normalized = String(categoryName || '').trim();
        if (normalized && !acc.includes(normalized)) acc.push(normalized);
        return acc;
    }, []);
};

const resolveUnitValue = (units, unitLabel) => resolveSelectableUnitLabel(units, unitLabel);

const resolveCompatibleUnitValue = (units, sourceUnit, unitLabel) => (
    resolveSelectableUnitLabel(getCompatibleUnits(sourceUnit, units), unitLabel)
);

const getComponentBaseUnit = (componentRef, ingredients, preparations) => {
    const parsed = parseComponentValue(componentRef);

    if (parsed.componentType === 'ingredient') {
        return findById(ingredients, parsed.componentId)?.unit || '';
    }

    if (parsed.componentType === 'preparation') {
        return findById(preparations, parsed.componentId)?.yieldUnit || '';
    }

    return '';
};

const buildPreparationCostMap = (preparations, ingredients) => {
    const cache = new Map();

    const resolveComponentUnitCost = (componentType, componentId, stack = new Set()) => {
        const componentKey = String(componentId);

        if (componentType === 'ingredient') {
            return calculateIngredientUnitCost(
                findById(ingredients, componentId)
            );
        }

        if (componentType === 'preparation') {
            if (cache.has(componentKey)) return cache.get(componentKey);
            if (stack.has(componentKey)) return 0;

            const preparation = findById(preparations, componentId);
            if (!preparation) return 0;

            const nextStack = new Set(stack);
            nextStack.add(componentKey);

            const totalCost = calculateRecipeCost(preparation.recipe, (item) => {
                const component = item.componentType === 'ingredient'
                    ? findById(ingredients, item.componentId)
                    : findById(preparations, item.componentId);
                return {
                    sourceUnit: item.componentType === 'ingredient' ? component?.unit : component?.yieldUnit,
                    unitCost: resolveComponentUnitCost(item.componentType, item.componentId, nextStack)
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
        resolveComponentUnitCost('preparation', preparation.id);
    });

    return cache;
};

const calculatePreparationMetrics = (preparation, ingredients, preparations, preparationCostMap) => {
    const totalCost = calculateRecipeCost(preparation.recipe, (item) => {
        const componentSourceUnit = item.componentType === 'ingredient'
            ? findById(ingredients, item.componentId)?.unit
            : findById(preparations, item.componentId)?.yieldUnit;
        const componentUnitCost = item.componentType === 'ingredient'
            ? calculateIngredientUnitCost(findById(ingredients, item.componentId))
            : (preparationCostMap.get(String(item.componentId)) || 0);

        return { sourceUnit: componentSourceUnit, unitCost: componentUnitCost };
    });

    return {
        totalCost,
        unitCost: preparationCostMap.get(String(preparation.id)) || 0
    };
};

const calculateProductMetrics = (product, ingredients, preparations, preparationCostMap) => {
    const recipeCost = calculateRecipeCost(product.recipe, (item) => {
        const componentSourceUnit = item.componentType === 'ingredient'
            ? findById(ingredients, item.componentId)?.unit
            : findById(preparations, item.componentId)?.yieldUnit;
        const componentUnitCost = item.componentType === 'ingredient'
            ? calculateIngredientUnitCost(findById(ingredients, item.componentId))
            : (preparationCostMap.get(String(item.componentId)) || 0);

        return { sourceUnit: componentSourceUnit, unitCost: componentUnitCost };
    });

    const yieldQuantity = Number(product.yieldQuantity) || 1;
    const unitCost = recipeCost / yieldQuantity;
    const salePrice = Number(product.salePrice) || 0;
    const targetCmvPercent = Number(product.targetCmvPercent) || 30;
    const cmvPercent = salePrice > 0 ? (unitCost / salePrice) * 100 : 0;
    const suggestedPrice = targetCmvPercent > 0 ? unitCost / (targetCmvPercent / 100) : 0;
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
        markupPercent
    };
};

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
        primaryDark: '#3A281B',
        primaryLight: '#E7DED1',
        primaryDarker: '#2B2520',
        secondary: '#D4A373',
        secondaryHover: '#C58F5E',
        secondaryLight: '#F3E8DA',
        bgApp: '#FAF6EF',
        bgCard: '#FFFFFF',
        bgAlt: '#F3E8DA',
        textStrong: '#2B2520',
        textMedium: '#6F6258',
        textWeak: '#9C8F84',
        accentMin: '#3F6F8F',
        success: '#3F8F52',
        error: '#C95C49'
    }
};

// --- APLICAÇÃO PRINCIPAL ---
export default function App({ tenantSlug = 'default' }) {
    const navigate = useNavigate();
    const [session, setSession] = useState(tenantSlug !== 'default');
    const [bootstrapLoading, setBootstrapLoading] = useState(true);
    const [bootstrapError, setBootstrapError] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [openGroups, setOpenGroups] = useState(() => ({ operacional: true, financeiro: false, pessoas: false, sistema: false }));
    const [settingsError, setSettingsError] = useState('');
    const [settingsSuccess, setSettingsSuccess] = useState('');
    const [aiBehaviorError, setAiBehaviorError] = useState('');
    const [aiBehaviorSuccess, setAiBehaviorSuccess] = useState('');
    const [settingsCapsLockOn, setSettingsCapsLockOn] = useState(false);
    const [dismissedAlerts, setDismissedAlerts] = useState([]);
    const [highlightedCostIds, setHighlightedCostIds] = useState([]);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isPreparationModalOpen, setIsPreparationModalOpen] = useState(false);
    const [isPreparationManagerModalOpen, setIsPreparationManagerModalOpen] = useState(false);
    const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
    const [isFinanceCategoryModalOpen, setIsFinanceCategoryModalOpen] = useState(false);
    const [isDiscountCategoryModalOpen, setIsDiscountCategoryModalOpen] = useState(false);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [isEmployeeDiscountsModalOpen, setIsEmployeeDiscountsModalOpen] = useState(false);
    const [editingEmployeeId, setEditingEmployeeId] = useState(null);
    const [selectedEmployeeIdForDiscounts, setSelectedEmployeeIdForDiscounts] = useState(null);
    const [rhView, setRhView] = useState('fixed');

    const currentMonthYear = new Date().toISOString().slice(0, 7);

    // Configurações
    const [settings, setSettings] = useState(() => ({
        ifoodTax: 23,
        anotaaiTax: 5,
        appPassword: 'admin',
        passwordReminder: 'A senha padrão é "admin".',
        businessName: 'Rei das Esfihas',
        alertDaysBefore: 3,
        colorPalette: 'esfiha'
    }));
    const [aiBehaviorSettings, setAiBehaviorSettings] = useState(() => createDefaultAiBehaviorSettings());

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

    // Categorias
    const [costCategories, setCostCategories] = useState(() => [
        { id: 1, name: "Aluguel" }, { id: 2, name: "Energia Elétrica" },
        { id: 3, name: "Água" }, { id: 4, name: "Internet" }, { id: 5, name: "Contador" }
    ]);

    const [employeeRoles, setEmployeeRoles] = useState(() => [
        { id: 1, name: 'Esfiharia' },
        { id: 2, name: 'Atendimento' },
        { id: 3, name: 'Pizzaiolo' },
        { id: 4, name: 'Gerência' }
    ]);

    const [discountCategories, setDiscountCategories] = useState(() => [
        { id: 1, name: 'Falta' },
        { id: 2, name: 'Atraso' },
        { id: 3, name: 'Adiantamento' },
        { id: 4, name: 'Outros' }
    ]);

    // RH
    const [employees, setEmployees] = useState(() => [
        {
            id: 1,
            name: 'João da Massa',
            phone: '',
            email: '',
            address: '',
            maritalStatus: '',
            role: 'Esfiharia',
            notes: '',
            employmentType: 'fixed',
            status: 'active',
            salary: 2200,
            admissionDate: '',
            discounts: [{ id: 1, category: 'Falta', amount: 0 }]
        },
        {
            id: 2,
            name: 'Maria do Balcão',
            phone: '',
            email: '',
            address: '',
            maritalStatus: '',
            role: 'Atendimento',
            notes: '',
            employmentType: 'fixed',
            status: 'active',
            salary: 1800,
            admissionDate: '',
            discounts: [{ id: 1, category: 'Outros', amount: 0 }]
        },
        {
            id: 3,
            name: 'Carlos da Fornalha',
            phone: '',
            email: '',
            address: '',
            maritalStatus: '',
            role: 'Pizzaiolo',
            notes: 'Prestador semanal',
            employmentType: 'external',
            status: 'active',
            paymentMode: 'weekly',
            baseAmount: 450,
            weekday: '5',
            specificDate: '',
            startDate: ''
        }
    ]);
    const [employeeDiscountDrafts, setEmployeeDiscountDrafts] = useState({});
    const [employeeForm, setEmployeeForm] = useState(() => ({
        name: '',
        phone: '',
        email: '',
        address: '',
        maritalStatus: '',
        role: '',
        notes: '',
        employmentType: 'fixed',
        status: 'active',
        salary: '',
        admissionDate: '',
        discounts: [],
        paymentMode: 'weekly',
        baseAmount: '',
        weekday: '1',
        specificDate: '',
        startDate: ''
    }));

    const [payrollConfig, setPayrollConfig] = useState(() => ({
        salaryPercentage: 60,
        salaryBusinessDayOrdinal: 5,
        advancePercentage: 40,
        advanceFixedDay: 20,
        advanceBusinessDayPolicy: 'next',
        holidayDates: []
    }));

    const [ingredients, setIngredients] = useState(() => [
        { id: 1, name: 'Farinha', unit: 'G', packageQuantity: 1000, packageCost: 4.4, unitCost: 0.0044 },
        { id: 2, name: 'Carne Moída', unit: 'G', packageQuantity: 1000, packageCost: 32.0, unitCost: 0.032 },
        { id: 3, name: 'Queijo Mussarela', unit: 'G', packageQuantity: 1000, packageCost: 28.0, unitCost: 0.028 },
        { id: 4, name: 'Molho de Tomate', unit: 'G', packageQuantity: 1000, packageCost: 9.0, unitCost: 0.009 },
        { id: 5, name: 'Embalagem', unit: 'UN', packageQuantity: 1, packageCost: 0.35, unitCost: 0.35 }
    ]);

    const [ingredientUnits, setIngredientUnits] = useState(() => createDefaultIngredientUnits());

    const [editingIngredientId, setEditingIngredientId] = useState(null);
    const [ingredientForm, setIngredientForm] = useState(() => ({
        name: '',
        unit: 'G',
        unitCost: ''
    }));
    const [financeFormType, setFinanceFormType] = useState('receita');
    const todayIsoDate = toIsoDate(new Date());
    const [closingFilterType, setClosingFilterType] = useState('mes');
    const [closingReferenceDate, setClosingReferenceDate] = useState(todayIsoDate);
    const [closingRangeStart, setClosingRangeStart] = useState(todayIsoDate);
    const [closingRangeEnd, setClosingRangeEnd] = useState(todayIsoDate);

    const [preparationForm, setPreparationForm] = useState(() => ({
        name: '',
        yieldQuantity: '1',
        yieldUnit: 'G'
    }));
    const [editingPreparationId, setEditingPreparationId] = useState(null);

    const [preparations, setPreparations] = useState(() => [
        {
            id: 1,
            name: 'Carne Moída Temperada',
            yieldQuantity: 1,
            yieldUnit: 'KG',
            recipe: [
                { componentType: 'ingredient', componentId: 2, quantity: 0.85, quantityUnit: 'KG' },
                { componentType: 'ingredient', componentId: 4, quantity: 120, quantityUnit: 'G' }
            ]
        }
    ]);

    const [products, setProducts] = useState(() => [
        {
            id: 1,
            name: 'Esfiha de Carne',
            salePrice: 8.0,
            yieldQuantity: 1,
            targetCmvPercent: 30,
            recipe: [
                { componentType: 'ingredient', componentId: 1, quantity: 90, quantityUnit: 'G' },
                { componentType: 'preparation', componentId: 1, quantity: 70, quantityUnit: 'G' },
                { componentType: 'ingredient', componentId: 5, quantity: 1, quantityUnit: 'UN' }
            ]
        },
        {
            id: 2,
            name: 'Pizza Brotinho',
            salePrice: 24.0,
            yieldQuantity: 1,
            targetCmvPercent: 32,
            recipe: [
                { componentType: 'ingredient', componentId: 1, quantity: 220, quantityUnit: 'G' },
                { componentType: 'ingredient', componentId: 3, quantity: 140, quantityUnit: 'G' },
                { componentType: 'ingredient', componentId: 4, quantity: 90, quantityUnit: 'G' },
                { componentType: 'ingredient', componentId: 5, quantity: 1, quantityUnit: 'UN' }
            ]
        }
    ]);

    const [menuCategories, setMenuCategories] = useState(() => createInitialMenuCategories());
    const [menuItems, setMenuItems] = useState(() => [
        {
            id: 1,
            itemType: 'regular',
            name: 'Esfiha Premium de Carne',
            category: 'Esfiha',
            description: 'Massa leve com recheio bem temperado, toque de limão e apresentação individual.',
            status: 'active',
            salePrice: 11.9,
            photoPreview: '',
            linkedComponents: [
                { type: 'product', id: 1 },
                { type: 'ingredient', id: 5 }
            ],
            comboGroups: [],
            basePrice: null,
            createdAt: '2026-04-01T12:00:00.000Z'
        },
        {
            id: 2,
            itemType: 'regular',
            name: 'Pizza Brotinho Casa',
            category: 'Pizza',
            description: 'Massa artesanal, molho da casa, queijo derretido e sabor clássico para compartilhar.',
            status: 'seasonal',
            salePrice: 29.9,
            photoPreview: '',
            linkedComponents: [
                { type: 'product', id: 2 },
                { type: 'preparation', id: 1 }
            ],
            comboGroups: [],
            basePrice: null,
            createdAt: '2026-04-05T18:30:00.000Z'
        },
        {
            id: 3,
            itemType: 'combo',
            name: 'Banquete Real',
            category: 'Combo',
            description: 'Combo grande com sabores clássicos e uma bebida obrigatória, inspirado no fluxo operacional de marketplaces.',
            status: 'active',
            salePrice: null,
            basePrice: 80,
            photoPreview: '',
            linkedComponents: [],
            comboGroups: [
                {
                    id: createId(),
                    name: 'Clássicas',
                    minSelect: 15,
                    maxSelect: 15,
                    options: [
                        { id: createId(), name: 'Carne', photoPreview: '', extraPrice: 0, maxQty: 15, isAvailable: true, linkedComponentRef: 'product:1' },
                        { id: createId(), name: 'Calabresa', photoPreview: '', extraPrice: 0, maxQty: 15, isAvailable: true, linkedComponentRef: '' },
                        { id: createId(), name: 'Queijo', photoPreview: '', extraPrice: 0, maxQty: 15, isAvailable: true, linkedComponentRef: '' },
                        { id: createId(), name: 'Frango', photoPreview: '', extraPrice: 0, maxQty: 15, isAvailable: false, linkedComponentRef: '' }
                    ]
                },
                {
                    id: createId(),
                    name: 'Bebidas',
                    minSelect: 1,
                    maxSelect: 1,
                    options: [
                        { id: createId(), name: 'Kuat 2L', photoPreview: '', extraPrice: 0, maxQty: 1, isAvailable: true, linkedComponentRef: '' },
                        { id: createId(), name: 'Fanta Laranja 2L', photoPreview: '', extraPrice: 0, maxQty: 1, isAvailable: true, linkedComponentRef: '' },
                        { id: createId(), name: 'Coca-Cola Original 2L', photoPreview: '','extraPrice': 6, maxQty: 1, isAvailable: false, linkedComponentRef: '' }
                    ]
                }
            ],
            createdAt: '2026-04-05T18:30:00.000Z'
        }
    ]);
    const [menuItemForm, setMenuItemForm] = useState(() => createEmptyMenuItemForm('Esfiha'));
    const [comboForm, setComboForm] = useState(() => createEmptyComboForm('Combo'));
    const [menuCategoryForm, setMenuCategoryForm] = useState(() => createEmptyCategoryForm());
    const [menuSearchTerm, setMenuSearchTerm] = useState('');
    const [menuComponentSearch, setMenuComponentSearch] = useState('');
    const [editingMenuItemId, setEditingMenuItemId] = useState(null);
    const [editingComboId, setEditingComboId] = useState(null);
    const [editingMenuCategoryId, setEditingMenuCategoryId] = useState(null);
    const [isMenuCategoryModalOpen, setIsMenuCategoryModalOpen] = useState(false);
    const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
    const [isComboModalOpen, setIsComboModalOpen] = useState(false);
    const [expandedMenuCategories, setExpandedMenuCategories] = useState(() => ({ Esfiha: true, Pizza: true }));
    const [expandedMenuItems, setExpandedMenuItems] = useState(() => ({ 1: false, 2: false, 3: true }));

    const [productRecipeDraft, setProductRecipeDraft] = useState(() => [
        { id: Date.now(), componentRef: '', quantity: '', quantityUnit: '' }
    ]);
    const [editingProductId, setEditingProductId] = useState(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productForm, setProductForm] = useState(() => ({
        name: '',
        salePrice: '',
        yieldQuantity: '1',
        targetCmvPercent: '30'
    }));

    const [preparationRecipeDraft, setPreparationRecipeDraft] = useState(() => [
        { id: Date.now() + 1, componentRef: '', quantity: '', quantityUnit: '' }
    ]);

    const [productSearchTerm, setProductSearchTerm] = useState('');

    // Custos Fixos
    const [recurringCosts, setRecurringCosts] = useState(() => [
        { id: 1, desc: 'Aluguel', amount: 3000, dueDay: 10, lastPaidMonth: "" },
        { id: 2, desc: 'Energia Elétrica', amount: 850, dueDay: 15, lastPaidMonth: "" }
    ]);

    const [salesChannels, setSalesChannels] = useState(() => [
        { id: 1, name: 'ifood' },
        { id: 2, name: 'anotaai' }
    ]);

    const [financeExpenseCategories, setFinanceExpenseCategories] = useState(() => [
        { id: 1, name: 'Compra de Insumos' },
        { id: 2, name: 'Fornecedor' },
        { id: 3, name: 'Manutenção' },
        { id: 4, name: 'Marketing' },
        { id: 5, name: 'Imposto' },
        { id: 6, name: 'Retirada' },
        { id: 7, name: 'Outras Saídas' }
    ]);

    // Vendas
    const [transactions, setTransactions] = useState(() => [
        { id: 1, date: '2024-04-09', platform: 'ifood', payment: 'online', amount: 1200.00, tax: 23, net: 924.00, type: 'receita', category: 'ifood', note: 'Pedidos iFood' },
        { id: 2, date: '2024-04-09', platform: 'anotaai', payment: 'pix', amount: 650.00, tax: 5, net: 617.50, type: 'receita', category: 'anotaai', note: 'Pedidos Anota AI' },
        { id: 3, date: '2024-04-09', platform: 'despesa', payment: 'pix', amount: 180.00, tax: 0, net: -180.00, type: 'despesa', category: 'Compra de Insumos', note: 'Reposição de hortifruti' },
    ]);
    const [customers, setCustomers] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [orders, setOrders] = useState([]);
    const [deliveryDrivers, setDeliveryDrivers] = useState([]);
    const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const resolvedTenantSlug = tenantSlug !== 'default' ? tenantSlug : '';

        if (!USE_BACKEND_BOOTSTRAP) {
            setSession(true);
            setBootstrapError('');
            setBootstrapLoading(false);
            return undefined;
        }

        if (!resolvedTenantSlug) {
            setBootstrapLoading(false);
            setBootstrapError('Sessão não encontrada. Faça login novamente.');
            return undefined;
        }

        const loadBootstrap = async () => {
            setBootstrapLoading(true);
            setBootstrapError('');

            try {
                const payload = await appApi.getBootstrap(resolvedTenantSlug);

                if (cancelled) return;

                startTransition(() => {
                    setSettings(payload.settings || {});
                    setAiBehaviorSettings(normalizeAiBehaviorSettings(payload.aiBehaviorSettings));
                    setPayrollConfig(payload.payrollConfig || {});
                    setEmployees(payload.employees || []);
                    setRecurringCosts(payload.recurringCosts || []);
                    setSalesChannels(payload.salesChannels || []);
                    setFinanceExpenseCategories(payload.financeExpenseCategories || []);
                    setTransactions(payload.transactions || []);
                    setCustomers(payload.customers || []);
                    setPaymentMethods(payload.paymentMethods || []);
                    setOrders(payload.orders || []);
                    setDeliveryDrivers(payload.deliveryDrivers || []);
                    setEmployeeRoles(payload.employeeRoles || []);
                    setDiscountCategories(payload.discountCategories || []);
                    setIngredients(payload.ingredients || []);
                    setIngredientUnits(createDefaultIngredientUnits());
                    setPreparations(payload.preparations || []);
                    setProducts(payload.products || []);
                    setMenuCategories(payload.menuCategories || []);
                    setMenuItems(payload.menuItems || []);
                    setSession(true);
                });
            } catch (apiError) {
                if (cancelled) return;
                setBootstrapError(apiError.message || 'Falha ao carregar os dados iniciais.');
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

    // Lógica de Alertas
    const activeAlerts = useMemo(() => {
        const today = new Date();
        const currentDay = today.getDate();
        return recurringCosts.filter(cost => {
            if (cost.lastPaidMonth === currentMonthYear) return false;
            const daysUntil = cost.dueDay - currentDay;
            const isDueSoon = daysUntil >= 0 && daysUntil <= settings.alertDaysBefore;
            const isExactlyToday = daysUntil === 0;
            const alreadyDismissed = dismissedAlerts.includes(`${cost.id}-${today.getMonth()}`);
            return isExactlyToday || (isDueSoon && !alreadyDismissed);
        });
    }, [recurringCosts, settings.alertDaysBefore, dismissedAlerts, currentMonthYear]);

    const prioritizedAlerts = useMemo(() => (
        [...activeAlerts].sort((a, b) => {
            if (a.dueDay !== b.dueDay) return a.dueDay - b.dueDay;
            return b.amount - a.amount;
        })
    ), [activeAlerts]);

    const sortedRecurringCosts = useMemo(() => {
        if (highlightedCostIds.length === 0) return recurringCosts;

        return [...recurringCosts].sort((a, b) => {
            const aHighlighted = highlightedCostIds.includes(a.id) ? 1 : 0;
            const bHighlighted = highlightedCostIds.includes(b.id) ? 1 : 0;

            if (aHighlighted !== bHighlighted) return bHighlighted - aHighlighted;
            if (a.dueDay !== b.dueDay) return a.dueDay - b.dueDay;
            return b.amount - a.amount;
        });
    }, [recurringCosts, highlightedCostIds]);

    const catalogMetrics = useMemo(() => {
        const preparationCostMap = buildPreparationCostMap(preparations, ingredients);

        const preparationSummaries = preparations.map((preparation) => ({
            ...preparation,
            metrics: calculatePreparationMetrics(preparation, ingredients, preparations, preparationCostMap)
        }));

        const productSummaries = products.map((product) => ({
            ...product,
            metrics: calculateProductMetrics(product, ingredients, preparations, preparationCostMap)
        }));

        const totalUnitCost = productSummaries.reduce((acc, product) => acc + product.metrics.unitCost, 0);
        const totalSalePrice = productSummaries.reduce((acc, product) => acc + product.metrics.salePrice, 0);
        const averageCmvPercent = productSummaries.length > 0
            ? productSummaries.reduce((acc, product) => acc + product.metrics.cmvPercent, 0) / productSummaries.length
            : 0;
        const averageMarkupPercent = productSummaries.length > 0
            ? productSummaries.reduce((acc, product) => acc + product.metrics.markupPercent, 0) / productSummaries.length
            : 0;

        return {
            preparationSummaries,
            productSummaries,
            totalUnitCost,
            totalSalePrice,
            averageCmvPercent,
            averageMarkupPercent
        };
    }, [products, ingredients, preparations]);

    const menuComponentOptions = useMemo(() => {
        const productOptions = catalogMetrics.productSummaries.map((product) => ({
            key: `product:${product.id}`,
            type: 'product',
            id: product.id,
            name: product.name,
            salePrice: product.metrics.salePrice,
            subtitle: `Preço base ${formatMoney(product.metrics.salePrice)}`,
            tag: 'Produto final'
        }));

        return productOptions;
    }, [catalogMetrics.productSummaries]);

    const filteredMenuComponentOptions = useMemo(() => {
        const normalizedSearch = menuComponentSearch.trim().toLowerCase();

        if (!normalizedSearch) return menuComponentOptions;

        return menuComponentOptions.filter((component) => (
            component.name.toLowerCase().includes(normalizedSearch)
            || component.tag.toLowerCase().includes(normalizedSearch)
            || component.subtitle.toLowerCase().includes(normalizedSearch)
        ));
    }, [menuComponentOptions, menuComponentSearch]);

    const menuComponentOptionByKey = useMemo(() => (
        new Map(menuComponentOptions.map((component) => [component.key, component]))
    ), [menuComponentOptions]);

    const menuCategoryOptions = useMemo(() => menuCategories.map((category) => category.name), [menuCategories]);

    const comboLinkCategoryOptions = useMemo(() => (
        menuCategoryOptions.reduce((acc, category) => {
            const registeredItemsCount = menuItems.filter((item) => item.category === category && item.id !== editingComboId).length;
            if (registeredItemsCount === 0) return acc;

            acc.push({
                value: category,
                label: `${category} (${registeredItemsCount})`
            });
            return acc;
        }, [])
    ), [editingComboId, menuCategoryOptions, menuItems]);

    const comboLinkItemsByCategory = useMemo(() => (
        menuItems.reduce((acc, item) => {
            if (item.id === editingComboId) return acc;

            const categoryKey = item.category || 'Sem categoria';
            if (!acc[categoryKey]) {
                acc[categoryKey] = [];
            }

            const hasBasePrice = typeof item.basePrice === 'number' && item.basePrice > 0;
            const priceValue = hasBasePrice ? item.basePrice : Number(item.salePrice) || 0;

            acc[categoryKey].push({
                key: `menu-item:${item.id}`,
                type: 'menu-item',
                id: item.id,
                name: item.name,
                subtitle: `${item.itemType === 'combo' ? 'Combo' : 'Item'} • ${formatMoney(priceValue)}`,
                tag: item.itemType === 'combo' ? 'Combo cadastrado' : 'Item cadastrado'
            });

            return acc;
        }, {})
    ), [editingComboId, menuItems]);

    const menuDashboard = useMemo(() => {
        const activeCount = menuItems.filter((item) => item.status === 'active').length;
        const highlightedCount = menuItems.filter((item) => item.status === 'seasonal').length;
        const itemsWithPhoto = menuItems.filter((item) => item.photoPreview).length;
        const visibleCount = menuItems.filter((item) => item.status !== 'inactive').length;

        return {
            activeCount,
            highlightedCount,
            itemsWithPhoto,
            visibleCount
        };
    }, [menuItems]);

    const filteredMenuItems = useMemo(() => {
        const normalizedSearch = menuSearchTerm.trim().toLowerCase();

        if (!normalizedSearch) return menuItems;

        return menuItems.filter((item) => (
            item.name.toLowerCase().includes(normalizedSearch)
            || item.category.toLowerCase().includes(normalizedSearch)
            || item.description.toLowerCase().includes(normalizedSearch)
            || item.comboGroups?.some((group) =>
                group.name.toLowerCase().includes(normalizedSearch)
                || group.options.some((option) => option.name.toLowerCase().includes(normalizedSearch))
            )
        ));
    }, [menuItems, menuSearchTerm]);

    const menuItemsByCategory = useMemo(() => {
        const grouped = menuCategories.map((category) => ({
            id: category.id,
            name: category.name,
            items: filteredMenuItems.filter((item) => item.category === category.name)
        }));

        const uncategorizedItems = filteredMenuItems.filter((item) => !menuCategoryOptions.includes(item.category));

        if (uncategorizedItems.length > 0) {
            grouped.push({
                id: 'uncategorized',
                name: 'Sem categoria',
                items: uncategorizedItems
            });
        }

        return grouped.filter((group) => group.items.length > 0 || menuSearchTerm.trim() === '');
    }, [filteredMenuItems, menuCategories, menuCategoryOptions, menuSearchTerm]);

    const menuOperationalSummary = useMemo(() => {
        const totalItems = menuItems.length;
        const emptyCategories = menuCategories.filter((category) => !menuItems.some((item) => item.category === category.name)).length;
        const draftCount = menuItems.filter((item) => item.status === 'draft').length;
        const inactiveCount = menuItems.filter((item) => item.status === 'inactive').length;
        const linkedItems = menuItems.filter((item) => item.linkedComponents?.length > 0).length;
        const comboCount = menuItems.filter((item) => item.itemType === 'combo').length;
        const comboOptionsCount = menuItems.filter((item) => item.itemType === 'combo').reduce((acc, item) => acc + item.comboGroups.reduce((groupAcc, group) => groupAcc + group.options.length, 0), 0);
        const photoCoverage = totalItems > 0 ? Math.round((menuDashboard.itemsWithPhoto / totalItems) * 100) : 0;
        const visibilityCoverage = totalItems > 0 ? Math.round((menuDashboard.visibleCount / totalItems) * 100) : 0;

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
                const items = menuItems.filter((item) => item.category === category.name);
                const visibleItems = items.filter((item) => item.status !== 'inactive').length;
                const highlightedItems = items.filter((item) => item.status === 'seasonal').length;

                return {
                    id: category.id,
                    name: category.name,
                    itemsCount: items.length,
                    visibleItems,
                    highlightedItems
                };
            })
        };
    }, [menuCategories, menuDashboard.itemsWithPhoto, menuDashboard.visibleCount, menuItems]);

    const payrollSummary = useMemo(() => {
        const today = new Date();
        const year = today.getFullYear();
        const monthIndex = today.getMonth();
        const holidayDates = payrollConfig.holidayDates || [];
        const fixedEmployees = employees.filter((employee) => employee.employmentType === 'fixed' && employee.status !== 'inactive');

        const salaryPaymentDate = getNthBusinessDay(
            year,
            monthIndex,
            payrollConfig.salaryBusinessDayOrdinal,
            holidayDates
        );

        const advancePaymentDate = getNextBusinessDayFromFixedDate(
            year,
            monthIndex,
            payrollConfig.advanceFixedDay,
            holidayDates
        );

        const employeesBreakdown = fixedEmployees.map((employee) => {
            const grossSalary = Number(employee.salary) || 0;
            const extraDiscount = (employee.discounts || []).reduce((acc, discount) => acc + (Number(discount.amount) || 0), 0);
            const advanceAmount = grossSalary * (payrollConfig.advancePercentage / 100);
            const grossSalaryPayment = grossSalary * (payrollConfig.salaryPercentage / 100);
            const netSalary = Math.max(grossSalary - extraDiscount, 0);
            const finalSalaryPayment = Math.max(netSalary - advanceAmount, 0);

            return {
                ...employee,
                discounts: employee.discounts || [],
                grossSalary,
                extraDiscount,
                advanceAmount,
                grossSalaryPayment,
                netSalary,
                finalSalaryPayment
            };
        });

        const totals = employeesBreakdown.reduce((acc, employee) => {
            acc.grossPayroll += employee.grossSalary;
            acc.advanceTotal += employee.advanceAmount;
            acc.salaryPaymentTotal += employee.finalSalaryPayment;
            acc.extraDiscountTotal += employee.extraDiscount;
            acc.netPayroll += employee.netSalary;
            return acc;
        }, {
            grossPayroll: 0,
            advanceTotal: 0,
            salaryPaymentTotal: 0,
            extraDiscountTotal: 0,
            netPayroll: 0
        });

        return {
            salaryPaymentDate,
            advancePaymentDate,
            employeesBreakdown,
            totals
        };
    }, [employees, payrollConfig]);

    const externalWorkersSummary = useMemo(() => {
        const workers = employees
            .filter((employee) => employee.employmentType === 'external')
            .map((employee) => {
                const nextPaymentDate = employee.paymentMode === 'weekly'
                    ? getNextWeekdayDate(employee.weekday)
                    : employee.specificDate
                        ? new Date(`${employee.specificDate}T00:00:00`)
                        : null;

                return {
                    ...employee,
                    nextPaymentDate,
                    baseAmountNumber: Number(employee.baseAmount) || 0
                };
            });

        return workers;
    }, [employees]);

    const payrollAlerts = useMemo(() => {
        const today = new Date();
        const normalize = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const baseToday = normalize(today);

        const items = [
            {
                id: 'salary',
                title: 'Pagamento 60%',
                date: payrollSummary.salaryPaymentDate,
                amount: payrollSummary.totals.salaryPaymentTotal,
                description: `5º dia útil de ${today.toLocaleDateString('pt-BR', { month: 'long' })}`
            },
            {
                id: 'advance',
                title: 'Vale 40%',
                date: payrollSummary.advancePaymentDate,
                amount: payrollSummary.totals.advanceTotal,
                description: `Dia ${payrollConfig.advanceFixedDay} ou próximo dia útil`
            },
            ...externalWorkersSummary
                .filter((worker) => worker.status !== 'inactive' && worker.nextPaymentDate)
                .map((worker) => ({
                    id: `external-${worker.id}`,
                    title: 'Pagamento Por Fora',
                    date: worker.nextPaymentDate,
                    amount: worker.baseAmountNumber,
                    description: `${worker.name} | ${worker.paymentMode === 'weekly' ? 'Semanal' : 'Avulso'}`,
                    targetTab: 'rh',
                    targetRhView: 'external',
                    targetEmployeeId: worker.id
                }))
        ].filter((item) => item.date);

        return items
            .map((item) => {
                const diffMs = normalize(item.date).getTime() - baseToday.getTime();
                return {
                    ...item,
                    daysUntil: Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                };
            })
            .sort((a, b) => a.date - b.date);
    }, [payrollSummary, payrollConfig.advanceFixedDay, externalWorkersSummary]);

    const unifiedAlerts = useMemo(() => {
        const costAlerts = prioritizedAlerts.map((alert) => ({
            id: `cost-${alert.id}`,
            title: 'Vencimento',
            label: `${alert.desc} (DIA ${alert.dueDay})`,
            amount: alert.amount,
            targetTab: 'financeiro',
            targetRhView: null,
            targetEmployeeId: null,
            rawId: alert.id
        }));

        const rhAlerts = payrollAlerts.map((alert) => ({
            id: alert.id,
            title: alert.title,
            label: alert.description,
            amount: alert.amount,
            targetTab: alert.targetTab || 'rh',
            targetRhView: alert.targetRhView || 'fixed',
            targetEmployeeId: alert.targetEmployeeId || null,
            rawId: alert.id
        }));

        return [...costAlerts, ...rhAlerts].sort((a, b) => b.amount - a.amount);
    }, [prioritizedAlerts, payrollAlerts]);

    const primaryAlert = unifiedAlerts[0] || null;
    const additionalAlertsCount = Math.max(unifiedAlerts.length - 1, 0);

    const closingRange = useMemo(() => (
        buildClosingRange(
            closingFilterType,
            closingReferenceDate,
            closingRangeStart,
            closingRangeEnd
        )
    ), [closingFilterType, closingReferenceDate, closingRangeStart, closingRangeEnd]);

    const closingSummary = useMemo(() => {
        const isInsideClosingRange = (date) => {
            const normalized = normalizeDate(date);
            if (!normalized) return false;
            return normalized >= closingRange.start && normalized <= closingRange.end;
        };

        const filteredTransactions = transactions
            .map((transaction) => ({
                ...transaction,
                parsedDate: normalizeDate(parseIsoDate(transaction.date))
            }))
            .filter((transaction) => isInsideClosingRange(transaction.parsedDate));

        const recurringCostEntries = recurringCosts
            .filter((cost) => cost.lastPaidMonth)
            .map((cost) => {
                const [year, month] = String(cost.lastPaidMonth).split('-').map(Number);
                if (!year || !month) return null;
                const safeDay = Math.min(
                    Number(cost.dueDay) || 1,
                    new Date(year, month, 0).getDate()
                );
                const paymentDate = new Date(year, month - 1, safeDay);
                return {
                    id: `fixed-${cost.id}-${cost.lastPaidMonth}`,
                    kind: 'custo_fixo',
                    title: cost.desc,
                    category: 'Custo Fixo',
                    date: normalizeDate(paymentDate),
                    amount: Number(cost.amount) || 0,
                    note: 'Custo fixo marcado como pago'
                };
            })
            .filter((entry) => entry && isInsideClosingRange(entry.date));

        const payrollEntries = payrollAlerts
            .filter((alert) => alert.date && isInsideClosingRange(alert.date))
            .map((alert) => ({
                id: `payroll-${alert.id}`,
                kind: 'folha',
                title: alert.title,
                category: 'Folha / RH',
                date: normalizeDate(alert.date),
                amount: Number(alert.amount) || 0,
                note: alert.description
            }));

        const ledgerEntries = [
            ...filteredTransactions.map((transaction) => ({
                id: `transaction-${transaction.id}`,
                kind: transaction.type,
                title: transaction.type === 'receita' ? 'Entrada' : 'Saída',
                category: transaction.category,
                date: transaction.parsedDate,
                amount: Number(transaction.amount) || 0,
                net: Number(transaction.net) || 0,
                payment: transaction.payment,
                platform: transaction.platform,
                note: transaction.note || ''
            })),
            ...recurringCostEntries,
            ...payrollEntries
        ].sort((a, b) => b.date - a.date);

        const receitaBruta = filteredTransactions
            .filter((transaction) => transaction.type === 'receita')
            .reduce((acc, transaction) => acc + (Number(transaction.amount) || 0), 0);

        const receitaLiquida = filteredTransactions
            .filter((transaction) => transaction.type === 'receita')
            .reduce((acc, transaction) => acc + (Number(transaction.net) || 0), 0);

        const taxasCanais = filteredTransactions
            .filter((transaction) => transaction.type === 'receita')
            .reduce((acc, transaction) => acc + ((Number(transaction.amount) || 0) - (Number(transaction.net) || 0)), 0);

        const saidasLancadas = filteredTransactions
            .filter((transaction) => transaction.type === 'despesa')
            .reduce((acc, transaction) => acc + (Number(transaction.amount) || 0), 0);

        const custosFixos = recurringCostEntries.reduce((acc, entry) => acc + entry.amount, 0);
        const folhaSalarial = payrollEntries.reduce((acc, entry) => acc + entry.amount, 0);
        const saldoPeriodo = receitaLiquida - saidasLancadas - custosFixos - folhaSalarial;

        return {
            ledgerEntries,
            receitasCount: filteredTransactions.filter((transaction) => transaction.type === 'receita').length,
            despesasCount: filteredTransactions.filter((transaction) => transaction.type === 'despesa').length,
            receitaBruta,
            receitaLiquida,
            taxasCanais,
            saidasLancadas,
            custosFixos,
            folhaSalarial,
            saldoPeriodo
        };
    }, [closingRange, payrollAlerts, recurringCosts, transactions]);

    // Analytics
    const stats = useMemo(() => {
        const receitaBruta = transactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + (t.amount || 0), 0);
        const receitaLiquida = transactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + (t.net || 0), 0);
        const saidasLancadas = transactions.filter(t => t.type === 'despesa').reduce((acc, t) => acc + (t.amount || 0), 0);
        const folhaSalarial = payrollSummary.totals.grossPayroll;
        const outrosCustosFixos = recurringCosts.reduce((acc, cost) => acc + cost.amount, 0);
        const custosFixosTotal = folhaSalarial + outrosCustosFixos;
        const taxasCanais = receitaBruta - receitaLiquida;
        const saldoOperacional = receitaLiquida - saidasLancadas;
        const saldoFinal = saldoOperacional - custosFixosTotal;

        const channelRevenueData = salesChannels.map((channel, index) => ({
            name: channel.name,
            value: transactions.filter(t => t.type === 'receita' && t.platform === channel.name).reduce((acc, current) => acc + current.amount, 0),
            color: index % 2 === 0 ? '#D4A373' : '#8A5A2B'
        }));

        const channelOrderData = salesChannels.map((channel, index) => ({
            name: channel.name,
            value: transactions.filter(t => t.type === 'receita' && t.platform === channel.name).length,
            color: index % 2 === 0 ? '#D4A373' : '#8A5A2B'
        }));

        const totalOrders = transactions.filter(t => t.type === 'receita').length;
        const ticketMedio = totalOrders > 0 ? receitaBruta / totalOrders : 0;

        // Faturamento diário do mês atual
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const realDailyRevenue = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTransactions = transactions.filter(t => t.type === 'receita' && t.date === dateStr);
            const dayBruto = dayTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
            const dayLiquido = dayTransactions.reduce((acc, t) => acc + (t.net || 0), 0);
            realDailyRevenue.push({
                day: String(day).padStart(2, '0'),
                bruto: dayBruto,
                liquido: dayLiquido,
                pedidos: dayTransactions.length
            });
        }

        // Últimos pedidos (5 mais recentes)
        const lastOrders = transactions
            .filter(t => t.type === 'receita')
            .slice(0, 8)
            .map((t, i) => ({
                id: `#${String(t.id).slice(-4)}`,
                platform: t.platform,
                payment: t.payment,
                date: t.date,
                amount: t.amount,
                status: i % 3 === 0 ? 'Entregue' : i % 3 === 1 ? 'Preparando' : 'Entregue'
            }));

        return {
            receitaBruta, receitaLiquida, saidasLancadas, custosFixosTotal, folhaSalarial, taxasCanais, saldoOperacional, saldoFinal,
            catalogAverageCmv: catalogMetrics.averageCmvPercent,
            catalogAverageMarkup: catalogMetrics.averageMarkupPercent,
            totalOrders: orders.length || totalOrders,
            ticketMedio,
            dailyRevenue: USE_REVENUE_CHART_MOCK ? MONTHLY_REVENUE_CHART_MOCK : realDailyRevenue,
            lastOrders,
            financialData: [
                ...channelRevenueData,
                { name: 'Total', value: receitaBruta, color: '#6F6258' }
            ],
            orderCountData: [
                ...channelOrderData,
                { name: 'Total', value: totalOrders, color: '#6F6258' }
            ]
        };
    }, [transactions, recurringCosts, catalogMetrics.averageCmvPercent, catalogMetrics.averageMarkupPercent, salesChannels, payrollSummary, orders.length]);

    // Handlers
    const handleCreateCustomer = async (payload) => {
        const customer = await customersApi.saveCustomer(tenantSlug, payload);
        setCustomers((prev) => [
            customer,
            ...prev.filter((current) => current.id !== customer.id)
        ]);
        return customer;
    };

    const handleCreatePaymentMethod = async (payload) => {
        const paymentMethod = await paymentMethodsApi.savePaymentMethod(tenantSlug, payload);
        setPaymentMethods((prev) => [
            ...prev.filter((current) => current.id !== paymentMethod.id),
            paymentMethod
        ]);
        return paymentMethod;
    };

    const handleCreateOrder = async (payload) => {
        const order = await ordersApi.saveOrder(tenantSlug, payload);
        setOrders((prev) => [order, ...prev.filter((current) => current.id !== order.id)]);
        return order;
    };

    const handleUpdateOrder = async (payload) => {
        const order = await ordersApi.saveOrder(tenantSlug, payload);
        setOrders((prev) => prev.map((current) => current.id === order.id ? order : current));
        return order;
    };

    /**
     * Registra lançamentos financeiros avulsos e custos fixos recorrentes a partir da tela unificada.
     */
    const handleAddTransaction = async (e) => {
        try {
            e.preventDefault();
            const fd = new FormData(e.target);
            const type = fd.get('type');
            const amount = parseFloat(fd.get('amount')) || 0;

            if (amount <= 0) return;

            const payload = {
                type,
                date: fd.get('date'),
                payment: fd.get('payment'),
                amount,
                reference: fd.get('reference'),
                dueDay: parseInt(fd.get('dueDay'), 10) || 1,
                note: fd.get('note') || ''
            };

            const response = await financeApi.createTransaction(tenantSlug, payload);

            if (response.type === 'custo_fixo') {
                setRecurringCosts((prev) => [response.recurringCost, ...prev]);
                e.target.reset();
                setFinanceFormType('receita');
                return;
            }

            setTransactions((prev) => [response.transaction, ...prev]);

            e.target.reset();
            setFinanceFormType('receita');
        } catch {
            setSettingsError('Não foi possível registrar o lançamento agora.');
        }
    };

    const createEmptyEmployeeForm = () => ({
        name: '',
        phone: '',
        email: '',
        address: '',
        maritalStatus: '',
        role: '',
        notes: '',
        employmentType: 'fixed',
        status: 'active',
        salary: '',
        admissionDate: '',
        discounts: [],
        paymentMode: 'weekly',
        baseAmount: '',
        weekday: '1',
        specificDate: '',
        startDate: ''
    });

    const openCreateEmployeeModal = (type = 'fixed') => {
        setEditingEmployeeId(null);
        setEmployeeForm({ ...createEmptyEmployeeForm(), employmentType: type });
        setIsEmployeeModalOpen(true);
    };

    const openEditEmployeeModal = (employee) => {
        setEditingEmployeeId(employee.id);
        setEmployeeForm({
            ...createEmptyEmployeeForm(),
            ...employee,
            salary: employee.salary || '',
            baseAmount: employee.baseAmount || ''
        });
        setIsEmployeeModalOpen(true);
    };

    const handleSubmitEmployee = async (e) => {
        e.preventDefault();

        const isFixed = employeeForm.employmentType === 'fixed';
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
            discounts: isFixed ? (editingEmployeeId ? employees.find((item) => item.id === editingEmployeeId)?.discounts || [] : []) : [],
            salary: isFixed ? (parseFloat(employeeForm.salary) || 0) : 0,
            admissionDate: isFixed ? employeeForm.admissionDate : '',
            paymentMode: !isFixed ? employeeForm.paymentMode : '',
            baseAmount: !isFixed ? (parseFloat(employeeForm.baseAmount) || 0) : 0,
            weekday: !isFixed && employeeForm.paymentMode === 'weekly' ? employeeForm.weekday : '',
            specificDate: !isFixed && employeeForm.paymentMode === 'one_off' ? employeeForm.specificDate : '',
            startDate: !isFixed ? employeeForm.startDate : ''
        };

        if (!payload.name || !payload.role) return;
        if (isFixed && payload.salary <= 0) return;
        if (!isFixed && payload.baseAmount <= 0) return;

        try {
            const savedEmployee = await hrApi.saveEmployee(tenantSlug, payload);

            setEmployees((prev) => {
                if (editingEmployeeId) {
                    return prev.map((item) => item.id === editingEmployeeId ? savedEmployee : item);
                }

                return [...prev, savedEmployee];
            });

            setIsEmployeeModalOpen(false);
            setEditingEmployeeId(null);
            setEmployeeForm(createEmptyEmployeeForm());
        } catch {
            setSettingsError('Não foi possível salvar o funcionário agora.');
        }
    };

    const handleUpdateEmployeeDiscountDraft = (employeeId, field, value) => {
        setEmployeeDiscountDrafts((prev) => ({
            ...prev,
            [employeeId]: {
                category: prev[employeeId]?.category || discountCategories[0]?.name || 'Outros',
                amount: prev[employeeId]?.amount || '',
                ...prev[employeeId],
                [field]: value
            }
        }));
    };

    const persistEmployeeDiscounts = async (employeeId, nextDiscounts) => {
        const employee = employees.find((item) => item.id === employeeId);
        if (!employee) return null;

        const savedEmployee = await hrApi.saveEmployee(tenantSlug, {
            ...employee,
            discounts: nextDiscounts
        });

        setEmployees((prev) =>
            prev.map((current) => current.id === employeeId ? savedEmployee : current)
        );

        return savedEmployee;
    };

    const handleAddEmployeeDiscount = async (employeeId) => {
        const draft = employeeDiscountDrafts[employeeId];
        const amount = Math.max(parseFloat(draft?.amount) || 0, 0);
        const category = draft?.category || discountCategories[0]?.name || 'Outros';

        if (amount <= 0) return;

        const employee = employees.find((item) => item.id === employeeId);
        if (!employee) return;

        try {
            await persistEmployeeDiscounts(employeeId, [
                ...(employee.discounts || []),
                { id: Date.now() + Math.random(), category, amount }
            ]);
        } catch {
            setSettingsError('Não foi possível salvar o desconto do funcionário.');
            return;
        }

        setEmployeeDiscountDrafts((prev) => ({
            ...prev,
            [employeeId]: {
                category: discountCategories[0]?.name || 'Outros',
                amount: ''
            }
        }));
    };

    const handleUpdateEmployeeDiscount = async (employeeId, discountId, discountValue) => {
        const employee = employees.find((item) => item.id === employeeId);
        if (!employee) return;

        try {
            await persistEmployeeDiscounts(
                employeeId,
                (employee.discounts || []).map((discount) =>
                    discount.id === discountId
                        ? { ...discount, amount: Math.max(parseFloat(discountValue) || 0, 0) }
                        : discount
                )
            );
        } catch {
            setSettingsError('Não foi possível atualizar o desconto.');
        }
    };

    const handleUpdateEmployeeDiscountCategory = async (employeeId, discountId, category) => {
        const employee = employees.find((item) => item.id === employeeId);
        if (!employee) return;

        try {
            await persistEmployeeDiscounts(
                employeeId,
                (employee.discounts || []).map((discount) =>
                    discount.id === discountId
                        ? { ...discount, category }
                        : discount
                )
            );
        } catch {
            setSettingsError('Não foi possível atualizar a categoria do desconto.');
        }
    };

    const handleRemoveEmployeeDiscount = async (employeeId, discountId) => {
        const employee = employees.find((item) => item.id === employeeId);
        if (!employee) return;

        try {
            await persistEmployeeDiscounts(
                employeeId,
                (employee.discounts || []).filter((discount) => discount.id !== discountId)
            );
        } catch {
            setSettingsError('Não foi possível remover o desconto.');
        }
    };

    const openEmployeeDiscountsModal = (employeeId) => {
        setSelectedEmployeeIdForDiscounts(employeeId);
        setIsEmployeeDiscountsModalOpen(true);
    };

    const selectedEmployeeForDiscounts = useMemo(
        () => employees.find((employee) => employee.id === selectedEmployeeIdForDiscounts) || null,
        [employees, selectedEmployeeIdForDiscounts]
    );

    const resetIngredientForm = () => {
        setEditingIngredientId(null);
        setIngredientForm({
            name: '',
            unit: ingredientUnits[0]?.label || 'G',
            unitCost: ''
        });
    };

    const resetPreparationForm = () => {
        setEditingPreparationId(null);
        setPreparationForm({ name: '', yieldQuantity: '1', yieldUnit: ingredientUnits[0]?.label || 'G' });
        setPreparationRecipeDraft([{ id: Date.now() + 1, componentRef: '', quantity: '', quantityUnit: '' }]);
    };

    useEffect(() => {
        const resolvedUnit = resolveUnitValue(ingredientUnits, ingredientForm.unit);
        if (resolvedUnit && resolvedUnit !== ingredientForm.unit) {
            setIngredientForm((prev) => ({
                ...prev,
                unit: resolvedUnit
            }));
            return;
        }

        if (!resolvedUnit) {
            setIngredientForm((prev) => ({
                ...prev,
                unit: ingredientUnits[0]?.label || ''
            }));
        }
    }, [ingredientUnits, ingredientForm.unit]);

    useEffect(() => {
        const resolvedUnit = resolveUnitValue(ingredientUnits, preparationForm.yieldUnit);
        if (resolvedUnit && resolvedUnit !== preparationForm.yieldUnit) {
            setPreparationForm((prev) => ({
                ...prev,
                yieldUnit: resolvedUnit
            }));
            return;
        }

        if (!resolvedUnit) {
            setPreparationForm((prev) => ({
                ...prev,
                yieldUnit: ingredientUnits[0]?.label || ''
            }));
        }
    }, [ingredientUnits, preparationForm.yieldUnit]);

    useEffect(() => {
        if (activeTab !== 'financeiro' && highlightedCostIds.length > 0) {
            setHighlightedCostIds([]);
        }
    }, [activeTab, highlightedCostIds]);

    useEffect(() => {
        if (activeTab === 'costs') {
            setActiveTab('financeiro');
        }
    }, [activeTab]);

    const handleIngredientFormChange = (field, value) => {
        setIngredientForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmitIngredient = async (e) => {
        e.preventDefault();
        const referenceCost = parseFloat(ingredientForm.unitCost) || 0;
        const referenceFactor = getIngredientCostReferenceFactor(ingredientForm.unit);

        const payload = {
            name: ingredientForm.name.trim(),
            unit: resolveUnitValue(ingredientUnits, ingredientForm.unit) || ingredientForm.unit,
            packageQuantity: referenceFactor,
            packageCost: referenceCost,
            unitCost: referenceFactor > 0 ? referenceCost / referenceFactor : referenceCost
        };

        if (!payload.name || !payload.unit || payload.unitCost <= 0) return;

        try {
            const savedIngredient = await catalogApi.saveIngredient(tenantSlug, {
                id: editingIngredientId || undefined,
                ...payload
            });

            if (editingIngredientId) {
                setIngredients((prev) =>
                    prev.map((ingredient) => ingredient.id === savedIngredient.id ? savedIngredient : ingredient)
                );
            } else {
                setIngredients((prev) => [...prev, savedIngredient]);
            }

            setSettingsError('');
            resetIngredientForm();
        } catch (apiError) {
            setSettingsError(apiError.message || 'Não foi possível salvar o insumo.');
        }
    };

    const handleEditIngredient = (ingredient) => {
        setEditingIngredientId(ingredient.id);
        setIngredientForm({
            name: ingredient.name,
            unit: resolveUnitValue(ingredientUnits, ingredient.unit) || ingredient.unit,
            unitCost: String(getIngredientCostReferenceValue(ingredient))
        });
    };

    const handleDeleteIngredient = async (ingredientId) => {
        try {
            await catalogApi.deleteIngredient(tenantSlug, ingredientId);
            setSettingsError('');
            setIngredients((prev) => prev.filter((item) => item.id !== ingredientId));

            if (editingIngredientId === ingredientId) {
                resetIngredientForm();
            }
        } catch (apiError) {
            setSettingsError(apiError.message || 'Não foi possível remover o insumo.');
        }
    };

    const handleAddRecipeLine = () => {
        setProductRecipeDraft((prev) => [
            ...prev,
            { id: Date.now() + Math.random(), componentRef: '', quantity: '', quantityUnit: '' }
        ]);
    };

    const handleRecipeDraftChange = (id, field, value) => {
        setProductRecipeDraft((prev) =>
            prev.map((line) => {
                if (line.id !== id) return line;

                if (field === 'componentRef') {
                    const baseUnit = getComponentBaseUnit(value, ingredients, preparations);
                    return { ...line, componentRef: value, quantityUnit: getDefaultCompatibleUnit(baseUnit, ingredientUnits) };
                }

                return { ...line, [field]: value };
            })
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
            name: '',
            salePrice: '',
            yieldQuantity: '1',
            targetCmvPercent: '30'
        });
        setProductRecipeDraft([{ id: Date.now(), componentRef: '', quantity: '', quantityUnit: '' }]);
    };

    const buildProductRecipePayload = () => (
        productRecipeDraft
            .filter((line) => line.componentRef && line.quantityUnit && Number(line.quantity) > 0)
            .map((line) => {
                const parsed = parseComponentValue(line.componentRef);
                const baseUnit = getComponentBaseUnit(line.componentRef, ingredients, preparations);
                return {
                    componentType: parsed.componentType,
                    componentId: parsed.componentId,
                    quantity: Number(line.quantity),
                    quantityUnit: resolveCompatibleUnitValue(ingredientUnits, baseUnit, line.quantityUnit) || line.quantityUnit
                };
            })
    );

    const handlePreparationFormChange = (field, value) => {
        setPreparationForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddPreparationRecipeLine = () => {
        setPreparationRecipeDraft((prev) => [
            ...prev,
            { id: Date.now() + Math.random(), componentRef: '', quantity: '', quantityUnit: '' }
        ]);
    };

    const handlePreparationRecipeDraftChange = (id, field, value) => {
        setPreparationRecipeDraft((prev) =>
            prev.map((line) => {
                if (line.id !== id) return line;

                if (field === 'componentRef') {
                    const baseUnit = getComponentBaseUnit(value, ingredients, preparations);
                    return { ...line, componentRef: value, quantityUnit: getDefaultCompatibleUnit(baseUnit, ingredientUnits) };
                }

                return { ...line, [field]: value };
            })
        );
    };

    const handleRemovePreparationRecipeLine = (id) => {
        setPreparationRecipeDraft((prev) => prev.filter((line) => line.id !== id));
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const recipe = buildProductRecipePayload();

        if (recipe.length === 0) return;

        try {
            const savedProduct = await catalogApi.saveProduct(tenantSlug, {
                name: fd.get('name'),
                salePrice: parseFloat(fd.get('salePrice')) || 0,
                yieldQuantity: parseFloat(fd.get('yieldQuantity')) || 1,
                targetCmvPercent: parseFloat(fd.get('targetCmvPercent')) || 30,
                recipe
            });

            setProducts((prev) => [...prev, savedProduct]);
            setSettingsError('');
            setProductRecipeDraft([{ id: Date.now(), componentRef: '', quantity: '', quantityUnit: '' }]);
            e.target.reset();
        } catch (apiError) {
            setSettingsError(apiError.message || 'Não foi possível salvar o produto.');
        }
    };

    const handleEditProduct = (product) => {
        setEditingProductId(product.id);
        setProductForm({
            name: product.name || '',
            salePrice: String(product.salePrice || ''),
            yieldQuantity: String(product.yieldQuantity || 1),
            targetCmvPercent: String(product.targetCmvPercent || 30)
        });
        const recipeDraft = (product.recipe || []).map((line) => {
            const componentRef = `${line.componentType}:${line.componentId}`;
            const baseUnit = getComponentBaseUnit(componentRef, ingredients, preparations);
            return {
                id: Date.now() + Math.random(),
                componentRef,
                quantity: String(line.quantity || ''),
                quantityUnit: resolveCompatibleUnitValue(ingredientUnits, baseUnit, line.quantityUnit) || line.quantityUnit || baseUnit
            };
        });
        setProductRecipeDraft(recipeDraft.length > 0 ? recipeDraft : [{ id: Date.now(), componentRef: '', quantity: '', quantityUnit: '' }]);
        setIsProductModalOpen(true);
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        if (!editingProductId) return;

        const recipe = buildProductRecipePayload();
        if (!productForm.name.trim() || recipe.length === 0) return;

        try {
            const savedProduct = await catalogApi.saveProduct(tenantSlug, {
                id: editingProductId,
                name: productForm.name.trim(),
                salePrice: parseFloat(productForm.salePrice) || 0,
                yieldQuantity: parseFloat(productForm.yieldQuantity) || 1,
                targetCmvPercent: parseFloat(productForm.targetCmvPercent) || 30,
                recipe
            });

            setProducts((prev) => prev.map((product) => (
                idsEqual(product.id, savedProduct.id) ? savedProduct : product
            )));
            setSettingsError('');
            resetProductEditForm();
        } catch (apiError) {
            setSettingsError(apiError.message || 'Não foi possível salvar o produto.');
        }
    };

    const handleDeleteProduct = async (productId) => {
        try {
            await catalogApi.deleteProduct(tenantSlug, productId);
            setSettingsError('');
            setProducts((prev) => prev.filter((item) => item.id !== productId));
            if (idsEqual(editingProductId, productId)) {
                resetProductEditForm();
            }
        } catch (apiError) {
            setSettingsError(apiError.message || 'Não foi possível remover o produto.');
        }
    };

    const resetMenuItemForm = () => {
        setEditingMenuItemId(null);
        setMenuItemForm(createEmptyMenuItemForm(menuCategoryOptions[0] || ''));
        setMenuComponentSearch('');
    };

    const resetComboForm = () => {
        setEditingComboId(null);
        setComboForm(createEmptyComboForm(menuCategoryOptions.find((category) => category === 'Combo') || menuCategoryOptions[0] || 'Combo'));
    };

    const closeMenuItemModal = () => {
        setIsMenuItemModalOpen(false);
        resetMenuItemForm();
    };

    const closeComboModal = () => {
        setIsComboModalOpen(false);
        resetComboForm();
    };

    const handleMenuItemFormChange = (field, value) => {
        setMenuItemForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleMenuItemPhotoChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            setMenuItemForm((prev) => ({ ...prev, photoPreview: '' }));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setMenuItemForm((prev) => ({
                ...prev,
                photoPreview: typeof reader.result === 'string' ? reader.result : ''
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleComboPhotoChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            setComboForm((prev) => ({ ...prev, photoPreview: '' }));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setComboForm((prev) => ({
                ...prev,
                photoPreview: typeof reader.result === 'string' ? reader.result : ''
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
                    salePrice: '',
                    priceEditable: false,
                    linkedComponentIds: []
                };
            }

            return {
                ...prev,
                salePrice: component ? String(component.salePrice || '') : '',
                priceEditable: false,
                linkedComponentIds: component ? [componentKey] : []
            };
        });
    };

    const handleComboFormChange = (field, value) => {
        setComboForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddComboGroup = () => {
        setComboForm((prev) => ({
            ...prev,
            comboGroups: [...prev.comboGroups, createEmptyComboGroup(`Grupo ${prev.comboGroups.length + 1}`)]
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
                    id: createId()
                }))
            };

            return {
                ...prev,
                comboGroups: [...prev.comboGroups, duplicated]
            };
        });
    };

    const handleRemoveComboGroup = (groupId) => {
        setComboForm((prev) => {
            if (prev.comboGroups.length === 1) return prev;
            return {
                ...prev,
                comboGroups: prev.comboGroups.filter((group) => group.id !== groupId)
            };
        });
    };

    const handleComboGroupChange = (groupId, field, value) => {
        setComboForm((prev) => ({
            ...prev,
            comboGroups: prev.comboGroups.map((group) => group.id === groupId ? { ...group, [field]: value } : group)
        }));
    };

    const handleAddComboOption = (groupId) => {
        setComboForm((prev) => ({
            ...prev,
            comboGroups: prev.comboGroups.map((group) => (
                group.id === groupId
                    ? { ...group, options: [...group.options, createEmptyComboOption()] }
                    : group
            ))
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
                    options: group.options.filter((option) => option.id !== optionId)
                };
            })
        }));
    };

    const handleComboOptionChange = (groupId, optionId, field, value) => {
        setComboForm((prev) => ({
            ...prev,
            comboGroups: prev.comboGroups.map((group) => (
                group.id === groupId
                    ? {
                        ...group,
                        options: group.options.map((option) => {
                            if (option.id !== optionId) return option;
                            if (field === 'linkedCategoryNames') {
                                const linkedCategoryNames = Array.isArray(value) ? value : [];
                                const linkedCategoryName = linkedCategoryNames[0] || '';
                                const parsed = parseComponentValue(option.linkedComponentRef);
                                const linkedItem = parsed.componentType === 'menu-item'
                                    ? findById(menuItems, parsed.componentId)
                                    : null;
                                const keepLinkedComponent = linkedItem
                                    && linkedCategoryNames.includes(linkedItem.category);

                                return {
                                    ...option,
                                    linkedCategoryName,
                                    linkedCategoryNames,
                                    linkedComponentRef: keepLinkedComponent ? option.linkedComponentRef : ''
                                };
                            }
                            if (field === 'linkedCategoryName') {
                                const linkedCategoryNames = value ? [value] : [];
                                return {
                                    ...option,
                                    linkedCategoryName: value,
                                    linkedCategoryNames,
                                    linkedComponentRef: ''
                                };
                            }
                            return { ...option, [field]: value };
                        })
                    }
                    : group
            ))
        }));
    };

    const handleSubmitMenuItem = async (e) => {
        e.preventDefault();
        const selectedComponentKey = menuItemForm.linkedComponentIds[0] || '';
        const selectedProductId = parseComponentValue(selectedComponentKey).componentId;
        const selectedProduct = products.find((product) => idsEqual(product.id, selectedProductId));
        const nextSalePrice = parseFloat(menuItemForm.salePrice) || 0;

        const payload = {
            name: menuItemForm.name.trim(),
            category: menuItemForm.category,
            description: menuItemForm.description.trim(),
            status: menuItemForm.status,
            salePrice: nextSalePrice,
            photoPreview: menuItemForm.photoPreview,
            linkedComponents: selectedComponentKey ? [{
                type: 'product',
                id: selectedProductId
            }] : [],
            createdAt: new Date().toISOString()
        };

        if (!payload.name || !payload.description || payload.salePrice <= 0 || !selectedProduct) return;

        try {
            let syncedProduct = null;
            if (menuItemForm.priceEditable && Number(selectedProduct.salePrice || 0) !== nextSalePrice) {
                syncedProduct = await catalogApi.saveProduct(tenantSlug, {
                    id: selectedProduct.id,
                    name: selectedProduct.name,
                    salePrice: nextSalePrice,
                    yieldQuantity: selectedProduct.yieldQuantity || 1,
                    targetCmvPercent: selectedProduct.targetCmvPercent || 30,
                    recipe: selectedProduct.recipe || []
                });
            }

            const savedItem = await menuApi.saveItem(tenantSlug, {
                id: editingMenuItemId || undefined,
                itemType: 'regular',
                ...payload
            });

            if (syncedProduct) {
                setProducts((prev) => prev.map((product) => (
                    idsEqual(product.id, syncedProduct.id) ? syncedProduct : product
                )));
            }

            if (editingMenuItemId) {
                setMenuItems((prev) => prev.map((item) => item.id === savedItem.id ? savedItem : item));
            } else {
                setMenuItems((prev) => [savedItem, ...prev]);
            }

            resetMenuItemForm();
            setIsMenuItemModalOpen(false);
            e.target.reset();
        } catch (apiError) {
            setSettingsError(apiError.message || 'Não foi possível salvar o item do cardápio.');
        }
    };

    const handleEditMenuItem = (item) => {
        const linkedProductRef = (item.linkedComponents || []).find((component) => component.type === 'product');
        const linkedProduct = linkedProductRef
            ? products.find((product) => idsEqual(product.id, linkedProductRef.id))
            : null;

        setEditingMenuItemId(item.id);
        setMenuItemForm({
            name: item.name,
            category: item.category,
            description: item.description,
            status: item.status,
            salePrice: String(linkedProduct?.salePrice ?? item.salePrice ?? ''),
            priceEditable: false,
            photoPreview: item.photoPreview || '',
            linkedComponentIds: linkedProduct ? [`product:${linkedProduct.id}`] : []
        });
        setIsMenuItemModalOpen(true);
    };

    const handleSubmitCombo = async (e) => {
        e.preventDefault();

        const normalizedGroups = comboForm.comboGroups.map((group) => ({
            ...group,
            name: group.name.trim(),
            minSelect: Number(group.minSelect) || 0,
            maxSelect: Number(group.maxSelect) || 0,
            options: group.options.map((option) => {
                const linkedCategoryNames = normalizeComboCategoryNames(option);
                return {
                    ...option,
                    name: option.name.trim(),
                    extraPrice: Number(option.extraPrice) || 0,
                    maxQty: Number(option.maxQty) || 0,
                    isAvailable: Boolean(option.isAvailable),
                    linkedCategoryName: linkedCategoryNames[0] || '',
                    linkedCategoryNames
                };
            })
        }));

        const invalidGroup = normalizedGroups.some((group) => (
            !group.name
            || group.maxSelect < 1
            || group.minSelect > group.maxSelect
            || group.options.length === 0
            || group.options.some((option) => !option.name || option.maxQty < 1 || option.extraPrice < 0)
        ));

        const payload = {
            itemType: 'combo',
            name: comboForm.name.trim(),
            category: comboForm.category,
            description: comboForm.description.trim(),
            status: comboForm.status,
            salePrice: null,
            basePrice: Number(comboForm.basePrice) || 0,
            photoPreview: comboForm.photoPreview,
            linkedComponents: [],
            comboGroups: normalizedGroups,
            createdAt: new Date().toISOString()
        };

        if (!payload.name || !payload.description || payload.basePrice < 0 || invalidGroup) return;

        try {
            const savedCombo = await menuApi.saveItem(tenantSlug, {
                id: editingComboId || undefined,
                ...payload
            });

            if (editingComboId) {
                setMenuItems((prev) => prev.map((item) => item.id === savedCombo.id ? savedCombo : item));
            } else {
                setMenuItems((prev) => [savedCombo, ...prev]);
            }

            closeComboModal();
        } catch (apiError) {
            setSettingsError(apiError.message || 'Não foi possível salvar o combo.');
        }
    };

    const handleEditCombo = (item) => {
        setEditingComboId(item.id);
        setComboForm({
            name: item.name,
            category: item.category,
            description: item.description,
            status: item.status,
            basePrice: String(item.basePrice ?? ''),
            photoPreview: item.photoPreview || '',
            comboGroups: item.comboGroups.map((group) => ({
                ...group,
                minSelect: String(group.minSelect),
                maxSelect: String(group.maxSelect),
                options: group.options.map((option) => ({
                    ...option,
                    extraPrice: String(option.extraPrice ?? 0),
                    maxQty: String(option.maxQty ?? 1),
                    linkedCategoryNames: normalizeComboCategoryNames({
                        ...option,
                        linkedCategoryName: option.linkedCategoryName || (() => {
                            const [componentType, rawId] = String(option.linkedComponentRef || '').split(':');
                            if (componentType !== 'menu-item') return '';

                            const linkedItem = findById(menuItems, rawId);
                            return linkedItem?.category || '';
                        })()
                    }),
                    linkedCategoryName: option.linkedCategoryName || (() => {
                        const [componentType, rawId] = String(option.linkedComponentRef || '').split(':');
                        if (componentType !== 'menu-item') return '';

                        const linkedItem = findById(menuItems, rawId);
                        return linkedItem?.category || '';
                    })()
                }))
            }))
        });
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
            setSettingsError(apiError.message || 'Não foi possível remover o item do cardápio.');
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

        const normalizedName = menuCategoryForm.name.trim();
        if (!normalizedName) return;

        try {
            const savedCategory = await menuApi.saveCategory(tenantSlug, {
                id: editingMenuCategoryId || undefined,
                name: normalizedName
            });

            if (editingMenuCategoryId) {
                const previousCategory = menuCategories.find((category) => category.id === editingMenuCategoryId);
                setMenuCategories((prev) => prev.map((category) => category.id === savedCategory.id ? savedCategory : category));

                if (previousCategory && previousCategory.name !== savedCategory.name) {
                    setMenuItems((prev) => prev.map((item) => item.category === previousCategory.name ? { ...item, category: savedCategory.name } : item));
                    setExpandedMenuCategories((prev) => {
                        const next = { ...prev };
                        delete next[previousCategory.name];
                        next[savedCategory.name] = true;
                        return next;
                    });
                    setMenuItemForm((prev) => prev.category === previousCategory.name ? { ...prev, category: savedCategory.name } : prev);
                    setComboForm((prev) => prev.category === previousCategory.name ? { ...prev, category: savedCategory.name } : prev);
                }
            } else {
                setMenuCategories((prev) => [...prev, savedCategory]);
                setExpandedMenuCategories((prev) => ({ ...prev, [savedCategory.name]: true }));

                if (!menuItemForm.category) {
                    setMenuItemForm((prev) => ({ ...prev, category: savedCategory.name }));
                }
                if (!comboForm.category) {
                    setComboForm((prev) => ({ ...prev, category: savedCategory.name }));
                }
            }

            resetMenuCategoryForm();
            setIsMenuCategoryModalOpen(false);
        } catch (apiError) {
            setSettingsError(apiError.message || 'Não foi possível salvar a categoria.');
        }
    };

    const handleEditMenuCategory = (category) => {
        setEditingMenuCategoryId(category.id);
        setMenuCategoryForm({ name: category.name });
        setIsMenuCategoryModalOpen(true);
    };

    const handleDeleteMenuCategory = async (categoryId) => {
        const category = menuCategories.find((item) => item.id === categoryId);
        if (!category) return;

        try {
            await menuApi.deleteCategory(tenantSlug, categoryId);
            setMenuCategories((prev) => prev.filter((item) => item.id !== categoryId));
            setMenuItems((prev) => prev.map((item) => item.category === category.name ? { ...item, category: '' } : item));
            setExpandedMenuCategories((prev) => {
                const next = { ...prev };
                delete next[category.name];
                return next;
            });

            if (menuItemForm.category === category.name) {
                setMenuItemForm((prev) => ({ ...prev, category: menuCategoryOptions.find((name) => name !== category.name) || '' }));
            }
            if (comboForm.category === category.name) {
                setComboForm((prev) => ({ ...prev, category: menuCategoryOptions.find((name) => name !== category.name) || 'Combo' }));
            }

            if (editingMenuCategoryId === categoryId) {
                resetMenuCategoryForm();
            }
        } catch (apiError) {
            setSettingsError(apiError.message || 'Não foi possível remover a categoria.');
        }
    };

    const toggleMenuCategoryExpansion = (categoryName) => {
        setExpandedMenuCategories((prev) => ({ ...prev, [categoryName]: !prev[categoryName] }));
    };

    const toggleMenuItemExpansion = (itemId) => {
        setExpandedMenuItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const handleAddPreparation = async (e) => {
        e.preventDefault();

        const recipe = preparationRecipeDraft
            .filter((line) => line.componentRef && line.quantityUnit && Number(line.quantity) > 0)
            .map((line) => {
                const parsed = parseComponentValue(line.componentRef);
                const baseUnit = getComponentBaseUnit(line.componentRef, ingredients, preparations);
                return {
                    componentType: parsed.componentType,
                    componentId: parsed.componentId,
                    quantity: Number(line.quantity),
                    quantityUnit: resolveCompatibleUnitValue(ingredientUnits, baseUnit, line.quantityUnit) || line.quantityUnit
                };
            });

        if (!preparationForm.name.trim() || recipe.length === 0) return;

        try {
            const savedPreparation = await catalogApi.savePreparation(tenantSlug, {
                id: editingPreparationId || undefined,
                name: preparationForm.name.trim(),
                yieldQuantity: parseFloat(preparationForm.yieldQuantity) || 1,
                yieldUnit: resolveUnitValue(ingredientUnits, preparationForm.yieldUnit) || ingredientUnits[0]?.label || 'G',
                recipe
            });

            setPreparations((prev) => (
                editingPreparationId
                    ? prev.map((preparation) => (idsEqual(preparation.id, savedPreparation.id) ? savedPreparation : preparation))
                    : [...prev, savedPreparation]
            ));
            setSettingsError('');
            resetPreparationForm();
            setIsPreparationModalOpen(false);
        } catch (apiError) {
            setSettingsError(apiError.message || 'Não foi possível salvar a receita base.');
        }
    };

    const handleEditPreparation = (preparation) => {
        setEditingPreparationId(preparation.id);
        setPreparationForm({
            name: preparation.name,
            yieldQuantity: String(preparation.yieldQuantity || 1),
            yieldUnit: resolveUnitValue(ingredientUnits, preparation.yieldUnit) || ingredientUnits[0]?.label || 'G'
        });
        const recipeDraft = (preparation.recipe || []).map((line) => ({
            id: Date.now() + Math.random(),
            componentRef: `${line.componentType}:${line.componentId}`,
            quantity: String(line.quantity || ''),
            quantityUnit: resolveCompatibleUnitValue(
                ingredientUnits,
                getComponentBaseUnit(`${line.componentType}:${line.componentId}`, ingredients, preparations),
                line.quantityUnit
            ) || getComponentBaseUnit(`${line.componentType}:${line.componentId}`, ingredients, preparations)
        }));
        setPreparationRecipeDraft(recipeDraft.length > 0 ? recipeDraft : [{ id: Date.now() + 1, componentRef: '', quantity: '', quantityUnit: '' }]);
        setIsPreparationManagerModalOpen(false);
        setIsPreparationModalOpen(true);
    };

    const handleDeletePreparation = async (preparationId) => {
        try {
            await catalogApi.deletePreparation(tenantSlug, preparationId);
            setSettingsError('');
            setPreparations((prev) => prev.filter((preparation) => !idsEqual(preparation.id, preparationId)));

            if (idsEqual(editingPreparationId, preparationId)) {
                resetPreparationForm();
                setIsPreparationModalOpen(false);
            }
        } catch (apiError) {
            setSettingsError(apiError.message || 'Não foi possível remover a receita base.');
        }
    };

    const handleUpdateCost = async (id, newAmount) => {
        try {
            const recurringCost = await financeApi.updateRecurringCostAmount(tenantSlug, id, parseFloat(newAmount) || 0);
            setRecurringCosts((prev) => prev.map((cost) => cost.id === id ? recurringCost : cost));
        } catch {
            setSettingsError('Não foi possível atualizar o custo fixo.');
        }
    };

    const togglePaymentStatus = async (id) => {
        const cost = recurringCosts.find((item) => item.id === id);
        if (!cost) return;

        try {
            const recurringCost = await financeApi.toggleRecurringCostPayment(
                tenantSlug,
                id,
                cost.lastPaidMonth === currentMonthYear ? '' : currentMonthYear
            );
            setRecurringCosts((prev) => prev.map((current) => current.id === id ? recurringCost : current));
        } catch {
            setSettingsError('Não foi possível atualizar o status de pagamento.');
        }
    };

    const handlePasswordKeyboardState = (event) => {
        setSettingsCapsLockOn(event.getModifierState('CapsLock'));
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const newPassword = fd.get('appPassword')?.toString() || '';
        const confirmPassword = fd.get('confirmPassword')?.toString() || '';

        setSettingsError('');
        setSettingsSuccess('');

        if (newPassword || confirmPassword) {
            if (newPassword.length < 4) {
                setSettingsError('A nova senha precisa ter pelo menos 4 caracteres.');
                return;
            }

            if (newPassword !== confirmPassword) {
                setSettingsError('A confirmação da senha não confere.');
                return;
            }
        }

        try {
            const nextSettings = await settingsApi.updateGeneral(tenantSlug, {
                ifoodTax: parseFloat(fd.get('ifoodTax')) || 0,
                anotaaiTax: parseFloat(fd.get('anotaaiTax')) || 0,
                appPassword: newPassword || settings.appPassword,
                passwordReminder: fd.get('passwordReminder') || settings.passwordReminder,
                businessName: fd.get('businessName') || settings.businessName,
                alertDaysBefore: parseInt(fd.get('alertDaysBefore')) || 0
            });

            setSettings(nextSettings);
            setSettingsSuccess('Configurações salvas com sucesso.');
            setActiveTab('dashboard');
        } catch (apiError) {
            setSettingsError(apiError.message || 'Não foi possível salvar as configurações.');
        }
    };

    const handleSaveAiBehaviorSettings = async (payload) => {
        setAiBehaviorError('');
        setAiBehaviorSuccess('');

        const normalizedInstructions = payload.additionalInstructions.trim();

        if (normalizedInstructions.length > 150) {
            setAiBehaviorError('As instruções adicionais precisam ficar em até 150 caracteres.');
            return;
        }

        try {
            const nextSettings = await settingsApi.updateAiBehavior(tenantSlug, {
                ...payload,
                additionalInstructions: normalizedInstructions
            });

            setAiBehaviorSettings(normalizeAiBehaviorSettings(nextSettings));
            setAiBehaviorSuccess('Comportamento da IA salvo com sucesso.');
        } catch (apiError) {
            setAiBehaviorError(apiError.message || 'Não foi possível salvar o comportamento da IA.');
        }
    };

    const handleLogout = async () => {
        try {
            if (isMockDataSource()) {
                await signOutMock();
            } else {
                await supabase.auth.signOut();
            }
        } finally {
            setSession(null);
            navigate('/login', { replace: true });
        }
    };

    if (bootstrapLoading) {
        return (
            <div className="min-h-screen bg-[#2A1E15] flex items-center justify-center p-4 md:p-6 font-sans">
                <div className="bg-[#FFFFFF] w-full max-w-[440px] rounded-[2rem] p-8 shadow-2xl border border-gray-100 text-center space-y-4 italic">
                    <Logo className="w-16 h-16 mx-auto" />
                    <p className="text-sm font-black text-[#2A1E15] uppercase tracking-widest">Carregando painel</p>
                    <p className="text-xs font-bold text-[#6F6258]">Aguarde um instante.</p>
                </div>
            </div>
        );
    }

    if (bootstrapError) {
        return (
            <div className="min-h-screen bg-[#2A1E15] flex items-center justify-center p-4 md:p-6 font-sans">
                <div className="bg-[#FFFFFF] w-full max-w-[520px] rounded-[2rem] p-8 shadow-2xl border border-gray-100 text-center space-y-4 italic">
                    <Logo className="w-16 h-16 mx-auto" />
                    <p className="text-sm font-black text-red-700 uppercase tracking-widest">Falha ao carregar o backend</p>
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
                        <h1 className="text-2xl xl:text-3xl font-black text-[#2A1E15] tracking-tight uppercase tracking-tighter">{settings.businessName}</h1>
                        <p className="text-[#6F6258] text-[11px] xl:text-xs font-bold uppercase tracking-widest mt-1">Painel Administrativo</p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm font-bold text-[#6F6258] text-center">
                            Sessão não encontrada. Faça login para acessar o dashboard.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
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
                <LegacyMenuCategoryModal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} categories={costCategories} setCategories={setCostCategories} />
            )}
            {isRoleModalOpen && (
                <EmployeeRoleModal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} roles={employeeRoles} setRoles={setEmployeeRoles} />
            )}
            {isChannelModalOpen && (
                <SimpleOptionsModal isOpen={isChannelModalOpen} onClose={() => setIsChannelModalOpen(false)} title="Canais" options={salesChannels} setOptions={setSalesChannels} />
            )}
            {isFinanceCategoryModalOpen && (
                <SimpleOptionsModal isOpen={isFinanceCategoryModalOpen} onClose={() => setIsFinanceCategoryModalOpen(false)} title="Categorias Financeiras" options={financeExpenseCategories} setOptions={setFinanceExpenseCategories} />
            )}
            {isDiscountCategoryModalOpen && (
                <SimpleOptionsModal isOpen={isDiscountCategoryModalOpen} onClose={() => setIsDiscountCategoryModalOpen(false)} title="Categorias de Desconto" options={discountCategories} setOptions={setDiscountCategories} />
            )}
            {isEmployeeDiscountsModalOpen && (
                <EmployeeDiscountsModal
                    isOpen={isEmployeeDiscountsModalOpen}
                    onClose={() => setIsEmployeeDiscountsModalOpen(false)}
                    employee={selectedEmployeeForDiscounts}
                    discountDraft={selectedEmployeeIdForDiscounts ? employeeDiscountDrafts[selectedEmployeeIdForDiscounts] : null}
                    onDraftChange={(field, value) => selectedEmployeeIdForDiscounts && handleUpdateEmployeeDiscountDraft(selectedEmployeeIdForDiscounts, field, value)}
                    onAddDiscount={() => selectedEmployeeIdForDiscounts && handleAddEmployeeDiscount(selectedEmployeeIdForDiscounts)}
                    onUpdateDiscountCategory={(discountId, category) => selectedEmployeeIdForDiscounts && handleUpdateEmployeeDiscountCategory(selectedEmployeeIdForDiscounts, discountId, category)}
                    onUpdateDiscountValue={(discountId, value) => selectedEmployeeIdForDiscounts && handleUpdateEmployeeDiscount(selectedEmployeeIdForDiscounts, discountId, value)}
                    onRemoveDiscount={(discountId) => selectedEmployeeIdForDiscounts && handleRemoveEmployeeDiscount(selectedEmployeeIdForDiscounts, discountId)}
                    discountCategories={discountCategories}
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
                />
            )}
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
                    onDeleteCategory={handleDeleteMenuCategory}
                    onCancelEdit={resetMenuCategoryForm}
                    CustomInput={CustomInput}
                />
            )}
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
                    onAddComboOption={handleAddComboOption}
                    onRemoveComboOption={handleRemoveComboOption}
                    onComboOptionChange={handleComboOptionChange}
                    formatMoney={formatMoney}
                    CustomInput={CustomInput}
                />
            )}

            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-[45] lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

            <aside className={`fixed lg:sticky top-0 left-0 z-50 w-64 xl:w-72 2xl:w-80 bg-gradient-to-b from-[#2E1C14] via-[#3A2114] to-[#A85A2B] border-r border-white/15 flex flex-col h-screen transition-transform duration-300 shadow-[10px_0_30px_rgba(42,30,21,0.22)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 xl:p-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-2xl bg-white/8 ring-1 ring-[#D4A373]/35 shadow-sm">
                            <Logo className="w-8 h-8 xl:w-10 xl:h-10" />
                        </div>
                        <span className="font-black text-lg xl:text-xl 2xl:text-2xl tracking-tighter text-white uppercase not-italic">REI DAS<span className="text-[#F6B52E] italic ml-1">ESFIHAS</span></span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-white/60"><X size={20} /></button>
                </div>
                <nav className="flex-1 px-3 overflow-y-auto py-2 space-y-1">

                    {/* ── Item simples: Painel Real ── */}
                    <button
                        onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'dashboard'
                            ? 'menu-item-active bg-[#EED9B0] text-[#2A1E15] ring-1 ring-[#D4A373]/35 shadow-lg shadow-black/10 font-black'
                            : 'text-[#EAD8BF] hover:bg-white/10 hover:text-[#FFF7EA] font-bold'
                            }`}
                    >
                        <LayoutDashboard size={16} className="shrink-0" />
                        <span className="text-xs tracking-tight uppercase">Dashboard</span>
                    </button>

                    {/* ── Grupo: Operacional ── */}
                    {[{
                        key: 'operacional',
                        label: 'Operacional',
                        icon: Briefcase,
                        items: [
                            { id: 'menu', label: 'Cardápio Operacional', icon: ChefHat },
                            { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
                            { id: 'reviews', label: 'Gestão de Avaliações', icon: Star },
                            { id: 'cmv', label: 'CMV / Ficha Técnica', icon: Wallet },
                        ]
                    }, {
                        key: 'financeiro',
                        label: 'Financeiro',
                        icon: DollarSign,
                        items: [
                            { id: 'financeiro', label: 'Lançamentos', icon: TrendingUp },
                            { id: 'closing', label: 'Fechamento', icon: PieChart },
                        ]
                    }, {
                        key: 'pessoas',
                        label: 'Pessoas',
                        icon: Users,
                        items: [
                            { id: 'rh', label: 'RH / Pessoal', icon: Users },
                        ]
                    }, {
                        key: 'sistema',
                        label: 'Sistema',
                        icon: Settings,
                        items: [
                            { id: 'settings', label: 'Configurações', icon: Settings },
                            { id: 'ai-behavior', label: 'Comportamento da IA', icon: Bot },
                        ]
                    }].map(group => {
                        const isOpen = openGroups[group.key];
                        const hasActive = group.items.some(i => i.id === activeTab);
                        return (
                            <div key={group.key}>
                                {/* Cabeçalho do grupo */}
                                <button
                                    onClick={() => setOpenGroups(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mt-1 ${hasActive && !isOpen
                                        ? 'text-[#F3E8DA] font-black bg-white/10 border border-[#D4A373]/35 shadow-md'
                                        : 'text-[#EAD8BF] hover:bg-white/10 hover:text-[#FFF7EA] font-bold border border-transparent'
                                        }`}
                                >
                                    <group.icon size={15} className={`shrink-0 ${hasActive && !isOpen ? 'text-[#EED9B0]' : 'text-[#E6CDA8]'}`} />
                                    <span className="text-[11px] tracking-[0.18em] uppercase flex-1 text-left">{group.label}</span>
                                    <svg
                                        className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'
                                            }`}
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Submenus */}
                                <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}>
                                    <div className="ml-3 pl-3 border-l-2 border-[#D4A373]/30 space-y-1 py-2">
                                        {group.items.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${activeTab === item.id
                                                    ? 'menu-item-active bg-[#EED9B0] text-[#2A1E15] font-black shadow-md shadow-black/10 border-l-4 border-[#D4A373]'
                                                    : 'text-[#EAD8BF] hover:bg-white/10 hover:text-[#FFF7EA] font-semibold'
                                                    }`}
                                            >
                                                <item.icon size={14} className={`shrink-0 ${activeTab === item.id ? 'text-[#2A1E15]' : 'text-[#F5E8D3]'}`} />
                                                <span className="text-[11px] tracking-[0.08em] uppercase">{item.label}</span>
                                            </button>
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
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-[#2A1E15] bg-gray-50 rounded-xl"><Menu size={20} /></button>
                        <h2 className="text-base sm:text-xl xl:text-2xl 2xl:text-3xl font-black text-[#2A1E15] uppercase italic tracking-tighter truncate">{activeTab}</h2>
                    </div>
                    <div className="bg-[#FFFFFF] border border-[#D4A373]/20 px-2 py-1 xl:px-3 xl:py-1.5 rounded-lg text-[9px] sm:text-[10px] xl:text-xs font-black text-[#D4A373] uppercase tracking-widest italic">Painel Administrativo</div>
                </header>

                <div className="p-4 sm:p-8 xl:p-10 2xl:p-12 max-w-[1800px] 2xl:max-w-[2000px] mx-auto space-y-6 sm:space-y-8 xl:space-y-10 font-sans w-full">
                    {/* Notificações */}
                    <div className="space-y-2">
                        {primaryAlert && (
                            <div className="flex items-center justify-between gap-3 bg-[#F3E8DA] text-[#2B2520] p-3 rounded-2xl border border-[#D4A373] shadow-md">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab(primaryAlert.targetTab || 'financeiro');
                                        if (primaryAlert.targetTab === 'financeiro') {
                                            setHighlightedCostIds(prioritizedAlerts.map((alert) => alert.id));
                                        } else if (primaryAlert.targetTab === 'rh') {
                                            setRhView(primaryAlert.targetRhView || 'fixed');
                                        }
                                        setSidebarOpen(false);
                                    }}
                                    className="flex items-center gap-3 overflow-hidden text-left flex-1"
                                >
                                    <Bell size={14} className="text-[#D4A373] shrink-0 animate-pulse" />
                                    <p className="text-[9px] sm:text-xs font-bold uppercase tracking-tight truncate">
                                        {primaryAlert.title}: <span className="text-[#D4A373] font-black">{primaryAlert.label}</span>
                                        {additionalAlertsCount > 0 && (
                                            <span className="ml-2 text-white/80">+{additionalAlertsCount}</span>
                                        )}
                                    </p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDismissedAlerts(prev => [...prev, ...prioritizedAlerts.map((alert) => `${alert.id}-${new Date().getMonth()}`)])}
                                    className="p-1 shrink-0"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}
                    </div>

                    {activeTab === 'dashboard' && (
                        <div className="dashboard-page space-y-6 xl:space-y-8">
                            {/* --- STAT CARDS --- */}
                            <div className="dashboard-stats-grid grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 xl:gap-6">
                                <StatCard title="Receita Bruta" value={formatMoney(stats.receitaBruta)} icon={TrendingUp} colorClass="text-green-700" bgColorClass="bg-green-50" iconColorClass="text-green-700" />
                                <StatCard title="Pedidos" value={stats.totalOrders} icon={ShoppingBag} colorClass="text-[#6F6258]" bgColorClass="bg-gray-100" iconColorClass="text-[#6F6258]" />
                                <StatCard title="Ticket Médio" value={formatMoney(stats.ticketMedio)} icon={CreditCard} colorClass="text-amber-700" bgColorClass="bg-amber-50" iconColorClass="text-amber-700" />
                                <StatCard title="CMV Catálogo" value={`${stats.catalogAverageCmv.toFixed(1)}%`} icon={BarChart3} colorClass="text-blue-700" bgColorClass="bg-blue-50" iconColorClass="text-blue-700" />
                                <StatCard title="Markup Médio" value={`${stats.catalogAverageMarkup.toFixed(1)}%`} icon={DollarSign} colorClass="text-purple-700" bgColorClass="bg-purple-50" iconColorClass="text-purple-700" />
                                <StatCard title="Custos Fixos" value={formatMoney(stats.custosFixosTotal)} icon={Receipt} colorClass="text-[#2A1E15]" bgColorClass="bg-[#2A1E15]/10" iconColorClass="text-[#2A1E15]" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 xl:gap-8">
                                <div className="bg-white p-5 sm:p-7 xl:p-8 rounded-[1.5rem] border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-[11px] sm:text-xs xl:text-sm font-black text-[#2A1E15] uppercase italic font-sans tracking-tight">Receita por Canal</h3>
                                        <span className="text-lg sm:text-xl font-black text-[#2A1E15] tracking-tighter">{formatMoney(stats.receitaBruta)}</span>
                                    </div>
                                    <div className="space-y-5">
                                        {stats.financialData.filter((item) => item.name !== 'Total').map((channel, index) => {
                                            const total = stats.receitaBruta || 1;
                                            const pct = ((channel.value / total) * 100).toFixed(1);
                                            const barWidth = Math.max((channel.value / total) * 100, 3);

                                            return (
                                                <div key={`${channel.name}-${index}`}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: channel.color }} />
                                                            <span className="text-xs font-bold text-[#6F6258] uppercase tracking-wider">{channel.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-[#6F6258] bg-gray-100 px-2 py-0.5 rounded-md">{pct}%</span>
                                                            <span className="text-sm font-black text-[#2A1E15]">{formatMoney(channel.value)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                        <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${barWidth}%`, backgroundColor: channel.color }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                    <div className="bg-white p-5 sm:p-7 xl:p-8 rounded-[1.5rem] border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-[11px] sm:text-xs xl:text-sm font-black text-[#2A1E15] uppercase italic font-sans tracking-tight">Resumo Operacional</h3>
                                        <span className="text-lg sm:text-xl font-black text-[#2A1E15] tracking-tighter">{stats.totalOrders} pedidos</span>
                                    </div>
                                    <div className="space-y-4">
                                        {stats.orderCountData.filter((item) => item.name !== 'Total').map((channel, index) => (
                                            <div key={`${channel.name}-${index}`} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#F3E8DA] px-4 py-3">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#6F6258]">{channel.name}</p>
                                                    <p className="text-sm font-black text-[#2A1E15]">{channel.value} pedidos</p>
                                                </div>
                                                <span className="text-[10px] font-black text-[#D4A373] uppercase">
                                                    {(((channel.value || 0) / (stats.totalOrders || 1)) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        ))}
                                        <div className="rounded-2xl border border-dashed border-[#D4A373]/40 bg-[#fffaf0] px-4 py-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#2A1E15]">Visão Geral</p>
                                            <p className="mt-2 text-sm font-bold text-[#6F6258]">
                                                Acompanhe rapidamente o peso de cada canal no faturamento e no volume de pedidos do período.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'menu' && (
                        <div className="space-y-6 xl:space-y-8">
                            <section className="menu-command-center">
                                <div className="menu-command-center__headline">
                                    <div className="space-y-3">
                                        <p className="menu-command-center__eyebrow">Operação do catálogo</p>
                                        <div className="space-y-2">
                                            <h3 className="menu-command-center__title">Cardápio operacional sem cara de planilha perdida</h3>
                                            <p className="menu-command-center__description">
                                                Cadastro, visibilidade, foto e vínculo técnico ficam no mesmo fluxo. A ideia aqui é simples:
                                                você bate o olho e entende onde o catálogo está forte, onde está frouxo e o que ainda trava a publicação.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="menu-command-center__signal">
                                        <span className="menu-command-center__signal-label">Cobertura visual</span>
                                        <strong>{menuOperationalSummary.photoCoverage}%</strong>
                                        <span>{menuDashboard.itemsWithPhoto}/{menuOperationalSummary.totalItems || 0} itens com foto</span>
                                    </div>
                                </div>

                                <div className="menu-command-center__metrics">
                                    <div className="menu-health-card">
                                        <span className="menu-health-card__label">Exposição</span>
                                        <strong className="menu-health-card__value">{menuOperationalSummary.visibilityCoverage}%</strong>
                                        <p className="menu-health-card__text">{menuDashboard.visibleCount} item(ns) exposto(s) no cardápio.</p>
                                    </div>
                                    <div className="menu-health-card">
                                        <span className="menu-health-card__label">Categorias vazias</span>
                                        <strong className="menu-health-card__value">{menuOperationalSummary.emptyCategories}</strong>
                                        <p className="menu-health-card__text">Categoria sem item cadastrado só ocupa espaço e piora navegação.</p>
                                    </div>
                                    <div className="menu-health-card">
                                        <span className="menu-health-card__label">Rascunhos</span>
                                        <strong className="menu-health-card__value">{menuOperationalSummary.draftCount}</strong>
                                        <p className="menu-health-card__text">Itens ainda sem acabamento operacional para entrar em produção.</p>
                                    </div>
                                    <div className="menu-health-card">
                                        <span className="menu-health-card__label">Vínculos técnicos</span>
                                        <strong className="menu-health-card__value">{menuOperationalSummary.linkedItems}</strong>
                                        <p className="menu-health-card__text">Itens com conexão real com produto, base ou complemento.</p>
                                    </div>
                                </div>

                                <div className="menu-command-center__footer">
                                    <div className="menu-command-pill">
                                        <Sparkles size={14} />
                                        <span>{menuDashboard.highlightedCount} destaque(s) da casa</span>
                                    </div>
                                    <div className="menu-command-pill">
                                        <Eye size={14} />
                                        <span>{menuDashboard.activeCount} item(ns) prontos para vender</span>
                                    </div>
                                    <div className="menu-command-pill">
                                        <Link2 size={14} />
                                        <span>{Math.max(menuOperationalSummary.totalItems - menuOperationalSummary.linkedItems, 0)} item(ns) ainda sem vínculo</span>
                                    </div>
                                    <div className="menu-command-pill">
                                        <Camera size={14} />
                                        <span>{Math.max(menuOperationalSummary.totalItems - menuDashboard.itemsWithPhoto, 0)} item(ns) pedindo foto decente</span>
                                    </div>
                                </div>
                            </section>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 xl:gap-8">
                                <StatCard title="Itens do Cardápio" value={menuItems.length} icon={ChefHat} colorClass="text-[#2A1E15]" bgColorClass="bg-[#2A1E15]/10" iconColorClass="text-[#2A1E15]" />
                                <StatCard title="Disponíveis" value={menuDashboard.activeCount} icon={CheckCircle} colorClass="text-green-700" bgColorClass="bg-green-50" iconColorClass="text-green-700" />
                                <StatCard title="Com Foto" value={menuDashboard.itemsWithPhoto} icon={Camera} colorClass="text-blue-700" bgColorClass="bg-blue-50" iconColorClass="text-blue-700" />
                                <StatCard title="Visíveis" value={menuDashboard.visibleCount} icon={Eye} colorClass="text-amber-700" bgColorClass="bg-amber-50" iconColorClass="text-amber-700" />
                            </div>

                            <div className="menu-bottom-zone">
                                <div className="menu-bottom-toolbar">
                                    <div className="menu-bottom-toolbar__intro">
                                        <p className="menu-command-center__eyebrow">Categorias, itens e produção</p>
                                        <h4 className="menu-bottom-toolbar__title">A base operacional fica inteira aqui embaixo</h4>
                                        <p className="menu-bottom-toolbar__description">
                                            Organização e edição viram ação curta. Produção continua tomando a área útil da tela, como deveria desde o começo.
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
                                                setIsComboModalOpen(true);
                                            }}
                                            className="menu-compact-action"
                                        >
                                            <Plus size={14} />
                                            <span>Novo combo</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('menu-production-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                            className="menu-compact-action menu-compact-action--ghost"
                                        >
                                            <Eye size={14} />
                                            <span>Produção</span>
                                        </button>
                                    </div>

                                    <div className="menu-bottom-toolbar__signals">
                                        <span className="menu-inline-signal">{menuCategories.length} categorias</span>
                                        <span className="menu-inline-signal">{menuItems.length} itens</span>
                                        <span className="menu-inline-signal">{menuOperationalSummary.comboCount} combos</span>
                                        <span className="menu-inline-signal">{menuOperationalSummary.emptyCategories} vazias</span>
                                        <span className="menu-inline-signal">{menuDashboard.itemsWithPhoto} com foto</span>
                                    </div>
                                </div>

                                <div className="menu-catalog-panel menu-catalog-panel--full" id="menu-production-panel">
                                    <div className="menu-catalog-panel__header">
                                        <div>
                                            <p className="text-[11px] font-black text-[#D4A373] uppercase tracking-[0.25em]">Leitura operacional</p>
                                            <h3 className="text-lg font-black text-[#2A1E15] uppercase tracking-tighter">Categorias e itens em produção</h3>
                                            <p className="menu-catalog-panel__description">O catálogo precisa mostrar rápido o que está vendável, o que está escondido e o que ainda está frouxo.</p>
                                        </div>
                                        <div className="menu-link-counter">{menuDashboard.highlightedCount} destaque(s)</div>
                                    </div>

                                    <div className="menu-catalog-panel__toolbar">
                                        <div className="relative">
                                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F6258]" />
                                            <input type="text" value={menuSearchTerm} onChange={(e) => setMenuSearchTerm(e.target.value)} placeholder="Buscar categoria ou item do cardápio..." className="w-full pl-10 pr-4 py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#D4A373]" />
                                        </div>

                                        <div className="menu-status-summary">
                                            <div className="menu-status-chip menu-status-chip--available">
                                                <span className="menu-status-chip__value">{menuDashboard.activeCount}</span>
                                                <span>Disponíveis</span>
                                            </div>
                                            <div className="menu-status-chip menu-status-chip--highlight">
                                                <span className="menu-status-chip__value">{menuDashboard.highlightedCount}</span>
                                                <span>Destaques</span>
                                            </div>
                                            <div className="menu-status-chip menu-status-chip--draft">
                                                <span className="menu-status-chip__value">{menuOperationalSummary.draftCount}</span>
                                                <span>Rascunhos</span>
                                            </div>
                                            <div className="menu-status-chip menu-status-chip--inactive">
                                                <span className="menu-status-chip__value">{menuOperationalSummary.inactiveCount}</span>
                                                <span>Ocultos</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="menu-category-strip">
                                        {menuOperationalSummary.categoryHealth.map((category) => (
                                            <div key={category.id} className="menu-category-strip__card">
                                                <p className="menu-category-strip__label">{category.name}</p>
                                                <strong className="menu-category-strip__value">{category.itemsCount}</strong>
                                                <span className="menu-category-strip__meta">{category.visibleItems} visível(eis)</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="menu-accordion-list custom-scrollbar">
                                        {menuItemsByCategory.map((categoryGroup) => {
                                            const categoryExpanded = expandedMenuCategories[categoryGroup.name] ?? false;
                                            const visibleItems = categoryGroup.items.filter((item) => item.status !== 'inactive').length;
                                            const highlightedItems = categoryGroup.items.filter((item) => item.status === 'seasonal').length;

                                            return (
                                                <div key={categoryGroup.id} className="menu-category-accordion">
                                                    <button type="button" onClick={() => toggleMenuCategoryExpansion(categoryGroup.name)} className="menu-category-accordion__trigger">
                                                        <div className="menu-category-accordion__heading">
                                                            <p className="menu-category-accordion__eyebrow">Categoria</p>
                                                            <p className="text-sm font-black text-[#2A1E15] uppercase tracking-tight">{categoryGroup.name}</p>
                                                        </div>
                                                        <div className="menu-category-accordion__meta">
                                                            <span className="menu-category-badge">{categoryGroup.items.length} item(ns)</span>
                                                            <span className="menu-category-badge menu-category-badge--soft">{visibleItems} visível(eis)</span>
                                                            {highlightedItems > 0 && <span className="menu-category-badge menu-category-badge--highlight">{highlightedItems} destaque(s)</span>}
                                                            <svg className={`menu-chevron ${categoryExpanded ? 'menu-chevron--open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </button>

                                                    {categoryExpanded && (
                                                        <div className="menu-category-accordion__content">
                                                            {categoryGroup.items.length > 0 ? categoryGroup.items.map((item) => {
                                                                const statusMeta = getMenuStatusMeta(item.status);
                                                                const itemExpanded = expandedMenuItems[item.id] ?? false;
                                                                const linkedDetails = (item.linkedComponents || []).map((component) => {
                                                                    if (component.type === 'product') {
                                                                        const product = catalogMetrics.productSummaries.find((productItem) => productItem.id === component.id);
                                                                        return product ? {
                                                                            name: product.name,
                                                                            detail: `Preço base ${formatMoney(product.metrics.salePrice)}`,
                                                                            tag: getComponentTagLabel(component.type)
                                                                        } : null;
                                                                    }

                                                                    if (component.type === 'preparation') {
                                                                        const preparation = catalogMetrics.preparationSummaries.find((preparationItem) => preparationItem.id === component.id);
                                                                        return preparation ? {
                                                                            name: preparation.name,
                                                                            detail: `${preparation.yieldQuantity} ${preparation.yieldUnit}`,
                                                                            tag: getComponentTagLabel(component.type)
                                                                        } : null;
                                                                    }

                                                                    if (component.type === 'ingredient') {
                                                                        const ingredient = ingredients.find((ingredientItem) => ingredientItem.id === component.id);
                                                                        return ingredient ? {
                                                                            name: ingredient.name,
                                                                            detail: 'Uso complementar',
                                                                            tag: getComponentTagLabel(component.type)
                                                                        } : null;
                                                                    }

                                                                    return null;
                                                                }).filter(Boolean);
                                                                const comboSummary = item.itemType === 'combo' ? summarizeComboGroups(item.comboGroups) : null;
                                                                const comboGroups = item.itemType === 'combo' ? item.comboGroups : [];
                                                                const itemDescription = String(item.description || '').trim();
                                                                const hasLongDescription = itemDescription.length > MENU_DESCRIPTION_PREVIEW_LIMIT;
                                                                const descriptionId = `menu-item-accordion-description-${item.id}`;

                                                                return (
                                                                    <div key={item.id} className="menu-item-accordion">
                                                                        <button type="button" onClick={() => toggleMenuItemExpansion(item.id)} className="menu-item-accordion__trigger" aria-expanded={itemExpanded}>
                                                                            <div className="menu-item-accordion__summary">
                                                                                <div className="menu-item-accordion__thumb">
                                                                                    {item.photoPreview ? (
                                                                                        <img src={item.photoPreview} alt={item.name} className="menu-item-accordion__image" />
                                                                                    ) : (
                                                                                        <div className="menu-item-accordion__placeholder">
                                                                                            <Eye size={16} />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                    <div className="min-w-0 text-left">
                                                                                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                                                            {item.itemType === 'combo' && <span className="menu-component-tag">Combo</span>}
                                                                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${statusMeta.badgeClass}`}>{statusMeta.label}</span>
                                                                                            {linkedDetails.length > 0 && <span className="menu-component-tag">{linkedDetails.length} vínculo(s)</span>}
                                                                                            {item.itemType === 'combo' && <span className="menu-component-tag">{comboGroups.length} grupo(s)</span>}
                                                                                        </div>
                                                                                        <p className="text-sm font-black text-[#2A1E15] uppercase tracking-tight truncate leading-tight">{item.name}</p>
                                                                                        <p id={descriptionId} className={`menu-item-accordion__description ${itemExpanded ? 'menu-item-accordion__description--expanded' : ''}`}>{itemDescription}</p>
                                                                                        {item.itemType === 'combo' && <p className="menu-item-accordion__support">{comboSummary}</p>}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="menu-item-accordion__aside">
                                                                                    <div className="text-right shrink-0">
                                                                                        <p className="text-[9px] font-black text-[#6F6258] uppercase tracking-widest hidden sm:block">{item.itemType === 'combo' ? 'A partir de' : 'Preço'}</p>
                                                                                        <p className="text-sm font-black text-[#2A1E15] whitespace-nowrap">{formatMoney(item.itemType === 'combo' ? item.basePrice || 0 : item.salePrice || 0)}</p>
                                                                                        <p className="menu-item-accordion__support">
                                                                                            {item.itemType === 'combo'
                                                                                                ? `${comboGroups.reduce((acc, group) => acc + group.options.length, 0)} opção(ões)`
                                                                                                : linkedDetails.length > 0 ? `${linkedDetails.length} vínculo(s)` : 'Sem vínculo'}
                                                                                        </p>
                                                                                    </div>
                                                                                    <svg className={`menu-chevron ${itemExpanded ? 'menu-chevron--open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                                                                </svg>
                                                                            </div>
                                                                        </button>
                                                                        {hasLongDescription ? (
                                                                            <div className="menu-item-accordion__description-action">
                                                                                <button
                                                                                    type="button"
                                                                                    aria-controls={descriptionId}
                                                                                    aria-expanded={itemExpanded}
                                                                                    onClick={() => toggleMenuItemExpansion(item.id)}
                                                                                    className="menu-item-accordion__description-toggle"
                                                                                >
                                                                                    {itemExpanded ? 'Ver menos' : 'Ver mais'}
                                                                                </button>
                                                                            </div>
                                                                        ) : null}

                                                                        {itemExpanded && (
                                                                            <div className="menu-item-accordion__content">
                                                                                <div className="menu-item-accordion__body">
                                                                                    <div className="menu-item-detail-card">
                                                                                        <p className="menu-item-detail-card__label">Descrição</p>
                                                                                        <p className="menu-item-detail-card__text">{item.description}</p>
                                                                                    </div>
                                                                                    <div className="menu-item-detail-card">
                                                                                        <p className="menu-item-detail-card__label">{item.itemType === 'combo' ? 'Preço base' : 'Status'}</p>
                                                                                        <p className="menu-item-detail-card__text">{item.itemType === 'combo' ? formatMoney(item.basePrice || 0) : statusMeta.label}</p>
                                                                                    </div>
                                                                                </div>

                                                                                {item.itemType === 'combo' ? (
                                                                                    <div className="space-y-3">
                                                                                        <div className="flex items-center justify-between gap-3">
                                                                                            <p className="text-[10px] font-black text-[#6F6258] uppercase tracking-widest">Grupos do combo</p>
                                                                                            <span className="text-[10px] font-black text-[#2A1E15] uppercase">{comboGroups.length} grupo(s)</span>
                                                                                        </div>
                                                                                        <div className="combo-preview-grid">
                                                                                            {comboGroups.map((group) => (
                                                                                                <div key={group.id} className="combo-preview-card">
                                                                                                    <div className="flex items-center justify-between gap-3">
                                                                                                        <div>
                                                                                                            <p className="combo-preview-card__eyebrow">Grupo</p>
                                                                                                            <p className="combo-preview-card__title">{group.name}</p>
                                                                                                        </div>
                                                                                                        <span className="menu-component-tag">De {group.minSelect} a {group.maxSelect}</span>
                                                                                                    </div>
                                                                                                    <div className="space-y-2 mt-3">
                                                                                                        {group.options.map((option) => (
                                                                                                            <div key={option.id} className={`combo-preview-option ${option.isAvailable ? '' : 'combo-preview-option--disabled'}`}>
                                                                                                                <div>
                                                                                                                    <p className="combo-preview-option__name">{option.name}</p>
                                                                                                                    <p className="combo-preview-option__meta">
                                                                                                                        {option.extraPrice > 0 ? `+ ${formatMoney(option.extraPrice)}` : 'R$ 0,00'} • Máx. {option.maxQty}
                                                                                                                    </p>
                                                                                                                </div>
                                                                                                                <span className={`combo-preview-option__status ${option.isAvailable ? 'combo-preview-option__status--active' : ''}`}>
                                                                                                                    {option.isAvailable ? 'Ativo' : 'Esgotado'}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="space-y-2">
                                                                                        <div className="flex items-center justify-between gap-3">
                                                                                            <p className="text-[10px] font-black text-[#6F6258] uppercase tracking-widest">Relacionamentos</p>
                                                                                            <span className="text-[10px] font-black text-[#2A1E15] uppercase">{linkedDetails.length} item(ns)</span>
                                                                                        </div>
                                                                                        <div className="menu-related-grid">
                                                                                            {linkedDetails.length > 0 ? linkedDetails.map((detail, index) => (
                                                                                                <div key={`${item.id}-${detail.name}-${index}`} className="menu-related-card">
                                                                                                    <span className="menu-component-tag">{detail.tag}</span>
                                                                                                    <p className="text-sm font-black text-[#2A1E15] uppercase tracking-tight mt-3">{detail.name}</p>
                                                                                                    <p className="text-[11px] text-[#6F6258] font-semibold mt-1">{detail.detail}</p>
                                                                                                </div>
                                                                                            )) : (
                                                                                                <div className="menu-empty-state">
                                                                                                    <Sparkles size={16} className="text-[#D4A373]" />
                                                                                                    <span>Nenhum relacionamento adicional para este item.</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                <div className="flex items-center justify-end gap-2 pt-2">
                                                                                    <button type="button" onClick={() => item.itemType === 'combo' ? handleEditCombo(item) : handleEditMenuItem(item)} className="menu-action-button menu-action-button--edit">
                                                                                        <Edit size={14} /> Editar
                                                                                    </button>
                                                                                    <button type="button" onClick={() => handleDeleteMenuItem(item.id)} className="menu-action-button menu-action-button--delete">
                                                                                        <Trash2 size={14} /> Excluir
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }) : (
                                                                <div className="menu-empty-state">
                                                                    <ChefHat size={18} className="text-[#D4A373]" />
                                                                    <span>Nenhum item nesta categoria.</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

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

                    {activeTab === 'orders' && (
                        <OrderOperationsPage
                            tenantSlug={tenantSlug}
                            menuItems={menuItems}
                            orders={orders}
                            customers={customers}
                            paymentMethods={paymentMethods}
                            deliveryDrivers={deliveryDrivers}
                            autoAcceptOrders={autoAcceptOrders}
                            onCreateCustomer={handleCreateCustomer}
                            onCreateOrder={handleCreateOrder}
                            onUpdateOrder={handleUpdateOrder}
                            onCreatePaymentMethod={handleCreatePaymentMethod}
                            onToggleAutoAcceptOrders={() => setAutoAcceptOrders((current) => !current)}
                        />
                    )}

                    {activeTab === 'reviews' && (
                        <div className="max-w-7xl mx-auto">
                            <ReviewManagementPage />
                        </div>
                    )}

                    {activeTab === 'cmv' && (
                        <div className="space-y-6 xl:space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 xl:gap-8">
                                <StatCard title="Insumos" value={ingredients.length} icon={Receipt} colorClass="text-[#2A1E15]" bgColorClass="bg-[#2A1E15]/10" iconColorClass="text-[#2A1E15]" />
                                <StatCard title="Produtos" value={products.length} icon={ShoppingBag} colorClass="text-blue-700" bgColorClass="bg-blue-50" iconColorClass="text-blue-700" />
                                <StatCard title="CMV Médio" value={`${catalogMetrics.averageCmvPercent.toFixed(1)}%`} icon={PieChart} colorClass="text-green-700" bgColorClass="bg-green-50" iconColorClass="text-green-700" />
                                <StatCard title="Markup Médio" value={`${catalogMetrics.averageMarkupPercent.toFixed(1)}%`} icon={DollarSign} colorClass="text-amber-700" bgColorClass="bg-amber-50" iconColorClass="text-amber-700" />
                            </div>

                            {settingsError && (
                                <p role="alert" className="text-xs text-red-700 font-bold bg-red-50 p-4 rounded-2xl border border-red-100 uppercase tracking-wide">
                                    {settingsError}
                                </p>
                            )}

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
                                <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                                    <h3 className="text-lg font-black text-[#2A1E15] uppercase mb-6 tracking-tighter">Cadastro de Insumos</h3>
                                    <form onSubmit={handleSubmitIngredient} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                                        <CustomInput label="Nome do Insumo" value={ingredientForm.name} onChange={(e) => handleIngredientFormChange('name', e.target.value)} required />
                                        <div className="space-y-1">
                                            <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Unidade</label>
                                            <select
                                                value={resolveUnitValue(ingredientUnits, ingredientForm.unit)}
                                                onChange={(e) => handleIngredientFormChange('unit', e.target.value)}
                                                className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
                                                required
                                            >
                                                {ingredientUnits.map((unit) => (
                                                    <option key={unit.id} value={unit.label}>{formatComboboxLabel(unit.label)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <CustomInput label={`Custo por ${getIngredientCostReferenceUnit(ingredientForm.unit)}`} type="number" step="0.0001" value={ingredientForm.unitCost} onChange={(e) => handleIngredientFormChange('unitCost', e.target.value)} required />
                                        <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3">
                                            <button type="submit" className="flex-1 bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md">
                                                {editingIngredientId ? 'Salvar Insumo' : 'Registrar Insumo'}
                                            </button>
                                            {editingIngredientId && (
                                                <button type="button" onClick={resetIngredientForm} className="flex-1 bg-gray-100 text-[#6F6258] h-11 rounded-xl font-black uppercase text-[10px]">
                                                    Cancelar Edição
                                                </button>
                                            )}
                                        </div>
                                    </form>

                                    <div className="mt-6 max-h-[26rem] overflow-y-auto pr-2 space-y-3">
                                        {ingredients.map((ingredient) => (
                                            <div key={ingredient.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="font-black text-[#2A1E15] uppercase truncate">{ingredient.name}</p>
                                                    <p className="text-xs text-[#6F6258] font-bold uppercase">
                                                        Custo por {getIngredientCostReferenceUnit(ingredient.unit)}: {formatMoney(getIngredientCostReferenceValue(ingredient))}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button type="button" onClick={() => handleEditIngredient(ingredient)} className="p-2 text-blue-500 hover:text-blue-700 transition-colors" title="Editar insumo">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button type="button" onClick={() => handleDeleteIngredient(ingredient.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors" title="Excluir insumo">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                                        <h3 className="text-lg font-black text-[#2A1E15] uppercase tracking-tighter">Ficha Técnica do Produto</h3>
                                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                            <button type="button" onClick={() => setIsPreparationManagerModalOpen(true)} className="text-[10px] font-black text-[#D4A373] border border-[#D4A373] px-3 py-2 rounded-full uppercase hover:bg-[#C58F5E] hover:text-[#2B2520] transition-all w-full sm:w-auto">
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
                                            <CustomInput label="Preço de Venda" name="salePrice" type="number" step="0.01" required />
                                            <CustomInput label="Rendimento" name="yieldQuantity" type="number" step="0.01" defaultValue="1" required />
                                            <CustomInput label="CMV Alvo (%)" name="targetCmvPercent" type="number" step="0.1" defaultValue="30" required />
                                        </div>

                                        <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-black text-[#2A1E15] uppercase">Receita / Componentes</p>
                                                <button type="button" onClick={handleAddRecipeLine} className="text-[10px] font-black text-[#D4A373] border border-[#D4A373] px-3 py-2 rounded-full uppercase hover:bg-[#C58F5E] hover:text-[#2B2520] transition-all">
                                                    Adicionar Componente
                                                </button>
                                            </div>

                                            {productRecipeDraft.map((line) => {
                                                const baseUnit = getComponentBaseUnit(line.componentRef, ingredients, preparations);
                                                const compatibleUnits = getCompatibleUnits(baseUnit, ingredientUnits);

                                                return (
                                                    <div key={line.id} className="grid grid-cols-1 sm:grid-cols-[1fr_130px_110px_48px] gap-3 items-end">
                                                        <div className="space-y-1">
                                                            <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Componente</label>
                                                            <select
                                                                value={line.componentRef}
                                                                onChange={(e) => handleRecipeDraftChange(line.id, 'componentRef', e.target.value)}
                                                                className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
                                                            >
                                                                <option value="">Selecione</option>
                                                                <optgroup label="Insumos">
                                                                    {ingredients.map((ingredient) => (
                                                                        <option key={`product-ingredient-${ingredient.id}`} value={`ingredient:${ingredient.id}`}>
                                                                            {formatComboboxLabel(ingredient.name)}
                                                                        </option>
                                                                    ))}
                                                                </optgroup>
                                                                <optgroup label="Receitas Base">
                                                                    {preparations.map((preparation) => (
                                                                        <option key={`product-preparation-${preparation.id}`} value={`preparation:${preparation.id}`}>
                                                                            {formatComboboxLabel(preparation.name)}
                                                                        </option>
                                                                    ))}
                                                                </optgroup>
                                                            </select>
                                                        </div>

                                                        <CustomInput
                                                            label="Quantidade"
                                                            type="number"
                                                            step="0.01"
                                                            value={line.quantity}
                                                            onChange={(e) => handleRecipeDraftChange(line.id, 'quantity', e.target.value)}
                                                            required
                                                        />

                                                        <div className="space-y-1">
                                                            <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Unidade</label>
                                                            <select
                                                                value={resolveCompatibleUnitValue(ingredientUnits, baseUnit, line.quantityUnit)}
                                                                onChange={(e) => handleRecipeDraftChange(line.id, 'quantityUnit', e.target.value)}
                                                                className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#D4A373]"
                                                                disabled={!line.componentRef}
                                                            >
                                                                <option value="">Selecione</option>
                                                                {compatibleUnits.map((unit) => (
                                                                    <option key={`product-line-unit-${line.id}-${unit.id}`} value={unit.label}>{formatComboboxLabel(unit.label)}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveRecipeLine(line.id)}
                                                            disabled={productRecipeDraft.length === 1}
                                                            className={`h-11 rounded-xl transition-colors ${productRecipeDraft.length === 1 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                                                        >
                                                            <Trash2 size={16} className="mx-auto" />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <button type="submit" className="w-full bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-md">
                                            Cadastrar Produto
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* ── Campo de busca ── */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 text-[#6F6258]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
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
                                        onClick={() => setProductSearchTerm('')}
                                        className="absolute inset-y-0 right-3 flex items-center px-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* ── Grid de cards de produtos ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-5">
                                {catalogMetrics.productSummaries
                                    .filter((p) => p.name.toLowerCase().includes(productSearchTerm.toLowerCase().trim()))
                                    .map((product) => {
                                        const cmvOk = product.metrics.cmvPercent <= product.metrics.targetCmvPercent;
                                        return (
                                            <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">

                                                {/* ── Header: Nome do produto ── */}
                                                <div className="bg-[#2A1E15] px-4 py-3 rounded-t-2xl">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-tight leading-tight">{product.name}</h3>
                                                    <p className="text-[10px] text-[#D4A373] font-semibold mt-0.5">
                                                        Venda: {formatMoney(product.metrics.salePrice)}
                                                    </p>
                                                </div>

                                                {/* ── Métricas em grid de badges ── */}
                                                <div className="px-4 pt-4 pb-3">
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        <div className="flex flex-col items-center px-2 py-1.5 bg-[#2A1E15]/5 rounded-lg">
                                                            <span className="text-[8px] font-bold text-[#6F6258] uppercase tracking-wider leading-tight">Custo Receita</span>
                                                            <span className="text-xs font-black text-[#2A1E15]">{formatMoney(product.metrics.recipeCost)}</span>
                                                        </div>
                                                        <div className="flex flex-col items-center px-2 py-1.5 bg-amber-50 rounded-lg">
                                                            <span className="text-[8px] font-bold text-[#6F6258] uppercase tracking-wider leading-tight">Markup</span>
                                                            <span className="text-xs font-black text-amber-700">{product.metrics.markupPercent.toFixed(1)}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                                                        <div className={`flex flex-col items-center px-2 py-1.5 rounded-lg ${cmvOk ? 'bg-green-50' : 'bg-red-50'}`}>
                                                            <span className="text-[8px] font-bold text-[#6F6258] uppercase tracking-wider leading-tight">CMV Atual</span>
                                                            <span className={`text-xs font-black ${cmvOk ? 'text-green-700' : 'text-red-600'}`}>{product.metrics.cmvPercent.toFixed(1)}%</span>
                                                        </div>
                                                        <div className="flex flex-col items-center px-2 py-1.5 bg-amber-50/60 rounded-lg border border-amber-100">
                                                            <span className="text-[8px] font-bold text-[#6F6258] uppercase tracking-wider leading-tight">Preço Sug.</span>
                                                            <span className="text-xs font-black text-amber-600">{formatMoney(product.metrics.suggestedPrice)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ── Componentes em lista full-width ── */}
                                                {product.recipe.length > 0 && (
                                                    <div className="border-t border-gray-100 px-4 py-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                                                        {product.recipe.map((item, index) => {
                                                            const ingredient = item.componentType === 'ingredient'
                                                                ? findById(ingredients, item.componentId)
                                                                : null;
                                                            const preparation = item.componentType === 'preparation'
                                                                ? findById(preparations, item.componentId)
                                                                : null;
                                                            const componentName = ingredient?.name || preparation?.name || 'Componente removido';
                                                            const componentUnit = item.quantityUnit || ingredient?.unit || preparation?.yieldUnit || '';
                                                            const componentUnitCost = item.componentType === 'ingredient'
                                                                ? calculateIngredientUnitCost(ingredient)
                                                                : (catalogMetrics.preparationSummaries.find((c) => idsEqual(c.id, item.componentId))?.metrics.unitCost || 0);
                                                            const sourceUnit = ingredient?.unit || preparation?.yieldUnit || componentUnit;
                                                            const { lineCost } = calculateComponentLineCost({
                                                                quantity: item.quantity,
                                                                quantityUnit: componentUnit,
                                                                componentSourceUnit: sourceUnit,
                                                                componentUnitCost
                                                            });

                                                            return (
                                                                <div key={`${product.id}-${index}`} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-b-0">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <span className="text-sm shrink-0">🧂</span>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[10px] font-black text-[#2A1E15] uppercase leading-tight truncate">{componentName}</p>
                                                                            <p className="text-[9px] text-[#6F6258] font-semibold">{item.quantity} {componentUnit}</p>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-gray-600 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 shrink-0">{formatMoney(lineCost)}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* ── Footer com indicadores ── */}
                                                <div className="border-t border-gray-100 px-4 py-2.5 mt-auto">
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-bold">
                                                        <span className="text-[#2A1E15]">
                                                            Lucro bruto: <strong className="font-black">{formatMoney(product.metrics.grossMargin)}</strong>
                                                        </span>
                                                        <span className="text-[#6F6258]">
                                                            CMV alvo: <strong className="font-black">{product.metrics.targetCmvPercent.toFixed(1)}%</strong>
                                                        </span>
                                                        <span className="text-blue-600">
                                                            Margem s/ venda: <strong className="font-black">{product.metrics.marginPercent.toFixed(1)}%</strong>
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
                                {catalogMetrics.productSummaries.filter((p) => p.name.toLowerCase().includes(productSearchTerm.toLowerCase().trim())).length === 0 && (
                                    <p className="text-center text-sm font-bold text-[#6F6258] py-8 uppercase tracking-widest col-span-full">
                                        Nenhum produto encontrado para &ldquo;{productSearchTerm}&rdquo;
                                    </p>
                                )}
                            </div>

                        </div>
                    )}



                    {activeTab === 'costs' && null}

                    {activeTab === 'financeiro' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 sm:p-10 rounded-[2rem] border border-gray-100 shadow-sm italic">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-8">
                                    <h3 className="text-lg font-black text-[#2A1E15] uppercase tracking-tighter">Central Financeira</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsCatModalOpen(true)}
                                            className="text-[9px] font-black text-[#D4A373] border border-[#D4A373] px-3 py-1.5 rounded-full uppercase hover:bg-[#C58F5E] hover:text-[#2B2520] transition-all"
                                        >
                                            Categorias de Custos Fixos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsFinanceCategoryModalOpen(true)}
                                            className="text-[9px] font-black text-[#2A1E15] border border-[#2A1E15]/20 px-3 py-1.5 rounded-full uppercase hover:bg-[#2A1E15]/5 transition-all"
                                        >
                                            Categorias Financeiras
                                        </button>
                                    </div>
                                </div>
                                <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-end italic">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-[#6F6258] uppercase ml-1 not-italic tracking-widest">Tipo</label>
                                        <select name="type" value={financeFormType} onChange={(e) => setFinanceFormType(e.target.value)} className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-bold text-sm xl:text-base outline-none not-italic focus:ring-2 focus:ring-[#D4A373]">
                                            <option value="receita">Entrada</option>
                                            <option value="despesa">Saída</option>
                                            <option value="custo_fixo">Custo Fixo</option>
                                        </select>
                                    </div>
                                    <CustomInput
                                        label={financeFormType === 'receita' ? 'Valor de Entrada' : financeFormType === 'despesa' ? 'Valor de Saída' : 'Valor do Custo Fixo'}
                                        name="amount"
                                        type="number"
                                        step="0.01"
                                        required
                                    />
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-[#6F6258] uppercase ml-1 not-italic tracking-widest">
                                            {financeFormType === 'receita' ? 'Canal' : financeFormType === 'despesa' ? 'Categoria' : 'Descrição'}
                                        </label>
                                        <select name="reference" className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-bold text-sm xl:text-base outline-none not-italic focus:ring-2 focus:ring-[#D4A373]">
                                            {(financeFormType === 'receita' ? salesChannels : financeFormType === 'despesa' ? financeExpenseCategories : costCategories).map((item) => (
                                                <option key={item.id} value={item.name}>{item.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {financeFormType === 'custo_fixo' ? (
                                        <CustomInput label="Dia de Vencimento" name="dueDay" type="number" min="1" max="31" required />
                                    ) : (
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-[#6F6258] uppercase ml-1 not-italic tracking-widest">Pagamento</label>
                                            <select name="payment" className="w-full px-3 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl font-bold text-sm xl:text-base outline-none not-italic focus:ring-2 focus:ring-[#D4A373]">
                                                <option value="pix">PIX</option>
                                                <option value="cartao">Cartão</option>
                                                <option value="online">Online</option>
                                                <option value="dinheiro">Dinheiro</option>
                                            </select>
                                        </div>
                                    )}
                                    <CustomInput
                                        label={financeFormType === 'custo_fixo' ? 'Competência Inicial' : 'Data'}
                                        name="date"
                                        type="date"
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                    />
                                    <CustomInput label="Observação" name="note" />
                                    <button type="submit" className="bg-[#2A1E15] text-[#FFFFFF] h-11 rounded-xl font-black uppercase text-[10px] shadow-lg">
                                        {financeFormType === 'custo_fixo' ? 'Registrar Custo Fixo' : 'Lançar'}
                                    </button>
                                </form>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <StatCard title="Entradas" value={formatMoney(stats.receitaLiquida)} icon={TrendingUp} colorClass="text-green-700" bgColorClass="bg-green-50" iconColorClass="text-green-700" />
                                <StatCard title="Saídas" value={formatMoney(stats.saidasLancadas)} icon={Receipt} colorClass="text-red-600" bgColorClass="bg-red-50" iconColorClass="text-red-600" />
                                <StatCard title="Custos Fixos" value={formatMoney(stats.custosFixosTotal - stats.folhaSalarial)} icon={Calendar} colorClass="text-[#2A1E15]" bgColorClass="bg-[#2A1E15]/10" iconColorClass="text-[#2A1E15]" />
                                <StatCard title="Taxas Canais" value={formatMoney(stats.taxasCanais)} icon={CreditCard} colorClass="text-amber-700" bgColorClass="bg-amber-50" iconColorClass="text-amber-700" />
                                <StatCard title="Saldo Operac." value={formatMoney(stats.saldoOperacional)} icon={Wallet} colorClass="text-blue-700" bgColorClass="bg-blue-50" iconColorClass="text-blue-700" />
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <h4 className="text-sm font-black text-[#2A1E15] uppercase tracking-widest">Custos Fixos</h4>
                                    <span className="text-[10px] font-black text-[#6F6258] uppercase">{sortedRecurringCosts.length} itens</span>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between opacity-70 italic">
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Folha Salarial Real (Automático RH)</p>
                                            <p className="text-xs font-black text-[#2A1E15]">R$ {stats.folhaSalarial.toLocaleString()}</p>
                                        </div>
                                        <CheckCircle className="text-green-500" size={24} />
                                    </div>
                                    {sortedRecurringCosts.map(c => {
                                        const isPaid = c.lastPaidMonth === currentMonthYear;
                                        const isHighlighted = highlightedCostIds.includes(c.id);
                                        return (
                                            <div key={c.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 italic ${isPaid ? 'bg-green-50/10 border-green-100 opacity-60' : isHighlighted ? 'bg-amber-50 border-amber-200 shadow-md' : 'bg-white border-gray-100 shadow-sm'}`}>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 rounded-lg text-[8px] uppercase font-black ${!isPaid && new Date().getDate() === c.dueDay ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-[#D4A373]/10 text-[#D4A373]'}`}>Dia {c.dueDay}</span>
                                                        {isHighlighted && <span className="px-2 py-0.5 rounded-lg text-[8px] uppercase font-black bg-amber-200 text-amber-800">Vencimento próximo</span>}
                                                        <p className={`text-xs font-black uppercase truncate ${isPaid ? 'line-through text-gray-400' : 'text-[#2A1E15]'}`}>{c.desc}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <p className={`text-xs font-black ${isPaid ? 'line-through text-gray-400' : 'text-gray-900'}`}>R$ {c.amount.toFixed(2)}</p>
                                                        <div className="flex items-center gap-1.5 ml-2">
                                                            <input type="number" id={`inp-${c.id}`} className="max-w-[70px] bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-[10px] font-bold outline-none not-italic" defaultValue={c.amount} disabled={isPaid} />
                                                            {!isPaid && <button type="button" onClick={() => handleUpdateCost(c.id, document.getElementById(`inp-${c.id}`).value)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"><Save size={14} /></button>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button type="button" onClick={() => setRecurringCosts(prev => prev.filter(x => x.id !== c.id))} className="text-red-200 hover:text-red-500 p-1 transition-colors"><Trash2 size={16} /></button>
                                                    <button type="button" onClick={() => togglePaymentStatus(c.id)} className={`transition-all ${isPaid ? 'text-green-600 scale-110' : 'text-gray-300 hover:text-[#2A1E15]'}`}>
                                                        {isPaid ? <CheckCircle size={28} fill="rgba(34, 197, 94, 0.1)" /> : <Circle size={28} />}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <h4 className="text-sm font-black text-[#2A1E15] uppercase tracking-widest">Lançamentos Financeiros</h4>
                                    <span className="text-[10px] font-black text-[#6F6258] uppercase">{transactions.length} registros</span>
                                </div>
                                <div className="space-y-2">
                                    {transactions.map(t => (
                                        <div key={t.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between italic">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1 h-8 rounded-full ${t.type === 'receita' ? (t.platform === 'ifood' ? 'bg-[#2A1E15]' : 'bg-[#D4A373]') : 'bg-red-500'}`} />
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black text-[#2A1E15] uppercase truncate font-sans">
                                                        {t.type === 'receita' ? 'Entrada' : 'Saída'} - {t.category}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-gray-400 font-mono uppercase">
                                                        {formatDateBr(new Date(`${t.date}T00:00:00`))} | {t.type === 'receita' ? `${t.platform} | ${t.payment}` : `${t.payment} | ${t.category}`}
                                                    </p>
                                                    {t.note && <p className="text-[9px] font-bold text-gray-400 truncate uppercase">{t.note}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className={`text-xs font-black tracking-tighter ${t.type === 'receita' ? 'text-green-700' : 'text-red-600'}`}>
                                                    {t.type === 'receita' ? '+' : '-'} {formatMoney(t.amount)}
                                                </p>
                                                <button type="button" onClick={() => setTransactions(prev => prev.filter(x => x.id !== t.id))} className="text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'rh' && (
                        <div className="space-y-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRhView('fixed')}
                                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${rhView === 'fixed' ? 'bg-[#2A1E15] text-[#FFFFFF]' : 'bg-stone-100 text-[#2A1E15]'}`}
                                    >
                                        Funcionários Fixos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRhView('external')}
                                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${rhView === 'external' ? 'bg-[#2A1E15] text-[#FFFFFF]' : 'bg-stone-100 text-[#2A1E15]'}`}
                                    >
                                        Funcionários Por Fora
                                    </button>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                                    {rhView === 'fixed' && (
                                        <button onClick={() => setIsRoleModalOpen(true)} className="text-[10px] font-black text-[#D4A373] border border-[#D4A373] px-3 py-2 rounded-full uppercase hover:bg-[#C58F5E] hover:text-[#2B2520] transition-all w-full sm:w-auto">
                                            Cargos RH
                                        </button>
                                    )}
                                    {rhView === 'fixed' && (
                                        <button onClick={() => setIsDiscountCategoryModalOpen(true)} className="text-[10px] font-black text-[#2A1E15] border border-[#2A1E15]/20 px-3 py-2 rounded-full uppercase hover:bg-[#2A1E15]/5 transition-all w-full sm:w-auto">
                                            Configurar Descontos
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => openCreateEmployeeModal(rhView === 'fixed' ? 'fixed' : 'external')}
                                        className="text-[10px] font-black bg-[#2A1E15] text-[#FFFFFF] px-4 py-2 rounded-full uppercase shadow-md hover:bg-[#C58F5E] hover:text-[#2B2520] transition-all w-full sm:w-auto"
                                    >
                                        Cadastrar Funcionário
                                    </button>
                                </div>
                            </div>

                            {rhView === 'fixed' && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <StatCard title="Folha Bruta" value={formatMoney(payrollSummary.totals.grossPayroll)} icon={Users} colorClass="text-[#2A1E15]" bgColorClass="bg-stone-100" iconColorClass="text-[#2A1E15]" />
                                        <StatCard title="Pagamento 60%" value={formatMoney(payrollSummary.totals.salaryPaymentTotal)} icon={DollarSign} colorClass="text-[#2A1E15]" bgColorClass="bg-stone-100" iconColorClass="text-[#2A1E15]" />
                                        <StatCard title="Vale 40%" value={formatMoney(payrollSummary.totals.advanceTotal)} icon={Wallet} colorClass="text-[#2A1E15]" bgColorClass="bg-stone-100" iconColorClass="text-[#2A1E15]" />
                                        <StatCard title="Descontos" value={formatMoney(payrollSummary.totals.extraDiscountTotal)} icon={Receipt} colorClass="text-[#2A1E15]" bgColorClass="bg-stone-100" iconColorClass="text-[#2A1E15]" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {payrollAlerts.filter((alert) => !String(alert.id).startsWith('external-')).map((alert) => (
                                            <div key={alert.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black text-[#6F6258] uppercase tracking-widest">{alert.title}</p>
                                                    <p className="text-sm font-black text-[#2A1E15] uppercase truncate">{formatDateBr(alert.date)}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{alert.description}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-lg font-black text-[#2A1E15]">{formatMoney(alert.amount)}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{alert.daysUntil === 0 ? 'Hoje' : alert.daysUntil > 0 ? `Em ${alert.daysUntil} dia(s)` : 'Vencido'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm italic">
                                        <h3 className="text-lg font-black text-[#2A1E15] uppercase flex items-center gap-2 mb-6 tracking-tighter"><Briefcase size={20} /> Regras de Pagamento RH</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                            <CustomInput label="Salário (%)" type="number" step="0.1" value={payrollConfig.salaryPercentage} onChange={(e) => setPayrollConfig((prev) => ({ ...prev, salaryPercentage: parseFloat(e.target.value) || 0 }))} />
                                            <CustomInput label="Dia Útil do Salário" type="number" step="1" value={payrollConfig.salaryBusinessDayOrdinal} onChange={(e) => setPayrollConfig((prev) => ({ ...prev, salaryBusinessDayOrdinal: parseInt(e.target.value) || 1 }))} />
                                            <CustomInput label="Vale (%)" type="number" step="0.1" value={payrollConfig.advancePercentage} onChange={(e) => setPayrollConfig((prev) => ({ ...prev, advancePercentage: parseFloat(e.target.value) || 0 }))} />
                                            <CustomInput label="Dia do Vale" type="number" step="1" value={payrollConfig.advanceFixedDay} onChange={(e) => setPayrollConfig((prev) => ({ ...prev, advanceFixedDay: parseInt(e.target.value) || 20 }))} />
                                        </div>
                                        <p className="mt-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider not-italic">
                                            Dia útil está sendo calculado localmente por fim de semana. Para feriado nacional automático, depois eu posso plugar BrasilAPI. Estadual e municipal eu prefiro lista manual.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        {payrollSummary.employeesBreakdown.map(emp => (
                                            <div key={emp.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm italic">
                                                <div className="grid grid-cols-1 xl:grid-cols-[minmax(320px,1.2fr)_minmax(0,2fr)] gap-4 items-start">
                                                    <div className="min-w-0 pr-0 xl:pr-4">
                                                        <p className="font-black text-[#2A1E15] uppercase text-base italic break-words leading-tight whitespace-normal">{emp.name}</p>
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest break-words mt-2 whitespace-normal">{emp.role}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{emp.phone || 'SEM TELEFONE'} {emp.email ? `| ${emp.email}` : ''}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 min-w-0">
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#6F6258]">Salário</p><p className="text-sm font-black text-[#2A1E15]">{formatMoney(emp.grossSalary)}</p></div>
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#6F6258]">Descontos</p><p className="text-sm font-black text-[#2A1E15]">{formatMoney(emp.extraDiscount)}</p></div>
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#6F6258]">Líquido</p><p className="text-sm font-black text-gray-900">{formatMoney(emp.netSalary)}</p></div>
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#6F6258]">Vale 40%</p><p className="text-sm font-black text-[#2A1E15]">{formatMoney(emp.advanceAmount)}</p></div>
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#6F6258]">Salário 60%</p><p className="text-sm font-black text-[#2A1E15]">{formatMoney(emp.finalSalaryPayment)}</p></div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-3 items-center justify-between">
                                                    <div className="flex flex-wrap gap-3">
                                                        <span className="px-3 py-2 rounded-full bg-green-50 text-green-700 text-xs font-black uppercase">Salário em {formatDateBr(payrollSummary.salaryPaymentDate)}</span>
                                                        <span className="px-3 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase">Vale em {formatDateBr(payrollSummary.advancePaymentDate)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button type="button" onClick={() => openEmployeeDiscountsModal(emp.id)} className="bg-stone-100 text-[#2A1E15] h-10 px-4 rounded-xl font-black uppercase text-[10px]">
                                                            Ver Descontos
                                                        </button>
                                                        <button type="button" onClick={() => openEditEmployeeModal(emp)} className="bg-stone-200 text-[#2A1E15] h-10 px-4 rounded-xl font-black uppercase text-[10px]">Ver/Editar</button>
                                                        <button onClick={() => setEmployees(prev => prev.filter(e => e.id !== emp.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {rhView === 'external' && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <StatCard title="Prestadores Ativos" value={externalWorkersSummary.filter((worker) => worker.status !== 'inactive').length} icon={Users} colorClass="text-[#2A1E15]" bgColorClass="bg-stone-100" iconColorClass="text-[#2A1E15]" />
                                        <StatCard title="Próx. Pagamentos" value={externalWorkersSummary.filter((worker) => worker.nextPaymentDate).length} icon={Calendar} colorClass="text-[#2A1E15]" bgColorClass="bg-stone-100" iconColorClass="text-[#2A1E15]" />
                                        <StatCard title="Total Previsto" value={formatMoney(externalWorkersSummary.reduce((acc, worker) => acc + worker.baseAmountNumber, 0))} icon={Wallet} colorClass="text-[#2A1E15]" bgColorClass="bg-stone-100" iconColorClass="text-[#2A1E15]" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {payrollAlerts.filter((alert) => String(alert.id).startsWith('external-')).map((alert) => (
                                            <div key={alert.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black text-[#6F6258] uppercase tracking-widest">{alert.title}</p>
                                                    <p className="text-sm font-black text-[#2A1E15] uppercase truncate">{formatDateBr(alert.date)}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{alert.description}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-lg font-black text-[#2A1E15]">{formatMoney(alert.amount)}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{alert.daysUntil === 0 ? 'Hoje' : alert.daysUntil > 0 ? `Em ${alert.daysUntil} dia(s)` : 'Vencido'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        {externalWorkersSummary.map((worker) => (
                                            <div key={worker.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                                    <div className="min-w-0 max-w-full">
                                                        <p className="font-black text-[#2A1E15] uppercase text-base break-words leading-tight whitespace-normal">{worker.name}</p>
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest break-words mt-2 whitespace-normal">{worker.role}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{worker.phone || 'SEM TELEFONE'} {worker.email ? `| ${worker.email}` : ''}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 min-w-0 xl:min-w-[620px]">
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#6F6258]">Valor Base</p><p className="text-sm font-black text-[#2A1E15]">{formatMoney(worker.baseAmountNumber)}</p></div>
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#6F6258]">Frequência</p><p className="text-sm font-black text-[#2A1E15] uppercase">{worker.paymentMode === 'weekly' ? 'Semanal' : 'Avulso'}</p></div>
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#6F6258]">Próx. Data</p><p className="text-sm font-black text-[#2A1E15]">{worker.nextPaymentDate ? formatDateBr(worker.nextPaymentDate) : '--'}</p></div>
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#6F6258]">Status</p><p className="text-sm font-black text-[#2A1E15] uppercase">{worker.status === 'active' ? 'Ativo' : 'Inativo'}</p></div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-3 items-center justify-between">
                                                    <div className="flex flex-wrap gap-3">
                                                        <span className="px-3 py-2 rounded-full bg-stone-100 text-[#2A1E15] text-xs font-black uppercase">
                                                            {worker.paymentMode === 'weekly' ? ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][Number(worker.weekday)] || 'Semanal' : 'Pagamento Avulso'}
                                                        </span>
                                                        {worker.notes && <span className="px-3 py-2 rounded-full bg-stone-100 text-[#2A1E15] text-xs font-black uppercase">{worker.notes}</span>}
                                                    </div>
                                                    <div className="flex gap-3 items-center">
                                                        <button type="button" onClick={() => openEditEmployeeModal(worker)} className="text-[#2A1E15] hover:text-[#D4A373]"><Edit size={16} /></button>
                                                        <button onClick={() => setEmployees(prev => prev.filter(e => e.id !== worker.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'closing' && (
                        <div className="max-w-6xl 2xl:max-w-7xl mx-auto italic font-black space-y-6">
                            <div className="bg-white p-6 sm:p-10 rounded-[2rem] border border-gray-100 shadow-sm space-y-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 rotate-12 opacity-5"><Logo className="w-48 h-48" /></div>
                                <div className="relative z-10">
                                    <h3 className="text-2xl sm:text-3xl xl:text-4xl font-black text-[#2A1E15] uppercase tracking-tighter font-sans">Extrato Financeiro</h3>
                                    <p className="text-xs font-bold text-[#6F6258] uppercase tracking-widest mt-2">{closingRange.label}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 relative z-10">
                                    <div className="space-y-1 xl:col-span-2">
                                        <label className="text-[9px] font-black text-[#6F6258] uppercase ml-1 tracking-widest not-italic">Visualização</label>
                                        <select
                                            value={closingFilterType}
                                            onChange={(e) => setClosingFilterType(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-[#FFFFFF] border border-gray-200 rounded-xl font-bold text-sm outline-none not-italic focus:ring-2 focus:ring-[#D4A373]"
                                        >
                                            <option value="dia">Fechamento do Dia</option>
                                            <option value="mes">Fechamento do Mês</option>
                                            <option value="quinzena">Fechamento Quinzenal</option>
                                            <option value="intervalo">Intervalo Personalizado</option>
                                        </select>
                                    </div>

                                    {closingFilterType !== 'intervalo' && (
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-[#6F6258] uppercase ml-1 tracking-widest not-italic">Data de Referência</label>
                                            <input
                                                type="date"
                                                value={closingReferenceDate}
                                                onChange={(e) => setClosingReferenceDate(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-[#FFFFFF] border border-gray-200 rounded-xl font-bold text-sm outline-none not-italic focus:ring-2 focus:ring-[#D4A373]"
                                            />
                                        </div>
                                    )}

                                    {closingFilterType === 'intervalo' && (
                                        <>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-[#6F6258] uppercase ml-1 tracking-widest not-italic">Data Inicial</label>
                                                <input
                                                    type="date"
                                                    value={closingRangeStart}
                                                    onChange={(e) => setClosingRangeStart(e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-[#FFFFFF] border border-gray-200 rounded-xl font-bold text-sm outline-none not-italic focus:ring-2 focus:ring-[#D4A373]"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-[#6F6258] uppercase ml-1 tracking-widest not-italic">Data Final</label>
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
                                <StatCard title="Entradas Líquidas" value={formatMoney(closingSummary.receitaLiquida)} icon={TrendingUp} colorClass="text-green-700" bgColorClass="bg-green-50" iconColorClass="text-green-700" />
                                <StatCard title="Saídas Lançadas" value={formatMoney(closingSummary.saidasLancadas)} icon={Receipt} colorClass="text-red-600" bgColorClass="bg-red-50" iconColorClass="text-red-600" />
                                <StatCard title="Custos + RH" value={formatMoney(closingSummary.custosFixos + closingSummary.folhaSalarial)} icon={Users} colorClass="text-[#2A1E15]" bgColorClass="bg-[#2A1E15]/10" iconColorClass="text-[#2A1E15]" />
                                <StatCard title="Saldo do Período" value={formatMoney(closingSummary.saldoPeriodo)} icon={Wallet} colorClass="text-blue-700" bgColorClass="bg-blue-50" iconColorClass="text-blue-700" />
                            </div>

                            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                                        <p className="text-[10px] font-black uppercase text-[#6F6258]">Entradas Brutas</p>
                                        <p className="text-lg font-black text-green-700">{formatMoney(closingSummary.receitaBruta)}</p>
                                    </div>
                                    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                                        <p className="text-[10px] font-black uppercase text-[#6F6258]">Taxas de Canal</p>
                                        <p className="text-lg font-black text-amber-700">{formatMoney(closingSummary.taxasCanais)}</p>
                                    </div>
                                    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                                        <p className="text-[10px] font-black uppercase text-[#6F6258]">Itens no Extrato</p>
                                        <p className="text-lg font-black text-[#2A1E15]">{closingSummary.ledgerEntries.length}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <h4 className="text-sm font-black text-[#2A1E15] uppercase tracking-widest">Movimentações do Período</h4>
                                    <span className="text-[10px] font-black text-[#6F6258] uppercase">
                                        {closingSummary.receitasCount} entrada(s) • {closingSummary.despesasCount} saída(s)
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {closingSummary.ledgerEntries.length === 0 && (
                                        <div className="rounded-2xl border border-dashed border-gray-200 bg-stone-50 px-4 py-8 text-center">
                                            <p className="text-xs font-black text-[#6F6258] uppercase tracking-widest">Nenhuma movimentação encontrada para o período selecionado.</p>
                                        </div>
                                    )}

                                    {closingSummary.ledgerEntries.map((entry) => {
                                        const isIncome = entry.kind === 'receita';
                                        const isFixedCost = entry.kind === 'custo_fixo';
                                        const isPayroll = entry.kind === 'folha';
                                        return (
                                            <div key={entry.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-1 h-10 rounded-full ${isIncome ? 'bg-green-600' : isFixedCost ? 'bg-[#D4A373]' : isPayroll ? 'bg-[#2A1E15]' : 'bg-red-500'}`} />
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-black text-[#2A1E15] uppercase truncate font-sans">
                                                            {entry.title} • {entry.category}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                            {formatDateBr(entry.date)}
                                                            {entry.payment ? ` | ${entry.payment}` : ''}
                                                            {entry.platform ? ` | ${entry.platform}` : ''}
                                                        </p>
                                                        {entry.note && <p className="text-[10px] font-bold text-gray-500 uppercase truncate mt-1">{entry.note}</p>}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className={`text-sm font-black ${isIncome ? 'text-green-700' : 'text-red-600'}`}>
                                                        {isIncome ? '+' : '-'} {formatMoney(entry.amount)}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase">
                                                        {isFixedCost ? 'Custo fixo' : isPayroll ? 'Despesa RH' : isIncome ? 'Entrada' : 'Saída'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-5xl 2xl:max-w-6xl mx-auto font-black italic">
                            <div className="bg-white p-6 sm:p-10 rounded-[2rem] border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-black text-[#2A1E15] uppercase mb-8 flex items-center gap-3 font-sans"><Settings size={22} /> Configurações</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    <button type="button" onClick={() => setIsChannelModalOpen(true)} className="bg-[#2A1E15]/5 text-[#2A1E15] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#2A1E15]/10">
                                        Cadastrar Canais
                                    </button>
                                    <button type="button" onClick={() => setIsFinanceCategoryModalOpen(true)} className="bg-[#D4A373]/10 text-[#2A1E15] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#D4A373]/20">
                                        Cadastrar Categorias Financeiras
                                    </button>
                                </div>
                                <form onSubmit={handleUpdateSettings} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans italic tracking-tighter">
                                        <CustomInput label="Nome da Esfiharia" name="businessName" defaultValue={settings.businessName} />
                                        <CustomInput label="Aviso Vencimento (Dias)" name="alertDaysBefore" type="number" defaultValue={settings.alertDaysBefore} />
                                        <CustomInput label="Taxa iFood (%)" name="ifoodTax" type="number" step="0.1" defaultValue={settings.ifoodTax} />
                                        <CustomInput label="Taxa Anota AI (%)" name="anotaaiTax" type="number" step="0.1" defaultValue={settings.anotaaiTax} />
                                        <div className="space-y-1">
                                            <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Nova Senha</label>
                                            <input
                                                name="appPassword"
                                                type="password"
                                                onKeyUp={handlePasswordKeyboardState}
                                                onKeyDown={handlePasswordKeyboardState}
                                                className="w-full px-4 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4A373] outline-none transition-all text-sm xl:text-base font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#6F6258] uppercase ml-1 tracking-wider">Confirmar Senha</label>
                                            <input
                                                name="confirmPassword"
                                                type="password"
                                                onKeyUp={handlePasswordKeyboardState}
                                                onKeyDown={handlePasswordKeyboardState}
                                                className="w-full px-4 py-2.5 xl:py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4A373] outline-none transition-all text-sm xl:text-base font-medium"
                                            />
                                        </div>
                                        <CustomInput label="Lembrete de Senha" name="passwordReminder" type="text" defaultValue={settings.passwordReminder} />
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
                                    <button type="submit" className="w-full bg-[#2A1E15] text-[#FFFFFF] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#D4A373] shadow-xl">Salvar</button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ai-behavior' && (
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
