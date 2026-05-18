import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  RotateCcw,
  Save,
  Check,
  X,
  Copy,
  ChevronDown,
  ChevronRight,
  Layers,
  Package,
  FileText,
  Search,
  Home,
  Ruler,
  Tag,
  CheckCircle2,
  XCircle,
  Sparkles,
  TrendingUp,
  Hash,
  IndianRupee,
  GripVertical,
  ChefHat,
  Sofa,
  Bed,
  Bath,
  DoorOpen,
  BookOpen,
  Building2,
  Command,
  BarChart3,
  Wallet,
  ArrowUpDown,
  AlertTriangle,
  Info,
  Wand2,
  Keyboard,
  Pencil,
} from "lucide-react";
import {
  getMaster,
  saveMaster,
  resetMaster,
  computeTotals,
  GST_RATE,
  DEFAULT_PRESETS,
} from "../../data/QuotePresets";
import { formatAmount } from "../../utils/formatAmount";
import ItemFormModal from "../../components/ItemFormModal";
import { computeLibraryItemAmount } from "../../data/itemLibrary";
import { PROPERTY_TYPES } from "../../helperConfigData/helperData";

const blankScope = () => ({
  area: "",
  description: "",
  amount: 0,
  materials: [],
});

const blankPreset = (propertyType = "Apartment") => ({
  label: "New Preset",
  configurations: [
    {
      propertyType,
      multiplier: 1,
      sizeRange: "",
      scopeItems: [],
      inclusions: [],
      exclusions: [],
    },
  ],
});

const inputBase =
  "bg-white border border-bordergray text-[12px] text-textcolor rounded-lg px-3 py-2 w-full focus:outline-none focus:border-select-blue focus:ring-2 focus:ring-select-blue/15 transition-all placeholder:text-text-subtle";

const CATEGORY_STYLES = {
  kitchen: { color: "orange", icon: ChefHat },
  living: { color: "blue", icon: Sofa },
  dining: { color: "blue", icon: Sofa },
  bedroom: { color: "purple", icon: Bed },
  master: { color: "purple", icon: Bed },
  bath: { color: "teal", icon: Bath },
  foyer: { color: "amber", icon: DoorOpen },
  passage: { color: "amber", icon: DoorOpen },
  study: { color: "indigo", icon: BookOpen },
  office: { color: "indigo", icon: BookOpen },
  stair: { color: "slate", icon: Building2 },
  utility: { color: "slate", icon: Package },
};

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    bar: "bg-blue-500",
    dot: "bg-blue-500",
    border: "border-blue-200",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    bar: "bg-orange-500",
    dot: "bg-orange-500",
    border: "border-orange-200",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    bar: "bg-purple-500",
    dot: "bg-purple-500",
    border: "border-purple-200",
  },
  teal: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    bar: "bg-teal-500",
    dot: "bg-teal-500",
    border: "border-teal-200",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    bar: "bg-indigo-500",
    dot: "bg-indigo-500",
    border: "border-indigo-200",
  },
  slate: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    bar: "bg-slate-500",
    dot: "bg-slate-500",
    border: "border-slate-200",
  },
  gray: {
    bg: "bg-bg-soft",
    text: "text-text-muted",
    bar: "bg-text-subtle",
    dot: "bg-text-subtle",
    border: "border-bordergray",
  },
};

const getCategory = (area) => {
  const a = (area || "").toLowerCase();
  for (const key of Object.keys(CATEGORY_STYLES)) {
    if (a.includes(key)) return CATEGORY_STYLES[key];
  }
  return { color: "gray", icon: Package };
};

const extractAvgSqft = (sizeRange) => {
  const nums = (sizeRange || "").match(/\d+/g);
  if (!nums || nums.length === 0) return null;
  if (nums.length === 1) return parseInt(nums[0]);
  return Math.round((parseInt(nums[0]) + parseInt(nums[1])) / 2);
};

// Quick-add chips: common rooms users add most often.
const QUICK_AREAS = [
  {
    name: "Living Room",
    icon: Sofa,
    hint: "False ceiling, TV unit, accent wall",
  },
  { name: "Kitchen", icon: ChefHat, hint: "Modular kitchen, granite, chimney" },
  {
    name: "Master Bedroom",
    icon: Bed,
    hint: "Wardrobe, bed back panel, dresser",
  },
  { name: "Bedroom", icon: Bed, hint: "Wardrobe, study unit, lighting" },
  { name: "Bathroom", icon: Bath, hint: "Vanity, mirror, shower partition" },
  {
    name: "Foyer & Passage",
    icon: DoorOpen,
    hint: "Shoe rack, console, accent paint",
  },
  {
    name: "Study / Office",
    icon: BookOpen,
    hint: "Built-in desk, storage, lighting",
  },
];

// Common material presets per category — one-click add to a scope row.
const COMMON_MATERIALS = {
  kitchen: [
    { name: "Plywood", spec: "BWP 19mm" },
    { name: "Hardware", spec: "Hettich / Hafele" },
    { name: "Counter", spec: "Granite slab" },
  ],
  living: [
    { name: "Plywood", spec: "MR 18mm" },
    { name: "Laminate", spec: "Greenply / Century" },
    { name: "Lighting", spec: "Philips / Wipro LED" },
  ],
  bedroom: [
    { name: "Plywood", spec: "MR 16mm" },
    { name: "Laminate", spec: "Century / Greenply" },
    { name: "Hardware", spec: "Hafele soft-close" },
  ],
  bath: [
    { name: "Vanity", spec: "Marine ply + laminate" },
    { name: "Mirror", spec: "Saint-Gobain 5mm" },
    { name: "Hardware", spec: "Jaquar / Hindware" },
  ],
  foyer: [
    { name: "Plywood", spec: "MR 16mm" },
    { name: "Laminate", spec: "Greenply" },
  ],
};

