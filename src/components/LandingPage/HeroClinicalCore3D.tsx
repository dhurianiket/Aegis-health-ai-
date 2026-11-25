import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, useReducedMotion } from 'motion/react';
import { Activity, FileJson, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react';

export type ClinicalLensId = 'metabolic' | 'cardiac' | 'armor' | 'fhir';

export interface ClinicalLensMeta {
  id: ClinicalLensId;
  shortLabel: string;
  title: string;
  subtitle: string;
  metricLabel: string;
  metricValue: string;
  statusLabel: string;
  accentHex: string;
  secondaryHex: string;
  badgeText: string;
  summaryLine: string;
}

export const CLINICAL_LENSES: ClinicalLensMeta[] = [
  {
    id: 'metabolic',
    shortLabel: 'Metabolic',
    title: 'HbA1c Longitudinal Lens',
    subtitle: 'Gemini 4 Hydrogen + Argon Schema OCR',
    metricLabel: '16-Week HbA1c Velocity',
    metricValue: '5.8%',
    statusLabel: '-0.6% in 16w',
    accentHex: '#2DD4BF',
    secondaryHex: '#38BDF8',
    badgeText: 'ICMR & ADA 2025 Grounded',
    summaryLine: '6.4% (Jun) -> 6.1% (Aug) -> 5.8% (Oct) across Metropolis & Thyrocare.',
  },
  {
    id: 'cardiac',
    shortLabel: 'Cardiac',
    title: 'Biometric & hs-CRP Lens',
    subtitle: 'Web Bluetooth HR / HRV / SpO2 Fusion',
    metricLabel: 'hs-CRP Inflammation',
    metricValue: '1.9 mg/L',
    statusLabel: 'Readiness 88/100',
    accentHex: '#FB7185',
    secondaryHex: '#F59E0B',
    badgeText: 'Wearable + Lab Correlation',
    summaryLine: 'Resting HR 64 bpm, SpO2 98%, HRV 62 ms synced with cardiac markers.',
  },
  {
    id: 'armor',
    shortLabel: 'Model Armor',
    title: 'Model Armor Guard',
    subtitle: 'Mumbai (asia-south1) Prompt Firewall',
    metricLabel: 'Screening Region',
    metricValue: 'asia-south1',
    statusLabel: 'Prompt Firewall Active',
    accentHex: '#34D399',
    secondaryHex: '#14B8A6',
    badgeText: 'DPDP Act 2023 · Data Residency',
    summaryLine: 'Inspects clinical prompts for injection & jailbreaks prior to Vertex inference.',
  },
  {
    id: 'fhir',
    shortLabel: 'FHIR R4',
    title: 'Cloud FHIR R4 Vault',
    subtitle: 'ABDM M1-M3 & Cloud Healthcare API',
    metricLabel: 'Export Standard',
    metricValue: 'HL7 R4',
    statusLabel: 'ABDM & Mumbai Sync',
    accentHex: '#818CF8',
    secondaryHex: '#38BDF8',
    badgeText: 'AES-GCM-256 Clinical Bundles',
    summaryLine: 'Tenant-isolated Patient, Observation & DiagnosticReport bundles in asia-south1.',
  },
];

export interface HeroClinicalCore3DProps {
  className?: string;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const HeroClinicalCore3D: React.FC<HeroClinicalCore3DProps> = ({ className = '' }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const [activeLensId, setActiveLensId] = useState<ClinicalLensId>('metabolic');
  const activeLensRef = useRef<ClinicalLensMeta>(CLINICAL_LENSES[0]);
  const prefersReducedMotion = useReducedMotion();
  const [fallbackMode, setFallbackMode] = useState(false);

  const activeLens = CLINICAL_LENSES.find((item) => item.id === activeLensId) ?? CLINICAL_LENSES[0];

  useEffect(() => {
    activeLensRef.current = activeLens;
  }, [activeLens]);

  useEffect(() => {
    const host = canvasHostRef.current;
    const stage = stageRef.current;
    if (!host || !stage) return;

    if (
      prefersReducedMotion ||
      typeof window === 'undefined' ||
      typeof WebGLRenderingContext === 'undefined'
    ) {
      setFallbackMode(true);
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    let rafId = 0;
    let isDisposed = false;
    let isInViewport = true;
    let isPageVisible = !document.hidden;

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    try {
      const initialWidth = Math.max(host.clientWidth, 320);
      const initialHeight = Math.max(host.clientHeight, 320);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(initialWidth, initialHeight);
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      host.innerHTML = '';
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, initialWidth / initialHeight, 0.1, 100);
      camera.position.set(0, 0.1, 6.2);

      // Lighting calibrated for obsidian glass & clinical teal specular contrast
      const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.85);
      scene.add(ambientLight);

      const keyLight = new THREE.PointLight(0x2dd4bf, 3.2, 22);
      keyLight.position.set(3.2, 2.8, 4.2);
      scene.add(keyLight);

      const rimLight = new THREE.PointLight(0x38bdf8, 2.4, 22);
      rimLight.position.set(-3.4, -2.2, 3.0);
      scene.add(rimLight);

      const rootGroup = new THREE.Group();
      scene.add(rootGroup);

      // 1. Inner luminous icosahedron core
      const coreGeo = new THREE.IcosahedronGeometry(1.06, 2);
      geometries.push(coreGeo);
      const coreMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0f2942'),
        emissive: new THREE.Color(activeLensRef.current.accentHex),
        emissiveIntensity: 0.42,
        roughness: 0.25,
        metalness: 0.55,
        transparent: true,
        opacity: 0.92,
      });
      materials.push(coreMat);
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      rootGroup.add(coreMesh);

      // 2. Crisp geodesic clinical wireframe cage
      const wireGeo = new THREE.IcosahedronGeometry(1.36, 1);
      geometries.push(wireGeo);
      const wireMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(activeLensRef.current.secondaryHex),
        wireframe: true,
        transparent: true,
        opacity: 0.28,
      });
      materials.push(wireMat);
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      rootGroup.add(wireMesh);

      // 3. Three precision gyroscopic orbital rings + node markers
      const ringSpecs = [
        { radius: 1.76, tube: 0.017, tiltX: 1.05, tiltY: 0.35, speed: 0.0055, useAccent: true },
        { radius: 2.06, tube: 0.014, tiltX: -0.78, tiltY: 0.62, speed: -0.004, useAccent: false },
        { radius: 2.34, tube: 0.012, tiltX: 0.42, tiltY: -0.92, speed: 0.003, useAccent: true },
      ];

      const ringPivotGroups: Array<{ group: THREE.Group; speed: number; mat: THREE.MeshBasicMaterial }> = [];
      const nodeGeo = new THREE.SphereGeometry(0.068, 14, 14);
      geometries.push(nodeGeo);

      ringSpecs.forEach((spec, idx) => {
        const pivot = new THREE.Group();
        pivot.rotation.set(spec.tiltX, spec.tiltY, idx * 0.5);

        const torusGeo = new THREE.TorusGeometry(spec.radius, spec.tube, 12, 96);
        geometries.push(torusGeo);
        const torusMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(spec.useAccent ? activeLensRef.current.accentHex : activeLensRef.current.secondaryHex),
          transparent: true,
          opacity: idx === 0 ? 0.65 : 0.4,
        });
        materials.push(torusMat);
        const torusMesh = new THREE.Mesh(torusGeo, torusMat);
        pivot.add(torusMesh);

        const nodeMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(spec.useAccent ? activeLensRef.current.accentHex : activeLensRef.current.secondaryHex),
        });
        materials.push(nodeMat);
        const nodeA = new THREE.Mesh(nodeGeo, nodeMat);
        nodeA.position.set(spec.radius, 0, 0);
        pivot.add(nodeA);

        const nodeB = new THREE.Mesh(nodeGeo, nodeMat);
        nodeB.position.set(-spec.radius, 0, 0);
        pivot.add(nodeB);

        rootGroup.add(pivot);
        ringPivotGroups.push({ group: pivot, speed: spec.speed, mat: torusMat });
      });

      // 4. Lightweight 140-point orbital biomarker helix / shell
      const pointCount = 140;
      const positions = new Float32Array(pointCount * 3);
      for (let i = 0; i < pointCount; i++) {
        const t = (i / pointCount) * Math.PI * 2;
        const layerRadius = 1.65 + (i % 5) * 0.19;
        const spreadY = ((i / pointCount) - 0.5) * 2.4;
        positions[i * 3] = Math.cos(t * 3) * layerRadius * 0.9;
        positions[i * 3 + 1] = spreadY;
        positions[i * 3 + 2] = Math.sin(t * 3) * layerRadius * 0.9;
      }
      const pointsGeo = new THREE.BufferGeometry();
      pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometries.push(pointsGeo);

      const pointsMat = new THREE.PointsMaterial({
        color: new THREE.Color(activeLensRef.current.accentHex),
        size: 0.048,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
      });
      materials.push(pointsMat);
      const pointCloud = new THREE.Points(pointsGeo, pointsMat);
      rootGroup.add(pointCloud);

      let targetPointerX = 0;
      let targetPointerY = 0;
      const targetAccent = new THREE.Color(activeLensRef.current.accentHex);
      const targetSecondary = new THREE.Color(activeLensRef.current.secondaryHex);

      const handlePointerMove = (e: PointerEvent) => {
        const rect = stage.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        targetPointerY = nx * 0.45;
        targetPointerX = -ny * 0.35;
      };

      const handlePointerLeave = () => {
        targetPointerX = 0;
        targetPointerY = 0;
      };

      stage.addEventListener('pointermove', handlePointerMove, { passive: true });
      stage.addEventListener('pointerleave', handlePointerLeave, { passive: true });

      const handleResize = () => {
        if (!renderer || !host || isDisposed) return;
        const w = Math.max(host.clientWidth, 280);
        const h = Math.max(host.clientHeight, 280);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(host);
      }

      let intersectionObserver: IntersectionObserver | null = null;
      if (typeof IntersectionObserver !== 'undefined') {
        intersectionObserver = new IntersectionObserver(
          (entries) => {
            isInViewport = entries.some((entry) => entry.isIntersecting);
          },
          { threshold: 0.05 },
        );
        intersectionObserver.observe(stage);
      }

      const handleVisibilityChange = () => {
        isPageVisible = !document.hidden;
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      let lastTime = performance.now();
      const animate = (now: number) => {
        if (isDisposed) return;
        rafId = requestAnimationFrame(animate);

        if (!isInViewport || !isPageVisible) {
          lastTime = now;
          return;
        }

        const dt = Math.min((now - lastTime) / 16.667, 2.5);
        lastTime = now;

        const lens = activeLensRef.current;
        targetAccent.set(lens.accentHex);
        targetSecondary.set(lens.secondaryHex);

        coreMat.emissive.lerp(targetAccent, 0.08 * dt);
        keyLight.color.lerp(targetAccent, 0.08 * dt);
        rimLight.color.lerp(targetSecondary, 0.08 * dt);
        wireMat.color.lerp(targetSecondary, 0.08 * dt);
        pointsMat.color.lerp(targetAccent, 0.08 * dt);

        ringPivotGroups.forEach((ring, idx) => {
          ring.mat.color.lerp(idx % 2 === 0 ? targetAccent : targetSecondary, 0.08 * dt);
          ring.group.rotation.z += ring.speed * dt;
        });

        coreMesh.rotation.y += 0.004 * dt;
        coreMesh.rotation.x += 0.0018 * dt;
        wireMesh.rotation.y -= 0.0025 * dt;
        pointCloud.rotation.y += 0.0016 * dt;

        // Smooth lens orientation offset combined with damped pointer tilt
        const lensOffsetIndex = CLINICAL_LENSES.findIndex((item) => item.id === lens.id);
        const baseYaw = lensOffsetIndex * 0.32;
        rootGroup.rotation.x += (targetPointerX - rootGroup.rotation.x) * 0.06 * dt;
        rootGroup.rotation.y += (baseYaw + targetPointerY - rootGroup.rotation.y) * 0.06 * dt;

        renderer?.render(scene, camera);
      };

      rafId = requestAnimationFrame(animate);

      return () => {
        isDisposed = true;
        cancelAnimationFrame(rafId);
        stage.removeEventListener('pointermove', handlePointerMove);
        stage.removeEventListener('pointerleave', handlePointerLeave);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();
        geometries.forEach((g) => g.dispose());
        materials.forEach((m) => m.dispose());
        renderer?.dispose();
        if (renderer?.domElement && renderer.domElement.parentNode === host) {
          host.removeChild(renderer.domElement);
        }
      };
    } catch {
      setFallbackMode(true);
      renderer?.dispose();
    }
  }, [prefersReducedMotion]);

  return (
    <div
      ref={stageRef}
      className={`landing-3d-stage relative w-full max-w-[540px] mx-auto select-none ${className}`}
    >
      {/* Interactive 3D Viewport Surface */}
      <div className="aegis-hairline-surface rounded-[32px] p-4 sm:p-5 relative overflow-hidden">
        {/* Radial clinical accent glow matched cleanly to active lens */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-30 transition-colors duration-300"
          style={{ backgroundColor: activeLens.accentHex }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full blur-3xl opacity-20 transition-colors duration-300"
          style={{ backgroundColor: activeLens.secondaryHex }}
        />

        {/* Top Telemetry Status Header */}
        <div className="relative z-10 flex items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: activeLens.accentHex }}
            />
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-slate-200 truncate">
              {activeLens.badgeText}
            </span>
          </div>
          <span className="text-[11px] font-mono text-teal-300/90 bg-teal-500/10 border border-teal-400/25 px-2.5 py-0.5 rounded-full shrink-0">
            3D Telemetry Core
          </span>
        </div>

        {/* 3D Canvas Stage (WebGL primary + Isometric SVG Fallback) */}
        <div className="relative h-[280px] sm:h-[320px] w-full flex items-center justify-center my-1">
          <div
            ref={canvasHostRef}
            aria-hidden="true"
            className={`absolute inset-0 ${fallbackMode ? 'hidden' : 'block'}`}
          />

          {fallbackMode && (
            <div className="landing-3d-preserve relative w-56 h-56 flex items-center justify-center">
              <div
                className={`absolute inset-2 rounded-full border-2 ${
                  prefersReducedMotion ? '' : 'animate-aegis-orbit-slow'
                }`}
                style={{ borderColor: `${activeLens.accentHex}88` }}
              />
              <div
                className={`absolute -inset-2 rounded-full border border-dashed ${
                  prefersReducedMotion ? '' : 'animate-aegis-orbit-reverse'
                }`}
                style={{ borderColor: `${activeLens.secondaryHex}66` }}
              />
              <div
                className="w-28 h-28 rounded-3xl rotate-45 border border-white/20 flex items-center justify-center shadow-2xl"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${activeLens.accentHex}44, #071325 75%)`,
                }}
              >
                <ShieldCheck className="-rotate-45 w-11 h-11 text-teal-300" strokeWidth={1.75} />
              </div>
            </div>
          )}

          {/* Subtle corner HUD markers */}
          <div className="pointer-events-none absolute top-3 left-2 px-2.5 py-1 rounded-lg bg-[#040B16]/75 border border-white/10 text-[10px] font-mono text-slate-300 backdrop-blur-md">
            LOINC · SNOMED CT
          </div>
          <div className="pointer-events-none absolute top-3 right-2 px-2.5 py-1 rounded-lg bg-[#040B16]/75 border border-white/10 text-[10px] font-mono text-slate-300 backdrop-blur-md flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-teal-300" />
            <span>{activeLens.subtitle.split(' ')[0]}</span>
          </div>
        </div>

        {/* Active Lens Clinical Readout Panel */}
        <motion.div
          key={activeLens.id}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, transform: 'translateY(6px) scale(0.98)' }}
          animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
          transition={{ duration: 0.22, ease: EASE_OUT }}
          className="relative z-10 rounded-2xl bg-[#040B16]/85 border border-white/10 p-4 mb-3.5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-400">
                {activeLens.metricLabel}
              </p>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                {activeLens.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {activeLens.summaryLine}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div
                className="text-xl sm:text-2xl font-black font-mono tabular-nums tracking-tight"
                style={{ color: activeLens.accentHex }}
              >
                {activeLens.metricValue}
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full mt-1">
                {activeLens.id === 'metabolic' ? (
                  <TrendingDown className="w-3 h-3" />
                ) : activeLens.id === 'fhir' ? (
                  <FileJson className="w-3 h-3" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>{activeLens.statusLabel}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Interactive 4-Lens Switcher */}
        <div
          role="group"
          aria-label="Inspect 3D clinical telemetry lenses"
          className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2"
        >
          {CLINICAL_LENSES.map((lens) => {
            const isSelected = lens.id === activeLens.id;
            return (
              <button
                key={lens.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setActiveLensId(lens.id)}
                className={`min-h-[40px] px-2.5 py-2 rounded-xl text-xs font-bold tracking-wide border transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.97] cursor-pointer ${
                  isSelected
                    ? 'bg-teal-500/18 border-teal-400/50 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
                    : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {lens.shortLabel}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HeroClinicalCore3D;
