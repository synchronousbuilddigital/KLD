import React from 'react';
import { DielineCanvas } from '../dieline';

interface Preview2DProps {
  geom: any;
  L: number;
  W: number;
  H: number;
  glueTab: number;
  tuck: number;
  unit: 'mm' | 'in';
  orientation?: number;
  showCreaseLines?: boolean;
  showDimensions?: boolean;
  showPanelShading?: boolean;
  dimensions?: any[];
}

export const Preview2D: React.FC<Preview2DProps> = ({
  geom,
  L,
  W,
  H,
  glueTab,
  tuck,
  unit,
  orientation = 0,
  showCreaseLines = true,
  showDimensions = true,
  showPanelShading = true,
  dimensions = [],
}) => {
  const isRot = orientation === 90 || orientation === 270;

  return (
    <div className="flex-1 bg-zinc-50 border border-zinc-200 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 relative overflow-hidden select-none min-h-0 min-w-0">
      {/* Background Dots Grid */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #000000 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Render the unified DielineCanvas centered */}
      <div className="w-full h-full relative z-10">
        <DielineCanvas
          geom={geom}
          L={L}
          W={W}
          H={H}
          glueTab={glueTab}
          sheetW={isRot ? geom.flatH + 40 : geom.flatW + 40}
          sheetH={isRot ? geom.flatW + 40 : geom.flatH + 40}
          margin={20}
          spacing={0}
          maxTotal={1}
          activeBoxes={[{ id: 0, x: 20, y: 20, rot: orientation }]}
          selectedBoxId={null}
          collisions={new Set()}
          layoutMode="auto"
          draggedBoxId={null}
          showCreaseLines={showCreaseLines}
          showDimensions={showDimensions}
          showPanelShading={showPanelShading}
          dimensions={dimensions}
        />
      </div>
    </div>
  );
};
