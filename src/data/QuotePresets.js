// Preset templates and helpers for the Quick Quote / Send Proposal flows.
// The hardcoded DEFAULT_PRESETS below are the factory baseline — actual reads
// go through getMaster()/getPresets() which honour user overrides saved in
// localStorage from the Settings → Proposal Master page.

export const GST_RATE = 18;

const COMMON_INCLUSIONS = [
  "Site measurement & 2D drawings",
  "3D visualizations of all rooms",
  "Material as per quote specification",
  "Installation & finishing",
  "Project management throughout",
  "1-year service warranty",
];

const COMMON_EXCLUSIONS = [
  "Civil work — demolition, plumbing, electrical rough-in",
  "Appliances & soft furnishings (curtains, linen, decor)",
  "Society / building approval charges",
  "Any items not explicitly listed in the scope",
];

// Material-spec sets reused across multiple presets. Each entry is shown
// inline under its scope row in the rendered quote (Plywood: BWP 19mm…).
const MAT_LIVING = [
  { name: "Plywood", spec: "MR 18mm" },
  { name: "Laminate", spec: "Greenply / Century" },
  { name: "Lighting", spec: "Philips / Wipro LED" },
];
const MAT_KITCHEN = [
  { name: "Plywood", spec: "BWP 19mm" },
  { name: "Hardware", spec: "Hettich / Hafele" },
  { name: "Counter", spec: "Granite slab" },
];
const MAT_BEDROOM = [
  { name: "Plywood", spec: "MR 16mm" },
  { name: "Laminate", spec: "Century / Greenply" },
  { name: "Hardware", spec: "Hafele soft-close" },
];
const MAT_BATHROOM = [
  { name: "Vanity", spec: "Marine ply + laminate" },
  { name: "Mirror", spec: "Saint-Gobain 5mm" },
  { name: "Hardware", spec: "Jaquar / Hindware" },
];
const MAT_FOYER = [
  { name: "Plywood", spec: "MR 16mm" },
  { name: "Laminate", spec: "Greenply" },
];

