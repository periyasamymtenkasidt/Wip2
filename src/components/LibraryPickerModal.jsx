import { useMemo, useState } from "react";
import {
  BookOpen,
  Search,
  X,
  Package,
  ChefHat,
  Sofa,
  Bed,
  Bath,
  DoorOpen,
  Building2,
  Library,
} from "lucide-react";
import { listLibrary, computeLibraryItemAmount } from "../data/itemLibrary";
import { UNITS } from "../data/boqUnits";

// Categories + colour palette mirror the ones used in ItemLibrary so the
// picker chips stay visually consistent.
const ITEM_CATEGORIES = [
  { value: "all", label: "All", icon: Package },
  { value: "orange", label: "Kitchen", icon: ChefHat },
  { value: "blue", label: "Living / Dining", icon: Sofa },
  { value: "purple", label: "Bedroom", icon: Bed },
  { value: "teal", label: "Bathroom", icon: Bath },
  { value: "amber", label: "Foyer / Passage", icon: DoorOpen },
  { value: "indigo", label: "Office / Study", icon: BookOpen },
  { value: "slate", label: "Utility", icon: Building2 },
  { value: "gray", label: "Services", icon: Package },
];

const ITEM_COLOR_MAP = {
  blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
  slate: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-500" },
  gray: { bg: "bg-bg-soft", text: "text-text-muted", border: "border-bordergray", dot: "bg-text-subtle" },
};

/**
 * Standalone Library Picker modal — reuses the same picker UI from
 * ItemFormModal but exposed as a standalone component so it can be
 * opened directly (e.g. from "Pick from Library" in QuoteModal).
 *
 * Props:
 *   onClose  — close the modal
 *   onPick   — callback with the selected library item
 *   excludeId — optional item id to exclude from the list
 */
const LibraryPickerModal = ({ excludeId, onClose, onPick }) => {
  const [items] = useState(() => listLibrary());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((it) => it.id !== excludeId)
      .filter((it) => {
        if (category !== "all" && it.category !== category) return false;
        if (!q) return true;
        return (
          (it.description || "").toLowerCase().includes(q) ||
          (it.hsn || "").toLowerCase().includes(q) ||
          (it.tags || []).some((t) => t.toLowerCase().includes(q))
        );
      });
  }, [items, query, category, excludeId]);

  return (
    <div
      className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-bordergray flex items-center justify-between bg-linear-to-r from-select-blue/5 to-white">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-select-blue/10 text-select-blue flex items-center justify-center">
              <Library size={14} />
            </span>
            <div>
              <h3 className="text-[13px] font-bold text-textcolor">
                Pick from Library
              </h3>
              <p className="text-[10.5px] text-text-muted">
                Choose an item to add to the scope of work
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-text-subtle hover:text-textcolor">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-bordergray space-y-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search description, HSN, tag"
              className="bg-bg-soft border border-transparent rounded-lg pl-7 pr-3 py-1.5 text-[11.5px] placeholder:text-text-subtle focus:outline-none focus:bg-white focus:border-select-blue/30 w-full"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {ITEM_CATEGORIES.map((c) => {
              const Icon = c.icon;
              const count =
                c.value === "all"
                  ? items.filter((it) => it.id !== excludeId).length
                  : items.filter(
                      (it) => it.id !== excludeId && it.category === c.value,
                    ).length;
              const cm = ITEM_COLOR_MAP[c.value] || ITEM_COLOR_MAP.gray;
              const active = category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-semibold transition-all border ${
                    active
                      ? `${cm.bg} ${cm.text} ${cm.border}`
                      : "bg-transparent text-text-muted hover:bg-bg-soft border-transparent"
                  }`}
                >
                  <Icon size={10} />
                  {c.label}
                  <span className="opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-center text-[11.5px] text-text-subtle py-8">
              No items match
            </p>
          ) : (
            filtered.map((it) => {
              const c = ITEM_COLOR_MAP[it.category] || ITEM_COLOR_MAP.gray;
              const unitLabel =
                UNITS.find((u) => u.code === it.unit)?.label || it.unit;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => onPick(it)}
                  className="w-full text-left rounded-lg border border-bordergray bg-white hover:border-select-blue hover:bg-active-bg/30 px-3 py-2 transition-all flex items-center gap-3"
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${c.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-semibold text-textcolor truncate">
                      {it.description}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {unitLabel} · ₹{Number(it.rate || 0).toLocaleString("en-IN")} · GST {it.gstPercent}%
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryPickerModal;
