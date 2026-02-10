'use client';

import { motion } from 'framer-motion';

interface StepProps {
  number: number;
  title: string;
  description: string;
}

export function Step({ number, title, description }: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: number * 0.1 }}
      className="flex gap-6 relative"
    >
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-purple-600 flex items-center justify-center text-white font-black text-xl shadow-[0_0_15px_rgba(147,51,234,0.3)] z-10">
          {number}
        </div>
        {number < 4 && (
          <div className="w-0.5 h-full bg-gradient-to-b from-purple-600 to-transparent -mb-12 mt-2 opacity-20" />
        )}
      </div>
      <div className="pb-12">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{title}</h3>
        <p className="text-slate-400 font-medium leading-relaxed max-w-sm">{description}</p>
      </div>
    </motion.div>
  );
}
