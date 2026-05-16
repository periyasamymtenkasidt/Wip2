import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2, Printer, Send, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "./Modal";
import InputField from "./InputField";

const quoteRecipientSchema = yup.object().shape({
  recipientName: yup.string().required("Recipient name required"),
  recipientEmail: yup
    .string()
    .required("Email Address is required")
    .trim()
    .matches(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      "Enter a valid email address",
    ),
});
import QuotePreview from "./QuotePreview";
import {
  getPreset,
  getPresetKeys,
  computeTotals,
  generateQuoteId,
  saveQuote,
} from "../data/QuotePresets";
import { computeLibraryItemAmount } from "../data/itemLibrary";
import { formatAmount } from "../utils/formatAmount";
import ItemFormModal from "./ItemFormModal";

const SectionHeader = ({ children }) => (
  <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-select-blue mb-3">
    <span className="w-0.5 h-3.5 bg-select-blue rounded-full shrink-0" />
    {children}
  </h2>
);

const buildInitialFormData = ({
  presetKey,
  recipient,
  defaultPropertyType,
  initialQuote,
  presetData,
}) => {
  const presetKeys = getPresetKeys();
  // Resend / re-open path: hydrate from a stored quote snapshot. Carry the
  // existing quoteId forward so the same record gets updated.
  if (initialQuote) {
    return {
      quoteId: initialQuote.quoteId || generateQuoteId(),
      createdAt: initialQuote.createdAt || new Date().toISOString(),
      recipientName: initialQuote.recipientName || recipient?.name || "",
      recipientEmail: initialQuote.recipientEmail || recipient?.email || "",
      recipientPhone: initialQuote.recipientPhone || recipient?.phone || "",
      propertyType: initialQuote.propertyType || defaultPropertyType || "",
      sizeRange: initialQuote.sizeRange || "",
      validityDays: initialQuote.validityDays || 30,
      scopeItems: (initialQuote.scopeItems || []).map((s) => ({
        ...s,
        materials: s.materials ? s.materials.map((m) => ({ ...m })) : [],
      })),
      inclusions: [...(initialQuote.inclusions || [])],
      exclusions: [...(initialQuote.exclusions || [])],
      notes: initialQuote.notes || "",
    };
  }
  // Lead-supplied preset data (from the inquiry form). Inquiry only captures
  // the preset key + size — scope/inclusions/exclusions are taken from the
  // matching live master template, so the proposal modal opens with a
  // realistic starting scope (incl. materials) every time.
  if (presetData) {
    const fallbackKey = presetKeys.includes(presetData.presetKey)
      ? presetData.presetKey
      : presetKeys[0] || "2BHK";
    const fallback = getPreset(fallbackKey) || {};
    return {
      quoteId: generateQuoteId(),
      createdAt: new Date().toISOString(),
      recipientName: recipient?.name || "",
      recipientEmail: recipient?.email || "",
      recipientPhone: recipient?.phone || "",
      propertyType:
        presetData.propertyType || defaultPropertyType || fallback.propertyType || "",
      sizeRange: presetData.sizeRange || fallback.sizeRange || "",
      validityDays: presetData.validityDays || 30,
      scopeItems: (presetData.scopeItems || fallback.scopeItems || []).map(
        (s) => ({
          ...s,
          materials: s.materials ? s.materials.map((m) => ({ ...m })) : [],
        }),
      ),
      inclusions: [...(presetData.inclusions || fallback.inclusions || [])],
      exclusions: [...(presetData.exclusions || fallback.exclusions || [])],
      notes: presetData.notes || "",
    };
  }
  const preset = getPreset(presetKey) || getPreset(presetKeys[0]) || {};
  return {
    quoteId: generateQuoteId(),
    createdAt: new Date().toISOString(),
    recipientName: recipient?.name || "",
    recipientEmail: recipient?.email || "",
    recipientPhone: recipient?.phone || "",
    propertyType: defaultPropertyType || preset.propertyType || "",
    sizeRange: preset.sizeRange || "",
    validityDays: 30,
    scopeItems: (preset.scopeItems || []).map((s) => ({
      ...s,
      materials: s.materials ? s.materials.map((m) => ({ ...m })) : [],
    })),
    inclusions: [...(preset.inclusions || [])],
    exclusions: [...(preset.exclusions || [])],
    notes: "",
  };
};

