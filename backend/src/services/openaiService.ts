/**
 * OpenAI Service — Generates character art using DALL-E 3.
 * Falls back to Stability AI if configured.
 */

import OpenAI from 'openai';
import axios from 'axios';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { retryWithBackoff } from '../utils/helpers';

const LOG_CTX = 'OpenAIService';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: config.OPENAI_API_KEY,
});

/**
 * Generates an image using OpenAI DALL-E 3.
 * @param prompt The text prompt describing the character.
 * @returns A Buffer containing the generated image data.
 */
export async function generateImageWithDallE(prompt: string): Promise<Buffer> {
    logger.info(LOG_CTX, 'Generating image with DALL-E 3...');
    logger.debug(LOG_CTX, 'Prompt:', prompt);

    const response = await retryWithBackoff(async () => {
        return openai.images.generate({
            model: 'dall-e-3',
            prompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
            response_format: 'b64_json',
        });
    });

    const imageData = response.data?.[0]?.b64_json;
    if (!imageData) {
        throw new Error('No image data returned from DALL-E');
    }

    logger.info(LOG_CTX, 'Image generated successfully with DALL-E 3');
    return Buffer.from(imageData, 'base64');
}

/**
 * Generates an image using Stability AI (Stable Diffusion).
 * Only used if STABILITY_API_KEY is configured.
 * @param prompt The text prompt describing the character.
 * @returns A Buffer containing the generated image data.
 */
export async function generateImageWithStability(prompt: string): Promise<Buffer> {
    if (!config.STABILITY_API_KEY) {
        throw new Error('STABILITY_API_KEY not configured');
    }

    logger.info(LOG_CTX, 'Generating image with Stability AI...');
    logger.debug(LOG_CTX, 'Prompt:', prompt);

    const response = await retryWithBackoff(async () => {
        return axios.post(
            'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
            {
                text_prompts: [
                    { text: prompt, weight: 1 },
                    { text: 'blurry, bad quality, distorted, ugly', weight: -1 },
                ],
                cfg_scale: 7,
                width: 1024,
                height: 1024,
                samples: 1,
                steps: 30,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config.STABILITY_API_KEY}`,
                    Accept: 'application/json',
                },
            }
        );
    });

    const imageBase64 = response.data.artifacts?.[0]?.base64;
    if (!imageBase64) {
        throw new Error('No image data returned from Stability AI');
    }

    logger.info(LOG_CTX, 'Image generated successfully with Stability AI');
    return Buffer.from(imageBase64, 'base64');
}

/**
 * Generates a character image using the best available AI provider.
 * Prefers Stability AI (cheaper), falls back to DALL-E 3.
 * @param prompt The text prompt describing the character.
 * @returns A Buffer containing the generated image data.
 */
export async function generateCharacterImage(prompt: string): Promise<Buffer> {
    // Prefer Stability AI if configured (cheaper)
    if (config.STABILITY_API_KEY) {
        try {
            return await generateImageWithStability(prompt);
        } catch (error) {
            logger.warn(LOG_CTX, 'Stability AI failed, falling back to DALL-E 3', error);
        }
    }

    // Fall back to DALL-E 3
    return generateImageWithDallE(prompt);
}

export default {
    generateCharacterImage,
    generateImageWithDallE,
    generateImageWithStability,
};
