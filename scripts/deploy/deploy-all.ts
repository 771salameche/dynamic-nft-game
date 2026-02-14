import { run, network } from "hardhat"; // Import network
import * as fs from "fs";
import { join } from "path";
import * as dotenv from "dotenv";
dotenv.config();

async function main() { // Removed hre from function signature
  console.log("Starting full deployment sequence...\n");

  const deploymentsPath = join(__dirname, "../../deployments/deployments.json");

  // Ensure deployments directory exists
  const deploymentsDir = join(__dirname, "../../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // Initialize deployments file if it doesn't exist or is empty
  if (!fs.existsSync(deploymentsPath) || fs.readFileSync(deploymentsPath, "utf8").trim() === "") {
    fs.writeFileSync(deploymentsPath, JSON.stringify({}, null, 2));
    console.log("Initialized empty deployments/deployments.json file.");
  }

  // Deploy GameToken (01-deploy-game-token.ts)
  console.log("--- Deploying GameToken ---");
  await run("deploy:game-token").catch((error: Error) => {
    console.error("GameToken deployment failed:", error);
    process.exit(1);
  });
  console.log("GameToken deployed successfully.\n");
  const currentDeploymentsGameToken = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  console.log(`Current deployments.json for ${network.name}:`, currentDeploymentsGameToken[network.name] || {});

  // Deploy GameCharacter (02-deploy-game-character.ts)
  console.log("--- Deploying GameCharacter ---");
  await run("deploy:game-character").catch((error: Error) => {
    console.error("GameCharacter deployment failed:", error);
    process.exit(1);
  });
  console.log("GameCharacter deployed successfully.\n");
  const currentDeploymentsGameCharacter = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  console.log(`Current deployments.json for ${network.name}:`, currentDeploymentsGameCharacter[network.name] || {});

  // Deploy CharacterStaking (03-deploy-character-staking.ts)
  console.log("--- Deploying CharacterStaking ---");
  await run("deploy:character-staking").catch((error: Error) => {
    console.error("CharacterStaking deployment failed:", error);
    process.exit(1);
  });
  console.log("CharacterStaking deployed successfully.\n");
  const currentDeploymentsCharacterStaking = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  console.log(`Current deployments.json for ${network.name}:`, currentDeploymentsCharacterStaking[network.name] || {});

  // Deploy CharacterBreeding (04-deploy-character-breeding.ts)
  console.log("--- Deploying CharacterBreeding ---");
  await run("deploy:character-breeding").catch((error: Error) => {
    console.error("CharacterBreeding deployment failed:", error);
    process.exit(1);
  });
  console.log("CharacterBreeding deployed successfully.\n");
  const currentDeploymentsCharacterBreeding = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  console.log(`Current deployments.json for ${network.name}:`, currentDeploymentsCharacterBreeding[network.name] || {});

  // Deploy AchievementTracker (05-deploy-achievement-tracker.ts)
  console.log("--- Deploying AchievementTracker ---");
  await run("deploy:achievement-tracker").catch((error: Error) => {
    console.error("AchievementTracker deployment failed:", error);
    process.exit(1);
  });
  console.log("AchievementTracker deployed successfully.\n");
  const currentDeploymentsAchievementTracker = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  console.log(`Current deployments.json for ${network.name}:`, currentDeploymentsAchievementTracker[network.name] || {});

  // Deploy AchievementBadge (06-deploy-achievement-badge.ts)
  console.log("--- Deploying AchievementBadge ---");
  await run("deploy:achievement-badge").catch((error: Error) => {
    console.error("AchievementBadge deployment failed:", error);
    process.exit(1);
  });
  console.log("AchievementBadge deployed successfully.\n");
  const currentDeploymentsAchievementBadge = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  console.log(`Current deployments.json for ${network.name}:`, currentDeploymentsAchievementBadge[network.name] || {});

  // Deploy AchievementTrigger (07-deploy-achievement-trigger.ts)
  console.log("--- Deploying AchievementTrigger ---");
  await run("deploy:achievement-trigger").catch((error: Error) => {
    console.error("AchievementTrigger deployment failed:", error);
    process.exit(1);
  });
  console.log("AchievementTrigger deployed successfully.\n");
  const currentDeploymentsAchievementTrigger = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  console.log(`Current deployments.json for ${network.name}:`, currentDeploymentsAchievementTrigger[network.name] || {});

  // Deploy DailyQuest (08-deploy-daily-quest.ts)
  console.log("--- Deploying DailyQuest ---");
  await run("deploy:daily-quest").catch((error: Error) => {
    console.error("DailyQuest deployment failed:", error);
    process.exit(1);
  });
  console.log("DailyQuest deployed successfully.\n");
  const currentDeploymentsDailyQuest = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  console.log(`Current deployments.json for ${network.name}:`, currentDeploymentsDailyQuest[network.name] || {});

  // Deploy LootBox (09-deploy-loot-box.ts)
  console.log("--- Deploying LootBox ---");
  await run("deploy:loot-box").catch((error: Error) => {
    console.error("LootBox deployment failed:", error);
    process.exit(1);
  });
  console.log("LootBox deployed successfully.\n");
  const currentDeploymentsLootBox = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  console.log(`Current deployments.json for ${network.name}:`, currentDeploymentsLootBox[network.name] || {});

  // Deploy TokenVesting (10-deploy-token-vesting.ts)
  console.log("--- Deploying TokenVesting ---");
  await run("deploy:token-vesting").catch((error: Error) => {
    console.error("TokenVesting deployment failed:", error);
    process.exit(1);
  });
  console.log("TokenVesting deployed successfully.\n");

  console.log("\nFull deployment sequence completed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
