import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { selectPurchaseOrders } from "./purchaseOrderViewModel.js";
import {
  AlertTriangle,
  Check,
  Download,
  PackageCheck,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Truck,
  X,
} from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => today().slice(0, 7);
const money = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value) || 0,
  );
const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-[#2A1E15] outline-none focus:ring-2 focus:ring-[#D4A373]";
const buttonPrimary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#2A1E15] px-4 py-2 text-xs font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-50";
const buttonSecondary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-black uppercase text-[#2A1E15] disabled:cursor-not-allowed disabled:opacity-50";

const statusLabels = {
  DRAFT: "Rascunho",
  ORDERED: "Pedido realizado",
  AWAITING_DELIVERY: "Aguardando entrega",
  PARTIALLY_RECEIVED: "Recebido parcialmente",
  RECEIVED: "Recebido",
  CANCELLED: "Cancelado",
  OPEN: "Aberto",
  REOPENED: "Reaberto",
  CLOSED: "Fechado",
  ACTIVE: "Ativo",
  REVERSED: "Estornado",
};

function Field({ label, children, compact = false }) {
  return (
    <label className="space-y-1 text-xs font-black uppercase text-[#6F6258]">
      <span className={compact ? "lg:sr-only" : ""}>{label}</span>
      {children}
    </label>
  );
}

function CurrencyField({ value, onChange, ariaLabel }) {
  const [focused, setFocused] = useState(false);
  const numericValue = Number(value);
  const displayValue = focused
    ? value === "" || value == null
      ? ""
      : String(value).replace(".", ",")
    : money(Number.isFinite(numericValue) ? numericValue : 0);

  return (
    <input
      aria-label={ariaLabel}
      type="text"
      inputMode="decimal"
      placeholder="R$ 0,00"
      className={`${inputClass} tabular-nums`}
      value={displayValue}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(event) => {
        const clean = event.target.value
          .replace(/[^\d,.-]/g, "")
          .replace(",", ".");
        onChange(clean);
      }}
    />
  );
}

function Modal({ title, children, onClose, destructive = false }) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4"
      role={destructive ? "alertdialog" : "dialog"}
      aria-modal="true"
      aria-label={title}
    >
      <section className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-[#FAF6EF] p-5 shadow-2xl sm:p-7">
        <header className="mb-5 flex items-center justify-between gap-3">
          <h3 className="text-xl font-black text-[#2A1E15] text-balance">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#6F6258] hover:bg-stone-200"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Notice({ error, success }) {
  if (!error && !success) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm font-bold ${error ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"}`}
    >
      {error || success}
    </div>
  );
}

export function SuppliersPage({ ingredients, data, onSave, onDelete, busy }) {
  const [editing, setEditing] = useState(null);
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [message, setMessage] = useState({});
  const open = (supplier = {}) =>
    setEditing({
      id: supplier.id,
      name: supplier.name || "",
      document: supplier.document || "",
      phone: supplier.phone || "",
      whatsapp: supplier.whatsapp || "",
      email: supplier.email || "",
      notes: supplier.notes || "",
      orderWeekday: supplier.orderWeekday ?? "",
      deliveryLeadDays: supplier.deliveryLeadDays ?? 0,
      paymentTermType: supplier.paymentTermType || "DAYS_AFTER_RECEIPT",
      paymentTermDays: supplier.paymentTermDays ?? 0,
      defaultPaymentMethod: supplier.defaultPaymentMethod || "BOLETO",
      defaultFinancialOrigin: supplier.defaultFinancialOrigin || "BANK",
      active: supplier.active !== false,
      ingredientIds: (supplier.ingredientLinks || [])
        .filter((link) => link.active)
        .map((link) => String(link.ingredientId)),
    });
  const submit = async (event) => {
    event.preventDefault();
    setMessage({});
    if (!editing.name.trim())
      return setMessage({ error: "Informe o nome do fornecedor." });
    try {
      const saved = await onSave({ ...editing, name: editing.name.trim() });
      if (!saved)
        throw new Error(
          "O fornecedor não foi confirmado pelo servidor. Aguarde e tente novamente.",
        );
      setEditing(null);
      setMessage({ success: "Fornecedor salvo e vínculos atualizados." });
    } catch (error) {
      setMessage({
        error: error.message || "Não foi possível salvar o fornecedor.",
      });
    }
  };
  const suppliers = data.suppliers || [];
  const visibleSuppliers = showInactive
    ? suppliers
    : suppliers.filter((supplier) => supplier.active);
  const inactiveCount = suppliers.filter((supplier) => !supplier.active).length;
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-2xl font-black text-[#2A1E15] text-balance">
            Fornecedores
          </h3>
          <p className="text-sm text-[#6F6258] text-pretty">
            Condições comerciais e insumos autorizados por fornecedor.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {inactiveCount > 0 && (
            <button
              type="button"
              className={buttonSecondary}
              onClick={() => setShowInactive((value) => !value)}
            >
              {showInactive
                ? "Ocultar arquivados"
                : `Mostrar arquivados (${inactiveCount})`}
            </button>
          )}
          <button className={buttonPrimary} onClick={() => open()}>
            <Plus size={16} /> Novo fornecedor
          </button>
        </div>
      </header>
      <Notice {...message} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleSuppliers.map((supplier) => {
          const activeLinks =
            supplier.ingredientLinks?.filter((link) => link.active) || [];
          const supplierOrders = (data.orders || []).filter(
            (order) => order.supplierId === supplier.id,
          );
          return (
            <article
              key={supplier.id}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-black text-[#2A1E15]">{supplier.name}</h4>
                  <p className="text-xs text-[#6F6258]">
                    {supplier.email ||
                      supplier.whatsapp ||
                      supplier.phone ||
                      "Sem contato"}
                  </p>
                </div>
                <span
                  className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${supplier.active ? "bg-green-50 text-green-700" : "bg-stone-100 text-stone-500"}`}
                >
                  {supplier.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-[#6F6258]">Prazo</dt>
                  <dd className="font-black">D+{supplier.paymentTermDays}</dd>
                </div>
                <div>
                  <dt className="text-[#6F6258]">Entrega</dt>
                  <dd className="font-black">
                    {supplier.deliveryLeadDays} dia(s)
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6F6258]">Insumos</dt>
                  <dd className="font-black">{activeLinks.length}</dd>
                </div>
                <div>
                  <dt className="text-[#6F6258]">Pedidos</dt>
                  <dd className="font-black">{supplierOrders.length}</dd>
                </div>
              </dl>
              <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                <button
                  className={buttonSecondary}
                  onClick={() => open(supplier)}
                >
                  Editar cadastro
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 text-red-700 hover:bg-red-100 disabled:opacity-50"
                  onClick={() =>
                    setPendingDeletion({
                      ...supplier,
                      orderCount: supplierOrders.length,
                    })
                  }
                  disabled={busy}
                  aria-label={`Excluir fornecedor ${supplier.name}`}
                  title={`Excluir fornecedor ${supplier.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          );
        })}
        {!visibleSuppliers.length && (
          <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-sm text-[#6F6258]">
            {inactiveCount > 0 && !showInactive
              ? "Nenhum fornecedor ativo. Use “Mostrar arquivados” para consultar ou reativar cadastros."
              : "Nenhum fornecedor cadastrado."}
          </p>
        )}
      </div>
      {editing && (
        <Modal
          title={editing.id ? "Editar fornecedor" : "Novo fornecedor"}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Nome">
                <input
                  className={inputClass}
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                  required
                />
              </Field>
              <Field label="Documento">
                <input
                  className={inputClass}
                  value={editing.document}
                  onChange={(e) =>
                    setEditing({ ...editing, document: e.target.value })
                  }
                />
              </Field>
              <Field label="E-mail">
                <input
                  type="email"
                  className={inputClass}
                  value={editing.email}
                  onChange={(e) =>
                    setEditing({ ...editing, email: e.target.value })
                  }
                />
              </Field>
              <Field label="Telefone">
                <input
                  className={inputClass}
                  value={editing.phone}
                  onChange={(e) =>
                    setEditing({ ...editing, phone: e.target.value })
                  }
                />
              </Field>
              <Field label="WhatsApp">
                <input
                  className={inputClass}
                  value={editing.whatsapp}
                  onChange={(e) =>
                    setEditing({ ...editing, whatsapp: e.target.value })
                  }
                />
              </Field>
              <Field label="Dia semanal do pedido">
                <select
                  className={inputClass}
                  value={editing.orderWeekday}
                  onChange={(e) =>
                    setEditing({ ...editing, orderWeekday: e.target.value })
                  }
                >
                  <option value="">Não definido</option>
                  {[
                    "Domingo",
                    "Segunda",
                    "Terça",
                    "Quarta",
                    "Quinta",
                    "Sexta",
                    "Sábado",
                  ].map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Prazo de entrega (dias)">
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={editing.deliveryLeadDays}
                  onChange={(e) =>
                    setEditing({ ...editing, deliveryLeadDays: e.target.value })
                  }
                />
              </Field>
              <Field label="Vencimento">
                <select
                  className={inputClass}
                  value={editing.paymentTermType}
                  onChange={(e) =>
                    setEditing({ ...editing, paymentTermType: e.target.value })
                  }
                >
                  <option value="DAYS_AFTER_RECEIPT">
                    Dias após recebimento
                  </option>
                  <option value="ON_RECEIPT">No recebimento</option>
                </select>
              </Field>
              <Field label="Dias para pagar">
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={editing.paymentTermDays}
                  onChange={(e) =>
                    setEditing({ ...editing, paymentTermDays: e.target.value })
                  }
                />
              </Field>
              <Field label="Pagamento sugerido">
                <select
                  className={inputClass}
                  value={editing.defaultPaymentMethod}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      defaultPaymentMethod: e.target.value,
                    })
                  }
                >
                  {["PIX", "TRANSFER", "BOLETO", "CARD", "CASH", "OTHER"].map(
                    (item) => (
                      <option key={item}>{item}</option>
                    ),
                  )}
                </select>
              </Field>
              <Field label="Origem sugerida">
                <select
                  className={inputClass}
                  value={editing.defaultFinancialOrigin}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      defaultFinancialOrigin: e.target.value,
                    })
                  }
                >
                  <option value="BANK">Conta bancária</option>
                  <option value="CASH">Dinheiro</option>
                </select>
              </Field>
              <label className="flex items-center gap-2 pt-6 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(e) =>
                    setEditing({ ...editing, active: e.target.checked })
                  }
                />{" "}
                Fornecedor ativo
              </label>
            </div>
            <Field label="Observações">
              <textarea
                className={inputClass}
                rows="2"
                value={editing.notes}
                onChange={(e) =>
                  setEditing({ ...editing, notes: e.target.value })
                }
              />
            </Field>
            <fieldset>
              <legend className="mb-2 text-xs font-black uppercase text-[#6F6258]">
                Insumos fornecidos
              </legend>
              <div className="grid max-h-52 gap-2 overflow-y-auto rounded-2xl border border-stone-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-3">
                {ingredients
                  .filter((item) => item.active !== false)
                  .map((ingredient) => (
                    <label
                      key={ingredient.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={editing.ingredientIds.includes(
                          String(ingredient.id),
                        )}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            ingredientIds: e.target.checked
                              ? [
                                  ...editing.ingredientIds,
                                  String(ingredient.id),
                                ]
                              : editing.ingredientIds.filter(
                                  (id) => id !== String(ingredient.id),
                                ),
                          })
                        }
                      />
                      {ingredient.name}
                    </label>
                  ))}
              </div>
            </fieldset>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={buttonSecondary}
                onClick={() => setEditing(null)}
              >
                Cancelar
              </button>
              <button className={buttonPrimary} disabled={busy}>
                <Save size={16} /> Salvar
              </button>
            </div>
          </form>
        </Modal>
      )}
      {pendingDeletion && (
        <Modal
          title="Remover fornecedor?"
          destructive
          onClose={() => setPendingDeletion(null)}
        >
          <div className="space-y-5">
            <p className="text-sm font-bold leading-relaxed text-[#6F6258]">
              Você está prestes a remover{" "}
              <strong className="text-[#2A1E15]">{pendingDeletion.name}</strong>{" "}
              da operação e desativar seus vínculos com insumos.
            </p>
            {pendingDeletion.orderCount > 0 ? (
              <Notice
                success={`Como há ${pendingDeletion.orderCount} pedido(s), o cadastro será arquivado e deixará de aparecer entre os fornecedores ativos. O histórico financeiro será preservado.`}
              />
            ) : (
              <Notice success="Sem histórico de compras, o cadastro será excluído permanentemente. Se existir histórico de preços, o sistema o arquivará para preservar os dados." />
            )}
            <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <button
                type="button"
                className={buttonSecondary}
                onClick={() => setPendingDeletion(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-xs font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy}
                onClick={async () => {
                  try {
                    setMessage({});
                    const deleted = await onDelete(pendingDeletion.id);
                    if (!deleted)
                      throw new Error("O servidor não confirmou a remoção.");
                    setPendingDeletion(null);
                    setMessage({
                      success: deleted.archived
                        ? "Fornecedor arquivado. O histórico foi preservado."
                        : "Fornecedor excluído permanentemente.",
                    });
                  } catch (error) {
                    setPendingDeletion(null);
                    setMessage({
                      error:
                        error.message ||
                        "Não foi possível remover o fornecedor.",
                    });
                  }
                }}
              >
                <Trash2 size={16} />{" "}
                {busy ? "Removendo..." : "Remover fornecedor"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function remainingFor(order, item) {
  const received = (order.receipts || [])
    .filter((receipt) => receipt.status === "ACTIVE")
    .flatMap((receipt) => receipt.items || [])
    .filter((row) => String(row.purchaseOrderItemId) === String(item.id))
    .reduce((sum, row) => sum + Number(row.receivedQuantity || 0), 0);
  return Math.max(Number(item.orderedQuantity || 0) - received, 0);
}

export function PurchasesPage({
  ingredients,
  data,
  storeName = "Rei das Esfihas",
  onSave,
  onStatus,
  onReceive,
  onReverse,
  onOpenSuppliers,
  busy,
}) {
  const [orderForm, setOrderForm] = useState(null);
  const [receiptForm, setReceiptForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [message, setMessage] = useState({});
  const [month, setMonth] = useState(currentMonth);
  const [view, setView] = useState("ACTIVE");
  const ingredientMap = useMemo(
    () => new Map(ingredients.map((item) => [String(item.id), item])),
    [ingredients],
  );
  const supplierMap = useMemo(
    () =>
      new Map((data.suppliers || []).map((item) => [String(item.id), item])),
    [data.suppliers],
  );
  const activeSuppliers = (data.suppliers || []).filter((item) => item.active);
  const visibleOrders = useMemo(
    () => selectPurchaseOrders(data.orders, { month, view }),
    [data.orders, month, view],
  );
  const newOrder = () => {
    if (!activeSuppliers.length) {
      setMessage({
        error:
          "Cadastre e ative um fornecedor com pelo menos um insumo vinculado antes de criar um pedido.",
      });
      return;
    }
    setMessage({});
    setOrderForm({
      supplierId: "",
      orderDate: today(),
      status: "DRAFT",
      notes: "",
      items: [],
    });
  };
  const editOrder = (order) => {
    const hasActiveReceipt = (order.receipts || []).some(
      (receipt) => receipt.status === "ACTIVE",
    );
    if (
      hasActiveReceipt ||
      !["DRAFT", "ORDERED", "AWAITING_DELIVERY"].includes(order.status)
    ) {
      setMessage({
        error:
          "Pedido com recebimento não pode ser editado livremente. Use recebimento ou estorno para preservar estoque e financeiro.",
      });
      return;
    }
    setMessage({});
    setOrderForm({
      id: order.id,
      supplierId: order.supplierId,
      orderDate: order.orderDate,
      status: order.status,
      notes: order.notes || "",
      items: order.items.map((item) => ({
        ingredientId: item.ingredientId,
        orderedQuantity: item.orderedQuantity,
        estimatedUnitPrice: item.estimatedUnitPrice ?? "",
        observation: item.observation || "",
      })),
    });
  };
  const linkedIngredients = orderForm
    ? (supplierMap.get(String(orderForm.supplierId))?.ingredientLinks || [])
        .filter((link) => link.active)
        .map((link) => ingredientMap.get(String(link.ingredientId)))
        .filter(Boolean)
    : [];
  const submitOrder = async (event) => {
    event.preventDefault();
    setMessage({});
    if (!orderForm.supplierId)
      return setMessage({ error: "Selecione um fornecedor." });
    if (!linkedIngredients.length)
      return setMessage({
        error:
          "Este fornecedor não possui insumos ativos vinculados. Atualize o cadastro do fornecedor antes de continuar.",
      });
    if (!orderForm.items.length)
      return setMessage({ error: "Adicione ao menos um item ao pedido." });
    try {
      const saved = await onSave(orderForm);
      if (!saved)
        throw new Error(
          "O pedido não foi confirmado pelo servidor. Aguarde e tente novamente.",
        );
      setOrderForm(null);
      setMessage({ success: "Pedido salvo." });
    } catch (error) {
      setMessage({
        error: error.message || "Não foi possível salvar o pedido.",
      });
    }
  };
  const openReceipt = (order) =>
    setReceiptForm({
      purchaseOrderId: order.id,
      receivedAt: today(),
      observation: "",
      items: order.items
        .map((item) => ({
          purchaseOrderItemId: item.id,
          ingredientId: item.ingredientId,
          receivedQuantity: remainingFor(order, item),
          actualUnitPrice:
            item.estimatedUnitPrice ||
            ingredientMap.get(String(item.ingredientId))?.unitCost ||
            0,
          observation: "",
        }))
        .filter((item) => item.receivedQuantity > 0),
    });
  const submitReceipt = async (event) => {
    event.preventDefault();
    setMessage({});
    try {
      await onReceive(receiptForm);
      setReceiptForm(null);
      setMessage({
        success:
          "Recebimento registrado. Estoque e conta a pagar foram atualizados.",
      });
    } catch (error) {
      setMessage({ error: error.message });
    }
  };
  const exportOrder = (order) => {
    const supplier = supplierMap.get(String(order.supplierId));
    const rows = [
      ["PEDIDO DE COMPRA"],
      ["Loja", storeName],
      ["Fornecedor", supplier?.name || ""],
      ["Data do pedido", order.orderDate],
      ["Situação", statusLabels[order.status] || order.status],
      ["Observações do pedido", order.notes || ""],
      [],
      [
        "Item / Insumo",
        "Unidade",
        "Quantidade",
        "Preço unitário previsto",
        "Total previsto",
        "Observação",
      ],
      ...order.items.map((item) => [
        ingredientMap.get(String(item.ingredientId))?.name || "",
        item.unit,
        Number(item.orderedQuantity),
        item.estimatedUnitPrice == null ? "" : Number(item.estimatedUnitPrice),
        item.estimatedUnitPrice == null
          ? ""
          : Number(item.orderedQuantity) * Number(item.estimatedUnitPrice),
        item.observation || "",
      ]),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
    sheet["!cols"] = [
      { wch: 32 },
      { wch: 14 },
      { wch: 14 },
      { wch: 24 },
      { wch: 18 },
      { wch: 38 },
    ];
    for (let rowIndex = 8; rowIndex < rows.length; rowIndex += 1)
      for (const column of ["D", "E"])
        if (sheet[`${column}${rowIndex + 1}`])
          sheet[`${column}${rowIndex + 1}`].z = "R$ #,##0.00";
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Pedido de Compra");
    const safeSupplier = String(supplier?.name || order.id)
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-|-$/g, "");
    XLSX.writeFile(workbook, `pedido-${order.orderDate}-${safeSupplier}.xlsx`);
  };
  const executeConfirm = async () => {
    const current = confirm;
    setConfirm(null);
    try {
      if (current.type === "cancel")
        await onStatus({
          id: current.order.id,
          action: "CANCEL",
          reason: current.reason,
        });
      else
        await onReverse({
          id: current.receipt.id,
          reason: current.reason,
          reversalDate: today(),
        });
      setMessage({
        success:
          current.type === "cancel"
            ? "Pedido cancelado sem apagar o histórico."
            : "Recebimento estornado e preservado no histórico.",
      });
    } catch (error) {
      setMessage({ error: error.message });
    }
  };
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-2xl font-black text-[#2A1E15] text-balance">
            Compras
          </h3>
          <p className="text-sm text-[#6F6258] text-pretty">
            Pedido, recebimentos parciais e obrigação financeira são eventos
            distintos.
          </p>
        </div>
        <button className={buttonPrimary} onClick={newOrder}>
          <Plus size={16} /> Novo pedido
        </button>
      </header>
      <Notice {...message} />
      {!activeSuppliers.length && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h4 className="font-black text-amber-900">
            Cadastre um fornecedor para começar
          </h4>
          <p className="mt-1 text-sm font-semibold text-amber-900">
            O pedido precisa de um fornecedor ativo e de pelo menos um insumo
            vinculado.
          </p>
          {onOpenSuppliers && (
            <button
              type="button"
              className={`${buttonSecondary} mt-3`}
              onClick={onOpenSuppliers}
            >
              Ir para Fornecedores
            </button>
          )}
        </section>
      )}
      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <Field label="Competência">
            <input
              type="month"
              className={inputClass}
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </Field>
          <div
            className="flex rounded-xl bg-stone-100 p-1"
            role="tablist"
            aria-label="Visualização de pedidos de compra"
          >
            {[
              ["ACTIVE", "Ativos"],
              ["HISTORY", "Histórico"],
            ].map(([nextView, label]) => (
              <button
                key={nextView}
                type="button"
                role="tab"
                aria-selected={view === nextView}
                className={`rounded-lg px-4 py-2 text-xs font-black uppercase ${view === nextView ? "bg-white text-[#2A1E15] shadow-sm" : "text-[#6F6258]"}`}
                onClick={() => setView(nextView)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>
      <div className="space-y-4">
        {visibleOrders.map((order) => {
          const supplier = supplierMap.get(String(order.supplierId));
          return (
            <article
              key={order.id}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-black text-[#2A1E15]">
                      {supplier?.name || "Fornecedor"}
                    </h4>
                    <span className="rounded-lg bg-stone-100 px-2 py-1 text-[10px] font-black uppercase text-[#6F6258]">
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#6F6258]">
                    Pedido em{" "}
                    {new Date(`${order.orderDate}T12:00:00`).toLocaleDateString(
                      "pt-BR",
                    )}{" "}
                    · {order.items.length} item(ns) ·{" "}
                    {order.receipts?.filter((item) => item.status === "ACTIVE")
                      .length || 0}{" "}
                    recebimento(s)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={buttonSecondary}
                    onClick={() => exportOrder(order)}
                  >
                    <Download size={15} /> Baixar Excel
                  </button>
                  {["DRAFT", "ORDERED", "AWAITING_DELIVERY"].includes(
                    order.status,
                  ) &&
                    !(order.receipts || []).some(
                      (receipt) => receipt.status === "ACTIVE",
                    ) && (
                      <button
                        className={buttonSecondary}
                        onClick={() => editOrder(order)}
                      >
                        Editar pedido
                      </button>
                    )}
                  {["DRAFT", "ORDERED"].includes(order.status) && (
                    <button
                      className={buttonSecondary}
                      onClick={() =>
                        onStatus({
                          id: order.id,
                          status:
                            order.status === "DRAFT"
                              ? "ORDERED"
                              : "AWAITING_DELIVERY",
                        })
                      }
                    >
                      {order.status === "DRAFT"
                        ? "Realizar pedido"
                        : "Aguardar entrega"}
                    </button>
                  )}
                  {[
                    "ORDERED",
                    "AWAITING_DELIVERY",
                    "PARTIALLY_RECEIVED",
                  ].includes(order.status) && (
                    <button
                      className={buttonPrimary}
                      onClick={() => openReceipt(order)}
                    >
                      <PackageCheck size={15} /> Receber
                    </button>
                  )}
                  {!["RECEIVED", "CANCELLED"].includes(order.status) && (
                    <button
                      className="min-h-10 rounded-xl border border-red-200 px-3 text-xs font-black uppercase text-red-700"
                      onClick={() =>
                        setConfirm({ type: "cancel", order, reason: "" })
                      }
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-[#6F6258]">
                      <th className="py-2">Insumo</th>
                      <th>Pedido</th>
                      <th>Recebido</th>
                      <th>Restante</th>
                      <th>Estimado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => {
                      const remaining = remainingFor(order, item);
                      return (
                        <tr key={item.id} className="border-b border-stone-100">
                          <td className="py-3 font-bold">
                            {ingredientMap.get(String(item.ingredientId))?.name}
                          </td>
                          <td>
                            {item.orderedQuantity} {item.unit}
                          </td>
                          <td>
                            {Number(item.orderedQuantity) - remaining}{" "}
                            {item.unit}
                          </td>
                          <td>
                            {remaining} {item.unit}
                          </td>
                          <td>
                            {money(
                              Number(item.orderedQuantity) *
                                Number(item.estimatedUnitPrice || 0),
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!!order.receipts?.length && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-black uppercase text-[#8A5A2B]">
                    Histórico de recebimentos
                  </summary>
                  <div className="mt-2 space-y-2">
                    {order.receipts.map((receipt) => (
                      <div
                        key={receipt.id}
                        className="flex flex-col justify-between gap-2 rounded-xl bg-stone-50 p-3 sm:flex-row sm:items-center"
                      >
                        <div>
                          <p className="text-xs font-black">
                            {new Date(
                              `${receipt.receivedAt}T12:00:00`,
                            ).toLocaleDateString("pt-BR")}{" "}
                            · {money(receipt.totalAmount)} ·{" "}
                            {statusLabels[receipt.status]}
                          </p>
                          <p className="text-[11px] text-[#6F6258]">
                            {receipt.items.length} item(ns) · competência{" "}
                            {receipt.receivedAt.slice(0, 7)}
                          </p>
                        </div>
                        {receipt.status === "ACTIVE" && (
                          <button
                            className="text-xs font-black uppercase text-red-700"
                            onClick={() =>
                              setConfirm({
                                type: "receipt",
                                receipt,
                                reason: "",
                              })
                            }
                          >
                            <RotateCcw size={14} className="inline" /> Estornar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </article>
          );
        })}
        {!visibleOrders.length && (
          <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-sm text-[#6F6258]">
            {view === "HISTORY"
              ? "Nenhum pedido cancelado nesta competência."
              : "Nenhum pedido ativo nesta competência."}
          </p>
        )}
      </div>
      {orderForm && (
        <Modal
          title={
            orderForm.id ? "Editar pedido de compra" : "Novo pedido de compra"
          }
          onClose={() => setOrderForm(null)}
        >
          <form onSubmit={submitOrder} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Fornecedor">
                <select
                  required
                  className={inputClass}
                  value={orderForm.supplierId}
                  onChange={(e) =>
                    setOrderForm({
                      ...orderForm,
                      supplierId: e.target.value,
                      items: [],
                    })
                  }
                >
                  <option value="">Selecione</option>
                  {(data.suppliers || [])
                    .filter((item) => item.active)
                    .map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Data do pedido">
                <input
                  type="date"
                  className={inputClass}
                  value={orderForm.orderDate}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, orderDate: e.target.value })
                  }
                  required
                />
              </Field>
              <Field label="Status">
                <select
                  className={inputClass}
                  value={orderForm.status}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, status: e.target.value })
                  }
                >
                  <option value="DRAFT">Rascunho</option>
                  <option value="ORDERED">Pedido realizado</option>
                  <option value="AWAITING_DELIVERY">Aguardando entrega</option>
                </select>
              </Field>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-[#6F6258]">
                  Itens vinculados ao fornecedor
                </h4>
                <button
                  type="button"
                  className={buttonSecondary}
                  disabled={!linkedIngredients.length}
                  onClick={() =>
                    setOrderForm({
                      ...orderForm,
                      items: [
                        ...orderForm.items,
                        {
                          ingredientId:
                            linkedIngredients.find(
                              (item) =>
                                !orderForm.items.some(
                                  (line) =>
                                    String(line.ingredientId) ===
                                    String(item.id),
                                ),
                            )?.id || "",
                          orderedQuantity: 1,
                          estimatedUnitPrice: "",
                          observation: "",
                        },
                      ],
                    })
                  }
                >
                  <Plus size={14} /> Item
                </button>
              </div>
              {orderForm.items.length > 0 && (
                <div className="hidden grid-cols-[minmax(280px,3fr)_110px_minmax(180px,1.2fr)_44px] gap-2 px-3 text-[10px] font-black uppercase text-[#6F6258] lg:grid">
                  <span>Item / Insumo</span>
                  <span>Quantidade</span>
                  <span>Preço unitário previsto (opcional)</span>
                  <span>Ação</span>
                </div>
              )}
              {orderForm.items.map((line, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded-xl border border-stone-200 bg-white p-3 lg:grid-cols-[minmax(280px,3fr)_110px_minmax(180px,1.2fr)_44px] lg:items-end"
                >
                  <Field label="Item / Insumo" compact>
                    <select
                      required
                      className={inputClass}
                      value={line.ingredientId}
                      onChange={(e) => {
                        const items = [...orderForm.items];
                        items[index] = {
                          ...line,
                          ingredientId: e.target.value,
                        };
                        setOrderForm({ ...orderForm, items });
                      }}
                    >
                      <option value="">Selecione o insumo</option>
                      {linkedIngredients
                        .filter(
                          (item) =>
                            !orderForm.items.some(
                              (other, otherIndex) =>
                                otherIndex !== index &&
                                String(other.ingredientId) === String(item.id),
                            ),
                        )
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.unit})
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="Quantidade" compact>
                    <input
                      aria-label="Quantidade"
                      type="number"
                      min="0.0001"
                      step="any"
                      required
                      className={inputClass}
                      value={line.orderedQuantity}
                      onChange={(e) => {
                        const items = [...orderForm.items];
                        items[index] = {
                          ...line,
                          orderedQuantity: e.target.value,
                        };
                        setOrderForm({ ...orderForm, items });
                      }}
                    />
                  </Field>
                  <Field label="Preço unitário previsto (opcional)" compact>
                    <CurrencyField
                      ariaLabel="Preço unitário previsto (opcional)"
                      value={line.estimatedUnitPrice}
                      onChange={(value) => {
                        const items = [...orderForm.items];
                        items[index] = {
                          ...line,
                          estimatedUnitPrice: value,
                        };
                        setOrderForm({ ...orderForm, items });
                      }}
                    />
                  </Field>
                  <button
                    type="button"
                    aria-label="Remover item"
                    className="self-end rounded-xl border border-red-200 p-3 text-red-700"
                    onClick={() =>
                      setOrderForm({
                        ...orderForm,
                        items: orderForm.items.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      })
                    }
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
            <Field label="Observações">
              <textarea
                className={inputClass}
                value={orderForm.notes}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, notes: e.target.value })
                }
              />
            </Field>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={buttonSecondary}
                onClick={() => setOrderForm(null)}
              >
                Cancelar
              </button>
              <button
                className={buttonPrimary}
                disabled={busy || !orderForm.items.length}
              >
                <Save size={15} /> Salvar pedido
              </button>
            </div>
          </form>
        </Modal>
      )}
      {receiptForm && (
        <Modal
          title="Registrar recebimento"
          onClose={() => setReceiptForm(null)}
        >
          <form onSubmit={submitReceipt} className="space-y-4">
            <Field label="Data efetiva do recebimento (define a competência)">
              <input
                type="date"
                required
                className={inputClass}
                value={receiptForm.receivedAt}
                onChange={(e) =>
                  setReceiptForm({ ...receiptForm, receivedAt: e.target.value })
                }
              />
            </Field>
            {receiptForm.items.map((line, index) => (
              <div
                key={line.purchaseOrderItemId}
                className="grid gap-2 rounded-xl border border-stone-200 bg-white p-3 sm:grid-cols-[2fr_1fr_1fr]"
              >
                <span className="self-center text-sm font-black">
                  {ingredientMap.get(String(line.ingredientId))?.name}
                </span>
                <Field label="Quantidade recebida">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className={inputClass}
                    value={line.receivedQuantity}
                    onChange={(e) => {
                      const items = [...receiptForm.items];
                      items[index] = {
                        ...line,
                        receivedQuantity: e.target.value,
                      };
                      setReceiptForm({ ...receiptForm, items });
                    }}
                  />
                </Field>
                <Field label="Preço unitário real">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    className={inputClass}
                    value={line.actualUnitPrice}
                    onChange={(e) => {
                      const items = [...receiptForm.items];
                      items[index] = {
                        ...line,
                        actualUnitPrice: e.target.value,
                      };
                      setReceiptForm({ ...receiptForm, items });
                    }}
                  />
                </Field>
              </div>
            ))}
            <Field label="Observação">
              <textarea
                className={inputClass}
                value={receiptForm.observation}
                onChange={(e) =>
                  setReceiptForm({
                    ...receiptForm,
                    observation: e.target.value,
                  })
                }
              />
            </Field>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={buttonSecondary}
                onClick={() => setReceiptForm(null)}
              >
                Cancelar
              </button>
              <button className={buttonPrimary} disabled={busy}>
                <PackageCheck size={15} /> Confirmar recebimento
              </button>
            </div>
          </form>
        </Modal>
      )}
      {confirm && (
        <Modal
          destructive
          title={
            confirm.type === "cancel"
              ? "Cancelar pedido sem apagar histórico?"
              : "Estornar recebimento?"
          }
          onClose={() => setConfirm(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-[#6F6258] text-pretty">
              Esta ação preserva os registros e gera auditoria. Informe o motivo
              para continuar.
            </p>
            <textarea
              autoFocus
              className={inputClass}
              value={confirm.reason}
              onChange={(e) =>
                setConfirm({ ...confirm, reason: e.target.value })
              }
              placeholder="Motivo obrigatório"
            />
            <div className="flex justify-end gap-2">
              <button
                className={buttonSecondary}
                onClick={() => setConfirm(null)}
              >
                Voltar
              </button>
              <button
                className="min-h-10 rounded-xl bg-red-700 px-4 text-xs font-black uppercase text-white disabled:opacity-50"
                disabled={!confirm.reason.trim() || busy}
                onClick={executeConfirm}
              >
                Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function InventoryPage({ ingredients, data, onSave, onStatus, busy }) {
  const [month, setMonth] = useState(currentMonth);
  const [type, setType] = useState("CLOSING");
  const [draft, setDraft] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [message, setMessage] = useState({});
  const ingredientMap = useMemo(
    () => new Map(ingredients.map((item) => [String(item.id), item])),
    [ingredients],
  );
  const count = (data.inventoryCounts || []).find(
    (item) =>
      item.competenceMonth === month &&
      item.countType === type &&
      item.status !== "CANCELLED",
  );
  const summary = (data.monthlyInventorySummaries || []).find(
    (item) => item.month === month,
  );
  const begin = () =>
    setDraft({
      competenceMonth: month,
      countType: type,
      countDate: type === "OPENING" ? `${month}-01` : today(),
      observation: count?.observation || "",
      items: ingredients
        .filter((item) => item.active !== false)
        .map((ingredient) => {
          const existing = count?.items?.find(
            (item) => String(item.ingredientId) === String(ingredient.id),
          );
          const stock = data.inventory?.stock?.find(
            (item) => String(item.ingredientId) === String(ingredient.id),
          );
          return {
            ingredientId: ingredient.id,
            quantity: existing?.quantity ?? stock?.quantity ?? 0,
            unitCost: existing?.unitCost ?? ingredient.unitCost ?? 0,
          };
        }),
    });
  const save = async (event) => {
    event.preventDefault();
    try {
      await onSave(draft);
      setDraft(null);
      setMessage({ success: "Inventário salvo como rascunho." });
    } catch (error) {
      setMessage({ error: error.message });
    }
  };
  const changeStatus = async () => {
    const current = confirm;
    setConfirm(null);
    try {
      await onStatus({
        id: current.count.id,
        action: current.action,
        observation: current.reason,
      });
      setMessage({
        success:
          current.action === "CLOSE"
            ? "Inventário fechado. O saldo foi transportado quando aplicável."
            : "Inventário reaberto com auditoria.",
      });
    } catch (error) {
      setMessage({ error: error.message });
    }
  };
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header>
        <h3 className="text-2xl font-black text-[#2A1E15] text-balance">
          Estoque e inventário
        </h3>
        <p className="text-sm text-[#6F6258] text-pretty">
          Sem consumo diário inventado: na V1, o estoque é formado por
          inventário e recebimentos.
        </p>
      </header>
      <Notice {...message} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl bg-white p-4">
          <p className="text-xs text-[#6F6258]">Valor atual</p>
          <strong className="text-xl tabular-nums">
            {money(data.inventory?.totalValue)}
          </strong>
        </article>
        <article className="rounded-2xl bg-white p-4">
          <p className="text-xs text-[#6F6258]">Insumos com saldo</p>
          <strong className="text-xl tabular-nums">
            {data.inventory?.ingredientCount || 0}
          </strong>
        </article>
        <article className="rounded-2xl bg-white p-4">
          <p className="text-xs text-[#6F6258]">Abaixo do mínimo</p>
          <strong
            className={`text-xl tabular-nums ${data.inventory?.belowMinimumCount ? "text-red-700" : "text-green-700"}`}
          >
            {data.inventory?.belowMinimumCount || 0}
          </strong>
        </article>
        <article className="rounded-2xl bg-white p-4">
          <p className="text-xs text-[#6F6258]">Último inventário</p>
          <strong className="text-lg tabular-nums">
            {data.inventory?.lastInventory || "—"}
          </strong>
        </article>
      </div>
      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Competência">
              <input
                type="month"
                className={inputClass}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </Field>
            <Field label="Inventário">
              <select
                className={inputClass}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="OPENING">Inicial</option>
                <option value="CLOSING">Final</option>
              </select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={buttonPrimary}
              onClick={begin}
              disabled={count?.status === "CLOSED"}
            >
              {count ? "Editar contagem" : "Iniciar contagem"}
            </button>
            {count && ["DRAFT", "REOPENED"].includes(count.status) && (
              <button
                className={buttonSecondary}
                onClick={() =>
                  setConfirm({ count, action: "CLOSE", reason: "" })
                }
              >
                <Check size={15} /> Fechar
              </button>
            )}
            {count?.status === "CLOSED" && (
              <button
                className={buttonSecondary}
                onClick={() =>
                  setConfirm({ count, action: "REOPEN", reason: "" })
                }
              >
                <RotateCcw size={15} /> Reabrir
              </button>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-[#6F6258]">Inicial</p>
            <strong>{money(summary?.openingValue)}</strong>
          </div>
          <div>
            <p className="text-xs text-[#6F6258]">Compras recebidas</p>
            <strong>{money(summary?.purchasesReceived)}</strong>
          </div>
          <div>
            <p className="text-xs text-[#6F6258]">Final</p>
            <strong>
              {summary?.closingValue == null
                ? "Pendente"
                : money(summary.closingValue)}
            </strong>
          </div>
          <div>
            <p className="text-xs text-[#6F6258]">CMV real</p>
            <strong
              className={
                summary?.status === "CLOSED"
                  ? "text-green-700"
                  : "text-amber-700"
              }
            >
              {summary?.realCmv == null ? "Provisório" : money(summary.realCmv)}
            </strong>
          </div>
        </div>
        <p className="mt-3 text-xs text-[#6F6258]">
          CMV = estoque inicial + compras efetivamente recebidas − estoque
          final.
        </p>
      </section>
      <section className="overflow-x-auto rounded-2xl border border-stone-200 bg-white p-5">
        <h4 className="mb-3 font-black text-[#2A1E15]">Posição atual</h4>
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead>
            <tr className="border-b">
              <th className="py-2">Insumo</th>
              <th>Quantidade</th>
              <th>Unidade</th>
              <th>Custo</th>
              <th>Valor</th>
              <th>Alerta</th>
            </tr>
          </thead>
          <tbody>
            {(data.inventory?.stock || []).map((row) => (
              <tr key={row.ingredientId} className="border-b border-stone-100">
                <td className="py-3 font-bold">
                  {ingredientMap.get(String(row.ingredientId))?.name}
                </td>
                <td>{row.quantity}</td>
                <td>{row.unit}</td>
                <td>{money(row.unitCost)}</td>
                <td>{money(row.totalValue)}</td>
                <td>
                  {row.belowMinimum ? (
                    <span className="font-black text-red-700">
                      Abaixo do mínimo
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h4 className="mb-1 font-black text-[#2A1E15]">
          Histórico de preços recebidos
        </h4>
        <p className="mb-3 text-xs text-[#6F6258]">
          O preço real de cada recebimento permanece registrado; atualizar o
          custo atual não apaga valores antigos.
        </p>
        <div className="space-y-2">
          {(data.priceHistory || []).slice(0, 20).map((row) => (
            <div
              key={row.id}
              className="flex flex-col justify-between gap-1 rounded-xl bg-stone-50 p-3 sm:flex-row sm:items-center"
            >
              <div>
                <p className="text-sm font-black">
                  {ingredientMap.get(String(row.ingredientId))?.name ||
                    "Insumo"}
                </p>
                <p className="text-xs text-[#6F6258]">
                  {row.priceDate} · {row.unit}
                </p>
              </div>
              <strong className="tabular-nums">{money(row.unitPrice)}</strong>
            </div>
          ))}
          {!data.priceHistory?.length && (
            <p className="text-sm text-[#6F6258]">
              O histórico começará no primeiro recebimento registrado pelo
              sistema.
            </p>
          )}
        </div>
      </section>
      {draft && (
        <Modal
          title={`${draft.countType === "OPENING" ? "Inventário inicial" : "Inventário final"} · ${draft.competenceMonth}`}
          onClose={() => setDraft(null)}
        >
          <form onSubmit={save} className="space-y-4">
            <Field label="Data da contagem">
              <input
                type="date"
                className={inputClass}
                value={draft.countDate}
                onChange={(e) =>
                  setDraft({ ...draft, countDate: e.target.value })
                }
                required
              />
            </Field>
            <div className="max-h-[55vh] space-y-2 overflow-y-auto">
              {draft.items.map((item, index) => (
                <div
                  key={item.ingredientId}
                  className="grid gap-2 rounded-xl border border-stone-200 bg-white p-3 sm:grid-cols-[2fr_1fr_1fr]"
                >
                  <span className="self-center text-sm font-black">
                    {ingredientMap.get(String(item.ingredientId))?.name}
                  </span>
                  <Field label="Quantidade">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className={inputClass}
                      value={item.quantity}
                      onChange={(e) => {
                        const items = [...draft.items];
                        items[index] = { ...item, quantity: e.target.value };
                        setDraft({ ...draft, items });
                      }}
                    />
                  </Field>
                  <Field label="Custo unitário">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className={inputClass}
                      value={item.unitCost}
                      onChange={(e) => {
                        const items = [...draft.items];
                        items[index] = { ...item, unitCost: e.target.value };
                        setDraft({ ...draft, items });
                      }}
                    />
                  </Field>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={buttonSecondary}
                onClick={() => setDraft(null)}
              >
                Cancelar
              </button>
              <button className={buttonPrimary} disabled={busy}>
                <Save size={15} /> Salvar rascunho
              </button>
            </div>
          </form>
        </Modal>
      )}
      {confirm && (
        <Modal
          destructive
          title={
            confirm.action === "CLOSE"
              ? "Fechar este inventário?"
              : "Reabrir este inventário?"
          }
          onClose={() => setConfirm(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-[#6F6258]">
              Fechamentos afetam o CMV e o mês seguinte. Reabertura exige
              justificativa e fica auditada.
            </p>
            {confirm.action === "REOPEN" && (
              <textarea
                autoFocus
                className={inputClass}
                placeholder="Motivo obrigatório"
                value={confirm.reason}
                onChange={(e) =>
                  setConfirm({ ...confirm, reason: e.target.value })
                }
              />
            )}
            <div className="flex justify-end gap-2">
              <button
                className={buttonSecondary}
                onClick={() => setConfirm(null)}
              >
                Voltar
              </button>
              <button
                className={buttonPrimary}
                disabled={
                  busy ||
                  (confirm.action === "REOPEN" && !confirm.reason.trim())
                }
                onClick={changeStatus}
              >
                Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function FinancialBalancesPage({
  balances,
  inventorySummaries,
  onSavePeriod,
  onSaveMovement,
  onReverseMovement,
  onStatus,
  onIntegratedClose,
  busy,
}) {
  const [month, setMonth] = useState(currentMonth);
  const [form, setForm] = useState(null);
  const [movement, setMovement] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [message, setMessage] = useState({});
  const period = (balances.periods || []).find(
    (item) => item.competenceMonth === month,
  );
  const inventory = (inventorySummaries || []).find(
    (item) => item.month === month,
  );
  const openForm = () =>
    setForm({
      competenceMonth: month,
      openingBankBalance: period?.openingBankBalance ?? 0,
      openingCashBalance: period?.openingCashBalance ?? 0,
      actualClosingBankBalance: period?.actualClosingBankBalance ?? "",
      actualClosingCashBalance: period?.actualClosingCashBalance ?? "",
      observation: period?.observation || "",
    });
  const savePeriod = async (event) => {
    event.preventDefault();
    try {
      await onSavePeriod(form);
      setForm(null);
      setMessage({ success: "Saldos mensais salvos." });
    } catch (error) {
      setMessage({ error: error.message });
    }
  };
  const saveMovement = async (event) => {
    event.preventDefault();
    try {
      await onSaveMovement(movement);
      setMovement(null);
      setMessage({ success: "Movimentação registrada sem afetar a DRE." });
    } catch (error) {
      setMessage({ error: error.message });
    }
  };
  const execute = async () => {
    const action = confirm;
    setConfirm(null);
    try {
      if (action.kind === "integrated")
        await onIntegratedClose({
          competenceMonth: month,
          observation: action.reason,
        });
      else if (action.kind === "REVERSE_MOVEMENT")
        await onReverseMovement({
          id: action.movement.id,
          reason: action.reason,
        });
      else
        await onStatus({
          id: period.id,
          action: action.kind,
          observation: action.reason,
        });
      setMessage({
        success:
          action.kind === "integrated"
            ? "Fechamento mensal integrado concluído."
            : action.kind === "REVERSE_MOVEMENT"
              ? "Movimentação estornada sem apagar o histórico."
              : "Situação financeira atualizada.",
      });
    } catch (error) {
      setMessage({ error: error.message });
    }
  };
  const metrics = [
    {
      label: "Saldo bancário esperado",
      value: period?.expectedClosingBankBalance,
    },
    { label: "Dinheiro esperado", value: period?.expectedClosingCashBalance },
    { label: "Total esperado", value: period?.expectedTotalBalance },
    { label: "Total real", value: period?.actualTotalBalance },
    { label: "Diferença bancária", value: period?.bankDifference },
    { label: "Diferença em dinheiro", value: period?.cashDifference },
  ];
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header>
        <h3 className="text-2xl font-black text-[#2A1E15] text-balance">
          Saldos e fechamento mensal
        </h3>
        <p className="text-sm text-[#6F6258] text-pretty">
          Banco e dinheiro são controlados separadamente. Transferência muda a
          composição, não o total.
        </p>
      </header>
      <Notice {...message} />
      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <Field label="Competência">
            <input
              type="month"
              className={inputClass}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <button
              className={buttonPrimary}
              onClick={openForm}
              disabled={period?.status === "CLOSED"}
            >
              {period ? "Editar saldos" : "Informar saldos"}
            </button>
            <button
              className={buttonSecondary}
              onClick={() =>
                setMovement({
                  date: today(),
                  kind: "BANK_TO_CASH",
                  amount: "",
                  reason: "",
                  observation: "",
                })
              }
            >
              Transferir / ajustar
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((item) => (
            <article key={item.label} className="rounded-xl bg-stone-50 p-4">
              <p className="text-xs text-[#6F6258]">{item.label}</p>
              <strong
                className={`text-lg tabular-nums ${Number(item.value) !== 0 && item.label.includes("Diferença") ? "text-red-700" : ""}`}
              >
                {item.value == null ? "—" : money(item.value)}
              </strong>
            </article>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-black uppercase">
            Financeiro: {statusLabels[period?.status] || "Não iniciado"}
          </span>
          <span
            className={`rounded-lg px-2 py-1 text-xs font-black uppercase ${inventory?.status === "CLOSED" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}
          >
            Inventário:{" "}
            {inventory?.status === "CLOSED" ? "Fechado" : "Pendente"}
          </span>
          {period && period.status !== "CLOSED" && (
            <button
              className={buttonSecondary}
              onClick={() => setConfirm({ kind: "CLOSE", reason: "" })}
            >
              Fechar saldos
            </button>
          )}
          {period?.status === "CLOSED" && (
            <button
              className={buttonSecondary}
              onClick={() => setConfirm({ kind: "REOPEN", reason: "" })}
            >
              Reabrir saldos
            </button>
          )}
          <button
            className={buttonPrimary}
            disabled={
              period?.status !== "CLOSED" || inventory?.status !== "CLOSED"
            }
            onClick={() => setConfirm({ kind: "integrated", reason: "" })}
          >
            <Check size={15} /> Fechamento integrado
          </button>
        </div>
      </section>
      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h4 className="mb-3 font-black text-[#2A1E15]">
          Movimentações e ajustes
        </h4>
        <div className="space-y-2">
          {(balances.movements || [])
            .filter((item) => item.date?.slice(0, 7) === month)
            .map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-2 rounded-xl bg-stone-50 p-3 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-sm font-black">{item.reason}</p>
                  <p className="text-xs text-[#6F6258]">
                    {item.date} · {item.movementType} ·{" "}
                    {statusLabels[item.status] || item.status}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold tabular-nums">
                    Banco {money(item.bankAmount)} · Dinheiro{" "}
                    {money(item.cashAmount)}
                  </p>
                  {item.status === "ACTIVE" && (
                    <button
                      className="text-xs font-black uppercase text-red-700"
                      onClick={() =>
                        setConfirm({
                          kind: "REVERSE_MOVEMENT",
                          movement: item,
                          reason: "",
                        })
                      }
                    >
                      Estornar
                    </button>
                  )}
                </div>
              </div>
            ))}
          {!(balances.movements || []).some(
            (item) => item.date?.slice(0, 7) === month,
          ) && (
            <p className="text-sm text-[#6F6258]">
              Nenhuma transferência ou ajuste nesta competência.
            </p>
          )}
        </div>
      </section>
      {form && (
        <Modal title="Saldos da competência" onClose={() => setForm(null)}>
          <form onSubmit={savePeriod} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Saldo bancário inicial">
                <input
                  type="number"
                  step="any"
                  className={inputClass}
                  value={form.openingBankBalance}
                  onChange={(e) =>
                    setForm({ ...form, openingBankBalance: e.target.value })
                  }
                />
              </Field>
              <Field label="Dinheiro inicial">
                <input
                  type="number"
                  step="any"
                  className={inputClass}
                  value={form.openingCashBalance}
                  onChange={(e) =>
                    setForm({ ...form, openingCashBalance: e.target.value })
                  }
                />
              </Field>
              <Field label="Saldo bancário real no fechamento">
                <input
                  type="number"
                  step="any"
                  className={inputClass}
                  value={form.actualClosingBankBalance}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      actualClosingBankBalance: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Dinheiro contado no fechamento">
                <input
                  type="number"
                  step="any"
                  className={inputClass}
                  value={form.actualClosingCashBalance}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      actualClosingCashBalance: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
            <Field label="Observação">
              <textarea
                className={inputClass}
                value={form.observation}
                onChange={(e) =>
                  setForm({ ...form, observation: e.target.value })
                }
              />
            </Field>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={buttonSecondary}
                onClick={() => setForm(null)}
              >
                Cancelar
              </button>
              <button className={buttonPrimary} disabled={busy}>
                <Save size={15} /> Salvar
              </button>
            </div>
          </form>
        </Modal>
      )}
      {movement && (
        <Modal
          title="Transferência ou ajuste"
          onClose={() => setMovement(null)}
        >
          <form onSubmit={saveMovement} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Data">
                <input
                  type="date"
                  required
                  className={inputClass}
                  value={movement.date}
                  onChange={(e) =>
                    setMovement({ ...movement, date: e.target.value })
                  }
                />
              </Field>
              <Field label="Tipo">
                <select
                  className={inputClass}
                  value={movement.kind}
                  onChange={(e) =>
                    setMovement({ ...movement, kind: e.target.value })
                  }
                >
                  <option value="BANK_TO_CASH">Banco → dinheiro</option>
                  <option value="CASH_TO_BANK">Dinheiro → banco</option>
                  <option value="BANK_ADJUSTMENT">Ajuste bancário</option>
                  <option value="CASH_ADJUSTMENT">Ajuste em dinheiro</option>
                </select>
              </Field>
              <Field label="Valor">
                <input
                  type="number"
                  step="any"
                  required
                  className={inputClass}
                  value={movement.amount}
                  onChange={(e) =>
                    setMovement({
                      ...movement,
                      amount: e.target.value,
                      signedAmount: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
            <Field label="Motivo obrigatório">
              <input
                required
                className={inputClass}
                value={movement.reason}
                onChange={(e) =>
                  setMovement({ ...movement, reason: e.target.value })
                }
              />
            </Field>
            <Field label="Observação">
              <textarea
                className={inputClass}
                value={movement.observation}
                onChange={(e) =>
                  setMovement({ ...movement, observation: e.target.value })
                }
              />
            </Field>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={buttonSecondary}
                onClick={() => setMovement(null)}
              >
                Cancelar
              </button>
              <button className={buttonPrimary} disabled={busy}>
                <Save size={15} /> Registrar
              </button>
            </div>
          </form>
        </Modal>
      )}
      {confirm && (
        <Modal
          destructive
          title={
            confirm.kind === "integrated"
              ? "Concluir fechamento integrado?"
              : confirm.kind === "CLOSE"
                ? "Fechar saldos da competência?"
                : confirm.kind === "REVERSE_MOVEMENT"
                  ? "Estornar movimentação?"
                  : "Reabrir saldos?"
          }
          onClose={() => setConfirm(null)}
        >
          <div className="space-y-4">
            <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              <AlertTriangle className="shrink-0" size={20} />
              <p>
                {confirm.kind === "integrated"
                  ? "O fechamento só será aceito se inventário e saldos estiverem fechados. Contas futuras continuam preservadas."
                  : "A ação altera o estado do período e será registrada na auditoria."}
              </p>
            </div>
            {["REOPEN", "REVERSE_MOVEMENT"].includes(confirm.kind) && (
              <textarea
                autoFocus
                className={inputClass}
                placeholder="Motivo obrigatório"
                value={confirm.reason}
                onChange={(e) =>
                  setConfirm({ ...confirm, reason: e.target.value })
                }
              />
            )}
            <div className="flex justify-end gap-2">
              <button
                className={buttonSecondary}
                onClick={() => setConfirm(null)}
              >
                Voltar
              </button>
              <button
                className={buttonPrimary}
                disabled={
                  busy ||
                  (["REOPEN", "REVERSE_MOVEMENT"].includes(confirm.kind) &&
                    !confirm.reason.trim())
                }
                onClick={execute}
              >
                Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
