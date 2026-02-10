'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Sparkles, 
  Coins, 
  Heart, 
  Trophy, 
  Zap, 
  Users, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { AnimatedCharacters } from '@/components/landing/AnimatedCharacters';
import { Step } from '@/components/landing/Step';
import { ActivityFeed } from '@/components/landing/ActivityFeed';
import { StatCard } from '@/components/ui/StatCard';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl aspect-square bg-purple-600/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
        
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-center lg:text-left">
            <div className="space-y-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20 text-xs font-black text-purple-400 uppercase tracking-widest mb-6">
                  <Sparkles size={14} />
                  Next-Gen Dynamic NFTs
                </div>
                <h1 className="text-6xl lg:text-8xl font-black leading-[0.9] tracking-tighter uppercase">
                  Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">NFT Army</span>
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg lg:text-xl text-slate-400 max-w-xl font-medium leading-relaxed mx-auto lg:mx-0"
              >
                Mint, evolve, and battle with dynamic NFT characters on Polygon. Your journey from a lone warrior to a legendary commander starts here.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link href="/mint">
                  <Button size="lg" className="h-16 px-10 text-lg font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-purple-900/20">
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button size="lg" variant="outline" className="h-16 px-10 text-lg font-black uppercase tracking-widest rounded-2xl border-slate-800 hover:bg-slate-900">
                    Explore Rankings
                  </Button>
                </Link>
              </motion.div>
            </div>
            
            <div className="relative pointer-events-none select-none">
              <AnimatedCharacters />
            </div>
          </div>
        </div>
      </section>

      {/* Global Stats */}
      <section className="py-20 bg-slate-950/50 border-y border-slate-900">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total Heroes" value="1,240" icon="👥" />
            <StatCard label="Active Players" value="450+" icon="🎮" />
            <StatCard label="Total Staked" value="85%" icon="🔒" />
            <StatCard label="GAME Distributed" value="2.5M" icon="💎" />
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-32 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter">Engineered for <span className="text-purple-500">Excellence</span></h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">Explore the cutting-edge mechanics that power the Dynamic NFT Gaming Ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap size={24} />}
              title="Dynamic Traits"
              description="Your actions reflect on the blockchain. Levels and stats evolve in real-time as you play."
            />
            <FeatureCard
              icon={<Coins size={24} />}
              title="Stake & Earn"
              description="Deploy your heroes to the Staking Vault to earn passive GAME token rewards every second."
            />
            <FeatureCard
              icon={<Heart size={24} />}
              title="Genetic Breeding"
              description="Create the next generation with complex inheritance, mutation, and powerful fusion mechanics."
            />
            <FeatureCard
              icon={<Trophy size={24} />}
              title="Achievements"
              description="Unlock Soulbound badges and claim token rewards for completing legendary challenges."
            />
            <FeatureCard
              icon={<ShieldCheck size={24} />}
              title="Provably Fair"
              description="Powered by Chainlink VRF. Your character's destiny is determined by verifiable on-chain randomness."
            />
            <FeatureCard
              icon={<Users size={24} />}
              title="Hyper-Scalable"
              description="Built on Polygon for lightning-fast transactions and near-zero gas fees for an optimal experience."
            />
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-32 bg-slate-900/30 rounded-[4rem] mx-4 border border-slate-900/50">
        <div className="container mx-auto max-w-7xl px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter leading-tight">Your Path to <br /><span className="text-indigo-500">Legendary</span> Status</h2>
              <div className="space-y-2">
                <Step
                  number={1}
                  title="Summon Your Hero"
                  description="Choose your class and mint your first NFT. Chainlink VRF assigns unique initial stats."
                />
                <Step
                  number={2}
                  title="Forge Your Destiny"
                  description="Level up through quests and training. Watch your NFT's on-chain metadata transform."
                />
                <Step
                  number={3}
                  title="Expand Your Empire"
                  description="Stake for passive income or breed your heroes to discover elite genetic combinations."
                />
                <Step
                  number={4}
                  title="Dominate the Arena"
                  description="Climb the global leaderboards and showcase your collection to the decentralized world."
                />
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-slate-950 border border-slate-800 rounded-[3rem] p-12 overflow-hidden shadow-2xl">
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                  <div className="w-2 h-8 bg-purple-600 rounded-full" />
                  Live Network Activity
                </h3>
                <ActivityFeed limit={6} />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="py-40 relative px-4 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square bg-purple-600/20 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto max-w-4xl text-center relative z-10 space-y-10">
          <h2 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9]">
            The Arena is Waiting <br />For Its <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 italic">Master</span>
          </h2>
          <p className="text-xl text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
            Join thousands of players already building their legendary NFT collections on the decentralized frontier.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/mint">
              <Button size="lg" className="h-20 px-16 text-xl font-black uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-purple-900/40 hover:scale-105 transition-transform">
                Mint Your Hero
                <Sparkles className="ml-3 w-6 h-6" />
              </Button>
            </Link>
          </div>
          <div className="pt-8 flex items-center justify-center gap-8 text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">
            <span>Powered by Chainlink</span>
            <div className="w-1 h-1 bg-slate-800 rounded-full" />
            <span>Built on Polygon</span>
            <div className="w-1 h-1 bg-slate-800 rounded-full" />
            <span>Secured by Ethereum</span>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 border-t border-slate-900/50">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-xl font-black tracking-tighter uppercase">
            Dynamic <span className="text-purple-500">NFT</span> Game
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            © 2026 NEXUS PROTOCOL. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
