import { ethers } from 'ethers';
import { getSmartQuestContract, getProvider, getSigner, getWebSocketProvider } from '../config/contracts';
import { generateQuestWithFallback, QuestTypeMap, QuestDifficultyMap } from '../services/questGenerator';
import { logger } from '../utils/logger';
import { config } from '../config/env';

const LOG_CTX = 'QuestListener';
const processedEvents = new Set<string>();

/**
 * Starts the real-time quest listener.
 */
export async function startQuestListener(): Promise<void> {
    // Use WebSocket provider for real-time responsiveness if URL is available
    let provider;
    try {
        provider = getWebSocketProvider() || getProvider();
        logger.info(LOG_CTX, `🎧 Using ${provider instanceof ethers.WebSocketProvider ? 'WebSocket' : 'HTTP'} provider`);
    } catch (e) {
        provider = getProvider();
        logger.info(LOG_CTX, '🎧 WS URL missing, falling back to HTTP polling');
    }

    const smartQuest = getSmartQuestContract(provider);
    const signer = getSigner();
    const smartQuestWithSigner = getSmartQuestContract(signer);

    logger.info(LOG_CTX, '🎯 Starting quest event listener...');
    logger.info(LOG_CTX, `Watching contract: ${config.SMART_QUEST_ENGINE_ADDRESS}`);

    // Listen for QuestRequested events
    smartQuest.on('QuestRequested', async (player: string, timestamp: bigint, event: any) => {
        const eventId = `${event.transactionHash}-${event.logIndex}`;

        if (processedEvents.has(eventId)) {
            return;
        }
        processedEvents.add(eventId);

        logger.info(LOG_CTX, `📜 Quest requested by ${player}!`, { timestamp: Number(timestamp) });

        try {
            // 1. Generate personalized quest via AI (includes analysis and fallback)
            logger.info(LOG_CTX, `🤖 Generating AI quest for ${player}...`);
            const quest = await generateQuestWithFallback(player);

            // 2. Fulfill the quest on-chain
            logger.info(LOG_CTX, `📝 Submitting quest for ${player} to blockchain...`);

            // Map string types to contract IDs (uint8)
            const typeId = QuestTypeMap[quest.questType];
            const difficultyId = QuestDifficultyMap[quest.difficulty];

            // Convert token reward to wei (assuming 18 decimals)
            const tokenRewardWei = ethers.parseUnits(quest.tokenReward.toString(), 18);

            const tx = await smartQuestWithSigner.fulfillQuest(
                player,
                quest.description,
                quest.aiExplanation,
                typeId,
                difficultyId,
                quest.xpReward,
                tokenRewardWei,
                quest.durationInDays
            );

            const receipt = await tx.wait();
            logger.info(LOG_CTX, `✅ Quest fulfilled for ${player}. Tx: ${receipt.hash}`);

            logger.info(LOG_CTX, `📋 Quest Details: ${quest.questType} (${quest.difficulty}) - ${quest.description}`);
            logger.debug(LOG_CTX, `Explanation: ${quest.aiExplanation}`);
            logger.info(LOG_CTX, `Rewards: ${quest.xpReward} XP, ${quest.tokenReward} GAME`);

        } catch (error: any) {
            logger.error(LOG_CTX, `❌ Failed to fulfill quest for ${player}:`, error.message);
        }
    });

    // Listen for QuestCompleted events (logging/analytics)
    smartQuest.on('QuestCompleted', (questId: bigint, player: string, xpReward: bigint, tokenReward: bigint) => {
        logger.info(LOG_CTX, `✨ Quest completed! Quest ID: ${questId.toString()}`);
        logger.info(LOG_CTX, `Player: ${player}`);
        logger.info(LOG_CTX, `Rewards: ${xpReward.toString()} XP, ${ethers.formatUnits(tokenReward, 18)} GAME`);
    });

    logger.info(LOG_CTX, '✅ Quest listener active. Waiting for requests...');

    // Handling provider errors
    if (provider instanceof ethers.WebSocketProvider) {
        provider.on('error', (error) => {
            logger.error(LOG_CTX, '❌ WebSocket error:', error);
        });
    }

    // Graceful shutdown
    process.on('SIGINT', () => {
        logger.info(LOG_CTX, '👋 Shutting down quest listener...');
        if (provider instanceof ethers.WebSocketProvider) {
            provider.destroy();
        }
    });
}

// Start if run directly via ts-node
if (require.main === module) {
    startQuestListener().catch((err) => {
        logger.error(LOG_CTX, 'Fatal error in quest listener:', err);
        process.exit(1);
    });
}

export default { startQuestListener };
