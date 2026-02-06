import deployGameToken from "./01-deploy-game-token";
import deployGameCharacter from "./02-deploy-game-character";

async function main() {
  console.log("Starting full deployment...");

  try {
    console.log("\n--- Step 1: Deploying GameToken ---");
    await deployGameToken();

    console.log("\n--- Step 2: Deploying GameCharacter ---");
    await deployGameCharacter();

    console.log("\nDeployment completed successfully!");
  } catch (error) {
    console.error("\nDeployment failed!");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });