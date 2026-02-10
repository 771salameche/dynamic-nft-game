import type { Metadata } from 'next';
import { Web3Provider } from '@/components/web3/Web3Provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dynamic NFT Game - Evolving Characters on Polygon',
  description: 'Mint, evolve, and battle with dynamic NFT characters. Stake to earn rewards and breed powerful offspring.',
  keywords: ['NFT', 'Polygon', 'Gaming', 'Web3', 'Blockchain', 'GameFi', 'Dynamic NFT'],
  authors: [{ name: 'Nexus Protocol' }],
  openGraph: {
    title: 'Dynamic NFT Game',
    description: 'Build your NFT army on Polygon. Mint, evolve, and battle with dynamic characters.',
    url: 'https://dynamic-nft-game.example.com',
    siteName: 'Dynamic NFT Game',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Dynamic NFT Game Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dynamic NFT Game',
    description: 'Build your NFT army on Polygon',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
