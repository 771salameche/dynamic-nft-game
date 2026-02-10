'use client';

import { Trophy, Star, X } from 'lucide-react';
import { toast, Toast } from 'react-hot-toast';

interface AchievementNotificationProps {
  name: string;
  xpReward: string;
  tokenReward: string;
  t: Toast;
}

export function AchievementNotification({ name, xpReward, tokenReward, t }: AchievementNotificationProps) {
  return (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-slate-900 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-purple-500/50 border border-purple-500/20 overflow-hidden`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
              <Trophy className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-1">
              Achievement Unlocked!
            </p>
            <p className="text-lg font-black text-white leading-tight uppercase tracking-tight">
              {name}
            </p>
            <div className="mt-2 flex gap-3">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                <span className="text-xs font-bold text-slate-300">+{xpReward} XP</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs font-bold text-slate-300">+{tokenReward} GAME</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex border-l border-slate-800">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-slate-500 hover:text-white focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export function showAchievementToast(name: string, xpReward: string, tokenReward: string) {
  toast.custom((t) => (
    <AchievementNotification
      name={name}
      xpReward={xpReward}
      tokenReward={tokenReward}
      t={t}
    />
  ), {
    duration: 5000,
    position: 'top-right',
  });
}
