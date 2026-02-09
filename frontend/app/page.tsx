'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@/components/web3/ConnectButton';
import Link from 'next/link';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-950 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex mb-12">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Dynamic NFT Game
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <ConnectButton />
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Welcome to the Arena
        </h1>
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          Train, breed, and battle with your dynamic NFTs. Earn achievements and climb the leaderboard in this next-gen Web3 gaming experience.
        </p>

        {isConnected ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <Link href="/mint" className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-purple-500 transition-colors">
              <h2 className="text-2xl font-bold mb-2">Mint Character &rarr;</h2>
              <p className="text-gray-400 text-sm">Start your journey with a new character.</p>
            </Link>
            <Link href="/staking" className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-purple-500 transition-colors">
              <h2 className="text-2xl font-bold mb-2">Staking &rarr;</h2>
              <p className="text-gray-400 text-sm">Stake your NFTs to earn rewards passively.</p>
            </Link>
            <Link href="/breeding" className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-purple-500 transition-colors">
              <h2 className="text-2xl font-bold mb-2">Breeding &rarr;</h2>
              <p className="text-gray-400 text-sm">Fuse and breed to create powerful offspring.</p>
            </Link>
          </div>
        ) : (
          <p className="text-purple-400 font-semibold text-lg animate-pulse">
            Connect your wallet to start playing!
          </p>
        )}
      </div>
    </main>
  );
}