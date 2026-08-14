// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { ChevronLeft, Share2, HelpCircle, Bookmark, Check } from 'lucide-react';
import { getReverseTuckGeometry } from '../../geometry';
import { API_BASE_URL } from '../../config/api';
import {
  EditorLayout,
  Toolbar,
  ControlsPanel,
  PropertiesPanel,
  Preview2D,
  StatusBar
} from '../../components/reverse-tuck';

export default function ReverseTuckEditorPage() {
  // Geometry parameters (Will trigger recalculations)
  const [L, setL] = useState(150);
  const [W, setW] = useState(70);
  const [H, setH] = useState(200);
  const [unit, setUnit] = useState<'mm' | 'in'>('mm');
  const [glueTab, setGlueTab] = useState(20);
  const [tuck, setTuck] = useState(18);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProject = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const bodyData = JSON.stringify({
      name: `Reverse Tuck Box (${L}×${W}×${H}${unit})`,
      type: 'DIELINE',
      category: 'Reverse Tuck End',
      variantId: 2,
      dimensions: { L, W, H, glueTab, tuck }
    });
    try {
      let res = await fetch(`${API_BASE_URL}/mockups/saved`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: bodyData
      });
      let data = await res.json();

      if (res.status === 401 || data.message === 'Token expired.') {
        try {
          const savedRefreshToken = localStorage.getItem('refreshToken');
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-refresh-token': savedRefreshToken || ''
            },
            credentials: 'include',
            body: JSON.stringify({ refreshToken: savedRefreshToken })
          });
          const refreshData = await refreshRes.json();
          if (refreshRes.ok && refreshData.data?.accessToken) {
            const newToken = refreshData.data.accessToken;
            localStorage.setItem('token', newToken);
            if (refreshData.data.refreshToken) {
              localStorage.setItem('refreshToken', refreshData.data.refreshToken);
            }
            res = await fetch(`${API_BASE_URL}/mockups/saved`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${newToken}`
              },
              body: bodyData
            });
            data = await res.json();
          }
        } catch (e) {
          console.error('Refresh token failed:', e);
        }
      }

      if (res.ok && data.success) {
        setIsSaved(true);
        window.dispatchEvent(new CustomEvent('project-saved'));
        alert('✓ Customized Dieline Project saved successfully to your User Profile!');
      } else if (res.status === 401 || data.message === 'Token expired.') {
        localStorage.removeItem('token');
        alert('Your login session has expired. Please sign in again to save your project.');
      } else {
        alert(data.message || 'Failed to save project.');
      }
    } catch {
      alert('Error saving project.');
    } finally {
      setIsSaving(false);
    }
  };

  // Rendering-only parameters (Will NOT trigger geometry recalculations)
  const [thickness, setThickness] = useState(0.5);
  const [material, setMaterial] = useState('white');
  const [sizeMode, setSizeMode] = useState<'mfg' | 'inner'>('mfg');
  const [orientation, setOrientation] = useState<number>(0);

  // Display options
  const [showCreaseLines, setShowCreaseLines] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showPanelShading, setShowPanelShading] = useState(true);

  const [activeTool, setActiveTool] = useState('cursor');
  const [showSettings, setShowSettings] = useState(false);

  // Recalculate geometry ONLY when L, W, H, glueTab, tuck, or unit changes
  const geom = useMemo(() => {
    // If unit is in, multiply values by 25.4 to calculate correct vector points in mm
    const factor = unit === 'in' ? 25.4 : 1;
    return getReverseTuckGeometry(
      L * factor,
      W * factor,
      H * factor,
      glueTab * factor,
      tuck * factor,
      W * factor
    );
  }, [L, W, H, glueTab, tuck, unit]);

  const handleDownloadDieline = (format: string) => {
    console.log(`Downloading dieline in ${format} format... (Placeholder)`);
  };

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  const navbar = (
    <header className="h-14 bg-white border-b border-zinc-200 px-5 flex items-center justify-between select-none">
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 hover:text-zinc-950 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-zinc-950">Reverse Tuck Dieline Editor</span>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={handleSaveProject}
          disabled={isSaving}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm ${
            isSaved ? 'bg-emerald-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          {isSaved ? 'Saved to Profile' : isSaving ? 'Saving...' : 'Save Project'}
        </button>
        <button className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
          <Share2 className="w-3.5 h-3.5" />
          Share Design
        </button>
        <button className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
          <HelpCircle className="w-3.5 h-3.5" />
          Help
        </button>
      </div>
    </header>
  );

  return (
    <>
      <EditorLayout
        navbar={navbar}
        sidebarLeft={
          <ControlsPanel
            L={L}
            W={W}
            H={H}
            unit={unit}
            thickness={thickness}
            material={material}
            sizeMode={sizeMode}
            tuck={tuck}
            glueTab={glueTab}
            orientation={orientation}
            showCreaseLines={showCreaseLines}
            showDimensions={showDimensions}
            showPanelShading={showPanelShading}
            onUpdateL={setL}
            onUpdateW={setW}
            onUpdateH={setH}
            onToggleUnit={setUnit}
            onUpdateThickness={setThickness}
            onUpdateMaterial={setMaterial}
            onUpdateSizeMode={setSizeMode}
            onUpdateTuck={setTuck}
            onUpdateGlueTab={setGlueTab}
            onUpdateOrientation={setOrientation}
            onToggleCreaseLines={() => setShowCreaseLines(!showCreaseLines)}
            onToggleDimensions={() => setShowDimensions(!showDimensions)}
            onTogglePanelShading={() => setShowPanelShading(!showPanelShading)}
          />
        }
        sidebarRight={
          <PropertiesPanel
            onDownloadDieline={handleDownloadDieline}
          />
        }
        toolbar={
          <Toolbar
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            onToggleSettings={() => setShowSettings(!showSettings)}
          />
        }
        workspace={
          <Preview2D
            geom={geom}
            L={L}
            W={W}
            H={H}
            glueTab={glueTab}
            tuck={tuck}
            unit={unit}
            orientation={orientation}
            showCreaseLines={showCreaseLines}
            showDimensions={showDimensions}
            showPanelShading={showPanelShading}
          />
        }
        statusBar={
          <StatusBar
            geom={geom}
            L={L}
            W={W}
            H={H}
            unit={unit}
          />
        }
      />
    </>
  );
}
