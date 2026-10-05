import React, { useMemo } from 'react';
import PlasticWaterBottle3D, { CanvasDecal } from '../../3d/PlasticWaterBottle3D';

/**
 * Photorealistic Crystal PET Plastic Water Bottle Preview
 * - Ultra-clear optical PET transmission
 * - Authentic blow-molded contour with 5 grip wave rings & petaloid base
 * - Ribbed plastic cap with tamper evident ring
 * - Rich retail water branding label with smooth 60fps turntable spin
 */
export default function WaterBottle3D() {
  const defaultDecals: CanvasDecal[] = useMemo(() => [
    {
      id: 'water-brand-sub',
      type: 'text',
      text: 'NATURAL SPRING WATER',
      fontSize: 14,
      fontFamily: 'Inter',
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.9)',
      x: 459,
      y: 48,
      width: 300,
      height: 20,
    },
    {
      id: 'water-brand-title',
      type: 'text',
      text: 'KLD AQUA',
      fontSize: 38,
      fontFamily: 'Inter',
      fontWeight: '900',
      color: '#ffffff',
      x: 459,
      y: 86,
      width: 400,
      height: 45,
    },
    {
      id: 'water-brand-vol',
      type: 'text',
      text: '500 ML • PURE PET • BPA FREE',
      fontSize: 13,
      fontFamily: 'Inter',
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.85)',
      x: 459,
      y: 128,
      width: 300,
      height: 20,
    }
  ], []);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '230px', position: 'relative', overflow: 'hidden' }}>
      <PlasticWaterBottle3D
        autoRotate={true}
        autoRotateSpeed={1.1}
        interactive={false}
        cameraDistance={7.8}
        labelColor="#0284c7"
        capColor="#0284c7"
        materialType="plastic_glossy"
        decals={defaultDecals}
      />
    </div>
  );
}
