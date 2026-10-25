import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Heart,
  Scale,
  Ruler,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Gender, UserProfile } from '../../types/medical';
import { useProfile } from '../../context/ProfileContext';
import { calculateAge, isMinor, createPaediatricConsent } from '../../services/dpdpPaediatricService';
import { updateProfile as updateFirebaseUserProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase/config';

interface FirstTimeClinicalOnboardingModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onCompleted?: () => void;
}

export const FirstTimeClinicalOnboardingModal: React.FC<FirstTimeClinicalOnboardingModalProps> = ({
  isOpen,
  profile,
  onCompleted,
}) => {
  const { updateProfile } = useProfile();

  // Form states
  const [fullName, setFullName] = useState(
    profile.fullName && profile.fullName !== 'Myself' ? profile.fullName : ''
  );
  const [dob, setDob] = useState(profile.dob || '');
  const [gender, setGender] = useState<Gender | ''>(profile.gender || '');
  const [height, setHeight] = useState<string>(profile.height ? String(profile.height) : '');
  const [weight, setWeight] = useState<string>(profile.weight ? String(profile.weight) : '');
  const [bloodType, setBloodType] = useState(profile.bloodType || 'Unknown');

  // Paediatric / DPDP guardian state if under 18
  const [guardianName, setGuardianName] = useState(profile.paediatricConsent?.guardianName || '');
  const [guardianRelationship, setGuardianRelationship] = useState<
    'Parent' | 'Lawful Guardian' | 'Legal Representative'
  >(profile.paediatricConsent?.guardianRelationship || 'Parent');
  const [guardianConsentGiven, setGuardianConsentGiven] = useState(
    profile.paediatricConsent?.guardianConsentGiven || false
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Dynamic age and minor determination
  const age = useMemo(() => calculateAge(dob), [dob]);
  const isProfileMinor = useMemo(() => isMinor(dob), [dob]);

  // Dynamic BMI Calculation
  const calculatedBmi = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!isNaN(h) && !isNaN(w) && h > 50 && w > 10) {
      const heightInMeters = h / 100;
      const bmiVal = w / (heightInMeters * heightInMeters);
      let category = 'Normal';
      let colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      if (bmiVal < 18.5) {
        category = 'Underweight';
        colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      } else if (bmiVal >= 25 && bmiVal < 30) {
        category = 'Overweight';
        colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      } else if (bmiVal >= 30) {
        category = 'Obese';
        colorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      }
      return { value: bmiVal.toFixed(1), category, colorClass };
    }
    return null;
  }, [height, weight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setFormError('Please enter your full legal name.');
      return;
    }
    if (!dob) {
      setFormError('Please select your date of birth.');
      return;
    }
    if (!gender) {
      setFormError('Please select your biological gender (required for clinical lab calibration).');
      return;
    }
    const numHeight = parseFloat(height);
    const numWeight = parseFloat(weight);
    if (isNaN(numHeight) || numHeight < 40 || numHeight > 250) {
      setFormError('Please enter a realistic height in cm (e.g. 170).');
      return;
    }
    if (isNaN(numWeight) || numWeight < 10 || numWeight > 300) {
      setFormError('Please enter a realistic weight in kg (e.g. 68).');
      return;
    }

    // DPDP Act Section 9 Guardian consent check if minor
    if (isProfileMinor && (!guardianName.trim() || !guardianConsentGiven)) {
      setFormError(
        'DPDP Act 2023 Section 9 requires verifiable parent/guardian consent for pediatric profiles under 18.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const updates: Partial<UserProfile> = {
        fullName: trimmedName,
        name: trimmedName.split(' ')[0] || trimmedName,
        dob,
        gender,
        height: Math.round(numHeight),
        weight: Math.round(numWeight),
        bmi: calculatedBmi ? parseFloat(calculatedBmi.value) : undefined,
        bloodType: bloodType !== 'Unknown' ? bloodType : undefined,
      };

      if (isProfileMinor) {
        updates.paediatricConsent = createPaediatricConsent(
          guardianName.trim(),
          guardianRelationship,
          trimmedName,
          dob
        );
      }

      await updateProfile(profile.id, updates);

      // Also update auth user displayName if available
      if (auth.currentUser && !auth.currentUser.displayName) {
        try {
          await updateFirebaseUserProfile(auth.currentUser, { displayName: trimmedName });
        } catch {
          // ignore background displayName sync
        }
      }

      if (onCompleted) {
        onCompleted();
      }
    } catch (err: any) {
      console.error('[Onboarding] Failed to update clinical profile:', err);
      setFormError(err?.message || 'Failed to save clinical profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="w-full max-w-xl bg-[#0F2A4A] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.85)] relative text-white my-8 overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-teal-500/15 blur-3xl rounded-full pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-inner">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono uppercase tracking-widest font-bold mb-1">
                <Sparkles className="w-3 h-3" /> Initial Workspace Setup
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Complete Your Health Profile
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            Aegis Health AI requires your biological baseline to compute accurate diagnostic risk scores, calibrate biomarker reference ranges, and enforce safety guardrails.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="onboarding-fullname" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" /> Full Legal Name
              </label>
              <input
                id="onboarding-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aniket Dhuri"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            {/* Date of Birth & Gender Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="onboarding-dob" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Date of Birth
                </label>
                <input
                  id="onboarding-dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                />
                {age !== null && (
                  <span className="text-[11px] font-mono text-emerald-400 mt-1 block">
                    Calculated Age: {age} year{age !== 1 ? 's' : ''} {isProfileMinor ? '• Paediatric Minor' : '• Adult'}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-emerald-400" /> Biological Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: Gender.MALE, label: 'Male' },
                    { value: Gender.FEMALE, label: 'Female' },
                    { value: Gender.OTHER, label: 'Other' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setGender(item.value)}
                      className={`py-2 px-2 text-center rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                        gender === item.value
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm'
                          : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Height & Weight Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="onboarding-height" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-emerald-400" /> Height (cm)
                </label>
                <input
                  id="onboarding-height"
                  type="number"
                  inputMode="numeric"
                  min="40"
                  max="250"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="175"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="onboarding-weight" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" /> Weight (kg)
                </label>
                <input
                  id="onboarding-weight"
                  type="number"
                  inputMode="numeric"
                  min="10"
                  max="300"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="onboarding-blood" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Blood Group
                </label>
                <select
                  id="onboarding-blood"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-400 transition-colors"
                >
                  <option value="Unknown">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            {/* Live BMI Callout */}
            {calculatedBmi && (
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Calculated Body Mass Index (BMI):</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${calculatedBmi.colorClass}`}>
                  {calculatedBmi.value} kg/m² • {calculatedBmi.category}
                </span>
              </div>
            )}

            {/* Paediatric Section 9 Guardian Form if Minor */}
            {isProfileMinor && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" /> DPDP Act 2023 Section 9 Paediatric Consent
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  As the user is under 18 years old, statutory Indian data protection regulations require parent or lawful guardian verification.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="onboarding-guardian-name" className="block text-[11px] font-bold text-slate-300 mb-1">
                      Guardian Name
                    </label>
                    <input
                      id="onboarding-guardian-name"
                      type="text"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="e.g. Ramesh Dhuri"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="onboarding-guardian-rel" className="block text-[11px] font-bold text-slate-300 mb-1">
                      Relationship
                    </label>
                    <select
                      id="onboarding-guardian-rel"
                      value={guardianRelationship}
                      onChange={(e) => setGuardianRelationship(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/15 text-xs text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="Parent">Parent</option>
                      <option value="Lawful Guardian">Lawful Guardian</option>
                      <option value="Legal Representative">Legal Representative</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-start gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guardianConsentGiven}
                    onChange={(e) => setGuardianConsentGiven(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 bg-slate-900 text-emerald-500 focus:ring-0"
                    required
                  />
                  <span className="text-[11px] text-slate-300">
                    I confirm I am the lawful parent/guardian and consent to processing health data strictly under DPDP Section 9 without AI training or behavioral tracking.
                  </span>
                </label>
              </div>
            )}

            {/* Error Message */}
            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 mt-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Calibrating Workspace...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Save Profile &amp; Enter Workspace
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FirstTimeClinicalOnboardingModal;
