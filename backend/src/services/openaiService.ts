import OpenAI from 'openai';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface CharacterTraits {
    characterClass: string;
    level: number;
    strength: number;
    agility: number;
    intelligence: number;
    generation: number;
}

export async function generateCharacterArt(
    tokenId: string,
    traits: CharacterTraits
): Promise<{ imageUrl: string; prompt: string }> {
    console.log(`Generating art for character ${tokenId}...`);

    // Construct AI prompt based on character traits
    const prompt = constructArtPrompt(traits);

    try {
        // Call DALL-E 3
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "vivid",
        });

        const imageUrl = response.data?.[0]?.url;

        if (!imageUrl) {
            throw new Error('No image URL returned from OpenAI');
        }

        console.log(`✓ Art generated for character ${tokenId}`);

        return {
            imageUrl,
            prompt,
        };
    } catch (error: any) {
        console.error(`✗ Failed to generate art for ${tokenId}:`, error.message);
        throw error;
    }
}

function constructArtPrompt(traits: CharacterTraits): string {
    const { characterClass, strength, agility, intelligence, level, generation } = traits;

    // Determine dominant stat
    const stats = [
        { name: 'strength', value: strength },
        { name: 'agility', value: agility },
        { name: 'intelligence', value: intelligence },
    ];
    const dominantStat = stats.reduce((a, b) => (a.value > b.value ? a : b));

    // Build descriptive elements based on stats
    let appearance = '';

    if (dominantStat.name === 'strength') {
        appearance = 'muscular, powerful build, heavy armor';
    } else if (dominantStat.name === 'agility') {
        appearance = 'lean, agile physique, light armor, swift';
    } else {
        appearance = 'mystical aura, robes, holding magical staff';
    }

    // Class-specific elements
    const classDescriptions: Record<string, string> = {
        Warrior: 'fierce warrior with sword and shield',
        Mage: 'wise mage with flowing robes and glowing hands',
        Rogue: 'cunning rogue with daggers and dark cloak',
    };

    const classDesc = classDescriptions[characterClass] || 'fantasy hero';

    // Level-based quality
    const quality = level > 50 ? 'legendary, epic' : level > 25 ? 'elite, powerful' : 'skilled';

    // Generation indicator
    const heritage = generation > 2 ? 'ancient bloodline, noble lineage' : 'fresh, determined';

    // Combine into final prompt
    const finalPrompt = `A ${quality} ${classDesc}, ${appearance}, ${heritage}. 
    Fantasy game character portrait, detailed digital art, front-facing view, 
    neutral background, professional game asset style, high quality, 
    vibrant colors, dramatic lighting`;

    return finalPrompt.replace(/\s+/g, ' ').trim();
}

// Alternative: Stability AI version
export async function generateCharacterArtStability(
    tokenId: string,
    traits: CharacterTraits
): Promise<{ imageBase64: string; prompt: string }> {
    const prompt = constructArtPrompt(traits);

    const response = await axios.post(
        'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        {
            text_prompts: [{ text: prompt }],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            steps: 30,
            samples: 1,
        },
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
            },
        }
    );

    const imageBase64 = response.data?.artifacts?.[0]?.base64;

    if (!imageBase64) {
        throw new Error('No image data returned from Stability AI');
    }

    return {
        imageBase64,
        prompt,
    };
}
