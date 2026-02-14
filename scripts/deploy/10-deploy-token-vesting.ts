import * as fs from "fs";
import { join } from "path";
import * as dotenv from "dotenv";
import { task } from "hardhat/config"; // Import task

task("deploy:token-vesting", "Deploys the TokenVesting contract").setAction(async (_, hre) => {
  const { ethers, network } = hre;
  console.log("Deploying TokenVesting...");

  const deploymentsPath = join(__dirname, "../../deployments/deployments.json");
  let deployments = JSON.parse(
    fs.readFileSync(deploymentsPath, "utf8")
  );

  const networkDeployments = deployments[network.name];

  if (!networkDeployments || !networkDeployments.GameToken) {
    throw new Error("GameToken address not found in deployments/deployments.json for the current network.");
  }

  const [deployer] = await ethers.getSigners();

  const TokenVesting = await ethers.getContractFactory("TokenVesting");
  const tokenVesting = await TokenVesting.deploy(
    networkDeployments.GameToken,
    deployer.address
  );

  await tokenVesting.waitForDeployment();
  const address = await tokenVesting.getAddress();

  console.log("TokenVesting deployed to:", address);

  if (!deployments[network.name]) {
    deployments[network.name] = {};
  }
  deployments[network.name].TokenVesting = address;
  fs.writeFileSync(
    deploymentsPath,
    JSON.stringify(deployments, null, 2)
  );

  console.log("TokenVesting address saved to deployments/deployments.json");
});