const ProposalMaster = () => {
  const [master, setMaster] = useState(() => getMaster());
  const [activeKey, setActiveKey] = useState(() => {
    const keys = Object.keys(getMaster());
    return keys[0] || "2BHK";
  });
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [newPresetKey, setNewPresetKey] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [presetSearch, setPresetSearch] = useState("");
  const [sortBy, setSortBy] = useState("order");
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  // Whether the shared Item Form modal is open for adding a new scope row.
  const [scopeFormOpen, setScopeFormOpen] = useState(false);
  // Rename mode for the active preset's key.
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const presetKeys = Object.keys(master);
  const active = master[activeKey];
  const [activeConfigIdx, setActiveConfigIdx] = useState(0);

  // Reset config tab when switching presets
  useEffect(() => {
    setActiveConfigIdx(0);
  }, [activeKey]);

  // Derived: the currently-active property-type configuration
  const activeConfig = active?.configurations?.[activeConfigIdx] || active?.configurations?.[0];

  useEffect(() => {
    saveMaster(master);
  }, [master]);

  const showToast = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const askConfirm = (cfg) => setConfirmDialog(cfg);

  // Preset-level updates (e.g. label)
  const updateActive = (changes) => {
    setMaster((prev) => ({
      ...prev,
      [activeKey]: { ...prev[activeKey], ...changes },
    }));
  };

  // Config-level updates (scope, inclusions, exclusions, sizeRange, etc.)
  const setConfigField = (updater) => {
    setMaster((prev) => {
      const preset = prev[activeKey];
      const configs = [...(preset.configurations || [])];
      configs[activeConfigIdx] = updater({ ...configs[activeConfigIdx] });
      return { ...prev, [activeKey]: { ...preset, configurations: configs } };
    });
  };

  const updateScope = (idx, key, value) => {
    setConfigField((cfg) => ({
      ...cfg,
      scopeItems: cfg.scopeItems.map((s, i) =>
        i === idx ? { ...s, [key]: value } : s,
      ),
    }));
  };

  const addScopeRow = (preset) => {
    const newRow = preset
      ? { area: preset.name, description: preset.hint || "", amount: 0, materials: [] }
      : blankScope();
    setConfigField((cfg) => ({
      ...cfg,
      scopeItems: [...cfg.scopeItems, newRow],
    }));
    setExpanded((p) => ({ ...p, [activeConfig?.scopeItems?.length || 0]: false }));
    if (preset) showToast(`Added "${preset.name}"`, "success");
  };

  // Save handler for the shared Item Form modal opened by "Add Scope".
  const handleScopeFormSave = (form) => {
    const computed = computeLibraryItemAmount(form);
    const newRow = {
      area: form.description || "",
      description: form.spec || "",
      amount: computed,
      materials: form.materials ? form.materials.map((m) => ({ ...m })) : [],
    };
    setConfigField((cfg) => ({
      ...cfg,
      scopeItems: [...cfg.scopeItems, newRow],
    }));
    setScopeFormOpen(false);
    showToast(`Added "${newRow.area || "scope"}"`, "success");
  };

  const removeScopeRow = (idx) => {
    setConfigField((cfg) => ({
      ...cfg,
      scopeItems: cfg.scopeItems.filter((_, i) => i !== idx),
    }));
    showToast("Scope item removed", "info");
  };

  const updateMaterial = (scopeIdx, matIdx, key, value) => {
    setConfigField((cfg) => ({
      ...cfg,
      scopeItems: cfg.scopeItems.map((s, i) =>
        i === scopeIdx
          ? { ...s, materials: (s.materials || []).map((m, j) => j === matIdx ? { ...m, [key]: value } : m) }
          : s,
      ),
    }));
  };

  const addMaterial = (scopeIdx, preset) => {
    const newMat = preset ?? { name: "", spec: "" };
    setConfigField((cfg) => ({
      ...cfg,
      scopeItems: cfg.scopeItems.map((s, i) =>
        i === scopeIdx
          ? { ...s, materials: [...(s.materials || []), newMat] }
          : s,
      ),
    }));
    setExpanded((p) => ({ ...p, [scopeIdx]: true }));
  };

  const applyMaterialKit = (scopeIdx) => {
    const item = activeConfig.scopeItems[scopeIdx];
    const cat = getCategory(item.area);
    const kit =
      COMMON_MATERIALS[cat.color === "purple" ? "bedroom" : ""] ||
      COMMON_MATERIALS[
        Object.keys(CATEGORY_STYLES).find((k) =>
          (item.area || "").toLowerCase().includes(k),
        ) || ""
      ];
    if (!kit) {
      showToast("Set the area first (e.g. Kitchen) to use the material kit", "info");
      return;
    }
    setConfigField((cfg) => ({
      ...cfg,
      scopeItems: cfg.scopeItems.map((s, i) =>
        i === scopeIdx
          ? { ...s, materials: [...(s.materials || []), ...kit] }
          : s,
      ),
    }));
    setExpanded((p) => ({ ...p, [scopeIdx]: true }));
    showToast(`Added ${kit.length} typical materials`, "success");
  };

  const removeMaterial = (scopeIdx, matIdx) => {
    setConfigField((cfg) => ({
      ...cfg,
      scopeItems: cfg.scopeItems.map((s, i) =>
        i === scopeIdx
          ? { ...s, materials: (s.materials || []).filter((_, j) => j !== matIdx) }
          : s,
      ),
    }));
  };

  // Inclusions / exclusions list operations (config-level)
  const updateListItem = (key, idx, value) => {
    setConfigField((cfg) => {
      const list = [...(cfg[key] || [])];
      list[idx] = value;
      return { ...cfg, [key]: list };
    });
  };

  const addListItem = (key) => {
    setConfigField((cfg) => ({
      ...cfg,
      [key]: [...(cfg[key] || []), ""],
    }));
  };

  const removeListItem = (key, idx) => {
    setConfigField((cfg) => ({
      ...cfg,
      [key]: (cfg[key] || []).filter((_, i) => i !== idx),
    }));
  };

  const handleAddPreset = () => {
    const trimmed = newPresetKey.trim();
    if (!trimmed) return;
    if (master[trimmed]) {
      showToast("A preset with that name already exists", "error");
      return;
    }
    setMaster((prev) => ({ ...prev, [trimmed]: blankPreset() }));
    setActiveKey(trimmed);
    setNewPresetKey("");
    setShowAddPreset(false);
    showToast(`Preset "${trimmed}" created`, "success");
  };

  // Rename the active preset's key. Rebuilds the master object preserving
  // insertion order so the preset rail doesn't jump around after rename.
  const handleRenamePreset = () => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      showToast("Name can't be empty", "error");
      return;
    }
    if (trimmed === activeKey) {
      setRenaming(false);
      return;
    }
    if (master[trimmed]) {
      showToast("A preset with that name already exists", "error");
      return;
    }
    setMaster((prev) => {
      const next = {};
      for (const k of Object.keys(prev)) {
        next[k === activeKey ? trimmed : k] = prev[k];
      }
      return next;
    });
    setActiveKey(trimmed);
    setRenaming(false);
    setRenameValue("");
    showToast(`Renamed to "${trimmed}"`, "success");
  };

  const startRename = () => {
    setRenameValue(activeKey);
    setRenaming(true);
  };

  const handleDuplicatePreset = () => {
    let i = 2;
    let candidate = `${activeKey} Copy`;
    while (master[candidate]) {
      candidate = `${activeKey} Copy ${i++}`;
    }
    setMaster((prev) => ({
      ...prev,
      [candidate]: {
        ...JSON.parse(JSON.stringify(prev[activeKey])),
        label: `${prev[activeKey].label} (Copy)`,
      },
    }));
    setActiveKey(candidate);
    showToast(`Duplicated as "${candidate}"`, "success");
  };

  const handleDeletePreset = () => {
    if (presetKeys.length <= 1) {
      showToast("Keep at least one preset", "error");
      return;
    }
    askConfirm({
      title: `Delete "${activeKey}"?`,
      message:
        "This preset and all its scope items will be permanently removed. This cannot be undone.",
      confirmLabel: "Delete preset",
      danger: true,
      onConfirm: () => {
        setMaster((prev) => {
          const next = { ...prev };
          delete next[activeKey];
          return next;
        });
        setActiveKey(presetKeys.find((k) => k !== activeKey));
        showToast(`Preset "${activeKey}" deleted`, "info");
      },
    });
  };

  const handleReset = () => {
    askConfirm({
      title: "Reset all presets?",
      message:
        "All your custom presets will be replaced with the factory defaults. Custom edits will be lost.",
      confirmLabel: "Reset to defaults",
      danger: true,
      onConfirm: () => {
        resetMaster();
        setMaster(DEFAULT_PRESETS);
        setActiveKey(Object.keys(DEFAULT_PRESETS)[0]);
        showToast("Reset to factory defaults", "success");
      },
    });
  };

  const handleManualSave = () => {
    saveMaster(master);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
    showToast("All changes saved", "success");
  };

  const toggleExpanded = (idx) => {
    setExpanded((p) => ({ ...p, [idx]: !p[idx] }));
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleManualSave();
      }
      if (e.key === "Escape") {
        setConfirmDialog(null);
        setShowShortcuts(false);
      }
      if (e.key === "?" && !e.target.matches("input, textarea")) {
        setShowShortcuts((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredKeys = useMemo(() => {
    const q = presetSearch.trim().toLowerCase();
    if (!q) return presetKeys;
    return presetKeys.filter(
      (k) =>
        k.toLowerCase().includes(q) ||
        (master[k]?.label || "").toLowerCase().includes(q),
    );
  }, [presetKeys, presetSearch, master]);

  const globalStats = useMemo(() => {
    const allItems = presetKeys.flatMap((k) =>
      (master[k]?.configurations || []).flatMap((c) => c.scopeItems || []),
    );
    const totalAmount = allItems.reduce(
      (s, it) => s + (Number(it.amount) || 0),
      0,
    );
    const totalMaterials = allItems.reduce(
      (s, it) => s + (it.materials?.length || 0),
      0,
    );
    return {
      presets: presetKeys.length,
      items: allItems.length,
      materials: totalMaterials,
      avgQuote:
        presetKeys.length > 0 ? Math.round(totalAmount / presetKeys.length) : 0,
    };
  }, [presetKeys, master]);

  const sortedScope = useMemo(() => {
    if (!activeConfig) return [];
    const copy = (activeConfig.scopeItems || []).map((item, idx) => ({ item, idx }));
    if (sortBy === "amount-desc") {
      copy.sort(
        (a, b) => (Number(b.item.amount) || 0) - (Number(a.item.amount) || 0),
      );
    } else if (sortBy === "amount-asc") {
      copy.sort(
        (a, b) => (Number(a.item.amount) || 0) - (Number(b.item.amount) || 0),
      );
    } else if (sortBy === "area") {
      copy.sort((a, b) => (a.item.area || "").localeCompare(b.item.area || ""));
    }
    return copy;
  }, [activeConfig, sortBy]);

  if (!active) {
    return (
      <div className="p-8 text-text-muted text-sm">No preset selected.</div>
    );
  }

  const scopeItems = activeConfig?.scopeItems || [];
  const totals = computeTotals(scopeItems);
  const maxScope = Math.max(
    1,
    ...scopeItems.map((s) => Number(s.amount) || 0),
  );
  const avgSqft = extractAvgSqft(activeConfig?.sizeRange);
  const costPerSqft =
    avgSqft && totals.grandTotal
      ? Math.round(totals.grandTotal / avgSqft)
      : null;

  return (
    <div className="bg-overallbg font-sans h-full overflow-y-auto pb-28">
      {/* ── Top header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-overallbg/80 backdrop-blur-xl border-b border-bordergray/70">
        <div className="px-6 py-4 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-xl bg-linear-to-br from-select-blue to-primary text-white flex items-center justify-center shadow-lg shadow-select-blue/20">
              <FileText size={18} />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-overallbg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold text-textcolor leading-tight">
                  Proposal Master
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live
                </span>
              </div>
              <p className="text-[12px] text-text-muted mt-0.5">
                Quotation templates per property preset · changes apply
                instantly to new proposals
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts ( ? )"
              className="hidden sm:flex items-center gap-1 px-2.5 py-2 bg-white border border-bordergray rounded-lg text-[11px] font-semibold text-text-muted hover:bg-bg-soft hover:text-textcolor transition-all"
            >
              <Keyboard size={12} />
            </button>
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-text-muted px-2.5 py-1.5 rounded-lg bg-white/60 border border-bordergray">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Auto-saved
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-bordergray cursor-pointer rounded-lg text-[12px] font-semibold text-textcolor hover:bg-bg-soft hover:border-text-subtle transition-all"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              type="button"
              onClick={handleManualSave}
              className={`flex items-center gap-1.5 px-4 py-2 cursor-pointer rounded-lg text-[12px] font-semibold transition-all shadow-md ${
                savedFlash
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-linear-to-br from-select-blue to-primary text-white hover:shadow-select-blue/30 hover:scale-[1.02]"
              }`}
            >
              {savedFlash ? <Check size={13} /> : <Save size={13} />}
              {savedFlash ? "Saved" : "Save Changes"}
              {!savedFlash && (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-semibold bg-white/15 px-1.5 py-0.5 rounded ml-1">
                  <Command size={9} /> S
                </kbd>
              )}
            </button>
          </div>
        </div>

        {/* Bento stats banner */}
        <div className="px-6 pb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <BentoStat
            icon={<Layers size={13} />}
            label="Presets"
            value={globalStats.presets}
            tint="blue"
          />
          <BentoStat
            icon={<Hash size={13} />}
            label="Total Scope Items"
            value={globalStats.items}
            tint="purple"
          />
          <BentoStat
            icon={<Package size={13} />}
            label="Material Specs"
            value={globalStats.materials}
            tint="orange"
          />
          <BentoStat
            icon={<TrendingUp size={13} />}
            label="Avg Quote Value"
            value={formatAmount(globalStats.avgQuote)}
            tint="emerald"
          />
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_340px] gap-5">
          {/* ── Left: Preset rail ───────────────────────────────────────── */}
          <aside className="bg-white rounded-2xl border border-bordergray shadow-[0_1px_3px_rgba(15,23,42,0.04)] h-fit lg:sticky lg:top-[210px]">
            <div className="p-4 border-b border-bordergray">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Layers size={13} className="text-select-blue" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-textcolor">
                    Presets
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-text-muted bg-bg-soft px-1.5 py-0.5 rounded-md">
                  {presetKeys.length}
                </span>
              </div>
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle"
                />
                <input
                  type="text"
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  placeholder="Search presets"
                  className="w-full bg-bg-soft border border-transparent rounded-lg pl-7 pr-2 py-1.5 text-[11px] placeholder:text-text-subtle focus:outline-none focus:bg-white focus:border-select-blue/30"
                />
              </div>
            </div>

            <div className="p-2 max-h-[55vh] overflow-y-auto">
              {filteredKeys.length === 0 ? (
                <p className="text-[11px] text-text-subtle text-center py-4">
                  No matches
                </p>
              ) : (
                filteredKeys.map((k) => {
                  const p = master[k];
                  const allCfgItems = (p.configurations || []).flatMap((c) => c.scopeItems || []);
                  const t = computeTotals(allCfgItems);
                  const firstCfg = p.configurations?.[0];
                  const isActive = k === activeKey;
                  const cat = getCategory(p.label || k);
                  const c = COLOR_MAP[cat.color];
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setActiveKey(k)}
                      className={`w-full text-left rounded-xl px-3 py-2.5 mb-1 transition-all border ${
                        isActive
                          ? "bg-active-bg border-select-blue/40 shadow-[0_1px_3px_rgba(30,58,138,0.08)]"
                          : "bg-transparent border-transparent hover:bg-bg-soft"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`h-2 w-2 rounded-full shrink-0 ${c.dot}`}
                          />
                          <span
                            className={`text-[12px] font-bold truncate ${isActive ? "text-select-blue" : "text-textcolor"}`}
                          >
                            {k}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-text-muted bg-white/70 px-1.5 py-0.5 rounded-md border border-bordergray">
                          {(p.configurations || []).length} type{(p.configurations || []).length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-text-muted truncate ml-4">
                        {p.label}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-1.5 ml-4">
                        <p
                          className={`text-[10.5px] font-bold tabular-nums ${isActive ? "text-select-blue" : "text-textcolor"}`}
                        >
                          {formatAmount(t.grandTotal)}
                        </p>
                        {firstCfg?.sizeRange && (
                          <span className="text-[9.5px] text-text-subtle truncate">
                            {firstCfg.sizeRange}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-bordergray">
              {showAddPreset ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newPresetKey}
                    onChange={(e) => setNewPresetKey(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddPreset();
                      if (e.key === "Escape") {
                        setShowAddPreset(false);
                        setNewPresetKey("");
                      }
                    }}
                    placeholder="e.g. Studio"
                    className="w-full bg-white border border-bordergray rounded-lg text-[12px] px-2.5 py-2 focus:outline-none focus:border-select-blue"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddPreset}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-select-blue text-white text-[11px] font-semibold hover:bg-primary"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPreset(false);
                        setNewPresetKey("");
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-bordergray text-[11px] text-text-muted hover:bg-bg-soft"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-[10px] text-text-subtle">
                    Tip: short keys like "1BHK", "Studio", "Penthouse".
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddPreset(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-bordergray text-[11.5px] font-semibold text-text-muted hover:border-select-blue hover:text-select-blue hover:bg-active-bg/40 transition-all"
                >
                  <Plus size={13} /> New Preset
                </button>
              )}
            </div>
          </aside>

          {/* ── Middle: Editor ──────────────────────────────────────────── */}
          <main className="space-y-5 min-w-0">
            {/* Preset hero card */}
            <section className="relative bg-white rounded-2xl border border-bordergray shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-br from-select-blue/8 via-active-bg/40 to-transparent pointer-events-none" />
              <div className="relative px-5 py-4 border-b border-bordergray flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {renaming ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <Tag size={11} className="text-select-blue shrink-0" />
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenamePreset();
                          if (e.key === "Escape") {
                            setRenaming(false);
                            setRenameValue("");
                          }
                        }}
                        autoFocus
                        placeholder="e.g. 2BHK Premium"
                        className="bg-white border border-select-blue/40 rounded-md px-2 py-1 text-[12px] font-bold uppercase tracking-widest text-select-blue focus:outline-none focus:ring-2 focus:ring-select-blue/20 w-44"
                      />
                      <button
                        type="button"
                        onClick={handleRenamePreset}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-select-blue text-white text-[11px] font-semibold hover:bg-primary"
                      >
                        <Check size={11} /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenaming(false);
                          setRenameValue("");
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md border border-bordergray bg-white text-[11px] font-semibold text-text-muted hover:bg-bg-soft"
                      >
                        <X size={11} /> Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-select-blue bg-white/80 backdrop-blur px-2 py-1 rounded-md shrink-0 border border-select-blue/20">
                        <Tag size={10} /> {activeKey}
                      </span>
                      <span className="text-[12px] text-text-muted truncate">
                        {active.label}
                      </span>
                    </>
                  )}
                </div>
                {!renaming && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={startRename}
                      title="Rename this preset"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-bordergray bg-white text-[11px] font-semibold text-text-muted hover:bg-bg-soft hover:text-textcolor"
                    >
                      <Pencil size={12} /> Rename
                    </button>
                    <button
                      type="button"
                      onClick={handleDuplicatePreset}
                      title="Duplicate this preset"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-bordergray bg-white text-[11px] font-semibold text-text-muted hover:bg-bg-soft hover:text-textcolor"
                    >
                      <Copy size={12} /> Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={handleDeletePreset}
                      title="Delete this preset"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-[11px] font-semibold text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="relative p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  icon={<Tag size={11} />}
                  label="Label"
                  hint="Shown on the proposal cover"
                >
                  <input
                    type="text"
                    value={active.label}
                    onChange={(e) => updateActive({ label: e.target.value })}
                    className={inputBase}
                  />
                </Field>
                <Field
                  icon={<Ruler size={11} />}
                  label="Size Range"
                  hint="Per property type · used to compute ₹/sq ft"
                >
                  <input
                    type="text"
                    value={activeConfig?.sizeRange || ""}
                    onChange={(e) =>
                      setConfigField((cfg) => ({ ...cfg, sizeRange: e.target.value }))
                    }
                    placeholder="e.g. 800–1100 sq ft"
                    className={inputBase}
                  />
                </Field>
              </div>

              {/* ── Property Type Configuration Tabs ─────────────────── */}
              <div className="relative px-5 pb-4">
                <Field
                  icon={<Home size={11} />}
                  label="Property Types"
                  hint="Each type has its own scope, pricing & inclusions"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(active.configurations || []).map((cfg, idx) => (
                      <button
                        key={cfg.propertyType}
                        type="button"
                        onClick={() => setActiveConfigIdx(idx)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                          idx === activeConfigIdx
                            ? "bg-select-blue text-white border-select-blue shadow-sm"
                            : "bg-white text-text-muted border-bordergray hover:border-select-blue/40 hover:text-select-blue"
                        }`}
                      >
                        {idx === activeConfigIdx && <Check size={10} strokeWidth={3} />}
                        {cfg.propertyType}
                        {cfg.multiplier !== 1 && (
                          <span className={`text-[9px] font-bold ml-0.5 ${
                            idx === activeConfigIdx ? "text-white/80" : "text-select-blue"
                          }`}>×{cfg.multiplier}</span>
                        )}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const existing = (active.configurations || []).map((c) => c.propertyType);
                        const available = PROPERTY_TYPES.filter((t) => !existing.includes(t));
                        if (available.length === 0) {
                          showToast("All property types are already added", "info");
                          return;
                        }
                        const newType = available[0];
                        setMaster((prev) => {
                          const preset = prev[activeKey];
                          const configs = [...(preset.configurations || [])];
                          configs.push({
                            propertyType: newType,
                            multiplier: 1,
                            sizeRange: configs[0]?.sizeRange || "",
                            scopeItems: (configs[0]?.scopeItems || []).map((s) => ({
                              ...s,
                              materials: s.materials ? s.materials.map((m) => ({ ...m })) : [],
                            })),
                            inclusions: [...(configs[0]?.inclusions || [])],
                            exclusions: [...(configs[0]?.exclusions || [])],
                          });
                          return { ...prev, [activeKey]: { ...preset, configurations: configs } };
                        });
                        setActiveConfigIdx((active.configurations || []).length);
                        showToast(`Added "${newType}" configuration`, "success");
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-bordergray text-[11px] font-semibold text-text-muted hover:border-select-blue hover:text-select-blue transition-all"
                    >
                      <Plus size={11} /> Add Type
                    </button>
                  </div>
                </Field>
                {activeConfig && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-text-subtle font-semibold">Multiplier:</span>
                      <span className="text-[10px] font-semibold text-text-subtle">×</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        value={activeConfig.multiplier}
                        onChange={(e) => {
                          const parsed = parseFloat(e.target.value);
                          const val = !isFinite(parsed) || parsed <= 0 ? 1 : parsed;
                          setConfigField((cfg) => ({ ...cfg, multiplier: val }));
                        }}
                        title="Price multiplier vs baseline (1.0 = same)"
                        className={`w-14 text-[11px] font-bold tabular-nums bg-white border border-bordergray rounded-md px-2 py-1 focus:outline-none focus:border-select-blue ${activeConfig.multiplier !== 1 ? "text-select-blue" : "text-textcolor"}`}
                      />
                    </div>
                    {(active.configurations || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          askConfirm({
                            title: `Remove "${activeConfig.propertyType}"?`,
                            message: "This property type configuration and its scope will be removed from this preset.",
                            confirmLabel: "Remove",
                            danger: true,
                            onConfirm: () => {
                              setMaster((prev) => {
                                const preset = prev[activeKey];
                                const configs = (preset.configurations || []).filter((_, i) => i !== activeConfigIdx);
                                return { ...prev, [activeKey]: { ...preset, configurations: configs } };
                              });
                              setActiveConfigIdx(0);
                              showToast(`Removed "${activeConfig.propertyType}"`, "info");
                            },
                          });
                        }}
                        className="flex items-center gap-1 text-[10px] font-semibold text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={10} /> Remove Type
                      </button>
                    )}
                  </div>
                )}
              </div>

              {costPerSqft != null && (
                <div className="relative mx-5 mb-5 -mt-1 flex items-center gap-2 text-[11px] text-text-muted bg-bg-soft border border-bordergray rounded-lg px-3 py-2">
                  <Sparkles size={12} className="text-select-blue" />
                  <span>
                    Approximate cost per sq ft:{" "}
                    <span className="font-bold text-textcolor tabular-nums">
                      ₹{costPerSqft.toLocaleString("en-IN")}
                    </span>{" "}
                    based on {avgSqft} sq ft and current scope.
                  </span>
                </div>
              )}
            </section>

            {/* Scope editor */}
            <section className="bg-white rounded-2xl border border-bordergray shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
              <div className="px-5 py-4 border-b border-bordergray flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-select-blue/10 text-select-blue flex items-center justify-center">
                    <Package size={13} />
                  </div>
                  <div>
                    <h2 className="text-[13px] font-bold text-textcolor">
                      Scope of Work
                    </h2>
                    <p className="text-[10.5px] text-text-muted">
                      {scopeItems.length} area
                      {scopeItems.length === 1 ? "" : "s"} · {activeConfig?.propertyType || ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-bg-soft border border-bordergray rounded-lg px-2 py-1">
                    <ArrowUpDown size={11} className="text-text-subtle" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-[11px] font-semibold text-text-muted bg-transparent focus:outline-none cursor-pointer"
                    >
                      <option value="order">Manual order</option>
                      <option value="amount-desc">Cost: high → low</option>
                      <option value="amount-asc">Cost: low → high</option>
                      <option value="area">Area name (A–Z)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScopeFormOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-linear-to-br from-select-blue to-primary text-white text-[11px] font-semibold hover:shadow-md hover:shadow-select-blue/20 shadow-sm transition-all"
                  >
                    <Plus size={12} /> Add Scope
                  </button>
                </div>
              </div>

              {/* Quick-add area chips */}
              <div className="px-5 py-3 border-b border-bordergray bg-bg-soft/40">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    <Wand2 size={10} /> Quick add
                  </span>
                  {QUICK_AREAS.map((q) => {
                    const cat = getCategory(q.name);
                    const c = COLOR_MAP[cat.color];
                    const Icon = q.icon;
                    return (
                      <button
                        key={q.name}
                        type="button"
                        onClick={() => addScopeRow(q)}
                        title={q.hint}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-white border ${c.border} ${c.text} text-[10.5px] font-semibold hover:scale-[1.03] hover:shadow-sm transition-all`}
                      >
                        <Icon size={10} />
                        {q.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 space-y-3">
                {sortedScope.map(({ item, idx }) => {
                  const isOpen = !!expanded[idx];
                  const matCount = (item.materials || []).length;
                  const cat = getCategory(item.area);
                  const c = COLOR_MAP[cat.color];
                  const Icon = cat.icon;
                  const amount = Number(item.amount) || 0;
                  const pct =
                    totals.subtotal > 0
                      ? Math.round((amount / totals.subtotal) * 100)
                      : 0;
                  const barWidth = maxScope > 0 ? (amount / maxScope) * 100 : 0;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-bordergray bg-white hover:border-select-blue/40 hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition-all group"
                    >
                      <div className="p-3 grid grid-cols-[20px_28px_1fr_1.4fr_140px_28px] gap-2 items-center">
                        <button
                          type="button"
                          className="h-6 w-5 flex items-center justify-center text-text-subtle opacity-0 group-hover:opacity-100 cursor-grab"
                          title="Drag to reorder (coming soon)"
                        >
                          <GripVertical size={12} />
                        </button>
                        <span
                          className={`h-7 w-7 flex items-center justify-center rounded-lg ${c.bg} ${c.text}`}
                        >
                          <Icon size={13} />
                        </span>
                        <input
                          type="text"
                          value={item.area}
                          onChange={(e) =>
                            updateScope(idx, "area", e.target.value)
                          }
                          placeholder="Area (e.g. Living Room)"
                          className={`${inputBase} font-semibold`}
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateScope(idx, "description", e.target.value)
                          }
                          placeholder="Description"
                          className={inputBase}
                        />
                        <AmountInput
                          value={item.amount}
                          onChange={(v) => updateScope(idx, "amount", v)}
                          pct={pct}
                        />
                        <button
                          type="button"
                          onClick={() => removeScopeRow(idx)}
                          className="h-7 w-7 flex items-center justify-center rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove row"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="px-3 pb-2">
                        <div className="h-1 w-full bg-bg-soft rounded-full overflow-hidden">
                          <div
                            className={`h-full ${c.bar} transition-all`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>

                      <div className="border-t border-bordergray bg-bg-soft/40">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(idx)}
                          className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-semibold text-text-muted hover:text-select-blue"
                        >
                          <span className="flex items-center gap-1.5">
                            {isOpen ? (
                              <ChevronDown size={12} />
                            ) : (
                              <ChevronRight size={12} />
                            )}
                            Materials & Specifications
                            {matCount > 0 && (
                              <span className="ml-1 text-[10px] font-bold text-select-blue bg-white px-1.5 py-0.5 rounded-md border border-bordergray">
                                {matCount}
                              </span>
                            )}
                          </span>
                          {!isOpen && matCount > 0 && (
                            <span className="text-[10px] text-text-subtle truncate max-w-[60%]">
                              {item.materials
                                .map((m) => m.name)
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          )}
                          {isOpen && (
                            <span className="text-[10px] text-text-subtle">
                              Hide
                            </span>
                          )}
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-3 space-y-1.5">
                            {(item.materials || []).map((m, mIdx) => (
                              <div
                                key={mIdx}
                                className="grid grid-cols-[130px_1fr_24px] gap-2 items-center"
                              >
                                <input
                                  type="text"
                                  value={m.name}
                                  onChange={(e) =>
                                    updateMaterial(
                                      idx,
                                      mIdx,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Plywood"
                                  className={`${inputBase} py-1.5 text-[11px]`}
                                />
                                <input
                                  type="text"
                                  value={m.spec}
                                  onChange={(e) =>
                                    updateMaterial(
                                      idx,
                                      mIdx,
                                      "spec",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="BWP 19mm"
                                  className={`${inputBase} py-1.5 text-[11px]`}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeMaterial(idx, mIdx)}
                                  className="h-7 w-6 flex items-center justify-center rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50"
                                  title="Remove material"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            ))}
                            <div className="flex items-center gap-3 mt-1.5">
                              <button
                                type="button"
                                onClick={() => addMaterial(idx)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-select-blue hover:text-primary"
                              >
                                <Plus size={11} /> Add Material
                              </button>
                              <button
                                type="button"
                                onClick={() => applyMaterialKit(idx)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-select-blue"
                                title="Add typical materials for this area"
                              >
                                <Wand2 size={11} /> Use Typical Kit
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {scopeItems.length === 0 && (
                  <div className="text-center py-10 px-6 rounded-xl border border-dashed border-bordergray bg-linear-to-br from-bg-soft/60 to-active-bg/30">
                    <div className="h-12 w-12 rounded-2xl bg-white border border-bordergray flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <Package size={18} className="text-select-blue" />
                    </div>
                    <p className="text-[13px] font-bold text-textcolor">
                      No scope items yet
                    </p>
                    <p className="text-[11px] text-text-muted mt-1 max-w-xs mx-auto">
                      Use the quick-add chips above to add common rooms, or
                      start blank.
                    </p>
                    <button
                      type="button"
                      onClick={() => setScopeFormOpen(true)}
                      className="mt-4 inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-linear-to-br from-select-blue to-primary text-white text-[11.5px] font-semibold shadow-md shadow-select-blue/20 hover:shadow-lg transition-all"
                    >
                      <Plus size={13} /> Add Blank Scope
                    </button>
                  </div>
                )}
              </div>
            </section>
          </main>

          {/* ── Right: Stats + Inclusions / Exclusions ──────────────────── */}
          <aside className="space-y-5">
            <section className="bg-white rounded-2xl border border-bordergray shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
              <div className="px-4 py-3 border-b border-bordergray flex items-center gap-2">
                <BarChart3 size={13} className="text-select-blue" />
                <h3 className="text-[12px] font-bold text-textcolor">
                  Cost Breakdown
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {scopeItems.length === 0 ? (
                  <p className="text-[11px] text-text-subtle text-center py-2">
                    Add scope items to see distribution
                  </p>
                ) : (
                  scopeItems
                    .map((item, idx) => {
                      const amount = Number(item.amount) || 0;
                      const pct =
                        totals.subtotal > 0
                          ? Math.round((amount / totals.subtotal) * 100)
                          : 0;
                      const cat = getCategory(item.area);
                      const c = COLOR_MAP[cat.color];
                      return { item, idx, amount, pct, c };
                    })
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 6)
                    .map(({ item, idx, amount, pct, c }) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                            <span className="text-[11px] text-textcolor truncate font-medium">
                              {item.area || "Untitled"}
                            </span>
                          </span>
                          <span className="text-[10.5px] font-bold text-text-muted tabular-nums">
                            {pct}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-bg-soft rounded-full overflow-hidden">
                            <div
                              className={`h-full ${c.bar}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-text-subtle tabular-nums w-14 text-right">
                            {formatAmount(amount)}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
              {scopeItems.length > 6 && (
                <div className="px-4 pb-3 -mt-1">
                  <p className="text-[10px] text-text-subtle text-center">
                    + {scopeItems.length - 6} more area
                    {scopeItems.length - 6 === 1 ? "" : "s"}
                  </p>
                </div>
              )}
            </section>

            <ListEditor
              title="What's Included"
              icon={<CheckCircle2 size={13} className="text-emerald-600" />}
              accent="emerald"
              items={activeConfig?.inclusions || []}
              onUpdate={(idx, v) => updateListItem("inclusions", idx, v)}
              onAdd={() => addListItem("inclusions")}
              onRemove={(idx) => removeListItem("inclusions", idx)}
              placeholder="e.g. 3D visualizations of all rooms"
            />
            <ListEditor
              title="Not Included"
              icon={<XCircle size={13} className="text-red-500" />}
              accent="red"
              items={activeConfig?.exclusions || []}
              onUpdate={(idx, v) => updateListItem("exclusions", idx, v)}
              onAdd={() => addListItem("exclusions")}
              onRemove={(idx) => removeListItem("exclusions", idx)}
              placeholder="e.g. Civil work — demolition, plumbing"
            />
          </aside>
        </div>
      </div>

      {/* ── Sticky totals bar ──────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[260px] z-20 pointer-events-none">
        <div className="px-6 pb-4 flex justify-center">
          <div className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-bordergray shadow-[0_8px_30px_rgba(15,23,42,0.12)] rounded-2xl px-5 py-3 flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-select-blue/10 text-select-blue flex items-center justify-center">
                <Wallet size={14} />
              </span>
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-text-subtle">
                  {activeKey} · Quote Summary
                </p>
                <p className="text-[10.5px] text-text-muted">
                  {scopeItems.length} items · {activeConfig?.propertyType || ""} ·{" "}
                  {totals.subtotal > 0 ? "live" : "empty"}
                </p>
              </div>
            </div>
            <div className="h-8 w-px bg-bordergray hidden sm:block" />
            <FooterStat
              label="Subtotal"
              value={formatAmount(totals.subtotal)}
            />
            <FooterStat
              label={`GST ${GST_RATE}%`}
              value={formatAmount(totals.gst)}
              accent="text-orange-500"
            />
            <div className="flex items-center gap-2 bg-linear-to-br from-select-blue to-primary text-white px-4 py-2 rounded-xl shadow-md shadow-select-blue/20">
              <IndianRupee size={13} />
              <div>
                <p className="text-[8.5px] font-bold uppercase tracking-widest opacity-80">
                  Grand Total
                </p>
                <p className="text-[14px] font-bold tabular-nums leading-tight">
                  {formatAmount(totals.grandTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <Toast key={toast.id} toast={toast} onClose={() => setToast(null)} />
      )}

      {/* ── Confirm modal ──────────────────────────────────────────────── */}
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={() => {
            confirmDialog.onConfirm?.();
            setConfirmDialog(null);
          }}
        />
      )}

      {/* ── Keyboard shortcuts modal ──────────────────────────────────── */}
      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {/* ── Add Scope — reuses the shared Item Master form ─────────────── */}
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
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────

// Number input that hides "0" so users don't have to delete it before typing,
// and shows the cost-share % suffix when meaningful.
const AmountInput = ({ value, onChange, pct }) => {
  const [focused, setFocused] = useState(false);
  const display = focused
    ? value === 0 || value === "0"
      ? ""
      : value
    : value === 0 || value === "0" || value === ""
      ? ""
      : value;
  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle text-[11px]">
        ₹
      </span>
      <input
        type="number"
        value={display}
        onFocus={(e) => {
          setFocused(true);
          e.target.select();
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value === "" ? 0 : e.target.value)}
        placeholder="0"
        className={`${inputBase} pl-6 pr-10 text-right tabular-nums font-semibold`}
      />
      {pct > 0 && !focused && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-text-subtle tabular-nums">
          {pct}%
        </span>
      )}
    </div>
  );
};

// Multi-select chip group for the preset's applicable property types.
// Each selected chip exposes a small "× multiplier" input so the same
// scope can carry different pricing per property type (penthouse premium,
// studio budget). 1.0 = baseline. At least one must remain selected.
const PropertyTypeChips = ({ selected, multipliers, onChange }) => {
  const toggle = (type) => {
    const isOn = selected.includes(type);
    if (isOn) {
      if (selected.length === 1) return;
      const nextTypes = selected.filter((t) => t !== type);
      const nextMult = { ...multipliers };
      delete nextMult[type];
      onChange({ types: nextTypes, multipliers: nextMult });
    } else {
      onChange({
        types: [...selected, type],
        multipliers: { ...multipliers, [type]: multipliers[type] ?? 1 },
      });
    }
  };

  const setMultiplier = (type, raw) => {
    const parsed = parseFloat(raw);
    const next = !isFinite(parsed) || parsed <= 0 ? 1 : parsed;
    onChange({
      types: selected,
      multipliers: { ...multipliers, [type]: next },
    });
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {PROPERTY_TYPES.map((type) => {
        const isOn = selected.includes(type);
        const m = multipliers[type] ?? 1;
        return (
          <div
            key={type}
            className={`flex items-center rounded-lg border overflow-hidden transition-all ${
              isOn ? "border-select-blue shadow-sm" : "border-bordergray"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(type)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                isOn
                  ? "bg-select-blue text-white"
                  : "bg-white text-text-muted hover:text-select-blue"
              }`}
            >
              {isOn && <Check size={10} strokeWidth={3} />}
              {type}
            </button>
            {isOn && (
              <div className="flex items-center gap-0.5 px-1.5 py-1 bg-white border-l border-select-blue/30">
                <span className="text-[10px] font-semibold text-text-subtle">
                  ×
                </span>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={m}
                  onChange={(e) => setMultiplier(type, e.target.value)}
                  title="Price multiplier vs baseline (1.0 = same)"
                  className={`w-11 text-[11px] font-bold tabular-nums text-textcolor bg-transparent focus:outline-none ${
                    m !== 1 ? "text-select-blue" : ""
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const Field = ({ icon, label, hint, children }) => (
  <div>
    <label className="flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
      <span className="flex items-center gap-1">
        <span className="text-select-blue">{icon}</span>
        {label}
      </span>
      {hint && (
        <span className="text-[9.5px] font-normal text-text-subtle normal-case tracking-normal flex items-center gap-1">
          <Info size={9} /> {hint}
        </span>
      )}
    </label>
    {children}
  </div>
);

const BentoStat = ({ icon, label, value, tint }) => {
  const tints = {
    blue: "from-blue-50 to-white text-blue-600 border-blue-100",
    purple: "from-purple-50 to-white text-purple-600 border-purple-100",
    orange: "from-orange-50 to-white text-orange-600 border-orange-100",
    emerald: "from-emerald-50 to-white text-emerald-600 border-emerald-100",
  };
  return (
    <div
      className={`relative bg-linear-to-br ${tints[tint]} border rounded-xl p-3 overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="opacity-80">{icon}</span>
        <span className="text-[9.5px] font-bold uppercase tracking-wider opacity-70">
          {label}
        </span>
      </div>
      <p className="text-[18px] font-bold text-textcolor tabular-nums leading-tight">
        {value}
      </p>
    </div>
  );
};

const FooterStat = ({ label, value, accent = "text-textcolor" }) => (
  <div className="flex flex-col">
    <span className="text-[9px] font-bold uppercase tracking-widest text-text-subtle">
      {label}
    </span>
    <span className={`text-[13px] font-bold tabular-nums ${accent}`}>
      {value}
    </span>
  </div>
);

const ListEditor = ({
  title,
  icon,
  items,
  onUpdate,
  onAdd,
  onRemove,
  placeholder,
  accent,
}) => {
  const bullet =
    accent === "emerald"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-red-100 text-red-600";
  const headerTint =
    accent === "emerald"
      ? "from-emerald-50/60 to-white"
      : "from-red-50/60 to-white";
  return (
    <div className="bg-white rounded-2xl border border-bordergray shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
      <div
        className={`px-4 py-3 border-b border-bordergray bg-linear-to-r ${headerTint} flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-[12px] font-bold text-textcolor">{title}</h3>
          <span className="text-[10px] font-semibold text-text-muted bg-white/70 px-1.5 py-0.5 rounded-md border border-bordergray">
            {items.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 text-[11px] font-semibold text-select-blue hover:text-primary"
        >
          <Plus size={12} /> Add
        </button>
      </div>
      <div className="p-3 space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 group">
            <span
              className={`mt-2 h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${bullet}`}
            >
              {accent === "emerald" ? (
                <Check size={9} strokeWidth={3} />
              ) : (
                <X size={9} strokeWidth={3} />
              )}
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => onUpdate(idx, e.target.value)}
              placeholder={placeholder}
              className="bg-bg-soft border border-transparent text-[11.5px] text-textcolor rounded-lg px-2.5 py-1.5 w-full focus:outline-none focus:bg-white focus:border-select-blue/40 placeholder:text-text-subtle"
            />
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="h-7 w-6 flex items-center justify-center rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
              title="Remove item"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <button
            type="button"
            onClick={onAdd}
            className="w-full text-[11px] text-text-subtle border border-dashed border-bordergray rounded-lg py-3 hover:border-select-blue hover:text-select-blue transition-colors"
          >
            + Add your first entry
          </button>
        )}
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────

const Toast = ({ toast, onClose }) => {
  const variants = {
    success: { bg: "bg-emerald-500", icon: <CheckCircle2 size={14} /> },
    error: { bg: "bg-red-500", icon: <AlertTriangle size={14} /> },
    info: { bg: "bg-select-blue", icon: <Info size={14} /> },
  };
  const v = variants[toast.type] || variants.info;
  return (
    <div className="fixed top-6 right-6 z-50 animate-[slideIn_0.2s_ease-out]">
      <div
        className={`${v.bg} text-white rounded-xl shadow-xl px-4 py-3 flex items-center gap-2.5 min-w-[260px] max-w-md`}
      >
        <span className="shrink-0">{v.icon}</span>
        <p className="text-[12px] font-medium flex-1">{toast.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-white/80 hover:text-white shrink-0"
          title="Dismiss"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};

const ConfirmDialog = ({
  title,
  message,
  confirmLabel,
  danger,
  onCancel,
  onConfirm,
}) => (
  <div
    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.15s_ease-out]"
    onClick={onCancel}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-5 flex items-start gap-3">
        <span
          className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
            danger
              ? "bg-red-50 text-red-500"
              : "bg-select-blue/10 text-select-blue"
          }`}
        >
          {danger ? <AlertTriangle size={18} /> : <Info size={18} />}
        </span>
        <div>
          <h3 className="text-[14px] font-bold text-textcolor">{title}</h3>
          <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
      <div className="px-5 py-3 bg-bg-soft border-t border-bordergray flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-bordergray bg-white text-[12px] font-semibold text-text-muted hover:bg-white hover:text-textcolor"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          autoFocus
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white shadow-sm ${
            danger
              ? "bg-red-500 hover:bg-red-600"
              : "bg-select-blue hover:bg-primary"
          }`}
        >
          {confirmLabel || "Confirm"}
        </button>
      </div>
    </div>
  </div>
);

const ShortcutsModal = ({ onClose }) => (
  <div
    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-5 py-4 border-b border-bordergray flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Keyboard size={14} className="text-select-blue" />
          <h3 className="text-[13px] font-bold text-textcolor">
            Keyboard Shortcuts
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-text-subtle hover:text-textcolor"
        >
          <X size={14} />
        </button>
      </div>
      <div className="p-5 space-y-2.5">
        <Shortcut keys={["⌘", "S"]} label="Save changes" />
        <Shortcut keys={["?"]} label="Toggle this menu" />
        <Shortcut keys={["Esc"]} label="Close dialogs" />
        <Shortcut keys={["Enter"]} label="Confirm in input fields" />
      </div>
    </div>
  </div>
);

const Shortcut = ({ keys, label }) => (
  <div className="flex items-center justify-between">
    <span className="text-[12px] text-textcolor">{label}</span>
    <span className="flex items-center gap-1">
      {keys.map((k) => (
        <kbd
          key={k}
          className="text-[10px] font-bold bg-bg-soft border border-bordergray rounded px-1.5 py-0.5 text-textcolor"
        >
          {k}
        </kbd>
      ))}
    </span>
  </div>
);

export default ProposalMaster;
