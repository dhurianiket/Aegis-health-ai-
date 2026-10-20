import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrganHealthOverview, OrganSystemKey } from '../../services/organHealthService';
import { WearableBiometrics } from '../../types/wearables';
import {
  Rotate3d,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Sparkles,
  Focus,
  Maximize2,
  Eye,
} from 'lucide-react';

export interface ThreeBodyScanner3DProps {
  overview: OrganHealthOverview;
  telemetry?: WearableBiometrics | null;
  selectedOrganKey: OrganSystemKey | null;
  onSelectOrgan: (organKey: OrganSystemKey) => void;
  scanActive: boolean;
  className?: string;
}

interface AnatomicalMeshMeta {
  meshName: string;
  organKey: OrganSystemKey;
  displayName: string;
  anatomicalColor: number;
  emissiveColor: number;
  baseOpacity: number;
}

const ANATOMICAL_ORGAN_MAP: Record<string, AnatomicalMeshMeta> = {
  heart: {
    meshName: 'heart',
    organKey: 'cardiovascular',
    displayName: 'Heart (Cardiovascular)',
    anatomicalColor: 0xf43f5e,
    emissiveColor: 0xe11d48,
    baseOpacity: 0.94,
  },
  lungs: {
    meshName: 'lungs',
    organKey: 'pulmonary',
    displayName: 'Lungs & Bronchi',
    anatomicalColor: 0x38bdf8,
    emissiveColor: 0x0284c7,
    baseOpacity: 0.78,
  },
  liver: {
    meshName: 'liver',
    organKey: 'hepatic',
    displayName: 'Liver (Hepatic)',
    anatomicalColor: 0xf97316,
    emissiveColor: 0xc2410c,
    baseOpacity: 0.9,
  },
  pancreas: {
    meshName: 'pancreas',
    organKey: 'metabolic',
    displayName: 'Pancreas (Metabolic)',
    anatomicalColor: 0xfacc15,
    emissiveColor: 0xca8a04,
    baseOpacity: 0.92,
  },
  kidney_left: {
    meshName: 'kidney_left',
    organKey: 'renal',
    displayName: 'Left Kidney (Renal)',
    anatomicalColor: 0xa855f7,
    emissiveColor: 0x7e22ce,
    baseOpacity: 0.92,
  },
  kidney_right: {
    meshName: 'kidney_right',
    organKey: 'renal',
    displayName: 'Right Kidney (Renal)',
    anatomicalColor: 0xa855f7,
    emissiveColor: 0x7e22ce,
    baseOpacity: 0.92,
  },
  vasculature: {
    meshName: 'vasculature',
    organKey: 'hematology',
    displayName: 'Aorta & Vena Cava',
    anatomicalColor: 0xec4899,
    emissiveColor: 0xbe185d,
    baseOpacity: 0.88,
  },
};

const QUICK_ORGAN_PILLS: {
  key: OrganSystemKey;
  label: string;
  dotColor: string;
  side: 'left' | 'right';
}[] = [
  { key: 'pulmonary', label: 'Pulmonary 3D', dotColor: '#38bdf8', side: 'left' },
  { key: 'hepatic', label: 'Hepatic 3D', dotColor: '#f97316', side: 'left' },
  { key: 'hematology', label: 'Vasculature 3D', dotColor: '#ec4899', side: 'left' },
  { key: 'cardiovascular', label: 'Cardiac 3D', dotColor: '#f43f5e', side: 'right' },
  { key: 'metabolic', label: 'Metabolic 3D', dotColor: '#facc15', side: 'right' },
  { key: 'renal', label: 'Renal 3D', dotColor: '#a855f7', side: 'right' },
];

