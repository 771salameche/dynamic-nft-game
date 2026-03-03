'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ConnectButton } from './web3/ConnectButton';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

const navLinks = [
    { href: '/mint', label: 'Mint' },
    { href: '/characters', label: 'Gallery' },
    { href: '/staking', label: 'Staking' },
    { href: '/breeding', label: 'Breeding' },
    { href: '/achievements', label: 'Achievements' },
    { href: '/leaderboard', label: 'Leaderboard' },
];

export function Navigation() {
    const pathname = usePathname();
    const { address, isConnected } = useAccount();
    const profileHref = address ? `/profile/${address}` : undefined;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <nav className="border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative w-8 h-8 rounded-full overflow-hidden"
                    >
                        <Image
                            src="/assets/Logo-morpheum.svg"
                            alt="Morpheum Logo"
                            fill
                            className="object-contain"
                        />
                    </motion.div>
                    <span className="font-bold text-xl hidden sm:inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        Morpheum
                    </span>
                </Link>

                <div className="hidden md:flex space-x-6 items-center">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-sm font-medium transition-colors hover:text-primary ${
                                pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {mounted && isConnected && profileHref && (
                        <Link
                            href={profileHref}
                            className={`text-sm font-medium transition-colors hover:text-primary ${
                                pathname.startsWith('/profile') ? 'text-primary' : 'text-muted-foreground'
                            }`}
                        >
                            Profile
                        </Link>
                    )}
                </div>

                <div className="flex items-center space-x-4">
                    {mounted && <ConnectButton />}
                </div>
            </div>
        </nav>
    );
}