// Pick the best preset to display in the dropdown given an already-loaded
// quote — first try the preset stored on the quote, then the first available.
const inferPresetKey = (initialQuote, presetData) => {
  const keys = getPresetKeys();
  if (initialQuote?.presetKey && keys.includes(initialQuote.presetKey))
    return initialQuote.presetKey;
  if (presetData?.presetKey && keys.includes(presetData.presetKey))
    return presetData.presetKey;
  return keys.includes("2BHK") ? "2BHK" : keys[0];
};

// `mode` controls labelling only — "proposal" tweaks copy + button so this
// modal can be reused for the "Send Proposal" / "Resend Proposal" flow on a
// lead. Default "quote" keeps the standalone Quick Quote behaviour.
const QuoteModal = ({
  parentId,
  parentType,
  recipient,
  defaultPropertyType,
  initialQuote,
  presetData,
  mode = "quote",
  onClose,
  onSent,
}) => {
  const isProposal = mode === "proposal";
  const isResend = !!initialQuote;
  const [presetKey, setPresetKey] = useState(() =>
    inferPresetKey(initialQuote, presetData),
  );
  const [formData, setFormData] = useState(() =>
    buildInitialFormData({
      presetKey: inferPresetKey(initialQuote, presetData),
      recipient,
      defaultPropertyType,
      initialQuote,
      presetData,
    }),
  );

  // react-hook-form for recipient validation
  const {
    register,
    handleSubmit: rhfHandleSubmit,
    formState: { errors },
    setValue: rhfSetValue,
  } = useForm({
    resolver: yupResolver(quoteRecipientSchema),
    defaultValues: {
      recipientName: formData.recipientName,
      recipientEmail: formData.recipientEmail,
    },
  });

  const [isSending, setIsSending] = useState(false);
  // Controls the shared Item Form modal opened by "Add Row" / "Add Scope".
  const [scopeFormOpen, setScopeFormOpen] = useState(false);

  const totals = useMemo(
    () => computeTotals(formData.scopeItems),
    [formData.scopeItems],
  );

  const handlePresetChange = (e) => {
    const key = e.target.value;
    setPresetKey(key);
    const preset = getPreset(key);
    if (!preset) return;
    setFormData((prev) => ({
      ...prev,
      propertyType: preset.propertyType,
      sizeRange: preset.sizeRange,
      scopeItems: (preset.scopeItems || []).map((s) => ({
        ...s,
        materials: s.materials ? s.materials.map((m) => ({ ...m })) : [],
      })),
      inclusions: [...(preset.inclusions || [])],
      exclusions: [...(preset.exclusions || [])],
    }));
  };

  const updateField = (name, value) => {
    setFormData((p) => ({ ...p, [name]: value }));
    // Sync with react-hook-form for validated fields
    if (name === "recipientName" || name === "recipientEmail") {
      rhfSetValue(name, value, { shouldValidate: true });
    }
  };

  const updateScope = (idx, key, value) => {
    setFormData((p) => ({
      ...p,
      scopeItems: p.scopeItems.map((s, i) =>
        i === idx ? { ...s, [key]: value } : s,
      ),
    }));
  };

  // Save handler for the shared Item Form modal. Maps the form's flat shape
  // onto the quote's scope-row shape (area / description / amount / materials).
  const handleScopeFormSave = (form) => {
    const newRow = {
      area: form.description || "",
      description: form.spec || "",
      amount: computeLibraryItemAmount(form),
      materials: form.materials ? form.materials.map((m) => ({ ...m })) : [],
    };
    setFormData((p) => ({
      ...p,
      scopeItems: [...p.scopeItems, newRow],
    }));
    setScopeFormOpen(false);
  };

  const removeScopeRow = (idx) => {
    setFormData((p) => ({
      ...p,
      scopeItems: p.scopeItems.filter((_, i) => i !== idx),
    }));
  };

  const updateMaterial = (scopeIdx, matIdx, key, value) => {
    setFormData((p) => ({
      ...p,
      scopeItems: p.scopeItems.map((s, i) =>
        i === scopeIdx
          ? {
              ...s,
              materials: (s.materials || []).map((m, j) =>
                j === matIdx ? { ...m, [key]: value } : m,
              ),
            }
          : s,
      ),
    }));
  };

  const addMaterial = (scopeIdx) => {
    setFormData((p) => ({
      ...p,
      scopeItems: p.scopeItems.map((s, i) =>
        i === scopeIdx
          ? {
              ...s,
              materials: [...(s.materials || []), { name: "", spec: "" }],
            }
          : s,
      ),
    }));
  };

  const removeMaterial = (scopeIdx, matIdx) => {
    setFormData((p) => ({
      ...p,
      scopeItems: p.scopeItems.map((s, i) =>
        i === scopeIdx
          ? {
              ...s,
              materials: (s.materials || []).filter((_, j) => j !== matIdx),
            }
          : s,
      ),
    }));
  };

  const buildQuote = (overrides = {}) => ({
    quoteId: formData.quoteId,
    parentId,
    parentType,
    presetKey,
    recipientName: formData.recipientName,
    recipientEmail: formData.recipientEmail,
    recipientPhone: formData.recipientPhone,
    propertyType: formData.propertyType,
    sizeRange: formData.sizeRange,
    validityDays: Number(formData.validityDays) || 30,
    scopeItems: formData.scopeItems,
    inclusions: formData.inclusions,
    exclusions: formData.exclusions,
    notes: formData.notes,
    createdAt: formData.createdAt,
    subtotal: totals.subtotal,
    gst: totals.gst,
    grandTotal: totals.grandTotal,
    status: "draft",
    ...overrides,
  });

  const handleSaveDraft = () => {
    if (!parentId) return;
    saveQuote(parentId, buildQuote());
    onClose?.();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSend = async (validatedData) => {
    // Also check scope items (not managed by react-hook-form)
    if (!formData.scopeItems?.length) {
      return;
    }
    // Sync validated recipient data back to formData
    formData.recipientName = validatedData.recipientName;
    formData.recipientEmail = validatedData.recipientEmail;

    setIsSending(true);
    await new Promise((r) => setTimeout(r, 600));
    const sentAt = new Date().toISOString();
    const subjectPrefix = isProposal
      ? isResend
        ? "Revised proposal"
        : "Proposal"
      : "Quote";
    const subject = `${subjectPrefix} ${formData.quoteId} for your project — ${parentId}`;
    const body = `Hi ${formData.recipientName},\n\nPlease find attached our ${subjectPrefix.toLowerCase()} ${formData.quoteId} for your ${formData.propertyType} (${formData.sizeRange}). The grand total is ${formatAmount(totals.grandTotal)} (incl. GST). This quote is valid for ${formData.validityDays} days.\n\nLooking forward to your feedback.\n\n— Digital Atelier`;
    const quote = buildQuote({ status: "sent", sentAt, subject, body });
    saveQuote(parentId, quote);
    onSent?.({
      quoteId: quote.quoteId,
      to: formData.recipientEmail,
      subject,
      body,
      total: totals.grandTotal,
      quote,
      isResend,
    });
    setIsSending(false);
    onClose?.();
  };

  const previewQuote = buildQuote();

  const footer = (
    <div className="flex flex-wrap justify-between items-center gap-3 modal-no-print">
      <button
        type="button"
        onClick={onClose}
        disabled={isSending}
        className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-bg-soft transition-all disabled:opacity-50"
      >
        Cancel
      </button>
      <div className="flex flex-wrap items-center gap-3">
        {/* Save Draft only makes sense in standalone Quote mode — proposal
            mode is a single-shot send. */}
        {!isProposal && (
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text hover:bg-bg-soft transition-all disabled:opacity-50"
          >
            <Save size={14} /> Save Draft
          </button>
        )}
        <button
          type="button"
          onClick={handlePrint}
          disabled={isSending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text hover:bg-bg-soft transition-all disabled:opacity-50"
        >
          <Printer size={14} /> Print / Save PDF
        </button>
        <button
          type="button"
          onClick={rhfHandleSubmit(handleSend)}
          disabled={isSending}
          className="min-w-[180px] flex items-center justify-center gap-2 px-7 py-2.5 rounded-lg bg-select-blue text-white text-sm font-medium hover:bg-primary shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send size={14} />{" "}
              {isProposal
                ? isResend
                  ? "Resend Proposal"
                  : "Send Proposal"
                : "Send via Email"}
            </>
          )}
        </button>
      </div>
    </div>
  );

  const modalTitle = isProposal
    ? isResend
      ? "Resend Proposal"
      : "Send Proposal"
    : "Quick Quote";
  const modalSubtitle = isProposal
    ? isResend
      ? "Existing scope and pricing loaded. Edit, preview, and resend."
      : "Pick a preset, edit the scope, preview, then send via email."
    : "Pick a preset, edit the scope, then send or print.";

  return (
    <Modal
      title={modalTitle}
      subtitle={modalSubtitle}
      onClose={isSending ? undefined : onClose}
      footer={footer}
      maxWidth="max-w-[1100px]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        {/* Form pane */}
        <div className="modal-no-print">
          {/* Preset is editable in standalone Quote mode but locked in
              Proposal mode (it was chosen during inquiry creation). */}
          {isProposal ? (
            <div className="mb-5">
              <SectionHeader>Property Preset</SectionHeader>
              <div className="rounded-xl border border-border bg-bg-soft px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-bold text-text">
                    {getPreset(presetKey)?.label || presetKey}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {formData.sizeRange || getPreset(presetKey)?.sizeRange}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                  From inquiry
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-5">
              <SectionHeader>Preset</SectionHeader>
              <InputField
                name="presetKey"
                label="Property Preset"
                type="select"
                value={presetKey}
                onChange={handlePresetChange}
                options={getPresetKeys()}
              />
              <p className="mt-2 text-[10px] text-text-muted">
                Switching presets reloads scope items. Existing edits will be
                lost.
              </p>
            </div>
          )}

          <div className="border-t border-border my-5" />

          {/* Recipient — proposal mode shows just the email; the standalone
              Quote mode keeps the full name/phone/email block. */}
          {isProposal ? (
            <div className="mb-5">
              <SectionHeader>Recipient Email</SectionHeader>
              <InputField
                name="recipientEmail"
                label="Email"
                type="email"
                register={register("recipientEmail")}
                onChange={(e) => updateField("recipientEmail", e.target.value)}
                error={errors.recipientEmail?.message}
                placeholder="example@domain.com"
              />
              <p className="mt-2 text-[10px] text-text-muted">
                Sample quotation will be sent to this address.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <SectionHeader>Recipient</SectionHeader>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    name="recipientName"
                    label="Name"
                    type="text"
                    register={register("recipientName")}
                    onChange={(e) => updateField("recipientName", e.target.value)}
                    error={errors.recipientName?.message}
                    placeholder="Full name"
                  />
                  <InputField
                    name="recipientPhone"
                    label="Phone"
                    type="tel"
                    value={formData.recipientPhone}
                    onChange={(e) =>
                      updateField("recipientPhone", e.target.value)
                    }
                    placeholder="10-digit number"
                  />
                </div>
                <div className="mt-3">
                  <InputField
                    name="recipientEmail"
                    label="Email"
                    type="email"
                    register={register("recipientEmail")}
                    onChange={(e) =>
                      updateField("recipientEmail", e.target.value)
                    }
                    error={errors.recipientEmail?.message}
                    placeholder="example@domain.com"
                  />
                </div>
              </div>

              <div className="border-t border-border my-5" />

              <div className="mb-5">
                <SectionHeader>Property</SectionHeader>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    name="propertyType"
                    label="Property Type"
                    type="text"
                    value={formData.propertyType}
                    onChange={(e) =>
                      updateField("propertyType", e.target.value)
                    }
                    placeholder="e.g. Apartment"
                  />
                  <InputField
                    name="sizeRange"
                    label="Size"
                    type="text"
                    value={formData.sizeRange}
                    onChange={(e) => updateField("sizeRange", e.target.value)}
                    placeholder="e.g. 800–1100 sq ft"
                  />
                </div>
                <div className="mt-3">
                  <InputField
                    name="validityDays"
                    label="Validity (days)"
                    type="number"
                    value={formData.validityDays}
                    onChange={(e) =>
                      updateField("validityDays", e.target.value)
                    }
                    placeholder="30"
                  />
                </div>
              </div>
            </>
          )}

          <div className="border-t border-border my-5" />

          <div className="mb-5">
            <div className="flex justify-between items-center mb-3">
              <SectionHeader>Scope of Work</SectionHeader>
              <button
                type="button"
                onClick={() => setScopeFormOpen(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-select-blue hover:text-primary -mt-3"
              >
                <Plus size={13} /> Add Row
              </button>
            </div>
            {errors.scopeItems && (
              <p className="text-red-500 text-[10px] mb-2">{errors.scopeItems.message}</p>
            )}
            <div className="space-y-3">
              {formData.scopeItems.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-bg-soft p-2 space-y-2"
                >
                  <div className="grid grid-cols-[1fr_1.5fr_110px_28px] gap-2 items-start">
                    <input
                      type="text"
                      value={item.area}
                      onChange={(e) =>
                        updateScope(idx, "area", e.target.value)
                      }
                      placeholder="Area"
                      className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-2 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                    />
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        updateScope(idx, "description", e.target.value)
                      }
                      placeholder="Description"
                      className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-2 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                    />
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) =>
                        updateScope(idx, "amount", e.target.value)
                      }
                      placeholder="₹"
                      className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-2 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300 text-right"
                    />
                    <button
                      type="button"
                      onClick={() => removeScopeRow(idx)}
                      className="h-8 w-7 flex items-center justify-center rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove row"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Material specs — short list of brand/grade lines */}
                  <div className="pl-3 border-l-2 border-select-blue/30 space-y-1.5">
                    {(item.materials || []).map((m, mIdx) => (
                      <div
                        key={mIdx}
                        className="grid grid-cols-[100px_1fr_22px] gap-2 items-center"
                      >
                        <input
                          type="text"
                          value={m.name}
                          onChange={(e) =>
                            updateMaterial(idx, mIdx, "name", e.target.value)
                          }
                          placeholder="Plywood"
                          className="bg-white border border-bordergray text-[10px] text-darkgray rounded-md px-2 py-1.5 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                        />
                        <input
                          type="text"
                          value={m.spec}
                          onChange={(e) =>
                            updateMaterial(idx, mIdx, "spec", e.target.value)
                          }
                          placeholder="BWP 19mm"
                          className="bg-white border border-bordergray text-[10px] text-darkgray rounded-md px-2 py-1.5 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeMaterial(idx, mIdx)}
                          className="h-7 w-6 flex items-center justify-center rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Remove material"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addMaterial(idx)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-select-blue hover:text-primary"
                    >
                      <Plus size={11} /> Material
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end gap-4 text-[12px]">
              <span className="text-text-muted">
                Subtotal:{" "}
                <span className="font-bold text-text">
                  {formatAmount(totals.subtotal)}
                </span>
              </span>
              <span className="text-text-muted">
                GST:{" "}
                <span className="font-bold text-orange-500">
                  {formatAmount(totals.gst)}
                </span>
              </span>
              <span className="text-text-muted">
                Total:{" "}
                <span className="font-bold text-primary">
                  {formatAmount(totals.grandTotal)}
                </span>
              </span>
            </div>
          </div>

          <div className="border-t border-border my-5" />

          <div>
            <SectionHeader>Notes / Terms</SectionHeader>
            <InputField
              name="notes"
              label=""
              type="textarea"
              rows={3}
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Optional notes for the client (payment terms, timelines, etc.)"
            />
          </div>
        </div>

        {/* Preview pane */}
        <div className="lg:sticky lg:top-0 lg:self-start">
          <p className="text-[10px] uppercase tracking-widest text-text-subtle font-bold mb-2 modal-no-print">
            Live Preview
          </p>
          <div className="quote-print-area rounded-xl border border-border bg-white p-6 shadow-sm">
            <QuotePreview quote={previewQuote} />
          </div>
        </div>
      </div>

      {/* Shared Item Form modal for Add Row — mirrors Item Master & BOQ flows */}
      {scopeFormOpen && (
        <ItemFormModal
          initial={{}}
          onSave={handleScopeFormSave}
          onClose={() => setScopeFormOpen(false)}
          title="Add Scope"
          submitLabel="Add Scope"
          showCategory={false}
          showTags={false}
        />
      )}
    </Modal>
  );
};

export default QuoteModal;
