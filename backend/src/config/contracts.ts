import { ethers } from 'ethers';
import { config } from './env';
import {
    GameCharacterAbiEthers,
    ArtGeneratorAbiEthers,
    SmartQuestEngineAbiEthers,
} from '../../../shared/abi';

// --- Provider & Signer ---

export function getProvider(): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider(config.POLYGON_AMOY_RPC_URL);
}

export function getWebSocketProvider(): ethers.WebSocketProvider | null {
    if (!config.POLYGON_AMOY_WS_URL) return null;
    return new ethers.WebSocketProvider(config.POLYGON_AMOY_WS_URL);
}

export function getSigner(): ethers.Wallet {
    const provider = getProvider();
    return new ethers.Wallet(config.PRIVATE_KEY, provider);
}

// --- Contract Instances ---

export function getGameCharacterContract(signerOrProvider?: ethers.Signer | ethers.Provider): ethers.Contract {
    const connection = signerOrProvider || getProvider();
    return new ethers.Contract(config.GAME_CHARACTER_ADDRESS, GameCharacterAbiEthers, connection);
}

export function getArtGeneratorContract(signerOrProvider?: ethers.Signer | ethers.Provider): ethers.Contract {
    const connection = signerOrProvider || getSigner();
    return new ethers.Contract(config.ART_GENERATOR_ADDRESS, ArtGeneratorAbiEthers, connection);
}

export function getSmartQuestContract(signerOrProvider?: ethers.Signer | ethers.Provider): ethers.Contract {
    const connection = signerOrProvider || getSigner();
    return new ethers.Contract(config.SMART_QUEST_ENGINE_ADDRESS, SmartQuestEngineAbiEthers, connection);
}

export default {
    getProvider,
    getWebSocketProvider,
    getSigner,
    getGameCharacterContract,
    getArtGeneratorContract,
    getSmartQuestContract,
};
