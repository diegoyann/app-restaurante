import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Receipt,
    TrendingUp,
    DollarSign,
    Plus,
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
    Menu
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
    AreaChart, Area, Legend
} from 'recharts';

// --- CONFIGURAÇÃO ---
const LOGO_URL = "https://media.discordapp.net/attachments/1116226671356432525/1491817940389990491/Logo_Sem_Fundo_Sem_nome.png?ex=69d91339&is=69d7c1b9&hm=880b1a54c2502532f72efd5b8648ae5152be22c38d01e69cc70b1b290c76f7de&=&format=webp&quality=lossless&width=1008&height=1008";

// --- COMPONENTES UI ---
const Logo = ({ className = "w-10 h-10" }) => {
    const [error, setError] = useState(false);
    if (error) return <div className={`${className} bg-[#5c1f20] rounded-xl flex items-center justify-center shadow-lg`}><Crown className="text-[#c5a04a]" size={20} /></div>;
    return <img src={LOGO_URL} alt="Logo" className={`${className} object-contain rounded-xl drop-shadow-md`} onError={() => setError(true)} />;
};

const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass, iconColorClass }) => (
    <div className="bg-white p-4 xl:p-5 2xl:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all h-full min-h-[110px] xl:min-h-[132px]">
        <div className="min-w-0 flex-1">
            <p className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase tracking-tighter truncate mb-1">{title}</p>
            <p className={`text-xl sm:text-2xl xl:text-3xl 2xl:text-4xl font-black ${colorClass} truncate leading-none`}>{value}</p>
        </div>
        <div className={`p-2.5 xl:p-3 2xl:p-4 rounded-xl shrink-0 ml-2 ${bgColorClass}`}>
            <Icon size={20} className={iconColorClass} />
        </div>
    </div>
);

