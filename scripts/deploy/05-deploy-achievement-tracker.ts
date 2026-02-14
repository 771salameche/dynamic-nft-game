import * as fs from "fs";
import { join } from "path";
import * as dotenv from "dotenv";
import { task } from "hardhat/config"; // Import task

task("deploy:achievement-tracker", "Deploys the AchievementTracker contract").setAction(async (_, hre) => {
  const { ethers, network } = hre;
  console.log("Deploying AchievementTracker...");

  const deploymentsPath = join(__dirname, "../../deployments/deployments.json");
  let deployments = JSON.parse(
    fs.readFileSync(deploymentsPath, "utf8")
  );

  const networkDeployments = deployments[network.name];

  if (!networkDeployments || !networkDeployments.GameCharacter || !networkDeployments.GameToken) {
    throw new Error("GameCharacter and GameToken addresses not found in deployments/deployments.json for the current network.");
  }

  const AchievementTracker = await ethers.getContractFactory("AchievementTracker");
  const achievementTracker = await AchievementTracker.deploy(
    networkDeployments.GameToken,
    networkDeployments.GameCharacter
  );

  await achievementTracker.waitForDeployment();
  const address = await achievementTracker.getAddress();

  console.log("AchievementTracker deployed to:", address);

  if (!deployments[network.name]) {
    deployments[network.name] = {};
  }
  deployments[network.name].AchievementTracker = address;
  fs.writeFileSync(
    deploymentsPath,
    JSON.stringify(deployments, null, 2)
  );

  console.log("AchievementTracker address saved to deployments/deployments.json");
});
