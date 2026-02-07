import { ethers } from "hardhat";

/**
 * @title Trigger Upkeep
 * @dev Manually triggers performUpkeep on a contract for local or manual testing.
 */

async function main() {
    const targetAddress = process.env.UPKEEP_TARGET_CONTRACT;
    if (!targetAddress) throw new Error("UPKEEP_TARGET_CONTRACT not set in .env");

    console.log(`Manually triggering upkeep for: ${targetAddress}`);

    // We use a generic interface for AutomationCompatible contracts
    const AUTOMATION_ABI = [
        "function checkUpkeep(bytes calldata checkData) external view returns (bool upkeepNeeded, bytes memory performData)",
        "function performUpkeep(bytes calldata performData) external",
        "function lastUpdateTimestamp() external view returns (uint256)"
    ];

    const target = await ethers.getContractAt(AUTOMATION_ABI, targetAddress);

    // 1. Check if upkeep is actually needed
    console.log("Checking upkeep status...");
    const [upkeepNeeded, performData] = await target.checkUpkeep("0x");
    console.log(`Upkeep Needed: ${upkeepNeeded}`);

    if (upkeepNeeded) {
        console.log("Triggering performUpkeep...");
        const tx = await target.performUpkeep(performData);
        const receipt = await tx.wait();
        console.log("Upkeep executed successfully!");
        console.log("Transaction Hash:", receipt?.hash);

        const newTimestamp = await target.lastUpdateTimestamp();
        console.log("New Last Update Timestamp:", newTimestamp.toString());
    } else {
        console.log("Upkeep not needed yet. Skipping performance.");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
