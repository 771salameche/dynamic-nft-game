'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionStatusProps {
  status: 'idle' | 'pending' | 'success' | 'error';
  hash?: string;
  error?: string;
}

export function TransactionStatus({ status, hash, error }: TransactionStatusProps) {
  if (status === 'idle') return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "mt-4 p-4 rounded-2xl border flex items-center gap-4 overflow-hidden",
        status === 'pending' && "bg-blue-500/10 border-blue-500/20 text-blue-400",
        status === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        status === 'error' && "bg-red-500/10 border-red-500/20 text-red-400"
      )}
    >
      <div className="shrink-0">
        {status === 'pending' && <Loader2 className="w-5 h-5 animate-spin" />}
        {status === 'success' && <CheckCircle2 className="w-5 h-5" />}
        {status === 'error' && <XCircle className="w-5 h-5" />}
      </div>

      <div className="flex-grow min-w-0">
        <p className="text-sm font-black uppercase tracking-tight">
          {status === 'pending' && "Transaction Pending..."}
          {status === 'success' && "Transaction Confirmed"}
          {status === 'error' && "Transaction Failed"}
        </p>
        {hash && (
          <a
            href={`https://amoy.polygonscan.com/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
          >
            View on Explorer
            <ExternalLink size={10} />
          </a>
        )}
        {status === 'error' && error && (
          <p className="text-[10px] font-medium truncate mt-1">{error}</p>
        )}
      </div>
    </motion.div>
  );
}
