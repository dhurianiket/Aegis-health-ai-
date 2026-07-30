import React from "react";
import {
  Database,
  Smartphone,
  FileJson,
  Table,
  CheckCircle2,
  ArrowRight,
  Apple,
  Chrome,
} from "lucide-react";
import { motion } from "motion/react";
import { exportToCSV, exportToFHIR } from "../../services/integrationService";

interface IntegrationsPanelProps {
  activeProfile: any;
}

export default function IntegrationsPanel({
  activeProfile,
}: IntegrationsPanelProps) {
  const integrations = [
    {
      id: "apple",
      name: "Apple Health",
      icon: Apple,
      color: "bg-black text-white",
      status: "Ready",
      description: "Sync vitals, steps and sleep data directly from HealthKit.",
    },
    {
      id: "google",
      name: "Google Fit",
      icon: Chrome,
      color: "bg-blue-600 text-white",
      status: "Available",
      description:
        "Import activity logs and biometric measurements from Google Account.",
    },
  ];

  const handleCSVExport = () => {
    if (activeProfile?.labValues) {
      exportToCSV(activeProfile.labValues, `Labs_${activeProfile.name}.csv`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -4 }}
            className="bg-slate-800/40 border border-white/5 p-6 rounded-3xl flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className={`p-3 rounded-2xl ${item.color} shadow-lg`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                  {item.status}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>

            <button className="mt-8 flex items-center gap-2 text-indigo-400 font-bold text-sm hover:text-indigo-300 transition-colors group-hover:translate-x-1 duration-300">
              Connect Integration <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="bg-slate-800/40 border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Data Portability
            </h3>
          </div>
          <p className="text-slate-400 text-sm">
            Export your health data in industry-standard formats for EHR
            compatibility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* FHIR Export */}
          <div
            className="p-8 border-r border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
            onClick={() => exportToFHIR(activeProfile)}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                <FileJson className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white">FHIR JSON Export</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Standardized format used by healthcare systems like Epic and
              Cerner for seamless record transfers.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> V1.0.0
              Compatible
            </div>
          </div>

          {/* CSV Export */}
          <div
            className="p-8 hover:bg-white/5 transition-colors cursor-pointer group"
            onClick={handleCSVExport}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                <Table className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white">Spreadsheet (CSV)</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Download your complete lab history and vital trends for custom
              analysis in Excel or Google Sheets.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Formatted
              for Analysis
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
