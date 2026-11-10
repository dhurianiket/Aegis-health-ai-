import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Droplets,
  Building2,
  ChevronRight,
  FileCheck2,
} from 'lucide-react';
import {
  LAB_PACKAGES_CATALOG,
  LAB_PARTNERS,
  LabPackage,
  LabBookingConfirmation,
  checkPincodeServiceability,
  createLabBooking,
  findRecommendedPackagesForBiomarkers,
} from '../../services/integrations/labBookingService';

export interface LabBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendedBiomarkers?: string[];
  patientProfile?: {
    name?: string;
    age?: number | string;
    gender?: string;
    phone?: string;
    email?: string;
    address?: string;
    pincode?: string;
    abhaId?: string;
  };
}

const MORNING_SLOTS = [
  '06:30 AM – 07:00 AM',
  '07:00 AM – 07:30 AM',
  '07:30 AM – 08:00 AM',
  '08:00 AM – 08:30 AM',
  '08:30 AM – 09:00 AM',
  '09:00 AM – 09:30 AM',
  '09:30 AM – 10:00 AM',
];

export const LabBookingModal: React.FC<LabBookingModalProps> = ({
  isOpen,
  onClose,
  recommendedBiomarkers = [],
  patientProfile,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPkgId, setSelectedPkgId] = useState<string>('pkg-aarogyam-c');

  // Form State
  const [patientName, setPatientName] = useState(patientProfile?.name || 'Aniket Dhuri');
  const [age, setAge] = useState(patientProfile?.age?.toString() || '29');
  const [gender, setGender] = useState(patientProfile?.gender || 'male');
  const [phone, setPhone] = useState(patientProfile?.phone || '8591330257');
  const [email, setEmail] = useState(patientProfile?.email || 'aniket@aegishealthai.co.in');
  const [address, setAddress] = useState(patientProfile?.address || '');
  const [pincode, setPincode] = useState(patientProfile?.pincode || '400076');

  // Next day as default collection date
  const defaultDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [preferredDate, setPreferredDate] = useState(defaultDate);
  const [preferredSlot, setPreferredSlot] = useState(MORNING_SLOTS[1]);

  const [pincodeCheck, setPincodeCheck] = useState(checkPincodeServiceability(pincode));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<LabBookingConfirmation | null>(null);

  useEffect(() => {
    if (recommendedBiomarkers.length > 0) {
      const recs = findRecommendedPackagesForBiomarkers(recommendedBiomarkers);
      if (recs.length > 0) {
        setSelectedPkgId(recs[0].id);
      }
    }
  }, [recommendedBiomarkers]);

  useEffect(() => {
    if (pincode.length === 6) {
      setPincodeCheck(checkPincodeServiceability(pincode));
    }
  }, [pincode]);

  const selectedPkg = LAB_PACKAGES_CATALOG.find((p) => p.id === selectedPkgId) || LAB_PACKAGES_CATALOG[0];
  const partner = LAB_PARTNERS[selectedPkg.partnerId];

  const handleBooking = async () => {
    setIsSubmitting(true);
    try {
      const res = await createLabBooking({
        packageId: selectedPkg.id,
        patientName,
        age: parseInt(age, 10) || 29,
        gender,
        phone,
        email,
        address: address || 'Powai, Mumbai',
        pincode: pincode || '400076',
        preferredDate,
        preferredSlot,
        abhaId: patientProfile?.abhaId,
      });
      setConfirmation(res);
      setStep(3);
    } catch (err) {
      console.error('Booking failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9950] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-theme border border-surface rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          role="dialog"
          aria-modal="true"
        >
          {/* Top Header */}
          <div className="px-6 py-4 border-b border-surface bg-surface/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-theme">Doorstep Phlebotomy &amp; Lab Booking</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    NABL ACCREDITED
                  </span>
                </div>
                <p className="text-[11px] text-muted">
                  Pan-India certified home sample collection · Direct digital result synchronization
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-muted hover:text-theme rounded-full hover:bg-surface transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper Progress */}
          {step !== 3 && (
            <div className="px-6 py-2.5 border-b border-surface bg-surface/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === 1 ? 'bg-teal-500 text-white' : 'bg-surface text-muted'
                }`}>1</span>
                <span className={step === 1 ? 'font-bold text-theme' : 'text-muted'}>Select Test Panel</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted/40" />
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === 2 ? 'bg-teal-500 text-white' : 'bg-surface text-muted'
                }`}>2</span>
                <span className={step === 2 ? 'font-bold text-theme' : 'text-muted'}>Schedule Home Draw</span>
              </div>
            </div>
          )}

          {/* Scrollable Content Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
            {/* STEP 1: Select Package */}
            {step === 1 && (
              <div className="space-y-4">
                {recommendedBiomarkers.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-teal-400">AI Contextual Recommendation: </span>
                      <span className="text-muted">
                        Targeting follow-up biomarkers flagged in your clinical telemetry:
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {recommendedBiomarkers.map((b, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-mono text-[10px] font-semibold">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {LAB_PACKAGES_CATALOG.map((pkg) => {
                    const isSelected = pkg.id === selectedPkgId;
                    const pkgPartner = LAB_PARTNERS[pkg.partnerId];

                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkgId(pkg.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-teal-500/10 border-teal-500/50 shadow-md shadow-teal-500/10 ring-1 ring-teal-500/40'
                            : 'bg-surface/30 border-surface hover:border-surface hover:bg-surface/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-theme">{pkg.name}</h4>
                              {pkg.popular && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                  POPULAR
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted mt-1 leading-relaxed">
                              {pkg.description}
                            </p>

                            <div className="flex items-center gap-4 mt-3 text-[11px] text-muted flex-wrap">
                              <span className="inline-flex items-center gap-1 font-semibold text-teal-400">
                                <Building2 className="w-3.5 h-3.5" />
                                {pkgPartner.name}
                              </span>
                              <span>•</span>
                              <span>{pkg.parameterCount} Parameters</span>
                              <span>•</span>
                              <span>{pkg.sampleType}</span>
                              {pkg.fastingRequired && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-400 font-semibold">{pkg.fastingHours}h Fasting</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-base font-black text-theme font-mono">₹{pkg.aegisPrice}</div>
                            <div className="text-[11px] text-muted line-through font-mono">₹{pkg.mrp}</div>
                            <div className="text-[10px] font-bold text-emerald-400 mt-0.5">
                              Save ₹{pkg.mrp - pkg.aegisPrice}
                            </div>
                          </div>
                        </div>

                        {/* Covered Biomarker Pills Preview */}
                        <div className="mt-3 pt-2.5 border-t border-surface/60 flex flex-wrap gap-1">
                          {pkg.biomarkersCovered.slice(0, 6).map((b, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-surface text-[10px] text-muted font-mono">
                              {b}
                            </span>
                          ))}
                          {pkg.biomarkersCovered.length > 6 && (
                            <span className="px-1.5 py-0.5 rounded bg-surface text-[10px] text-muted font-bold">
                              +{pkg.biomarkersCovered.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Patient & Schedule Details */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Selected Package Banner */}
                <div className="p-3.5 rounded-2xl bg-surface/50 border border-surface flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-muted uppercase font-bold tracking-wider">Selected Package</div>
                    <div className="text-sm font-bold text-theme">{selectedPkg.name}</div>
                    <div className="text-xs text-teal-400 mt-0.5">{partner.name} · {selectedPkg.parameterCount} Parameters</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-theme font-mono">₹{selectedPkg.aegisPrice}</div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-[11px] text-teal-400 hover:underline font-semibold"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Patient Information Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase mb-1">Patient Full Name</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-surface/60 border border-surface text-sm text-theme focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase mb-1">Mobile Number (WhatsApp updates)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-surface/60 border border-surface text-sm text-theme focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase mb-1">Email (Report Delivery)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-surface/60 border border-surface text-sm text-theme focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase mb-1">Age &amp; Gender</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Age"
                        className="w-24 px-3.5 py-2 rounded-xl bg-surface/60 border border-surface text-sm text-theme focus:outline-none focus:border-teal-500"
                      />
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-surface/60 border border-surface text-sm text-theme focus:outline-none focus:border-teal-500"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Doorstep Collection Address & Pincode */}
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-muted uppercase mb-1">Collection Address (Home/Office)</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Flat / Building, Street, Landmark"
                        className="w-full px-3.5 py-2 rounded-xl bg-surface/60 border border-surface text-sm text-theme focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted uppercase mb-1">Pincode</label>
                      <input
                        type="text"
                        value={pincode}
                        maxLength={6}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="6 digits"
                        className="w-full px-3.5 py-2 rounded-xl bg-surface/60 border border-surface text-sm text-theme font-mono focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Pincode Serviceability Pill */}
                  {pincodeCheck.serviceable ? (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{pincodeCheck.message} ({pincodeCheck.deliveryEstimateText})</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{pincodeCheck.message}</span>
                    </div>
                  )}
                </div>

                {/* Scheduling Date & Time Slot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-400" />
                      Collection Date
                    </label>
                    <input
                      type="date"
                      min={defaultDate}
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-surface/60 border border-surface text-sm text-theme focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      Morning Fasting Slot
                    </label>
                    <select
                      value={preferredSlot}
                      onChange={(e) => setPreferredSlot(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-surface/60 border border-surface text-sm text-theme focus:outline-none focus:border-teal-500"
                    >
                      {MORNING_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Protocol Advisory */}
                <div className="p-3 rounded-xl bg-surface/30 border border-surface text-xs text-muted flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-theme">Phlebotomist Protocol: </span>
                    {selectedPkg.fastingRequired
                      ? `Requires ${selectedPkg.fastingHours} hours of overnight fasting. Only plain water is permitted before morning collection.`
                      : 'No dietary fasting required for this specific panel.'}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Booking Confirmed */}
            {step === 3 && confirmation && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
                  <FileCheck2 className="w-8 h-8" />
                </div>

                <div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                    {confirmation.status}
                  </span>
                  <h3 className="text-lg font-bold text-theme mt-2">Doorstep Phlebotomist Booked</h3>
                  <p className="text-xs text-muted max-w-md mx-auto mt-1">
                    {confirmation.message}
                  </p>
                </div>

                {/* Booking Telemetry Card */}
                <div className="p-4 rounded-2xl bg-surface/40 border border-surface text-left space-y-2 text-xs max-w-md mx-auto">
                  <div className="flex justify-between py-1 border-b border-surface/50">
                    <span className="text-muted">Aegis Booking ID:</span>
                    <span className="font-mono font-bold text-teal-400">{confirmation.bookingId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface/50">
                    <span className="text-muted">Partner Reference:</span>
                    <span className="font-mono font-bold text-theme">{confirmation.partnerBookingRef}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface/50">
                    <span className="text-muted">Diagnostic Partner:</span>
                    <span className="font-bold text-theme">{confirmation.partner.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface/50">
                    <span className="text-muted">Scheduled Time:</span>
                    <span className="font-bold text-theme">{confirmation.scheduledDate} ({confirmation.scheduledSlot})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface/50">
                    <span className="text-muted">Total Payable:</span>
                    <span className="font-mono font-black text-theme text-sm">₹{confirmation.totalPayable}</span>
                  </div>
                  <div className="pt-2 text-[11px] text-muted">
                    <strong className="text-theme">Preparation Note:</strong> {confirmation.phlebotomyProtocol}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 max-w-md mx-auto">
                  ⚡ <strong>Automated Ingestion:</strong> As soon as the laboratory analyzes your samples, your structured results will sync directly into your Aegis Health Timeline and recalculate your SBAR report.
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="px-6 py-4 border-t border-surface bg-surface/40 flex items-center justify-between shrink-0">
            {step === 1 && (
              <>
                <div className="text-xs text-muted">
                  Total: <strong className="text-theme font-mono text-sm">₹{selectedPkg.aegisPrice}</strong>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-500 text-white hover:bg-teal-600 transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-teal-500/20"
                >
                  <span>Continue to Schedule</span>
                  <ArrowRight size={14} />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-theme transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleBooking}
                  disabled={isSubmitting || !pincodeCheck.serviceable}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  {isSubmitting ? (
                    <span>Confirming Phlebotomist...</span>
                  ) : (
                    <>
                      <span>Confirm Home Booking (₹{selectedPkg.aegisPrice})</span>
                      <ShieldCheck size={15} />
                    </>
                  )}
                </button>
              </>
            )}

            {step === 3 && (
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-surface hover:bg-surface/80 text-theme transition-colors cursor-pointer"
              >
                Done · Return to Dashboard
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
