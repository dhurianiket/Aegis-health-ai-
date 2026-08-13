import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  Upload,
  Pill,
  Calendar,
  Users,
  MessageSquare,
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  FileText,
  Stethoscope,
  Settings,
  User,
  MoreHorizontal,
  ShieldAlert,
  Map,
} from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { useProfile } from "../../context/ProfileContext";
import { useAuth } from "../../context/AuthContext";

export interface AppNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenChat: () => void;
}

const ALL_DESKTOP_TABS = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "upload", label: "Ingest", icon: Upload },
  { id: "reports", label: "Lab Reports", icon: FileText },
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "sbar", label: "SBAR Summary", icon: FileText },
  { id: "specialist", label: "Specialist Lounge", icon: Stethoscope },
  { id: "chat", label: "Aura AI", icon: Sparkles },
  null, // divider
  { id: "caremap", label: "Care Map", icon: Map },
  { id: "calendar", label: "Calendar Sync", icon: Calendar },
  { id: "medications", label: "Medications", icon: Pill },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "profile", label: "Profile", icon: User },
];

const bottomTabs = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "upload", label: "Upload", icon: Upload },
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "chat", label: "Aura AI", icon: Sparkles },
  { id: "more", label: "More", icon: MoreHorizontal },
];

export function AppNav({ activeTab, onTabChange, onOpenChat }: AppNavProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { activeProfile } = useProfile();
  const { user } = useAuth();
  
  const desktopTabs = [...ALL_DESKTOP_TABS];
  if (user?.email === "dhurianiket@gmail.com") {
    desktopTabs.push({ id: "admin", label: "Admin Console", icon: ShieldAlert });
  }

  const handleTabChange = (id: string) => {
    if (id === "chat") {
      onOpenChat();
      return;
    }
    if (id === "more") {
      setIsMoreOpen(true);
      return;
    }
    onTabChange(id);
    setIsMoreOpen(false);
  };

  const needsProfileUpdate = !activeProfile || !activeProfile.dob || !activeProfile.gender;

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] shrink-0 h-full">
        <div className="p-6 pb-2 shrink-0">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[var(--color-primary)] rounded-[12px] flex items-center justify-center shadow-sm shrink-0">
              <Activity size={24} className="text-white" strokeWidth={2} />
            </div>
            <span className="font-semibold text-lg tracking-tight text-[var(--color-text)]">
              Aegis <span className="font-normal opacity-70">Health</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 overflow-y-auto space-y-1">
          {desktopTabs.map((tab, idx) => {
            if (tab === null) {
              return (
                <div
                  key={`divider-${idx}`}
                  className="my-4 border-t border-[var(--color-border)] mx-4"
                ></div>
              );
            }
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-all duration-200 focus:outline-none relative group cursor-pointer ${
                  isActive
                    ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-semibold shadow-sm shadow-[var(--color-primary)]/10"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] font-medium"
                }`}
              >
                <tab.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                />
                <span className="text-sm tracking-tight">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="desktop-nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-6 bg-[var(--color-primary)] rounded-full shadow-sm shadow-[var(--color-primary)]/50"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-bg)]/80 backdrop-blur-xl border-t border-[var(--color-border)] z-50 pb-safe pointer-events-auto">
        <div className="flex items-center justify-around px-2 py-2 relative pointer-events-auto">
          {bottomTabs.map((tab) => {
            const isActive =
              activeTab === tab.id ||
              (tab.id === "more" &&
                [
                  "sbar",
                  "specialist",
                  "medications",
                  "settings",
                  "profile",
                  "caremap",
                  "calendar",
                ].includes(activeTab));

            if (tab.id === "upload") {
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  aria-label="Upload Document"
                className="flex flex-col items-center justify-center -mt-6 focus:outline-none relative z-10 pointer-events-auto"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 bg-[var(--color-primary)] text-white`}
                  >
                    <Upload size={24} strokeWidth={2} />
                  </div>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] w-16 h-12 gap-1 rounded-xl transition-colors focus:outline-none relative pointer-events-auto ${
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-medium leading-none">
                  {tab.label}
                </span>
                {tab.id === "more" && needsProfileUpdate && (
                  <div className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full border border-[var(--color-bg)]" />
                )}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-[10px] left-1/2 -translate-x-1/2 w-6 h-[2px] bg-[var(--color-primary)] rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <BottomSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)}>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleTabChange("settings")}
            className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex flex-col items-center gap-3 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <Settings className="w-8 h-8 text-[var(--color-primary)]" />
            <span className="font-medium text-sm text-[var(--color-text)]">
              Settings
            </span>
            {needsProfileUpdate && (
              <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold uppercase">
                Update
              </div>
            )}
          </button>
          <button
            onClick={() => handleTabChange("caremap")}
            className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex flex-col items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <Map className="w-8 h-8 text-[var(--color-primary)] animate-pulse" style={{ animationDuration: "3s" }} />
            <span className="font-medium text-sm text-[var(--color-text)]">
              Care Map
            </span>
          </button>
          <button
            onClick={() => handleTabChange("calendar")}
            className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex flex-col items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <Calendar className="w-8 h-8 text-[var(--color-primary)]" />
            <span className="font-medium text-sm text-[var(--color-text)]">
              Calendar Sync
            </span>
          </button>
          <button
            onClick={() => handleTabChange("trends")}
            className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex flex-col items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <TrendingUp className="w-8 h-8 text-[var(--color-primary)]" />
            <span className="font-medium text-sm text-[var(--color-text)]">
              Trends
            </span>
          </button>
          <button
            onClick={() => handleTabChange("sbar")}
            className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex flex-col items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <FileText className="w-8 h-8 text-[var(--color-primary)]" />
            <span className="font-medium text-sm text-[var(--color-text)]">
              SBAR Summary
            </span>
          </button>
          <button
            onClick={() => handleTabChange("specialist")}
            className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex flex-col items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <Stethoscope className="w-8 h-8 text-[var(--color-primary)]" />
            <span className="font-medium text-sm text-[var(--color-text)]">
              Specialist Lounge
            </span>
          </button>
          <button
            onClick={() => handleTabChange("medications")}
            className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex flex-col items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <Pill className="w-8 h-8 text-[var(--color-primary)]" />
            <span className="font-medium text-sm text-[var(--color-text)]">
              Medications
            </span>
          </button>
          <button
            onClick={() => handleTabChange("profile")}
            className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex flex-col items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <User className="w-8 h-8 text-[var(--color-primary)]" />
            <span className="font-medium text-sm text-[var(--color-text)]">
              Profile
            </span>
          </button>
          {user?.email === "dhurianiket@gmail.com" && (
             <button
              onClick={() => handleTabChange("admin")}
              className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex flex-col items-center gap-3 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <ShieldAlert className="w-8 h-8 text-[var(--color-primary)]" />
              <span className="font-medium text-sm text-[var(--color-text)]">
                Admin Console
              </span>
            </button>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
