import { useEffect, useMemo, useState } from "react";
import { GrLocation } from "react-icons/gr";
import { Loader2 } from "lucide-react";
import InputField from "../../components/InputField";
import Modal from "../../components/Modal";
import {
  getPreset,
  getPresetKeys,
  computeTotals,
  generateInvestmentBands,
  getMultiplierFor,
} from "../../data/QuotePresets";

const DEFAULT_PRESET = "2BHK";

// Pull preset-defined defaults so a single dropdown change drives
// propertyType + sizeRange — these mirror the fields managed in
// Settings → Proposal Master.
const buildPresetState = (key) => {
  const preset = getPreset(key);
  return {
    quotePreset: key,
    quoteSizeRange: preset?.sizeRange || "",
    propertyType: preset?.propertyType || "",
  };
};

const INITIAL_FORM_STATE = {
  fullName: "",
  phoneNumber: "",
  email: "",
  inquirySource: "",
  investmentRange: "",
  processionDate: "",
  location: "",
  inquiryStatus: "",
  architecturalNotes: "",
  quotePreset: "",
  quoteSizeRange: "",
  propertyType: "",
};

const inquirySources = [
  "Referral",
  "Walk-in",
  "Social Media",
  "Website",
  "Cold Call",
  "Other",
];

const CLIENT_INFO_FIELDS = [
  { name: "fullName", label: "Full Name", type: "text", placeholder: "Enter full name", required: true },
  {
    name: "phoneNumber", label: "Phone Number", type: "tel", placeholder: "10-digit number",
    required: true,
    validation: (val) => !/^\d{10}$/.test(val.replace(/\s/g, "")) ? "Must be a 10-digit number" : null,
  },
  {
    name: "email", label: "Email Address", type: "email", placeholder: "example@domain.com",
    required: true,
    validation: (val) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) ? "Enter a valid email address" : null,
  },
  { name: "inquirySource", label: "Inquiry Source", type: "select", options: inquirySources },
];

const PROJECT_DETAIL_FIELDS = [
  { name: "processionDate", label: "Possession Date", type: "date" },
  { name: "location", label: "City / Location", type: "text", placeholder: "e.g. Chennai, Tamil Nadu", icon: GrLocation, required: true },
];

// Status transitions live on the lead detail page (Mark Qualified, Send
// Proposal, Mark Won, etc.) — not on this edit form. We still carry
// `inquiryStatus` in formData so submit preserves the lead's existing
// status, but we don't validate or render a picker for it.
const REQUIRED_FIELDS = [
  ...CLIENT_INFO_FIELDS.filter((f) => f.required),
  { name: "location", label: "Location", required: true },
  { name: "quotePreset", label: "Property Preset", required: true },
  { name: "propertyType", label: "Property Type", required: true },
];

const SectionHeader = ({ children, hint }) => (
  <div className="mb-4">
    <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-select-blue">
      <span className="w-0.5 h-3.5 bg-select-blue rounded-full shrink-0" />
      {children}
    </h2>
    {hint && (
      <p className="text-[11px] text-text-subtle mt-1 ml-3.5">{hint}</p>
    )}
  </div>
);

const formatLakhs = (rupees) => `₹${(rupees / 100000).toFixed(1)}L`;

