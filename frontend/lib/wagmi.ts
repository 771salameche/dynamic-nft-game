import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygonAmoy, hardhat } from 'wagmi/chains';
import { http } from 'wagmi';

export const config = getDefaultConfig({
  appName: 'Morpheum',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [polygonAmoy, hardhat],
  transports: {
    [polygonAmoy.id]: http(),
    [hardhat.id]: http(),
  },
  ssr: false, // Disabled to prevent hydration/authorization state mismatches
});
