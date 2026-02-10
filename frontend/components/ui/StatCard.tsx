'use client';

import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  icon?: string;
}

export function StatCard({ label, value, suffix, icon }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="text-6xl">{icon}</span>
      </div>
      
      <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">{label}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-white">{value}</span>
        {suffix && <span className="text-slate-500 font-bold text-sm">{suffix}</span>}
      </div>
      
      <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 w-0 group-hover:w-full transition-all duration-500" />
    </motion.div>
  );
}
