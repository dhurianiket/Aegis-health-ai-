import React, { useState, useMemo } from 'react';
import {
  FileText,
  Stethoscope,
  Activity,
  Download,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { exportToFhirBundle, downloadFhirJson } from '../../services/fhirService';
import {
  getSourceForMarker,
  getUrgencyAndNextStep,
  lookupRelevantGuidelines,
} from '../../services/sourceGroundedService';
import { parseSafeTimestamp } from '../../utils/dateUtils';

export interface LabObservationItem {
  marker?: string;
  testName?: string;
  value?: number | string;
  valueCanonical?: number | string;
  valueOriginal?: number | string;
  unit?: string;
  unitCanonical?: string;
  referenceLow?: number | null;
  referenceHigh?: number | null;
  reference_range?: string;
  flag?: string;
  status?: string;
  interpretation?: string;
}

export interface LabReport {
  id: string;
  type?: string;
  fileName?: string;
  hospitalName?: string;
  doctorName?: string;
  date?: string;
  uploadedAt: string;
  fileUrl?: string;
  extractedData?: {
    observations?: any[];
    lab_values?: any[];
    summary?: string;
  };
  aiSummary?: string;
  status?: 'complete' | 'processing' | 'error';
  profileId?: string;
}

export interface VisualLabReportCardProps {
  report: LabReport;
  historicalReports?: LabReport[];
  showCheckbox?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
  onViewSbar?: (report: LabReport) => void;
  className?: string;
}

/**
 * Plain-English non-jargon explanations for patient empowerment
 */
export const PLAIN_ENGLISH_EXPLANATIONS: Record<string, string> = {
  hba1c: 'Measures your average 3-month blood sugar control to track diabetic health.',
  glucose: 'Current circulating blood sugar fuel available for immediate cellular energy.',
  ldl: "Known as 'bad' cholesterol; tracks the risk of vascular plaque buildup in arteries.",
  hdl: "Known as 'good' cholesterol; helps remove excess cholesterol from your bloodstream.",
  cholesterol: 'Total blood lipids assessing overall cardiovascular health and heart risk.',
  triglycerides: 'Blood fats stored from surplus dietary calories; indicates metabolic efficiency.',
  creatinine: 'Natural muscle waste product filtered by kidneys; key measure of renal clearance.',
  egfr: 'Estimated Glomerular Filtration Rate; shows the percentage of kidney filtering capacity.',
  hemoglobin: 'Iron-rich protein in red blood cells that transports oxygen to all organs.',
  platelets: 'Essential blood cell fragments that enable healthy blood clotting and repair.',
  tsh: 'Thyroid Stimulating Hormone regulating body metabolism, weight, and energy levels.',
  alt: 'Liver enzyme (SGPT) released into blood when liver cells experience stress.',
  ast: 'Enzyme (SGOT) found in liver and heart reflecting cellular vitality and recovery.',
  uric_acid: 'Byproduct of protein digestion; excess levels can form crystals in joints.',
  vitamin_d: 'Crucial for bone strength, immune defenses, and neuromuscular health.',
  vitamin_b12: 'Vital for red blood cell formation, nerve function, and cellular DNA synthesis.',
  crp: 'High-sensitivity marker indicating systemic inflammatory responses in the body.',
};

export function getPlainEnglishSummary(markerName: string = ''): string {
  const name = markerName.toLowerCase().trim();
  for (const [key, text] of Object.entries(PLAIN_ENGLISH_EXPLANATIONS)) {
    if (name.includes(key) || (key === 'alt' && name.includes('sgpt')) || (key === 'ast' && name.includes('sgot'))) {
      return text;
    }
  }
  return 'Standard clinical physiological biomarker used to assess homeostasis and organ health.';
}

/**
 * 4-Zone Continuous Range Bar Component
 */
export const FourZoneRangeBar: React.FC<{
  value: number;
  refLow?: number | null;
  refHigh?: number | null;
  unit?: string;
  status?: string;
}> = ({ value, refLow, refHigh, unit = '', status = 'normal' }) => {
  const hasRef = refLow != null && refHigh != null && refHigh > refLow;

  const low = hasRef ? refLow! : 0;
  const high = hasRef ? refHigh! : 100;
  const span = high - low || 1;

  // 4 zones: Low (< low), Normal (low - high), High (high - 1.3*high), Panic (> 1.3*high)
  const rangeMin = Math.max(0, low - span * 0.4);
  const rangeMax = high + span * 0.6;
  const totalRange = rangeMax - rangeMin || 1;

  const lowPct = ((low - rangeMin) / totalRange) * 100;
  const normalPct = ((high - low) / totalRange) * 100;
  const highPct = ((high * 1.3 - high) / totalRange) * 100;

  // Calculate pointer position
  let pointerPct = ((value - rangeMin) / totalRange) * 100;
  if (!hasRef) {
    const s = status.toLowerCase();
    if (s.includes('critical') || s.includes('panic')) pointerPct = 92;
    else if (s.includes('high') || s.includes('abnormal')) pointerPct = 76;
    else if (s.includes('low')) pointerPct = 18;
    else pointerPct = 50;
  }
  const clampedPct = Math.min(98, Math.max(2, pointerPct));

  // Determine current zone color
  let currentZoneColor = '#10B981'; // normal
  let zoneLabel = 'Normal Zone';
  if (value < low) {
    currentZoneColor = '#38BDF8';
    zoneLabel = 'Low Zone';
  } else if (value > high * 1.3 || status.toLowerCase().includes('critical')) {
    currentZoneColor = '#F43F5E';
    zoneLabel = 'Panic / Critical Zone';
  } else if (value > high) {
    currentZoneColor = '#F59E0B';
    zoneLabel = 'High Zone';
  }

  return (
    <div className="space-y-2 w-full pt-1" data-testid="four-zone-range-bar">
      {/* 4-Zone Continuous Segmented Gradient Bar */}
      <div className="relative w-full h-3 rounded-full bg-slate-900 overflow-hidden flex shadow-inner border border-white/10">
        {/* Zone 1: Low (Cyan/Blue) */}
        <div
          style={{ width: `${Math.max(5, lowPct)}%` }}
          className="bg-sky-400/80 h-full relative group transition-all"
          title="Low Zone (< Reference Low)"
        />
        {/* Zone 2: Normal (Emerald Green) */}
        <div
          style={{ width: `${Math.max(10, normalPct)}%` }}
          className="bg-emerald-400 h-full relative group transition-all shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          title="Optimal Normal Zone"
        />
        {/* Zone 3: High (Amber Gold) */}
        <div
          style={{ width: `${Math.max(5, highPct)}%` }}
          className="bg-amber-400/90 h-full relative group transition-all"
          title="Elevated High Zone"
        />
        {/* Zone 4: Panic/Critical (Rose Red) */}
        <div
          className="flex-1 bg-rose-500 h-full relative group transition-all shadow-[0_0_8px_rgba(244,63,94,0.4)]"
          title="Critical / Panic Alert Zone"
        />
      </div>

      {/* Dynamic Animated Value Pointer Marker */}
      <div className="relative w-full h-4">
        <div
          className="absolute -top-3 -translate-x-1/2 flex flex-col items-center transition-all duration-500 pointer-events-none"
          style={{ left: `${clampedPct}%` }}
        >
          <div
            className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg"
            style={{ backgroundColor: currentZoneColor, boxShadow: `0 0 10px ${currentZoneColor}` }}
          />
          <div
            className="w-0.5 h-2 bg-white"
          />
        </div>
      </div>

      {/* Reference Boundaries & Zone Indicator */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-0.5">
        <span className="text-sky-300">
          Low: {hasRef ? `${low} ${unit}` : '< Ref'}
        </span>
        <span
          className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full border"
          style={{
            color: currentZoneColor,
            borderColor: `${currentZoneColor}50`,
            backgroundColor: `${currentZoneColor}15`,
          }}
        >
          {zoneLabel}
        </span>
        <span className="text-amber-300">
          High: {hasRef ? `${high} ${unit}` : '> Ref'}
        </span>
      </div>
    </div>
  );
};

/**
 * Historical Comparison Sparkline
 */
export const BiomarkerSparkline: React.FC<{
  currentValue: number;
  historyValues: { date: string; value: number }[];
  unit?: string;
}> = ({ currentValue, historyValues = [], unit = '' }) => {
  const points = useMemo(() => {
    const vals = [...historyValues];
    if (vals.length === 0 || vals[vals.length - 1]?.value !== currentValue) {
      vals.push({ date: 'Current', value: currentValue });
    }
    return vals;
  }, [currentValue, historyValues]);

  if (points.length < 2) {
    return (
      <div className="text-[11px] text-slate-400 italic flex items-center gap-1">
        <Minus className="w-3 h-3 text-slate-500" />
        <span>Baseline test recorded</span>
      </div>
    );
  }

  const rawVals = points.map((p) => p.value);
  const minVal = Math.min(...rawVals);
  const maxVal = Math.max(...rawVals);
  const range = maxVal - minVal || 1;

  const width = 110;
  const height = 30;
  const padding = 4;

  const svgPoints = points
    .map((p, idx) => {
      const x = padding + (idx / (points.length - 1)) * (width - padding * 2);
      const y = height - padding - ((p.value - minVal) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const prevVal = points[points.length - 2].value;
  const delta = currentValue - prevVal;
  const deltaPct = prevVal !== 0 ? ((delta / prevVal) * 100).toFixed(1) : '0';

  return (
    <div className="flex items-center gap-3" data-testid="biomarker-sparkline">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke="#2DD4BF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={svgPoints}
        />
        {points.map((p, idx) => {
          const x = padding + (idx / (points.length - 1)) * (width - padding * 2);
          const y = height - padding - ((p.value - minVal) / range) * (height - padding * 2);
          const isLatest = idx === points.length - 1;
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r={isLatest ? 3.5 : 2}
              fill={isLatest ? '#22D3EE' : '#2DD4BF'}
              stroke="#0F172A"
              strokeWidth={1}
            />
          );
        })}
      </svg>
      <div className="text-[11px] font-mono font-bold flex items-center gap-0.5">
        {delta > 0 ? (
          <span className="text-amber-400 flex items-center">
            <TrendingUp className="w-3 h-3 mr-0.5" />+{delta.toFixed(1)} ({deltaPct}%)
          </span>
        ) : delta < 0 ? (
          <span className="text-emerald-400 flex items-center">
            <TrendingDown className="w-3 h-3 mr-0.5" />{delta.toFixed(1)} ({deltaPct}%)
          </span>
        ) : (
          <span className="text-slate-400 flex items-center">
            <Minus className="w-3 h-3 mr-0.5" />0.0 (0%)
          </span>
        )}
      </div>
    </div>
  );
};

export const VisualLabReportCard: React.FC<VisualLabReportCardProps> = ({
  report,
  historicalReports = [],
  showCheckbox = false,
  isSelected = false,
  onToggleSelection,
  onViewSbar,
  className = '',
}) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [showSbarModal, setShowSbarModal] = useState<boolean>(false);

  const labName =
    report.hospitalName && report.hospitalName !== 'Unknown'
      ? report.hospitalName
      : report.fileName || 'Comprehensive Diagnostic Panel';
  const docType = report.type || 'Diagnostic Report';
  const doctor = report.doctorName && report.doctorName !== 'Unknown' ? report.doctorName : null;

  let dateText = 'Unknown Date';
  if (report.date) {
    try {
      dateText = format(new Date(report.date), 'dd MMM yyyy');
    } catch {
      dateText = report.date;
    }
  }

  const observations = useMemo(() => {
    return report.extractedData?.observations || report.extractedData?.lab_values || [];
  }, [report]);

  const observationCount = observations.length;

  const downloadSummary = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(report.extractedData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `aegis_extraction_${report.fileName || 'report'}.json`);
    dlAnchorElem.click();
  };

  const handleExportFhir = () => {
    const patient = { id: report.profileId || 'patient-user', name: 'Patient' };
    const bundle = exportToFhirBundle(patient, [report]);
    downloadFhirJson(bundle, `fhir_r4_${report.fileName || report.id || 'report'}.json`);
  };

  // Build history lookup for sparklines from previous reports
  const getHistoricalValuesForMarker = (markerName: string): { date: string; value: number }[] => {
    const history: { date: string; value: number }[] = [];
    const target = markerName.toLowerCase().trim();

    historicalReports.forEach((hr) => {
      if (hr.id === report.id) return;
      const obs = hr.extractedData?.observations || hr.extractedData?.lab_values || [];
      obs.forEach((o: any) => {
        const oName = (o.marker || o.testName || '').toLowerCase().trim();
        if (oName === target || oName.includes(target) || target.includes(oName)) {
          const num = parseFloat(String(o.valueCanonical ?? o.valueOriginal ?? o.value).replace(/[^0-9.-]/g, ''));
          if (!isNaN(num)) {
            history.push({
              date: hr.date || hr.uploadedAt,
              value: num,
            });
          }
        }
      });
    });

    // ⚡ Bolt: Performance optimization
    // Use Schwartzian transform to avoid O(N log N) parseSafeTimestamp calls
    const mappedHistory = history.map(item => ({
      item,
      time: parseSafeTimestamp(item.date)?.getTime() || 0
    }));
    mappedHistory.sort((a, b) => a.time - b.time);
    return mappedHistory.map(m => m.item);
  };

  return (
    <div
      className={`w-full glass-card-ultra-3d p-5 sm:p-7 space-y-6 relative overflow-hidden transition-all duration-200 ${
        isSelected ? 'ring-2 ring-cyan-400 border-cyan-400/80 shadow-2xl' : 'border-white/15'
      } ${className}`}
      data-testid="visual-lab-report-card"
    >
      {/* Card Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5">
        <div className="flex items-start gap-4">
          {showCheckbox && (
            <div className="pt-2">
              <input
                type="checkbox"
                checked={!!isSelected}
                onChange={() => onToggleSelection && onToggleSelection(report.id)}
                className="w-5 h-5 cursor-pointer accent-cyan-400 rounded-md"
                aria-label={`Select report ${report.fileName || report.id}`}
              />
            </div>
          )}
          <div className="p-3.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 glow-cyan-3d shrink-0">
            {docType.toLowerCase().includes('consult') ? (
              <Stethoscope className="w-6 h-6" />
            ) : (
              <FileText className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {docType}
              </span>
              <span className="text-xs text-slate-300 font-mono">{dateText}</span>
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-white tracking-wide">{labName}</h3>
            {doctor && (
              <p className="text-xs font-semibold text-slate-300 mt-0.5">
                Ordering Physician:{' '}
                <span className="text-cyan-300">
                  {doctor.toLowerCase().startsWith('dr.') || doctor.toLowerCase().startsWith('dr ')
                    ? doctor
                    : `Dr. ${doctor}`}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
          <button
            onClick={handleExportFhir}
            title="Export as HL7 FHIR R4 JSON Bundle"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/40 transition-all min-h-[44px] cursor-pointer"
          >
            <Activity size={14} className="text-indigo-400" />
            <span>FHIR R4</span>
          </button>

          <button
            onClick={() => {
              if (onViewSbar) onViewSbar(report);
              else setShowSbarModal(true);
            }}
            title="View Structured SBAR Clinical Summary"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold rounded-xl border border-teal-500/40 transition-all min-h-[44px] cursor-pointer"
          >
            <FileCheck size={14} className="text-teal-400" />
            <span>SBAR View</span>
          </button>

          {report.fileUrl ? (
            <a
              href={report.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all min-h-[44px]"
            >
              <Download size={14} /> PDF
            </a>
          ) : (
            <button
              onClick={downloadSummary}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all min-h-[44px] cursor-pointer"
            >
              <Download size={14} /> JSON
            </button>
          )}

          {observationCount > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-xl transition-all border border-cyan-500/30 min-h-[44px] cursor-pointer"
              aria-label={expanded ? 'Hide Visual Range Cards' : 'View Visual Range Cards'}
            >
              <span>{expanded ? 'Hide Range Cards' : `View ${observationCount} Cards`}</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Visual Diagnostic Biomarker Summary Cards Grid */}
      <AnimatePresence>
        {expanded && observationCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-4 overflow-hidden pt-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {observations.map((m: any, idx: number) => {
                const markerName = m.testName || m.marker || `Biomarker ${idx + 1}`;
                const valRaw = m.valueCanonical ?? m.valueOriginal ?? m.value ?? 0;
                const numVal = parseFloat(String(valRaw).replace(/[^0-9.-]/g, '')) || 0;
                const unit = m.unitCanonical || m.unit || '';
                const flag = m.flag || m.status || 'NORMAL';

                const source = getSourceForMarker(markerName);
                const urgency = getUrgencyAndNextStep(markerName, flag, String(numVal));
                const plainExplanation = getPlainEnglishSummary(markerName);
                const history = getHistoricalValuesForMarker(markerName);

                const refLow = m.referenceLow !== undefined && m.referenceLow !== null ? Number(m.referenceLow) : null;
                const refHigh = m.referenceHigh !== undefined && m.referenceHigh !== null ? Number(m.referenceHigh) : null;

                return (
                  <div
                    key={idx}
                    className="bg-slate-950/85 border border-white/10 hover:border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-lg transition-all duration-200 flex flex-col justify-between"
                  >
                    {/* Header: Marker Name & Urgency Badge */}
                    <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-3">
                      <div>
                        <h4 className="font-bold text-white text-base tracking-wide flex items-center gap-2">
                          <span>{markerName}</span>
                        </h4>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-2xl font-black font-mono text-cyan-300">
                            {numVal}
                          </span>
                          <span className="text-xs font-mono text-slate-300">{unit}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${urgency.badgeClass}`}>
                          {flag}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {urgency.level} Urgency
                        </span>
                      </div>
                    </div>

                    {/* 4-Zone Continuous Range Bar */}
                    <FourZoneRangeBar
                      value={numVal}
                      refLow={refLow}
                      refHigh={refHigh}
                      unit={unit}
                      status={flag}
                    />

                    {/* Plain-English Patient-Friendly Explanation */}
                    <div className="bg-slate-900/90 border border-white/5 rounded-xl p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                        <Info className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Plain Language Clinical Context</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-light">
                        {plainExplanation}
                      </p>
                    </div>

                    {/* Comparison Sparkline with Historical Values */}
                    <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                      <div className="text-[11px] text-slate-300 font-bold">Historical Trend:</div>
                      <BiomarkerSparkline
                        currentValue={numVal}
                        historyValues={history}
                        unit={unit}
                      />
                    </div>

                    {/* Source Grounding & Next Step Recommendations */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                      <div>
                        {source ? (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span>{source.name}</span>
                          </a>
                        ) : (
                          <span className="italic">Clinical consensus guideline</span>
                        )}
                      </div>
                      <div className="text-slate-300 font-light truncate max-w-[220px]">
                        {urgency.nextStep}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Summary Banner */}
            {(report.aiSummary || report.extractedData?.summary) && (
              <div className="mt-4 p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs sm:text-sm leading-relaxed text-slate-200">
                <strong className="text-cyan-300 font-bold">Diagnostic Synthesis:</strong>{' '}
                {report.aiSummary || report.extractedData?.summary}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Embedded SBAR Summary Modal */}
      <AnimatePresence>
        {showSbarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-teal-400" />
                  <span>SBAR Structured Diagnostic Handover</span>
                </h3>
                <button
                  onClick={() => setShowSbarModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold min-h-[44px] cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-light">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-white/5">
                  <strong className="text-teal-300 font-bold block mb-1">S — Situation:</strong>
                  Diagnostic report: {labName} conducted on {dateText} with {observationCount} extracted biomarkers.
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-white/5">
                  <strong className="text-teal-300 font-bold block mb-1">B — Background:</strong>
                  Active patient profile telemetry parsed via Aegis Multimodal Vision Engine with verified reference ranges.
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-white/5">
                  <strong className="text-teal-300 font-bold block mb-1">A — Assessment:</strong>
                  {report.aiSummary || report.extractedData?.summary || 'Stable homeostatic readings with targeted biomarkers flagged for routine monitoring.'}
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-white/5">
                  <strong className="text-teal-300 font-bold block mb-1">R — Recommendation:</strong>
                  Maintain standard medical followup; discuss elevated biomarkers with primary care clinician or specialist.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisualLabReportCard;
