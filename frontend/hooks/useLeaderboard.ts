'use client';

import { useState, useEffect } from 'react';
import { Address } from 'viem';

export interface LeaderboardEntry {
  address: Address;
  score: number;
  charactersCount: number;
  rank: number;
  change: 'up' | 'down' | 'same';
}

export function useLeaderboard(category: string, timeframe: string) {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    // Simulate API fetch from The Graph
    const timer = setTimeout(() => {
      const mockData: LeaderboardEntry[] = [
        {
          address: '0x1234...5678' as Address,
          score: category === 'level' ? 85 : category === 'power' ? 12500 : 450,
          charactersCount: 12,
          rank: 1,
          change: 'same'
        },
        {
          address: '0xabcd...efgh' as Address,
          score: category === 'level' ? 72 : category === 'power' ? 10200 : 380,
          charactersCount: 8,
          rank: 2,
          change: 'up'
        },
        {
          address: '0x9876...5432' as Address,
          score: category === 'level' ? 68 : category === 'power' ? 9800 : 350,
          charactersCount: 15,
          rank: 3,
          change: 'down'
        },
        // More mock entries...
      ];
      setData(mockData);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [category, timeframe]);

  return { data, isLoading };
}

export function useYourRank(address: Address | undefined, category: string) {
    const [rank, setRank] = useState<number | null>(null);
    
    useEffect(() => {
        if (!address) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRank(42); // Mock rank
    }, [address, category]);

    return { rank };
}
