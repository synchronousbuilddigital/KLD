import { create } from "zustand";

const createDefaultState = () => ({
  L: 4.7244,
  W: 2.3622,
  H: 6.2992,
  T: 0.0197, 
  glueFlapWidth: 0.625,
  bleed: 2 / 25.4,
  sizeMode: "manufacture",
  materialType: "paperboard",
  materialName: "350g white paperboard(0.5mm)",
  isCustomMaterial: false,
  materialColor: "#fdfbf7",
  materialCategory: "white_paperboard",
  generatorMethod: "dxf"
});

export const useBoxStore = create((set) => ({
  // Default Dimensions & Unit
  unit: "in",
  setUnit: (u) => set({ unit: u }),
  
  ...createDefaultState(),

  // Box Model & Context
  boxModel: "rte",
  activeContext: "mockup",
  
  savedState: {
    dieline: {
      rte: createDefaultState(),
      te: createDefaultState(),
      auto_lock: createDefaultState(),
      cake: createDefaultState()
    },
    mockup: {
      rte: createDefaultState(),
      te: createDefaultState(),
      auto_lock: createDefaultState(),
      cake: createDefaultState()
    }
  },

  setContextAndModel: (context, model) => set((state) => {
    const ctx = context || state.activeContext;
    const m = model || state.boxModel;
    const saved = state.savedState[ctx][m] || createDefaultState();
    
    return {
      activeContext: ctx,
      boxModel: m,
      ...saved
    };
  }),

  setBoxModel: (m) => set((state) => {
    const saved = state.savedState[state.activeContext][m] || createDefaultState();
    return { 
      boxModel: m,
      ...saved
    };
  }),

  // State Updaters with saving logic
  setDim: (key, value) => set((state) => {
    const num = Math.max(0.01, Number(value) || 0.01);
    const newSaved = { ...state.savedState };
    newSaved[state.activeContext][state.boxModel] = {
      ...newSaved[state.activeContext][state.boxModel],
      [key]: num
    };
    return {
      [key]: num,
      savedState: newSaved
    };
  }),

  setSizeMode: (mode) => set((state) => {
    const newSaved = { ...state.savedState };
    newSaved[state.activeContext][state.boxModel] = {
      ...newSaved[state.activeContext][state.boxModel],
      sizeMode: mode
    };
    return { sizeMode: mode, savedState: newSaved };
  }),

  setMaterialSelection: (type, thickness, name, isCustom, color, category) => set((state) => {
    const newSaved = { ...state.savedState };
    newSaved[state.activeContext][state.boxModel] = {
      ...newSaved[state.activeContext][state.boxModel],
      materialType: type,
      T: thickness,
      materialName: name,
      isCustomMaterial: isCustom,
      materialColor: color,
      materialCategory: category,
      generatorMethod: "dxf"
    };
    return {
      materialType: type,
      T: thickness,
      materialName: name,
      isCustomMaterial: isCustom,
      materialColor: color,
      materialCategory: category,
      generatorMethod: "dxf",
      savedState: newSaved
    };
  }),

  setMaterialType: (type, defaultT) => set((state) => {
    const newSaved = { ...state.savedState };
    newSaved[state.activeContext][state.boxModel] = {
      ...newSaved[state.activeContext][state.boxModel],
      materialType: type,
      T: defaultT,
      generatorMethod: "dxf"
    };
    return { 
      materialType: type, 
      T: defaultT,
      generatorMethod: "dxf",
      savedState: newSaved
    };
  }),

  setMaterial: (thickness) => set((state) => {
    const num = Number(thickness) || 0.0197;
    const newSaved = { ...state.savedState };
    newSaved[state.activeContext][state.boxModel] = {
      ...newSaved[state.activeContext][state.boxModel],
      T: num
    };
    return { T: num, savedState: newSaved };
  }),

  setGeneratorMethod: (method) => set((state) => {
    const newSaved = { ...state.savedState };
    newSaved[state.activeContext][state.boxModel] = {
      ...newSaved[state.activeContext][state.boxModel],
      generatorMethod: method
    };
    return { generatorMethod: method, savedState: newSaved };
  }),

  // UI / Display states (Global)
  trimColor: "#3f46ad",
  creaseColor: "#ff4d4f",
  bleedColor: "#16a34a",
  dimColor: "#4a90e2",

  theme: "light",
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === "dark" ? "light" : "dark" 
  })),

  showOverallDims: false,
  showBasicDims: true,
  showBleedLine: false,
  showAnnotations: true,
  showMaterialZone: false,

  setColor: (key, value) => set(() => ({ [key]: value })),
  toggleView: (key) => set((state) => ({ [key]: !state[key] })),
  toggleMaterialZone: () => set((state) => ({ showMaterialZone: !state.showMaterialZone })),

  sceneLayout: "single",
  setSceneLayout: (layout) => set({ sceneLayout: layout }),

  packageColor: null,
  setPackageColor: (color) => set({ packageColor: color }),
  insideColor: null,
  setInsideColor: (color) => set({ insideColor: color }),

  // Decals
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