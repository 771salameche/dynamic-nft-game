import OpenAI from 'openai';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { retryWithBackoff } from '../utils/helpers';

const LOG_CTX = 'QuestGenerator';

const openai = new OpenAI({
    apiKey: config.OPENAI_API_KEY,
});

export enum QuestType {
    BREEDING = 0,
    STAKING = 1,
    LEVELING = 2,
    SOCIAL = 3,
    COLLECTION = 4
}

export enum QuestDifficulty {
    EASY = 0,
    MEDIUM = 1,
    HARD = 2,
    EXPERT = 3
}

export interface QuestData {
    description: string;
    aiExplanation: string;
    questType: QuestType;
    difficulty: QuestDifficulty;
    xpReward: number;
    tokenReward: number;
    durationInDays: number;
}

/**
 * Generates a personalized quest using OpenAI.
 * 
 * @param playerAddress The player's address.
 * @param characterData Information about the player's characters.
 * @param history Summary of previous quests or achievements.
 * @returns A generated quest object.
 */
export async function generatePersonalizedQuest(
    playerAddress: string,
    characterData: any,
    history: any
): Promise<QuestData> {
    logger.info(LOG_CTX, `Generating personalized quest for player ${playerAddress}...`);

    const prompt = constructQuestPrompt(playerAddress, characterData, history);

    return await retryWithBackoff(async () => {
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: 'You are an AI Dungeon Master for a Dynamic NFT Game. Your job is to generate personalized, engaging quests for players based on their current character stats and past history. You must return your response in JSON format.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0].message?.content;
        if (!content) {
            throw new Error('No content returned from OpenAI');
        }

        const parsed = JSON.parse(content);
        validateQuestJson(parsed);

        logger.info(LOG_CTX, `✓ Quest generated for ${playerAddress}: ${parsed.description}`);
        return parsed as QuestData;
    });
}

/**
 * Constructs the prompt for OpenAI.
 */
function constructQuestPrompt(player: string, characterData: any, history: any): string {
    return `
    Player Address: ${player}
    
    Character Data:
    ${JSON.stringify(characterData, null, 2)}
    
    Quest History Summary:
    ${JSON.stringify(history, null, 2)}
    
    Please generate a personalized quest for this player. 
    Select a QuestType and Difficulty that makes sense for their current level and history.
    
    QuestType Options:
    0: BREEDING
    1: STAKING
    2: LEVELING
    3: SOCIAL
    4: COLLECTION
    
    Difficulty Options:
    0: EASY
    1: MEDIUM
    2: HARD
    3: EXPERT
    
    The response MUST be a JSON object with the following fields:
    - description: A short, engaging title and description of the quest task.
    - aiExplanation: A brief "Dungeon Master" style explanation of why this quest was chosen for them.
    - questType: The integer ID of the quest type.
    - difficulty: The integer ID of the difficulty.
    - xpReward: An appropriate XP reward amount (50 to 500).
    - tokenReward: An appropriate token reward amount (10 to 100).
    - durationInDays: How many days they have to complete it (1 to 7).
    `;
}

/**
 * Basic validation of the JSON response.
 */
function validateQuestJson(json: any) {
    const required = ['description', 'aiExplanation', 'questType', 'difficulty', 'xpReward', 'tokenReward', 'durationInDays'];
    for (const field of required) {
        if (json[field] === undefined) {
            throw new Error(`Missing required quest field: ${field}`);
        }
    }
}