export const DEFAULT_PRESETS = {
  "1BHK": {
    label: "1 BHK Apartment",
    propertyType: "Apartment",
    propertyTypes: ["Apartment", "Studio Apartment"],
    // Price multiplier per property type. Same scope, different finishes
    // and accessibility → different cost. 1.0 = baseline.
    propertyTypeMultipliers: {
      "Apartment": 1.0,
      "Studio Apartment": 0.85,
    },
    sizeRange: "450–600 sq ft",
    scopeItems: [
      { area: "Living Room", description: "False ceiling, accent wall, TV unit, lighting", amount: 80000, materials: MAT_LIVING },
      { area: "Kitchen", description: "Modular kitchen — base + wall units, granite, chimney, hob", amount: 150000, materials: MAT_KITCHEN },
      { area: "Master Bedroom", description: "Wardrobe, bed back panel, study unit, lighting", amount: 90000, materials: MAT_BEDROOM },
      { area: "Bathroom", description: "Vanity, mirror, shower partition, accessories", amount: 30000, materials: MAT_BATHROOM },
    ],
    inclusions: COMMON_INCLUSIONS,
    exclusions: COMMON_EXCLUSIONS,
  },
  "2BHK": {
    label: "2 BHK Apartment",
    propertyType: "Apartment",
    propertyTypes: ["Apartment", "Penthouse", "Duplex"],
    propertyTypeMultipliers: {
      "Apartment": 1.0,
      "Penthouse": 1.2,
      "Duplex": 1.15,
    },
    sizeRange: "800–1100 sq ft",
    scopeItems: [
      { area: "Living + Dining", description: "False ceiling, TV unit, crockery unit, lighting", amount: 130000, materials: MAT_LIVING },
      { area: "Kitchen", description: "L-shaped modular kitchen, granite, chimney, hob, water purifier provision", amount: 180000, materials: MAT_KITCHEN },
      { area: "Master Bedroom", description: "Wardrobe, bed back panel, dresser, lighting", amount: 110000, materials: MAT_BEDROOM },
      { area: "Second Bedroom", description: "Wardrobe, study unit, lighting", amount: 95000, materials: MAT_BEDROOM },
      { area: "Bathrooms (×2)", description: "Vanity, mirror, shower partition, accessories", amount: 55000, materials: MAT_BATHROOM },
      { area: "Foyer & Passage", description: "Shoe rack, console, accent paint, lighting", amount: 30000, materials: MAT_FOYER },
    ],
    inclusions: COMMON_INCLUSIONS,
    exclusions: COMMON_EXCLUSIONS,
  },
  "3BHK": {
    label: "3 BHK Apartment",
    propertyType: "Apartment",
    propertyTypes: ["Apartment", "Penthouse", "Duplex", "Independent House"],
    propertyTypeMultipliers: {
      "Apartment": 1.0,
      "Penthouse": 1.2,
      "Duplex": 1.15,
      "Independent House": 1.25,
    },
    sizeRange: "1200–1600 sq ft",
    scopeItems: [
      { area: "Living + Dining", description: "Designer false ceiling, TV unit, bar/crockery unit, accent wall, lighting", amount: 180000, materials: MAT_LIVING },
      { area: "Kitchen", description: "U-shaped modular kitchen, premium granite, chimney, hob, tall units", amount: 220000, materials: MAT_KITCHEN },
      { area: "Master Bedroom", description: "Wardrobe with loft, bed back panel, dresser, study, lighting", amount: 140000, materials: MAT_BEDROOM },
      { area: "Second Bedroom", description: "Wardrobe, bed back panel, study unit, lighting", amount: 105000, materials: MAT_BEDROOM },
      { area: "Third Bedroom / Kids", description: "Wardrobe, bunk/study unit, lighting", amount: 95000, materials: MAT_BEDROOM },
      { area: "Bathrooms (×3)", description: "Vanity, mirror, shower partition, accessories", amount: 75000, materials: MAT_BATHROOM },
      { area: "Foyer & Passage", description: "Shoe rack, console, accent paint, lighting", amount: 35000, materials: MAT_FOYER },
    ],
    inclusions: COMMON_INCLUSIONS,
    exclusions: COMMON_EXCLUSIONS,
  },
  "Villa": {
    label: "Villa / Independent House",
    propertyType: "Independent House",
    propertyTypes: [
      "Luxury Villa",
      "Independent House",
      "Farm House",
      "Beach House",
    ],
    propertyTypeMultipliers: {
      "Luxury Villa": 1.0,
      "Independent House": 0.9,
      "Farm House": 0.95,
      "Beach House": 1.1,
    },
    sizeRange: "2400+ sq ft",
    scopeItems: [
      { area: "Foyer & Living", description: "Double-height ceiling treatment, TV unit, accent walls, designer lighting", amount: 280000, materials: MAT_LIVING },
      { area: "Formal & Family Dining", description: "Crockery unit, accent wall, statement lighting", amount: 150000, materials: MAT_LIVING },
      { area: "Kitchen + Utility", description: "Premium modular kitchen, island, tall units, utility cabinetry", amount: 320000, materials: MAT_KITCHEN },
      { area: "Master Bedroom Suite", description: "Walk-in wardrobe, bed back panel, dresser, lounge unit, lighting", amount: 220000, materials: MAT_BEDROOM },
      { area: "Bedrooms (×2)", description: "Wardrobes, bed back panels, study units, lighting", amount: 240000, materials: MAT_BEDROOM },
      { area: "Home Office / Study", description: "Built-in desk, storage, lighting", amount: 90000, materials: MAT_BEDROOM },
      { area: "Bathrooms (×4)", description: "Vanity, mirror, shower partition, accessories", amount: 120000, materials: MAT_BATHROOM },
      { area: "Staircase & Common Areas", description: "Railing finishing, accent walls, lighting", amount: 80000, materials: MAT_FOYER },
    ],
    inclusions: COMMON_INCLUSIONS,
    exclusions: COMMON_EXCLUSIONS,
  },
};

// ── Master read/write ─────────────────────────────────────────────────────
// Settings → Proposal Master writes here. Every consumer (QuoteModal, inquiry
// forms, etc.) reads through getPresets()/getPreset() so master edits flow
// into new proposals immediately, while existing saved quotes keep their
// own snapshot.

const MASTER_KEY = "quoteMaster";

// One preset can apply to several physical property types (a 2BHK fit-out
// is the same kitchen/wardrobe scope whether it's an apartment or a
// penthouse). `propertyTypes` is the array of allowed types;
// `propertyTypeMultipliers` is a parallel map of cost multipliers so the
// same scope can quote at different prices per property type.
// `propertyType` is kept as the primary/default for back-compat.
const normalizePreset = (p) => {
  if (!p) return p;
  let next = { ...p };
  if (Array.isArray(next.propertyTypes) && next.propertyTypes.length > 0) {
    next.propertyType = next.propertyType || next.propertyTypes[0];
  } else if (next.propertyType) {
    next.propertyTypes = [next.propertyType];
  } else {
    next.propertyTypes = [];
    next.propertyType = "";
  }
  const multipliers = { ...(next.propertyTypeMultipliers || {}) };
  for (const t of next.propertyTypes) {
    if (typeof multipliers[t] !== "number" || multipliers[t] <= 0) {
      multipliers[t] = 1;
    }
  }
  next.propertyTypeMultipliers = multipliers;
  return next;
};

// Resolve the price multiplier for a given property type within a preset.
// Falls back to 1.0 (no premium / discount) if not configured.
export const getMultiplierFor = (preset, type) => {
  if (!preset || !type) return 1;
  const m = preset.propertyTypeMultipliers?.[type];
  return typeof m === "number" && m > 0 ? m : 1;
};

