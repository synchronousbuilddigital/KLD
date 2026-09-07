import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface GLBModelProps {
  src: string;
  className?: string;
  autoRotateSpeed?: number;
  cameraDistance?: number;
  tilt?: number;
  modelSize?: number;
}

export const GLBModel: React.FC<GLBModelProps> = ({
  src,
  className = "w-full h-full",
  autoRotateSpeed = 2,
  cameraDistance = 3.5,
  tilt = 0,
  modelSize = 2.4,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any previous canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    let isMounted = true;
    const w = container.clientWidth || 450;
    const h = container.clientHeight || 450;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 1000);
    camera.position.set(cameraDistance, cameraDistance * 0.45, cameraDistance);
    camera.lookAt(0, 0, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    // 3. Bright Studio Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xddeeff, 1.4);
    fillLight.position.set(-5, 3, -4);
    scene.add(fillLight);

    const bottomLight = new THREE.DirectionalLight(0xffeedd, 0.8);
    bottomLight.position.set(0, -5, 0);
    scene.add(bottomLight);

    const rimLight = new THREE.DirectionalLight(0xffeedd, 1.0);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    // 4. Model Group (rotates on Y)
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // 5. Load GLTF
    const loader = new GLTFLoader();
    loader.load(
      src,
      (gltf) => {
        if (!isMounted) return;
        const model = gltf.scene;

        // Ensure materials are double-sided and well-lit
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => {
                  m.side = THREE.DoubleSide;
                  m.needsUpdate = true;
                });
              } else {
                mesh.material.side = THREE.DoubleSide;
                mesh.material.needsUpdate = true;
              }
            }
          }
        });

        // 1. Scale model first
        const rawBox = new THREE.Box3().setFromObject(model);
        const rawSize = rawBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;
        const scale = modelSize / maxDim;
        model.scale.setScalar(scale);

        // 2. Re-compute center on scaled geometry and translate to exact origin (0, 0, 0)
        model.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3().setFromObject(model);
        const center = scaledBox.getCenter(new THREE.Vector3());
        model.position.x -= center.x;
        model.position.y -= center.y;
        model.position.z -= center.z;
        model.updateMatrixWorld(true);

        // 3. Optional tilt applied to child so origin stays centered
        if (tilt !== 0) {
          model.rotation.x = (tilt * Math.PI) / 180;
        }

        modelGroup.add(model);
      },
      undefined,
      (error) => {
        console.error("Error loading GLTF model:", src, error);
      }
    );

    // 6. Animation Loop
    let frameId: number;
    let lastTime = performance.now();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Smooth auto-rotation around Y
      modelGroup.rotation.y += (autoRotateSpeed * Math.PI / 180) * delta * 60;
      renderer.render(scene, camera);
    };
    animate();

    // 7. Resize Observer for fluid responsiveness
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = entry.contentRect.width || w;
        const newH = entry.contentRect.height || h;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      cancelAnimationFrame(frameId);
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [src, autoRotateSpeed, cameraDistance, tilt, modelSize]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        pointerEvents: "none",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
};
