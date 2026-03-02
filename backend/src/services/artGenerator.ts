import { ethers } from 'ethers';
import { generateCharacterArt } from './openaiService';
import { uploadCompleteNFTData } from './ipfsManager';
import dotenv from 'dotenv';

dotenv.config();

// Import ABIs
const GameCharacterABI = require('../../../artifacts/contracts/GameCharacter.sol/GameCharacter.json').abi;
const ArtGeneratorABI = require('../../../artifacts/contracts/ArtGenerator.sol/ArtGenerator.json').abi;

const provider = new ethers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const gameCharacterContract = new ethers.Contract(
    process.env.GAME_CHARACTER_ADDRESS!,
    GameCharacterABI,
    wallet
);

const artGeneratorContract = new ethers.Contract(
    process.env.ART_GENERATOR_ADDRESS!,
    ArtGeneratorABI,
    wallet
);

export async function processArtGeneration(tokenId: string): Promise<void> {
    console.log(`\n=== Processing Art Generation for Token ${tokenId} ===`);

    try {
        // Step 1: Fetch character traits from blockchain
        console.log('1. Fetching character traits...');
        const traits = await gameCharacterContract.characters(tokenId);

        const characterData = {
            characterClass: traits.characterClass,
            level: Number(traits.level),
            strength: Number(traits.strength),
            agility: Number(traits.agility),
            intelligence: Number(traits.intelligence),
            generation: Number(traits.generation),
            experience: Number(traits.experience),
        };

        console.log('Character traits:', characterData);

        // Step 2: Generate AI art
        console.log('2. Generating AI art...');
        const { imageUrl, prompt } = await generateCharacterArt(tokenId, characterData);

        // Step 3: Upload to IPFS
        console.log('3. Uploading to IPFS...');
        const { metadataHash, imageHash } = await uploadCompleteNFTData(
            imageUrl,
            tokenId,
            characterData,
            prompt
        );

        console.log(`Image IPFS: ipfs://${imageHash}`);
        console.log(`Metadata IPFS: ipfs://${metadataHash}`);

        // Step 4: Update smart contract
        console.log('4. Updating smart contract...');
        // Pass both metadata CID and image CID to ArtGenerator, which will forward to GameCharacter.setArtMetadata
        const tx = await artGeneratorContract.fulfillArt(
            tokenId,
            metadataHash,
            imageHash,
            prompt
        );

        console.log(`Transaction hash: ${tx.hash}`);
        console.log('Waiting for confirmation...');

        const receipt = await tx.wait();
        console.log(`✓ Transaction confirmed in block ${receipt.blockNumber}`);

        console.log(`\n=== Art Generation Complete for Token ${tokenId} ===\n`);
    } catch (error: any) {
        console.error(`✗ Art generation failed for token ${tokenId}:`, error.message);
        throw error;
    }
}

/**
 * Batch process multiple tokens
 */
export async function batchProcessArt(tokenIds: string[]): Promise<void> {
    console.log(`Processing ${tokenIds.length} tokens...`);

    for (const tokenId of tokenIds) {
        try {
            await processArtGeneration(tokenId);
            // Wait 2 seconds between requests to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error: any) {
            console.error(`Failed to process token ${tokenId}:`, error.message);
            // Continue with next token
        }
    }

    console.log('Batch processing complete');
}

/**
 * Checks if art has already been generated for a token.
 */
export async function isArtGenerated(tokenId: string | number): Promise<boolean> {
    try {
        const artMeta = await gameCharacterContract.artMetadata(tokenId);
        return artMeta.isGenerated;
    } catch (error) {
        console.error(`Error checking if art is generated for token ${tokenId}:`, error);
        return false;
    }
}

