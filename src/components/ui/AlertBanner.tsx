import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Info, Bell, X, ShieldAlert, HeartPulse } from 'lucide-react';
import { HealthAlert } from '../../types/alerts';

interface AlertBannerProps {
  alert: HealthAlert;
  onDismiss: (id: string) => void;
  onAction?: (id: string) => void;
}

export default function AlertBanner({ alert, onDismiss, onAction }: AlertBannerProps) {
  const getSeverityStyles = () => {
    switch (alert.severity) {
      case 'critical':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          iconColor: 'text-red-400',
          titleColor: 'text-red-300',
          Icon: ShieldAlert,
        };
      case 'high':
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          iconColor: 'text-orange-400',
          titleColor: 'text-orange-300',
          Icon: AlertTriangle,
        };
      case 'moderate':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          iconColor: 'text-yellow-400',
          titleColor: 'text-yellow-300',
          Icon: Bell,
        };
      case 'normal':
      default:
        return {
          bg: 'bg-indigo-500/10',
          border: 'border-indigo-500/30',
          iconColor: 'text-indigo-400',
          titleColor: 'text-indigo-300',
          Icon: Info,
        };
    }
  };

  const styles = getSeverityStyles();
  const Icon = styles.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
      layout
      role="alert"
      aria-live="polite"
      className={`relative overflow-hidden w-full p-4 md:p-5 rounded-2xl border backdrop-blur-xl shadow-lg flex flex-col md:flex-row items-start md:items-center gap-4 transition-colors ${styles.bg} ${styles.border}`}
    >
      {/* Decorative pulse for critical */}
      {alert.severity === 'critical' && (
        <span className="absolute top-0 left-0 w-1 h-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" aria-hidden="true" />
      )}

      <div className={`p-3 rounded-full bg-white/5 border border-white/5 shrink-0 ${styles.iconColor}`} aria-hidden="true">
        <Icon className="w-6 h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-black/20 ${styles.titleColor} border-white/10`}>
            {alert.type.replace('_', ' ')}
          </span>
          {alert.severity === 'critical' && (
             <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-red-400 tracking-wider">
               <HeartPulse className="w-3 h-3 animate-pulse" /> Urgent
             </span>
          )}
        </div>
        <h4 className={`text-base font-bold tracking-tight text-white mb-1`}>
          {alert.title}
        </h4>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          {alert.description}
        </p>
      </div>

      <div className="flex flex-row md:flex-col items-center justify-end gap-2 shrink-0 self-end md:self-center mt-2 md:mt-0 w-full md:w-auto">
        {onAction && (
          <button 
            onClick={() => onAction(alert.id)}
            aria-label={`Take action on ${alert.title}`}
            className="flex-1 md:flex-none text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors border border-white/5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
          >
            Take Action
          </button>
        )}
        <button 
          onClick={() => onDismiss(alert.id)}
          aria-label={`Dismiss ${alert.title}`}
          className="flex-1 md:flex-none text-xs font-medium text-slate-400 hover:text-white px-4 py-2 rounded-lg transition-colors bg-black/20 hover:bg-black/40 border border-transparent hover:border-white/10 focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
        >
          Dismiss
        </button>
      </div>

      <button
        onClick={() => onDismiss(alert.id)}
        aria-label="Dismiss alert"
        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-full"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
