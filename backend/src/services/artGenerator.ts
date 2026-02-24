/**
 * Art Generator Service — Orchestrates the full AI art generation pipeline:
 *   1. Read character traits from the blockchain
 *   2. Build an AI prompt from the traits
 *   3. Generate an image via OpenAI/Stability AI
 *   4. Upload image + metadata to IPFS via Pinata
 *   5. Call ArtGenerator contract to store the IPFS hash on-chain
 */

import { ethers } from 'ethers';
import { getGameCharacterContract, getArtGeneratorContract, getSigner } from '../config/contracts';
import { generateCharacterImage } from './openaiService';
import { uploadImageToIPFS, uploadCharacterMetadata } from './ipfsManager';
import { buildArtPrompt } from '../utils/helpers';
import { logger } from '../utils/logger';

const LOG_CTX = 'ArtGenerator';

export interface ArtGenerationResult {
    tokenId: number;
    imageIPFSHash: string;
    metadataIPFSHash: string;
    prompt: string;
    txHash: string;
}

/**
 * Generates AI art for a specific character token and stores it on-chain.
 * This is the main orchestration function called when a mint event is detected.
 *
 * @param tokenId The token ID to generate art for.
 * @returns The result including IPFS hashes and transaction hash.
 */
export async function generateArtForCharacter(tokenId: number): Promise<ArtGenerationResult> {
    logger.info(LOG_CTX, `Starting art generation for token #${tokenId}`);

    // Step 1: Fetch character traits from the blockchain
    const gameCharacter = getGameCharacterContract();
    const traits = await gameCharacter.getCharacterTraits(tokenId);

    const characterClass: string = traits.characterClass;
    const strength = Number(traits.strength);
    const agility = Number(traits.agility);
    const intelligence = Number(traits.intelligence);
    const level = Number(traits.level);
    const generation = Number(traits.generation);

    logger.info(LOG_CTX, `Token #${tokenId} traits:`, {
        characterClass,
        strength,
        agility,
        intelligence,
        level,
        generation,
    });

    // Step 2: Build AI prompt from traits
    const prompt = buildArtPrompt(characterClass, strength, agility, intelligence, level, generation);
    logger.info(LOG_CTX, `Generated prompt for token #${tokenId}`);

    // Step 3: Generate image via AI
    logger.info(LOG_CTX, `Generating AI image for token #${tokenId}...`);
    const imageBuffer = await generateCharacterImage(prompt);
    logger.info(LOG_CTX, `AI image generated for token #${tokenId} (${imageBuffer.length} bytes)`);

    // Step 4: Upload image to IPFS
    const imageIPFSHash = await uploadImageToIPFS(imageBuffer, `character-${tokenId}.png`);
    logger.info(LOG_CTX, `Image uploaded to IPFS: ipfs://${imageIPFSHash}`);

    // Step 5: Upload complete metadata to IPFS
    const metadataIPFSHash = await uploadCharacterMetadata(
        tokenId,
        imageIPFSHash,
        characterClass,
        { level, strength, agility, intelligence, generation },
        prompt
    );
    logger.info(LOG_CTX, `Metadata uploaded to IPFS: ipfs://${metadataIPFSHash}`);

    // Step 6: Call ArtGenerator contract to store on-chain
    const signer = getSigner();
    const artGenerator = getArtGeneratorContract(signer);

    logger.info(LOG_CTX, `Submitting on-chain transaction for token #${tokenId}...`);
    const tx = await artGenerator.fulfillArt(tokenId, metadataIPFSHash, prompt);
    const receipt = await tx.wait();

    logger.info(LOG_CTX, `✅ Art generation complete for token #${tokenId}`, {
        txHash: receipt.hash,
        imageIPFS: `ipfs://${imageIPFSHash}`,
        metadataIPFS: `ipfs://${metadataIPFSHash}`,
    });

    return {
        tokenId,
        imageIPFSHash,
        metadataIPFSHash,
        prompt,
        txHash: receipt.hash,
    };
}

/**
 * Checks if art has already been generated for a token.
 */
export async function isArtGenerated(tokenId: number): Promise<boolean> {
    const gameCharacter = getGameCharacterContract();
    const artMeta = await gameCharacter.artMetadata(tokenId);
    return artMeta.isGenerated;
}

export default {
    generateArtForCharacter,
    isArtGenerated,
};
