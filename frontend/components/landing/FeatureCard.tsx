'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 group"
    >
      <div className="w-14 h-14 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-lg shadow-purple-900/20">
        {icon}
      </div>
      <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-3">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed font-medium">{description}</p>
    </motion.div>
  );
}
