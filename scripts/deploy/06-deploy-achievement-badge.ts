import * as fs from "fs";
import { join } from "path";
import * as dotenv from "dotenv";
import { task } from "hardhat/config"; // Import task

task("deploy:achievement-badge", "Deploys the AchievementBadge contract").setAction(async (_, hre) => {
  const { ethers, network } = hre;
  console.log("Deploying AchievementBadge...");

  const deploymentsPath = join(__dirname, "../../deployments/deployments.json");
  let deployments = JSON.parse(
    fs.readFileSync(deploymentsPath, "utf8")
  );

  const AchievementBadge = await ethers.getContractFactory("AchievementBadge");
  const achievementBadge = await AchievementBadge.deploy();

  await achievementBadge.waitForDeployment();
  const address = await achievementBadge.getAddress();

  console.log("AchievementBadge deployed to:", address);

  if (!deployments[network.name]) {
    deployments[network.name] = {};
  }
  deployments[network.name].AchievementBadge = address;
  fs.writeFileSync(
    deploymentsPath,
    JSON.stringify(deployments, null, 2)
  );

  console.log("AchievementBadge address saved to deployments/deployments.json");
});
