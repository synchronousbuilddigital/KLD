# KLD (Keyline Design) - Comprehensive Project Analysis & Workflow Documentation

This document provides a complete technical analysis of the **Keyline Design (KLD)** codebase, detailing system architecture, module-by-module component responsibilities, mathematical dieline generators, 3D rendering engine, state management, backend APIs, and end-to-end user workflows.

---

## 1. System Architecture Overview

KLD is an enterprise-grade 2D Dieline Generator & 3D Packaging Design Platform built using a decoupled Client-Server architecture:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               Frontend (Vite / React)                            │
├───────────────────────────────────────┬─────────────────────────────────────────┤
│          2D Dieline Engine            │             3D Viewers                  │
│  - Mathematical SVG Generators        │  - Three.js / React Three Fiber         │
│  - DXF / CAD Exporters                │  - Procedural Folding Meshes            │
│  - Decal Drag / Rotate / Resize       │  - Dynamic Canvas Texture Generator     │
├───────────────────────────────────────┴─────────────────────────────────────────┤
│                     State Management (Zustand Stores)                           │
│  - useBoxStore (Global Box Config)     - useEditorStore (Decals & Canvas History)│
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │ REST API (JSON / Axios)
┌───────────────────────────────────────┴─────────────────────────────────────────┐
│                             Backend (Express / Node.js)                         │
├───────────────────┬───────────────────┬───────────────────┬─────────────────────┤
│  Authentication   │   Saved Designs   │   Asset Uploads   │   Export Logging    │
│  (JWT / Bcrypt)   │   (MongoDB CRUD)  │   (Cloudinary)    │   & Admin Dashboard │
└───────────────────┴───────────────────┴───────────────────┴─────────────────────┘
```

### Key Technical Stack:
* **Frontend:** React 18, TypeScript / JavaScript, Vite, Three.js, `@react-three/fiber`, `@react-three/drei`, Zustand, Tailwind CSS / Vanilla CSS.
* **Backend:** Node.js, Express.js, MongoDB (Mongoose ORM), JWT (JSON Web Tokens), Bcrypt.js, Cloudinary SDK.
* **Math & Geometry Engine:** Custom SVG Path Calculation Algorithms, DXF CAD Template Exporters, jsPDF / Vector Graphics Generators.

---

## 2. Frontend Architecture & Component Workflows

### 2.1 Core Application Pages (`frontend/src/app/pages/`)

#### 1. `EditorModal.tsx`
* **Purpose:** Primary 2D Canvas & 3D Packaging Studio where users design artwork, place elements, select materials, and view real-time 3D box previews.
* **Key Functions & Workflow:**
  * `useEffect (sync store)`: Synchronizes the isolated `useEditorStore` with global `useBoxStore` when the modal opens to isolate transient editing operations.
  * `handleFileUpload(e)`: Uploads image assets via `uploadService.uploadLogo()` to Cloudinary CDN with fallback to browser `FileReader` base64 data URLs.
  * `handleAddDecal() / handleAddTextDecal() / handleAddShapeDecal() / handleAddWindowDecal()`: Instantiates new decals (images, text, shapes, packaging icons, cutouts) on the active box surface (`Outside` or `Inside`).
  * `pushHistory() / handleUndo() / handleRedo()`: Manages an undo/redo stack recording decal state changes.
  * `handleExport(fileType, colorMode, format)`: Clones the live SVG dieline node, strips or adjusts background layers, and invokes `exportPDF()` to compile high-resolution PDF or AI vector files. Logs export transactions to backend via `exportService.logExport()`.
  * `saveDesignToWorkspace()`: Prepares box dimensions, colors, decal placements, and saves design configuration to MongoDB via `mockupService.saveDesign()`.

#### 2. `BoxStudioModal.tsx`
* **Purpose:** Interactive 3D Studio modal for configuring box parameters (Length, Width, Height, Thickness, Material) and playing 3D fold/unfold animations.
* **Key Functions & Workflow:**
  * Dimension input listeners update `useBoxStore` dimensions.
  * Material selector updates box texture preset (`natural-kraft`, `corrugated-kraft`, `white-kraft`).
  * Fold slider controls `foldProgress` state passed to `Box3DViewer`.

#### 3. `WorkshopPage.tsx`
* **Purpose:** Central workspace page for selecting packaging box types (Reverse Tuck End, Straight Tuck End, Auto Lock Bottom, Cosmetic Box) and tuning dimensions prior to opening the Editor.
* **Key Functions & Workflow:**
  * `handleModelSelect(modelKey)`: Switches active box model in `useBoxStore`.
  * `handleDimensionChange(key, value)`: Dynamically computes dieline measurements and updates store.
  * Launches `EditorModal` or `BoxStudioModal` on demand.

#### 4. `WorkspacePage.tsx`
* **Purpose:** User project dashboard displaying saved designs, draft projects, recent exports, search/filtering, and design cloning/deletion.
* **Key Functions & Workflow:**
  * `useEffect (fetch user designs)`: Calls `mockupService.getUserDesigns()` on page load to populate design cards.
  * `handleDeleteDesign(id)`: Removes saved design from backend database.
  * `handleOpenDesign(design)`: Loads saved box parameters and decal arrays into `useBoxStore` and opens the editor.

#### 5. `AdminDashboardPage.tsx`
* **Purpose:** Administrative management interface for tracking system usage, user accounts, system metrics, design templates, and export logs.
* **Key Functions & Workflow:**
  * Fetches admin stats from `/api/admin/stats` and user lists from `/api/users`.
  * Supports updating user roles (User / Admin), editing plan access, and monitoring total exports.

#### 6. `UserProfilePage.tsx`
* **Purpose:** Manages user account profile details, security, password changes, and subscription status.
* **Key Functions & Workflow:**
  * Fetches user profile from `authService.getProfile()`.
  * Submits updated profile data via `authService.updateProfile()`.

#### 7. `PricingPage.tsx`
* **Purpose:** Displays subscription plans (Free, Pro, Enterprise) with feature comparisons and checkout triggers.

#### 8. `TemplateLibraryPage.tsx` & `PackagingCollections.tsx` & `DielinesPage.tsx`
* **Purpose:** Showcase pre-made dieline templates, box categories, and industry-specific packaging collections (Food, Cosmetics, E-commerce, Retail).

---

### 2.2 3D Modeling & Rendering Engine (`frontend/src/components/box3d/` & `Box3DViewer.jsx`)

#### 1. `Box3DViewer.jsx`
* **Purpose:** Smart 3D container component that selects the appropriate 3D mesh generator based on `store.boxModel`.
* **Workflow:**
  * Routes `boxModel === 'rte'` -> `<RTEBox3DViewer />`
  * Routes `boxModel === 'te'` -> `<TEBox3DViewer />`
  * Routes `boxModel === 'auto_lock'` -> `<AutoLockBox3DViewer />`
  * Routes `boxModel === 'cosmetic'` -> `<CosmeticBox3DViewer />`

#### 2. `RTEBox3DViewer.jsx`, `TEBox3DViewer.jsx`, `AutoLockBox3DViewer.jsx`, `CosmeticBox3DViewer.jsx`
* **Purpose:** Three.js procedural 3D box models with realistic folding panels, creasing lines, paperboard material textures, and dynamic decal rendering.
* **Key Functions & Workflow:**
  * **Mesh Construction:** Generates 3D panel geometries using dimensions $L, W, H, T$.
  * **Fold Kinematics:** Computes rotational pivots for dust flaps, top tuck flaps, bottom flaps, and side seams driven by `foldProgress` ($0 = \text{flat sheet}$, $1 = \text{folded 3D box}$).
  * **Dynamic Texture Update:** Listens to decal modifications; calls `sharedUtils.jsx` canvas renderer to create dynamic canvas textures mapped onto Three.js `MeshStandardMaterial`.

#### 3. `sharedUtils.jsx`
* **Purpose:** Utilities for Three.js texture synthesis, lighting setups, bump map generation, and paper material physics.
* **Key Functions & Workflow:**
  * `createDecalTexture(decals, surface, width, height)`: Draws active decal images, text, and SVG paths onto an off-screen HTML5 Canvas and returns a Three.js `CanvasTexture`.
  * `createPaperMaterial(materialPreset, texture)`: Constructs PBR materials simulating paper textures (Kraft, Cardboard, Coated White) with roughness, bump maps, and specular highlights.

---

### 2.3 2D Dieline Generators & Vector Engine (`frontend/src/lib/` & `frontend/src/components/`)

#### 1. `DielineSVG.jsx`
* **Purpose:** Interactive 2D SVG canvas rendering cutlines (solid red/cyan), crease lines (dashed green), bleed lines, dimension callouts, and decal interactive transform controls (drag, scale, rotate, delete).

#### 2. Dieline Math Generators (`rteDielineGenerator.js`, `teDielineGenerator.js`, `autoLockDielineGenerator.js`, `cosmeticBoxDielineGenerator.js`)
* **Purpose:** Pure mathematical functions computing exact parametric 2D path coordinates based on Length ($L$), Width ($W$), Height ($H$), and Material Thickness ($T$).
* **Output Data Structure:**
  ```javascript
  {
    cutLines: [ "M x1 y1 L x2 y2 ...", ... ],  // Outer boundary cut paths
    scoreLines: [ "M x1 y1 L x2 y2 ...", ... ],// Folding / creasing paths
    bleedLines: [ ... ],                       // Outer printing bleed boundary
    panels: [ { id: 'front', x, y, width, height }, ... ] // Panel bounding boxes for decal snapping
  }
  ```

#### 3. CAD / Vector Exporters (`dxfDielineGenerator.js`, `dxfTemplate.js`, `exportUtils.js`)
* **Purpose:** Industry-standard export engines.
* **Key Functions & Workflow:**
  * `exportPDF(svgElement, filename, colorMode)`: Converts 2D SVG canvas to high-precision vector PDF / AI using jsPDF & svg2pdf, converting color profiles (RGB / CMYK) as specified.
  * `generateDXF(dimensions)`: Constructs DXF (Drawing Exchange Format) text strings compatible with AutoCAD and industrial CNC dieline laser cutting machines.

---

### 2.4 State Management (`frontend/src/lib/`)

#### 1. `useBoxStore.js`
* **Purpose:** Global Zustand store holding active box settings across the entire app.
* **State Keys:** `L`, `W`, `H`, `T`, `materialType`, `packageColor`, `insideColor`, `boxModel`, `theme`.
* **Actions:** `setDim(key, val)`, `setPackageColor(color)`, `setBoxModel(model)`.

#### 2. `useEditorStore.js`
* **Purpose:** Dedicated store for the 2D/3D Editor workspace.
* **State Keys:** `decalsByModel`, `activeContext`, `activeSurface` (`Outside`/`Inside`), `zoom`, `pan`, `activeTool`.

---

## 3. Backend Architecture & API Workflows

The backend (`backend/src/`) is built on Express.js and MongoDB.

### 3.1 Server Infrastructure (`app.js`, `index.js`, `config/cloudinary.js`)
* `index.js`: Connects to MongoDB via Mongoose, starts HTTP server on configured port.
* `app.js`: Configures middleware (CORS, Express JSON parser, Rate Limiter), mounts REST API routes under `/api/...`.
* `config/cloudinary.js`: Configures Cloudinary API credentials and provides `uploadBufferToCloudinary()` helper using Node.js Streams.

### 3.2 Modules & Endpoints (`backend/src/modules/`)

| Module | Route File | Controller File | Purpose & Endpoints |
|---|---|---|---|
| **Auth** | `auth.routes.js` | `auth.controller.js` | `POST /api/auth/register` - User registration<br>`POST /api/auth/login` - Authenticate & issue JWT token<br>`GET /api/auth/profile` - Fetch current user profile |
| **Users** | `users.routes.js` | `users.controller.js` | `GET /api/users` - Admin user list<br>`PUT /api/users/profile` - Update user details<br>`PUT /api/users/password` - Password update |
| **Mockups** | `mockups.routes.js` | `mockups.controller.js` | `POST /api/mockups` - Save new design configuration<br>`GET /api/mockups` - Retrieve user's saved designs<br>`GET /api/mockups/:id` - Fetch single design details<br>`DELETE /api/mockups/:id` - Delete design |
| **Uploads** | `uploads.routes.js` | `uploads.controller.js` | `POST /api/uploads/logo` - Upload logo/decal image to Cloudinary CDN |
| **Exports** | `exports.routes.js` | `exports.controller.js` | `POST /api/exports/log` - Log export action (PDF/AI/DXF)<br>`GET /api/exports/history` - Retrieve export history |
| **Admin** | `admin.routes.js` | `admin.controller.js` | `GET /api/admin/stats` - System usage analytics & metrics |

---

## 4. Complete End-to-End Workflows

### Workflow 1: Designing & Previewing Packaging
```
[User Selects Box Model & Dimensions on WorkshopPage]
                        │
                        ▼
            [useBoxStore Updates Parameters]
                        │
                        ▼
      [Mathematical Dieline Generators Calculate SVG Paths]
            ┌───────────┴───────────┐
            ▼                       ▼
   [2D DielineSVG Renders]   [Three.js Box3DViewer Renders]
            │                       │
            └───────────┬───────────┘
                        ▼
           [User Opens EditorModal]
                        │
                        ▼
  [Places Decals, Text, Custom Colors & Cutout Windows]
                        │
                        ▼
   [useEditorStore Pushes History & Re-renders 3D Texture]
```

### Workflow 2: Saving & Exporting Production Artwork
```
                 [User Clicks "Super Export"]
                              │
                              ▼
           [Selects File Type (PDF/AI) & Color Mode (CMYK/RGB)]
                              │
                              ▼
           [exportUtils.js Compiles High-Res Vector Output]
                              │
                              ▼
       [Client Calls POST /api/exports/log via exportService.ts]
                              │
                              ▼
                    [File Download Begins]
```

---

## 5. Directory Mapping Summary

* **Frontend Source:** `file:///d:/KLD/frontend/src`
  * Pages: `file:///d:/KLD/frontend/src/app/pages`
  * 3D Viewers: `file:///d:/KLD/frontend/src/components/box3d`
  * Dieline Math: `file:///d:/KLD/frontend/src/lib`
  * API Services: `file:///d:/KLD/frontend/src/services`
* **Backend Source:** `file:///d:/KLD/backend/src`
  * Controllers & Routes: `file:///d:/KLD/backend/src/modules`
  * DB Models: `file:///d:/KLD/backend/src/models`
  * Configuration: `file:///d:/KLD/backend/src/config`
