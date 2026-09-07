import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface GiftBoxGLBHandle {
  setLidOpen: (progress: number) => void;
  setCameraZoom: (progress: number) => void;
}

export const GiftBoxGLB = forwardRef<GiftBoxGLBHandle, { className?: string; style?: React.CSSProperties }>(
  ({ className = "w-full h-full", style }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const pivotRef = useRef<THREE.Group | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

    // Camera start: Isometric view outside the box
    const camStart = new THREE.Vector3(4.8, 3.6, 4.8);
    // Camera end: Plunged directly inside the box interior
    const camEnd = new THREE.Vector3(0, 0.15, 0.05);
    const lookStart = new THREE.Vector3(0, 0, 0);
    const lookEnd = new THREE.Vector3(0, -0.6, 0);

    useImperativeHandle(ref, () => ({
      setLidOpen: (progress: number) => {
        if (pivotRef.current) {
          const p = Math.min(1, Math.max(0, progress));
          pivotRef.current.rotation.x = -(Math.PI * 0.75) * p;
        }
      },
      setCameraZoom: (progress: number) => {
        if (cameraRef.current) {
          const p = Math.min(1, Math.max(0, progress));
          cameraRef.current.position.lerpVectors(camStart, camEnd, p);
          const look = new THREE.Vector3().lerpVectors(lookStart, lookEnd, p);
          cameraRef.current.lookAt(look);
        }
      },
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      while (container.firstChild) container.removeChild(container.firstChild);

      let isMounted = true;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, w / h, 0.01, 1000);
      camera.position.copy(camStart);
      camera.lookAt(lookStart);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.4;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Bright Studio Lighting Setup
      scene.add(new THREE.AmbientLight(0xffffff, 1.5));
      const key = new THREE.DirectionalLight(0xffffff, 2.4);
      key.position.set(4, 8, 5);
      scene.add(key);

      const fill = new THREE.DirectionalLight(0xddeeff, 1.4);
      fill.position.set(-4, 3, -3);
      scene.add(fill);

      // Light pointing inside the box from above
      const insideLight = new THREE.PointLight(0xffffff, 2.0, 5);
      insideLight.position.set(0, 0.5, 0);
      scene.add(insideLight);

      const rim = new THREE.DirectionalLight(0xffeedd, 1.0);
      rim.position.set(0, 5, -5);
      scene.add(rim);

      const modelGroup = new THREE.Group();
      scene.add(modelGroup);

      const loader = new GLTFLoader();
      loader.load("/gift_box.glb", (gltf) => {
        if (!isMounted) return;
        const model = gltf.scene;

        // Double-sided materials so the interior walls and floor are rendered with full texture
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

        // 1. Scale model
        const rawBox = new THREE.Box3().setFromObject(model);
        const rawSize = rawBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;
        const scale = 2.0 / maxDim;
        model.scale.setScalar(scale);

        // 2. Center model at origin
        model.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3().setFromObject(model);
        const center = scaledBox.getCenter(new THREE.Vector3());
        model.position.x -= center.x;
        model.position.y -= center.y;
        model.position.z -= center.z;
        model.updateMatrixWorld(true);

        // 3. Lid Assembly setup
        const lidMeshes: THREE.Mesh[] = [];
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            const matName = Array.isArray(m.material) ? m.material[0]?.name : m.material?.name;
            if (matName === "M_Lines" || matName === "M_BTop") {
              lidMeshes.push(m);
            }
          }
        });

        if (lidMeshes.length > 0) {
          const lidBox = new THREE.Box3();
          lidMeshes.forEach((m) => lidBox.expandByObject(m));

          const lidHingeY = lidBox.min.y;
          const lidHingeZ = lidBox.min.z;

          const pivot = new THREE.Group();
          pivot.position.set(0, lidHingeY, lidHingeZ);

          const parentNode = lidMeshes[0].parent || model;
          parentNode.add(pivot);

          lidMeshes.forEach((mesh) => {
            const origPos = mesh.position.clone();
            pivot.add(mesh);
            mesh.position.set(origPos.x, origPos.y - lidHingeY, origPos.z - lidHingeZ);
          });

          pivotRef.current = pivot;
        }

        modelGroup.add(model);
      });

      let frameId: number;
      let lastTime = performance.now();
      const animate = () => {
        frameId = requestAnimationFrame(animate);
        const now = performance.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;
        modelGroup.rotation.y += (1.0 * Math.PI / 180) * delta * 60;
        renderer.render(scene, camera);
      };
      animate();

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newW = entry.contentRect.width || window.innerWidth;
          const newH = entry.contentRect.height || window.innerHeight;
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      });
      resizeObserver.observe(container);

      return () => {
        isMounted = false;
        resizeObserver.disconnect();
        cancelAnimationFrame(frameId);
        renderer.dispose();
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          pointerEvents: "none",
          width: "100%",
          height: "100%",
          ...style,
        }}
      />
    );
  }
);
