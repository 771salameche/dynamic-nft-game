'use client';

import { motion } from 'framer-motion';
import { Address } from 'viem';
import { Sword, Heart, Lock, Trophy, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface ActivityItem {
  id: string;
  type: 'mint' | 'breed' | 'stake' | 'achievement' | 'level-up';
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
        type: 'achievement',
        title: 'First Step',
        description: 'Unlocked "First Hero" achievement',
        timestamp: now - 3600,
      },
      {
        id: '2',
        type: 'level-up',
        title: 'Level Up!',
        description: 'Character #12 reached Level 10',
        timestamp: now - 86400,
      },
      {
        id: '3',
        type: 'stake',
        title: 'Staking',
        description: 'Staked 3 characters in the vault',
        timestamp: now - 172800,
      },
    ]);
  }, [address]);

  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
      {activities.map((activity, i) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
        >
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-800 bg-slate-900 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 group-hover:scale-110 group-hover:border-purple-500 group-hover:text-purple-500 transition-all duration-300">
            {getActivityIcon(activity.type)}
          </div>
          
          {/* Content */}
          <div className="w-[calc(100%-4rem)] md:w-[45%] p-4 rounded-2xl border border-slate-800 bg-slate-900/50 shadow group-hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between space-x-2 mb-1">
              <div className="font-bold text-white uppercase text-xs tracking-wider">{activity.title}</div>
              <time className="font-mono text-[10px] text-slate-500">{formatDate(activity.timestamp)}</time>
            </div>
            <div className="text-slate-400 text-sm">{activity.description}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'mint': return <Sparkles size={16} />;
    case 'breed': return <Heart size={16} />;
    case 'stake': return <Lock size={16} />;
    case 'achievement': return <Trophy size={16} />;
    case 'level-up': return <Sword size={16} />;
  }
}
