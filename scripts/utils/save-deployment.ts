import * as fs from "fs";
import * as path from "path";

export async function saveDeployment(
  networkName: string,
  contractName: string,
  address: string,
  abi: any,
  implementationAddress?: string
) {
  const deploymentsPath = path.join(__dirname, "../../deployments");
  const networkPath = path.join(deploymentsPath, networkName);

  if (!fs.existsSync(deploymentsPath)) {
    fs.mkdirSync(deploymentsPath);
  }

  if (!fs.existsSync(networkPath)) {
    fs.mkdirSync(networkPath);
  }

  // Save detailed deployment info for the contract
  const deploymentInfo = {
    address,
    implementationAddress,
    abi,
    timestamp: new Date().toISOString(),
    network: networkName,
  };

  fs.writeFileSync(
    path.join(networkPath, `${contractName}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Update central deployments.json
  const mainDeploymentsPath = path.join(deploymentsPath, "deployments.json");
  let mainDeployments: any = {};

  if (fs.existsSync(mainDeploymentsPath)) {
    mainDeployments = JSON.parse(fs.readFileSync(mainDeploymentsPath, "utf8"));
  }

  if (!mainDeployments[networkName]) {
    mainDeployments[networkName] = {};
  }

  mainDeployments[networkName][contractName] = address;

  fs.writeFileSync(
    mainDeploymentsPath,
    JSON.stringify(mainDeployments, null, 2)
  );

  console.log(`Saved deployment for ${contractName} at ${address} on ${networkName}`);
}
