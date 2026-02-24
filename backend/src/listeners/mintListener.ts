import { ethers } from 'ethers';
import { processArtGeneration } from '../services/artGenerator';
import dotenv from 'dotenv';

dotenv.config();

const GameCharacterABI = require('../../../artifacts/contracts/GameCharacter.sol/GameCharacter.json').abi;

const provider = new ethers.WebSocketProvider(
    process.env.POLYGON_AMOY_WS_URL! // Note: Use WebSocket URL
);

const gameCharacterContract = new ethers.Contract(
    process.env.GAME_CHARACTER_ADDRESS!,
    GameCharacterABI,
    provider
);

// Track processed events to avoid duplicates
const processedEvents = new Set<string>();

export async function startMintListener(): Promise<void> {
    console.log('🎨 Starting mint event listener...');
    console.log(`Watching contract: ${process.env.GAME_CHARACTER_ADDRESS}`);

    // Listen for CharacterMinted events
    gameCharacterContract.on(
        'CharacterMinted',
        async (tokenId: bigint, owner: string, characterClass: string, event: any) => {
            const eventId = `${event.transactionHash}-${event.logIndex}`;

            // Prevent duplicate processing
            if (processedEvents.has(eventId)) {
                return;
            }
            processedEvents.add(eventId);

            console.log('\n🎉 New character minted!');
            console.log(`Token ID: ${tokenId.toString()}`);
            console.log(`Owner: ${owner}`);
            console.log(`Class: ${characterClass}`);
            console.log(`Transaction: ${event.transactionHash}`);

            try {
                // Wait a few seconds for VRF traits to be set
                console.log('⏳ Waiting for VRF traits assignment...');
                await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds

                // Process art generation
                await processArtGeneration(tokenId.toString());
            } catch (error: any) {
                console.error('❌ Failed to process art generation:', error.message);
                // Could retry or log to database for manual processing
            }
        }
    );

    console.log('✅ Listener active. Waiting for mint events...\n');

    // Handle connection errors
    provider.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        // Implement reconnection logic
    });

    // Keep the process alive
    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down listener...');
        provider.destroy();
        process.exit(0);
    });
}

// Optional: Listen for TraitsUpdated to catch VRF callbacks
export async function listenForTraitsUpdated(): Promise<void> {
    gameCharacterContract.on(
        'TraitsUpdated',
        async (tokenId: bigint, traits: any, event: any) => {
            console.log(`\n✨ Traits updated for token ${tokenId}`);

            // Check if art already generated
            const artMetadata = await gameCharacterContract.artMetadata(tokenId);

            if (!artMetadata.isGenerated) {
                console.log('🎨 Triggering art generation...');
                try {
                    await processArtGeneration(tokenId.toString());
                } catch (error: any) {
                    console.error('❌ Art generation failed:', error.message);
                }
            }
        }
    );
}

// Start listener if run directly
if (require.main === module) {
    startMintListener().catch(console.error);
}