// Custom GLSL X-Ray Fresnel Hologram Shader for NIH Visible Human Skin Shell
const XRAY_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPos;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vWorldPos = position;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const XRAY_FRAGMENT_SHADER = `
  uniform vec3 uRimColor;
  uniform vec3 uCoreColor;
  uniform float uScanY;
  uniform float uScanActive;
  uniform float uTime;
  uniform float uShellOpacity;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPos;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    // Angle-dependent Fresnel rim illumination:
    // Center of torso is crystal-clear (dot ~ 1 -> fresnel ~ 0),
    // Anatomical contours & musculature edges glow brightly (dot ~ 0 -> fresnel ~ 1)
    float viewDot = abs(dot(normal, viewDir));
    float fresnel = pow(1.0 - viewDot, 2.15);

    // Subtle micro-holographic horizontal scanlines
    float scanline = 0.88 + 0.12 * sin(vWorldPos.y * 210.0 - uTime * 2.5);

    // Live volumetric laser cross-section ring
    float distToScan = abs(vWorldPos.y - uScanY);
    float laserLine = uScanActive * smoothstep(0.018, 0.0, distToScan);
    float laserHalo = uScanActive * smoothstep(0.11, 0.0, distToScan) * 0.38;

    vec3 baseCol = mix(uCoreColor, uRimColor, fresnel) * scanline;
    vec3 finalCol = baseCol + vec3(0.45, 0.98, 1.0) * (laserLine * 1.6 + laserHalo);

    float alpha = (0.025 + fresnel * 0.64) * uShellOpacity + laserLine * 0.75 + laserHalo;
    gl_FragColor = vec4(finalCol, clamp(alpha, 0.0, 0.92));
  }
`;

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
  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
    name: string;
    status: string;
    score: number;
  } | null>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<'full-body' | 'torso-focus'>('full-body');
  const [xrayIntensity, setXrayIntensity] = useState<'standard' | 'deep-organ'>('standard');

  // Latest props in refs so event handlers & render loop don't tear down WebGL context
  const propsRef = useRef({
    overview,
    telemetry,
    selectedOrganKey,
    onSelectOrgan,
    scanActive,
    isRotating,
    xrayIntensity,
  });
  useEffect(() => {
    propsRef.current = {
      overview,
      telemetry,
      selectedOrganKey,
      onSelectOrgan,
      scanActive,
      isRotating,
      xrayIntensity,
    };
  }, [overview, telemetry, selectedOrganKey, onSelectOrgan, scanActive, isRotating, xrayIntensity]);

  // Camera & orbit state (calibrated using ModelViewer.tsx bounding-sphere math for 1.824m NIH body)
  const stateRef = useRef({
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    rotY: -0.18,
    rotX: 0.04,
    velY: 0,
    velX: 0,
    zoom: 2.82,
    targetZoom: 2.82,
    camY: -0.01,
    targetCamY: -0.01,
    scanY: 0.9,
    scanDir: -1,
  });

  const applyCameraPreset = useCallback((preset: 'full-body' | 'torso-focus') => {
    setCameraPreset(preset);
    if (preset === 'torso-focus') {
      // Focuses directly on thoracic & abdominal organs (Y: +0.05m to +0.68m)
      stateRef.current.targetCamY = 0.38;
      stateRef.current.targetZoom = 1.18;
      stateRef.current.rotX = 0.06;
    } else {
      // Full 1.824m NIH Visible Human standing anatomy (Y: -0.913m to +0.911m) with zero clipping
      stateRef.current.targetCamY = -0.01;
      stateRef.current.targetZoom = 2.82;
      stateRef.current.rotX = 0.02;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

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

    const width = container.clientWidth || 460;
    const height = container.clientHeight || 540;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();

    // FOV = 36 deg for distortion-free medical orthographic-like perspective
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.05, 50);
    camera.position.set(0, stateRef.current.camY, stateRef.current.zoom);

    // 3-Point Medical Studio Lighting for sculpted 3D organ topography
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(1.8, 2.5, 3.2);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x22d3ee, 1.6);
    fillLight.position.set(-2.5, 0.8, 2.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 1.8);
    rimLight.position.set(0, -2.0, -2.5);
    scene.add(rimLight);

    // Root Hologram Pivot
    const holoPivot = new THREE.Group();
    scene.add(holoPivot);

    // X-Ray Fresnel Shader Material for the outer NIH Visible Human skin mesh
    const bodyShellUniforms = {
      uRimColor: { value: new THREE.Color(0x22d3ee) },
      uCoreColor: { value: new THREE.Color(0x083344) },
      uScanY: { value: 0.9 },
      uScanActive: { value: 1.0 },
      uTime: { value: 0.0 },
      uShellOpacity: { value: 1.0 },
    };

    const bodyShellMaterial = new THREE.ShaderMaterial({
      vertexShader: XRAY_VERTEX_SHADER,
      fragmentShader: XRAY_FRAGMENT_SHADER,
      uniforms: bodyShellUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    // Track loaded interactive organ meshes
    const organEntries: {
      mesh: THREE.Mesh;
      material: THREE.MeshPhysicalMaterial;
      meta: AnatomicalMeshMeta;
    }[] = [];

    // Load the decimated NIH Visible Human Male GLB (body_shell + 7 internal organs)
    let isDisposed = false;
    const loader = new GLTFLoader();
    loader.load(
      '/models/nih-human-anatomy.glb',
      (gltf) => {
        if (isDisposed) return;

        const meshesToProcess: THREE.Mesh[] = [];
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            meshesToProcess.push(child as THREE.Mesh);
          }
        });

        meshesToProcess.forEach((rawMesh) => {
          const name = rawMesh.name;
          const geometry = rawMesh.geometry.clone();
          geometry.computeVertexNormals();

          if (name === 'body_shell') {
            const shellMesh = new THREE.Mesh(geometry, bodyShellMaterial);
            shellMesh.renderOrder = 2;
            holoPivot.add(shellMesh);
            return;
          }

          const meta = ANATOMICAL_ORGAN_MAP[name];
          if (!meta) return;

          // Center geometry at its own 3D anatomical centroid so cardiac/respiratory scaling
          // expands from the organ's own center while keeping exact NIH world placement
          geometry.computeBoundingBox();
          const center = new THREE.Vector3();
          geometry.boundingBox?.getCenter(center);
          geometry.translate(-center.x, -center.y, -center.z);

          const mat = new THREE.MeshPhysicalMaterial({
            color: meta.anatomicalColor,
            emissive: meta.emissiveColor,
            emissiveIntensity: 0.28,
            roughness: 0.32,
            metalness: 0.08,
            clearcoat: 0.65,
            clearcoatRoughness: 0.2,
            transparent: true,
            opacity: meta.baseOpacity,
          });

          const organMesh = new THREE.Mesh(geometry, mat);
          organMesh.position.copy(center);
          organMesh.renderOrder = 1;
          organMesh.userData = {
            organKey: meta.organKey,
            name: meta.displayName,
            meshName: name,
          };

          holoPivot.add(organMesh);
          organEntries.push({ mesh: organMesh, material: mat, meta });
        });

        setModelLoaded(true);
      },
      undefined,
      () => {
        // Graceful fallback if asset fails to fetch in isolated environments
        if (!isDisposed) setModelLoaded(true);
      }
    );

    // ─────────────────────────────────────────────────────────────
    // VOLUMETRIC LASER SCAN DISC & HOLOGRAPHIC PEDESTAL
    // ─────────────────────────────────────────────────────────────
    const scanRingGeo = new THREE.RingGeometry(0.02, 0.56, 64);
    const scanRingMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const scanPlane = new THREE.Mesh(scanRingGeo, scanRingMat);
    scanPlane.rotation.x = Math.PI / 2;
    scanPlane.position.y = 0.85;
    holoPivot.add(scanPlane);

    // Outer laser ring border
    const scanEdgeGeo = new THREE.RingGeometry(0.55, 0.57, 64);
    const scanEdgeMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const scanEdge = new THREE.Mesh(scanEdgeGeo, scanEdgeMat);
    scanPlane.add(scanEdge);

    // Holographic Ground Emitter Base right below the feet (Y = -0.93m)
    const floorRingsGroup = new THREE.Group();
    floorRingsGroup.position.y = -0.93;
    holoPivot.add(floorRingsGroup);

    const makeRing = (radius: number, thickness: number, color: number, opacity: number) => {
      const ringGeo = new THREE.RingGeometry(radius - thickness, radius + thickness, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const rMesh = new THREE.Mesh(ringGeo, ringMat);
      rMesh.rotation.x = Math.PI / 2;
      return rMesh;
    };

    const ring1 = makeRing(0.58, 0.008, 0x22d3ee, 0.55);
    const ring2 = makeRing(0.42, 0.006, 0x2dd4bf, 0.4);
    const ring3 = makeRing(0.26, 0.005, 0x818cf8, 0.35);
    floorRingsGroup.add(ring1, ring2, ring3);

    // ─────────────────────────────────────────────────────────────
    // INTERACTIVE RAYCASTER & POINTER EVENTS
    // ─────────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        organEntries.map((o) => o.mesh),
        false
      );

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const organKey = hit.userData.organKey as OrganSystemKey;
        const organName = hit.userData.name as string;
        const organData = propsRef.current.overview.organSystems[organKey];

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
      const intersects = raycaster.intersectObjects(
        organEntries.map((o) => o.mesh),
        false
      );

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const organKey = hit.userData.organKey as OrganSystemKey;
        propsRef.current.onSelectOrgan(organKey);
      }
    };

    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('click', handleClick);

    // ─────────────────────────────────────────────────────────────
    // DRAG-TO-ROTATE 3D ORBIT TRACKING
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

      stateRef.current.velY = dx * 0.008;
      stateRef.current.velX = dy * 0.004;

      stateRef.current.rotY += stateRef.current.velY;
      stateRef.current.rotX = Math.max(
        -0.4,
        Math.min(0.4, stateRef.current.rotX + stateRef.current.velX)
      );

      stateRef.current.prevMouseX = e.clientX;
      stateRef.current.prevMouseY = e.clientY;
    };

    const handleWindowMouseUp = () => {
      stateRef.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      stateRef.current.targetZoom = Math.max(
        0.85,
        Math.min(3.5, stateRef.current.targetZoom + e.deltaY * 0.002)
      );
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

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
        stateRef.current.rotX = Math.max(
          -0.4,
          Math.min(0.4, stateRef.current.rotX + dy * 0.005)
        );

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
    // 60 FPS RENDER LOOP
    // ─────────────────────────────────────────────────────────────
    let animId: number;
    const clock = new THREE.Clock();

    const render = () => {
      animId = requestAnimationFrame(render);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const currentProps = propsRef.current;

      // Inertia & Auto-rotation
      if (!stateRef.current.isDragging) {
        stateRef.current.velY *= 0.92;
        stateRef.current.velX *= 0.92;
        stateRef.current.rotY += stateRef.current.velY;
        stateRef.current.rotX += stateRef.current.velX;

        if (currentProps.isRotating && Math.abs(stateRef.current.velY) < 0.001) {
          stateRef.current.rotY += 0.0045;
        }
      }

      // Smooth camera zoom and vertical target interpolation
      stateRef.current.zoom += (stateRef.current.targetZoom - stateRef.current.zoom) * 0.1;
      stateRef.current.camY += (stateRef.current.targetCamY - stateRef.current.camY) * 0.1;
      camera.position.set(0, stateRef.current.camY, stateRef.current.zoom);
      camera.lookAt(0, stateRef.current.camY, 0);

      holoPivot.rotation.y = stateRef.current.rotY;
      holoPivot.rotation.x = stateRef.current.rotX;

      ring1.rotation.z += 0.005;
      ring2.rotation.z -= 0.008;
      ring3.rotation.z += 0.011;

      // Physiological animations (Heart beat & Lung respiration)
      const activeTelemetry = currentProps.telemetry;
      const heartRateBpm =
        activeTelemetry?.heartRate && activeTelemetry.heartRate > 0
          ? activeTelemetry.heartRate
          : 68;
      const heartFreq = (heartRateBpm / 60) * Math.PI * 2;
      const cardiacPulse = 1 + Math.pow(Math.max(0, Math.sin(elapsed * heartFreq)), 3) * 0.075;
      const breathScale = 1 + Math.sin(elapsed * 1.6) * 0.032;

      const selectedKey = currentProps.selectedOrganKey;

      organEntries.forEach(({ mesh, material, meta }) => {
        if (meta.meshName === 'heart') {
          mesh.scale.set(cardiacPulse, cardiacPulse, cardiacPulse);
        } else if (meta.meshName === 'lungs') {
          mesh.scale.set(breathScale, 1 + (breathScale - 1) * 0.6, breathScale);
        }

        const scoreObj = currentProps.overview.organSystems[meta.organKey];
        const isSelected = selectedKey === meta.organKey;
        const isDimmed = selectedKey !== null && !isSelected;

        // Clinical alert override for warning / critical organs
        if (scoreObj?.status === 'critical') {
          material.emissive.setHex(0xf43f5e);
          material.emissiveIntensity = 0.65 + Math.sin(elapsed * 5) * 0.3;
        } else if (scoreObj?.status === 'warning') {
          material.emissive.setHex(0xf59e0b);
          material.emissiveIntensity = 0.5 + Math.sin(elapsed * 3.5) * 0.2;
        } else {
          material.emissive.setHex(meta.emissiveColor);
          material.emissiveIntensity = isSelected
            ? 0.75 + Math.sin(elapsed * 4) * 0.15
            : 0.28;
        }

        const targetOpacity = isSelected
          ? 0.98
          : isDimmed
          ? 0.28
          : meta.baseOpacity;
        material.opacity += (targetOpacity - material.opacity) * 0.15;
      });

      // Update X-ray body shell shader uniforms
      bodyShellUniforms.uTime.value = elapsed;
      const targetShellOpacity =
        currentProps.xrayIntensity === 'deep-organ'
          ? 0.42
          : selectedKey !== null
          ? 0.55
          : 1.0;
      bodyShellUniforms.uShellOpacity.value +=
        (targetShellOpacity - bodyShellUniforms.uShellOpacity.value) * 0.12;

      // Volumetric laser sweep across the 1.824m NIH Visible Human bounds (-0.91m to +0.91m)
      if (currentProps.scanActive) {
        scanPlane.visible = true;
        bodyShellUniforms.uScanActive.value = 1.0;
        stateRef.current.scanY += stateRef.current.scanDir * delta * 0.52;
        if (stateRef.current.scanY > 0.91) {
          stateRef.current.scanY = 0.91;
          stateRef.current.scanDir = -1;
        } else if (stateRef.current.scanY < -0.91) {
          stateRef.current.scanY = -0.91;
          stateRef.current.scanDir = 1;
        }
        scanPlane.position.y = stateRef.current.scanY;
        bodyShellUniforms.uScanY.value = stateRef.current.scanY;
      } else {
        scanPlane.visible = false;
        bodyShellUniforms.uScanActive.value = 0.0;
      }

      renderer.render(scene, camera);
    };

    render();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 460;
      const h = container.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
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
  }, []);

  const handleResetCamera = () => {
    stateRef.current.rotX = 0.02;
    stateRef.current.rotY = -0.18;
    applyCameraPreset('full-body');
    setIsRotating(true);
  };

  const handleZoomIn = () => {
    stateRef.current.targetZoom = Math.max(0.85, stateRef.current.targetZoom - 0.35);
  };

  const handleZoomOut = () => {
    stateRef.current.targetZoom = Math.min(3.5, stateRef.current.targetZoom + 0.35);
  };

  const leftPills = QUICK_ORGAN_PILLS.filter((p) => p.side === 'left');
  const rightPills = QUICK_ORGAN_PILLS.filter((p) => p.side === 'right');

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[560px] flex items-center justify-center select-none overflow-hidden rounded-3xl ${className}`}
      style={{
        background:
          'radial-gradient(ellipse at 50% 42%, rgba(6, 182, 212, 0.16) 0%, rgba(15, 23, 42, 0.92) 55%, rgba(2, 6, 23, 0.99) 85%)',
        border: '1px solid rgba(34, 211, 238, 0.28)',
        boxShadow:
          '0 0 60px -10px rgba(6, 182, 212, 0.18), inset 0 0 80px -20px rgba(6, 182, 212, 0.12)',
      }}
    >
      {/* Top-Left Camera Framing & X-Ray Depth Switcher */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() =>
            applyCameraPreset(cameraPreset === 'full-body' ? 'torso-focus' : 'full-body')
          }
          className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-md shadow-lg ${
            cameraPreset === 'torso-focus'
              ? 'bg-cyan-100/95 dark:bg-cyan-500/25 text-cyan-950 dark:text-cyan-200 border-cyan-500/60'
              : 'bg-white/95 dark:bg-slate-900/85 text-slate-900 dark:text-slate-200 border-slate-300 dark:border-cyan-500/30 hover:border-cyan-500/60'
          }`}
          title="Switch between Full Standing Body and Close-Up Organ Torso View"
        >
          {cameraPreset === 'torso-focus' ? (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-300" />
              <span>Full Body View</span>
            </>
          ) : (
            <>
              <Focus className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-300" />
              <span>Zoom to Organs</span>
            </>
          )}
        </button>

        <button
          onClick={() =>
            setXrayIntensity((prev) => (prev === 'standard' ? 'deep-organ' : 'standard'))
          }
          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-md shadow-lg ${
            xrayIntensity === 'deep-organ'
              ? 'bg-indigo-100/95 dark:bg-indigo-500/25 text-indigo-950 dark:text-indigo-200 border-indigo-500/60'
              : 'bg-white/95 dark:bg-slate-900/80 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-white/15 hover:border-cyan-500/40'
          }`}
          title="Toggle X-Ray Skin Shell Transparency"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-300" />
          <span>{xrayIntensity === 'deep-organ' ? 'Deep Organ X-Ray' : 'X-Ray Shell'}</span>
        </button>
      </div>

      {/* Left Spatial Organ Selector Rail */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 hidden sm:flex flex-col gap-2">
        {leftPills.map((pill) => {
          const scoreObj = overview.organSystems[pill.key];
          const isSelected = selectedOrganKey === pill.key;
          return (
            <button
              key={pill.key}
              onClick={() => {
                onSelectOrgan(pill.key);
                applyCameraPreset('torso-focus');
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer backdrop-blur-md flex items-center gap-2 min-w-[124px] shadow-md ${
                isSelected
                  ? 'bg-cyan-100/95 dark:bg-cyan-500/25 border-cyan-500 dark:border-cyan-400 text-slate-950 dark:text-white shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                  : 'bg-white/95 dark:bg-slate-950/75 border-slate-300/90 dark:border-white/10 text-slate-900 dark:text-slate-300 hover:border-cyan-500/60 dark:hover:text-white'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: pill.dotColor,
                  boxShadow: `0 0 8px ${pill.dotColor}`,
                }}
              />
              <div className="min-w-0">
                <div className="text-[11px] font-bold truncate leading-tight text-slate-900 dark:text-slate-100">{pill.label}</div>
                <div className="text-[9px] font-mono text-slate-600 dark:text-slate-400">
                  {scoreObj ? `${scoreObj.score}% · ${scoreObj.status}` : '90% · optimal'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right Spatial Organ Selector Rail */}
      <div className="absolute right-14 top-1/2 -translate-y-1/2 z-20 hidden sm:flex flex-col gap-2">
        {rightPills.map((pill) => {
          const scoreObj = overview.organSystems[pill.key];
          const isSelected = selectedOrganKey === pill.key;
          return (
            <button
              key={pill.key}
              onClick={() => {
                onSelectOrgan(pill.key);
                applyCameraPreset('torso-focus');
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer backdrop-blur-md flex items-center gap-2 min-w-[116px] shadow-md ${
                isSelected
                  ? 'bg-cyan-100/95 dark:bg-cyan-500/25 border-cyan-500 dark:border-cyan-400 text-slate-950 dark:text-white shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                  : 'bg-white/95 dark:bg-slate-950/75 border-slate-300/90 dark:border-white/10 text-slate-900 dark:text-slate-300 hover:border-cyan-500/60 dark:hover:text-white'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: pill.dotColor,
                  boxShadow: `0 0 8px ${pill.dotColor}`,
                }}
              />
              <div className="min-w-0">
                <div className="text-[11px] font-bold truncate leading-tight text-slate-900 dark:text-slate-100">{pill.label}</div>
                <div className="text-[9px] font-mono text-slate-600 dark:text-slate-400">
                  {scoreObj ? `${scoreObj.score}% · ${scoreObj.status}` : '90% · optimal'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

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

      {/* Loading Indicator while NIH Visible Human GLB streams */}
      {webGLSupported && !modelLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-2" />
          <span className="text-xs font-mono text-cyan-300">
            Loading NIH Visible Human 3D Anatomy...
          </span>
        </div>
      )}

      {/* 3D Spatial Interactive Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleResetCamera}
          className="p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-cyan-800 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/30 hover:border-cyan-500 backdrop-blur-md shadow-lg transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          title="Reset Anatomical Orientation"
          aria-label="Reset View"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-cyan-800 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/30 hover:border-cyan-500 backdrop-blur-md shadow-lg transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 rounded-xl bg-white/95 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-cyan-800 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/30 hover:border-cyan-500 backdrop-blur-md shadow-lg transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsRotating((r) => !r)}
          className={`p-2.5 rounded-xl border backdrop-blur-md shadow-lg transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
            isRotating
              ? 'bg-cyan-100/95 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-500/50'
              : 'bg-white/95 dark:bg-slate-900/80 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-950 dark:hover:text-white'
          }`}
          title={isRotating ? 'Pause 3D Orbit' : 'Resume 3D Orbit'}
          aria-label="Toggle Auto-Orbit"
        >
          <Rotate3d className="w-4 h-4" />
        </button>
      </div>

      {/* Orbit Helper & NIH Attribution Badge */}
      <div className="absolute bottom-3 inset-x-4 z-20 pointer-events-none flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-950/85 border border-slate-300 dark:border-cyan-500/30 text-[10px] font-mono text-cyan-900 dark:text-cyan-300 backdrop-blur-md shadow-sm">
          <Sparkles className="w-3 h-3 text-cyan-700 dark:text-cyan-400 animate-pulse shrink-0" />
          <span className="truncate">
            Drag to rotate 360° · Scroll to zoom · Click organ to inspect
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-slate-950/75 border border-slate-300 dark:border-white/10 text-[9px] font-mono text-slate-700 dark:text-slate-400 backdrop-blur-md shadow-sm">
          <span>NIH Visible Human 3D Atlas</span>
        </div>
      </div>

      {/* Floating 3D Hover Tooltip */}
      {tooltipPos && hoveredOrgan && (
        <div
          className="absolute z-30 pointer-events-none transition-transform duration-75 px-3 py-2 rounded-xl bg-slate-950/90 border border-cyan-400/50 text-white shadow-2xl backdrop-blur-md text-xs font-mono"
          style={{
            left: `${Math.min(tooltipPos.x + 14, 280)}px`,
            top: `${Math.max(tooltipPos.y - 38, 12)}px`,
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
            Clinical Score: <span className="font-bold text-white">{tooltipPos.score} / 100</span>
          </div>
        </div>
      )}
    </div>
  );
};