const normalizeMaster = (master) => {
  const out = {};
  for (const k of Object.keys(master || {})) {
    out[k] = normalizePreset(master[k]);
  }
  return out;
};

export const getMaster = () => {
  try {
    const raw = localStorage.getItem(MASTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return normalizeMaster(parsed);
      }
    }
  } catch {
    // fall through to defaults
  }
  return normalizeMaster(DEFAULT_PRESETS);
};

export const saveMaster = (master) => {
  localStorage.setItem(MASTER_KEY, JSON.stringify(master));
};

export const resetMaster = () => {
  localStorage.removeItem(MASTER_KEY);
};

export const getPresets = () => getMaster();
export const getPresetKeys = () => Object.keys(getMaster());
export const getPreset = (key) => getMaster()[key];

// Backwards-compat alias — some callers import QUOTE_PRESETS directly. New
// code should prefer getPresets()/getPreset().
export const QUOTE_PRESETS = DEFAULT_PRESETS;
export const PRESET_KEYS = Object.keys(DEFAULT_PRESETS);

export const sumScope = (items) =>
  items.reduce((s, it) => s + (Number(it.amount) || 0), 0);

export const computeTotals = (items, gstRate = GST_RATE) => {
  const subtotal = sumScope(items);
  const gst = Math.round((subtotal * gstRate) / 100);
  return { subtotal, gst, grandTotal: subtotal + gst };
};

// Derive a tiered list of investment ranges from a preset's baseline
// (in rupees). Bands move outward from the baseline so the user can
// place themselves on the Budget → Bespoke continuum without typing
// any numbers. Returned strings are stable so they survive as the
// saved value on the lead record.
const fmtLakhs = (lakhs) => {
  if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(1)}Cr`;
  return `₹${Math.round(lakhs)}L`;
};

export const generateInvestmentBands = (baselineRupees) => {
  if (!baselineRupees || baselineRupees <= 0) return [];
  const B = baselineRupees / 100000;
  return [
    `${fmtLakhs(B * 0.8)} – ${fmtLakhs(B * 1.0)}`,
    `${fmtLakhs(B * 1.0)} – ${fmtLakhs(B * 1.3)}`,
    `${fmtLakhs(B * 1.3)} – ${fmtLakhs(B * 1.7)}`,
    `${fmtLakhs(B * 1.7)} – ${fmtLakhs(B * 2.2)}`,
    `${fmtLakhs(B * 2.2)}+`,
  ];
};

// All quote IDs across all parents share the same yearly counter so the IDs
// stay globally unique. The counter is the count of `quotes_*` localStorage
// records that already exist.
const countAllQuotes = () => {
  let n = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("quotes_")) continue;
    try {
      n += JSON.parse(localStorage.getItem(key) || "[]").length;
    } catch {
      // ignore corrupt entries
    }
  }
  return n;
};

export const generateQuoteId = () =>
  `QT-${new Date().getFullYear()}-${String(countAllQuotes() + 1).padStart(3, "0")}`;

const storageKey = (parentId) => `quotes_${parentId}`;

export const getQuotesForParent = (parentId) => {
  if (!parentId) return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(parentId)) || "[]");
  } catch {
    return [];
  }
};

export const saveQuote = (parentId, quote) => {
  const list = getQuotesForParent(parentId);
  const next = [
    quote,
    ...list.filter((q) => q.quoteId !== quote.quoteId),
  ];
  localStorage.setItem(storageKey(parentId), JSON.stringify(next));
  return next;
};

// Documents are auto-saved snapshots of any quote that gets emailed. They
// power the "Documents" card on the Lead detail view so the user has a
// permanent record of what was sent.
const documentsKey = (leadId) => `leadDocuments_${leadId}`;

export const getDocumentsForLead = (leadId) => {
  if (!leadId) return [];
  try {
    return JSON.parse(localStorage.getItem(documentsKey(leadId)) || "[]");
  } catch {
    return [];
  }
};

export const saveQuoteDocument = (leadId, quote) => {
  if (!leadId) return [];
  const list = getDocumentsForLead(leadId);
  const entry = {
    docId: `${quote.quoteId}-${Date.now()}`,
    quoteId: quote.quoteId,
    fileName: `${quote.quoteId}_${(quote.recipientName || "Quote")
      .replace(/\s+/g, "_")}.pdf`,
    sentTo: quote.recipientEmail,
    sentAt: quote.sentAt || new Date().toISOString(),
    grandTotal: quote.grandTotal,
    snapshot: quote,
  };
  const next = [entry, ...list];
  localStorage.setItem(documentsKey(leadId), JSON.stringify(next));
  return next;
};

// Find the most recent quote for a lead — used to pre-fill the Resend flow.
export const getLatestQuoteForParent = (parentId) => {
  const list = getQuotesForParent(parentId);
  return list[0] || null;
};
