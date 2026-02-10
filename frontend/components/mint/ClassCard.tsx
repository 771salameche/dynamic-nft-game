'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Brain, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassCardProps {
  name: string;
  description: string;
  stats: {
    strength: number;
    agility: number;
    intelligence: number;
  };
  isSelected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
}

export function ClassCard({
  name,
  description,
  stats,
  isSelected,
  onSelect,
  icon
}: ClassCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        "relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 h-full flex flex-col",
        isSelected 
          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
          : "border-border bg-card hover:border-primary/50"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "p-3 rounded-lg bg-primary/20 text-primary transition-colors",
          isSelected && "bg-primary text-primary-foreground"
        )}>
          {icon}
        </div>
        {isSelected && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-primary text-primary-foreground rounded-full p-1"
          >
            <Check className="w-4 h-4" />
          </motion.div>
        )}
      </div>
      
      <h3 className="text-xl font-bold mb-2 capitalize">{name}</h3>
      <p className="text-muted-foreground text-sm mb-6 flex-grow">{description}</p>
      
      <div className="space-y-4">
        <StatRow label="Strength" value={stats.strength} icon={<Shield className="w-4 h-4" />} color="text-red-500" />
        <StatRow label="Agility" value={stats.agility} icon={<Zap className="w-4 h-4" />} color="text-emerald-500" />
        <StatRow label="Intelligence" value={stats.intelligence} icon={<Brain className="w-4 h-4" />} color="text-blue-500" />
      </div>
    </motion.div>
  );
}

function StatRow({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className={color}>{icon}</span>
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className="font-mono">{value}</span>
      </div>
      <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full bg-primary", color.replace('text-', 'bg-'))}
        />
      </div>
    </div>
  );
}
