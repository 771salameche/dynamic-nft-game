import { network, run, ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const networkName = network.name;
  const deploymentsPath = path.join(__dirname, "../deployments", networkName);
  const centralDeploymentsPath = path.join(__dirname, "../deployments/deployments.json");

  if (networkName === "hardhat" || networkName === "localhost") {
    console.log("Skipping verification on local network.");
    return;
  }

  if (!fs.existsSync(centralDeploymentsPath)) {
    console.error("deployments.json not found!");
    return;
  }

  const centralDeployments = JSON.parse(fs.readFileSync(centralDeploymentsPath, "utf8"));
  const networkDeployments = centralDeployments[networkName];

  if (!networkDeployments) {
    console.error(`No deployments found for network: ${networkName}`);
    return;
  }

  console.log(`Starting verification for network: ${networkName}`);

  for (const contractName of Object.keys(networkDeployments)) {
    const address = networkDeployments[contractName];
    const contractPath = path.join(deploymentsPath, `${contractName}.json`);

    if (fs.existsSync(contractPath)) {
      const info = JSON.parse(fs.readFileSync(contractPath, "utf8"));
      const verifyAddress = info.implementationAddress || address;

      console.log(`Verifying ${contractName} at ${verifyAddress}...`);

      try {
        const verifyArgs: any = {
          address: verifyAddress,
        };

        // Add constructor arguments if it's GameToken
        if (contractName === "GameToken") {
          const [deployer] = await ethers.getSigners();
          verifyArgs.constructorArguments = [deployer.address];
        }

        await run("verify:verify", verifyArgs);
      } catch (error: any) {
        if (error.message.includes("Already Verified")) {
          console.log(`${contractName} is already verified.`);
        } else {
          console.error(`Error verifying ${contractName}:`, error.message);
        }
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });