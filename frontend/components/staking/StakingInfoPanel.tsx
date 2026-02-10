'use client';

import { motion } from 'framer-motion';
import { Info, Zap, TrendingUp, ShieldCheck, Timer } from 'lucide-react';

export function StakingInfoPanel() {
  const mechanics = [
    {
      title: "Passive XP & Tokens",
      description: "Characters earn GAME tokens and XP every second while staked.",
      icon: <Zap className="w-5 h-5 text-yellow-400" />
    },
    {
      title: "Level Multipliers",
      description: "Higher level characters receive a multiplier on their reward rate.",
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />
    },
    {
      title: "Milestone Bonuses",
      description: "Stake for 30 consecutive days to unlock unique mutation possibilities.",
      icon: <Timer className="w-5 h-5 text-blue-400" />
    },
    {
      title: "Safe & Secure",
      description: "Your NFTs never leave the ecosystem and can be unstaked anytime.",
      icon: <ShieldCheck className="w-5 h-5 text-purple-400" />
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-12 p-8 bg-slate-900/50 rounded-3xl border border-slate-800 shadow-inner"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Info className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-white">Staking Mechanics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {mechanics.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              {item.icon}
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">{item.title}</h4>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {item.description}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 p-4 bg-slate-950/50 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Current Reward Rate</p>
            <p className="text-xl font-black text-white">1.0 GAME <span className="text-sm font-normal text-slate-500">/ hour / level</span></p>
          </div>
        </div>
        
        <div className="h-px w-full md:w-px md:h-12 bg-slate-800" />

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">APY Estimation</p>
            <p className="text-xl font-black text-white">~42.5% <span className="text-sm font-normal text-slate-500">variable</span></p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
