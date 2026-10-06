import { generateRTEDielineDXF } from "./dxfDielineGenerator.js";
import { generateTEDielineDXF } from "./teDielineGenerator.js";
import { generateAutoLockDieline } from "./autoLockDielineGenerator.js";
import { generateCosmeticBoxDieline } from "./cosmeticBoxDielineGenerator.js";
import { generateCosmeticBoxBDieline } from "./cosmeticBoxBDielineGenerator.js";
import { generateButtonHoleDieline } from "./buttonHoleDielineGenerator.js";
import { generateRSCDielineDXF } from "./rscDielineGenerator.js";
import { generateCanDieline } from "./canDielineGenerator.js";
import { generateWaterBottleDieline } from "./waterBottleDielineGenerator.js";
import { generateTubeDieline } from "./tubeDielineGenerator.js";
import { generateSlimCanDieline } from "./slimCanDielineGenerator.js";

/**
 * Registry of box dieline algorithms.
 * Highly optimized: Only the specific generator corresponding to the active box model is invoked.
 */
export const BOX_GENERATOR_REGISTRY = {
  rte: (params) => generateRTEDielineDXF(params),
  te: (params) => generateTEDielineDXF(params),
  auto_lock: (params) => generateAutoLockDieline(params),
  cosmetic: (params) => generateCosmeticBoxDieline(params),
  cosmetic_b: (params) => generateCosmeticBoxBDieline(params),
  button_hole: (params) => generateButtonHoleDieline(params),
  rsc: (params) => generateRSCDielineDXF(params),
  can: (params) => generateCanDieline(params),
  soda_can: (params) => generateCanDieline(params),
  slim_can: (params) => generateSlimCanDieline(params),
  slim_355ml_can: (params) => generateSlimCanDieline(params),
  water_bottle: (params) => generateWaterBottleDieline(params),
  tube: (params) => generateTubeDieline(params),
  toothpaste_tube: (params) => generateTubeDieline(params)
};

/**
 * Dispatches to and executes ONLY the algorithm for the requested box model.
 * 
 * @param {string} boxModel - Box model identifier ('rte', 'te', 'auto_lock', 'cosmetic', 'cosmetic_b', 'button_hole', 'rsc')
 * @param {Object} params - Box parameters (L, W, H, T, glueFlapWidth, bleed, windowDecals)
 * @returns {Object} Dieline data containing cuts, folds, bleeds, dimensions
 */
export function getBoxDieline(boxModel, params) {
  const normalizedModel = (boxModel || 'rte').toLowerCase();
  const generator = BOX_GENERATOR_REGISTRY[normalizedModel] || BOX_GENERATOR_REGISTRY.rte;
  return generator(params);
}
