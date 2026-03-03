'use client';

import { motion } from 'framer-motion';
import { Address } from 'viem';
import { Sword, Heart, Lock, Trophy, Sparkles, Zap, Flame } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface ActivityItem {
  id: string;
  type: 'mint' | 'breed' | 'stake' | 'achievement' | 'level-up' | 'burn' | 'quest';
  title: string;
  description: string;
  timestamp: number;
}

export function ActivityTimeline({ address }: { address: Address }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!address) return;
    const now = Math.floor(Date.now() / 1000);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActivities([
      {
        id: '1',
        type: 'quest',
        title: 'Bounty Claimed',
        description: 'Completed Daily Quest: "The Dragon Slayer"',
        timestamp: now - 1800,
      },
      {
        id: '2',
        type: 'achievement',
        title: 'Elite Status',
        description: 'Unlocked "Veteran Warrior" achievement',
        timestamp: now - 7200,
      },
      {
        id: '3',
        type: 'level-up',
        title: 'Evolution',
        description: 'Character #12 reached Level 25',
        timestamp: now - 43200,
      },
      {
        id: '4',
        type: 'breed',
        title: 'New Legacy',
        description: 'Bred Character #5 and #8 into a new offspring',
        timestamp: now - 172800,
      },
      {
        id: '5',
        type: 'mint',
        title: 'Genesis',
        description: 'Summoned first Warrior champion',
        timestamp: now - 604800,
      },
    ]);
  }, [address]);

  return (
    <div className="relative">
      {/* Central Line */}
      <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/50 via-slate-800 to-transparent" />

      <div className="space-y-12">
        {activities.map((activity, i) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative pl-12 group"
          >
            {/* Dot/Icon container */}
            <div className="absolute left-0 top-0 w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center z-10 group-hover:border-purple-500/50 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all duration-300">
              <div className="text-purple-500">
                {getActivityIcon(activity.type)}
              </div>
            </div>
            
            {/* Content Card */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-white group-hover:text-purple-400 transition-colors">
                  {activity.title}
                </span>
                <span className="hidden sm:block text-slate-700">•</span>
                <time className="text-[10px] font-bold text-slate-500 uppercase">
                  {formatDate(activity.timestamp)}
                </time>
              </div>
              <p className="text-sm text-slate-400 font-medium">
                {activity.description}
              </p>
              
              {/* Optional dynamic tag based on type */}
              <div className="pt-1">
                <span className="text-[8px] px-2 py-0.5 rounded-full bg-slate-900 border border-white/5 text-slate-500 font-black uppercase tracking-tighter group-hover:border-purple-500/20 group-hover:text-slate-400 transition-colors">
                  System::{activity.type}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'mint': return <Sparkles size={18} />;
    case 'breed': return <Heart size={18} />;
    case 'stake': return <Lock size={18} />;
    case 'achievement': return <Trophy size={18} />;
    case 'level-up': return <Zap size={18} />;
    case 'burn': return <Flame size={18} />;
    case 'quest': return <Sword size={18} />;
    default: return <Zap size={18} />;
  }
}
