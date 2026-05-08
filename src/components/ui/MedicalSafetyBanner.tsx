import React from 'react';
import { ShieldAlert, AlertTriangle, Info } from 'lucide-react';

export enum SafetyLevel {
  INFO = 'info',
  WARNING = 'warning',
  URGENT = 'urgent',
  EMERGENCY = 'emergency',
}

interface MedicalSafetyBannerProps {
  level: SafetyLevel;
  message: string;
  subMessage?: string;
}

export default function MedicalSafetyBanner({ level, message, subMessage }: MedicalSafetyBannerProps) {
  const getStyles = () => {
    switch (level) {
      case SafetyLevel.EMERGENCY:
        return {
          bg: 'bg-red-500',
          text: 'text-white',
          border: 'border-red-600',
          icon: ShieldAlert,
        };
      case SafetyLevel.URGENT:
        return {
          bg: 'bg-red-50',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: AlertTriangle,
        };
      case SafetyLevel.WARNING:
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-200',
          icon: AlertTriangle,
        };
      default:
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-800',
          border: 'border-blue-200',
          icon: Info,
        };
    }
  };

  const styles = getStyles();
  const Icon = styles.icon;

  return (
    <div className={`p-4 md:p-6 rounded-3xl border ${styles.bg} ${styles.text} ${styles.border} flex gap-4 items-start shadow-sm`}>
      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-white/20`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="font-bold text-sm uppercase tracking-wide mb-1 leading-tight">{message}</p>
        {subMessage && <p className="text-sm opacity-90 leading-relaxed font-normal">{subMessage}</p>}
      </div>
    </div>
  );
}
