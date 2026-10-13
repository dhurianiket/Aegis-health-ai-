import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrganHealthOverview, OrganSystemKey, OrganSystemScore } from '../../services/organHealthService';
import { WearableBiometrics } from '../../types/wearables';
import { Rotate3d, ZoomIn, ZoomOut, RefreshCw, Eye, Sparkles } from 'lucide-react';

export interface ThreeBodyScanner3DProps {
  overview: OrganHealthOverview;
  telemetry?: WearableBiometrics | null;
  selectedOrganKey: OrganSystemKey | null;
  onSelectOrgan: (organKey: OrganSystemKey) => void;
  scanActive: boolean;
  className?: string;
}

interface OrganNodeDef {
  key: OrganSystemKey;
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  shape: 'sphere' | 'box' | 'cylinder' | 'kidney';
}

const ORGAN_NODES: OrganNodeDef[] = [
  { key: 'cardiovascular', name: 'Heart', position: [-0.14, 1.28, 0.18], size: [0.18, 0.22, 0.16], shape: 'sphere' },
  { key: 'pulmonary', name: 'Lungs', position: [-0.32, 1.25, 0.05], size: [0.26, 0.42, 0.22], shape: 'sphere' },
  { key: 'pulmonary', name: 'Right Lung', position: [0.32, 1.25, 0.05], size: [0.26, 0.42, 0.22], shape: 'sphere' },
  { key: 'hepatic', name: 'Liver', position: [0.28, 0.88, 0.15], size: [0.35, 0.24, 0.24], shape: 'sphere' },
  { key: 'metabolic', name: 'Pancreas', position: [0.04, 0.74, 0.08], size: [0.32, 0.1, 0.12], shape: 'cylinder' },
  { key: 'renal', name: 'Left Kidney', position: [-0.28, 0.58, -0.12], size: [0.13, 0.18, 0.12], shape: 'kidney' },
  { key: 'renal', name: 'Right Kidney', position: [0.28, 0.58, -0.12], size: [0.13, 0.18, 0.12], shape: 'kidney' },
  { key: 'hematology', name: 'Blood Network', position: [0, 0.1, 0.05], size: [0.12, 1.1, 0.12], shape: 'cylinder' },
];

