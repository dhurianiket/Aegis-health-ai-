import React from "react";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteLoungeDataDialogProps {
  open: boolean;
  profileFirstName: string | null;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteLoungeDataDialog({ open, profileFirstName, deleting, error, onCancel, onConfirm }: DeleteLoungeDataDialogProps) {
  if (!open) return null;
  const who = profileFirstName ?? "this profile";
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-lounge-title"
        aria-describedby="delete-lounge-desc"
        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/10 p-6 text-slate-900 dark:text-slate-100 shadow-2xl"
      >
        <h3 id="delete-lounge-title" className="text-lg font-bold flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-600" /> Delete Lounge data?
        </h3>
        <p id="delete-lounge-desc" className="mt-2 text-[14px] leading-relaxed text-slate-700 dark:text-slate-300">
          This permanently deletes all Health Guides (AI) conversations, saved guide suggestions/referrals and cached guide summaries for {who}. Your reports and medicines are not affected. This cannot be undone.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-[13px] font-semibold text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />} Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}
