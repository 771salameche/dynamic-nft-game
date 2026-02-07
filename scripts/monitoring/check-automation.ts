import { ethers } from "hardhat";

/**
 * @title Automation Monitoring Dashboard
 * @dev Monitors health, balance, and execution history of Chainlink Automation upkeeps.
 */

async function main() {
    const upkeepId = process.env.UPKEEP_ID;
    const REGISTRY_ADDR = process.env.AUTOMATION_REGISTRY || "0x2649980665975dD85E533604313B1F8C648585eF";

    if (!upkeepId) throw new Error("UPKEEP_ID not set in .env");

    const REGISTRY_ABI = [
        "function getUpkeep(uint256 id) external view returns (address target, uint32 executeGasLimit, bytes checkData, uint96 balance, address lastKeeper, address admin, uint32 maxValidBlocknumber, uint96 amountSpent, bool paused)",
        "event UpkeepPerformed(uint256 indexed id, bool indexed success, address indexed from, uint96 payment, bytes performData)"
    ];

    const registry = await ethers.getContractAt(REGISTRY_ABI, REGISTRY_ADDR);

    console.log("=========================================");
    console.log("   AUTOMATION MONITORING DASHBOARD       ");
    console.log("=========================================");

    // 1. Fetch Core Info
    const upkeep = await registry.getUpkeep(upkeepId);
    
    console.log(`Upkeep ID:     ${upkeepId}`);
    console.log(`Target:        ${upkeep.target}`);
    console.log(`Balance:       ${ethers.formatUnits(upkeep.balance, 18)} LINK`);
    console.log(`Status:        ${upkeep.paused ? "🔴 PAUSED" : "🟢 ACTIVE"}`);
    console.log(`Last Keeper:   ${upkeep.lastKeeper}`);
    console.log(`Total Spent:   ${ethers.formatUnits(upkeep.amountSpent, 18)} LINK`);

    // 2. Health Check
    const minBalance = ethers.parseUnits("0.5", 18);
    if (BigInt(upkeep.balance) < minBalance) {
        console.warn("
⚠️  WARNING: LOW BALANCE! Please fund the upkeep soon.");
    }

    // 3. Execution History (Fetch last 10 events)
    console.log("
--- Execution History (Last 10 Events) ---");
    const filter = registry.filters.UpkeepPerformed(upkeepId);
    const events = await registry.queryFilter(filter, -10000); // Check last ~10000 blocks

    let successCount = 0;
    let totalPayment = 0n;

    events.slice(-10).forEach((event: any) => {
        const { success, payment } = event.args;
        console.log(`Block: ${event.blockNumber} | Success: ${success ? "✅" : "❌"} | Cost: ${ethers.formatUnits(payment, 18)} LINK`);
        if (success) successCount++;
        totalPayment += payment;
    });

    // 4. Statistics
    console.log("
--- Statistics ---");
    console.log(`Success Rate:  ${events.length > 0 ? (successCount / Math.min(events.length, 10) * 100).toFixed(0) : 0}%`);
    if (events.length > 0) {
        const avgCost = totalPayment / BigInt(Math.min(events.length, 10));
        console.log(`Avg Cost/Run:  ${ethers.formatUnits(avgCost, 18)} LINK`);
    }

    console.log("=========================================");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
