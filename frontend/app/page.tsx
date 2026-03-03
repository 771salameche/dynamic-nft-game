'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Shield, Coins, Sparkles, Trophy } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: 'Dynamic Characters',
      description: 'Mint your unique NFT hero that evolves based on on-chain activity.'
    },
    {
      icon: <Coins className="w-8 h-8 text-secondary" />,
      title: 'Stake & Earn',
      description: 'Lock your characters to earn Game Tokens in real-time.'
    },
    {
      icon: <Sparkles className="w-8 h-8 text-primary" />,
      title: 'Breed & Inherit',
      description: 'Combine two max-level heroes to mint a potentially stronger offspring.'
    },
    {
      icon: <Trophy className="w-8 h-8 text-secondary" />,
      title: 'Achievements',
      description: 'Complete daily quests to unlock verifiable soulbound badges.'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16 sm:py-24">
      <div className="text-center space-y-8 max-w-4xl mx-auto">
        <motion.h1
          className="text-5xl sm:text-7xl font-extrabold tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Welcome to{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Morpheum
          </span>
        </motion.h1>

        <motion.p
          className="text-xl text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Mint your unique hero, complete quests, stake for rewards, and conquer the leaderboard in this next-generation on-chain RPG experience powered by Polygon.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-4 pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/mint"
            className="px-8 py-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg transition-transform hover:scale-105"
          >
            Start Your Journey
          </Link>
          <Link
            href="/characters"
            className="px-8 py-4 rounded-full bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground font-semibold text-lg transition-transform hover:scale-105"
          >
            View Gallery
          </Link>
        </motion.div>
      </div>

      <div className="mt-32 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:border-primary/50 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="mb-4 p-3 bg-secondary/10 w-fit rounded-lg">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
