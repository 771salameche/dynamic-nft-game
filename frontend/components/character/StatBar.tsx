'use client';

import { motion } from 'framer-motion';

interface StatBarProps {
  label: string;
  value: bigint | number;
  max: number;
  color?: string;
}

export function StatBar({ label, value, max, color = 'bg-blue-500' }: StatBarProps) {
  const percentage = Math.min((Number(value) / max) * 100, 100);

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
        <span>{label}</span>
        <span>{value.toString()} / {max}</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`}
        />
      </div>
    </div>
  );
}

interface ProgressBarProps {
  current: bigint | number;
  max: bigint | number;
  label?: string;
  color?: string;
}

export function ProgressBar({ current, max, label, color = 'bg-purple-500' }: ProgressBarProps) {
  const percentage = max === 0n || max === 0 ? 0 : Math.min((Number(current) / Number(max)) * 100, 100);

  return (
    <div className="w-full space-y-1">
      {label && (
        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
          <span>{label}</span>
          <span>{current.toString()} / {max.toString()}</span>
        </div>
      )}
      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700 p-[2px]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
}
