import { ethers } from "hardhat";
import { LinkTokenInterface } from "../../typechain-types";

/**
 * @title Manage Upkeep
 * @dev Utilities to manage existing Chainlink Automation upkeeps.
 */

async function main() {
    const [deployer] = await ethers.getSigners();
    const upkeepId = process.env.UPKEEP_ID;
    const REGISTRY_ADDR = process.env.AUTOMATION_REGISTRY || "0x2649980665975dD85E533604313B1F8C648585eF";
    const LINK_TOKEN_ADDR = process.env.LINK_TOKEN || "0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904";

    if (!upkeepId) throw new Error("UPKEEP_ID not set in .env");

    const REGISTRY_ABI = [
        "function getUpkeep(uint256 id) external view returns (address target, uint32 executeGasLimit, bytes checkData, uint96 balance, address lastKeeper, address admin, uint32 maxValidBlocknumber, uint96 amountSpent, bool paused)",
        "function addFunds(uint256 id, uint96 amount) external",
        "function pauseUpkeep(uint256 id) external",
        "function unpauseUpkeep(uint256 id) external",
        "function cancelUpkeep(uint256 id) external"
    ];

    const registry = await ethers.getContractAt(REGISTRY_ABI, REGISTRY_ADDR);
    const linkToken = await ethers.getContractAt("LinkTokenInterface", LINK_TOKEN_ADDR) as unknown as LinkTokenInterface;

    // 1. Check Upkeep Status
    console.log(`
--- Upkeep Status (ID: ${upkeepId}) ---`);
    const upkeep = await registry.getUpkeep(upkeepId);
    console.log(`Target:    ${upkeep.target}`);
    console.log(`Balance:   ${ethers.formatUnits(upkeep.balance, 18)} LINK`);
    console.log(`Spent:     ${ethers.formatUnits(upkeep.amountSpent, 18)} LINK`);
    console.log(`Paused:    ${upkeep.paused}`);
    console.log(`Admin:     ${upkeep.admin}`);

    // Command line arguments could decide which action to take
    // For now, we'll demonstrate funding
    const ACTION = process.env.UPKEEP_ACTION; // "FUND", "PAUSE", "UNPAUSE", "CANCEL"

    if (ACTION === "FUND") {
        const amount = ethers.parseEther("1");
        console.log(`
Funding upkeep with ${ethers.formatUnits(amount, 18)} LINK...`);
        
        // Approve first
        await (await linkToken.approve(REGISTRY_ADDR, amount)).wait();
        // Add funds
        await (await registry.addFunds(upkeepId, amount)).wait();
        console.log("Funding successful.");
    } else if (ACTION === "PAUSE") {
        console.log("
Pausing upkeep...");
        await (await registry.pauseUpkeep(upkeepId)).wait();
        console.log("Upkeep paused.");
    } else if (ACTION === "UNPAUSE") {
        console.log("
Unpausing upkeep...");
        await (await registry.unpauseUpkeep(upkeepId)).wait();
        console.log("Upkeep unpaused.");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
