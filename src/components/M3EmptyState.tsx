import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface M3EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  badge?: string;
}

export const M3EmptyState: React.FC<M3EmptyStateProps> = ({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  badge
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-5 my-4">
      {badge && (
        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold uppercase tracking-widest rounded-full border border-indigo-200/50">
          {badge}
        </span>
      )}
      
      <div className="w-16 h-16 rounded-xl bg-blue-50/50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 flex items-center justify-center border border-blue-900/20 shadow-inner">
        <Icon size={32} strokeWidth={2} />
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{subtitle}</p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-900"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