const CustomInput = ({ label, icon: Icon, ...props }) => (
    <div className="space-y-1 w-full">
        <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#696965]" size={16} />}
            <input {...props} className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c5a04a] outline-none transition-all text-sm xl:text-base font-medium`} />
        </div>
    </div>
);

// --- MODAL DE CATEGORIAS (EDIÇÃO EM LINHA) ---
const CategoryModal = ({ isOpen, onClose, categories, setCategories }) => {
    const [newCatName, setNewCatName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingValue, setEditingValue] = useState('');

    if (!isOpen) return null;

    const handleAddNew = () => {
        if (!newCatName.trim()) return;
        setCategories(prev => [...prev, { id: Date.now(), name: newCatName.trim() }]);
        setNewCatName('');
    };

    const handleSaveEdit = (id) => {
        if (!editingValue.trim()) return;
        setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editingValue.trim() } : c));
        setEditingId(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-6 font-sans italic">
                    <h3 className="text-xl font-black text-[#5c1f20] uppercase tracking-tighter flex items-center gap-2">
                        <List size={20} /> Categorias
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Nova categoria..."
                        className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-[#c5a04a] text-sm font-bold"
                    />
                    <button onClick={handleAddNew} className="bg-[#5c1f20] text-white px-4 rounded-xl hover:bg-[#c5a04a] transition-all flex items-center justify-center">
                        <Plus size={18} />
                    </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group border border-transparent hover:border-[#c5a04a]/30">
                            {editingId === cat.id ? (
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="text"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="flex-1 p-1 bg-white border border-[#c5a04a] rounded-md outline-none text-xs font-bold uppercase"
                                        autoFocus
                                    />
                                    <button onClick={() => handleSaveEdit(cat.id)} className="p-1 text-green-600"><Check size={16} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-1 text-gray-400"><X size={16} /></button>
                                </div>
                            ) : (
                                <>
                                    <span className="font-bold text-[#696965] uppercase text-xs truncate mr-2">{cat.name}</span>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => { setEditingId(cat.id); setEditingValue(cat.name); }} className="text-blue-600 hover:scale-110 transition-transform"><Edit size={14} /></button>
                                        <button onClick={() => setCategories(prev => prev.filter(c => c.id !== cat.id))} className="text-red-600 hover:scale-110 transition-transform"><Trash2 size={14} /></button>
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
                    <h3 className="text-xl font-black text-[#5c1f20] uppercase tracking-tighter flex items-center gap-2">
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
                        className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-[#c5a04a] text-sm font-bold"
                    />
                    <button onClick={handleAddNew} className="bg-[#5c1f20] text-white px-4 rounded-xl hover:bg-[#c5a04a] transition-all flex items-center justify-center">
                        <Plus size={18} />
                    </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {roles.map(role => (
                        <div key={role.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group border border-transparent hover:border-[#c5a04a]/30">
                            {editingId === role.id ? (
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="text"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="flex-1 p-1 bg-white border border-[#c5a04a] rounded-md outline-none text-xs font-bold uppercase"
                                        autoFocus
                                    />
                                    <button onClick={() => handleSaveEdit(role.id)} className="p-1 text-green-600"><Check size={16} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-1 text-gray-400"><X size={16} /></button>
                                </div>
                            ) : (
                                <>
                                    <span className="font-bold text-[#696965] uppercase text-xs truncate mr-2">{role.name}</span>
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

const UnitModal = ({ isOpen, onClose, units, setUnits, ingredients }) => {
    const [newUnitName, setNewUnitName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingValue, setEditingValue] = useState('');

    if (!isOpen) return null;

    const handleAddNew = () => {
        if (!newUnitName.trim()) return;
        setUnits((prev) => [...prev, { id: Date.now(), label: newUnitName.trim() }]);
        setNewUnitName('');
    };

    const handleSaveEdit = (id) => {
        if (!editingValue.trim()) return;
        setUnits((prev) => prev.map((unit) => unit.id === id ? { ...unit, label: editingValue.trim() } : unit));
        setEditingId(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-6 font-sans italic">
                    <h3 className="text-xl font-black text-[#5c1f20] uppercase tracking-tighter flex items-center gap-2">
                        <Wallet size={20} /> Unidades
                    </h3>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        placeholder="Nova unidade..."
                        className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-[#c5a04a] text-sm font-bold"
                    />
                    <button type="button" onClick={handleAddNew} className="bg-[#5c1f20] text-white px-4 rounded-xl hover:bg-[#c5a04a] transition-all flex items-center justify-center">
                        <Plus size={18} />
                    </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {units.map((unit) => {
                        const inUse = ingredients.some((ingredient) => ingredient.unit === unit.label);

                        return (
                            <div key={unit.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group border border-transparent hover:border-[#c5a04a]/30">
                                {editingId === unit.id ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <input
                                            type="text"
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            className="flex-1 p-1 bg-white border border-[#c5a04a] rounded-md outline-none text-xs font-bold uppercase"
                                            autoFocus
                                        />
                                        <button type="button" onClick={() => handleSaveEdit(unit.id)} className="p-1 text-green-600"><Check size={16} /></button>
                                        <button type="button" onClick={() => setEditingId(null)} className="p-1 text-gray-400"><X size={16} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-bold text-[#696965] uppercase text-xs truncate mr-2">{unit.label}</span>
                                        <div className="flex gap-2 shrink-0">
                                            <button type="button" onClick={() => { setEditingId(unit.id); setEditingValue(unit.label); }} className="text-blue-600 hover:scale-110 transition-transform"><Edit size={14} /></button>
                                            <button
                                                type="button"
                                                onClick={() => setUnits((prev) => prev.filter((item) => item.id !== unit.id))}
                                                disabled={inUse}
                                                className={`hover:scale-110 transition-transform ${inUse ? 'text-gray-300 cursor-not-allowed' : 'text-red-600'}`}
                                                title={inUse ? 'Existem insumos usando essa unidade.' : 'Excluir unidade'}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
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
    ingredientUnits,
    ingredients,
    preparations
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 font-sans italic shrink-0">
                    <h3 className="text-xl font-black text-[#5c1f20] uppercase tracking-tighter flex items-center gap-2">
                        <Briefcase size={20} /> Registrar Receita Base
                    </h3>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <CustomInput label="Nome da Receita Base" value={preparationForm.name} onChange={(e) => onPreparationFormChange('name', e.target.value)} required />
                            <CustomInput label="Rendimento da Receita" type="number" step="0.01" value={preparationForm.yieldQuantity} onChange={(e) => onPreparationFormChange('yieldQuantity', e.target.value)} required />
                            <div className="space-y-1">
                                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Unidade do Rendimento</label>
                                <select
                                    value={preparationForm.yieldUnit}
                                    onChange={(e) => onPreparationFormChange('yieldUnit', e.target.value)}
                                    className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#c5a04a]"
                                >
                                    {ingredientUnits.map((unit) => (
                                        <option key={`yield-unit-${unit.id}`} value={unit.label}>{unit.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm font-black text-[#5c1f20] uppercase">Composição da Receita</p>
                                <button type="button" onClick={onAddPreparationRecipeLine} className="text-[10px] font-black text-[#c5a04a] border border-[#c5a04a] px-3 py-2 rounded-full uppercase hover:bg-[#c5a04a] hover:text-white transition-all w-full sm:w-auto">
                                    Adicionar Item
                                </button>
                            </div>

                            <div className="space-y-3">
                                {preparationRecipeDraft.map((line, index) => {
                                    const compatibleUnits = getCompatibleUnits(
                                        getComponentBaseUnit(line.componentRef, ingredients, preparations),
                                        ingredientUnits
                                    );

                                    return (
                                        <div key={line.id} className="grid grid-cols-1 sm:grid-cols-[1fr_130px_110px_48px] gap-3 items-end">
                                            <div className="space-y-1">
                                                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">
                                                    Componente {index + 1}
                                                </label>
                                                <select
                                                    value={line.componentRef}
                                                    onChange={(e) => onPreparationRecipeDraftChange(line.id, 'componentRef', e.target.value)}
                                                    className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#c5a04a]"
                                                >
                                                    <option value="">Selecione</option>
                                                    <optgroup label="Insumos">
                                                        {ingredients.map((ingredient) => (
                                                            <option key={`prep-ingredient-${ingredient.id}`} value={`ingredient:${ingredient.id}`}>
                                                                {ingredient.name}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                    <optgroup label="Receitas Base">
                                                        {preparations.map((preparation) => (
                                                            <option key={`prep-preparation-${preparation.id}`} value={`preparation:${preparation.id}`}>
                                                                {preparation.name}
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
                                                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Unidade</label>
                                                <select
                                                    value={line.quantityUnit}
                                                    onChange={(e) => onPreparationRecipeDraftChange(line.id, 'quantityUnit', e.target.value)}
                                                    className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#c5a04a]"
                                                    disabled={!line.componentRef}
                                                >
                                                    <option value="">Selecione</option>
                                                    {compatibleUnits.map((unit) => (
                                                        <option key={`prep-line-unit-${line.id}-${unit.id}`} value={unit.label}>{unit.label}</option>
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
                        <button type="submit" className="w-full bg-[#5c1f20] text-[#c5a04a] h-11 rounded-xl font-black uppercase text-[10px] shadow-md">
                            Salvar Receita Base
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
                    <h3 className="text-xl font-black text-[#5c1f20] uppercase tracking-tighter">{title}</h3>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder="Novo item..."
                        className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-[#c5a04a] text-sm font-bold"
                    />
                    <button type="button" onClick={handleAdd} className="bg-[#5c1f20] text-white px-4 rounded-xl hover:bg-[#c5a04a] transition-all flex items-center justify-center">
                        <Plus size={18} />
                    </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                    {options.map((option) => (
                        <div key={option.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-transparent hover:border-[#c5a04a]/30">
                            {editingId === option.id ? (
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="text"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="flex-1 p-1 bg-white border border-[#c5a04a] rounded-md outline-none text-xs font-bold uppercase"
                                        autoFocus
                                    />
                                    <button type="button" onClick={() => handleSave(option.id)} className="p-1 text-green-600"><Check size={16} /></button>
                                    <button type="button" onClick={() => setEditingId(null)} className="p-1 text-gray-400"><X size={16} /></button>
                                </div>
                            ) : (
                                <>
                                    <span className="font-bold text-[#696965] uppercase text-xs truncate mr-2">{option.name}</span>
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
                        <h3 className="text-xl font-black text-[#5c1f20] uppercase tracking-tighter">Ver Descontos</h3>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">{employee.name} | {employee.role}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3 items-end">
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase text-[#696965] tracking-widest">Categoria do Desconto</label>
                                <select
                                    value={discountDraft?.category || discountCategories[0]?.name || 'Outros'}
                                    onChange={(e) => onDraftChange('category', e.target.value)}
                                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-sm font-black uppercase text-[#696965] outline-none"
                                >
                                    {discountCategories.map(category => (
                                        <option key={category.id} value={category.name}>{category.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black uppercase text-[#696965] tracking-widest">Valor</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={discountDraft?.amount || ''}
                                    onChange={(e) => onDraftChange('amount', e.target.value)}
                                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-base font-black text-[#5c1f20] outline-none"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={onAddDiscount}
                                className="bg-[#5c1f20] text-[#c5a04a] h-11 px-4 rounded-xl font-black uppercase text-xs shadow-md"
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
                                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-sm font-black uppercase text-[#696965] outline-none"
                                    >
                                        {discountCategories.map(category => (
                                            <option key={category.id} value={category.name}>{category.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={discount.amount}
                                        onChange={(e) => onUpdateDiscountValue(discount.id, e.target.value)}
                                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-base font-black text-[#5c1f20] outline-none"
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
                        className="flex-1 bg-stone-100 text-[#5c1f20] h-11 rounded-xl font-black uppercase text-xs"
                    >
                        Fechar
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-[#5c1f20] text-[#c5a04a] h-11 rounded-xl font-black uppercase text-xs shadow-md"
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
                    <h3 className="text-xl font-black text-[#5c1f20] uppercase tracking-tighter">
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
                                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Tipo de Vínculo</label>
                                <select
                                    value={employee.employmentType}
                                    onChange={(e) => setEmployee((prev) => ({ ...prev, employmentType: e.target.value }))}
                                    className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#c5a04a]"
                                >
                                    <option value="fixed">Fixo</option>
                                    <option value="external">Por Fora</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Status</label>
                                <select
                                    value={employee.status}
                                    onChange={(e) => setEmployee((prev) => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#c5a04a]"
                                >
                                    <option value="active">Ativo</option>
                                    <option value="inactive">Inativo</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Cargo / Função</label>
                                <select
                                    value={employee.role}
                                    onChange={(e) => setEmployee((prev) => ({ ...prev, role: e.target.value }))}
                                    className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#c5a04a]"
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
                                        <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Tipo de Pagamento</label>
                                        <select
                                            value={employee.paymentMode}
                                            onChange={(e) => setEmployee((prev) => ({ ...prev, paymentMode: e.target.value }))}
                                            className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#c5a04a]"
                                        >
                                            <option value="weekly">Semanal</option>
                                            <option value="one_off">Avulso</option>
                                        </select>
                                    </div>
                                    <CustomInput label="Valor Base" type="number" step="0.01" value={employee.baseAmount} onChange={(e) => setEmployee((prev) => ({ ...prev, baseAmount: e.target.value }))} required />
                                    {employee.paymentMode === 'weekly' ? (
                                        <div className="space-y-1">
                                            <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Dia da Semana</label>
                                            <select
                                                value={employee.weekday}
                                                onChange={(e) => setEmployee((prev) => ({ ...prev, weekday: e.target.value }))}
                                                className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#c5a04a]"
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
                        <button type="submit" className="w-full bg-[#5c1f20] text-[#c5a04a] h-11 rounded-xl font-black uppercase text-[10px] shadow-md">
                            {isEditing ? 'Salvar Funcionário' : 'Cadastrar Funcionário'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const formatMoney = (value) => `R$ ${Number(value || 0).toFixed(2)}`;

const UNIT_DEFINITIONS = {
    g: { group: 'weight', factor: 1 },
    kg: { group: 'weight', factor: 1000 },
    ml: { group: 'volume', factor: 1 },
    l: { group: 'volume', factor: 1000 },
    un: { group: 'count', factor: 1 }
};

const getUnitDefinition = (unit) => UNIT_DEFINITIONS[unit] || null;

const convertQuantityBetweenUnits = (quantity, fromUnit, toUnit) => {
    const numericQuantity = Number(quantity) || 0;

    if (!fromUnit || !toUnit || fromUnit === toUnit) return numericQuantity;

    const fromDefinition = getUnitDefinition(fromUnit);
    const toDefinition = getUnitDefinition(toUnit);

    if (!fromDefinition || !toDefinition) return numericQuantity;
    if (fromDefinition.group !== toDefinition.group) return numericQuantity;

    return (numericQuantity * fromDefinition.factor) / toDefinition.factor;
};

const getCompatibleUnits = (sourceUnit, ingredientUnits) => {
    if (!sourceUnit) return ingredientUnits;

    const sourceDefinition = getUnitDefinition(sourceUnit);

    if (!sourceDefinition) {
        return ingredientUnits.filter((unit) => unit.label === sourceUnit);
    }

    return ingredientUnits.filter((unit) => {
        const currentDefinition = getUnitDefinition(unit.label);
        return currentDefinition?.group === sourceDefinition.group;
    });
};

const formatDateBr = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('pt-BR');
};

const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
};

const isHoliday = (date, holidayDates = []) => {
    const iso = date.toISOString().slice(0, 10);
    return holidayDates.includes(iso);
};

const isBusinessDay = (date, holidayDates = []) => (
    !isWeekend(date) && !isHoliday(date, holidayDates)
);

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

const calculateIngredientUnitCost = (ingredient) => {
    const packageQuantity = Number(ingredient?.packageQuantity) || 0;
    const packageCost = Number(ingredient?.packageCost) || 0;

    if (packageQuantity <= 0) return 0;

    return packageCost / packageQuantity;
};

const parseComponentValue = (value) => {
    const [componentType, rawId] = String(value || '').split(':');

    return {
        componentType,
        componentId: Number(rawId)
    };
};

const getComponentBaseUnit = (componentRef, ingredients, preparations) => {
    const parsed = parseComponentValue(componentRef);

    if (parsed.componentType === 'ingredient') {
        return ingredients.find((current) => current.id === parsed.componentId)?.unit || '';
    }

    if (parsed.componentType === 'preparation') {
        return preparations.find((current) => current.id === parsed.componentId)?.yieldUnit || '';
    }

    return '';
};

const buildPreparationCostMap = (preparations, ingredients) => {
    const cache = new Map();

    const resolveComponentUnitCost = (componentType, componentId, stack = new Set()) => {
        if (componentType === 'ingredient') {
            return calculateIngredientUnitCost(
                ingredients.find((current) => current.id === componentId)
            );
        }

        if (componentType === 'preparation') {
            if (cache.has(componentId)) return cache.get(componentId);
            if (stack.has(componentId)) return 0;

            const preparation = preparations.find((current) => current.id === componentId);
            if (!preparation) return 0;

            const nextStack = new Set(stack);
            nextStack.add(componentId);

            const totalCost = (preparation.recipe || []).reduce((total, item) => (
                total + (resolveComponentUnitCost(item.componentType, item.componentId, nextStack) * (Number(item.quantity) || 0))
            ), 0);

            const yieldQuantity = Number(preparation.yieldQuantity) || 1;
            const unitCost = totalCost / yieldQuantity;

            cache.set(componentId, unitCost);
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
    const totalCost = (preparation.recipe || []).reduce((total, item) => {
        const componentSourceUnit = item.componentType === 'ingredient'
            ? ingredients.find((current) => current.id === item.componentId)?.unit
            : preparations.find((current) => current.id === item.componentId)?.yieldUnit;
        const normalizedQuantity = convertQuantityBetweenUnits(
            item.quantity,
            item.quantityUnit || componentSourceUnit,
            componentSourceUnit
        );
        const componentUnitCost = item.componentType === 'ingredient'
            ? calculateIngredientUnitCost(ingredients.find((current) => current.id === item.componentId))
            : (preparationCostMap.get(item.componentId) || 0);

        return total + (componentUnitCost * normalizedQuantity);
    }, 0);

    return {
        totalCost,
        unitCost: preparationCostMap.get(preparation.id) || 0
    };
};

const calculateProductMetrics = (product, ingredients, preparations, preparationCostMap) => {
    const recipeCost = (product.recipe || []).reduce((total, item) => {
        const componentSourceUnit = item.componentType === 'ingredient'
            ? ingredients.find((current) => current.id === item.componentId)?.unit
            : preparations.find((current) => current.id === item.componentId)?.yieldUnit;
        const normalizedQuantity = convertQuantityBetweenUnits(
            item.quantity,
            item.quantityUnit || componentSourceUnit,
            componentSourceUnit
        );
        const componentUnitCost = item.componentType === 'ingredient'
            ? calculateIngredientUnitCost(ingredients.find((current) => current.id === item.componentId))
            : (preparationCostMap.get(item.componentId) || 0);

        return total + (componentUnitCost * normalizedQuantity);
    }, 0);

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

// --- APLICAÇÃO PRINCIPAL ---
export default function App({ tenantSlug = 'default' }) {
    const navigate = useNavigate();
    const hasTenantSession = typeof window !== 'undefined' && Boolean(sessionStorage.getItem('tenantSlug'));
    const [session, setSession] = useState(hasTenantSession || tenantSlug !== 'default');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [openGroups, setOpenGroups] = useState({ operacional: true, financeiro: false, pessoas: false, sistema: false });
    const [loginError, setLoginError] = useState('');
    const [settingsError, setSettingsError] = useState('');
    const [settingsSuccess, setSettingsSuccess] = useState('');
    const [settingsCapsLockOn, setSettingsCapsLockOn] = useState(false);
    const [dismissedAlerts, setDismissedAlerts] = useState([]);
    const [highlightedCostIds, setHighlightedCostIds] = useState([]);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [isPreparationModalOpen, setIsPreparationModalOpen] = useState(false);
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
    const [settings, setSettings] = useState({
        ifoodTax: 23,
        anotaaiTax: 5,
        appPassword: 'admin',
        passwordReminder: 'A senha padrão é "admin".',
        businessName: 'Rei das Esfihas',
        alertDaysBefore: 3
    });

    // Categorias
    const [costCategories, setCostCategories] = useState([
        { id: 1, name: "Aluguel" }, { id: 2, name: "Energia Elétrica" },
        { id: 3, name: "Água" }, { id: 4, name: "Internet" }, { id: 5, name: "Contador" }
    ]);

    const [employeeRoles, setEmployeeRoles] = useState([
        { id: 1, name: 'Esfiharia' },
        { id: 2, name: 'Atendimento' },
        { id: 3, name: 'Pizzaiolo' },
        { id: 4, name: 'Gerência' }
    ]);

    const [discountCategories, setDiscountCategories] = useState([
        { id: 1, name: 'Falta' },
        { id: 2, name: 'Atraso' },
        { id: 3, name: 'Adiantamento' },
        { id: 4, name: 'Outros' }
    ]);

    // RH
    const [employees, setEmployees] = useState([
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
    const [employeeForm, setEmployeeForm] = useState({
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

    const [payrollConfig, setPayrollConfig] = useState({
        salaryPercentage: 60,
        salaryBusinessDayOrdinal: 5,
        advancePercentage: 40,
        advanceFixedDay: 20,
        advanceBusinessDayPolicy: 'next',
        holidayDates: []
    });

    const [ingredients, setIngredients] = useState([
        { id: 1, name: 'Farinha', unit: 'g', packageQuantity: 5000, packageCost: 22.0 },
        { id: 2, name: 'Carne Moída', unit: 'g', packageQuantity: 1000, packageCost: 32.0 },
        { id: 3, name: 'Queijo Mussarela', unit: 'g', packageQuantity: 1000, packageCost: 28.0 },
        { id: 4, name: 'Molho de Tomate', unit: 'g', packageQuantity: 2000, packageCost: 18.0 },
        { id: 5, name: 'Embalagem', unit: 'un', packageQuantity: 100, packageCost: 35.0 }
    ]);

    const [ingredientUnits, setIngredientUnits] = useState([
        { id: 1, label: 'g' },
        { id: 2, label: 'ml' },
        { id: 3, label: 'un' },
        { id: 4, label: 'kg' }
    ]);

    const [editingIngredientId, setEditingIngredientId] = useState(null);
    const [ingredientForm, setIngredientForm] = useState({
        name: '',
        unit: 'g',
        packageQuantity: '',
        packageCost: ''
    });
    const [financeFormType, setFinanceFormType] = useState('receita');

    const [preparationForm, setPreparationForm] = useState({
        name: '',
        yieldQuantity: '1',
        yieldUnit: 'g'
    });

    const [preparations, setPreparations] = useState([
        {
            id: 1,
            name: 'Carne Moída Temperada',
            yieldQuantity: 1,
            yieldUnit: 'kg',
            recipe: [
                { componentType: 'ingredient', componentId: 2, quantity: 0.85, quantityUnit: 'kg' },
                { componentType: 'ingredient', componentId: 4, quantity: 120, quantityUnit: 'g' }
            ]
        }
    ]);

    const [products, setProducts] = useState([
        {
            id: 1,
            name: 'Esfiha de Carne',
            salePrice: 8.0,
            yieldQuantity: 1,
            targetCmvPercent: 30,
            recipe: [
                { componentType: 'ingredient', componentId: 1, quantity: 90, quantityUnit: 'g' },
                { componentType: 'preparation', componentId: 1, quantity: 70, quantityUnit: 'g' },
                { componentType: 'ingredient', componentId: 5, quantity: 1, quantityUnit: 'un' }
            ]
        },
        {
            id: 2,
            name: 'Pizza Brotinho',
            salePrice: 24.0,
            yieldQuantity: 1,
            targetCmvPercent: 32,
            recipe: [
                { componentType: 'ingredient', componentId: 1, quantity: 220, quantityUnit: 'g' },
                { componentType: 'ingredient', componentId: 3, quantity: 140, quantityUnit: 'g' },
                { componentType: 'ingredient', componentId: 4, quantity: 90, quantityUnit: 'g' },
                { componentType: 'ingredient', componentId: 5, quantity: 1, quantityUnit: 'un' }
            ]
        }
    ]);

    const [productRecipeDraft, setProductRecipeDraft] = useState([
        { id: Date.now(), componentRef: '', quantity: '', quantityUnit: '' }
    ]);

    const [preparationRecipeDraft, setPreparationRecipeDraft] = useState([
        { id: Date.now() + 1, componentRef: '', quantity: '', quantityUnit: '' }
    ]);

    const [productSearchTerm, setProductSearchTerm] = useState('');

    // Custos Fixos
    const [recurringCosts, setRecurringCosts] = useState([
        { id: 1, desc: 'Aluguel', amount: 3000, dueDay: 10, lastPaidMonth: "" },
        { id: 2, desc: 'Energia Elétrica', amount: 850, dueDay: 15, lastPaidMonth: "" }
    ]);

    const [salesChannels, setSalesChannels] = useState([
        { id: 1, name: 'ifood' },
        { id: 2, name: 'anotaai' }
    ]);

    const [financeExpenseCategories, setFinanceExpenseCategories] = useState([
        { id: 1, name: 'Compra de Insumos' },
        { id: 2, name: 'Fornecedor' },
        { id: 3, name: 'Manutenção' },
        { id: 4, name: 'Marketing' },
        { id: 5, name: 'Imposto' },
        { id: 6, name: 'Retirada' },
        { id: 7, name: 'Outras Saídas' }
    ]);

    // Vendas
    const [transactions, setTransactions] = useState([
        { id: 1, date: '2024-04-09', platform: 'ifood', payment: 'online', amount: 1200.00, tax: 23, net: 924.00, type: 'receita', category: 'ifood', note: 'Pedidos iFood' },
        { id: 2, date: '2024-04-09', platform: 'anotaai', payment: 'pix', amount: 650.00, tax: 5, net: 617.50, type: 'receita', category: 'anotaai', note: 'Pedidos Anota AI' },
        { id: 3, date: '2024-04-09', platform: 'despesa', payment: 'pix', amount: 180.00, tax: 0, net: -180.00, type: 'despesa', category: 'Compra de Insumos', note: 'Reposição de hortifruti' },
    ]);

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
            targetTab: 'costs',
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
            color: index % 2 === 0 ? '#5c1f20' : '#c5a04a'
        }));

        const channelOrderData = salesChannels.map((channel, index) => ({
            name: channel.name,
            value: transactions.filter(t => t.type === 'receita' && t.platform === channel.name).length,
            color: index % 2 === 0 ? '#5c1f20' : '#c5a04a'
        }));

        const totalOrders = transactions.filter(t => t.type === 'receita').length;
        const ticketMedio = totalOrders > 0 ? receitaBruta / totalOrders : 0;

        // Faturamento diário do mês atual
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dailyRevenue = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTransactions = transactions.filter(t => t.type === 'receita' && t.date === dateStr);
            const dayBruto = dayTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
            const dayLiquido = dayTransactions.reduce((acc, t) => acc + (t.net || 0), 0);
            dailyRevenue.push({
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
            totalOrders,
            ticketMedio,
            dailyRevenue,
            lastOrders,
            financialData: [
                ...channelRevenueData,
                { name: 'Total', value: receitaBruta, color: '#696965' }
            ],
            orderCountData: [
                ...channelOrderData,
                { name: 'Total', value: totalOrders, color: '#696965' }
            ]
        };
    }, [transactions, recurringCosts, catalogMetrics.averageCmvPercent, catalogMetrics.averageMarkupPercent, salesChannels, payrollSummary]);

    // Handlers
    const handleAddTransaction = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const type = fd.get('type');
        const amount = parseFloat(fd.get('amount')) || 0;
        if (amount <= 0) return;
        const reference = fd.get('reference');
        const platform = type === 'receita' ? reference : 'despesa';
        const tax = type === 'receita'
            ? (platform === 'ifood' ? settings.ifoodTax : platform === 'anotaai' ? settings.anotaaiTax : 0)
            : 0;
        setTransactions(prev => [{
            id: Date.now(),
            date: fd.get('date'),
            platform,
            payment: fd.get('payment'),
            amount,
            tax,
            net: type === 'receita' ? amount * (1 - (tax / 100)) : -amount,
            type,
            category: reference || (type === 'receita' ? salesChannels[0]?.name : financeExpenseCategories[0]?.name),
            note: fd.get('note') || ''
        }, ...prev]);
        e.target.reset();
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

    const handleSubmitEmployee = (e) => {
        e.preventDefault();

        const isFixed = employeeForm.employmentType === 'fixed';
        const payload = {
            id: editingEmployeeId || Date.now(),
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

        setEmployees((prev) => {
            if (editingEmployeeId) {
                return prev.map((item) => item.id === editingEmployeeId ? payload : item);
            }

            return [...prev, payload];
        });

        setIsEmployeeModalOpen(false);
        setEditingEmployeeId(null);
        setEmployeeForm(createEmptyEmployeeForm());
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

    const handleAddEmployeeDiscount = (employeeId) => {
        const draft = employeeDiscountDrafts[employeeId];
        const amount = Math.max(parseFloat(draft?.amount) || 0, 0);
        const category = draft?.category || discountCategories[0]?.name || 'Outros';

        if (amount <= 0) return;

        setEmployees((prev) =>
            prev.map((employee) =>
                employee.id === employeeId
                    ? {
                        ...employee,
                        discounts: [
                            ...(employee.discounts || []),
                            { id: Date.now() + Math.random(), category, amount }
                        ]
                    }
                    : employee
            )
        );

        setEmployeeDiscountDrafts((prev) => ({
            ...prev,
            [employeeId]: {
                category: discountCategories[0]?.name || 'Outros',
                amount: ''
            }
        }));
    };

    const handleUpdateEmployeeDiscount = (employeeId, discountId, discountValue) => {
        setEmployees((prev) =>
            prev.map((employee) =>
                employee.id === employeeId
                    ? {
                        ...employee,
                        discounts: (employee.discounts || []).map((discount) =>
                            discount.id === discountId
                                ? { ...discount, amount: Math.max(parseFloat(discountValue) || 0, 0) }
                                : discount
                        )
                    }
                    : employee
            )
        );
    };

    const handleUpdateEmployeeDiscountCategory = (employeeId, discountId, category) => {
        setEmployees((prev) =>
            prev.map((employee) =>
                employee.id === employeeId
                    ? {
                        ...employee,
                        discounts: (employee.discounts || []).map((discount) =>
                            discount.id === discountId
                                ? { ...discount, category }
                                : discount
                        )
                    }
                    : employee
            )
        );
    };

    const handleRemoveEmployeeDiscount = (employeeId, discountId) => {
        setEmployees((prev) =>
            prev.map((employee) =>
                employee.id === employeeId
                    ? { ...employee, discounts: (employee.discounts || []).filter((discount) => discount.id !== discountId) }
                    : employee
            )
        );
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
            unit: ingredientUnits[0]?.label || 'g',
            packageQuantity: '',
            packageCost: ''
        });
    };

    useEffect(() => {
        if (!ingredientUnits.some((unit) => unit.label === ingredientForm.unit)) {
            setIngredientForm((prev) => ({
                ...prev,
                unit: ingredientUnits[0]?.label || ''
            }));
        }
    }, [ingredientUnits, ingredientForm.unit]);

    useEffect(() => {
        if (hasTenantSession || tenantSlug !== 'default') {
            setSession(true);
        }
    }, [hasTenantSession, tenantSlug]);

    useEffect(() => {
        if (!ingredientUnits.some((unit) => unit.label === preparationForm.yieldUnit)) {
            setPreparationForm((prev) => ({
                ...prev,
                yieldUnit: ingredientUnits[0]?.label || ''
            }));
        }
    }, [ingredientUnits, preparationForm.yieldUnit]);

    useEffect(() => {
        if (activeTab !== 'costs' && highlightedCostIds.length > 0) {
            setHighlightedCostIds([]);
        }
    }, [activeTab, highlightedCostIds]);

    const handleIngredientFormChange = (field, value) => {
        setIngredientForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmitIngredient = (e) => {
        e.preventDefault();

        const payload = {
            name: ingredientForm.name.trim(),
            unit: ingredientForm.unit,
            packageQuantity: parseFloat(ingredientForm.packageQuantity) || 0,
            packageCost: parseFloat(ingredientForm.packageCost) || 0
        };

        if (!payload.name || !payload.unit || payload.packageQuantity <= 0 || payload.packageCost <= 0) return;

        if (editingIngredientId) {
            setIngredients((prev) =>
                prev.map((ingredient) => ingredient.id === editingIngredientId ? { ...ingredient, ...payload } : ingredient)
            );
        } else {
            setIngredients((prev) => [...prev, { id: Date.now(), ...payload }]);
        }

        resetIngredientForm();
    };

    const handleEditIngredient = (ingredient) => {
        setEditingIngredientId(ingredient.id);
        setIngredientForm({
            name: ingredient.name,
            unit: ingredient.unit,
            packageQuantity: String(ingredient.packageQuantity),
            packageCost: String(ingredient.packageCost)
        });
    };

    const handleDeleteIngredient = (ingredientId) => {
        setIngredients((prev) => prev.filter((item) => item.id !== ingredientId));
        setPreparations((prev) =>
            prev
                .map((preparation) => ({
                    ...preparation,
                    recipe: preparation.recipe.filter((line) => !(line.componentType === 'ingredient' && line.componentId === ingredientId))
                }))
                .filter((preparation) => preparation.recipe.length > 0)
        );
        setProducts((prev) =>
            prev
                .map((product) => ({
                    ...product,
                    recipe: product.recipe.filter((line) => !(line.componentType === 'ingredient' && line.componentId === ingredientId))
                }))
                .filter((product) => product.recipe.length > 0)
        );

        if (editingIngredientId === ingredientId) {
            resetIngredientForm();
        }
    };

    const handleDeletePreparation = (preparationId) => {
        setPreparations((prev) =>
            prev
                .filter((preparation) => preparation.id !== preparationId)
                .map((preparation) => ({
                    ...preparation,
                    recipe: preparation.recipe.filter((line) => !(line.componentType === 'preparation' && line.componentId === preparationId))
                }))
                .filter((preparation) => preparation.recipe.length > 0)
        );

        setProducts((prev) =>
            prev
                .map((product) => ({
                    ...product,
                    recipe: product.recipe.filter((line) => !(line.componentType === 'preparation' && line.componentId === preparationId))
                }))
                .filter((product) => product.recipe.length > 0)
        );
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
                    return { ...line, componentRef: value, quantityUnit: baseUnit };
                }

                return { ...line, [field]: value };
            })
        );
    };

    const handleRemoveRecipeLine = (id) => {
        setProductRecipeDraft((prev) => prev.filter((line) => line.id !== id));
    };

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
                    return { ...line, componentRef: value, quantityUnit: baseUnit };
                }

                return { ...line, [field]: value };
            })
        );
    };

    const handleRemovePreparationRecipeLine = (id) => {
        setPreparationRecipeDraft((prev) => prev.filter((line) => line.id !== id));
    };

    const handleAddProduct = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);

        const recipe = productRecipeDraft
            .filter((line) => line.componentRef && line.quantityUnit && Number(line.quantity) > 0)
            .map((line) => {
                const parsed = parseComponentValue(line.componentRef);
                return {
                    componentType: parsed.componentType,
                    componentId: parsed.componentId,
                    quantity: Number(line.quantity),
                    quantityUnit: line.quantityUnit
                };
            });

        if (recipe.length === 0) return;

        setProducts((prev) => [
            ...prev,
            {
                id: Date.now(),
                name: fd.get('name'),
                salePrice: parseFloat(fd.get('salePrice')) || 0,
                yieldQuantity: parseFloat(fd.get('yieldQuantity')) || 1,
                targetCmvPercent: parseFloat(fd.get('targetCmvPercent')) || 30,
                recipe
            }
        ]);

        setProductRecipeDraft([{ id: Date.now(), componentRef: '', quantity: '', quantityUnit: '' }]);
        e.target.reset();
    };

    const handleAddPreparation = (e) => {
        e.preventDefault();

        const recipe = preparationRecipeDraft
            .filter((line) => line.componentRef && line.quantityUnit && Number(line.quantity) > 0)
            .map((line) => {
                const parsed = parseComponentValue(line.componentRef);
                return {
                    componentType: parsed.componentType,
                    componentId: parsed.componentId,
                    quantity: Number(line.quantity),
                    quantityUnit: line.quantityUnit
                };
            });

        if (!preparationForm.name.trim() || recipe.length === 0) return;

        setPreparations((prev) => [
            ...prev,
            {
                id: Date.now(),
                name: preparationForm.name.trim(),
                yieldQuantity: parseFloat(preparationForm.yieldQuantity) || 1,
                yieldUnit: preparationForm.yieldUnit || ingredientUnits[0]?.label || 'g',
                recipe
            }
        ]);

        setPreparationForm({ name: '', yieldQuantity: '1', yieldUnit: ingredientUnits[0]?.label || 'g' });
        setPreparationRecipeDraft([{ id: Date.now() + 1, componentRef: '', quantity: '', quantityUnit: '' }]);
        setIsPreparationModalOpen(false);
    };

    const handleAddRecurringCost = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        setRecurringCosts(prev => [...prev, {
            id: Date.now(),
            desc: fd.get('desc'),
            amount: parseFloat(fd.get('amount')) || 0,
            dueDay: parseInt(fd.get('dueDay')) || 1,
            lastPaidMonth: ""
        }]);
        e.target.reset();
    };

    const handleUpdateCost = (id, newAmount) => {
        setRecurringCosts(prev => prev.map(c => c.id === id ? { ...c, amount: parseFloat(newAmount) || 0 } : c));
    };

    const togglePaymentStatus = (id) => {
        setRecurringCosts(prev => prev.map(c => c.id === id ? { ...c, lastPaidMonth: c.lastPaidMonth === currentMonthYear ? "" : currentMonthYear } : c));
    };

    const handlePasswordKeyboardState = (event) => {
        setSettingsCapsLockOn(event.getModifierState('CapsLock'));
    };

    const handleUpdateSettings = (e) => {
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

        setSettings(prev => ({
            ...prev,
            ifoodTax: parseFloat(fd.get('ifoodTax')) || 0,
            anotaaiTax: parseFloat(fd.get('anotaaiTax')) || 0,
            appPassword: newPassword || prev.appPassword,
            passwordReminder: fd.get('passwordReminder') || prev.passwordReminder,
            businessName: fd.get('businessName') || prev.businessName,
            alertDaysBefore: parseInt(fd.get('alertDaysBefore')) || 0
        }));
        setSettingsSuccess('Configurações salvas com sucesso.');
        setActiveTab('dashboard');
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 md:p-6 font-sans">
                <div className="bg-[#fdfffd] w-full max-w-[440px] xl:max-w-[520px] rounded-[2rem] p-8 sm:p-10 xl:p-12 shadow-2xl border border-gray-100 italic">
                    <div className="flex flex-col items-center mb-8 text-center font-black">
                        <Logo className="w-20 h-20 xl:w-24 xl:h-24 mb-4" />
                        <h1 className="text-2xl xl:text-3xl font-black text-[#5c1f20] tracking-tight uppercase tracking-tighter">{settings.businessName}</h1>
                        <p className="text-[#696965] text-[11px] xl:text-xs font-bold uppercase tracking-widest mt-1">Painel Administrativo</p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm font-bold text-[#696965] text-center">
                            Sessão não encontrada. Faça login para acessar o dashboard.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-full bg-[#5c1f20] text-[#fdfffd] py-4 rounded-2xl font-black uppercase text-xs hover:bg-[#c5a04a] transition-all shadow-xl"
                        >
                            Ir para Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-shell flex min-h-screen bg-[#fdfffd] text-gray-900 font-sans italic relative">
            <CategoryModal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} categories={costCategories} setCategories={setCostCategories} />
            <EmployeeRoleModal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} roles={employeeRoles} setRoles={setEmployeeRoles} />
            <UnitModal isOpen={isUnitModalOpen} onClose={() => setIsUnitModalOpen(false)} units={ingredientUnits} setUnits={setIngredientUnits} ingredients={ingredients} />
            <SimpleOptionsModal isOpen={isChannelModalOpen} onClose={() => setIsChannelModalOpen(false)} title="Canais" options={salesChannels} setOptions={setSalesChannels} />
            <SimpleOptionsModal isOpen={isFinanceCategoryModalOpen} onClose={() => setIsFinanceCategoryModalOpen(false)} title="Categorias Financeiras" options={financeExpenseCategories} setOptions={setFinanceExpenseCategories} />
            <SimpleOptionsModal isOpen={isDiscountCategoryModalOpen} onClose={() => setIsDiscountCategoryModalOpen(false)} title="Categorias de Desconto" options={discountCategories} setOptions={setDiscountCategories} />
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
            <EmployeeModal
                isOpen={isEmployeeModalOpen}
                onClose={() => setIsEmployeeModalOpen(false)}
                onSubmit={handleSubmitEmployee}
                employeeRoles={employeeRoles}
                employee={employeeForm}
                setEmployee={setEmployeeForm}
                isEditing={Boolean(editingEmployeeId)}
            />
            <PreparationModal
                isOpen={isPreparationModalOpen}
                onClose={() => setIsPreparationModalOpen(false)}
                preparationForm={preparationForm}
                onPreparationFormChange={handlePreparationFormChange}
                preparationRecipeDraft={preparationRecipeDraft}
                onAddPreparationRecipeLine={handleAddPreparationRecipeLine}
                onPreparationRecipeDraftChange={handlePreparationRecipeDraftChange}
                onRemovePreparationRecipeLine={handleRemovePreparationRecipeLine}
                onSubmit={handleAddPreparation}
                ingredientUnits={ingredientUnits}
                ingredients={ingredients}
                preparations={preparations}
            />

            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-[45] lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

            <aside className={`fixed lg:sticky top-0 left-0 z-50 w-64 xl:w-72 2xl:w-80 bg-gradient-to-b from-[#4b1718] via-[#5c1f20] to-[#341011] border-r border-[#7a3738] flex flex-col h-screen transition-transform duration-300 shadow-[10px_0_30px_rgba(52,16,17,0.35)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 xl:p-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-2xl bg-white/8 ring-1 ring-[#c5a04a]/35 shadow-sm">
                            <Logo className="w-8 h-8 xl:w-10 xl:h-10" />
                        </div>
                        <span className="font-black text-lg xl:text-xl 2xl:text-2xl tracking-tighter text-white uppercase not-italic">REI DAS<span className="text-[#c5a04a] italic ml-1">ESFIHAS</span></span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-white/60"><X size={20} /></button>
                </div>
                <nav className="flex-1 px-3 overflow-y-auto py-2 space-y-1">

                    {/* ── Item simples: Painel Real ── */}
                    <button
                        onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'dashboard'
                            ? 'bg-white/12 text-[#f6d98b] ring-1 ring-[#c5a04a]/35 shadow-lg shadow-black/20 font-black'
                            : 'text-white hover:bg-white/8 hover:text-[#f6d98b] font-bold'
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
                            { id: 'cmv', label: 'CMV / Ficha Técnica', icon: Wallet },
                            { id: 'costs', label: 'Custos Fixos', icon: Receipt },
                            { id: 'closing', label: 'Fechamento', icon: PieChart },
                        ]
                    }, {
                        key: 'financeiro',
                        label: 'Financeiro',
                        icon: DollarSign,
                        items: [
                            { id: 'financeiro', label: 'Lançamentos', icon: TrendingUp },
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
                                        ? 'text-[#f6d98b] font-black bg-white/10 border border-[#c5a04a]/35 shadow-md'
                                        : 'text-[#f0d9da] hover:bg-white/8 hover:text-[#f6d98b] font-bold border border-transparent'
                                        }`}
                                >
                                    <group.icon size={15} className={`shrink-0 ${hasActive && !isOpen ? 'text-[#f6d98b]' : 'text-[#c5a04a]'}`} />
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
                                    <div className="ml-3 pl-3 border-l-2 border-[#c5a04a]/30 space-y-1 py-2">
                                        {group.items.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${activeTab === item.id
                                                    ? 'bg-[#c5a04a] text-[#4b1718] font-black shadow-md shadow-black/20'
                                                    : 'text-[#f4e9ea] hover:bg-white/10 hover:text-[#f6d98b] font-semibold'
                                                    }`}
                                            >
                                                <item.icon size={14} className={`shrink-0 ${activeTab === item.id ? 'text-[#4b1718]' : 'text-[#c5a04a]'}`} />
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
                        onClick={() => {
                            sessionStorage.removeItem('tenantSlug');
                            setSession(null);
                            navigate('/login');
                        }}
                        className="text-[9px] font-black text-white uppercase tracking-widest hover:text-[#f6d98b] flex items-center justify-center gap-2 w-full transition-colors"
                    >
                        <LogOut size={12} /> Sair do Reino
                    </button>
                </div>
            </aside>

            <main className="flex-1 min-w-0">
                <header className="h-16 sm:h-20 xl:h-24 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 xl:px-10 2xl:px-12 sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-[#5c1f20] bg-gray-50 rounded-xl"><Menu size={20} /></button>
                        <h2 className="text-base sm:text-xl xl:text-2xl 2xl:text-3xl font-black text-[#5c1f20] uppercase italic tracking-tighter truncate">{activeTab}</h2>
                    </div>
                    <div className="bg-[#fdfffd] border border-[#c5a04a]/20 px-2 py-1 xl:px-3 xl:py-1.5 rounded-lg text-[9px] sm:text-[10px] xl:text-xs font-black text-[#c5a04a] uppercase tracking-widest italic">Painel Administrativo</div>
                </header>

                <div className="p-4 sm:p-8 xl:p-10 2xl:p-12 max-w-[1800px] 2xl:max-w-[2000px] mx-auto space-y-6 sm:space-y-8 xl:space-y-10 font-sans w-full">
                    {/* Notificações */}
                    <div className="space-y-2">
                        {primaryAlert && (
                            <div className="flex items-center justify-between gap-3 bg-[#5c1f20] text-[#fdfffd] p-3 rounded-2xl border border-white/20 shadow-md">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab(primaryAlert.targetTab || 'costs');
                                        if (primaryAlert.targetTab === 'costs') {
                                            setHighlightedCostIds(prioritizedAlerts.map((alert) => alert.id));
                                        } else if (primaryAlert.targetTab === 'rh') {
                                            setRhView(primaryAlert.targetRhView || 'fixed');
                                        }
                                        setSidebarOpen(false);
                                    }}
                                    className="flex items-center gap-3 overflow-hidden text-left flex-1"
                                >
                                    <Bell size={14} className="text-[#c5a04a] shrink-0 animate-pulse" />
                                    <p className="text-[9px] sm:text-xs font-bold uppercase tracking-tight truncate">
                                        {primaryAlert.title}: <span className="text-[#c5a04a] font-black">{primaryAlert.label}</span>
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
                                <StatCard title="Pedidos" value={stats.totalOrders} icon={ShoppingBag} colorClass="text-[#696965]" bgColorClass="bg-gray-100" iconColorClass="text-[#696965]" />
                                <StatCard title="Ticket Médio" value={formatMoney(stats.ticketMedio)} icon={CreditCard} colorClass="text-amber-700" bgColorClass="bg-amber-50" iconColorClass="text-amber-700" />
                                <StatCard title="CMV Catálogo" value={`${stats.catalogAverageCmv.toFixed(1)}%`} icon={BarChart3} colorClass="text-blue-700" bgColorClass="bg-blue-50" iconColorClass="text-blue-700" />
                                <StatCard title="Markup Médio" value={`${stats.catalogAverageMarkup.toFixed(1)}%`} icon={DollarSign} colorClass="text-purple-700" bgColorClass="bg-purple-50" iconColorClass="text-purple-700" />
                                <StatCard title="Custos Fixos" value={formatMoney(stats.custosFixosTotal)} icon={Receipt} colorClass="text-[#5c1f20]" bgColorClass="bg-[#5c1f20]/10" iconColorClass="text-[#5c1f20]" />
                            </div>

                            {/* --- FATURAMENTO MENSAL (GRÁFICO DIÁRIO) --- */}
                            <div className="dashboard-chart-panel bg-white p-4 sm:p-6 xl:p-8 rounded-[1.5rem] border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[11px] sm:text-xs xl:text-sm font-black text-[#5c1f20] uppercase italic font-sans tracking-tight">
                                        Faturamento Mensal ({new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })})
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 rounded-sm bg-[#5c1f20]" />
                                            <span className="text-[10px] font-bold text-[#696965] uppercase">Bruto</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 rounded-sm bg-[#c5a04a]" />
                                            <span className="text-[10px] font-bold text-[#696965] uppercase">Líquido</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[280px] sm:h-[340px] xl:h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.dailyRevenue} barCategoryGap="12%">
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontWeight: 'bold', fontSize: 10, fill: '#696965' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#696965' }} tickFormatter={(v) => v > 0 ? `${(v / 1000).toFixed(0)}k` : '0'} width={35} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 700 }}
                                                formatter={(value, name) => [formatMoney(value), name === 'bruto' ? 'Bruto' : 'Líquido']}
                                                labelFormatter={(label) => `Dia ${label}`}
                                            />
                                            <Bar dataKey="bruto" fill="#5c1f20" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="liquido" fill="#c5a04a" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* --- ROW: RECEITA POR CANAL + PEDIDOS POR CANAL --- */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 xl:gap-8">
                                {/* Receita por Canal */}
                                <div className="bg-white p-5 sm:p-7 xl:p-8 rounded-[1.5rem] border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-[11px] sm:text-xs xl:text-sm font-black text-[#5c1f20] uppercase italic font-sans tracking-tight">Receita por Canal</h3>
                                        <span className="text-lg sm:text-xl font-black text-[#0f172a] tracking-tighter">{formatMoney(stats.receitaBruta)}</span>
                                    </div>
                                    <div className="space-y-5">
                                        {stats.financialData.filter(d => d.name !== 'Total').map((channel, i) => {
                                            const total = stats.receitaBruta || 1;
                                            const pct = ((channel.value / total) * 100).toFixed(1);
                                            const barWidth = Math.max((channel.value / total) * 100, 3);
                                            return (
                                                <div key={i}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: channel.color }} />
                                                            <span className="text-xs font-bold text-[#696965] uppercase tracking-wider">{channel.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-[#696965] bg-gray-100 px-2 py-0.5 rounded-md">{pct}%</span>
                                                            <span className="text-sm font-black text-[#0f172a]">{formatMoney(channel.value)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                                            style={{ width: `${barWidth}%`, backgroundColor: channel.color }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {stats.financialData.filter(d => d.name !== 'Total').length === 0 && (
                                        <p className="text-xs text-[#696965] font-bold uppercase tracking-widest text-center py-8">Sem dados de receita.</p>
                                    )}
                                </div>

                                {/* Pedidos por Canal */}
                                <div className="bg-white p-5 sm:p-7 xl:p-8 rounded-[1.5rem] border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-[11px] sm:text-xs xl:text-sm font-black text-[#5c1f20] uppercase italic font-sans tracking-tight">Pedidos por Canal</h3>
                                        <span className="text-lg sm:text-xl font-black text-[#0f172a] tracking-tighter">{stats.totalOrders} <span className="text-xs font-bold text-[#696965]">un</span></span>
                                    </div>
                                    <div className="space-y-5">
                                        {stats.orderCountData.filter(d => d.name !== 'Total').map((channel, i) => {
                                            const total = stats.totalOrders || 1;
                                            const pct = ((channel.value / total) * 100).toFixed(1);
                                            const barWidth = Math.max((channel.value / total) * 100, 3);
                                            return (
                                                <div key={i}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: channel.color }} />
                                                            <span className="text-xs font-bold text-[#696965] uppercase tracking-wider">{channel.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-[#696965] bg-gray-100 px-2 py-0.5 rounded-md">{pct}%</span>
                                                            <span className="text-sm font-black text-[#0f172a]">{channel.value} <span className="text-[10px] text-[#696965]">un</span></span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                                            style={{ width: `${barWidth}%`, backgroundColor: channel.color }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {stats.orderCountData.filter(d => d.name !== 'Total').length === 0 && (
                                        <p className="text-xs text-[#696965] font-bold uppercase tracking-widest text-center py-8">Sem pedidos registrados.</p>
                                    )}
                                </div>
                            </div>

                            {/* --- ROW: VOLUME POR PRODUTO + ÚLTIMOS PEDIDOS --- */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 xl:gap-8">
                                {/* Volume por Produto */}
                                <div className="bg-white p-4 sm:p-6 xl:p-8 rounded-[1.5rem] border border-gray-100 shadow-sm">
                                    <h3 className="text-[11px] sm:text-xs xl:text-sm font-black text-[#5c1f20] uppercase italic mb-5 font-sans tracking-tight">Volume por Produto</h3>
                                    <div className="space-y-4">
                                        {products.slice(0, 5).map((product, index) => {
                                            const maxValue = Math.max(...products.slice(0, 5).map(p => p.salePrice * 10), 1);
                                            const fakeVolume = Math.round(product.salePrice * (10 - index * 1.5));
                                            const barWidth = Math.max((fakeVolume / maxValue) * 100, 8);
                                            return (
                                                <div key={product.id} className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-[#696965] w-32 sm:w-40 truncate uppercase">{product.name}</span>
                                                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-700"
                                                            style={{
                                                                width: `${barWidth}%`,
                                                                background: index % 2 === 0
                                                                    ? 'linear-gradient(90deg, #5c1f20, #7a2b2d)'
                                                                    : 'linear-gradient(90deg, #c5a04a, #d4b35e)'
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-black text-[#5c1f20] w-10 text-right">{fakeVolume}</span>
                                                </div>
                                            );
                                        })}
                                        {products.length === 0 && (
                                            <p className="text-xs text-[#696965] font-bold uppercase tracking-widest">Cadastre produtos no CMV para ver o volume.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Últimos Pedidos */}
                                <div className="bg-white p-4 sm:p-6 xl:p-8 rounded-[1.5rem] border border-gray-100 shadow-sm">
                                    <h3 className="text-[11px] sm:text-xs xl:text-sm font-black text-[#5c1f20] uppercase italic mb-5 font-sans tracking-tight">Últimos Pedidos</h3>
                                    {stats.lastOrders.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-gray-100">
                                                        <th className="text-[9px] font-black text-[#696965] uppercase tracking-widest pb-3 pr-2">ID</th>
                                                        <th className="text-[9px] font-black text-[#696965] uppercase tracking-widest pb-3 pr-2">Canal</th>
                                                        <th className="text-[9px] font-black text-[#696965] uppercase tracking-widest pb-3 pr-2">Data</th>
                                                        <th className="text-[9px] font-black text-[#696965] uppercase tracking-widest pb-3 pr-2 text-right">Valor</th>
                                                        <th className="text-[9px] font-black text-[#696965] uppercase tracking-widest pb-3 text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {stats.lastOrders.map((order, i) => (
                                                        <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                                            <td className="py-2.5 pr-2 text-xs font-black text-[#5c1f20]">{order.id}</td>
                                                            <td className="py-2.5 pr-2">
                                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${order.platform === 'ifood' ? 'bg-[#5c1f20]/10 text-[#5c1f20]' : 'bg-[#c5a04a]/10 text-[#c5a04a]'}`}>
                                                                    {order.platform}
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 pr-2 text-[11px] font-medium text-[#696965]">{order.date}</td>
                                                            <td className="py-2.5 pr-2 text-xs font-black text-[#0f172a] text-right">{formatMoney(order.amount)}</td>
                                                            <td className="py-2.5 text-right">
                                                                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${order.status === 'Entregue' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                                                    {order.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-[#696965] font-bold uppercase tracking-widest">Sem pedidos registrados.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cmv' && (
                        <div className="space-y-6 xl:space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 xl:gap-8">
                                <StatCard title="Insumos" value={ingredients.length} icon={Receipt} colorClass="text-[#5c1f20]" bgColorClass="bg-[#5c1f20]/10" iconColorClass="text-[#5c1f20]" />
                                <StatCard title="Produtos" value={products.length} icon={ShoppingBag} colorClass="text-blue-700" bgColorClass="bg-blue-50" iconColorClass="text-blue-700" />
                                <StatCard title="CMV Médio" value={`${catalogMetrics.averageCmvPercent.toFixed(1)}%`} icon={PieChart} colorClass="text-green-700" bgColorClass="bg-green-50" iconColorClass="text-green-700" />
                                <StatCard title="Markup Médio" value={`${catalogMetrics.averageMarkupPercent.toFixed(1)}%`} icon={DollarSign} colorClass="text-amber-700" bgColorClass="bg-amber-50" iconColorClass="text-amber-700" />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
                                <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                                    <h3 className="text-lg font-black text-[#5c1f20] uppercase mb-6 tracking-tighter">Cadastro de Insumos</h3>
                                    <form onSubmit={handleSubmitIngredient} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                                        <CustomInput label="Nome do Insumo" value={ingredientForm.name} onChange={(e) => handleIngredientFormChange('name', e.target.value)} required />
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Unidade</label>
                                                <button type="button" onClick={() => setIsUnitModalOpen(true)} className="text-[10px] font-black text-[#c5a04a] uppercase hover:text-[#5c1f20] transition-colors">
                                                    Cadastrar Unidades
                                                </button>
                                            </div>
                                            <select
                                                value={ingredientForm.unit}
                                                onChange={(e) => handleIngredientFormChange('unit', e.target.value)}
                                                className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#c5a04a]"
                                                required
                                            >
                                                {ingredientUnits.map((unit) => (
                                                    <option key={unit.id} value={unit.label}>{unit.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <CustomInput label="Quantidade Comprada" type="number" step="0.01" value={ingredientForm.packageQuantity} onChange={(e) => handleIngredientFormChange('packageQuantity', e.target.value)} required />
                                        <CustomInput label="Custo da Compra" type="number" step="0.01" value={ingredientForm.packageCost} onChange={(e) => handleIngredientFormChange('packageCost', e.target.value)} required />
                                        <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3">
                                            <button type="submit" className="flex-1 bg-[#5c1f20] text-[#c5a04a] h-11 rounded-xl font-black uppercase text-[10px] shadow-md">
                                                {editingIngredientId ? 'Salvar Insumo' : 'Registrar Insumo'}
                                            </button>
                                            {editingIngredientId && (
                                                <button type="button" onClick={resetIngredientForm} className="flex-1 bg-gray-100 text-[#696965] h-11 rounded-xl font-black uppercase text-[10px]">
                                                    Cancelar Edição
                                                </button>
                                            )}
                                        </div>
                                    </form>

                                    <div className="mt-6 space-y-3">
                                        {ingredients.map((ingredient) => (
                                            <div key={ingredient.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="font-black text-[#5c1f20] uppercase truncate">{ingredient.name}</p>
                                                    <p className="text-xs text-[#696965] font-bold uppercase">
                                                        {ingredient.packageQuantity} {ingredient.unit} por {formatMoney(ingredient.packageCost)} | custo unitário {formatMoney(calculateIngredientUnitCost(ingredient))}
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
                                        <h3 className="text-lg font-black text-[#5c1f20] uppercase tracking-tighter">Ficha Técnica do Produto</h3>
                                        <button type="button" onClick={() => setIsPreparationModalOpen(true)} className="text-[10px] font-black text-[#c5a04a] border border-[#c5a04a] px-3 py-2 rounded-full uppercase hover:bg-[#c5a04a] hover:text-white transition-all w-full sm:w-auto">
                                            Registrar Receita
                                        </button>
                                    </div>

                                    <form onSubmit={handleAddProduct} className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <CustomInput label="Produto" name="name" required />
                                            <CustomInput label="Preço de Venda" name="salePrice" type="number" step="0.01" required />
                                            <CustomInput label="Rendimento" name="yieldQuantity" type="number" step="0.01" defaultValue="1" required />
                                            <CustomInput label="CMV Alvo (%)" name="targetCmvPercent" type="number" step="0.1" defaultValue="30" required />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-black text-[#5c1f20] uppercase">Receita / Componentes</p>
                                                <button type="button" onClick={handleAddRecipeLine} className="text-[10px] font-black text-[#c5a04a] border border-[#c5a04a] px-3 py-2 rounded-full uppercase hover:bg-[#c5a04a] hover:text-white transition-all">
                                                    Adicionar Componente
                                                </button>
                                            </div>

                                            {productRecipeDraft.map((line) => {
                                                const compatibleUnits = getCompatibleUnits(
                                                    getComponentBaseUnit(line.componentRef, ingredients, preparations),
                                                    ingredientUnits
                                                );

                                                return (
                                                    <div key={line.id} className="grid grid-cols-1 sm:grid-cols-[1fr_130px_110px_48px] gap-3 items-end">
                                                        <div className="space-y-1">
                                                            <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Componente</label>
                                                            <select
                                                                value={line.componentRef}
                                                                onChange={(e) => handleRecipeDraftChange(line.id, 'componentRef', e.target.value)}
                                                                className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#c5a04a]"
                                                            >
                                                                <option value="">Selecione</option>
                                                                <optgroup label="Insumos">
                                                                    {ingredients.map((ingredient) => (
                                                                        <option key={`product-ingredient-${ingredient.id}`} value={`ingredient:${ingredient.id}`}>
                                                                            {ingredient.name}
                                                                        </option>
                                                                    ))}
                                                                </optgroup>
                                                                <optgroup label="Receitas Base">
                                                                    {preparations.map((preparation) => (
                                                                        <option key={`product-preparation-${preparation.id}`} value={`preparation:${preparation.id}`}>
                                                                            {preparation.name}
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
                                                            <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Unidade</label>
                                                            <select
                                                                value={line.quantityUnit}
                                                                onChange={(e) => handleRecipeDraftChange(line.id, 'quantityUnit', e.target.value)}
                                                                className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#c5a04a]"
                                                                disabled={!line.componentRef}
                                                            >
                                                                <option value="">Selecione</option>
                                                                {compatibleUnits.map((unit) => (
                                                                    <option key={`product-line-unit-${line.id}-${unit.id}`} value={unit.label}>{unit.label}</option>
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

                                        <button type="submit" className="w-full bg-[#5c1f20] text-[#c5a04a] h-11 rounded-xl font-black uppercase text-[10px] shadow-md">
                                            Cadastrar Produto
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* ── Campo de busca ── */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 text-[#696965]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                    placeholder="Buscar produto por nome..."
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#c5a04a] focus:border-transparent shadow-sm transition-all"
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

                            {/* ── Lista filtrada ── */}
                            <div className="space-y-4">
                                {catalogMetrics.productSummaries
                                    .filter((p) => p.name.toLowerCase().includes(productSearchTerm.toLowerCase().trim()))
                                    .map((product) => {
                                        const cmvOk = product.metrics.cmvPercent <= product.metrics.targetCmvPercent;
                                        return (
                                            <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm">

                                                {/* ── Linha 1: Identidade + Métricas ── */}
                                                <div className="flex flex-col lg:flex-row lg:items-center gap-4 px-5 py-4">
                                                    {/* Nome e info */}
                                                    <div className="shrink-0 min-w-[180px]">
                                                        <h3 className="text-sm font-black text-[#5c1f20] uppercase tracking-tight">{product.name}</h3>
                                                        <p className="text-[10px] text-[#696965] font-semibold mt-0.5">
                                                            {product.yieldQuantity} un &nbsp;·&nbsp; Venda: {formatMoney(product.metrics.salePrice)}
                                                        </p>
                                                    </div>

                                                    {/* Divider vertical */}
                                                    <div className="hidden lg:block w-px h-10 bg-gray-100 shrink-0" />

                                                    {/* Pills de métricas */}
                                                    <div className="flex flex-wrap gap-2 flex-1">
                                                        <div className="flex flex-col items-center px-3 py-2 bg-[#5c1f20]/5 rounded-xl min-w-[90px]">
                                                            <span className="text-[9px] font-bold text-[#696965] uppercase tracking-widest mb-0.5">Custo Receita</span>
                                                            <span className="text-sm font-black text-[#5c1f20]">{formatMoney(product.metrics.recipeCost)}</span>
                                                        </div>
                                                        <div className="flex flex-col items-center px-3 py-2 bg-blue-50 rounded-xl min-w-[90px]">
                                                            <span className="text-[9px] font-bold text-[#696965] uppercase tracking-widest mb-0.5">Custo Unit.</span>
                                                            <span className="text-sm font-black text-blue-700">{formatMoney(product.metrics.unitCost)}</span>
                                                        </div>
                                                        <div className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[80px] ${cmvOk ? 'bg-green-50' : 'bg-red-50'}`}>
                                                            <span className="text-[9px] font-bold text-[#696965] uppercase tracking-widest mb-0.5">CMV Atual</span>
                                                            <span className={`text-sm font-black ${cmvOk ? 'text-green-700' : 'text-red-600'}`}>{product.metrics.cmvPercent.toFixed(1)}%</span>
                                                        </div>
                                                        <div className="flex flex-col items-center px-3 py-2 bg-amber-50 rounded-xl min-w-[80px]">
                                                            <span className="text-[9px] font-bold text-[#696965] uppercase tracking-widest mb-0.5">Markup</span>
                                                            <span className="text-sm font-black text-amber-700">{product.metrics.markupPercent.toFixed(1)}%</span>
                                                        </div>
                                                        <div className="flex flex-col items-center px-3 py-2 bg-amber-50/60 rounded-xl min-w-[90px] border border-amber-100">
                                                            <span className="text-[9px] font-bold text-[#696965] uppercase tracking-widest mb-0.5">Preço Sug.</span>
                                                            <span className="text-sm font-black text-amber-600">{formatMoney(product.metrics.suggestedPrice)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ── Linha 2: Ingredientes ── */}
                                                {product.recipe.length > 0 && (
                                                    <div className="border-t border-gray-100 px-5 py-3 flex flex-wrap gap-2">
                                                        {product.recipe.map((item, index) => {
                                                            const ingredient = item.componentType === 'ingredient'
                                                                ? ingredients.find((c) => c.id === item.componentId)
                                                                : null;
                                                            const preparation = item.componentType === 'preparation'
                                                                ? preparations.find((c) => c.id === item.componentId)
                                                                : null;
                                                            const componentName = ingredient?.name || preparation?.name || 'Componente removido';
                                                            const componentUnit = item.quantityUnit || ingredient?.unit || preparation?.yieldUnit || '';
                                                            const componentUnitCost = item.componentType === 'ingredient'
                                                                ? calculateIngredientUnitCost(ingredient)
                                                                : (catalogMetrics.preparationSummaries.find((c) => c.id === item.componentId)?.metrics.unitCost || 0);
                                                            const sourceUnit = ingredient?.unit || preparation?.yieldUnit || componentUnit;
                                                            const normalizedQuantity = convertQuantityBetweenUnits(item.quantity, componentUnit, sourceUnit);
                                                            const lineCost = componentUnitCost * normalizedQuantity;

                                                            return (
                                                                <div key={`${product.id}-${index}`} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
                                                                    <div>
                                                                        <p className="text-[10px] font-black text-[#5c1f20] uppercase leading-tight">{componentName}</p>
                                                                        <p className="text-[9px] text-[#696965] font-semibold">{item.quantity} {componentUnit}</p>
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-gray-600 bg-white border border-gray-200 rounded px-1.5 py-0.5 ml-1 shrink-0">{formatMoney(lineCost)}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* ── Linha 3: Footer de indicadores ── */}
                                                <div className="border-t border-gray-100 px-5 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                                                    <span className="text-[10px] font-bold text-[#5c1f20]">
                                                        Lucro bruto: <strong>{formatMoney(product.metrics.grossMargin)}</strong>
                                                    </span>
                                                    <span className="text-[10px] font-bold text-[#696965]">
                                                        CMV alvo: <strong>{product.metrics.targetCmvPercent.toFixed(1)}%</strong>
                                                    </span>
                                                    <span className="text-[10px] font-bold text-blue-600">
                                                        Margem s/ venda: <strong>{product.metrics.marginPercent.toFixed(1)}%</strong>
                                                    </span>
                                                    <button
                                                        onClick={() => setProducts((prev) => prev.filter((item) => item.id !== product.id))}
                                                        className="ml-auto flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-wide transition-colors"
                                                    >
                                                        <Trash2 size={11} /> Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {catalogMetrics.productSummaries.filter((p) => p.name.toLowerCase().includes(productSearchTerm.toLowerCase().trim())).length === 0 && (
                                    <p className="text-center text-sm font-bold text-[#696965] py-8 uppercase tracking-widest">
                                        Nenhum produto encontrado para &ldquo;{productSearchTerm}&rdquo;
                                    </p>
                                )}
                            </div>

                        </div>
                    )}



                    {activeTab === 'costs' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm italic font-sans">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-[#5c1f20] uppercase flex items-center gap-2 italic tracking-tighter font-sans"><Receipt size={18} /> Novo Gasto</h3>
                                    <button onClick={() => setIsCatModalOpen(true)} className="text-[9px] font-black text-[#c5a04a] border border-[#c5a04a] px-3 py-1.5 rounded-full uppercase hover:bg-[#c5a04a] hover:text-white transition-all">Categorias</button>
                                </div>
                                <form onSubmit={handleAddRecurringCost} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-[#696965] uppercase ml-1 tracking-widest font-sans not-italic">Descrição</label>
                                        <select name="desc" className="w-full px-3 py-2 bg-[#fdfffd] border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#c5a04a] not-italic">
                                            {costCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                        </select>
                                    </div>
                                    <CustomInput label="Valor" name="amount" type="number" step="0.01" required />
                                    <CustomInput label="Vencimento" name="dueDay" type="number" min="1" max="31" required />
                                    <button type="submit" className="bg-[#5c1f20] text-[#c5a04a] h-10 rounded-xl font-black uppercase text-[10px] shadow-md active:scale-95 transition-all">Registrar</button>
                                </form>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {/* Linha RH Fixa */}
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between opacity-70 italic">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Folha Salarial Real (Automático RH)</p>
                                        <p className="text-xs font-black text-[#5c1f20]">R$ {stats.folhaSalarial.toLocaleString()}</p>
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
                                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] uppercase font-black ${!isPaid && new Date().getDate() === c.dueDay ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-[#c5a04a]/10 text-[#c5a04a]'}`}>Dia {c.dueDay}</span>
                                                    {isHighlighted && <span className="px-2 py-0.5 rounded-lg text-[8px] uppercase font-black bg-amber-200 text-amber-800">Vencimento próximo</span>}
                                                    <p className={`text-xs font-black uppercase truncate ${isPaid ? 'line-through text-gray-400' : 'text-[#5c1f20]'}`}>{c.desc}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-xs font-black ${isPaid ? 'line-through text-gray-400' : 'text-gray-900'}`}>R$ {c.amount.toFixed(2)}</p>
                                                    <div className="flex items-center gap-1.5 ml-2">
                                                        <input type="number" id={`inp-${c.id}`} className="max-w-[70px] bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-[10px] font-bold outline-none not-italic" defaultValue={c.amount} disabled={isPaid} />
                                                        {!isPaid && <button onClick={() => handleUpdateCost(c.id, document.getElementById(`inp-${c.id}`).value)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"><Save size={14} /></button>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setRecurringCosts(prev => prev.filter(x => x.id !== c.id))} className="text-red-200 hover:text-red-500 p-1 transition-colors"><Trash2 size={16} /></button>
                                                <button onClick={() => togglePaymentStatus(c.id)} className={`transition-all ${isPaid ? 'text-green-600 scale-110' : 'text-gray-300 hover:text-[#5c1f20]'}`}>
                                                    {isPaid ? <CheckCircle size={28} fill="rgba(34, 197, 94, 0.1)" /> : <Circle size={28} />}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'financeiro' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 sm:p-10 rounded-[2rem] border border-gray-100 shadow-sm italic">
                                <h3 className="text-lg font-black text-[#5c1f20] uppercase mb-8 tracking-tighter">Lançamentos Financeiros</h3>
                                <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-end italic">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-[#696965] uppercase ml-1 not-italic tracking-widest">Tipo</label>
                                        <select name="type" value={financeFormType} onChange={(e) => setFinanceFormType(e.target.value)} className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-bold text-sm xl:text-base outline-none not-italic focus:ring-2 focus:ring-[#c5a04a]">
                                            <option value="receita">Entrada</option>
                                            <option value="despesa">Saída</option>
                                        </select>
                                    </div>
                                    <CustomInput label={financeFormType === 'receita' ? 'Valor de Entrada' : 'Valor de Saída'} name="amount" type="number" step="0.01" required />
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-[#696965] uppercase ml-1 not-italic tracking-widest">
                                            {financeFormType === 'receita' ? 'Canal' : 'Categoria'}
                                        </label>
                                        <select name="reference" className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-bold text-sm xl:text-base outline-none not-italic focus:ring-2 focus:ring-[#c5a04a]">
                                            {(financeFormType === 'receita' ? salesChannels : financeExpenseCategories).map((item) => (
                                                <option key={item.id} value={item.name}>{item.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-[#696965] uppercase ml-1 not-italic tracking-widest">Pagamento</label>
                                        <select name="payment" className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-bold text-sm xl:text-base outline-none not-italic focus:ring-2 focus:ring-[#c5a04a]">
                                            <option value="pix">PIX</option><option value="cartao">Cartão</option><option value="online">Online</option><option value="dinheiro">Dinheiro</option>
                                        </select>
                                    </div>
                                    <CustomInput label="Data" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                                    <CustomInput label="Observação" name="note" />
                                    <button type="submit" className="bg-[#5c1f20] text-[#c5a04a] h-11 rounded-xl font-black uppercase text-[10px] shadow-lg">Lançar</button>
                                </form>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <StatCard title="Entradas" value={formatMoney(stats.receitaLiquida)} icon={TrendingUp} colorClass="text-green-700" bgColorClass="bg-green-50" iconColorClass="text-green-700" />
                                <StatCard title="Saídas" value={formatMoney(stats.saidasLancadas)} icon={Receipt} colorClass="text-red-600" bgColorClass="bg-red-50" iconColorClass="text-red-600" />
                                <StatCard title="Taxas Canais" value={formatMoney(stats.taxasCanais)} icon={CreditCard} colorClass="text-amber-700" bgColorClass="bg-amber-50" iconColorClass="text-amber-700" />
                                <StatCard title="Saldo Operac." value={formatMoney(stats.saldoOperacional)} icon={Wallet} colorClass="text-blue-700" bgColorClass="bg-blue-50" iconColorClass="text-blue-700" />
                            </div>
                            <div className="space-y-2">
                                {transactions.map(t => (
                                    <div key={t.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between italic">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1 h-8 rounded-full ${t.type === 'receita' ? (t.platform === 'ifood' ? 'bg-[#5c1f20]' : 'bg-[#c5a04a]') : 'bg-red-500'}`} />
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-[#5c1f20] uppercase truncate font-sans">
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
                                            <button onClick={() => setTransactions(prev => prev.filter(x => x.id !== t.id))} className="text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
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
                                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${rhView === 'fixed' ? 'bg-[#5c1f20] text-[#c5a04a]' : 'bg-stone-100 text-[#5c1f20]'}`}
                                    >
                                        Funcionários Fixos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRhView('external')}
                                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${rhView === 'external' ? 'bg-[#5c1f20] text-[#c5a04a]' : 'bg-stone-100 text-[#5c1f20]'}`}
                                    >
                                        Funcionários Por Fora
                                    </button>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                                    {rhView === 'fixed' && (
                                        <button onClick={() => setIsRoleModalOpen(true)} className="text-[10px] font-black text-[#c5a04a] border border-[#c5a04a] px-3 py-2 rounded-full uppercase hover:bg-[#c5a04a] hover:text-white transition-all w-full sm:w-auto">
                                            Cargos RH
                                        </button>
                                    )}
                                    {rhView === 'fixed' && (
                                        <button onClick={() => setIsDiscountCategoryModalOpen(true)} className="text-[10px] font-black text-[#5c1f20] border border-[#5c1f20]/20 px-3 py-2 rounded-full uppercase hover:bg-[#5c1f20]/5 transition-all w-full sm:w-auto">
                                            Configurar Descontos
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => openCreateEmployeeModal(rhView === 'fixed' ? 'fixed' : 'external')}
                                        className="text-[10px] font-black bg-[#5c1f20] text-[#c5a04a] px-4 py-2 rounded-full uppercase shadow-md hover:bg-[#c5a04a] hover:text-white transition-all w-full sm:w-auto"
                                    >
                                        Cadastrar Funcionário
                                    </button>
                                </div>
                            </div>

                            {rhView === 'fixed' && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <StatCard title="Folha Bruta" value={formatMoney(payrollSummary.totals.grossPayroll)} icon={Users} colorClass="text-[#5c1f20]" bgColorClass="bg-stone-100" iconColorClass="text-[#5c1f20]" />
                                        <StatCard title="Pagamento 60%" value={formatMoney(payrollSummary.totals.salaryPaymentTotal)} icon={DollarSign} colorClass="text-[#5c1f20]" bgColorClass="bg-stone-100" iconColorClass="text-[#5c1f20]" />
                                        <StatCard title="Vale 40%" value={formatMoney(payrollSummary.totals.advanceTotal)} icon={Wallet} colorClass="text-[#5c1f20]" bgColorClass="bg-stone-100" iconColorClass="text-[#5c1f20]" />
                                        <StatCard title="Descontos" value={formatMoney(payrollSummary.totals.extraDiscountTotal)} icon={Receipt} colorClass="text-[#5c1f20]" bgColorClass="bg-stone-100" iconColorClass="text-[#5c1f20]" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {payrollAlerts.filter((alert) => !String(alert.id).startsWith('external-')).map((alert) => (
                                            <div key={alert.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black text-[#696965] uppercase tracking-widest">{alert.title}</p>
                                                    <p className="text-sm font-black text-[#5c1f20] uppercase truncate">{formatDateBr(alert.date)}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{alert.description}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-lg font-black text-[#5c1f20]">{formatMoney(alert.amount)}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{alert.daysUntil === 0 ? 'Hoje' : alert.daysUntil > 0 ? `Em ${alert.daysUntil} dia(s)` : 'Vencido'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm italic">
                                        <h3 className="text-lg font-black text-[#5c1f20] uppercase flex items-center gap-2 mb-6 tracking-tighter"><Briefcase size={20} /> Regras de Pagamento RH</h3>
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
                                                        <p className="font-black text-[#5c1f20] uppercase text-base italic break-words leading-tight whitespace-normal">{emp.name}</p>
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest break-words mt-2 whitespace-normal">{emp.role}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{emp.phone || 'SEM TELEFONE'} {emp.email ? `| ${emp.email}` : ''}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 min-w-0">
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#696965]">Salário</p><p className="text-sm font-black text-[#5c1f20]">{formatMoney(emp.grossSalary)}</p></div>
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#696965]">Descontos</p><p className="text-sm font-black text-[#5c1f20]">{formatMoney(emp.extraDiscount)}</p></div>
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#696965]">Líquido</p><p className="text-sm font-black text-gray-900">{formatMoney(emp.netSalary)}</p></div>
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#696965]">Vale 40%</p><p className="text-sm font-black text-[#5c1f20]">{formatMoney(emp.advanceAmount)}</p></div>
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#696965]">Salário 60%</p><p className="text-sm font-black text-[#5c1f20]">{formatMoney(emp.finalSalaryPayment)}</p></div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-3 items-center justify-between">
                                                    <div className="flex flex-wrap gap-3">
                                                        <span className="px-3 py-2 rounded-full bg-green-50 text-green-700 text-xs font-black uppercase">Salário em {formatDateBr(payrollSummary.salaryPaymentDate)}</span>
                                                        <span className="px-3 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase">Vale em {formatDateBr(payrollSummary.advancePaymentDate)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button type="button" onClick={() => openEmployeeDiscountsModal(emp.id)} className="bg-stone-100 text-[#5c1f20] h-10 px-4 rounded-xl font-black uppercase text-[10px]">
                                                            Ver Descontos
                                                        </button>
                                                        <button type="button" onClick={() => openEditEmployeeModal(emp)} className="bg-stone-200 text-[#5c1f20] h-10 px-4 rounded-xl font-black uppercase text-[10px]">Ver/Editar</button>
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
                                        <StatCard title="Prestadores Ativos" value={externalWorkersSummary.filter((worker) => worker.status !== 'inactive').length} icon={Users} colorClass="text-[#5c1f20]" bgColorClass="bg-stone-100" iconColorClass="text-[#5c1f20]" />
                                        <StatCard title="Próx. Pagamentos" value={externalWorkersSummary.filter((worker) => worker.nextPaymentDate).length} icon={Calendar} colorClass="text-[#5c1f20]" bgColorClass="bg-stone-100" iconColorClass="text-[#5c1f20]" />
                                        <StatCard title="Total Previsto" value={formatMoney(externalWorkersSummary.reduce((acc, worker) => acc + worker.baseAmountNumber, 0))} icon={Wallet} colorClass="text-[#5c1f20]" bgColorClass="bg-stone-100" iconColorClass="text-[#5c1f20]" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {payrollAlerts.filter((alert) => String(alert.id).startsWith('external-')).map((alert) => (
                                            <div key={alert.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black text-[#696965] uppercase tracking-widest">{alert.title}</p>
                                                    <p className="text-sm font-black text-[#5c1f20] uppercase truncate">{formatDateBr(alert.date)}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{alert.description}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-lg font-black text-[#5c1f20]">{formatMoney(alert.amount)}</p>
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
                                                        <p className="font-black text-[#5c1f20] uppercase text-base break-words leading-tight whitespace-normal">{worker.name}</p>
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest break-words mt-2 whitespace-normal">{worker.role}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{worker.phone || 'SEM TELEFONE'} {worker.email ? `| ${worker.email}` : ''}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 min-w-0 xl:min-w-[620px]">
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#696965]">Valor Base</p><p className="text-sm font-black text-[#5c1f20]">{formatMoney(worker.baseAmountNumber)}</p></div>
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#696965]">Frequência</p><p className="text-sm font-black text-[#5c1f20] uppercase">{worker.paymentMode === 'weekly' ? 'Semanal' : 'Avulso'}</p></div>
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#696965]">Próx. Data</p><p className="text-sm font-black text-[#5c1f20]">{worker.nextPaymentDate ? formatDateBr(worker.nextPaymentDate) : '--'}</p></div>
                                                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200"><p className="text-[10px] font-black uppercase text-[#696965]">Status</p><p className="text-sm font-black text-[#5c1f20] uppercase">{worker.status === 'active' ? 'Ativo' : 'Inativo'}</p></div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-3 items-center justify-between">
                                                    <div className="flex flex-wrap gap-3">
                                                        <span className="px-3 py-2 rounded-full bg-stone-100 text-[#5c1f20] text-xs font-black uppercase">
                                                            {worker.paymentMode === 'weekly' ? ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][Number(worker.weekday)] || 'Semanal' : 'Pagamento Avulso'}
                                                        </span>
                                                        {worker.notes && <span className="px-3 py-2 rounded-full bg-stone-100 text-[#5c1f20] text-xs font-black uppercase">{worker.notes}</span>}
                                                    </div>
                                                    <div className="flex gap-3 items-center">
                                                        <button type="button" onClick={() => openEditEmployeeModal(worker)} className="text-[#5c1f20] hover:text-[#c5a04a]"><Edit size={16} /></button>
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
                        <div className="max-w-5xl 2xl:max-w-6xl mx-auto italic font-black">
                            <div className="bg-white p-6 sm:p-12 xl:p-14 2xl:p-16 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 rotate-12 opacity-5"><Logo className="w-48 h-48" /></div>
                                <h3 className="text-2xl sm:text-3xl xl:text-4xl 2xl:text-5xl font-black text-[#5c1f20] uppercase tracking-tighter relative z-10 font-sans">Balanço do Mês</h3>
                                <div className="mt-8 space-y-4 relative z-10 font-sans tracking-tight">
                                    <div className="flex justify-between items-center border-b pb-2"><span className="text-[#696965] uppercase text-[10px] font-black">Entradas Brutas</span><span className="text-green-700">{formatMoney(stats.receitaBruta)}</span></div>
                                    <div className="flex justify-between items-center border-b pb-2 text-xs"><span className="text-red-500 uppercase text-[10px] font-black">Taxas de Canal</span><span>{formatMoney(stats.taxasCanais)}</span></div>
                                    <div className="flex justify-between items-center border-b pb-2 text-xs"><span className="text-[#696965] uppercase text-[10px] font-black">Entradas Líquidas</span><span>{formatMoney(stats.receitaLiquida)}</span></div>
                                    <div className="flex justify-between items-center border-b pb-2 text-xs"><span className="text-red-500 uppercase text-[10px] font-black">Saídas Lançadas</span><span>{formatMoney(stats.saidasLancadas)}</span></div>
                                    <div className="flex justify-between items-center border-b pb-2 text-xs"><span className="text-red-500 uppercase text-[10px] font-black">Folha Salarial Real</span><span>{formatMoney(stats.folhaSalarial)}</span></div>
                                    <div className="flex justify-between items-center border-b pb-2 text-xs"><span className="text-red-500 uppercase text-[10px] font-black">Custos Fixos</span><span>{formatMoney(stats.custosFixosTotal - stats.folhaSalarial)}</span></div>
                                    <div className="flex justify-between items-center border-b pb-2 text-xs"><span className="text-[#696965] uppercase text-[10px] font-black">Saldo Operacional</span><span>{formatMoney(stats.saldoOperacional)}</span></div>
                                    <div className="mt-8 bg-[#5c1f20] p-6 rounded-[1.5rem] text-white shadow-xl italic">
                                        <p className="text-[10px] font-black text-[#c5a04a] uppercase tracking-widest mb-1">Sobrou no Reino</p>
                                        <h4 className="text-2xl sm:text-4xl font-black tracking-tighter truncate font-mono">{formatMoney(stats.saldoFinal)}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-5xl 2xl:max-w-6xl mx-auto font-black italic">
                            <div className="bg-white p-6 sm:p-10 rounded-[2rem] border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-black text-[#5c1f20] uppercase mb-8 flex items-center gap-3 font-sans"><Settings size={22} /> Configurações</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    <button type="button" onClick={() => setIsChannelModalOpen(true)} className="bg-[#5c1f20]/5 text-[#5c1f20] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#5c1f20]/10">
                                        Cadastrar Canais
                                    </button>
                                    <button type="button" onClick={() => setIsFinanceCategoryModalOpen(true)} className="bg-[#c5a04a]/10 text-[#5c1f20] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#c5a04a]/20">
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
                                            <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Nova Senha</label>
                                            <input
                                                name="appPassword"
                                                type="password"
                                                onKeyUp={handlePasswordKeyboardState}
                                                onKeyDown={handlePasswordKeyboardState}
                                                className="w-full px-4 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c5a04a] outline-none transition-all text-sm xl:text-base font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Confirmar Senha</label>
                                            <input
                                                name="confirmPassword"
                                                type="password"
                                                onKeyUp={handlePasswordKeyboardState}
                                                onKeyDown={handlePasswordKeyboardState}
                                                className="w-full px-4 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c5a04a] outline-none transition-all text-sm xl:text-base font-medium"
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
                                    <button type="submit" className="w-full bg-[#5c1f20] text-[#fdfffd] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#c5a04a] shadow-xl">Salvar</button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
