/**
 * Real Google Gemini LLM & AI Graphic Generation Service for KLD Packaging
 * Uses @google/generative-ai (Gemini 1.5 Flash / Pro) when GEMINI_API_KEY is set in backend/.env,
 * combined with high-res AI artwork texture generation, 3D canvas sync, and vector dielines.
 */

const https = require('https');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Layer 2: Asset Generator (Pollinations API)
 * Generates specific, separated visual assets (background texture OR isolated icon).
 */
async function fetchLayer2AssetBase64(prompt, isIcon = false, variationIndex = 1) {
  let cleanPrompt = prompt.replace(/["'\\]/g, '').trim();
  cleanPrompt = cleanPrompt.replace(/\b(box|packaging|package|bottle|tube|3d|mockup|render|carton|container)\b/gi, '').trim();

  let structuralSuffix = '';
  if (isIcon) {
    structuralSuffix = 'isolated vector graphic, flat icon, central composition, pure white background, minimal line art or flat colors, no text, no words';
  } else {
    structuralSuffix = 'highly detailed 2D flat vector illustration, pure digital graphic design, centered composition, purely 2D canvas, NO 3D objects, NO boxes, NO packaging shapes, NO text, NO logos, NO shadows, NO realistic product photography';
  }

  const fullPrompt = `${cleanPrompt}, ${structuralSuffix}`;

  try {
    console.log("Submitting image generation to AI Horde...");
    const submitRes = await fetch("https://stablehorde.net/api/v2/generate/async", {
      method: "POST",
      headers: {
        "apikey": "0000000000",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: fullPrompt.substring(0, 1000),
        params: {
          width: 512,
          height: 512,
          steps: 20
        },
        nsfw: false,
        censor_nsfw: true,
        models: ["stable_diffusion"]
      })
    });
    
    if (submitRes.ok) {
      const submitJson = await submitRes.json();
      if (submitJson.id) {
        let attempts = 0;
        while (attempts < 15) { // Poll for up to ~75 seconds
          await new Promise(r => setTimeout(r, 5000));
          attempts++;
          const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${submitJson.id}`);
          if (!statusRes.ok) continue;
          
          const statusJson = await statusRes.json();
          if (statusJson.done && statusJson.generations && statusJson.generations.length > 0) {
            console.log("AI Horde generation complete! Downloading to bypass CORS...");
            const imgUrl = statusJson.generations[0].img;
            
            // Fetch the image from the Horde R2 URL and convert to Base64 to bypass WebGL CORS
            try {
              const imgRes = await fetch(imgUrl);
              const buffer = await imgRes.arrayBuffer();
              const base64 = Buffer.from(buffer).toString('base64');
              return `data:image/webp;base64,${base64}`;
            } catch (dlErr) {
              console.log("Failed to download Horde image, returning raw URL:", dlErr.message);
              return imgUrl;
            }
          }
          if (statusJson.faulted) {
            console.log("AI Horde generation faulted, falling back...");
            break;
          }
        }
      }
    }
  } catch (err) {
    console.log("AI Horde error:", err.message);
  }

  // Final absolute fallback
  const encoded = encodeURIComponent(fullPrompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 9000000)}`;
}

/**
 * Layer 1: Creative Director (LLM System Prompt)
 * Extracts structured layout data for the 3-Layer compositor approach.
 */
const SYSTEM_PACKAGING_PROMPT = `
You are Pacdora AI — an expert Digital Automated Packaging Designer.
Your task is to analyze user prompts and orchestrate a 3-layer design system.

Always return a valid JSON object matching this exact schema:
{
  "reply": "Conversational explanation of the design concept...",
  "model": "rte" | "te" | "auto_lock" | "cosmetic",
  "dimensions": { "L": number_in_inches, "W": number, "H": number, "unit": "mm" | "in" | "cm" },
  "baseColor": "#hex",
  "artworkPrompt": "The visual description of the 2D flat illustration (e.g. 'A beautiful traditional Japanese mountain with ink brush strokes, centered on a sage green watercolor background, wide sprawling composition'). Do NOT include words like 'packaging layout' or 'box' in this string, or the image AI will literally draw a 3D box. Do not include text.",
  "typography": {
    "brandName": "Short brand name (max 3 words)",
    "fontStyle": "sans-serif | serif | monospace",
    "color": "#hex"
  },
  "directions": [
    { "id": "dir-1", "title": "Concept 1", "subtitle": "...", "primaryColor": "#hex", "accentColor": "#hex" }
  ],
  "expandedBrief": "Brief breakdown of the design..."
}
`;

/**
 * Call Google Gemini API if GEMINI_API_KEY is present
 */
async function callGeminiLLM(userPrompt, currentContext = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const promptText = `${SYSTEM_PACKAGING_PROMPT}\n\nCurrent Context: ${JSON.stringify(currentContext)}\nUser Packaging Request: "${userPrompt}"\nReturn ONLY raw JSON.`;

    const result = await model.generateContent(promptText);
    const responseText = result.response.text();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.warn("Gemini LLM API call failed, falling back to smart local NLP engine:", err.message);
  }
  return null;
}

/**
 * Real AI Image Generation Pipeline for Packaging Artwork Labels (Pollinations / Imagen / DALL-E)
 */
function generateAiGraphicArtworkUrl(prompt, variationIndex = 1, primaryColor = "#121212", accentColor = "#00f0ff") {
  const cleanPrompt = prompt.trim();
  const seed = Math.floor(Math.random() * 90000) + 10000 + variationIndex * 77;

  let styleKeywords = "Masterpiece packaging label design, luxury minimalist, ultra-realistic, professional studio lighting, 8k resolution, award-winning commercial design";
  const p = cleanPrompt.toLowerCase();
  if (p.includes("cyberpunk") || p.includes("neon") || p.includes("circuit") || p.includes("nexus")) {
    styleKeywords = "cyberpunk Nexus Cabernet Sauvignon wine bottle box label, glowing cyan and pink neon circuit grid lines, obsidian metallic paperboard, silver metallic emblem, 8k resolution, photorealistic graphic label render";
  } else if (p.includes("perfume") || p.includes("cosmetic")) {
    styleKeywords = "luxury perfume box packaging design, gold geometric foil stamping, marble texture, elegance, 8k resolution";
  } else if (p.includes("tea") || p.includes("organic") || p.includes("green")) {
    styleKeywords = "organic matcha tea package design, sage green paperboard, botanical line art, gold crest emblem, 8k resolution";
  }

  const fullPrompt = `${cleanPrompt}, ${styleKeywords}, flat 2d graphic artwork texture layout for 3d box panel`;
  const encoded = encodeURIComponent(fullPrompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}`;
}

/**
 * Pacdora-Grade Ultra-Rich Graphic Artwork Generator Engine (1024x1024)
/**
 * Procedural Fallback Generators
 * These are used when Pollinations API times out or fails.
 */
function generateFallbackBackground(primaryColor = "#0f172a", accentColor = "#00f0ff") {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <pattern id="bgPattern" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="1" fill="${accentColor}" opacity="0.15"/>
        </pattern>
      </defs>
      <rect width="1024" height="1024" fill="${primaryColor}"/>
      <rect width="1024" height="1024" fill="url(#bgPattern)"/>
    </svg>
  `.trim();
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function generateFallbackIcon(brandName = "A", primaryColor = "#0f172a", accentColor = "#00f0ff") {
  const initial = brandName.charAt(0).toUpperCase();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="240" fill="none" stroke="${accentColor}" stroke-width="8" opacity="0.8"/>
      <circle cx="256" cy="256" r="210" fill="none" stroke="${primaryColor}" stroke-width="4" opacity="0.4"/>
      <text x="256" y="320" font-family="'sans-serif'" font-size="200" font-weight="900" fill="${accentColor}" text-anchor="middle">${initial}</text>
    </svg>
  `)}`;
}


/**
 * Prompt-to-Box-Shape Classifier
 *
 * ONLY determines the structural box shape and approximate dimensions from the
 * user's free-form description. Does NOT impose colors, aesthetics, or design
 * choices — those all come from the user's prompt.
 *
 * Available models in this project: rte, te, auto_lock, cosmetic
 */
function classifyPrompt(text) {
  const t = text.toLowerCase();

  // Extract any explicit color the user mentioned for the box body
  let primaryColor = '#18181b'; // safe dark default — the actual design comes from AI image
  if (t.match(/\bwhite\b/)) primaryColor = '#f8f8f8';
  else if (t.match(/\bkraft\b|\bbrown\b/)) primaryColor = '#c4a882';
  else if (t.match(/\bnav(y|al)\b|\bdark blue\b/)) primaryColor = '#0f172a';
  else if (t.match(/\bsage\b|\bmatcha\b|\bolive\b/)) primaryColor = '#4a5e45';
  else if (t.match(/\bblack\b/)) primaryColor = '#0a0a0a';
  else if (t.match(/\bred\b|\bcrimson\b/)) primaryColor = '#7f1d1d';
  else if (t.match(/\bgold(en)?\b/)) primaryColor = '#78350f';
  else if (t.match(/\bteal\b|\bcyan\b/)) primaryColor = '#134e4a';
  else if (t.match(/\bpurple\b|\bviolet\b/)) primaryColor = '#3b0764';
  else if (t.match(/\bpink\b|\brose\b/)) primaryColor = '#500724';

  const accentColor = '#d97706'; // neutral accent; AI image drives actual look

  // FLAT / PIZZA / FOOD DELIVERY BOXES → auto_lock (wide & flat)
  if (t.match(/\bpizza\b|\bflat box\b|\bmailer\b|\bfood delivery\b|\btakeout\b/)) {
    return { model: 'auto_lock', L_mm: 300, W_mm: 300, H_mm: 45, primaryColor, accentColor, artworkFace: 'top' };
  }
  // STRAIGHT TUCK → te
  if (t.match(/\bstraight tuck\b|\bte box\b/)) {
    return { model: 'te', L_mm: 120, W_mm: 80, H_mm: 180, primaryColor, accentColor, artworkFace: 'front' };
  }
  // AUTO-LOCK bottom → auto_lock (user asked explicitly)
  if (t.match(/\bauto.?lock\b|\bautolock\b/)) {
    return { model: 'auto_lock', L_mm: 200, W_mm: 150, H_mm: 80, primaryColor, accentColor, artworkFace: 'front' };
  }
  // TALL / SLIM / BOTTLE / TUBE / WINE → cosmetic
  if (t.match(/\bwine\b|\bbottle\b|\btube\b|\bcandle\b|\bperfume\b|\bcosmetic\b|\bserum\b|\bspray\b|\bflask\b/)) {
    return { model: 'cosmetic', L_mm: 70, W_mm: 70, H_mm: 250, primaryColor, accentColor, artworkFace: 'front' };
  }
  // Everything else → rte (reverse tuck end, most versatile standard retail box)
  // This includes tea, cake, shoes, electronics, snacks, gifts — anything the user describes freely
  return { model: 'rte', L_mm: 120, W_mm: 80, H_mm: 200, primaryColor, accentColor, artworkFace: 'front' };
}

/**
 * Robust Local Dynamic NLP Intent Parser (Used as fallback or direct engine)
 */
async function parseLocalDynamicPrompt(prompt, currentContext = {}) {
  const text = prompt.toLowerCase();
  const actions = [];

  // Use smart classifier to get correct box model, dimensions, and style hints
  const classified = classifyPrompt(text);
  let { model, L_mm, W_mm, H_mm, primaryColor, accentColor, artworkFace, styleHint } = classified;

  // Enforce explicit context if user manually selected a box tag
  if (currentContext && currentContext.requestedBoxModel) {
    model = currentContext.requestedBoxModel;
  } else if (currentContext && currentContext.currentBoxModel && !currentContext.requestedBoxModel) {
    // We do NOT want to stick to currentBoxModel if we're guessing, unless we want to enforce it.
    // Wait, the user specifically wanted to be able to OVERRIDE the AI. 
    // If they didn't select a tag (it's null), let the AI guess.
  }

  // Override if explicit dimensions in prompt
  const dimRegex = /(\d+(?:\.\d+)?)\s*(?:x|×|\*)\s*(\d+(?:\.\d+)?)\s*(?:x|×|\*)\s*(\d+(?:\.\d+)?)\s*(mm|cm|in|inch|inches)?/i;
  const dimMatch = text.match(dimRegex);
  let unitFound = 'mm';
  if (dimMatch) {
    const rawL = parseFloat(dimMatch[1]);
    const rawW = parseFloat(dimMatch[2]);
    const rawH = parseFloat(dimMatch[3]);
    const u = (dimMatch[4] || 'mm').toLowerCase();
    if (u === 'mm') { unitFound = 'mm'; L_mm = rawL; W_mm = rawW; H_mm = rawH; }
    else if (u === 'cm') { unitFound = 'mm'; L_mm = rawL * 10; W_mm = rawW * 10; H_mm = rawH * 10; }
    else { unitFound = 'in'; L_mm = rawL * 25.4; W_mm = rawW * 25.4; H_mm = rawH * 25.4; }
  }

  // Color overrides from prompt
  if (text.includes("red")) primaryColor = "#7f1d1d";
  if (text.includes("green")) primaryColor = "#064e3b";
  if (text.includes("navy") || text.includes("blue")) primaryColor = "#0f172a";
  if (text.includes("gold")) accentColor = "#d97706";
  if (text.includes("copper")) accentColor = "#b45309";
  if (text.includes("cyan") || text.includes("neon")) accentColor = "#00f0ff";
  if (text.includes("pink") || text.includes("magenta")) accentColor = "#ff007f";

  // Convert to inches for store
  const L_in = Math.round((L_mm / 25.4) * 10000) / 10000;
  const W_in = Math.round((W_mm / 25.4) * 10000) / 10000;
  const H_in = Math.round((H_mm / 25.4) * 10000) / 10000;

  const words = prompt.trim().split(" ");
  const topic = words.slice(0, 3).join(" ") || "Custom";

  const directions = [
    { id: "dir-1", title: `${topic} – Premier`, subtitle: `${primaryColor} board with ${accentColor} graphic accents`, primaryColor, accentColor },
    { id: "dir-2", title: `${topic} – Gold Reserve`, subtitle: `High contrast with gold foil stamp`, primaryColor: "#09090b", accentColor: "#d97706" },
    { id: "dir-3", title: `${topic} – Heritage`, subtitle: `Warm craft paperboard with emblem`, primaryColor: "#78350f", accentColor: "#1d4ed8" }
  ];

  // Local fallback generates the prompt dynamically since we don't have LLM structured output
  const artworkPrompt = `${prompt}, beautiful sprawling packaging illustration, centered composition, premium design, isolated on ${primaryColor} background`;
  // Only use prompt text as a brand name if it's very short (e.g. "Apple iPhone Box"). 
  // Otherwise, a long descriptive prompt will result in ugly partial sentences like "A MINIMALIST ABSTRACT".
  const fallbackBrandName = words.length <= 4 ? topic.toUpperCase() : null;

  const renderVariations = [];
  for (const idx of [1, 2, 3, 4]) {
    // Await sequentially to avoid rate-limiting the free-tier Hugging Face API
    const artworkUrl = await fetchLayer2AssetBase64(artworkPrompt, false, idx);
    renderVariations.push({
      id: `var-${idx}`,
      title: `${directions[0].title} – Packshot ${idx}`,
      backgroundUrl: artworkUrl || generateFallbackBackground(primaryColor, accentColor),
      iconUrl: null,
      typography: fallbackBrandName ? { brandName: fallbackBrandName, fontStyle: 'sans-serif', color: accentColor } : null,
      aspectRatio: '1:1'
    });
    // Add a tiny delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  actions.push({ type: "SET_BOX_MODEL", model });
  actions.push({ type: "SET_DIMENSIONS", L: L_in, W: W_in, H: H_in, unit: unitFound });
  actions.push({ type: "SET_PACKAGE_COLOR", color: primaryColor });

  return {
    reply: `Packshot designs for your **${model === 'auto_lock' ? 'flat' : model === 'cosmetic' ? 'slim tall' : 'standard'} box** have been generated per brief and are ready for review.\n\n• Dimensions: **${L_mm} × ${W_mm} × ${H_mm} mm**\n• Box Structure: **${model.toUpperCase()}**\n• Body Color: **${primaryColor}**`,
    actions,
    model,
    packageColor: primaryColor,
    dimensions: { L: L_in, W: W_in, H: H_in, unit: unitFound },
    dielineSummary: `${L_mm} × ${W_mm} × ${H_mm} mm (${model.toUpperCase()} Vector DXF)`,
    directions,
    artworkFace,
    expandedBrief: `Analyzed "${prompt}". Selected **${model}** box structure (${L_mm}×${W_mm}×${H_mm}mm). Generated 4 custom AI graphic label designs with ${primaryColor} body color and ${accentColor} accents. Ready for 2D dieline export and 3D preview.`,
    renderVariations,
    outputsSummary: "Outputs: 4 • 1K • 1:1"
  };
}

/**
 * Process AI Chat logic with Gemini API fallback to Local Engine
 */
async function processAiChat(prompt, currentContext) {
  // 1. Try Google Gemini API first if GEMINI_API_KEY is present
  const geminiData = await callGeminiLLM(prompt, currentContext);
  if (geminiData && geminiData.reply) {
    // Enforce explicit context if user already selected a box
    if (currentContext && currentContext.requestedBoxModel) {
      geminiData.model = currentContext.requestedBoxModel;
    }

    const primary = geminiData.packageColor || "#18181b";
    const accent = geminiData.directions?.[0]?.accentColor || "#2563eb";

    const renderVariations = [];
    // Process sequentially to prevent Hugging Face free-tier rate limits (429) causing blank images
    for (let idx = 1; idx <= 4; idx++) {
      // LLM now outputs an artworkPrompt that describes the sprawling illustration
      const artworkPrompt = geminiData.artworkPrompt || `${prompt}, sprawling beautiful illustration, centered on ${primary} background`;

      const artworkUrl = await fetchLayer2AssetBase64(artworkPrompt, false, idx);
      const fallbackBrandName = geminiData.typography?.brandName || "BRAND";

      renderVariations.push({
        id: `var-${idx}`,
        title: `${geminiData.directions?.[0]?.title || 'Hero'} - Packshot ${idx}`,
        backgroundUrl: artworkUrl || generateFallbackBackground(primary, accent),
        iconUrl: null,
        typography: geminiData.typography || { brandName: fallbackBrandName, fontStyle: 'sans-serif', color: accent },
        aspectRatio: "1:1"
      });

      // Add a 3-second delay to prevent hitting free-tier 429 rate limits
      if (idx < 4) await new Promise(resolve => setTimeout(resolve, 3000));
    }

    const actions = [];
    if (geminiData.model) actions.push({ type: "SET_BOX_MODEL", model: geminiData.model });
    if (geminiData.dimensions) actions.push({ type: "SET_DIMENSIONS", ...geminiData.dimensions });
    if (geminiData.packageColor) actions.push({ type: "SET_PACKAGE_COLOR", color: geminiData.packageColor });

    return {
      ...geminiData,
      actions,
      renderVariations,
      outputsSummary: "Outputs: 4 • 1K • 1:1"
    };
  }

  // 2. Fallback to Local Smart Dynamic Engine
  return await parseLocalDynamicPrompt(prompt, currentContext);
}

/**
 * Generate Artwork Texture
 */
async function generateArtworkTexture(prompt, style = 'vibrant') {
  const svgUrl = generateProceduralSvgTexture(prompt, 1, "#18181b", "#2563eb");
  return {
    success: true,
    imageUrl: svgUrl,
    prompt: prompt
  };
}



const SYSTEM_PACKAGING_PROMPT_V2 = `
You are Pacdora AI — an expert Digital Automated Packaging Designer.
Your task is to analyze user prompts and orchestrate a highly precise, multi-panel structural layout for 3D packaging.

Always return a valid JSON object matching this exact schema:
{
  "reply": "Conversational explanation of the design concept...",
  "model": "rte" | "te" | "auto_lock" | "cosmetic",
  "dimensions": { "L": number_in_inches, "W": number, "H": number, "unit": "mm" | "in" | "cm" },
  "baseColor": "#hex",
  "artworkPrompt": "Visual description of the Front panel hero graphic...",
  "leftPanelText": { "title": "...", "body": "..." },
  "rightPanelText": { "title": "...", "body": "..." },
  "directions": [ { "id": "dir-1", "title": "Concept", "primaryColor": "#hex", "accentColor": "#hex" } ]
}
`;

async function processAiChatV2(prompt, currentContext) {
  // Use V1 local fallback as a base just for dimensions/colors if Gemini fails
  const localBase = await parseLocalDynamicPrompt(prompt, currentContext);
  
  // Try Gemini for true V2 output
  let v2Data = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      
      const res = await Promise.race([
        model.generateContent([
          { text: SYSTEM_PACKAGING_PROMPT_V2 },
          { text: `User request: ${prompt}\n\nCurrent context: ${JSON.stringify(currentContext)}` }
        ]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini API timeout')), 15000))
      ]);
      
      const responseText = res.response.text();
      v2Data = JSON.parse(responseText);
    } catch (e) {
      console.error("V2 Gemini failed, falling back to mock V2:", e.message);
    }
  }

  // Fallback / Parsing
  const data = v2Data || {
    ...localBase,
    leftPanelText: { title: "Specifications", body: "Premium materials." },
    rightPanelText: { title: "Story", body: "Crafted with care." },
    artworkPrompt: `${prompt}, beautiful illustration, isolated on white background`
  };

  // Enforce explicit context if user manually selected a box tag
  if (currentContext && currentContext.requestedBoxModel) {
    data.model = currentContext.requestedBoxModel;
  }

  const primary = data.baseColor || data.packageColor || "#18181b";
  const renderVariations = [];
  const safeArtworkPrompt = data.artworkPrompt || prompt;
  
  // If localBase already generated variations, reuse all of them with V2 panel layouts
  if (localBase && localBase.renderVariations && localBase.renderVariations.length > 0 && !v2Data) {
    for (let idx = 0; idx < localBase.renderVariations.length; idx++) {
      const v = localBase.renderVariations[idx];
      renderVariations.push({
        ...v,
        id: `var-v2-${idx + 1}`,
        title: v.title || `${data.directions?.[0]?.title || 'Hero'} - Packshot ${idx + 1}`,
        v2Layout: {
          frontImage: v.backgroundUrl,
          leftText: data.leftPanelText,
          rightText: data.rightPanelText,
          barcodeUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/UPC-A-036000291452.svg'
        }
      });
    }
  } else {
    // Generate all 4 variations for V2
    for (let idx = 1; idx <= 4; idx++) {
      const artworkUrl = await fetchLayer2AssetBase64(safeArtworkPrompt, false, idx);
      renderVariations.push({
        id: `var-v2-${idx}`,
        title: `${data.directions?.[0]?.title || 'Hero'} - Packshot ${idx}`,
        backgroundUrl: artworkUrl || generateFallbackBackground(primary, "#ffffff"),
        v2Layout: {
          frontImage: artworkUrl,
          leftText: data.leftPanelText,
          rightText: data.rightPanelText,
          barcodeUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/UPC-A-036000291452.svg'
        }
      });
      if (idx < 4) await new Promise(r => setTimeout(r, 1000));
    }
  }

  const actions = [{ type: "SET_BOX_MODEL", model: data.model || localBase.model }];
  if (data.dimensions) actions.push({ type: "SET_DIMENSIONS", ...data.dimensions });
  if (data.baseColor || data.packageColor) actions.push({ type: "SET_PACKAGE_COLOR", color: data.baseColor || data.packageColor });

  return {
    ...data,
    reply: data.reply || localBase.reply,
    actions,
    renderVariations,
    outputsSummary: "Outputs: 4 • 1K • 1:1 • V2 Multi-Panel Mapping"
  };
}

module.exports = {
  processAiChat,
  processAiChatV2,
  generateArtworkTexture,
  parseLocalDynamicPrompt
};
