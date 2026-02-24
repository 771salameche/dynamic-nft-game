'use client';

import { ActiveQuest } from '@/components/quests/ActiveQuest';
import { QuestHistory } from '@/components/quests/QuestHistory';
import { motion } from 'framer-motion';

export default function QuestsPage() {
    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-purple-500/30">

            {/* Background Glow */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[0%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full"></div>
            </div>

            <main className="container mx-auto px-6 py-16 max-w-6xl">

                {/* Hero Section */}
                <header className="mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-4 mb-4"
                    >
                        <div className="h-0.5 w-12 bg-gradient-to-r from-purple-500 to-transparent"></div>
                        <span className="text-purple-400 font-bold uppercase tracking-[0.3em] text-xs">Dynamic Personalization</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500"
                    >
                        AI-Powered <span className="text-purple-500">Quests</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-400 max-w-2xl leading-relaxed"
                    >
                        Forge your legacy through challenges tailored to your unique playstyle.
                        Powered by GPT-4 and deep on-chain analysis.
                    </motion.p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Main Content: Active Quest */}
                    <div className="lg:col-span-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold">Current Trial</h2>
                        </div>
                        <ActiveQuest />
                    </div>

                    {/* Sidebar: Stats & Info */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Stats Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gray-900/60 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl"
                        >
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="text-yellow-500">📊</span> Player Profile
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                                        <span>Account Tier</span>
                                        <span className="text-purple-400">Pioneer</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '35%' }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                        ></motion.div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Total XP</p>
                                        <p className="text-xl font-bold text-white">1,240</p>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">GAME Earned</p>
                                        <p className="text-xl font-bold text-white">450.5</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* AI Info Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-purple-900/20 p-8 rounded-2xl border border-purple-500/20"
                        >
                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                <span className="text-purple-400">✨</span> How it works
                            </h3>
                            <p className="text-sm text-purple-200/60 leading-relaxed">
                                Our AI analyzes your on-chain behavior—breeding, staking, and training history—to generate challenges that push your strategy to the next level.
                            </p>
                        </motion.div>

                    </div>
                </div>

                {/* History Section */}
                <section className="mt-24 border-t border-white/5 pt-20">
                    <QuestHistory />
                </section>

            </main>

            {/* Footer Decoration */}
            <footer className="py-12 border-t border-white/5 text-center">
                <p className="text-gray-600 text-xs tracking-widest uppercase">Dynamic NFT Game • AI Quest Prototype</p>
            </footer>
        </div>
    );
}
