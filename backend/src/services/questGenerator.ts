import OpenAI from 'openai';
import { analyzePlayerBehavior, PlayerAnalysis } from './playerAnalyzer';
import { config } from '../config/env';
import { logger } from '../utils/logger';

const LOG_CTX = 'QuestGenerator';

const openai = new OpenAI({
    apiKey: config.OPENAI_API_KEY,
});

export interface GeneratedQuest {
    description: string;
    aiExplanation: string;
    questType: 'BREEDING' | 'STAKING' | 'LEVELING' | 'SOCIAL' | 'COLLECTION';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
    xpReward: number;
    tokenReward: number;
    durationInDays: number;
}

/**
 * Mapping of string types to contract integers (uint8)
 */
export const QuestTypeMap: Record<string, number> = {
    'BREEDING': 0,
    'STAKING': 1,
    'LEVELING': 2,
    'SOCIAL': 3,
    'COLLECTION': 4
};

export const QuestDifficultyMap: Record<string, number> = {
    'EASY': 0,
    'MEDIUM': 1,
    'HARD': 2,
    'EXPERT': 3
};

/**
 * Generate a personalized quest using GPT-4
 */
export async function generatePersonalizedQuest(
    playerAddress: string,
    playerAnalysis: PlayerAnalysis
): Promise<GeneratedQuest> {
    logger.info(LOG_CTX, `Generating quest for player ${playerAddress}...`);
    logger.debug(LOG_CTX, 'Player analysis:', playerAnalysis);

    // Construct prompt for GPT-4
    const prompt = constructQuestPrompt(playerAnalysis);

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: `You are a game quest designer for a dynamic NFT game. Your job is to create personalized quests that are:
1. Engaging and fun
2. Matched to the player's skill level and interests
3. Encourage exploration of underutilized game features
4. Fair and achievable within the timeframe

Respond ONLY with valid JSON in this exact format:
{
  "description": "Clear quest objective",
  "aiExplanation": "Why this quest is good for this player",
  "questType": "BREEDING|STAKING|LEVELING|SOCIAL|COLLECTION",
  "difficulty": "EASY|MEDIUM|HARD|EXPERT",
  "xpReward": <number>,
  "tokenReward": <number>,
  "durationInDays": <number>
}`,
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.8,
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error('No response from GPT-4');
        }

        // Parse JSON response
        const quest = JSON.parse(content) as GeneratedQuest;

        // Validate quest
        validateQuest(quest);

        logger.info(LOG_CTX, '✓ Quest generated successfully');
        logger.info(LOG_CTX, `Quest: ${quest.description}`);
        logger.debug(LOG_CTX, `Explanation: ${quest.aiExplanation}`);

        return quest;
    } catch (error: any) {
        logger.error(LOG_CTX, 'Failed to generate quest:', error.message);
        throw error;
    }
}

function constructQuestPrompt(analysis: PlayerAnalysis): string {
    return `Generate a personalized quest for a player with the following profile:

Playstyle: ${analysis.playstyle}
Preferred Class: ${analysis.preferredClass}
Average Character Level: ${analysis.averageCharacterLevel}
Last Activity: ${analysis.lastActivityDays} days ago

Strengths: ${analysis.strengthAreas.join(', ') || 'None yet'}
Weaknesses: ${analysis.weaknessAreas.join(', ') || 'None'}

Suggested Quest Types: ${analysis.suggestedQuestTypes.join(', ')}

The quest should:
1. Be appropriate for their skill level (avg level: ${analysis.averageCharacterLevel})
2. Encourage them to try features they haven't explored (weaknesses)
3. Still align with their preferred playstyle (${analysis.playstyle})
4. Be completable within a reasonable timeframe

Quest types explained:
- BREEDING: Breed characters to create offspring
- STAKING: Stake characters to earn rewards
- LEVELING: Gain experience and level up characters
- SOCIAL: Interact with other players or community
- COLLECTION: Mint or acquire new characters

Difficulty guidelines:
- EASY: Simple, quick tasks (10-50 XP, 5-20 GAME tokens, 1-2 days)
- MEDIUM: Moderate challenge (50-150 XP, 20-50 GAME tokens, 2-5 days)
- HARD: Challenging goals (150-300 XP, 50-100 GAME tokens, 5-7 days)
- EXPERT: Epic challenges (300-500 XP, 100-200 GAME tokens, 7-14 days)

Generate a quest now.`;
}

function validateQuest(quest: GeneratedQuest): void {
    const validTypes = ['BREEDING', 'STAKING', 'LEVELING', 'SOCIAL', 'COLLECTION'];
    const validDifficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];

    if (!quest.description || quest.description.length < 10) {
        throw new Error('Invalid quest description');
    }

    if (!quest.aiExplanation || quest.aiExplanation.length < 20) {
        throw new Error('Invalid AI explanation');
    }

    if (!validTypes.includes(quest.questType)) {
        throw new Error(`Invalid quest type: ${quest.questType}`);
    }

    if (!validDifficulties.includes(quest.difficulty)) {
        throw new Error(`Invalid difficulty: ${quest.difficulty}`);
    }

    if (quest.xpReward < 0 || quest.xpReward > 1000) {
        throw new Error(`Invalid XP reward: ${quest.xpReward}`);
    }

    if (quest.tokenReward < 0 || quest.tokenReward > 500) {
        throw new Error(`Invalid token reward: ${quest.tokenReward}`);
    }

    if (quest.durationInDays < 1 || quest.durationInDays > 30) {
        throw new Error(`Invalid duration: ${quest.durationInDays}`);
    }
}

/**
 * Generate quest with fallback to simpler model
 */
export async function generateQuestWithFallback(
    playerAddress: string
): Promise<GeneratedQuest> {
    try {
        const analysis = await analyzePlayerBehavior(playerAddress);
        return await generatePersonalizedQuest(playerAddress, analysis);
    } catch (error: any) {
        logger.warn(LOG_CTX, 'GPT-4 failed or analysis failed, using fallback default quest...', error.message);

        // Fallback to a simple default quest
        return generateDefaultQuest();
    }
}

function generateDefaultQuest(): GeneratedQuest {
    const quests: GeneratedQuest[] = [
        {
            description: 'Level up any character to level 10',
            aiExplanation: 'A great starting quest to learn the leveling system!',
            questType: 'LEVELING',
            difficulty: 'EASY',
            xpReward: 50,
            tokenReward: 10,
            durationInDays: 3,
        },
        {
            description: 'Stake a character for at least 24 hours',
            aiExplanation: 'Discover the staking system and earn passive rewards!',
            questType: 'STAKING',
            difficulty: 'EASY',
            xpReward: 30,
            tokenReward: 15,
            durationInDays: 2,
        },
        {
            description: 'Breed two characters to create offspring',
            aiExplanation: 'Explore the breeding mechanics and genetic system!',
            questType: 'BREEDING',
            difficulty: 'MEDIUM',
            xpReward: 100,
            tokenReward: 50,
            durationInDays: 5,
        },
    ];

    return quests[Math.floor(Math.random() * quests.length)];
}
