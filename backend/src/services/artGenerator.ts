/**
 * Art Generator Service — Orchestrates the full AI art generation pipeline:
 *   1. Read character traits from the blockchain
 *   2. Generate an image via OpenAI DALL-E 3
 *   3. Upload image + metadata to IPFS via Pinata (using ipfsManager)
 *   4. Call ArtGenerator contract to store the IPFS hash on-chain
 */

import { getGameCharacterContract, getArtGeneratorContract, getSigner } from '../config/contracts';
import { generateCharacterArt, CharacterTraits } from './openaiService';
import { uploadCompleteNFTData } from './ipfsManager';
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

    const characterTraits: CharacterTraits = {
        characterClass: traits.characterClass,
        strength: Number(traits.strength),
        agility: Number(traits.agility),
        intelligence: Number(traits.intelligence),
        level: Number(traits.level),
        generation: Number(traits.generation),
    };

    // Add experience specifically for metadata (ipfsManager expects it)
    const traitsWithExp = {
        ...characterTraits,
        experience: Number(traits.experience || 0)
    };

    logger.info(LOG_CTX, `Token #${tokenId} traits:`, traitsWithExp);

    // Step 2: Generate image via DALL-E 3
    logger.info(LOG_CTX, `Generating AI image for token #${tokenId}...`);
    const { imageUrl, prompt } = await generateCharacterArt(String(tokenId), characterTraits);
    logger.info(LOG_CTX, `AI image generated for token #${tokenId}`);

    // Step 3: Upload complete data to IPFS (Image + Metadata)
    logger.info(LOG_CTX, `Uploading complete NFT data to IPFS for token #${tokenId}...`);
    const { metadataHash, imageHash } = await uploadCompleteNFTData(
        imageUrl,
        String(tokenId),
        traitsWithExp,
        prompt
    );
    logger.info(LOG_CTX, `IPFS Upload complete: img=ipfs://${imageHash}, meta=ipfs://${metadataHash}`);

    // Step 4: Call ArtGenerator contract to store on-chain
    const signer = getSigner();
    const artGenerator = getArtGeneratorContract(signer);

    logger.info(LOG_CTX, `Submitting on-chain transaction for token #${tokenId}...`);
    const tx = await artGenerator.fulfillArt(tokenId, metadataHash, prompt);
    const receipt = await tx.wait();

    logger.info(LOG_CTX, `✅ Art generation complete for token #${tokenId}`, {
        txHash: receipt.hash,
        imageIPFS: `ipfs://${imageHash}`,
        metadataIPFS: `ipfs://${metadataHash}`,
    });

    return {
        tokenId,
        imageIPFSHash: imageHash,
        metadataIPFSHash: metadataHash,
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
