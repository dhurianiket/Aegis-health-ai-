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
        if (!userDoc.exists() || userDoc.data().role !== "admin") {
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
      } catch (e) {
        console.error("Failed to fetch dashboard core data:", e);
      }

      // 3. Fake daily uploads or fetch real if feasible (we will try fetching)
      try {
        const docsSnap = await getDocs(collectionGroup(db, "documents"));
        const counts: Record<string, number> = {};
        docsSnap.forEach((d) => {
          const data = d.data();
          if (data.createdAt) {
            const dateStr = new Date(data.createdAt).toISOString().split("T")[0];
            counts[dateStr] = (counts[dateStr] || 0) + 1;
          }
        });
        const uploads = Object.keys(counts)
          .sort()
          .slice(-30)
          .map((k) => ({ date: k, count: counts[k] }));
        setDailyUploads(uploads);
      } catch (e) {
        console.error("Failed to fetch documents for chart", e);
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
          { icon: Users, label: "Total Users", val: globalStats?.totalUsers || users.length },
          { icon: Activity, label: "Active Today", val: globalStats?.activeUsersToday || users.filter(u => u.isActiveToday).length },
          { icon: Activity, label: "Active This Mth", val: globalStats?.activeUsersThisMonth || users.filter(u => u.isActiveThisMonth).length },
          { icon: FileText, label: "Total Docs", val: globalStats?.totalDocumentsUploaded || 0 },
          { icon: Database, label: "Total Storage", val: formatBytes(globalStats?.totalStorageBytes || 0) },
          { icon: DollarSign, label: "Est. Cost (USD)", val: `$${estimatedCost.toFixed(2)}` },
        ].map((kpi, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-surface flex flex-col gap-2">
            <div className="flex items-center gap-2 text-muted">
              <kpi.icon className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">{kpi.label}</span>
            </div>
            <div className="text-2xl font-bold">{kpi.val}</div>
          </div>
        ))}
      </div>

      {/* Projections */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-surface">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-bold">Revenue & Cost Projections</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-muted">Current Spend (USD)</div>
            <div className="text-xl font-bold">${estimatedCost.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Avg Cost / User (USD)</div>
            <div className="text-xl font-bold">${avgCostPerUser.toFixed(4)}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Break-even at ₹99/m</div>
            <div className="text-xl font-bold">{breakEven99} users</div>
          </div>
          <div>
            <div className="text-sm text-muted">Break-even at ₹499/m</div>
            <div className="text-xl font-bold">{breakEven499} users</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-surface">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Top 10 Users by Tokens</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topUsersByTokens} layout="vertical" margin={{ left: 50 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="email" type="category" width={100} tick={{ fontSize: 10 }} />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Bar dataKey="totalTokensUsed" fill="#0088FE" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-surface">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Top 10 Users by Storage (MB)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topUsersByStorage.map(u => ({ ...u, mb: (u.totalStorageBytes || 0) / 1024 / 1024 }))} layout="vertical" margin={{ left: 50 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="email" type="category" width={100} tick={{ fontSize: 10 }} />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Bar dataKey="mb" fill="#00C49F" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-surface">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Daily Uploads (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyUploads} margin={{ left: -20, bottom: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#FFBB28" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-surface">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Token Usage by Feature</h3>
          <ResponsiveContainer width="100%" height={250}>
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
      </div>

      {/* Users Table */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl shadow-[var(--color-primary)]/5 p-8">
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
                      {row.lastActive ? new Date(row.lastActive).toLocaleDateString() : "N/A"}
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
      
      <div className="text-center text-muted text-xs mt-8">
        Built by Aniket Dhuri • Version {version}
      </div>
    </div>
  );
}
