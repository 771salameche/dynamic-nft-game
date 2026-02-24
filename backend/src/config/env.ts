import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvConfig {
    // Blockchain
    POLYGON_AMOY_RPC_URL: string;
    POLYGON_AMOY_WS_URL: string;
    PRIVATE_KEY: string;
    GAME_CHARACTER_ADDRESS: string;
    ART_GENERATOR_ADDRESS: string;
    SMART_QUEST_ENGINE_ADDRESS: string;

    // AI Services
    OPENAI_API_KEY: string;
    STABILITY_API_KEY?: string;

    // IPFS / Pinata
    PINATA_API_KEY: string;
    PINATA_SECRET_KEY: string;
    PINATA_JWT: string;

    // Server
    PORT: number;
    NODE_ENV: string;
    SUBGRAPH_URL: string;
}

function getEnvVar(key: string, required = true): string {
    const value = process.env[key];
    if (required && !value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || '';
}

export const config: EnvConfig = {
    // Blockchain
    POLYGON_AMOY_RPC_URL: getEnvVar('POLYGON_AMOY_RPC_URL'),
    POLYGON_AMOY_WS_URL: getEnvVar('POLYGON_AMOY_WS_URL', false) || '',
    PRIVATE_KEY: getEnvVar('PRIVATE_KEY'),
    GAME_CHARACTER_ADDRESS: getEnvVar('GAME_CHARACTER_ADDRESS'),
    ART_GENERATOR_ADDRESS: getEnvVar('ART_GENERATOR_ADDRESS'),
    SMART_QUEST_ENGINE_ADDRESS: getEnvVar('SMART_QUEST_ENGINE_ADDRESS'),

    // AI Services
    OPENAI_API_KEY: getEnvVar('OPENAI_API_KEY'),
    STABILITY_API_KEY: getEnvVar('STABILITY_API_KEY', false),

    // IPFS / Pinata
    PINATA_API_KEY: getEnvVar('PINATA_API_KEY'),
    PINATA_SECRET_KEY: getEnvVar('PINATA_SECRET_KEY'),
    PINATA_JWT: getEnvVar('PINATA_JWT'),

    // Server
    PORT: parseInt(getEnvVar('PORT', false) || '3001', 10),
    NODE_ENV: getEnvVar('NODE_ENV', false) || 'development',
    SUBGRAPH_URL: getEnvVar('SUBGRAPH_URL'),
};

export default config;
