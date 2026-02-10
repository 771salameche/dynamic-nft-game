import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, polygonAmoy } from 'viem/chains';
import { http } from 'wagmi';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

export const config = getDefaultConfig({
  appName: 'Dynamic NFT Game',
  projectId: projectId,
  chains: [polygonAmoy, polygon],
  transports: {
    [polygonAmoy.id]: http(),
    [polygon.id]: http(),
  },
  ssr: true,
});
