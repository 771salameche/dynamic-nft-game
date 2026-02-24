/**
 * Express server entry point.
 * Provides API endpoints for:
 *   - Health checks
 *   - Manual art generation triggers
 *   - Art generation status queries
 * Also starts the blockchain event listener.
 */

import express, { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import { config } from './config/env';
import { processArtGeneration, isArtGenerated } from './services/artGenerator';
import { startMintListener } from './listeners/mintListener';
import { startQuestListener } from './listeners/questListener';
import { getSmartQuestContract, getProvider } from './config/contracts';
import { logger } from './utils/logger';

const LOG_CTX = 'Server';
const app = express();

// --- Middleware ---
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(LOG_CTX, `${req.method} ${req.path}`);
    next();
});

// --- Routes ---

/**
 * Health check endpoint.
 */
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
    });
});

/**
 * Check art generation status for a token.
 * GET /api/art/status/:tokenId
 */
app.get('/api/art/status/:tokenId', async (req: Request<{ tokenId: string }>, res: Response) => {
    try {
        const tokenId = parseInt(req.params.tokenId, 10);
        if (isNaN(tokenId) || tokenId < 1) {
            res.status(400).json({ error: 'Invalid token ID' });
            return;
        }

        const generated = await isArtGenerated(tokenId);
        res.json({
            tokenId,
            isGenerated: generated,
        });
    } catch (error) {
        logger.error(LOG_CTX, 'Error checking art status', error);
        res.status(500).json({ error: 'Failed to check art status' });
    }
});

/**
 * Manually trigger art generation for a token.
 * POST /api/art/generate
 * Body: { "tokenId": number }
 */
app.post('/api/art/generate', async (req: Request, res: Response) => {
    try {
        const { tokenId } = req.body;

        if (!tokenId || typeof tokenId !== 'number' || tokenId < 1) {
            res.status(400).json({ error: 'Invalid tokenId. Must be a positive number.' });
            return;
        }

        // Check if already generated
        const alreadyGenerated = await isArtGenerated(tokenId);
        if (alreadyGenerated) {
            res.status(409).json({
                error: 'Art already generated for this token',
                tokenId,
            });
            return;
        }

        logger.info(LOG_CTX, `Manual art generation triggered for token #${tokenId}`);

        // Start generation (async — respond immediately)
        processArtGeneration(String(tokenId))
            .then(() => {
                logger.info(LOG_CTX, `Manual art generation complete for token #${tokenId}`);
            })
            .catch((error: Error) => {
                logger.error(LOG_CTX, `Manual art generation failed for token #${tokenId}`, error);
            });

        res.status(202).json({
            message: 'Art generation started',
            tokenId,
            status: 'processing',
        });
    } catch (error) {
        logger.error(LOG_CTX, 'Error triggering art generation', error);
        res.status(500).json({ error: 'Failed to start art generation' });
    }
});

// --- Quest Routes ---

/**
 * Get active quest for a player.
 */
app.get('/api/quest/status/:player', async (req: Request<{ player: string }>, res: Response) => {
    try {
        const { player } = req.params;
        if (!ethers.isAddress(player)) {
            res.status(400).json({ error: 'Invalid player address' });
            return;
        }

        const smartQuest = getSmartQuestContract(getProvider());
        try {
            const activeQuest = await smartQuest.getActiveQuest(player);
            res.json({
                hasActiveQuest: true,
                quest: {
                    questId: Number(activeQuest.questId),
                    description: activeQuest.description,
                    questType: Number(activeQuest.questType),
                    difficulty: Number(activeQuest.difficulty),
                    expiresAt: Number(activeQuest.expiresAt),
                    completed: activeQuest.completed
                }
            });
        } catch (e) {
            res.json({ hasActiveQuest: false });
        }
    } catch (error) {
        logger.error(LOG_CTX, 'Error checking quest status', error);
        res.status(500).json({ error: 'Failed to check quest status' });
    }
});

/**
 * Manually request a quest for a player (Utility).
 * In production, players call this directly on-chain.
 */
app.post('/api/quest/request', async (req: Request, res: Response) => {
    try {
        const { player } = req.body;
        if (!player || !ethers.isAddress(player)) {
            res.status(400).json({ error: 'Invalid player address' });
            return;
        }

        logger.info(LOG_CTX, `Manual quest request triggered for ${player}`);
        // This just logs it — the listener should catch the on-chain event if the player actually calls it.
        // For testing, we could submit the transaction if we have their private key, 
        // but typically we just wait for the event.
        res.json({ message: 'Listening for onto-chain QuestRequested event', player });
    } catch (error) {
        logger.error(LOG_CTX, 'Error handling manual quest request', error);
        res.status(500).json({ error: 'Internal error' });
    }
});

// --- Error Handler ---
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    logger.error(LOG_CTX, 'Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// --- Start Server ---
async function main(): Promise<void> {
    // Start Express server
    app.listen(config.PORT, () => {
        logger.info(LOG_CTX, `🚀 Server running on http://localhost:${config.PORT}`);
        logger.info(LOG_CTX, `Environment: ${config.NODE_ENV}`);
    });

    // Start blockchain event listeners
    try {
        await startMintListener();
        logger.info(LOG_CTX, '🎧 Mint listener started');

        await startQuestListener();
        logger.info(LOG_CTX, '🎧 Quest listener started');
    } catch (error) {
        logger.error(LOG_CTX, 'Failed to start listeners — running in API-only mode', error);
    }
}

main().catch((error) => {
    logger.error(LOG_CTX, 'Fatal error:', error);
    process.exit(1);
});

export default app;
