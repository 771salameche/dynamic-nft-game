/**
 * Helper utilities for the backend service.
 */

/**
 * Delays execution for a specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async function up to `maxRetries` times with exponential backoff.
 * @param fn The async function to retry.
 * @param maxRetries Maximum number of retry attempts.
 * @param baseDelayMs Base delay between retries in milliseconds (doubles each attempt).
 * @returns The result of the function.
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelayMs = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt < maxRetries) {
                const delay = baseDelayMs * Math.pow(2, attempt);
                await sleep(delay);
            }
        }
    }

    throw lastError;
}

/**
 * Truncates a string to a specified length, appending '...' if truncated.
 */
export function truncate(str: string, maxLength = 100): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

/**
 * Builds an AI prompt string from character traits.
 */
export function buildArtPrompt(
    characterClass: string,
    strength: number,
    agility: number,
    intelligence: number,
    level: number,
    generation: number
): string {
    // Determine dominant trait for visual emphasis
    const dominant =
        strength >= agility && strength >= intelligence
            ? 'muscular and powerful'
            : agility >= intelligence
                ? 'agile and swift'
                : 'wise and mystical';

    return (
        `A powerful fantasy game character, ${characterClass} class, ` +
        `Level ${level}, Generation ${generation}. ` +
        `The character appears ${dominant}, ` +
        `with ${strength} strength, ${agility} agility, and ${intelligence} intelligence. ` +
        `High quality digital art, detailed fantasy game character portrait, ` +
        `front-facing view, dark ethereal background, cinematic lighting, ` +
        `4K resolution, concept art style.`
    );
}

export default {
    sleep,
    retryWithBackoff,
    truncate,
    buildArtPrompt,
};
