import { ethers } from 'ethers';
import { getSmartQuestContract, getProvider, getSigner } from '../config/contracts';
import { generateQuestWithFallback, QuestTypeMap, QuestDifficultyMap } from '../services/questGenerator';
import { logger } from '../utils/logger';
import { config } from '../config/env';

const LOG_CTX = 'QuestListener';

export async function startQuestListener(): Promise<void> {
    const provider = getProvider();
    const smartQuest = getSmartQuestContract(provider);

    logger.info(LOG_CTX, '🎧 Starting Smart Quest listener...');
    logger.info(LOG_CTX, `Watching contract: ${config.SMART_QUEST_ENGINE_ADDRESS}`);

    // Listen for QuestRequested events
    smartQuest.on('QuestRequested', async (player: string, timestamp: bigint) => {
        logger.info(LOG_CTX, `✨ New quest requested by ${player}`, { timestamp: Number(timestamp) });

        try {
            // 1. Generate personalized quest via AI (includes analysis and fallback)
            const generatedQuest = await generateQuestWithFallback(player);

            // 2. Fulfill the quest on-chain
            const signer = getSigner();
            const smartQuestWithSigner = getSmartQuestContract(signer);

            logger.info(LOG_CTX, `📝 Fulfilling quest for ${player}...`);

            // Map string types to contract IDs (uint8)
            const typeId = QuestTypeMap[generatedQuest.questType];
            const difficultyId = QuestDifficultyMap[generatedQuest.difficulty];

            const tx = await smartQuestWithSigner.fulfillQuest(
                player,
                generatedQuest.description,
                generatedQuest.aiExplanation,
                typeId,
                difficultyId,
                generatedQuest.xpReward,
                generatedQuest.tokenReward,
                generatedQuest.durationInDays
            );

            const receipt = await tx.wait();
            logger.info(LOG_CTX, `✅ Quest fulfilled for ${player}. Tx: ${receipt.hash}`);

        } catch (error: any) {
            logger.error(LOG_CTX, `❌ Failed to process quest for ${player}:`, error);
        }
    });

    logger.info(LOG_CTX, '✅ Quest listener is active.');
}

export default { startQuestListener };
