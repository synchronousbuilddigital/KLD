# Keyline Design (KLD) Packaging Studio & Dieline Generator

An advanced, production-ready web application for 3D packaging visualization, parametric vector dieline generation, and custom packaging mockup design.

## Features
- **3D Packaging Viewers**: Real-time 3D webGL folding and assembly animations for Tuck End, Reverse Tuck, Auto Lock Bottom, Shoebox, Slide Box, and Custom Packaging containers.
- **Parametric Dieline Generator**: Live vector dieline calculations exportable to DXF, SVG, and print-ready PDF formats.
- **User Workspace & Cloud Projects**: MongoDB integration for saved box projects, custom design assets, and user profiles.
- **High-Performance UI**: Modern glassmorphic responsive interface built with Vite, React, Tailwind CSS, and Framer Motion.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend**: Node.js, Express, MongoDB, JWT Authentication
- **Geometry & Export Engine**: Custom vector calculation libraries, DXF generator, PDF exporter

## Project Structure
```text
KLD/
├── frontend/             # React + Vite + Tailwind CSS frontend application
├── backend/              # Node.js + Express API server & Vercel serverless functions
│   └── api/index.js      # Vercel serverless function entrypoint
├── vercel.json           # Vercel deployment configuration
└── package.json          # Root npm scripts for development & build
```

## Getting Started

### Development
- **Run Frontend**: `npm run dev:frontend`
- **Run Backend**: `npm run dev:backend`

### Production Build
- **Build Frontend**: `npm run build:frontend`

