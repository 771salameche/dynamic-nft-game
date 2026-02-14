// Import all deployment tasks to ensure they are registered with Hardhat.
import "./deploy/01-deploy-game-token";
import "./deploy/02-deploy-game-character";
import "./deploy/03-deploy-character-staking";
import "./deploy/04-deploy-character-breeding";
import "./deploy/05-deploy-achievement-tracker";
import "./deploy/06-deploy-achievement-badge";
import "./deploy/07-deploy-achievement-trigger";
import "./deploy/08-deploy-daily-quest";
import "./deploy/09-deploy-loot-box";
import "./deploy/10-deploy-token-vesting";
// import "./deploy/deploy-all"; // deploy-all is a script, not a task definition
