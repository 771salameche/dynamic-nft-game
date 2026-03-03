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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 bg-slate-900/30 backdrop-blur-sm rounded-[1.5rem] border border-white/5 relative overflow-hidden group hover:bg-slate-900/50 transition-all duration-300"
    >
      <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-500">
        <span className="text-7xl pointer-events-none">{icon}</span>
      </div>
      
      <div className="relative z-10">
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-white tracking-tighter">{value}</span>
          {suffix && <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">{suffix}</span>}
        </div>
      </div>
      
      {/* Subtle bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}
