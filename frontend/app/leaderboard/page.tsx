'use client';

import { motion } from 'framer-motion';
import { Trophy, Medal, Crown } from 'lucide-react';
import Link from 'next/link';

// Mock data for leaderboard since there's no direct "getAllTokens" on the basic ERC721 without The Graph
const MOCK_LEADERBOARD = [
  { rank: 1, id: '42', owner: '0x1234...5678', level: 50, class: 'Warrior', score: 9800 },
  { rank: 2, id: '7', owner: '0x8765...4321', level: 48, class: 'Mage', score: 9450 },
  { rank: 3, id: '15', owner: '0xabcd...efgh', level: 45, class: 'Rogue', score: 8900 },
  { rank: 4, id: '89', owner: '0x9999...8888', level: 42, class: 'Mage', score: 8200 },
  { rank: 5, id: '3', owner: '0x1111...2222', level: 40, class: 'Warrior', score: 7800 },
];

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center justify-center gap-4">
          <Crown className="w-12 h-12 text-yellow-500" />
          Global Leaderboard
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The most powerful heroes in the realm. Level up your character by engaging in quests and staking to climb the ranks.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/10 border-b border-border text-muted-foreground text-sm uppercase tracking-wider">
                <th className="p-4 font-bold">Rank</th>
                <th className="p-4 font-bold">Hero</th>
                <th className="p-4 font-bold">Owner</th>
                <th className="p-4 font-bold">Class</th>
                <th className="p-4 font-bold text-right">Level</th>
                <th className="p-4 font-bold text-right">Power Score</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_LEADERBOARD.map((entry, idx) => (
                <motion.tr
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="border-b border-border/50 hover:bg-primary/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {entry.rank === 1 && <Trophy className="w-5 h-5 text-yellow-500" />}
                      {entry.rank === 2 && <Medal className="w-5 h-5 text-gray-400" />}
                      {entry.rank === 3 && <Medal className="w-5 h-5 text-orange-600" />}
                      <span className={`font-bold ${entry.rank <= 3 ? 'text-lg' : ''}`}>
                        #{entry.rank}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Link href={`/character/${entry.id}`} className="font-bold text-primary hover:underline">
                      Hero #{entry.id}
                    </Link>
                  </td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">
                    {entry.owner}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-secondary/20 text-secondary text-xs rounded-md font-bold uppercase">
                      {entry.class}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-lg">
                    {entry.level}
                  </td>
                  <td className="p-4 text-right text-primary font-mono font-bold">
                    {entry.score.toLocaleString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-muted/20 border-t border-border text-center text-sm text-muted-foreground">
          Leaderboard updates globally every 24 hours. Connect to an indexer like The Graph for real-time leaderboards.
        </div>
      </div>
    </div>
  );
}
