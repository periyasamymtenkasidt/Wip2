import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Modal from "../../components/Modal";
import InputField from "../../components/InputField";
import { PAYMENT_MILESTONES } from "../../data/MilestoneConfig";
import { formatAmount } from "../../utils/formatAmount";

// Parse a lead's investment range (e.g. "₹60L-70L", "₹50L – ₹1Cr", "₹1-1.2Cr")
// and return the midpoint as a number, used to auto-suggest the confirmed
// project value at conversion time.
const parseInvestmentMidpoint = (str) => {
  if (!str) return 0;
  const clean = str.replace(/[₹\s]/g, "");
  const parts = clean.split(/[-–]/);
  const parseOne = (s) => {
    const num = parseFloat(s.replace(/[^\d.]/g, ""));
    if (isNaN(num)) return 0;
    if (/cr/i.test(s)) return num * 10000000;
    if (/l/i.test(s)) return num * 100000;
    return num;
  };
  // If only the trailing part has a unit ("60-70L"), apply it to both
  if (parts.length === 2) {
    const tailUnit = /cr/i.test(parts[1]) ? 1e7 : /l/i.test(parts[1]) ? 1e5 : 1;
    const headHasUnit = /cr|l/i.test(parts[0]);
    const a = headHasUnit ? parseOne(parts[0]) : parseOne(parts[0]) * tailUnit;
    const b = parseOne(parts[1]);
    return Math.round((a + b) / 2);
  }
  return Math.round(parseOne(parts[0]));
};

// Resolve property type + city across two lead shapes:
//  - static TableData: { location: "Luxury Villa", locationSecondary: "Beverly Hills, CA" }
//  - new lead form:    { propertyType: "Penthouse", location: "Chennai" }
const resolveLeadAddress = (lead) => {
  if (lead.propertyType) {
    return {
      propertyType: lead.propertyType,
      city: lead.location || "",
    };
  }
  return {
    propertyType: lead.location || "",
    city: lead.locationSecondary || "",
  };
};

const SectionHeader = ({ children }) => (
  <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-select-blue mb-4">
    <span className="w-0.5 h-3.5 bg-select-blue rounded-full shrink-0" />
    {children}
  </h2>
);

