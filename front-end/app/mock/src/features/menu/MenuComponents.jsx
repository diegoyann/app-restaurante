import React from 'react';
import {
  Camera,
  ChefHat,
  Check,
  Copy,
  Edit,
  Eye,
  ImagePlus,
  List,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import {
  menuStatusOptions,
  resolveLinkedComponentMeta,
  summarizeComboGroups
} from './menuModel.js';

const DefaultCustomInput = ({ label, ...props }) => (
  <div className="space-y-1 w-full">
    <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">{label}</label>
    <input
      {...props}
      className="w-full pl-4 pr-4 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c5a04a] outline-none transition-all text-sm xl:text-base font-medium"
    />
  </div>
);

export const MenuCategoryManager = ({
  CustomInput,
  categories,
  categoryForm,
  editingCategoryId,
  onCategoryFormChange,
  onSubmitCategory,
  onEditCategory,
  onDeleteCategory,
  onCancelEdit,
  isModalContent = false
}) => {
  const InputComponent = CustomInput ?? DefaultCustomInput;

  return (
  <div className={isModalContent ? 'space-y-5' : 'bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-5'}>
    {!isModalContent && (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black text-[#c5a04a] uppercase tracking-[0.25em]">Categorias</p>
          <h3 className="text-lg font-black text-[#5c1f20] uppercase tracking-tighter">Organização do cardápio</h3>
        </div>
        {editingCategoryId && (
          <button type="button" onClick={onCancelEdit} className="text-[10px] font-black text-[#696965] border border-gray-200 px-4 py-2 rounded-full uppercase hover:border-[#5c1f20] hover:text-[#5c1f20] transition-all w-full sm:w-auto">
            Cancelar edição
          </button>
        )}
      </div>
    )}

    <form onSubmit={onSubmitCategory} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_220px] gap-3">
      <InputComponent label="Nome da categoria" value={categoryForm.name} onChange={(e) => onCategoryFormChange('name', e.target.value)} required />
      <button type="submit" className="bg-[#5c1f20] text-[#c5a04a] h-11 mt-auto rounded-xl font-black uppercase text-[10px] shadow-md">
        {editingCategoryId ? 'Salvar categoria' : 'Cadastrar categoria'}
      </button>
    </form>

    <div className="menu-category-manager-list">
      {categories.map((category) => (
        <div key={category.id} className="menu-category-manager-item">
          <p className="text-sm font-black text-[#5c1f20] uppercase tracking-tight">{category.name}</p>
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
};

export const MenuItemFormPanel = ({
  CustomInput,
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
}) => {
  const InputComponent = CustomInput ?? DefaultCustomInput;

  return (
  <div className={isModalContent ? 'space-y-6' : 'bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6'}>
    {!isModalContent && (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black text-[#c5a04a] uppercase tracking-[0.25em]">Itens</p>
          <h3 className="text-lg font-black text-[#5c1f20] uppercase tracking-tighter">Cadastro de item</h3>
        </div>
        {editingMenuItemId && (
          <button type="button" onClick={onResetMenuItemForm} className="text-[10px] font-black text-[#696965] border border-gray-200 px-4 py-2 rounded-full uppercase hover:border-[#5c1f20] hover:text-[#5c1f20] transition-all w-full sm:w-auto">
            Cancelar edição
          </button>
        )}
      </div>
    )}

    <form onSubmit={onSubmitMenuItem} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputComponent label="Nome do item" value={menuItemForm.name} onChange={(e) => onMenuItemFormChange('name', e.target.value)} required />
        <InputComponent label="Preço" type="number" step="0.01" value={menuItemForm.salePrice} onChange={(e) => onMenuItemFormChange('salePrice', e.target.value)} required />
        <div className="space-y-1">
          <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Categoria</label>
          <select value={menuItemForm.category} onChange={(e) => onMenuItemFormChange('category', e.target.value)} className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#c5a04a]" required>
            <option value="">Selecione</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Visibilidade</label>
          <select value={menuItemForm.status} onChange={(e) => onMenuItemFormChange('status', e.target.value)} className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#c5a04a]">
            {menuStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Descrição</label>
        <textarea value={menuItemForm.description} onChange={(e) => onMenuItemFormChange('description', e.target.value)} rows={4} className="w-full px-4 py-3 bg-[#fdfffd] border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#c5a04a] outline-none transition-all text-sm xl:text-base font-medium resize-none" placeholder="Descreva sabor, recheio, acompanhamentos ou diferenciais do item." required />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4">
        <div className="space-y-3">
          <div className="menu-photo-dropzone">
            {menuItemForm.photoPreview ? (
              <img src={menuItemForm.photoPreview} alt={menuItemForm.name || 'Preview do item'} className="menu-photo-preview" />
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-2 px-6">
                <ImagePlus size={28} className="text-[#c5a04a]" />
                <p className="text-xs font-black text-[#5c1f20] uppercase tracking-widest">Foto do item</p>
                <p className="text-[11px] text-[#696965] font-semibold">Imagem ilustrativa para o cardápio digital.</p>
              </div>
            )}
          </div>
          <label className="bg-[#5c1f20] text-[#c5a04a] h-11 rounded-xl font-black uppercase text-[10px] shadow-md flex items-center justify-center gap-2 cursor-pointer">
            <Camera size={15} /> Selecionar foto
            <input type="file" accept="image/*" className="hidden" onChange={onMenuItemPhotoChange} />
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-[#5c1f20] uppercase">Receitas vinculadas</p>
              <p className="text-[11px] text-[#696965] font-semibold">Aqui entram só os produtos finais do catálogo. Insumo e base interna não pertencem a essa etapa.</p>
            </div>
            <div className="menu-link-counter">{menuItemForm.linkedComponentIds.length} selecionado(s)</div>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#696965]" />
            <input type="text" value={menuComponentSearch} onChange={(e) => onMenuComponentSearchChange(e.target.value)} placeholder="Buscar produto final para vincular..." className="w-full pl-10 pr-4 py-3 bg-[#fdfffd] border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#c5a04a]" />
          </div>

          <div className="menu-component-list custom-scrollbar">
            {filteredMenuComponentOptions.map((component) => {
              const selected = menuItemForm.linkedComponentIds.includes(component.key);

              return (
                <button key={component.key} type="button" onClick={() => onToggleMenuComponent(component.key)} className={`menu-component-option ${selected ? 'menu-component-option--selected' : ''}`}>
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'bg-[#5c1f20] border-[#5c1f20] text-white' : 'border-gray-300 text-transparent'}`}>
                      <Check size={12} />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-black text-[#5c1f20] uppercase truncate">{component.name}</p>
                      <p className="text-[11px] text-[#696965] font-semibold leading-relaxed">{component.subtitle}</p>
                    </div>
                  </div>
                  <span className="menu-component-tag">{component.tag}</span>
                </button>
              );
            })}

            {filteredMenuComponentOptions.length === 0 && (
              <div className="menu-empty-state">
                <Sparkles size={16} className="text-[#c5a04a]" />
                <span>Nenhuma receita final encontrada para o filtro informado.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <button type="submit" className="w-full bg-[#5c1f20] text-[#c5a04a] h-11 rounded-xl font-black uppercase text-[10px] shadow-md">
        {editingMenuItemId ? 'Salvar item' : 'Cadastrar item'}
      </button>
    </form>
  </div>
  );
};

export const MenuCategoryModal = ({
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
  CustomInput = DefaultCustomInput
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] p-5 sm:p-7 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[11px] font-black text-[#c5a04a] uppercase tracking-[0.25em]">Categorias</p>
            <h3 className="text-2xl font-black text-[#5c1f20] uppercase tracking-tighter">Organização do cardápio</h3>
            <p className="text-xs font-semibold text-[#7a6262] mt-2">Cadastre, renomeie ou limpe categorias sem deixar esse formulário aberto ocupando a tela inteira.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"><X size={20} /></button>
        </div>

        <MenuCategoryManager
          CustomInput={CustomInput}
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

export const MenuItemModal = ({
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
  CustomInput = DefaultCustomInput
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] p-5 sm:p-7 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-[11px] font-black text-[#c5a04a] uppercase tracking-[0.25em]">Itens</p>
            <h3 className="text-2xl font-black text-[#5c1f20] uppercase tracking-tighter">Cadastro de item</h3>
            <p className="text-xs font-semibold text-[#7a6262] mt-2">Abra, preencha, salva e sai. Muito melhor do que deixar o formulário plantado na página o tempo todo.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"><X size={20} /></button>
        </div>

        <MenuItemFormPanel
          CustomInput={CustomInput}
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

export const ComboEditorModal = ({
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
  formatMoney,
  CustomInput
}) => {
  if (!isOpen) return null;

  const InputComponent = CustomInput ?? DefaultCustomInput;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-6xl rounded-[2.5rem] p-5 sm:p-7 shadow-2xl border border-gray-100 max-h-[94vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] font-black text-[#c5a04a] uppercase tracking-[0.25em]">Combos</p>
            <h3 className="text-2xl font-black text-[#5c1f20] uppercase tracking-tighter">{editingComboId ? 'Editar combo' : 'Novo combo'}</h3>
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
                    <ImagePlus size={28} className="text-[#c5a04a]" />
                    <p className="text-xs font-black text-[#5c1f20] uppercase tracking-widest">Foto do combo</p>
                    <p className="text-[11px] text-[#696965] font-semibold">Use uma capa forte. Combo sem cara de produto vende pior.</p>
                  </div>
                )}
              </div>
              <label className="bg-[#5c1f20] text-[#c5a04a] h-11 rounded-xl font-black uppercase text-[10px] shadow-md flex items-center justify-center gap-2 cursor-pointer">
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
                  <InputComponent label="Nome do combo" value={comboForm.name} onChange={(e) => onComboFormChange('name', e.target.value)} required />
                  <InputComponent label="Preço base" type="number" step="0.01" value={comboForm.basePrice} onChange={(e) => onComboFormChange('basePrice', e.target.value)} required />
                <div className="space-y-1">
                  <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Categoria</label>
                  <select value={comboForm.category} onChange={(e) => onComboFormChange('category', e.target.value)} className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#c5a04a]" required>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Visibilidade</label>
                  <select value={comboForm.status} onChange={(e) => onComboFormChange('status', e.target.value)} className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#c5a04a]">
                    {menuStatusOptions.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Descrição</label>
                <textarea value={comboForm.description} onChange={(e) => onComboFormChange('description', e.target.value)} rows={4} className="w-full px-4 py-3 bg-[#fdfffd] border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#c5a04a] outline-none transition-all text-sm xl:text-base font-medium resize-none" placeholder="Explique a lógica do combo, quantidade, proposta e percepção de valor." required />
              </div>
            </div>
          </div>

          <div className="combo-editor-groups">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black text-[#c5a04a] uppercase tracking-[0.25em]">Grupos do combo</p>
                <h4 className="text-xl font-black text-[#5c1f20] uppercase tracking-tighter">Monte a estrutura como na operação real</h4>
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
                          <InputComponent label="Nome do grupo" value={group.name} onChange={(e) => onComboGroupChange(group.id, 'name', e.target.value)} required />
                          <InputComponent label="Mínimo" type="number" min="0" step="1" value={group.minSelect} onChange={(e) => onComboGroupChange(group.id, 'minSelect', e.target.value)} required />
                          <InputComponent label="Máximo" type="number" min="1" step="1" value={group.maxSelect} onChange={(e) => onComboGroupChange(group.id, 'maxSelect', e.target.value)} required />
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
                                    <InputComponent label="Opção" value={option.name} onChange={(e) => onComboOptionChange(group.id, option.id, 'name', e.target.value)} required />
                            <div className="space-y-1">
                              <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Vínculo técnico</label>
                              <select value={option.linkedComponentRef} onChange={(e) => onComboOptionChange(group.id, option.id, 'linkedComponentRef', e.target.value)} className="w-full px-3 py-2.5 xl:py-3 bg-[#fdfffd] border border-gray-200 rounded-xl font-medium text-sm xl:text-base outline-none focus:ring-2 focus:ring-[#c5a04a]">
                                <option value="">Manual / sem vínculo</option>
                                {menuComponentOptions.map((component) => (
                                  <option key={component.key} value={component.key}>{component.name} · {component.tag}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="combo-option-row__pricing">
                                    <InputComponent label="Adicional" type="number" min="0" step="0.01" value={option.extraPrice} onChange={(e) => onComboOptionChange(group.id, option.id, 'extraPrice', e.target.value)} />
                                    <InputComponent label="Máx." type="number" min="1" step="1" value={option.maxQty} onChange={(e) => onComboOptionChange(group.id, option.id, 'maxQty', e.target.value)} />
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

          <button type="submit" className="w-full bg-[#5c1f20] text-[#c5a04a] h-12 rounded-xl font-black uppercase text-[11px] shadow-md">
            {editingComboId ? 'Salvar combo' : 'Cadastrar combo'}
          </button>
        </form>
      </div>
    </div>
  );
};