function EditInquiryform({ initialData, onClose, onAddLead }) {
  const presetKeys = useMemo(() => getPresetKeys(), []);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!initialData) return;

    // Stored format is "DD.MM.YYYY"; the date input wants "YYYY-MM-DD".
    let processionDate = "";
    if (initialData.possessionDate) {
      const parts = initialData.possessionDate.split(".");
      processionDate = parts.length === 3
        ? `${parts[2]}-${parts[1]}-${parts[0]}`
        : initialData.possessionDate;
    }

    const presetKey = presetKeys.includes(initialData.quotePreset)
      ? initialData.quotePreset
      : presetKeys.includes(DEFAULT_PRESET)
        ? DEFAULT_PRESET
        : presetKeys[0];
    const presetDefaults = buildPresetState(presetKey);

    // If the saved propertyType isn't in the preset's allowed list (e.g.
    // the preset was edited later), fall back to the preset's default so
    // the dropdown shows a valid selection.
    const allowed = getPreset(presetKey)?.propertyTypes || [];
    const propertyType =
      initialData.propertyType && allowed.includes(initialData.propertyType)
        ? initialData.propertyType
        : presetDefaults.propertyType;

    setFormData({
      fullName: initialData.clientName || "",
      phoneNumber: initialData.phone || "",
      email: initialData.email || "",
      inquirySource: initialData.inquirySource || "",
      investmentRange: initialData.investment || "",
      processionDate,
      location: initialData.location || "",
      inquiryStatus: initialData.status || "",
      architecturalNotes: initialData.architecturalNotes || "",
      quotePreset: presetKey,
      // existing lead values win over preset defaults, so manual edits stick
      quoteSizeRange:
        initialData.quoteSizeRange ?? presetDefaults.quoteSizeRange,
      propertyType,
    });
  }, [initialData, presetKeys]);

  const activePreset = useMemo(
    () => getPreset(formData.quotePreset),
    [formData.quotePreset],
  );

  const presetTotals = useMemo(
    () => (activePreset ? computeTotals(activePreset.scopeItems || []) : null),
    [activePreset],
  );

  // Property-type multiplier scales the preset's baseline (penthouse may
  // be 1.2×, studio 0.85×, etc.). Falls back to 1.0 when not configured.
  const typeMultiplier = useMemo(
    () => getMultiplierFor(activePreset, formData.propertyType),
    [activePreset, formData.propertyType],
  );

  const effectiveBaseline = (presetTotals?.grandTotal || 0) * typeMultiplier;

  // Investment-range bands derived from the effective baseline. If the
  // saved value isn't in the generated bands (e.g. an older record),
  // prepend it so the select still renders it as the current choice.
  const investmentBands = useMemo(() => {
    const bands = generateInvestmentBands(effectiveBaseline);
    if (
      formData.investmentRange &&
      !bands.includes(formData.investmentRange)
    ) {
      return [formData.investmentRange, ...bands];
    }
    return bands;
  }, [effectiveBaseline, formData.investmentRange]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePresetChange = (e) => {
    const key = e.target.value;
    setFormData((prev) => ({ ...prev, ...buildPresetState(key) }));
    setErrors((prev) => ({ ...prev, propertyType: "", quoteSizeRange: "" }));
  };

  const validate = () => {
    const newErrors = {};
    REQUIRED_FIELDS.forEach((f) => {
      const val = formData[f.name];
      if (f.required && (!val || !val.toString().trim())) {
        newErrors[f.name] = `${f.label} is required`;
      } else if (f.validation) {
        const msg = f.validation(val);
        if (msg) newErrors[f.name] = msg;
      }
    });
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      // Older consumers (LeadEdit.jsx, table column "scope") still read
      // `projectScope` — derive it from the property type.
      await onAddLead?.({
        ...formData,
        projectScope: formData.propertyType,
      });
      onClose?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (cfg) => (
    <InputField
      key={cfg.name}
      name={cfg.name}
      label={cfg.label}
      type={cfg.type}
      value={formData[cfg.name]}
      onChange={handleChange}
      error={errors[cfg.name]}
      placeholder={cfg.placeholder}
      options={cfg.options}
      icon={cfg.icon}
    />
  );

  const footer = (
    <div className="flex justify-end items-center gap-4">
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-bg-soft transition-all disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="edit-inquiry-form"
        disabled={isSubmitting}
        className="min-w-[140px] flex items-center justify-center gap-2 px-7 py-2.5 rounded-lg bg-select-blue text-white text-sm font-medium hover:bg-primary shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Saving…
          </>
        ) : "Save Changes"}
      </button>
    </div>
  );

  return (
    <Modal
      title="Edit Inquiry"
      subtitle="Update client and property details"
      onClose={isSubmitting ? undefined : onClose}
      footer={footer}
    >
      <form id="edit-inquiry-form" onSubmit={handleSubmit} noValidate>
        {/* ── Client Information ─────────────────────────────────────── */}
        <div className="mb-6">
          <SectionHeader>Client Information</SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            {CLIENT_INFO_FIELDS.slice(0, 2).map(field)}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {CLIENT_INFO_FIELDS.slice(2, 4).map(field)}
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        {/* ── Property Configuration (proposal-master driven) ────────── */}
        <div className="mb-6">
          <SectionHeader hint="The preset defines which property types it can be used for — pick one here.">
            Property Configuration
          </SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              name="quotePreset"
              label="Property Preset"
              type="select"
              value={formData.quotePreset}
              onChange={handlePresetChange}
              options={presetKeys}
              error={errors.quotePreset}
            />
            <InputField
              name="propertyType"
              label="Property Type"
              type="select"
              value={formData.propertyType}
              onChange={handleChange}
              options={activePreset?.propertyTypes || []}
              error={errors.propertyType}
            />
          </div>

          {activePreset && (
            <div className="mt-3 rounded-lg border border-bordergray bg-bg-soft px-3 py-2.5 ml-3.5">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="text-text-subtle uppercase tracking-wider text-[10px] font-semibold">
                    Size Range
                  </span>
                  <strong className="text-text">
                    {activePreset.sizeRange || "—"}
                  </strong>
                </span>
                {presetTotals && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-text-subtle uppercase tracking-wider text-[10px] font-semibold">
                      Baseline
                    </span>
                    <strong className="text-text">
                      {formatLakhs(effectiveBaseline)}
                    </strong>
                    <span className="text-text-subtle">incl. GST</span>
                    {typeMultiplier !== 1 && (
                      <span className="text-[10px] font-bold text-select-blue bg-active-bg px-1.5 py-0.5 rounded-md ml-0.5">
                        ×{typeMultiplier.toFixed(2)} {formData.propertyType}
                      </span>
                    )}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="text-text-subtle uppercase tracking-wider text-[10px] font-semibold">
                    Applies to
                  </span>
                  <strong className="text-text">
                    {(activePreset.propertyTypes || []).join(", ") || "—"}
                  </strong>
                </span>
              </div>
              <p className="text-[10.5px] text-text-subtle mt-1.5">
                Edit these values in <strong>Settings → Proposal Master</strong>.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border mb-6" />

        {/* ── Project Details (schedule + commercials + location) ────── */}
        <div className="mb-6">
          <SectionHeader>Project Details</SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              name="investmentRange"
              label="Investment Range"
              type="select"
              value={formData.investmentRange}
              onChange={handleChange}
              options={investmentBands}
              placeholder={
                investmentBands.length
                  ? "Choose a range"
                  : "Pick a preset first"
              }
              error={errors.investmentRange}
            />
            {PROJECT_DETAIL_FIELDS.slice(0, 1).map(field)}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {PROJECT_DETAIL_FIELDS.slice(1).map(field)}
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        {/* ── Notes ──────────────────────────────────────────────────── */}
        <div className="mb-2">
          <SectionHeader hint="Status is changed from the lead detail page — Mark Qualified, Send Proposal, Mark Won, etc.">
            Notes
          </SectionHeader>

          <InputField
            type="textarea"
            name="architecturalNotes"
            label="Architectural Notes"
            value={formData.architecturalNotes}
            onChange={handleChange}
            error={errors.architecturalNotes}
            placeholder="Mention design preferences, mood, or constraints…"
            rows={4}
          />
        </div>
      </form>
    </Modal>
  );
}

export default EditInquiryform;
