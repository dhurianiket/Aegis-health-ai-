import React, { useEffect, useState, Suspense } from "react";
import { getAllUsersUsage } from "../../services/usageService";
import {
  ShieldAlert,
  Database,
  FileText,
  Zap,
  Users,
  Activity,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { getDoc, doc, collectionGroup, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase/config";
import { getFormResponses } from "../../services/googleFormsService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { version } from "../../../package.json";
import SkeletonLoader from "../ui/SkeletonLoader";

import { useAuth } from "../../context/AuthContext";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8A2BE2"];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [dailyUploads, setDailyUploads] = useState<any[]>([]);
  const [feedbackResponses, setFeedbackResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMSG, setErrorMSG] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
         setLoading(false);
         return;
      }
      
      // Enforce role check
      try {
        const userDoc = await getDoc(doc(db, `users/${user.uid}`));
        const userEmail = user.email || "";
        const isEmailAdmin = userEmail.toLowerCase() === "dhurianiket@gmail.com";
        const isRoleAdmin = userDoc.exists() && userDoc.data().role === "admin";
        
        if (!isEmailAdmin && !isRoleAdmin) {
          setErrorMSG("You do not have permission to view the admin dashboard.");
          setLoading(false);
          return;
        }
      } catch (e) {
          setErrorMSG("Failed to verify permissions.");
          setLoading(false);
          return;
      }

      try {
        // 1. Fetch Users
        const usersData = await getAllUsersUsage();
        setUsers(usersData);

        // 2. Fetch Global Stats
        const statDoc = await getDoc(doc(db, "analytics/globalStats"));
        if (statDoc.exists()) {
          setGlobalStats(statDoc.data());
        } else {
          setGlobalStats({
             totalUsers: usersData?.length || 0,
             activeUsersToday: usersData?.filter((u) => u.isActiveToday).length || 0,
             activeUsersThisMonth: usersData?.filter((u) => u.isActiveThisMonth).length || 0,
             totalDocumentsUploaded: usersData?.reduce((acc, u) => acc + (u.documentsUploaded || 0), 0) || 0,
             totalStorageBytes: usersData?.reduce((acc, u) => acc + (u.totalStorageBytes || 0), 0) || 0,
             totalTokensUsed: usersData?.reduce((acc, u) => acc + (u.totalTokensUsed || 0), 0) || 0,
             estimatedCostUSD: 0,
          });
        }
      } catch (e: any) {
        if (e.code !== 'permission-denied') {
           console.error("Failed to fetch dashboard core data:", e);
        }
      }

      // 3. Fake daily uploads or fetch real if feasible (we will try fetching)
      try {
        const docsSnap = await getDocs(collectionGroup(db, "documents"));
        const counts: Record<string, number> = {};
        docsSnap.forEach((d) => {
          const data = d.data();
          if (data.createdAt) {
            const dateObj = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            if (!isNaN(dateObj.getTime())) {
               const dateStr = dateObj.toISOString().split("T")[0];
               counts[dateStr] = (counts[dateStr] || 0) + 1;
            }
          }
        });
        const uploads = Object.keys(counts)
          .sort()
          .slice(-30)
          .map((k) => ({ date: k, count: counts[k] }));
        setDailyUploads(uploads);
      } catch (e: any) {
        if (e.code !== 'permission-denied') {
           console.error("Failed to fetch documents for chart", e);
        }
      }

      // 4. Fetch Feedback from Google Forms
      try {
         const formId = import.meta.env.VITE_ADMIN_FEEDBACK_FORM_ID;
         if (formId) {
            const resp = await getFormResponses(formId);
            if (resp && resp.responses) {
               setFeedbackResponses(resp.responses.sort((a: any, b: any) => new Date(b.lastSubmittedTime).getTime() - new Date(a.lastSubmittedTime).getTime()));
            }
         }
      } catch (e: any) {
         console.warn("Failed to fetch feedback responses", e);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 MB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getEstCost = (prompt: number = 0, resp: number = 0, think: number = 0) => {
    return (prompt / 1000000) * 0.15 + (resp / 1000000) * 0.6 + (think / 1000000) * 3.5;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-16">
        <SkeletonLoader className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <SkeletonLoader className="h-24 rounded-2xl" />
          <SkeletonLoader className="h-24 rounded-2xl" />
          <SkeletonLoader className="h-24 rounded-2xl" />
          <SkeletonLoader className="h-24 rounded-2xl" />
          <SkeletonLoader className="h-24 rounded-2xl" />
          <SkeletonLoader className="h-24 rounded-2xl" />
        </div>
        <SkeletonLoader className="h-64 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonLoader className="h-64 rounded-3xl" />
          <SkeletonLoader className="h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (errorMSG) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-16 flex flex-col items-center justify-center pt-20">
         <h2 className="text-2xl text-red-400 font-medium mb-2">Access Restricted</h2>
         <p className="text-gray-400">{errorMSG}</p>
      </div>
    );
  }

  const topUsersByTokens = [...users]
    .sort((a, b) => (b.totalTokensUsed || 0) - (a.totalTokensUsed || 0))
    .slice(0, 10);
  const topUsersByStorage = [...users]
    .sort((a, b) => (b.totalStorageBytes || 0) - (a.totalStorageBytes || 0))
    .slice(0, 10);

  const featureTokensArray = globalStats?.featureTokens
    ? Object.entries(globalStats.featureTokens).map(([name, value]) => ({ name, value }))
    : [];

  const estimatedCost = globalStats?.estimatedCostUSD || users.reduce((acc, u) => acc + getEstCost(u.promptTokens, u.responseTokens, u.thinkingTokens), 0);
  const monthlyCostINR = estimatedCost * 84;
  const breakEven99 = Math.ceil(monthlyCostINR / 99);
  const breakEven199 = Math.ceil(monthlyCostINR / 199);
  const breakEven499 = Math.ceil(monthlyCostINR / 499);
  const avgCostPerUser = users.length > 0 ? estimatedCost / users.length : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-8 h-8 text-[var(--color-primary)]" />
        <h1 className="text-2xl font-bold tracking-tight">Admin Usage Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: Users, label: "Total Users", val: globalStats?.totalUsers || users.length, desc: "Across platform" },
          { icon: Activity, label: "Active Today", val: globalStats?.activeUsersToday || users.filter(u => u.isActiveToday).length, desc: "Last 24 hours" },
          { icon: Activity, label: "Active This Mth", val: globalStats?.activeUsersThisMonth || users.filter(u => u.isActiveThisMonth).length, desc: "Last 30 days" },
          { icon: FileText, label: "Total Docs", val: globalStats?.totalDocumentsUploaded || 0, desc: "Uploaded PDFs" },
          { icon: Database, label: "Total Storage", val: formatBytes(globalStats?.totalStorageBytes || 0), desc: "Vault size" },
          { icon: DollarSign, label: "Est. Cost (USD)", val: `$${estimatedCost.toFixed(2)}`, desc: "Gemini API spent" },
        ].map((kpi, i) => (
          <div key={i} className="bg-[var(--color-surface)] backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-[var(--color-border)] flex flex-col gap-2">
            <div className="flex items-center gap-2 text-muted">
              <kpi.icon className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">{kpi.label}</span>
            </div>
            <div className="flex flex-col">
               <div className="text-2xl font-bold text-theme">{kpi.val}</div>
               {(kpi.val === 0 || kpi.val === "0 MB" || kpi.val === "$0.00") && (
                 <span className="text-[10px] text-muted mt-1">Waiting for data...</span>
               )}
            </div>
          </div>
        ))}
      </div>

      {/* Projections */}
      <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-[var(--color-border)]">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-bold text-theme">Revenue & Cost Projections</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-muted">Current Spend (USD)</div>
            <div className="text-xl font-bold text-theme">${estimatedCost.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Avg Cost / User (USD)</div>
            <div className="text-xl font-bold text-theme">${avgCostPerUser.toFixed(4)}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Break-even at ₹99/m</div>
            <div className="text-xl font-bold text-theme">{breakEven99} users</div>
          </div>
          <div>
            <div className="text-sm text-muted">Break-even at ₹499/m</div>
            <div className="text-xl font-bold text-theme">{breakEven499} users</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-[var(--color-border)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Top 10 Users by Tokens</h3>
          {topUsersByTokens.length > 0 ? (
            <div className="w-full h-[250px] min-h-[250px]">
              <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <BarChart data={topUsersByTokens} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="email" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ fill: "transparent" }} />
                  <Bar dataKey="totalTokensUsed" fill="#0088FE" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted text-sm border-t border-[var(--color-border)]">No token usage data</div>
          )}
        </div>
        <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-[var(--color-border)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Top 10 Users by Storage (MB)</h3>
          {topUsersByStorage.length > 0 ? (
            <div className="w-full h-[250px] min-h-[250px]">
              <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <BarChart data={topUsersByStorage.map(u => ({ ...u, mb: (u.totalStorageBytes || 0) / 1024 / 1024 }))} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="email" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ fill: "transparent" }} />
                  <Bar dataKey="mb" fill="#00C49F" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted text-sm border-t border-[var(--color-border)]">No storage data</div>
          )}
        </div>
        <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-[var(--color-border)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Daily Uploads (Last 30 Days)</h3>
          {dailyUploads.length > 0 ? (
            <div className="w-full h-[250px] min-h-[250px]">
              <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <LineChart data={dailyUploads} margin={{ left: -20, bottom: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#FFBB28" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-[250px] flex items-center justify-center text-muted text-sm border-t border-[var(--color-border)]">No uploads data</div>
          )}
        </div>
        <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-[var(--color-border)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Token Usage by Feature</h3>
          {featureTokensArray.length > 0 ? (
            <div className="w-full h-[250px] min-h-[250px]">
              <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <PieChart>
                  <Pie data={featureTokensArray} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {featureTokensArray.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted text-sm border-t border-[var(--color-border)]">No feature usage data</div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl border border-[var(--color-border)] shadow-xl shadow-black/5 p-8">
        <div className="flex items-center gap-2 mb-6 text-[var(--color-primary)]">
          <Users className="w-5 h-5" />
          <h2 className="text-lg font-bold text-theme">System Users & Allocation</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface">
                <th className="py-4 px-4 font-semibold text-xs text-muted uppercase tracking-wider">Email</th>
                <th className="py-4 px-4 font-semibold text-xs text-muted uppercase tracking-wider">Docs</th>
                <th className="py-4 px-4 font-semibold text-xs text-muted uppercase tracking-wider">Storage (MB)</th>
                <th className="py-4 px-4 font-semibold text-xs text-muted uppercase tracking-wider">Total Tokens</th>
                <th className="py-4 px-4 font-semibold text-xs text-muted uppercase tracking-wider">Think Tokens</th>
                <th className="py-4 px-4 font-semibold text-xs text-muted uppercase tracking-wider">Est. Cost ($)</th>
                <th className="py-4 px-4 font-semibold text-xs text-muted uppercase tracking-wider">Last Active</th>
                <th className="py-4 px-4 font-semibold text-xs text-center text-muted uppercase tracking-wider">Active Today</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row, idx) => {
                const rowCost = getEstCost(row.promptTokens, row.responseTokens, row.thinkingTokens);
                return (
                  <tr key={idx} className="border-b border-surface/50 hover:bg-surface/30 transition-colors">
                    <td className="py-4 px-4 font-medium text-sm">{row.email || row.userId || "Unknown"}</td>
                    <td className="py-4 px-4 text-sm">{row.documentsUploaded || 0}</td>
                    <td className="py-4 px-4 text-sm">{(row.totalStorageBytes / 1024 / 1024 || 0).toFixed(2)}</td>
                    <td className="py-4 px-4 font-mono text-xs text-blue-600">{(row.totalTokensUsed || 0).toLocaleString()}</td>
                    <td className="py-4 px-4 font-mono text-xs text-purple-600">{(row.thinkingTokens || 0).toLocaleString()}</td>
                    <td className="py-4 px-4 font-mono text-xs text-green-600">${rowCost.toFixed(4)}</td>
                    <td className="py-4 px-4 text-xs text-muted">
                      {row.lastActive && !isNaN(new Date(row.lastActive).getTime()) ? new Date(row.lastActive).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.isActiveToday ? "✅" : "❌"}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">No usage data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Beta Feedback Table */}
      <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl border border-[var(--color-border)] shadow-xl shadow-black/5 p-8">
        <div className="flex items-center gap-2 mb-6 text-amber-500">
          <FileText className="w-5 h-5" />
          <h2 className="text-lg font-bold text-theme">Beta Feedback / Issues</h2>
        </div>
        <div className="space-y-4">
           {feedbackResponses.length > 0 ? feedbackResponses.map((r, i) => {
              // Extract text answers nicely
              const answers: any[] = [];
              for (const [qId, ans] of Object.entries(r.answers || {})) {
                 const text = (ans as any)?.textAnswers?.answers?.[0]?.value;
                 if (text) {
                    answers.push({ qId, text });
                 }
              }
              const d = new Date(r.lastSubmittedTime);
              return (
                 <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm">
                    <div className="text-xs text-muted mb-2">{d.toLocaleString()} (ID: {r.responseId})</div>
                    <div className="space-y-2">
                       {answers.map((a, j) => (
                          <div key={j} className="flex flex-col gap-1">
                             <span className="font-semibold text-[var(--color-text)]">Q {a.qId}</span>
                             <span className="text-muted">{a.text}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              );
           }) : (
              <div className="p-8 text-center text-muted max-w-sm mx-auto">
                 No feedback loaded. Ensure <code className="bg-white/10 px-2 py-0.5 rounded text-xs">VITE_ADMIN_FEEDBACK_FORM_ID</code> is set in .env and the user has authorized Forms API.
              </div>
           )}
        </div>
      </div>

      <div className="text-center text-muted text-xs mt-8">
        Built by <a href="https://aniket.aegishealthai.co.in/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-text)] underline decoration-muted transition-colors">Aniket Dhuri</a> • Version {version}
      </div>
    </div>
  );
}
