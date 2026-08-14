import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, Upload } from 'lucide-react';

const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export default function CatalogExcelTools({ ingredients, products, preparations, onImport }) {
  const fileInput = useRef(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const exportWorkbook = () => {
    const ingredientRows = ingredients.map((item) => ({
      'ID do insumo': item.id, Nome: item.name, Unidade: item.unit, 'Custo unitário': number(item.unitCost)
    }));
    const recipeRows = products.flatMap((product) => (product.recipe || []).map((line) => {
      const component = line.componentType === 'ingredient'
        ? ingredients.find((item) => item.id === line.componentId)
        : preparations.find((item) => item.id === line.componentId);
      return {
        'ID do produto': product.id, Produto: product.name, 'Preço de venda': number(product.salePrice), Rendimento: number(product.yieldQuantity, 1), 'CMV alvo (%)': number(product.targetCmvPercent, 30),
        'Tipo do componente': line.componentType, 'ID do componente': line.componentId, Componente: component?.name || '', Quantidade: number(line.quantity), Unidade: line.quantityUnit || ''
      };
    }));
    const instructions = [{ Instruções: 'Edite apenas as abas Insumos e Fichas Técnicas. Mantenha os IDs para atualizar registros existentes; deixe o ID vazio para criar novos registros. Cada linha em Fichas Técnicas é um componente da receita.' }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(instructions), 'LEIA-ME');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(ingredientRows), 'Insumos');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(recipeRows), 'Fichas Técnicas');
    XLSX.writeFile(workbook, 'modelo-cmv-ficha-tecnica.xlsx');
  };

  const importWorkbook = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setMessage('');
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      if (!workbook.SheetNames.includes('Insumos') || !workbook.SheetNames.includes('Fichas Técnicas')) throw new Error('Use o modelo exportado pelo sistema, com as abas Insumos e Fichas Técnicas.');
      const ingredientsRows = XLSX.utils.sheet_to_json(workbook.Sheets.Insumos, { defval: '' });
      const recipeRows = XLSX.utils.sheet_to_json(workbook.Sheets['Fichas Técnicas'], { defval: '' });
      await onImport({ ingredientsRows, recipeRows });
      setMessage('Importação concluída com sucesso.');
    } catch (error) { setMessage(error.message || 'Não foi possível importar a planilha.'); }
    finally { setBusy(false); event.target.value = ''; }
  };

  return <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={exportWorkbook} className="inline-flex items-center gap-2 rounded-xl border border-[#D4A373] px-3 py-2 text-[10px] font-black uppercase text-[#8A5A2B] hover:bg-[#FFF8EC]"><Download size={14} />Exportar Excel</button><button type="button" onClick={() => fileInput.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#2A1E15] px-3 py-2 text-[10px] font-black uppercase text-white disabled:opacity-50"><Upload size={14} />{busy ? 'Importando...' : 'Importar Excel'}</button><input ref={fileInput} type="file" accept=".xlsx,.xls" onChange={importWorkbook} className="hidden" />{message && <span className="w-full text-[10px] font-bold text-[#6F6258]">{message}</span>}</div>;
}
