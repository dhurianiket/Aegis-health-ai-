import React, { useEffect, useState } from "react";
import { getAllUsersUsage } from "../../services/usageService";
import { ShieldAlert, Database, FileText, Zap } from "lucide-react";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      const data = await getAllUsersUsage();
      setUsers(data);
      setLoading(false);
    };
    fetchUsage();
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 MB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };
  
  const currentMonth = new Date().toISOString().substring(0, 7);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin text-[var(--color-primary)]">
          <Zap className="w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-[var(--color-primary)]" />
        <h1 className="text-2xl font-bold tracking-tight">Admin Usage Dashboard</h1>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-white/40 shadow-xl shadow-[var(--color-primary)]/5 p-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface">
                <th className="py-4 px-6 font-semibold text-sm text-muted uppercase tracking-wider">User Email</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted uppercase tracking-wider">Documents</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted uppercase tracking-wider">Storage Used</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted uppercase tracking-wider">Total Tokens</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted uppercase tracking-wider">This Month</th>
                <th className="py-4 px-6 font-semibold text-sm text-muted uppercase tracking-wider">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row, idx) => (
                <tr key={idx} className="border-b border-surface/50 hover:bg-surface/30 transition-colors">
                  <td className="py-4 px-6 font-medium">{row.email || row.userId || 'Unknown'}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                       <FileText className="w-4 h-4 text-muted" />
                       {row.documentsUploaded || 0}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                       <Database className="w-4 h-4 text-muted" />
                       {formatBytes(row.totalStorageBytes || 0)}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-mono text-[var(--color-primary)]">
                    {(row.totalTokensUsed || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    {((row.monthlyUsage && row.monthlyUsage[currentMonth]) || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-sm text-muted">
                    {row.lastActive ? new Date(row.lastActive).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                   <td colSpan={6} className="py-12 text-center text-muted">No usage data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
