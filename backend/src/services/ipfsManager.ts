/**
 * IPFS Manager — Handles uploading images and metadata to IPFS via Pinata.
 */

import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { retryWithBackoff } from '../utils/helpers';

const LOG_CTX = 'IPFSManager';
const PINATA_API_URL = 'https://api.pinata.cloud';

/**
 * Uploads an image buffer to IPFS via Pinata.
 * @param imageBuffer The image data as a Buffer.
 * @param fileName The file name for the uploaded image.
 * @returns The IPFS CID (Content Identifier) hash.
 */
export async function uploadImageToIPFS(imageBuffer: Buffer, fileName: string): Promise<string> {
    logger.info(LOG_CTX, `Uploading image to IPFS: ${fileName}`);

    const formData = new FormData();
    formData.append('file', imageBuffer, {
        filename: fileName,
        contentType: 'image/png',
    });

    const metadata = JSON.stringify({
        name: fileName,
        keyvalues: {
            project: 'dynamic-nft-game',
            type: 'character-art',
        },
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
        cidVersion: 1,
    });
    formData.append('pinataOptions', options);

    const response = await retryWithBackoff(async () => {
        return axios.post(`${PINATA_API_URL}/pinning/pinFileToIPFS`, formData, {
            maxBodyLength: Infinity,
            headers: {
                Authorization: `Bearer ${config.PINATA_JWT}`,
                ...formData.getHeaders(),
            },
        });
    });

    const ipfsHash = response.data.IpfsHash;
    logger.info(LOG_CTX, `Image uploaded to IPFS: ${ipfsHash}`);
    return ipfsHash;
}

/**
 * Uploads a JSON metadata object to IPFS via Pinata.
 * This creates the standard NFT metadata (name, description, image, attributes).
 * @param metadata The metadata object to upload.
 * @param name A name identifier for the pin.
 * @returns The IPFS CID hash of the metadata JSON.
 */
export async function uploadMetadataToIPFS(
    metadata: Record<string, unknown>,
    name: string
): Promise<string> {
    logger.info(LOG_CTX, `Uploading metadata to IPFS: ${name}`);

    const response = await retryWithBackoff(async () => {
        return axios.post(
            `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
            {
                pinataContent: metadata,
                pinataMetadata: {
                    name,
                    keyvalues: {
                        project: 'dynamic-nft-game',
                        type: 'character-metadata',
                    },
                },
                pinataOptions: {
                    cidVersion: 1,
                },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config.PINATA_JWT}`,
                },
            }
        );
    });

    const ipfsHash = response.data.IpfsHash;
    logger.info(LOG_CTX, `Metadata uploaded to IPFS: ${ipfsHash}`);
    return ipfsHash;
}

/**
 * Builds and uploads complete NFT metadata (image + JSON) to IPFS.
 * @param tokenId The token ID.
 * @param imageHash The IPFS hash of the character image.
 * @param characterClass The character's class.
 * @param traits Character trait values.
 * @param prompt The AI prompt used to generate the art.
 * @returns The IPFS CID hash of the complete metadata JSON.
 */
export async function uploadCharacterMetadata(
    tokenId: number,
    imageHash: string,
    characterClass: string,
    traits: { level: number; strength: number; agility: number; intelligence: number; generation: number },
    prompt: string
): Promise<string> {
    const metadata = {
        name: `Character #${tokenId}`,
        description: `A dynamic NFT game character of the ${characterClass} class. AI-generated unique artwork.`,
        image: `ipfs://${imageHash}`,
        external_url: `https://dynamic-nft-game.com/character/${tokenId}`,
        attributes: [
            { trait_type: 'Class', value: characterClass },
            { trait_type: 'Level', display_type: 'number', value: traits.level },
            { trait_type: 'Strength', display_type: 'number', value: traits.strength },
            { trait_type: 'Agility', display_type: 'number', value: traits.agility },
            { trait_type: 'Intelligence', display_type: 'number', value: traits.intelligence },
            { trait_type: 'Generation', display_type: 'number', value: traits.generation },
            { trait_type: 'AI Generated', value: 'Yes' },
        ],
        properties: {
            ai_prompt: prompt,
            generated_at: new Date().toISOString(),
        },
    };

    return uploadMetadataToIPFS(metadata, `character-${tokenId}-metadata`);
}

export default {
    uploadImageToIPFS,
    uploadMetadataToIPFS,
    uploadCharacterMetadata,
};
