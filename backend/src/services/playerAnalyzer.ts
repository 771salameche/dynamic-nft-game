import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';
import fetch from 'cross-fetch';
import { config } from '../config/env';
import { logger } from '../utils/logger';

const LOG_CTX = 'PlayerAnalyzer';

// Apollo Client setup for Node.js
const client = new ApolloClient({
    link: new HttpLink({ uri: config.SUBGRAPH_URL, fetch }),
    cache: new InMemoryCache(),
    defaultOptions: {
        query: {
            fetchPolicy: 'no-cache',
        },
    },
});

export interface PlayerProfile {
    address: string;
    characters: Array<{
        tokenId: string;
        level: number;
        characterClass: string;
        strength: number;
        agility: number;
        intelligence: number;
        generation: number;
    }>;
    stakedCharacters: Array<{
        tokenId: string;
        stakedAt: string;
    }>;
    breedingEvents: Array<{
        timestamp: string;
        offspring: { tokenId: string };
    }>;
    achievements: Array<{
        achievement: {
            name: string;
            category: string;
        };
        unlockedAt: string;
    }>;
    totalRewardsEarned: string;
    charactersMinted: number;
    breedingCount: number;
}

/**
 * Fetch comprehensive player data from The Graph
 */
export async function getPlayerProfile(playerAddress: string): Promise<PlayerProfile | null> {
    const query = gql`
    query GetPlayer($address: String!) {
      player(id: $address) {
        id
        characters {
          tokenId
          level
          characterClass
          strength
          agility
          intelligence
          generation
        }
        stakedCharacters {
          tokenId
          stakedAt
        }
        breedingEvents {
          timestamp
          offspring {
            tokenId
          }
        }
        achievements {
          achievement {
            name
            category
          }
          unlockedAt
        }
        totalRewardsEarned
        charactersMinted
        breedingCount
      }
    }
  `;

    try {
        const { data } = await client.query<{ player: PlayerProfile | null }>({
            query,
            variables: { address: playerAddress.toLowerCase() },
        });

        if (!data || !data.player) {
            return null;
        }

        return data.player;
    } catch (error: any) {
        logger.error(LOG_CTX, 'Failed to fetch player profile:', error.message);
        throw error;
    }
}

/**
 * Analyze player behavior and preferences
 */
export interface PlayerAnalysis {
    playstyle: 'breeder' | 'collector' | 'staker' | 'grinder' | 'balanced';
    preferredClass: string;
    averageCharacterLevel: number;
    lastActivityDays: number;
    strengthAreas: string[];
    weaknessAreas: string[];
    suggestedQuestTypes: string[];
}

export async function analyzePlayerBehavior(
    playerAddress: string
): Promise<PlayerAnalysis> {
    try {
        const profile = await getPlayerProfile(playerAddress);

        if (!profile || profile.characters.length === 0) {
            // New player - suggest collection quests
            return {
                playstyle: 'balanced',
                preferredClass: 'Warrior',
                averageCharacterLevel: 0,
                lastActivityDays: 0,
                strengthAreas: [],
                weaknessAreas: ['collection', 'progression'],
                suggestedQuestTypes: ['COLLECTION', 'LEVELING'],
            };
        }

        // Calculate metrics
        const totalCharacters = profile.characters.length;
        const stakedCount = profile.stakedCharacters.length;
        const breedingCount = profile.breedingCount;
        const achievementCount = profile.achievements.length;

        // Average character level
        const avgLevel =
            profile.characters.reduce((sum, char) => sum + char.level, 0) /
            totalCharacters;

        // Determine playstyle
        let playstyle: PlayerAnalysis['playstyle'] = 'balanced';
        if (breedingCount > totalCharacters * 0.5) {
            playstyle = 'breeder';
        } else if (stakedCount > totalCharacters * 0.7) {
            playstyle = 'staker';
        } else if (totalCharacters > 10) {
            playstyle = 'collector';
        } else if (avgLevel > 30) {
            playstyle = 'grinder';
        }

        // Preferred class
        const classCounts: Record<string, number> = {};
        profile.characters.forEach((char) => {
            classCounts[char.characterClass] = (classCounts[char.characterClass] || 0) + 1;
        });
        const preferredClass =
            Object.keys(classCounts).reduce((a, b) =>
                classCounts[a] > classCounts[b] ? a : b
            ) || 'Warrior';

        // Last activity (simplified - would check timestamps)
        const lastActivityDays = 0; // Calculate from actual data

        // Strengths and weaknesses
        const strengthAreas: string[] = [];
        const weaknessAreas: string[] = [];

        if (breedingCount > 5) strengthAreas.push('breeding');
        else weaknessAreas.push('breeding');

        if (stakedCount > 0) strengthAreas.push('staking');
        else weaknessAreas.push('staking');

        if (avgLevel > 25) strengthAreas.push('leveling');
        else weaknessAreas.push('leveling');

        if (achievementCount > 5) strengthAreas.push('achievements');
        else weaknessAreas.push('achievements');

        // Suggest quest types based on weaknesses and playstyle
        const suggestedQuestTypes: string[] = [];

        if (weaknessAreas.includes('breeding')) suggestedQuestTypes.push('BREEDING');
        if (weaknessAreas.includes('staking')) suggestedQuestTypes.push('STAKING');
        if (weaknessAreas.includes('leveling')) suggestedQuestTypes.push('LEVELING');
        if (totalCharacters < 5) suggestedQuestTypes.push('COLLECTION');

        // Always include one that matches their playstyle
        if (playstyle === 'breeder') suggestedQuestTypes.push('BREEDING');
        if (playstyle === 'staker') suggestedQuestTypes.push('STAKING');

        return {
            playstyle,
            preferredClass,
            averageCharacterLevel: avgLevel,
            lastActivityDays,
            strengthAreas,
            weaknessAreas,
            suggestedQuestTypes: [...new Set(suggestedQuestTypes)], // Remove duplicates
        };
    } catch (error: any) {
        logger.error(LOG_CTX, `Error analyzing behavior for ${playerAddress}`, error);
        // Fallback
        return {
            playstyle: 'balanced',
            preferredClass: 'Warrior',
            averageCharacterLevel: 0,
            lastActivityDays: 0,
            strengthAreas: [],
            weaknessAreas: [],
            suggestedQuestTypes: ['LEVELING']
        };
    }
}
