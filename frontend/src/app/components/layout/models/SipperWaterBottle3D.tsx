import React, { useMemo } from 'react';
import { SipperWaterBottle3D, CanvasDecal } from '../../3d/SipperWaterBottle3D';

/**
 * Photorealistic Sipper Water Bottle with Handle Preview
 * - Aluminum sports bottle with tapered shoulder
 * - Black cap with loop handle and attached silver carabiner clip hook
 * - Smooth 60fps turntable spin for catalog cards
 */
export default function SipperWaterBottle3DPreview() {
  const defaultDecals: CanvasDecal[] = useMemo(() => [
    {
      id: 'sipper-brand-title',
      type: 'text',
      text: 'SPORT HYDRATE',
      fontSize: 32,
      fontFamily: 'Inter',
      fontWeight: '800',
      color: '#0f172a',
      x: 320,
      y: 360,
      width: 300,
      height: 40,
    },
    {
      id: 'sipper-brand-sub',
      type: 'text',
      text: 'ALUMINUM CANTEEN • 750 ML',
      fontSize: 14,
      fontFamily: 'Inter',
      fontWeight: '600',
      color: '#64748b',
      x: 320,
      y: 410,
      width: 300,
      height: 25,
    }
  ], []);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '230px', position: 'relative', overflow: 'hidden' }}>
      <SipperWaterBottle3D
        autoRotate={true}
        autoRotateSpeed={1.2}
        interactive={false}
        cameraDistance={5.8}
        labelColor="#f8fafc"
        capColor="#18181b"
        materialType="metal_matt"
        showPlaceholder={true}
        decals={[]}
      />
    </div>
  );
}
