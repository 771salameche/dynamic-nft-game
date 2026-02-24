import { ethers } from 'ethers';
import { getSmartQuestContract, getGameCharacterContract, getProvider, getSigner } from '../config/contracts';
import { generatePersonalizedQuest } from '../services/questGenerator';
import { logger } from '../utils/logger';
import { config } from '../config/env';

const LOG_CTX = 'QuestListener';

export async function startQuestListener(): Promise<void> {
    // We'll use WebSocket if available in future, for now standard JsonRpcProvider works
    // but the system is designed to be event-driven.
    const provider = getProvider();
    const smartQuest = getSmartQuestContract(provider);
    const gameCharacter = getGameCharacterContract(provider);

    logger.info(LOG_CTX, '🎧 Starting Smart Quest listener...');
    logger.info(LOG_CTX, `Watching contract: ${config.SMART_QUEST_ENGINE_ADDRESS}`);

    // Listen for QuestRequested events
    smartQuest.on('QuestRequested', async (player: string, timestamp: bigint) => {
        logger.info(LOG_CTX, `✨ New quest requested by ${player}`, { timestamp: Number(timestamp) });

        try {
            // 1. Gather player context (Characters and simplified History)
            const characterData = await fetchPlayerCharacters(gameCharacter, player);
            const history = await fetchQuestHistorySummary(smartQuest, player);

            // 2. Generate personalized quest via AI
            const generatedQuest = await generatePersonalizedQuest(player, characterData, history);

            // 3. Fulfill the quest on-chain
            const signer = getSigner();
            const smartQuestWithSigner = getSmartQuestContract(signer);

            logger.info(LOG_CTX, `📝 Fulfilling quest for ${player}...`);
            const tx = await smartQuestWithSigner.fulfillQuest(
                player,
                generatedQuest.description,
                generatedQuest.aiExplanation,
                generatedQuest.questType,
                generatedQuest.difficulty,
                generatedQuest.xpReward,
                generatedQuest.tokenReward,
                generatedQuest.durationInDays
            );

            const receipt = await tx.wait();
            logger.info(LOG_CTX, `✅ Quest fulfilled for ${player}. Tx: ${receipt.hash}`);

        } catch (error) {
            logger.error(LOG_CTX, `❌ Failed to process quest for ${player}:`, error);
        }
    });

    logger.info(LOG_CTX, '✅ Quest listener is active.');
}

/**
 * Fetches character data for a player.
 * Note: Limited to first few characters for prompt efficiency.
 */
async function fetchPlayerCharacters(gameCharacter: ethers.Contract, player: string): Promise<any[]> {
    const balance = await gameCharacter.balanceOf(player);
    const count = Number(balance) > 3 ? 3 : Number(balance);
    const characters = [];

    for (let i = 0; i < count; i++) {
        try {
            // Note: Since we don't have Enumerable, we'd ideally have an index or registry.
            // For now, this is a placeholder logic. In production, we'd use a subgraph or DB.
            // As a fallback, we'll try to find at least one token if they have balance.
            // Assume we have a way to get the tokenId (e.g. from an event or DB)
            // For this implementation, we'll just return a generic "Level X Player" context
            // if we can't easily iterate.
        } catch (e) {
            continue;
        }
    }

    return [{ balance: Number(balance), note: "Player has characters but individual traits require tokenId mapping" }];
}

/**
 * Fetches a summary of player's quest history.
 */
async function fetchQuestHistorySummary(smartQuest: ethers.Contract, player: string): Promise<any> {
    const count = await smartQuest.playerQuestCount(player);
    return {
        totalQuestsCompleted: Number(count),
        note: "Detailed history can be fetched from event logs if needed."
    };
}

export default { startQuestListener };
