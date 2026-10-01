import React from 'react';
import PlasticWaterBottle3D from '../../3d/PlasticWaterBottle3D';

interface WaterBottle3DProps {
  labelColor?: string;
  capColor?: string;
  autoRotate?: boolean;
}

export default function WaterBottle3D({
  labelColor = '#006b2b',
  capColor = '#ffffff',
  autoRotate = true,
}: WaterBottle3DProps) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '280px', position: 'relative' }}>
      <PlasticWaterBottle3D
        labelColor={labelColor}
        capColor={capColor}
        autoRotate={autoRotate}
        autoRotateSpeed={1.2}
        interactive={true}
        className="w-full h-full"
      />
    </div>
  );
}
