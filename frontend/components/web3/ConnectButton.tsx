'use client';

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';

export const ConnectButton = () => {
  return (
    <RainbowConnectButton
      accountStatus={{
        smallScreen: 'avatar',
        largeScreen: 'full',
      }}
      showBalance={false}
      chainStatus="icon"
    />
  );
};
