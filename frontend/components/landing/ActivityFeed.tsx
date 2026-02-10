'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Sparkles, Heart, Zap, Trophy, Shield } from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: 'mint' | 'breed' | 'fuse' | 'achievement' | 'stake';
  user: string;
  details: string;
  timestamp: number;
}

export function ActivityFeed({ limit = 5 }: { limit?: number }) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const now = Date.now();
    const initialEvents: ActivityEvent[] = [
      { id: '1', type: 'mint', user: '0x71C...3921', details: 'Summoned a Warrior', timestamp: now },
      { id: '2', type: 'stake', user: '0x12A...9821', details: 'Staked 3 Heroes', timestamp: now - 60000 },
      { id: '3', type: 'breed', user: '0x99B...1122', details: 'Bred a Gen 2 Mage', timestamp: now - 120000 },
      { id: '4', type: 'achievement', user: '0x44D...5566', details: 'Unlocked "Pro Breeder"', timestamp: now - 180000 },
      { id: '5', type: 'fuse', user: '0xCC1...DD22', details: 'Created a Fused Hero', timestamp: now - 240000 },
    ];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEvents(initialEvents.slice(0, limit));
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      const types: ActivityEvent['type'][] = ['mint', 'breed', 'fuse', 'achievement', 'stake'];
      const type = types[Math.floor(Math.random() * types.length)];
      const newEvent: ActivityEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        user: `0x${Math.random().toString(16).substr(2, 3)}...${Math.random().toString(16).substr(2, 4)}`.toUpperCase(),
        details: type === 'mint' ? 'Summoned a new Hero' : 
                 type === 'breed' ? 'Created a new Generation' :
                 type === 'fuse' ? 'Initiated Fusion' :
                 type === 'stake' ? 'Staked a Character' : 'Unlocked Achievement',
        timestamp: Date.now()
      };
      
      setEvents(prev => [newEvent, ...prev].slice(0, limit));
    }, 8000);

    return () => clearInterval(interval);
  }, [limit]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <AnimatePresence mode="popLayout">
        {events.map((event) => (
          <motion.div
            key={event.id}
            layout
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getEventBg(event.type)}`}>
              {getEventIcon(event.type)}
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-purple-400">{event.user}</span>
                <span className="text-[10px] text-slate-600 font-bold uppercase">Now</span>
              </div>
              <p className="text-sm font-black text-white uppercase tracking-tight">{event.details}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function getEventIcon(type: ActivityEvent['type']) {
  switch (type) {
    case 'mint': return <Sparkles size={16} className="text-yellow-500" />;
    case 'breed': return <Heart size={16} className="text-pink-500" />;
    case 'fuse': return <Zap size={16} className="text-cyan-500" />;
    case 'achievement': return <Trophy size={16} className="text-orange-500" />;
    case 'stake': return <Shield size={16} className="text-emerald-500" />;
  }
}

function getEventBg(type: ActivityEvent['type']) {
  switch (type) {
    case 'mint': return 'bg-yellow-500/10';
    case 'breed': return 'bg-pink-500/10';
    case 'fuse': return 'bg-cyan-500/10';
    case 'achievement': return 'bg-orange-500/10';
    case 'stake': return 'bg-emerald-500/10';
  }
}
