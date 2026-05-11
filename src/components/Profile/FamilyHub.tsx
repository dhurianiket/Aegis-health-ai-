import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  UserPlus,
  Shield,
  Dna,
  ArrowRight,
  Check,
  X,
  Clock,
  Heart,
  Activity,
  AlertCircle,
  Share2,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { getFamilyRelations, db } from "../../lib/firebase/firestore";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import {
  analyzeSharedRisks,
  GeneticRiskAnalysis,
} from "../../services/ai/geneticService";
import { UserProfile, LabResult } from "../../types/medical";

export default function FamilyHub() {
  const { user } = useAuth();
  const { profiles, activeProfile } = useProfile();

  const [relations, setRelations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "risk">("members");

  const [risks, setRisks] = useState<GeneticRiskAnalysis[]>([]);
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "familyRelations"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRelations(data);
    });

    return () => unsubscribe();
  }, [user]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      await addDoc(collection(db, "users", user.uid, "familyRelations"), {
        userId: user.uid,
        relatedEmail: inviteEmail.trim(),
        relationType: "dependent",
        accessLevel: "read",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setInviteEmail("");
    } catch (error) {
      console.error("Invite failed:", error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleAnalyzeRisk = async () => {
    setIsAnalyzingRisk(true);
    try {
      if (!activeProfile) return;

      const profilesData = [
        { profile: activeProfile, labs: activeProfile.labValues || [] },
      ];
      const results = await analyzeSharedRisks(profilesData);
      setRisks(results);
    } catch (error) {
      console.error("Risk analysis failed:", error);
    } finally {
      setIsAnalyzingRisk(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 p-8 rounded-[40px] border border-white/10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Family Hub
            </h2>
          </div>
          <p className="text-slate-400 text-sm font-light max-w-xl">
            Aura's Multi-User interface allows you to manage dependents, share
            records securely, and analyze collective health risks across
            generations.
          </p>
        </div>

        <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab("members")}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === "members"
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Manage Access
          </button>
          <button
            onClick={() => setActiveTab("risk")}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === "risk"
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Cross-Genetic Risk
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {activeTab === "members" ? (
          <>
            {/* Left Column: Invite & Stats */}
            <div className="space-y-6">
              <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-2xl shadow-indigo-500/20">
                <Shield className="w-10 h-10 mb-4 opacity-50" />
                <h3 className="text-2xl font-bold mb-2">Invite Caretaker</h3>
                <p className="text-indigo-100 text-sm mb-6 leading-relaxed opacity-80">
                  Securely share access to your health profile with a trusted
                  family member or physician.
                </p>
                <form onSubmit={handleInvite} className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-sm text-white placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isInviting || !inviteEmail}
                    className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    Send Secure Invite
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">
                  Security Invariants
                </h4>
                <div className="space-y-4">
                  {[
                    { icon: Shield, text: "End-to-End Vault Encryption" },
                    { icon: Clock, text: "Timed Access Revocation" },
                    { icon: AlertCircle, text: "Granular PII Masking" },
                  ].map((inv, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <inv.icon className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-xs text-slate-300 font-medium">
                        {inv.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Connection List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between px-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  Active Connections
                </h4>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {relations.length} Active Links
                </div>
              </div>

              <div className="space-y-3">
                {relations.map((rel) => (
                  <motion.div
                    layout
                    key={rel.id}
                    className="bg-white/5 border border-white/5 hover:border-white/10 p-6 rounded-3xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          rel.status === "active"
                            ? "bg-emerald-500/10"
                            : "bg-amber-500/10"
                        }`}
                      >
                        {rel.status === "active" ? (
                          <Share2 className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <Clock className="w-6 h-6 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm tracking-tight">
                          {rel.relatedEmail}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                            {rel.relationType}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <span
                            className={`text-[10px] font-black uppercase tracking-widest ${
                              rel.status === "active"
                                ? "text-emerald-500"
                                : "text-amber-500"
                            }`}
                          >
                            {rel.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {rel.status === "active" ? (
                        <>
                          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                            Revoke
                          </button>
                          <button className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-500/20">
                            Edit Access
                          </button>
                        </>
                      ) : (
                        <button className="px-4 py-2 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}

                {relations.length === 0 && (
                  <div className="text-center py-24 bg-white/5 border border-dashed border-white/10 rounded-[40px]">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-slate-500" />
                    </div>
                    <h5 className="text-slate-300 font-bold">
                      No Active Family Links
                    </h5>
                    <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                      Share access to manage chronic conditions together or
                      compare genetic lab markers.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Risk Tab Placeholder - D3 Visuals later */
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-[40px] p-12 text-center">
              <Dna className="w-16 h-16 text-indigo-400 mx-auto mb-6 animate-pulse" />
              <h3 className="text-2xl font-bold text-white mb-4">
                Genetic Marker Cross-Analysis
              </h3>
              <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed font-light mb-8">
                Aura securely visualizes patterns across linked family accounts
                to provide insight into shared health histories. This
                functionality allows you to review historical data together for
                care coordination.
              </p>

              <button
                onClick={handleAnalyzeRisk}
                disabled={isAnalyzingRisk || relations.length === 0}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 mx-auto"
              >
                {isAnalyzingRisk ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Hereditary Patterns...
                  </>
                ) : (
                  <>
                    <Activity className="w-5 h-5" />
                    Launch Genetic Scan
                  </>
                )}
              </button>

              {relations.length === 0 && (
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center gap-3 max-w-md mx-auto">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <span className="text-xs text-amber-200 font-medium">
                    Link at least one family member to enable cross-analysis.
                  </span>
                </div>
              )}
            </div>

            {risks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {risks.map((risk, i) => (
                  <div
                    key={i}
                    className="bg-white/5 border border-white/10 rounded-[32px] p-8 flex flex-col h-full"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] text-indigo-400 font-black uppercase tracking-widest">
                        Analysis Complete
                      </div>
                      <Dna className="w-5 h-5 text-indigo-400/50" />
                    </div>

                    <h5 className="text-xl font-bold text-white mb-2">
                      {risk.condition}
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6 flex-grow">
                      {risk.description}
                    </p>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500 uppercase tracking-widest">
                          Hereditary Risk
                        </span>
                        <span className="text-indigo-400">
                          {risk.sharedRiskScore}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${risk.sharedRiskScore}%` }}
                          className="h-full bg-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                        Preventive Route
                      </span>
                      {risk.recommendations.map((rec, j) => (
                        <div
                          key={j}
                          className="flex items-start gap-2 text-xs text-slate-200 bg-white/5 p-2 rounded-xl border border-white/5"
                        >
                          <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
