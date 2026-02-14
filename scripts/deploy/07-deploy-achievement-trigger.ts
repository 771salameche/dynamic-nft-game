import * as fs from "fs";
import { join } from "path";
import * as dotenv from "dotenv";
import { task } from "hardhat/config"; // Import task

task("deploy:achievement-trigger", "Deploys the AchievementTrigger contract").setAction(async (_, hre) => {
  const { ethers, network } = hre;
  console.log("Deploying AchievementTrigger...");

  const deploymentsPath = join(__dirname, "../../deployments/deployments.json");
  let deployments = JSON.parse(
    fs.readFileSync(deploymentsPath, "utf8")
  );

  const networkDeployments = deployments[network.name];

  if (!networkDeployments || !networkDeployments.AchievementTracker || !networkDeployments.GameCharacter || !networkDeployments.CharacterStaking) {
    throw new Error("AchievementTracker, GameCharacter, and CharacterStaking addresses not found in deployments/deployments.json for the current network.");
  }

  const AchievementTrigger = await ethers.getContractFactory("AchievementTrigger");
  const achievementTrigger = await AchievementTrigger.deploy(
    networkDeployments.AchievementTracker,
    networkDeployments.GameCharacter,
    networkDeployments.CharacterStaking
  );

  await achievementTrigger.waitForDeployment();
  const address = await achievementTrigger.getAddress();

  console.log("AchievementTrigger deployed to:", address);

  if (!deployments[network.name]) {
    deployments[network.name] = {};
  }
  deployments[network.name].AchievementTrigger = address;
  fs.writeFileSync(
    deploymentsPath,
    JSON.stringify(deployments, null, 2)
  );

  console.log("AchievementTrigger address saved to deployments/deployments.json");
});
