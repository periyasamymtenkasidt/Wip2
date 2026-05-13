import React, { useState } from "react";
import { GrLocation } from "react-icons/gr";
import { Loader2 } from "lucide-react";
import InputField from "../../components/InputField";
import Modal from "../../components/Modal";
import { PROPERTY_TYPES } from "../../helperConfigData/helperData";
import { getPreset, getPresetKeys } from "../../data/QuotePresets";

const DEFAULT_PRESET = "2BHK";

// Capture the property preset on the inquiry so the Send Proposal flow
// later knows which scope template to start from. Scope items themselves
// are NOT collected here — they belong to the proposal.
const buildPresetState = (key) => {
  const preset = getPreset(key);
  return {
    quotePreset: key,
    quoteSizeRange: preset?.sizeRange || "",
  };
};

const INITIAL_FORM_STATE = {
  fullName: "",
  phoneNumber: "",
  email: "",
  inquirySource: "",
  projectScope: "",
  investmentRange: "",
  buildUpArea: "",
  processionDate: "",
  propertyType: "",
  location: "",
  inquiryStatus: "Inquiry",
  architecturalNotes: "",
  ...buildPresetState(DEFAULT_PRESET),
};

const inquirySources = [
  "Referral",
  "Walk-in",
  "Social Media",
  "Website",
  "Cold Call",
  "Other",
];

const FIELD_CONFIG = {
  clientInfo: [
    {
      name: "fullName",
      label: "Full Name",
      type: "text",
      placeholder: "Enter full name",
      required: true,
    },
    {
      name: "phoneNumber",
      label: "Phone Number",
      type: "tel",
      placeholder: "10-digit number",
      required: true,
      validation: (val) =>
        !/^\d{10}$/.test(val.replace(/\s/g, ""))
          ? "Must be a 10-digit number"
          : null,
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "example@domain.com",
      required: true,
      validation: (val) =>
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
          ? "Enter a valid email address"
          : null,
    },
    {
      name: "inquirySource",
      label: "Inquiry Source",
      type: "select",
      options: inquirySources,
      required: true,
    },
  ],
  projectDetails: [
    {
      name: "projectScope",
      label: "Project Scope",
      type: "select",
      options: ["Full Home Interior", "Interior", "On Hold", "Pending"],
      required: true,
    },
    {
      name: "investmentRange",
      label: "Investment Range",
      type: "text",
      placeholder: "e.g. ₹50L – ₹1Cr",
      required: true,
    },
    {
      name: "buildUpArea",
      label: "Build-Up Area (Sq.Ft)",
      type: "text",
      placeholder: "e.g. 2400",
      required: true,
    },
    {
      name: "processionDate",
      label: "Procession Date",
      type: "date",
      required: true,
    },
    {
      name: "propertyType",
      label: "Property Type",
      type: "select",
      options: PROPERTY_TYPES,
      required: true,
    },
    {
      name: "location",
      label: "City / Location",
      type: "text",
      placeholder: "e.g. Chennai, Tamil Nadu",
      icon: GrLocation,
      required: true,
    },
  ],
};

const SectionHeader = ({ children }) => (
  <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-select-blue mb-4">
    <span className="w-0.5 h-3.5 bg-select-blue rounded-full shrink-0" />
    {children}
  </h2>
);

function NewInquiriesform({ onClose, onAddLead }) {

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePresetChange = (e) => {
    const key = e.target.value;
    setFormData((prev) => ({ ...prev, ...buildPresetState(key) }));
  };

  const validate = () => {
    const newErrors = {};
    const allFields = [
      ...FIELD_CONFIG.clientInfo,
      ...FIELD_CONFIG.projectDetails,
    ];
    allFields.forEach((f) => {
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
      await onAddLead?.(formData);
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
        onClick={() => {
          setFormData(INITIAL_FORM_STATE);
          setErrors({});
        }}
        disabled={isSubmitting}
        className="text-sm font-medium text-text-muted hover:text-text transition-colors disabled:opacity-50"
      >
        Clear
      </button>
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
        form="new-inquiry-form"
        disabled={isSubmitting}
        className="min-w-[140px] flex items-center justify-center gap-2 px-7 py-2.5 rounded-lg bg-select-blue text-white text-sm font-medium hover:bg-primary shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Creating…
          </>
        ) : (
          "Create Inquiry"
        )}
      </button>
    </div>
  );

  return (
    <Modal
      title="Add New Inquiry"
      subtitle="Fill in the client and project details to create a new inquiry"
      onClose={isSubmitting ? undefined : onClose}
      footer={footer}
    >
      <form id="new-inquiry-form" onSubmit={handleSubmit} noValidate>
        <div className="mb-6">
          <SectionHeader>Client Information</SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            {FIELD_CONFIG.clientInfo.slice(0, 2).map(field)}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {FIELD_CONFIG.clientInfo.slice(2, 4).map(field)}
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        <div className="mb-6">
          <SectionHeader>Project Details</SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            {FIELD_CONFIG.projectDetails.map(field)}
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        <div className="mb-6">
          <SectionHeader>Property Preset</SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              name="quotePreset"
              label="Preset"
              type="select"
              value={formData.quotePreset}
              onChange={handlePresetChange}
              options={getPresetKeys()}
            />
            <InputField
              name="quoteSizeRange"
              label="Size Range"
              type="text"
              value={formData.quoteSizeRange}
              onChange={handleChange}
              placeholder="e.g. 800–1100 sq ft"
            />
          </div>
          <p className="text-[11px] text-text-subtle mt-2">
            The proposal you send later will start from this preset. Scope
            items are added when sending the proposal.
          </p>
        </div>

        <div className="border-t border-border mb-6" />

        <>
          <SectionHeader>Notes</SectionHeader>

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

          <p className="text-[11px] text-text-subtle mt-3">
            New inquiries start as <strong>Inquiry</strong>. Move them through
            the pipeline from the lead detail page.
          </p>
        </>
      </form>
    </Modal>
  );
}

export default NewInquiriesform;
