import { startMintListener, listenForTraitsUpdated } from './mintListener';
import { startQuestListener } from './questListener';
import { logger } from '../utils/logger';

const LOG_CTX = 'MainListener';

async function startAllListeners() {
    logger.info(LOG_CTX, '🚀 Starting all event listeners...\n');

    // Start mint listener
    // These functions in the current codebase return Promise<void> or similar
    startMintListener();
    listenForTraitsUpdated();

    // Start quest listener
    startQuestListener();

    logger.info(LOG_CTX, '✅ All listeners are now active!\n');
}

if (require.main === module) {
    startAllListeners().catch((err) => {
        logger.error(LOG_CTX, 'Fatal error in master listener:', err);
        process.exit(1);
    });
}

export { startAllListeners };
