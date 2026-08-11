import { create } from "zustand";

export const useBoxStore = create((set) => ({
  // Default Dimensions & Unit
  unit: "in",
  setUnit: (u) => set({ unit: u }),
  L: 4.7244,
  W: 2.3622,
  H: 6.2992,
  T: 0.0197, 
  glueFlapWidth: 0.625,
  bleed: 2 / 25.4,

  // Box Model
  boxModel: "rte",
  setBoxModel: (m) => set({ boxModel: m }),

  // Material Tracker
  materialType: "paperboard",
  materialName: "350g white paperboard(0.5mm)",
  isCustomMaterial: false,
  materialColor: "#fdfbf7",
  materialCategory: "white_paperboard",
  
  setMaterialSelection: (type, thickness, name, isCustom, color, category) => set({
    materialType: type,
    T: thickness,
    materialName: name,
    isCustomMaterial: isCustom,
    materialColor: color,
    materialCategory: category,
    generatorMethod: "dxf"
  }),
  
  setMaterialType: (type, defaultT) => set({ 
    materialType: type, 
    T: defaultT,
    generatorMethod: "dxf"
  }),

  // Size Mode (manufacture, inner, outer)
  sizeMode: "manufacture",
  setSizeMode: (mode) => set({ sizeMode: mode }),

  // Line Colors
  trimColor: "#0055ff", // Bright Pure Blue
  creaseColor: "#ff0000", // Bright Pure Red
  bleedColor: "#00cc00", // Bright Pure Green
  dimColor: "#00a2ff", // Bright Cyan

  // Theme State
  theme: "light",
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === "dark" ? "light" : "dark" 
  })),

  // Visibility
  showOverallDims: false,
  showBasicDims: true,
  showBleedLine: false,
  showAnnotations: true,
  showMaterialZone: false,

  // Actions
  setDim: (key, value) => set(() => ({ 
    [key]: Math.max(0.01, Number(value) || 0.01) 
  })),
  
  setColor: (key, value) => set(() => ({ 
    [key]: value 
  })),
  
  toggleView: (key) => set((state) => ({ 
    [key]: !state[key] 
  })),
  
  toggleMaterialZone: () => set((state) => ({
    showMaterialZone: !state.showMaterialZone
  })),
  
  // Relaxed store setter to allow the UI to manage typing and clamping securely
  setMaterial: (thickness) => set({ 
    T: Number(thickness) || 0.0197 
  }),

  // Dieline Generator Method ("legacy" or "dxf")
  generatorMethod: "dxf",
  setGeneratorMethod: (method) => set({ generatorMethod: method }),

  // Scene Layout
  sceneLayout: "single",
  setSceneLayout: (layout) => set({ sceneLayout: layout }),

  // Package Color
  packageColor: null,
  setPackageColor: (color) => set({ packageColor: color }),
  insideColor: null,
  setInsideColor: (color) => set({ insideColor: color }),

  // Decals (Text, Images, Logos)
  decalsByModel: { rte: [], te: [], auto_lock: [] },
  setDecals: (decalsOrUpdater) => set((state) => {
    const currentModel = state.boxModel;
    const currentDecals = state.decalsByModel[currentModel] || [];
    const newDecals = typeof decalsOrUpdater === "function" ? decalsOrUpdater(currentDecals) : decalsOrUpdater;
    return {
      decalsByModel: {
        ...state.decalsByModel,
        [currentModel]: newDecals
      }
    };
  }),
}));