export const ThreeBodyScanner3D: React.FC<ThreeBodyScanner3DProps> = ({
  overview,
  telemetry,
  selectedOrganKey,
  onSelectOrgan,
  scanActive,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hoveredOrgan, setHoveredOrgan] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; name: string; status: string; score: number } | null>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);

  // Interaction refs
  const stateRef = useRef({
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    rotY: 0,
    rotX: 0,
    velY: 0,
    velX: 0,
    zoom: 5.4,
    targetZoom: 5.4,
    scanY: 2.2,
    scanDir: -1,
  });

  const getOrganColor = useCallback(
    (key: OrganSystemKey) => {
      const score = overview.organSystems[key];
      if (!score) return 0x22d3ee;
      if (score.status === 'critical') return 0xf43f5e;
      if (score.status === 'warning') return 0xf59e0b;
      return 0x10b981;
    },
    [overview]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Safe pre-check for WebGL context
    const hasWebGL = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        return Boolean(
          window.WebGLRenderingContext &&
            (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'))
        );
      } catch {
        return false;
      }
    })();

    if (!hasWebGL) {
      setWebGLSupported(false);
      return;
    }

    // Verify WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebGLSupported(false);
      return;
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 540;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.08);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 5.4);

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0x083344, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x22d3ee, 2.0);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 1.5);
    rimLight.position.set(-3, -2, -2);
    scene.add(rimLight);

    // Root Hologram Pivot
    const holoPivot = new THREE.Group();
    scene.add(holoPivot);

    // ─────────────────────────────────────────────────────────────
    // 1. PROCEDURAL 3D ANATOMICAL HUMAN MESH & POINT CLOUD
    // ─────────────────────────────────────────────────────────────
    const particlePositions: number[] = [];
    const particleColors: number[] = [];
    const baseColor = new THREE.Color(0x22d3ee);
    const spineColor = new THREE.Color(0x818cf8);

    // Helper: Add points on an ellipse ring
    const addRing = (
      cy: number,
      rx: number,
      rz: number,
      count: number,
      color: THREE.Color = baseColor,
      yJitter = 0.02
    ) => {
      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2;
        const x = Math.cos(theta) * rx + (Math.random() - 0.5) * 0.02;
        const z = Math.sin(theta) * rz + (Math.random() - 0.5) * 0.02;
        const y = cy + (Math.random() - 0.5) * yJitter;
        particlePositions.push(x, y, z);
        particleColors.push(color.r, color.g, color.b);
      }
    };

    // Head (Cranium & Jaw)
    for (let y = 1.95; y <= 2.55; y += 0.04) {
      const ny = (y - 2.25) / 0.3;
      const r = Math.sqrt(Math.max(0, 1 - ny * ny)) * 0.28;
      addRing(y, r, r * 1.12, 32);
    }
    // Neck
    for (let y = 1.76; y <= 1.92; y += 0.04) {
      addRing(y, 0.15, 0.16, 20);
    }
    // Shoulders & Clavicle
    addRing(1.72, 0.72, 0.26, 48);
    addRing(1.68, 0.68, 0.25, 48);

    // Ribcage / Thorax (Barrel shaped)
    for (let y = 1.05; y <= 1.64; y += 0.04) {
      const progress = (y - 1.05) / 0.59;
      const rx = 0.44 + Math.sin(progress * Math.PI) * 0.14;
      const rz = 0.24 + Math.sin(progress * Math.PI) * 0.08;
      addRing(y, rx, rz, 44);
    }

    // Spine Column (Center Points)
    for (let y = -0.1; y <= 2.0; y += 0.035) {
      particlePositions.push(0, y, -0.06);
      particleColors.push(spineColor.r, spineColor.g, spineColor.b);
    }

    // Abdomen & Waist (Tapered)
    for (let y = 0.65; y <= 1.02; y += 0.04) {
      const rx = 0.38 + (1 - (y - 0.65) / 0.37) * 0.08;
      const rz = 0.22 + (1 - (y - 0.65) / 0.37) * 0.04;
      addRing(y, rx, rz, 36);
    }

    // Pelvis & Hips
    for (let y = 0.25; y <= 0.62; y += 0.04) {
      const rx = 0.44 + Math.sin(((y - 0.25) / 0.37) * Math.PI) * 0.08;
      const rz = 0.26;
      addRing(y, rx, rz, 40);
    }

    // Left & Right Arms
    [-1, 1].forEach((side) => {
      // Upper arm
      for (let y = 1.0; y <= 1.65; y += 0.04) {
        const x = side * (0.64 + (1.65 - y) * 0.08);
        const z = 0;
        addRing(y, 0.11, 0.11, 14, baseColor, 0.01);
        particlePositions.push(x, y, z);
        particleColors.push(baseColor.r, baseColor.g, baseColor.b);
      }
      // Forearm & Hand
      for (let y = 0.35; y <= 0.98; y += 0.04) {
        const x = side * (0.7 + (0.98 - y) * 0.04);
        const z = (0.98 - y) * 0.05;
        addRing(y, 0.08, 0.08, 12, baseColor, 0.01);
        particlePositions.push(x, y, z);
        particleColors.push(baseColor.r, baseColor.g, baseColor.b);
      }
    });

    // Left & Right Legs
    [-1, 1].forEach((side) => {
      const cx = side * 0.24;
      // Thighs
      for (let y = -0.8; y <= 0.2; y += 0.045) {
        const progress = (y - -0.8) / 1.0;
        const r = 0.15 + progress * 0.07;
        for (let i = 0; i < 22; i++) {
          const theta = (i / 22) * Math.PI * 2;
          particlePositions.push(cx + Math.cos(theta) * r, y, Math.sin(theta) * r);
          particleColors.push(baseColor.r, baseColor.g, baseColor.b);
        }
      }
      // Knees & Calves
      for (let y = -1.9; y <= -0.85; y += 0.045) {
        const progress = (y - -1.9) / 1.05;
        const r = 0.11 + Math.sin(progress * Math.PI) * 0.04;
        for (let i = 0; i < 18; i++) {
          const theta = (i / 18) * Math.PI * 2;
          particlePositions.push(cx + Math.cos(theta) * r, y, Math.sin(theta) * r);
          particleColors.push(baseColor.r, baseColor.g, baseColor.b);
        }
      }
      // Feet
      for (let z = -0.05; z <= 0.28; z += 0.05) {
        particlePositions.push(cx, -1.98, z);
        particleColors.push(baseColor.r, baseColor.g, baseColor.b);
      }
    });

    const bodyPointsGeo = new THREE.BufferGeometry();
    bodyPointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
    bodyPointsGeo.setAttribute('color', new THREE.Float32BufferAttribute(particleColors, 3));

    const bodyPointsMat = new THREE.PointsMaterial({
      size: 0.038,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const bodyPointsMesh = new THREE.Points(bodyPointsGeo, bodyPointsMat);
    holoPivot.add(bodyPointsMesh);

    // ─────────────────────────────────────────────────────────────
    // 2. WIREFRAME CONTOUR CAGE (Fine Holographic Lines)
    // ─────────────────────────────────────────────────────────────
    const wireSegmentsGeo = new THREE.BufferGeometry();
    const wirePositions: number[] = [];

    // Longitudinal body contour lines
    const addLongitudinal = (side: number) => {
      const pts = [
        [0, 2.5, 0],
        [side * 0.28, 2.25, 0],
        [side * 0.16, 1.85, 0],
        [side * 0.68, 1.7, 0],
        [side * 0.52, 1.3, 0],
        [side * 0.42, 0.9, 0],
        [side * 0.48, 0.5, 0],
        [side * 0.32, -0.3, 0],
        [side * 0.26, -0.85, 0],
        [side * 0.22, -1.4, 0],
        [side * 0.18, -1.95, 0],
      ];
      for (let i = 0; i < pts.length - 1; i++) {
        wirePositions.push(pts[i][0], pts[i][1], pts[i][2]);
        wirePositions.push(pts[i + 1][0], pts[i + 1][1], pts[i + 1][2]);
      }
    };
    addLongitudinal(-1);
    addLongitudinal(1);

    wireSegmentsGeo.setAttribute('position', new THREE.Float32BufferAttribute(wirePositions, 3));
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const wireMesh = new THREE.LineSegments(wireSegmentsGeo, wireMat);
    holoPivot.add(wireMesh);

    // ─────────────────────────────────────────────────────────────
    // 3. 3D VOLUMETRIC INTERNAL ORGANS
    // ─────────────────────────────────────────────────────────────
    const organMeshes: { mesh: THREE.Mesh; node: OrganNodeDef }[] = [];

    ORGAN_NODES.forEach((node) => {
      let geo: THREE.BufferGeometry;
      if (node.shape === 'cylinder') {
        geo = new THREE.CylinderGeometry(node.size[0] / 2, node.size[0] / 2, node.size[1], 16);
      } else {
        geo = new THREE.SphereGeometry(node.size[0], 16, 16);
      }

      const colorHex = getOrganColor(node.key);
      const isSelected = selectedOrganKey === node.key;

      const mat = new THREE.MeshPhongMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: isSelected ? 0.9 : 0.45,
        transparent: true,
        opacity: isSelected ? 0.85 : 0.6,
        shininess: 90,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...node.position);
      mesh.scale.set(1, node.size[1] / node.size[0], node.size[2] / node.size[0]);
      mesh.userData = { organKey: node.key, name: node.name };

      // Halo Wireframe Outer Ring for Selected / High-Risk Organ
      const outlineGeo = new THREE.WireframeGeometry(geo);
      const outlineMat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.7,
      });
      const outlineMesh = new THREE.LineSegments(outlineGeo, outlineMat);
      mesh.add(outlineMesh);

      holoPivot.add(mesh);
      organMeshes.push({ mesh, node });
    });

    // ─────────────────────────────────────────────────────────────
    // 4. VOLUMETRIC LASER SCAN PLANE
    // ─────────────────────────────────────────────────────────────
    const scanGeo = new THREE.PlaneGeometry(2.4, 0.12);
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const scanPlane = new THREE.Mesh(scanGeo, scanMat);
    scanPlane.rotation.x = Math.PI / 2;
    scanPlane.position.y = 2.0;
    holoPivot.add(scanPlane);

    // ─────────────────────────────────────────────────────────────
    // 5. ROTATING HOLOGRAPHIC GROUND BASE
    // ─────────────────────────────────────────────────────────────
    const floorRingsGroup = new THREE.Group();
    floorRingsGroup.position.y = -2.1;
    scene.add(floorRingsGroup);

    const makeRing = (radius: number, color: number, opacity: number) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
      });
      const rMesh = new THREE.Mesh(ringGeo, ringMat);
      rMesh.rotation.x = Math.PI / 2;
      return rMesh;
    };

    const ring1 = makeRing(1.6, 0x22d3ee, 0.5);
    const ring2 = makeRing(1.2, 0x2dd4bf, 0.4);
    const ring3 = makeRing(0.8, 0x818cf8, 0.3);
    floorRingsGroup.add(ring1, ring2, ring3);

    // ─────────────────────────────────────────────────────────────
    // 6. INTERACTIVE RAYCASTER & POINTER EVENTS
    // ─────────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(organMeshes.map((o) => o.mesh), false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const organKey = hit.userData.organKey as OrganSystemKey;
        const organName = hit.userData.name as string;
        const organData = overview.organSystems[organKey];

        setHoveredOrgan(organName);
        setTooltipPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          name: organName,
          status: organData?.status || 'optimal',
          score: organData?.score || 90,
        });
      } else {
        setHoveredOrgan(null);
        setTooltipPos(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(organMeshes.map((o) => o.mesh), false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const organKey = hit.userData.organKey as OrganSystemKey;
        onSelectOrgan(organKey);
      }
    };

    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('click', handleClick);

    // ─────────────────────────────────────────────────────────────
    // 7. DRAG-TO-ROTATE 3D ORBIT TRACKING (Inertia Dampening)
    // ─────────────────────────────────────────────────────────────
    const handleMouseDown = (e: MouseEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.prevMouseX = e.clientX;
      stateRef.current.prevMouseY = e.clientY;
      setIsRotating(false);
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!stateRef.current.isDragging) return;
      const dx = e.clientX - stateRef.current.prevMouseX;
      const dy = e.clientY - stateRef.current.prevMouseY;

      stateRef.current.velY = dx * 0.007;
      stateRef.current.velX = dy * 0.004;

      stateRef.current.rotY += stateRef.current.velY;
      stateRef.current.rotX = Math.max(-0.45, Math.min(0.45, stateRef.current.rotX + stateRef.current.velX));

      stateRef.current.prevMouseX = e.clientX;
      stateRef.current.prevMouseY = e.clientY;
    };

    const handleWindowMouseUp = () => {
      stateRef.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      stateRef.current.targetZoom = Math.max(3.8, Math.min(7.5, stateRef.current.targetZoom + e.deltaY * 0.004));
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Touch controls for mobile/tablet
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        stateRef.current.isDragging = true;
        stateRef.current.prevMouseX = e.touches[0].clientX;
        stateRef.current.prevMouseY = e.touches[0].clientY;
        setIsRotating(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (stateRef.current.isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - stateRef.current.prevMouseX;
        const dy = e.touches[0].clientY - stateRef.current.prevMouseY;

        stateRef.current.rotY += dx * 0.009;
        stateRef.current.rotX = Math.max(-0.45, Math.min(0.45, stateRef.current.rotX + dy * 0.005));

        stateRef.current.prevMouseX = e.touches[0].clientX;
        stateRef.current.prevMouseY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      stateRef.current.isDragging = false;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    // ─────────────────────────────────────────────────────────────
    // 8. ANIMATION RENDER LOOP (60 FPS)
    // ─────────────────────────────────────────────────────────────
    let animId: number;
    let clock = new THREE.Clock();

    const render = () => {
      animId = requestAnimationFrame(render);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Inertia & Auto-rotation
      if (!stateRef.current.isDragging) {
        stateRef.current.velY *= 0.92;
        stateRef.current.velX *= 0.92;
        stateRef.current.rotY += stateRef.current.velY;
        stateRef.current.rotX += stateRef.current.velX;

        if (isRotating && Math.abs(stateRef.current.velY) < 0.001) {
          stateRef.current.rotY += 0.004;
        }
      }

      // Smooth zoom lerp
      stateRef.current.zoom += (stateRef.current.targetZoom - stateRef.current.zoom) * 0.1;
      camera.position.z = stateRef.current.zoom;

      // Apply rotation to Hologram Root Pivot
      holoPivot.rotation.y = stateRef.current.rotY;
      holoPivot.rotation.x = stateRef.current.rotX;

      // Floor rings spin
      ring1.rotation.z += 0.006;
      ring2.rotation.z -= 0.009;
      ring3.rotation.z += 0.012;

      // Cardiac pulse animation
      const heartRateBpm = telemetry?.heartRate && telemetry.heartRate > 0 ? telemetry.heartRate : 70;
      const heartFreq = (heartRateBpm / 60) * Math.PI * 2;
      const pulseScale = 1 + Math.sin(elapsed * heartFreq) * 0.09;

      organMeshes.forEach(({ mesh, node }) => {
        if (node.key === 'cardiovascular') {
          mesh.scale.set(pulseScale, pulseScale * (node.size[1] / node.size[0]), pulseScale);
        }
      });

      // 3D Laser Scan sweep
      if (scanActive) {
        scanPlane.visible = true;
        stateRef.current.scanY += stateRef.current.scanDir * delta * 1.3;
        if (stateRef.current.scanY > 2.4) {
          stateRef.current.scanY = 2.4;
          stateRef.current.scanDir = -1;
        } else if (stateRef.current.scanY < -2.0) {
          stateRef.current.scanY = -2.0;
          stateRef.current.scanDir = 1;
        }
        scanPlane.position.y = stateRef.current.scanY;
      } else {
        scanPlane.visible = false;
      }

      renderer.render(scene, camera);
    };

    render();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      renderer.dispose();
    };
  }, [overview, telemetry, selectedOrganKey, onSelectOrgan, scanActive, getOrganColor, isRotating]);

  // Reset Camera View helper
  const handleResetCamera = () => {
    stateRef.current.rotX = 0;
    stateRef.current.rotY = 0;
    stateRef.current.targetZoom = 5.4;
    setIsRotating(true);
  };

  const handleZoomIn = () => {
    stateRef.current.targetZoom = Math.max(3.8, stateRef.current.targetZoom - 0.6);
  };

  const handleZoomOut = () => {
    stateRef.current.targetZoom = Math.min(7.5, stateRef.current.targetZoom + 0.6);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[540px] flex items-center justify-center select-none overflow-hidden rounded-3xl ${className}`}
      style={{
        background: 'radial-gradient(ellipse at 50% 45%, rgba(6, 182, 212, 0.12) 0%, rgba(2, 6, 23, 0.98) 75%)',
        border: '1px solid rgba(34, 211, 238, 0.25)',
        boxShadow: '0 0 60px -10px rgba(6, 182, 212, 0.15), inset 0 0 80px -20px rgba(6, 182, 212, 0.1)',
      }}
    >
      {/* Three.js Canvas Element */}
      {webGLSupported ? (
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing block"
          aria-label="3D Holographic Patient Anatomical Model"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
          <p className="text-sm font-semibold">WebGL acceleration active in fallback view.</p>
        </div>
      )}

      {/* 3D Spatial Interactive Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleResetCamera}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 backdrop-blur-md shadow-lg transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          title="Reset Anatomical Orientation"
          aria-label="Reset View"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 backdrop-blur-md shadow-lg transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 backdrop-blur-md shadow-lg transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsRotating((r) => !r)}
          className={`p-2.5 rounded-xl border backdrop-blur-md shadow-lg transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
            isRotating
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
              : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
          }`}
          title={isRotating ? 'Pause 3D Orbit' : 'Resume 3D Orbit'}
          aria-label="Toggle Auto-Orbit"
        >
          <Rotate3d className="w-4 h-4" />
        </button>
      </div>

      {/* Orbit Helper Badge */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 backdrop-blur-md">
        <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
        <span>Drag to rotate 360° · Scroll to zoom · Click organ to inspect</span>
      </div>

      {/* Floating 3D Hover Tooltip */}
      {tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none transition-transform duration-75 px-3 py-2 rounded-xl bg-slate-950/90 border border-cyan-400/50 text-white shadow-2xl backdrop-blur-md text-xs font-mono"
          style={{
            left: `${tooltipPos.x + 12}px`,
            top: `${tooltipPos.y - 36}px`,
          }}
        >
          <div className="font-bold text-cyan-300 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                tooltipPos.status === 'critical'
                  ? 'bg-rose-400'
                  : tooltipPos.status === 'warning'
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span>{tooltipPos.name}</span>
          </div>
          <div className="text-[10px] text-slate-300 mt-0.5">
            System Score: <span className="font-bold text-white">{tooltipPos.score} / 100</span>
          </div>
        </div>
      )}
    </div>
  );
};