function ConvertToClientForm({ lead, onClose, onConvert }) {
  const navigate = useNavigate();
  const { propertyType, city } = resolveLeadAddress(lead);
  const suggestedValue = parseInvestmentMidpoint(lead.investment);
  const [formData, setFormData] = useState({
    clientName: lead.clientName || "",
    clientPhone: lead.phone || "",
    clientEmail: lead.email || "",
    location: propertyType,
    locationSecondary: city,
    addressLine1: "",
    addressLine2: "",
    city: city,
    state: "",
    pincode: "",
    landmark: "",
    projectValue: suggestedValue ? String(suggestedValue) : "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const numericValue = parseFloat(formData.projectValue.replace(/[^\d.]/g, "")) || 0;

  const validate = () => {
    const newErrors = {};
    if (!formData.clientName.trim()) newErrors.clientName = "Client Name is required";
    if (!/^\d{10}$/.test(formData.clientPhone.replace(/\s/g, "")))
      newErrors.clientPhone = "Must be a 10-digit number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail.trim()))
      newErrors.clientEmail = "Enter a valid email address";
    if (!formData.addressLine1.trim())
      newErrors.addressLine1 = "Door no, building & street is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!/^\d{6}$/.test(formData.pincode.trim()))
      newErrors.pincode = "Must be a 6-digit PIN code";
    if (!formData.projectValue.trim() || numericValue <= 0)
      newErrors.projectValue = "Enter a valid project value (numbers only, e.g. 7500000)";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setIsSubmitting(true);
    try {
      await onConvert?.(formData, numericValue);
      onClose?.();
      navigate("/clients");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        form="convert-client-form"
        disabled={isSubmitting}
        className="min-w-[160px] flex items-center justify-center gap-2 px-7 py-2.5 rounded-lg bg-select-blue text-white text-sm font-medium hover:bg-primary shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <><Loader2 size={14} className="animate-spin" />Converting…</>
        ) : "Convert to Client"}
      </button>
    </div>
  );

  return (
    <Modal
      title="Convert to Client"
      subtitle="Auto-filled from the qualified lead — review and confirm the project value"
      onClose={isSubmitting ? undefined : onClose}
      footer={footer}
    >
      <form id="convert-client-form" onSubmit={handleSubmit} noValidate>

        <div className="mb-6">
          <SectionHeader>Client Information</SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            <InputField name="clientName" label="Client Name" type="text" value={formData.clientName} onChange={handleChange} error={errors.clientName} placeholder="Full name" />
            <InputField name="clientPhone" label="Phone Number" type="tel" value={formData.clientPhone} onChange={handleChange} error={errors.clientPhone} placeholder="10-digit number" />
          </div>
          <div className="mt-4">
            <InputField name="clientEmail" label="Email Address" type="email" value={formData.clientEmail} onChange={handleChange} error={errors.clientEmail} placeholder="example@domain.com" />
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        <div className="mb-6">
          <SectionHeader>Property Type</SectionHeader>
          <div className="rounded-xl border border-border bg-bg-soft px-4 py-3 flex items-center justify-between">
            <p className="text-[14px] font-semibold text-text">
              {formData.location || "—"}
            </p>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
              Mapped from lead
            </span>
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        <div className="mb-6">
          <SectionHeader>Site Address</SectionHeader>
          <p className="text-[11px] text-text-muted mb-3 -mt-2">
            Full address is required for site visits, 3D drawings, and material delivery.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <InputField
              name="addressLine1"
              label="Address Line 1 (Door no, Building, Street)"
              type="text"
              value={formData.addressLine1}
              onChange={handleChange}
              error={errors.addressLine1}
              placeholder="e.g. Flat 3B, Marina Heights, 14th Cross Road"
            />
            <InputField
              name="addressLine2"
              label="Address Line 2 (Area, Landmark) — optional"
              type="text"
              value={formData.addressLine2}
              onChange={handleChange}
              placeholder="e.g. Indiranagar, near Metro Station"
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <InputField
              name="city"
              label="City"
              type="text"
              value={formData.city}
              onChange={handleChange}
              error={errors.city}
              placeholder="e.g. Chennai"
            />
            <InputField
              name="state"
              label="State"
              type="text"
              value={formData.state}
              onChange={handleChange}
              error={errors.state}
              placeholder="e.g. Tamil Nadu"
            />
            <InputField
              name="pincode"
              label="PIN Code"
              type="text"
              value={formData.pincode}
              onChange={handleChange}
              error={errors.pincode}
              placeholder="6-digit PIN"
            />
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        <div>
          <SectionHeader>Project Value &amp; Payment Milestones</SectionHeader>
          <InputField
            name="projectValue"
            label="Confirmed Project Value (₹ in numbers)"
            type="text"
            value={formData.projectValue}
            onChange={handleChange}
            error={errors.projectValue}
            placeholder="e.g. 7500000"
          />
          {lead.investment && (
            <p className="mt-2 text-[11px] text-text-muted">
              Lead budget range:&nbsp;
              <span className="font-semibold text-text">{lead.investment}</span>
              {suggestedValue > 0 && (
                <>
                  &nbsp;· Suggested midpoint:&nbsp;
                  <span className="font-semibold text-select-blue">
                    {formatAmount(suggestedValue)}
                  </span>
                </>
              )}
            </p>
          )}

          {numericValue > 0 && (
            <div className="mt-5 rounded-xl border border-border overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_48px_110px_80px_110px] bg-bg-soft px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                <span>Milestone</span>
                <span className="text-center">%</span>
                <span className="text-right">Base</span>
                <span className="text-right">GST 18%</span>
                <span className="text-right">Total Due</span>
              </div>

              {PAYMENT_MILESTONES.map((m, idx) => {
                const base    = Math.round(numericValue * m.pct / 100);
                const gstAmt  = Math.round(base * m.gst / 100);
                const total   = base + gstAmt;
                return (
                  <div
                    key={m.id}
                    className={`grid grid-cols-[1fr_48px_110px_80px_110px] px-4 py-3 items-center text-[13px] ${idx < PAYMENT_MILESTONES.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-active-bg text-select-blue text-[10px] font-bold flex items-center justify-center shrink-0">
                        {m.id}
                      </span>
                      <span className="font-medium text-text">{m.name}</span>
                    </div>
                    <span className="text-center font-bold text-select-blue">{m.pct}%</span>
                    <span className="text-right text-text-muted">{formatAmount(base)}</span>
                    <span className="text-right text-orange-500 font-medium">+{formatAmount(gstAmt)}</span>
                    <span className="text-right font-bold text-text">{formatAmount(total)}</span>
                  </div>
                );
              })}

              {/* Totals row */}
              {(() => {
                const totalBase = PAYMENT_MILESTONES.reduce((s, m) => s + Math.round(numericValue * m.pct / 100), 0);
                const totalGst  = PAYMENT_MILESTONES.reduce((s, m) => {
                  const base = Math.round(numericValue * m.pct / 100);
                  return s + Math.round(base * m.gst / 100);
                }, 0);
                return (
                  <div className="grid grid-cols-[1fr_48px_110px_80px_110px] px-4 py-3 bg-bg-soft border-t border-border text-[13px] font-bold">
                    <span className="text-text">Total</span>
                    <span className="text-center text-select-blue">100%</span>
                    <span className="text-right text-text-muted">{formatAmount(totalBase)}</span>
                    <span className="text-right text-orange-500">+{formatAmount(totalGst)}</span>
                    <span className="text-right text-text">{formatAmount(totalBase + totalGst)}</span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

      </form>
    </Modal>
  );
}

export default ConvertToClientForm;
