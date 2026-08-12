import React, { useState, useRef, useEffect } from "react";
import { useBoxStore } from "../../lib/useBoxStore";

export const materialCategories = [
  {
    id: "white_paperboard",
    name: "White Paperboard",
    color: "#fdfbf7",
    options: [
      { name: "210g white paperboard(0.27mm)", thickness: 0.0106, type: "paperboard" },
      { name: "250g white paperboard(0.35mm)", thickness: 0.0138, type: "paperboard" },
      { name: "300g white paperboard(0.42mm)", thickness: 0.0165, type: "paperboard" },
      { name: "350g white paperboard(0.5mm)", thickness: 0.0197, type: "paperboard" },
      { name: "400g white paperboard(0.55mm)", thickness: 0.0217, type: "paperboard" },
      { name: "Custom white paperboard", isCustom: true, min: 0.0079, max: 0.0315, type: "paperboard" }
    ]
  },
  {
    id: "kraft_paperboard",
    name: "Kraft Paperboard",
    color: "#dcb98e",
    options: [
      { name: "120g kraft paperboard(0.14mm)", thickness: 0.0055, type: "paperboard" },
      { name: "190g kraft paperboard(0.26mm)", thickness: 0.0102, type: "paperboard" },
      { name: "250g kraft paperboard(0.33mm)", thickness: 0.0130, type: "paperboard" },
      { name: "350g kraft paperboard(0.46mm)", thickness: 0.0181, type: "paperboard" },
      { name: "Custom kraft paperboard", isCustom: true, min: 0.0079, max: 0.0315, type: "paperboard" }
    ]
  },
  {
    id: "art_paper",
    name: "Art Paper",
    color: "#ffffff",
    options: [
      { name: "200g art paper(0.2mm)", thickness: 0.0079, type: "paperboard" },
      { name: "350g art paper(0.32mm)", thickness: 0.0126, type: "paperboard" },
      { name: "Custom art paper", isCustom: true, min: 0.0079, max: 0.0197, type: "paperboard" }
    ]
  },
  {
    id: "corrugated",
    name: "Corrugated Board",
    color: "#c19a6b",
    options: [
      { name: "N-flute", thickness: 0.0315, type: "corrugated" },
      { name: "F-flute", thickness: 0.0472, type: "corrugated" },
      { name: "E-flute", thickness: 0.0630, type: "corrugated" },
      { name: "B-flute", thickness: 0.1181, type: "corrugated" },
      { name: "Custom corrugated board", isCustom: true, min: 0.0315, max: 0.1182, type: "corrugated" }
    ]
  }
];

export default function MaterialDropdown() {
  const store = useBoxStore();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Default theme properties for the dropdown
  const t = {
    inputBg: "#ffffff",
    cyan: "#3b82f6",
    border: "#e5e7eb",
    textMain: "#1f2937",
    activeBg: "#f3f4f6",
    textMuted: "#6b7280",
    bgCanvas: "#ffffff"
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHoveredCategory(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [customVal, setCustomVal] = useState<number | string>(store.T);
  const activeCustomCat = materialCategories.find(c => c.options.some(o => o.isCustom && store.materialName === o.name));
  const activeCustomOpt = activeCustomCat ? activeCustomCat.options.find(o => o.name === store.materialName) : null;

  const handleCustomBlur = () => {
    if (activeCustomOpt) {
      const min = activeCustomOpt.min || 0;
      const max = activeCustomOpt.max || 1;
      const val = Math.max(min, Math.min(max, Number(customVal) || min));
      setCustomVal(val);
      store.setMaterial(val);
    }
  };

  return (
    <div style={{ position: "relative", minWidth: "220px" }} ref={dropdownRef}>
      <div style={{ position: "relative" }}>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          style={{ 
            width: "100%", padding: "6px 12px", background: t.inputBg, 
            border: isOpen ? `2px solid ${t.cyan}` : `2px solid ${t.border}`, 
            color: t.textMain, borderRadius: "8px", 
            fontSize: 12, fontWeight: "500", cursor: "pointer",
            boxShadow: isOpen ? `0px 2px 4px rgba(59,130,246,0.2)` : `0px 1px 2px rgba(0,0,0,0.05)`,
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: store.materialColor || "#fdfbf7", border: `1px solid ${t.border}` }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>
              {store.materialName || "Select Material"}
            </span>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points={isOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
          </svg>
        </div>

        {isOpen && (
          <div style={{ 
            position: "absolute", top: "100%", left: 0, marginTop: "4px", width: "100%",
            background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)", zIndex: 100, padding: "4px 0",
            maxHeight: "300px", overflowY: "auto"
          }}>
            {materialCategories.map(cat => (
              <div 
                key={cat.id}
                onMouseEnter={() => setHoveredCategory(cat.id)}
                style={{ display: "flex", flexDirection: "column" }}
              >
                <div style={{ 
                  padding: "8px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: hoveredCategory === cat.id ? t.activeBg : "transparent",
                  color: t.textMain, fontSize: "12px"
                }}>
                  {cat.name}
                  <svg 
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" 
                    style={{ transform: hoveredCategory === cat.id ? "rotate(180deg)" : "none", transition: "0.2s" }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                
                {hoveredCategory === cat.id && (
                  <div style={{ 
                    background: t.bgCanvas, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`,
                    padding: "2px 0"
                  }}>
                    {cat.options.map((opt, i) => (
                      <div 
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          store.setMaterialSelection(opt.type, opt.thickness || opt.min, opt.name, opt.isCustom || false, cat.color, cat.id);
                          setCustomVal(opt.thickness || opt.min || 0);
                          setIsOpen(false);
                          setHoveredCategory(null);
                        }}
                        style={{ 
                          padding: "8px 12px 8px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                          background: store.materialName === opt.name ? t.activeBg : "transparent",
                          color: t.textMain, fontSize: "11px"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = t.activeBg)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = store.materialName === opt.name ? t.activeBg : "transparent")}
                      >
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: cat.color, border: `1px solid ${t.border}` }} />
                        {opt.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {store.isCustomMaterial && activeCustomOpt && (
        <div style={{ marginTop: "8px", padding: "4px" }}>
          <div style={{ fontSize: "11px", color: t.textMuted, marginBottom: "4px" }}>
            Thickness ({activeCustomOpt.min} - {activeCustomOpt.max} in)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <input 
              type="number" 
              value={customVal}
              onChange={(e) => setCustomVal(e.target.value)}
              onBlur={handleCustomBlur}
              step="0.0001"
              min={activeCustomOpt.min}
              max={activeCustomOpt.max}
              style={{ 
                flex: 1, padding: "4px 8px", background: t.inputBg, border: `1px solid ${t.border}`, 
                borderRadius: "6px", color: t.textMain, outline: "none", fontSize: "11px"
              }}
            />
            <span style={{ fontSize: "11px", color: t.textMuted }}>in</span>
          </div>
        </div>
      )}
    </div>
  );
}
