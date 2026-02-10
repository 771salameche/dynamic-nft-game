'use client';

import { useBreedingHistory } from '@/hooks/useBreeding';
import { BreedingPair } from '@/types/game';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronRight, Dna } from 'lucide-react';

interface BreedingHistorySectionProps {
  tokenId?: bigint;
}

export function BreedingHistorySection({ tokenId }: BreedingHistorySectionProps) {
  const { data: history, isLoading } = useBreedingHistory(tokenId || 0n);

  if (!tokenId) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
          <History className="w-5 h-5 text-slate-400" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter">Lineage History</h2>
      </div>

      {isLoading ? (
        <div className="h-40 bg-slate-900/50 rounded-3xl animate-pulse" />
      ) : history && (history as BreedingPair[]).length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {(history as BreedingPair[]).map((pair, i) => (
              <motion.div
                key={pair.timestamp.toString() + i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between group hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Parent 1</span>
                      <span className="font-mono text-white">#{pair.parent1.toString()}</span>
                    </div>
                    <Dna className="w-4 h-4 text-slate-700" />
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Parent 2</span>
                      <span className="font-mono text-white">#{pair.parent2.toString()}</span>
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-slate-800" />
                  
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-purple-500 uppercase">Offspring</span>
                    <span className="font-mono text-white font-bold text-lg">#{pair.offspring.toString()}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">{formatDistanceToNow(Number(pair.timestamp) * 1000)} ago</p>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Laboratory Record</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No breeding records found for this character</p>
        </div>
      )}
    </div>
  );
}
