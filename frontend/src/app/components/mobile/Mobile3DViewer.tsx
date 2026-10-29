import React from 'react';
import SipperWaterBottle3D from '../3d/SipperWaterBottle3D';
import PlasticWaterBottle3D from '../3d/PlasticWaterBottle3D';
import BeverageCan3D from '../3d/BeverageCan3D';
import SlimCan3D from '../3d/SlimCan3D';
import ToothpasteTube3D from '../3d/ToothpasteTube3D';
import Box3DViewer from '../../../components/Box3DViewer';

interface Mobile3DViewerProps {
  modelType: string;
  substrate?: 'kraft' | 'white' | 'metal' | 'plastic';
  height?: number;
  autoRotate?: boolean;
  progress?: number;
}

export const Mobile3DViewer: React.FC<Mobile3DViewerProps> = ({
  modelType,
  substrate = 'white',
  height = 240,
  autoRotate = true,
  progress = 1,
}) => {
  const typeKey = (modelType || '').toLowerCase();

  // 1. Sipper Water Bottle with Handle (1000ml sports bottle with loop handle & carabiner hook)
  if (typeKey === 'sipper_water_bottle' || typeKey === 'water_bottle_handle' || typeKey.includes('sipper')) {
    const tintColor = substrate === 'kraft' ? '#c89a63' : substrate === 'metal' ? '#e2e8f0' : '#ffffff';
    return (
      <div className="relative w-full overflow-hidden flex items-center justify-center select-none" style={{ height }}>
        <SipperWaterBottle3D
          bottleTint={tintColor}
          capColor="#18181b"
          materialType="metal_glossy"
          interactive={true}
          autoRotate={autoRotate}
          autoRotateSpeed={1.0}
          showWatermark={false}
          showPlaceholder={true}
          isMini={height < 250}
          cameraDistance={height < 250 ? 6.2 : 5.4}
          className="w-full h-full"
        />
        <div className="absolute bottom-2 right-2 text-[10px] text-zinc-600 bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded-full pointer-events-none border border-zinc-200/50">
          Touch & Spin 360°
        </div>
      </div>
    );
  }

  // 2. Plastic Mineral Water Bottle (PET bottle with ribbed grip)
  if (typeKey === 'water_bottle' || typeKey === 'mineral_water_bottle') {
    return (
      <div className="relative w-full overflow-hidden flex items-center justify-center select-none" style={{ height }}>
        <PlasticWaterBottle3D
          bottleTint="#ffffff"
          capColor="#0284c7"
          materialType="plastic_glossy"
          interactive={true}
          autoRotate={autoRotate}
          autoRotateSpeed={1.0}
          showWatermark={false}
          isMini={height < 250}
          className="w-full h-full"
        />
        <div className="absolute bottom-2 right-2 text-[10px] text-zinc-600 bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded-full pointer-events-none border border-zinc-200/50">
          Touch & Spin 360°
        </div>
      </div>
    );
  }

  // 3. Beverage Can (12 oz Soda Can with pull-tab)
  if (typeKey === 'can' || typeKey === '12oz_can') {
    return (
      <div className="relative w-full overflow-hidden flex items-center justify-center select-none" style={{ height }}>
        <BeverageCan3D
          packageColor={substrate === 'kraft' ? '#c89a63' : '#fafafa'}
          materialType="metal_gloss"
          interactive={true}
          autoRotate={autoRotate}
          autoRotateSpeed={1.0}
          showWatermark={false}
          showPlaceholder={true}
          className="w-full h-full"
        />
        <div className="absolute bottom-2 right-2 text-[10px] text-zinc-600 bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded-full pointer-events-none border border-zinc-200/50">
          Touch & Spin 360°
        </div>
      </div>
    );
  }

  // 4. Slim Can (355 ml aluminum slim can)
  if (typeKey === 'slim_can' || typeKey === 'slim_355ml_can') {
    return (
      <div className="relative w-full overflow-hidden flex items-center justify-center select-none" style={{ height }}>
        <SlimCan3D
          packageColor={substrate === 'kraft' ? '#c89a63' : '#fafafa'}
          materialType="metal_gloss"
          interactive={true}
          autoRotate={autoRotate}
          autoRotateSpeed={1.0}
          showWatermark={false}
          showPlaceholder={true}
          className="w-full h-full"
        />
        <div className="absolute bottom-2 right-2 text-[10px] text-zinc-600 bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded-full pointer-events-none border border-zinc-200/50">
          Touch & Spin 360°
        </div>
      </div>
    );
  }

  // 5. Toothpaste Tube (75 ml squeeze tube)
  if (typeKey === 'tube' || typeKey.includes('tube')) {
    return (
      <div className="relative w-full overflow-hidden flex items-center justify-center select-none" style={{ height }}>
        <ToothpasteTube3D
          capColor="#2563eb"
          materialType="plastic_glossy"
          interactive={true}
          autoRotate={autoRotate}
          autoRotateSpeed={1.0}
          showWatermark={false}
          showPlaceholder={true}
          className="w-full h-full"
        />
        <div className="absolute bottom-2 right-2 text-[10px] text-zinc-600 bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded-full pointer-events-none border border-zinc-200/50">
          Touch & Spin 360°
        </div>
      </div>
    );
  }

  // 6. Authentic Box models (RSC, RTE, TE, Auto-Lock, Cosmetic, Cosmetic B, Button Hole)
  const isKnownBox = ['rsc', 'rte', 'te', 'auto_lock', 'cosmetic', 'cosmetic_b', 'button_hole'].includes(typeKey);
  const boxModelKey = isKnownBox ? typeKey : (typeKey.includes('box') ? 'rte' : 'rte');

  // Characteristic box proportions so each box model looks distinct and authentic
  let dims = { L: 4.5, W: 2.8, H: 5.6 };
  let boxZoom = 0.72;
  if (boxModelKey === 'rsc') {
    dims = { L: 6.0, W: 6.0, H: 6.0 };
    boxZoom = 0.62;
  } else if (boxModelKey === 'cosmetic_b') {
    dims = { L: 8.5, W: 6.0, H: 2.2 };
    boxZoom = 0.65;
  } else if (boxModelKey === 'auto_lock') {
    dims = { L: 4.6, W: 3.0, H: 5.5 };
    boxZoom = 0.72;
  } else if (boxModelKey === 'cosmetic') {
    dims = { L: 3.5, W: 3.5, H: 5.6 };
    boxZoom = 0.74;
  } else if (boxModelKey === 'button_hole') {
    dims = { L: 4.2, W: 3.0, H: 5.5 };
    boxZoom = 0.72;
  } else if (boxModelKey === 'te') {
    dims = { L: 4.2, W: 2.5, H: 5.5 };
    boxZoom = 0.74;
  }

  const isKraft = substrate === 'kraft';
  const pkgColor = isKraft 
    ? (boxModelKey === 'rsc' ? '#9E7247' : '#C89A63') 
    : '#FCFCFC';
  const matPreset = isKraft 
    ? (boxModelKey === 'rsc' ? 'corrugated-kraft' : 'natural-kraft') 
    : 'white-kraft';

  return (
    <div className="relative w-full overflow-hidden flex items-center justify-center select-none bg-zinc-950" style={{ height }}>
      <Box3DViewer
        key={`${boxModelKey}-${substrate}-${progress}`}
        boxModelOverride={boxModelKey}
        overrideLayout="single"
        L={dims.L}
        W={dims.W}
        H={dims.H}
        zoom={boxZoom}
        materialPreset={matPreset}
        packageColor={pkgColor}
        progress={progress}
        lightingPreset="studio"
        activeAnimation="none"
        showWatermark={false}
      />
      <div className="absolute bottom-2 right-2 text-[10px] text-zinc-400 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full pointer-events-none border border-white/10">
        Touch & Spin 360°
      </div>
    </div>
  );
};

export default Mobile3DViewer;
