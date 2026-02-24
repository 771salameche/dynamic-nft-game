/**
 * Mint Listener — Listens for CharacterMinted events on the GameCharacter contract
 * and triggers AI art generation for each newly minted character.
 */

import { ethers } from 'ethers';
import { getGameCharacterContract, getProvider } from '../config/contracts';
import { generateArtForCharacter, isArtGenerated } from '../services/artGenerator';
import { logger } from '../utils/logger';
import { sleep } from '../utils/helpers';

const LOG_CTX = 'MintListener';

/**
 * Starts listening for CharacterMinted events.
 * When a mint is detected, generates AI art for the new character.
 */
export async function startMintListener(): Promise<void> {
    const provider = getProvider();
    const gameCharacter = getGameCharacterContract(provider);

    logger.info(LOG_CTX, '🎧 Starting mint event listener...');
    logger.info(LOG_CTX, `Listening on contract: ${await gameCharacter.getAddress()}`);

    // Listen for CharacterMinted events
    gameCharacter.on('CharacterMinted', async (tokenId: bigint, owner: string, characterClass: string) => {
        const id = Number(tokenId);
        logger.info(LOG_CTX, `🎉 New character minted!`, {
            tokenId: id,
            owner,
            characterClass,
        });

        // Small delay to ensure VRF traits are set (random traits come async)
        logger.info(LOG_CTX, `Waiting for VRF traits to be set for token #${id}...`);
        await sleep(30000); // Wait 30 seconds for VRF callback

        try {
            // Check if art was already generated (e.g., from a previous run)
            const alreadyGenerated = await isArtGenerated(id);
            if (alreadyGenerated) {
                logger.warn(LOG_CTX, `Art already generated for token #${id}, skipping.`);
                return;
            }

            // Generate AI art
            const result = await generateArtForCharacter(id);
            logger.info(LOG_CTX, `✅ Art generation pipeline complete for token #${id}`, {
                imageIPFS: `ipfs://${result.imageIPFSHash}`,
                metadataIPFS: `ipfs://${result.metadataIPFSHash}`,
                txHash: result.txHash,
            });
        } catch (error) {
            logger.error(LOG_CTX, `❌ Art generation failed for token #${id}`, error);
        }
    });

    // Also listen for TraitsRevealed as an alternative trigger
    // (more reliable since traits are guaranteed to be set)
    gameCharacter.on('TraitsRevealed', async (tokenId: bigint, traits: bigint[]) => {
        const id = Number(tokenId);
        logger.info(LOG_CTX, `🎲 Traits revealed for token #${id}:`, {
            strength: Number(traits[0]),
            agility: Number(traits[1]),
            intelligence: Number(traits[2]),
        });

        try {
            const alreadyGenerated = await isArtGenerated(id);
            if (alreadyGenerated) {
                logger.info(LOG_CTX, `Art already generated for token #${id}, skipping.`);
                return;
            }

            // Generate art now that traits are confirmed
            const result = await generateArtForCharacter(id);
            logger.info(LOG_CTX, `✅ Art generated after trait reveal for token #${id}`, {
                txHash: result.txHash,
            });
        } catch (error) {
            logger.error(LOG_CTX, `❌ Art generation after trait reveal failed for token #${id}`, error);
        }
    });

    // Keep the process alive
    logger.info(LOG_CTX, '✅ Mint listener is active and waiting for events...');

    // Handle provider disconnection
    provider.on('error', (error: Error) => {
        logger.error(LOG_CTX, 'Provider error:', error);
    });
}

// Allow running this file directly: ts-node src/listeners/mintListener.ts
if (require.main === module) {
    startMintListener().catch((error) => {
        logger.error(LOG_CTX, 'Failed to start mint listener:', error);
        process.exit(1);
    });
}

export default { startMintListener };
