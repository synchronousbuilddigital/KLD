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
  generatorMethod: "dxf",
  packageColor: null,
  insideColor: null
});

const createCosmeticBDefaultState = () => ({
  L: 270 / 25.4,
  W: 260 / 25.4,
  H: 62 / 25.4,
  T: 0.5 / 25.4,
  glueFlapWidth: 0.625,
  bleed: 2 / 25.4,
  sizeMode: "manufacture",
  materialType: "paperboard",
  materialName: "350g white paperboard(0.5mm)",
  isCustomMaterial: false,
  materialColor: "#fdfbf7",
  materialCategory: "white_paperboard",
  generatorMethod: "dxf",
  packageColor: null,
  insideColor: null
});

const createCosmeticDefaultState = () => ({
  L: 1.4016,
  W: 1.4016,
  H: 4.7874,
  T: 0.0197, 
  glueFlapWidth: 0.625,
  bleed: 2 / 25.4,
  sizeMode: "manufacture",
  materialType: "paperboard",
  materialName: "350g white paperboard(0.5mm)",
  isCustomMaterial: false,
  materialColor: "#fdfbf7",
  materialCategory: "white_paperboard",
  generatorMethod: "dxf",
  packageColor: null,
  insideColor: null
});

const createButtonHoleDefaultState = () => ({
  L: 75.0 / 25.4,
  W: 75.0 / 25.4,
  H: 60.0 / 25.4,
  T: 0.5 / 25.4,
  glueFlapWidth: 16.0 / 25.4,
  bleed: 2 / 25.4,
  sizeMode: "manufacture",
  materialType: "paperboard",
  materialName: "350g white paperboard(0.5mm)",
  isCustomMaterial: false,
  materialColor: "#fdfbf7",
  materialCategory: "white_paperboard",
  generatorMethod: "dxf",
  packageColor: null,
  insideColor: null
});

const createWaterBottleDefaultState = () => ({
  L: 243 / 25.4,
  W: 46 / 25.4,
  H: 240 / 25.4,
  T: 0.005,
  glueFlapWidth: 0.25,
  bleed: 2 / 25.4,
  sizeMode: "manufacture",
  materialType: "plastic_glossy",
  materialName: "Plastic Glossy (Clear PET)",
  isCustomMaterial: false,
  materialColor: "#ffffff",
  materialCategory: "plastic",
  generatorMethod: "dxf",
  packageColor: "#ffffff",
  insideColor: "#ffffff",
  capColor: "#ffffff"
});

const createCanDefaultState = () => ({
  L: 207 / 25.4, // circumference ~8.15 in (784 px aspect)
  W: 125 / 25.4, // label height ~4.92 in (472 px aspect)
  H: 122 / 25.4, // total can height ~4.80 in
  T: 0.008,
  glueFlapWidth: 0.25,
  bleed: 2 / 25.4,
  sizeMode: "manufacture",
  materialType: "metal_matt",
  materialName: "Metal Matt (Aluminum)",
  isCustomMaterial: false,
  materialColor: "#ffffff",
  materialCategory: "metal",
  generatorMethod: "dxf",
  packageColor: "#ffffff",
  insideColor: "#ffffff"
});

const createSlimCanDefaultState = () => ({
  L: 175 / 25.4, // circumference ~6.89 in (175 mm)
  W: 145 / 25.4, // label height ~5.71 in (145 mm)
  H: 156 / 25.4, // total slim can height ~6.14 in (156 mm)
  T: 0.008,
  glueFlapWidth: 0.25,
  bleed: 2 / 25.4,
  sizeMode: "manufacture",
  materialType: "metal_matt",
  materialName: "Metal Matt (Aluminum)",
  isCustomMaterial: false,
  materialColor: "#ffffff",
  materialCategory: "metal",
  generatorMethod: "dxf",
  packageColor: "#ffffff",
  insideColor: "#ffffff"
});

const createTubeDefaultState = () => ({
  L: 90 / 25.4, // 90 mm total flat width (~3.543 in)
  W: 133 / 25.4, // 133 mm tube height (~5.236 in)
  H: 155 / 25.4, // overall height including cap (~6.1 in)
  T: 0.005,
  glueFlapWidth: 0.25,
  bleed: 2 / 25.4,
  sizeMode: "manufacture",
  materialType: "plastic_glossy",
  materialName: "Plastic Glossy (Laminate)",
  isCustomMaterial: false,
  materialColor: "#ffffff",
  materialCategory: "plastic",
  generatorMethod: "dxf",
  packageColor: "#ffffff",
  insideColor: "#ffffff",
  capColor: "#ffffff"
});

export const useEditorStore = create((set) => ({
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
      cosmetic: createCosmeticDefaultState(),
      cosmetic_b: createCosmeticBDefaultState(),
      button_hole: createButtonHoleDefaultState(),
      water_bottle: createWaterBottleDefaultState(),
      can: createCanDefaultState(),
      slim_can: createSlimCanDefaultState(),
      slim_355ml_can: createSlimCanDefaultState(),
      tube: createTubeDefaultState(),
      toothpaste_tube: createTubeDefaultState()
    },
    mockup: {
      rte: createDefaultState(),
      te: createDefaultState(),
      auto_lock: createDefaultState(),
      cosmetic: createCosmeticDefaultState(),
      cosmetic_b: createCosmeticBDefaultState(),
      button_hole: createButtonHoleDefaultState(),
      water_bottle: createWaterBottleDefaultState(),
      can: createCanDefaultState(),
      slim_can: createSlimCanDefaultState(),
      slim_355ml_can: createSlimCanDefaultState(),
      tube: createTubeDefaultState(),
      toothpaste_tube: createTubeDefaultState()
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

  setDecals: (newDecals) => set((state) => {
    const currentModel = state.boxModel;
    const currentDecals = state.decalsByModel ? (state.decalsByModel[currentModel] || []) : [];
    const updatedDecals = typeof newDecals === "function" ? newDecals(currentDecals) : newDecals;
    return {
      decalsByModel: {
        ...(state.decalsByModel || {}),
        [currentModel]: updatedDecals
      }
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

  setPackageColor: (color) => set((state) => {
    const newSaved = { ...state.savedState };
    newSaved[state.activeContext][state.boxModel] = {
      ...newSaved[state.activeContext][state.boxModel],
      packageColor: color
    };
    return { packageColor: color, savedState: newSaved };
  }),
  setInsideColor: (color) => set((state) => {
    const newSaved = { ...state.savedState };
    newSaved[state.activeContext][state.boxModel] = {
      ...newSaved[state.activeContext][state.boxModel],
      insideColor: color
    };
    return { insideColor: color, savedState: newSaved };
  }),
  capColor: "#ffffff",
  setCapColor: (color) => set((state) => {
    const newSaved = { ...state.savedState };
    if (newSaved[state.activeContext] && newSaved[state.activeContext][state.boxModel]) {
      newSaved[state.activeContext][state.boxModel] = {
        ...newSaved[state.activeContext][state.boxModel],
        capColor: color
      };
    }
    return { capColor: color, savedState: newSaved };
  }),

  // Decals
  decalsByModel: { rte: [], te: [], auto_lock: [], cosmetic: [], cosmetic_b: [], button_hole: [], water_bottle: [], can: [], slim_can: [], slim_355ml_can: [], tube: [], toothpaste_tube: [] },
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