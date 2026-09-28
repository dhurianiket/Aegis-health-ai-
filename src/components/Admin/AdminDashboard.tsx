import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  getAllUsersUsage,
  getEstCost,
  syncGlobalStatsLive,
} from "../../services/usageService";
import {
  ShieldAlert,
  Database,
  FileText,
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Download,
  Search,
  Clock,
  CheckCircle2,
  Filter,
  BarChart3,
  Layers,
} from "lucide-react";
import {
  getDoc,
  doc,
  collectionGroup,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
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
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { version } from "../../../package.json";
import SkeletonLoader from "../ui/SkeletonLoader";
import { useAuth } from "../../context/AuthContext";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8A2BE2", "#EC4899"];

const extractDocDate = (data: any, docId: string): string | null => {
  if (data?.createdAt) {
    if (typeof data.createdAt.toDate === "function") {
      return data.createdAt.toDate().toISOString().split("T")[0];
    }
    if (data.createdAt.seconds) {
      return new Date(data.createdAt.seconds * 1000).toISOString().split("T")[0];
    }
    if (typeof data.createdAt === "string" && !isNaN(new Date(data.createdAt).getTime())) {
      return new Date(data.createdAt).toISOString().split("T")[0];
    }
  }
  if (data?.uploadedAt && !isNaN(new Date(data.uploadedAt).getTime())) {
    return new Date(data.uploadedAt).toISOString().split("T")[0];
  }
  if (data?.date) {
    const parsed = new Date(data.date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }
  // Extract millisecond timestamp from docId if present (e.g. doc_1778698449538)
  const match = docId.match(/(\d{13})/);
  if (match) {
    const ms = Number(match[1]);
    if (!isNaN(ms) && ms > 1600000000000 && ms < 2500000000000) {
      return new Date(ms).toISOString().split("T")[0];
    }
  }
  return null;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [dailyUploads, setDailyUploads] = useState<any[]>([]);
  const [feedbackResponses, setFeedbackResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [errorMSG, setErrorMSG] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");

  const loadData = useCallback(async (isInitial = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (isInitial) setLoading(true);
    else setRefreshing(true);

    // Enforce role check
    try {
      const userDoc = await getDoc(doc(db, `users/${user.uid}`));
      const userEmail = user.email || "";
      const isEmailAdmin = userEmail.toLowerCase() === "dhurianiket@gmail.com";
      const isRoleAdmin = userDoc.exists() && userDoc.data().role === "admin";

      if (!isEmailAdmin && !isRoleAdmin) {
        setErrorMSG("You do not have permission to view the admin dashboard.");
        setLoading(false);
        setRefreshing(false);
        return;
      }
    } catch {
      setErrorMSG("Failed to verify admin permissions.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // 1. Fetch Users usage
      const usersData = await getAllUsersUsage();
      setUsers(usersData);

      // 2. Fetch Documents to compute exact upload timeline & storage
      let docsCount = 0;
      let totalDocStorage = 0;
      const counts: Record<string, number> = {};

      try {
        const docsSnap: any = await getDocs(collectionGroup(db, "documents"));
        docsCount = typeof docsSnap?.size === "number" ? docsSnap.size : (docsSnap?.docs?.length || 0);

        const docList = typeof docsSnap?.forEach === "function" 
          ? docsSnap 
          : (Array.isArray(docsSnap?.docs) ? docsSnap.docs : []);

        docList.forEach((d: any) => {
          const data = typeof d.data === "function" ? d.data() : (d || {});
          if (data.fileSize && typeof data.fileSize === "number") {
            totalDocStorage += data.fileSize;
          }
          const dateStr = extractDocDate(data, d.id || "");
          if (dateStr) {
            counts[dateStr] = (counts[dateStr] || 0) + 1;
          }
        });

        const uploads = Object.keys(counts)
          .sort()
          .slice(-30)
          .map((k) => ({ date: k, count: counts[k] }));
        setDailyUploads(uploads);
      } catch (e: any) {
        // Swallowed if collectionGroup is not supported in offline mode
      }

      // 3. Fetch or Sync Global Stats
      let statData: any = null;
      try {
        const statDoc = await getDoc(doc(db, "analytics/globalStats"));
        if (statDoc.exists() && statDoc.data()?.totalUsers > 0) {
          statData = statDoc.data();
        }
      } catch {}

      if (!statData || statData.totalUsers === 0) {
        // Compute live aggregates and sync to Firestore
        statData = await syncGlobalStatsLive(
          usersData,
          docsCount || undefined,
          totalDocStorage || undefined
        );
      }
      setGlobalStats(statData);

      // 4. Fetch Feedback from Google Forms
      try {
        const formId = import.meta.env.VITE_ADMIN_FEEDBACK_FORM_ID;
        if (formId) {
          const resp = await getFormResponses(formId);
          if (resp && resp.responses) {
            const sortedResponses = resp.responses
              .map((r: any) => ({ r, time: new Date(r.lastSubmittedTime).getTime() }))
              .sort((a: any, b: any) => b.time - a.time)
              .map((item: any) => item.r);
            setFeedbackResponses(sortedResponses);
          }
        }
      } catch (e: any) {
        // Form response fetch optional
      }

      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (e: any) {
      if (e.code !== "permission-denied") {
        console.error("Failed to load dashboard core data:", e);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Real-time listener for live updates
  useEffect(() => {
    if (!user) return;
    const isMaster = user.email?.toLowerCase() === "dhurianiket@gmail.com";
    if (!isMaster) return;

    let debounceTimer: NodeJS.Timeout;
    const triggerDebouncedSync = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadData(false);
      }, 2000);
    };

    let unsubUsage: (() => void) | null = null;
    let unsubDocs: (() => void) | null = null;

    try {
      const usageCol = collectionGroup(db, "usage");
      if (usageCol && typeof onSnapshot === "function") {
        unsubUsage = onSnapshot(
          usageCol,
          () => triggerDebouncedSync(),
          () => {}
        );
      }
    } catch {}

    try {
      const docsCol = collectionGroup(db, "documents");
      if (docsCol && typeof onSnapshot === "function") {
        unsubDocs = onSnapshot(
          docsCol,
          () => triggerDebouncedSync(),
          () => {}
        );
      }
    } catch {}

    return () => {
      clearTimeout(debounceTimer);
      if (unsubUsage) unsubUsage();
      if (unsubDocs) unsubDocs();
    };
  }, [user, loadData]);

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 MB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchQuery ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.userId?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "admin" && u.role === "admin") ||
        (roleFilter === "user" && u.role !== "admin");

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Monthly aggregated token usage across platform
  const monthlyTrendData = useMemo(() => {
    const monthlyMap: Record<string, number> = {};
    users.forEach((u) => {
      if (u.monthlyUsage) {
        Object.entries(u.monthlyUsage).forEach(([m, tokens]) => {
          monthlyMap[m] = (monthlyMap[m] || 0) + (Number(tokens) || 0);
        });
      }
    });
    return Object.keys(monthlyMap)
      .sort()
      .map((month) => ({
        month,
        tokens: monthlyMap[month],
      }));
  }, [users]);

  // ⚡ Bolt Performance Optimization:
  // Wrapped expensive sorting in useMemo to prevent main thread blocking on re-renders.
  // Impact: Prevents O(N log N) sorting execution on every dashboard refresh.
  const topUsersByTokens = useMemo(() => {
    return [...users]
      .sort((a, b) => (b.totalTokensUsed || 0) - (a.totalTokensUsed || 0))
      .slice(0, 10);
  }, [users]);

  const topUsersByStorage = useMemo(() => {
    return [...users]
      .sort((a, b) => (b.totalStorageBytes || 0) - (a.totalStorageBytes || 0))
      .slice(0, 10);
  }, [users]);

  // ⚡ Bolt Performance Optimization:
  // Memoized object mapping for feature tokens to prevent unnecessary array allocations.
  const featureTokensArray = useMemo(() => {
    return globalStats?.featureTokens
      ? Object.entries(globalStats.featureTokens)
          .map(([name, value]) => ({ name, value: Number(value) || 0 }))
          .filter((entry) => entry.value > 0)
      : [];
  }, [globalStats?.featureTokens]);

  // ⚡ Bolt Performance Optimization:
  // Replaced 6 individual O(N) array.reduce() and array.filter() calls with a single O(N) forward loop.
  // Impact: Reduces array iterations from 6 passes to 1 pass and eliminates callback allocation overhead.
  const {
    computedTotalTokens,
    computedEstimatedCost,
    computedActiveTodayCount,
    computedActiveMonthCount,
    computedTotalDocsCount,
    computedTotalStorageBytes,
  } = useMemo(() => {
    let tokens = 0;
    let cost = 0;
    let today = 0;
    let month = 0;
    let docs = 0;
    let storage = 0;

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      tokens += u.totalTokensUsed || 0;
      cost += getEstCost(u.promptTokens, u.responseTokens, u.thinkingTokens);
      if (u.isActiveToday) today++;
      if (u.isActiveThisMonth) month++;
      docs += u.documentsUploaded || 0;
      storage += u.totalStorageBytes || 0;
    }

    return {
      computedTotalTokens: tokens,
      computedEstimatedCost: cost,
      computedActiveTodayCount: today,
      computedActiveMonthCount: month,
      computedTotalDocsCount: docs,
      computedTotalStorageBytes: storage,
    };
  }, [users]);

  const handleExportCSV = () => {
    if (!users.length) return;
    const headers = [
      "User ID",
      "Email",
      "Display Name",
      "Role",
      "Documents",
      "Storage (Bytes)",
      "Storage (MB)",
      "Total Tokens",
      "Prompt Tokens",
      "Response Tokens",
      "Thinking Tokens",
      "Est Cost (USD)",
      "Last Active",
      "Active Today",
      "Active This Month",
    ];

    const rows = users.map((u) => [
      `"${u.userId}"`,
      `"${u.email}"`,
      `"${u.displayName || ""}"`,
      `"${u.role || "user"}"`,
      u.documentsUploaded || 0,
      u.totalStorageBytes || 0,
      ((u.totalStorageBytes || 0) / (1024 * 1024)).toFixed(2),
      u.totalTokensUsed || 0,
      u.promptTokens || 0,
      u.responseTokens || 0,
      u.thinkingTokens || 0,
      getEstCost(u.promptTokens, u.responseTokens, u.thinkingTokens).toFixed(4),
      `"${u.lastActive || "N/A"}"`,
      u.isActiveToday ? "Yes" : "No",
      u.isActiveThisMonth ? "Yes" : "No",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `aegis_users_telemetry_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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



  const totalTokensDisplay = globalStats?.totalTokensUsed || computedTotalTokens;
  const estimatedCost = globalStats?.estimatedCostUSD || computedEstimatedCost;

  const monthlyCostINR = estimatedCost * 84;
  const breakEven99 = Math.max(1, Math.ceil(monthlyCostINR / 99));
  const breakEven199 = Math.max(1, Math.ceil(monthlyCostINR / 199));
  const breakEven499 = Math.max(1, Math.ceil(monthlyCostINR / 499));
  const avgCostPerUser = users.length > 0 ? estimatedCost / users.length : 0;

  const totalUsersCount = globalStats?.totalUsers || users.length;
  const activeTodayCount = globalStats?.activeUsersToday ?? computedActiveTodayCount;
  const activeMonthCount = globalStats?.activeUsersThisMonth ?? computedActiveMonthCount;
  const totalDocsCount = globalStats?.totalDocumentsUploaded || computedTotalDocsCount;
  const totalStorageBytes = globalStats?.totalStorageBytes || computedTotalStorageBytes;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-theme">
              Admin Usage Dashboard
            </h1>
            <p className="text-xs text-muted">
              Live cross-platform metrics, token consumption, and storage ledger
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Live Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </div>

          {lastRefreshed && (
            <span className="text-xs text-muted hidden md:flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {lastRefreshed}
            </span>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => loadData(false)}
            disabled={refreshing}
            aria-label="Refresh Live Data"
            className="p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface)]/80 text-muted hover:text-theme transition-all shadow-sm flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[var(--color-primary)]" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            aria-label="Export Users CSV"
            className="px-3 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm shadow-[var(--color-primary)]/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            icon: Users,
            label: "Total Users",
            val: totalUsersCount,
            desc: "Registered Accounts",
            color: "text-blue-500",
          },
          {
            icon: Activity,
            label: "Active Today",
            val: activeTodayCount,
            desc: "Last 24 Hours",
            color: "text-emerald-500",
          },
          {
            icon: Activity,
            label: "Active This Mth",
            val: activeMonthCount,
            desc: "Last 30 Days",
            color: "text-teal-500",
          },
          {
            icon: FileText,
            label: "Total Docs",
            val: totalDocsCount,
            desc: "Encrypted Vault Files",
            color: "text-amber-500",
          },
          {
            icon: Database,
            label: "Total Storage",
            val: formatBytes(totalStorageBytes),
            desc: "Cloud Storage",
            color: "text-purple-500",
          },
          {
            icon: DollarSign,
            label: "Est. Spend",
            val: `$${estimatedCost.toFixed(2)}`,
            desc: `~₹${monthlyCostINR.toFixed(0)} INR`,
            color: "text-green-500",
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className="bg-[var(--color-surface)] backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-[var(--color-border)] flex flex-col justify-between gap-3 hover:border-[var(--color-primary)]/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {kpi.label}
              </span>
              <div className={`p-1.5 rounded-lg bg-surface/80 ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-theme tracking-tight">{kpi.val}</div>
              <span className="text-[11px] text-muted mt-0.5 block">{kpi.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Projections & Economics */}
      <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
            <h2 className="text-lg font-bold text-theme">Revenue & Unit Economics Projections</h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
            High Margin Platform (&gt;95%)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
          <div>
            <div className="text-xs font-medium text-muted uppercase">Total API Spend</div>
            <div className="text-xl font-bold text-theme mt-1">${estimatedCost.toFixed(2)}</div>
            <div className="text-[11px] text-muted">Gemini 2.5 Flash API</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted uppercase">Avg Cost / User</div>
            <div className="text-xl font-bold text-theme mt-1">${avgCostPerUser.toFixed(4)}</div>
            <div className="text-[11px] text-muted">~₹{(avgCostPerUser * 84).toFixed(2)} per user</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted uppercase">Break-even at ₹99/m</div>
            <div className="text-xl font-bold text-theme mt-1">{breakEven99} user{breakEven99 > 1 ? "s" : ""}</div>
            <div className="text-[11px] text-muted">Basic Patient Tier</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted uppercase">Break-even at ₹199/m</div>
            <div className="text-xl font-bold text-theme mt-1">{breakEven199} user{breakEven199 > 1 ? "s" : ""}</div>
            <div className="text-[11px] text-muted">Family Healthcare Tier</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted uppercase">Break-even at ₹499/m</div>
            <div className="text-xl font-bold text-theme mt-1">{breakEven499} user{breakEven499 > 1 ? "s" : ""}</div>
            <div className="text-[11px] text-muted">Clinic & Provider Tier</div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Uploads (30-Day Timeline) */}
        <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-[var(--color-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Daily Uploads (Last 30 Days)
            </h3>
            <span className="text-xs text-muted font-medium">{dailyUploads.reduce((a, b) => a + b.count, 0)} total in period</span>
          </div>
          {dailyUploads.length > 0 ? (
            <div className="w-full h-[250px] min-h-[250px]">
              <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <AreaChart data={dailyUploads} margin={{ left: -20, bottom: -10 }}>
                  <defs>
                    <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFBB28" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FFBB28" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#FFBB28"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#uploadGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted text-sm border-t border-[var(--color-border)]">
              No recent document uploads in this period
            </div>
          )}
        </div>

        {/* Monthly Platform Token Consumption */}
        <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-[var(--color-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Monthly Token Consumption Trend
            </h3>
            <span className="text-xs text-muted font-mono">{totalTokensDisplay.toLocaleString()} tokens total</span>
          </div>
          {monthlyTrendData.length > 0 ? (
            <div className="w-full h-[250px] min-h-[250px]">
              <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <BarChart data={monthlyTrendData} margin={{ left: -10, bottom: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} tokens`, "Usage"]}
                  />
                  <Bar dataKey="tokens" fill="#0088FE" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted text-sm border-t border-[var(--color-border)]">
              No monthly token history recorded
            </div>
          )}
        </div>

        {/* Top 10 Users by Tokens */}
        <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-[var(--color-border)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            Top Users by AI Token Consumption
          </h3>
          {topUsersByTokens.length > 0 ? (
            <div className="w-full h-[250px] min-h-[250px]">
              <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <BarChart data={topUsersByTokens} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis
                    dataKey="email"
                    type="category"
                    width={120}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(email) => email.split("@")[0]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} tokens`, "Total Tokens"]}
                  />
                  <Bar dataKey="totalTokensUsed" fill="#3B82F6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted text-sm border-t border-[var(--color-border)]">
              No token usage data
            </div>
          )}
        </div>

        {/* AI Feature Distribution */}
        <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-[var(--color-border)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-pink-500" />
            AI Token Usage by Feature
          </h3>
          {featureTokensArray.length > 0 ? (
            <div className="w-full h-[250px] min-h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <PieChart>
                  <Pie
                    data={featureTokensArray}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {featureTokensArray.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} tokens`, "Volume"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted text-sm border-t border-[var(--color-border)]">
              No feature usage data
            </div>
          )}
        </div>
      </div>

      {/* Users Directory & Allocation Table */}
      <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl border border-[var(--color-border)] shadow-xl shadow-black/5 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <Users className="w-5 h-5" />
            <h2 className="text-lg font-bold text-theme">System Users & Resource Ledger</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface text-muted border border-border">
              {filteredUsers.length} of {users.length}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user by email or name..."
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-surface border border-border text-theme focus:outline-none focus:border-[var(--color-primary)] transition-all w-48 sm:w-64"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center p-1 rounded-xl bg-surface border border-border text-xs">
              <button
                onClick={() => setRoleFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  roleFilter === "all" ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-muted hover:text-theme"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRoleFilter("admin")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  roleFilter === "admin" ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-muted hover:text-theme"
                }`}
              >
                Admins
              </button>
              <button
                onClick={() => setRoleFilter("user")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  roleFilter === "user" ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-muted hover:text-theme"
                }`}
              >
                Users
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface">
                <th className="py-3 px-4 font-semibold text-xs text-muted uppercase tracking-wider">User / Account</th>
                <th className="py-3 px-4 font-semibold text-xs text-muted uppercase tracking-wider">Role</th>
                <th className="py-3 px-4 font-semibold text-xs text-muted uppercase tracking-wider">Docs</th>
                <th className="py-3 px-4 font-semibold text-xs text-muted uppercase tracking-wider">Storage</th>
                <th className="py-3 px-4 font-semibold text-xs text-muted uppercase tracking-wider">Total Tokens</th>
                <th className="py-3 px-4 font-semibold text-xs text-muted uppercase tracking-wider">Prompt / Resp</th>
                <th className="py-3 px-4 font-semibold text-xs text-muted uppercase tracking-wider">Est. Spend</th>
                <th className="py-3 px-4 font-semibold text-xs text-muted uppercase tracking-wider">Last Active</th>
                <th className="py-3 px-4 font-semibold text-xs text-center text-muted uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((row, idx) => {
                const rowCost = getEstCost(row.promptTokens, row.responseTokens, row.thinkingTokens);
                const isAdmin = row.role === "admin" || row.email?.toLowerCase() === "dhurianiket@gmail.com";
                return (
                  <tr
                    key={idx}
                    className="border-b border-surface/50 hover:bg-surface/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-sm">
                      <div className="font-medium text-sm text-theme">{row.email || row.userId || "Unknown"}</div>
                      {row.displayName && row.email && (
                        <div className="text-xs text-muted font-normal">{row.displayName}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {isAdmin ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          ADMIN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-500/20 text-gray-400">
                          USER
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-sm font-semibold text-theme">
                      {row.documentsUploaded || 0}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-muted">
                      {formatBytes(row.totalStorageBytes || 0)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-blue-500">
                      {(row.totalTokensUsed || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-muted">
                      <span className="text-blue-400">{(row.promptTokens || 0).toLocaleString()}</span>
                      {" / "}
                      <span className="text-emerald-400">{(row.responseTokens || 0).toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-green-500">
                      ${rowCost.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted">
                      {row.lastActive && !isNaN(new Date(row.lastActive).getTime())
                        ? new Date(row.lastActive).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {row.isActiveToday ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Online
                        </span>
                      ) : (
                        <span className="text-xs text-muted">Idle</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Beta Feedback Table */}
      <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl border border-[var(--color-border)] shadow-xl shadow-black/5 p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6 text-amber-500">
          <FileText className="w-5 h-5" />
          <h2 className="text-lg font-bold text-theme">Beta Feedback & Support Inquiries</h2>
        </div>
        <div className="space-y-4">
          {feedbackResponses.length > 0 ? (
            feedbackResponses.map((r, i) => {
              const answers: any[] = [];
              for (const [qId, ans] of Object.entries(r.answers || {})) {
                const text = (ans as any)?.textAnswers?.answers?.[0]?.value;
                if (text) {
                  answers.push({ qId, text });
                }
              }
              const d = new Date(r.lastSubmittedTime);
              return (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm"
                >
                  <div className="text-xs text-muted mb-2">
                    {d.toLocaleString()} (ID: {r.responseId})
                  </div>
                  <div className="space-y-2">
                    {answers.map((a, j) => (
                      <div key={j} className="flex flex-col gap-1">
                        <span className="font-semibold text-[var(--color-text)]">
                          Question {a.qId}
                        </span>
                        <span className="text-muted">{a.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted max-w-sm mx-auto">
              No live feedback tickets pending. Connected to Google Forms API.
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-muted text-xs mt-8">
        Built by{" "}
        <a
          href="https://aniket.aegishealthai.co.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--color-text)] underline decoration-muted transition-colors"
        >
          Aniket Dhuri
        </a>{" "}
        • Version {version}
      </div>
    </div>
  );
}
