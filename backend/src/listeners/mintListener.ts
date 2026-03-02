import { ethers } from 'ethers';
import { processArtGeneration } from '../services/artGenerator';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const GameCharacterABI = require('../../../artifacts/contracts/GameCharacter.sol/GameCharacter.json').abi;

// Track processed events to avoid duplicates
const processedEvents = new Set<string>();

let provider: ethers.WebSocketProvider | null = null;
let gameCharacterContract: ethers.Contract | null = null;
let reconnectAttempts = 0;
let lastProcessedTokenId: string | null = null;
let lastProcessedAt: string | null = null;
const MAX_RECONNECT_DELAY_MS = 60_000;

function getReconnectDelay(attempt: number): number {
  const base = 1000 * 2 ** Math.min(attempt, 5); // exponential backoff up to ~32s
  return Math.min(base, MAX_RECONNECT_DELAY_MS);
}

async function setupProviderAndListeners() {
  const LOG_CTX = 'MintListener';

  if (!process.env.POLYGON_AMOY_WS_URL || !process.env.GAME_CHARACTER_ADDRESS) {
    logger.error(LOG_CTX, 'Missing POLYGON_AMOY_WS_URL or GAME_CHARACTER_ADDRESS in env');
    return;
  }

  // Clean up existing provider if any
  if (provider) {
    try {
      provider.removeAllListeners();
      provider.destroy();
    } catch {
      // ignore
    }
  }

  provider = new ethers.WebSocketProvider(process.env.POLYGON_AMOY_WS_URL);
  gameCharacterContract = new ethers.Contract(
    process.env.GAME_CHARACTER_ADDRESS,
    GameCharacterABI,
    provider
  );

  logger.info(LOG_CTX, `🎨 Mint listener connected. Watching ${process.env.GAME_CHARACTER_ADDRESS}`);

  gameCharacterContract.on(
    'CharacterMinted',
    async (tokenId: bigint, owner: string, characterClass: string, event: any) => {
      const eventId = `${event.transactionHash}-${event.logIndex}`;

      if (processedEvents.has(eventId)) {
        return;
      }
      processedEvents.add(eventId);

      lastProcessedTokenId = tokenId.toString();
      lastProcessedAt = new Date().toISOString();

      logger.info(
        LOG_CTX,
        `🎉 New character minted tokenId=${tokenId.toString()} owner=${owner} class=${characterClass}`
      );

      try {
        logger.info(LOG_CTX, '⏳ Waiting for VRF traits assignment...');
        await new Promise((resolve) => setTimeout(resolve, 10_000));

        await processArtGeneration(tokenId.toString());
      } catch (error: any) {
        logger.error(LOG_CTX, '❌ Failed to process art generation', error);
      }
    }
  );

  provider.on('error', (error) => {
    logger.error(LOG_CTX, '❌ WebSocket error', error);
  });

  // Low-level close event for more reliable reconnect
  (provider as any)._ws?.on('close', (code: number) => {
    logger.error(LOG_CTX, `WebSocket closed with code ${code}, scheduling reconnect...`);
    reconnect();
  });

  reconnectAttempts = 0;
}

function reconnect() {
  const LOG_CTX = 'MintListener';
  reconnectAttempts += 1;
  const delay = getReconnectDelay(reconnectAttempts);

  logger.info(LOG_CTX, `Attempting reconnect in ${delay / 1000}s (attempt ${reconnectAttempts})`);

  setTimeout(() => {
    setupProviderAndListeners().catch((err) => {
      logger.error(LOG_CTX, 'Reconnect failed', err);
      reconnect(); // schedule next attempt
    });
  }, delay);
}

export async function startMintListener(): Promise<void> {
  await setupProviderAndListeners();

  process.on('SIGINT', () => {
    const LOG_CTX = 'MintListener';
    logger.info(LOG_CTX, '👋 Shutting down listener...');
    if (provider) {
      try {
        provider.removeAllListeners();
        provider.destroy();
      } catch {
        // ignore
      }
    }
    process.exit(0);
  });
}

// Optional: Listen for TraitsUpdated to catch VRF callbacks
export async function listenForTraitsUpdated(): Promise<void> {
  const LOG_CTX = 'MintListener';
  if (!gameCharacterContract) {
    logger.error(LOG_CTX, 'TraitsUpdated listener requested before contract is initialized');
    return;
  }

  gameCharacterContract.on('TraitsUpdated', async (tokenId: bigint) => {
    logger.info(LOG_CTX, `✨ Traits updated for token ${tokenId.toString()}`);
    try {
      await processArtGeneration(tokenId.toString());
    } catch (error: any) {
      logger.error(LOG_CTX, '❌ Art generation failed after TraitsUpdated', error);
    }
  });
}

// Start listener if run directly
if (require.main === module) {
  startMintListener().catch(console.error);
}

export function getMintListenerHealth() {
  const connected = !!provider;
  return {
    connected,
    reconnectAttempts,
    lastProcessedTokenId,
    lastProcessedAt,
  };
}
