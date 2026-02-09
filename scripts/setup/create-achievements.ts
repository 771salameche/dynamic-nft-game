import { ethers } from "hardhat";
import { AchievementTracker } from "../../typechain-types";

/**
 * @title Create Achievements
 * @dev Populates the AchievementTracker with predefined achievements.
 */

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Setting up Achievements with account: ${deployer.address}`);

    const TRACKER_ADDRESS = process.env.ACHIEVEMENT_TRACKER_ADDRESS;
    if (!TRACKER_ADDRESS) {
        throw new Error("ACHIEVEMENT_TRACKER_ADDRESS must be set in .env");
    }

    const tracker = await ethers.getContractAt("AchievementTracker", TRACKER_ADDRESS) as unknown as AchievementTracker;

    // Define Achievements
    // Note: IDs in Trigger contract match the order here (1, 2, 3...)
    
    const achievements = [
        // 1. COLLECTION (IDs 1-4)
        { name: "First Steps", desc: "Mint your first character", cat: "Collection", tier: 1, xp: 50, token: 10 },
        { name: "Collector", desc: "Own 5 characters", cat: "Collection", tier: 2, xp: 100, token: 25 },
        { name: "Hoarder", desc: "Own 25 characters", cat: "Collection", tier: 3, xp: 300, token: 100 },
        { name: "Master Collector", desc: "Own 100 characters", cat: "Collection", tier: 4, xp: 1000, token: 500 },

        // 2. PROGRESSION (IDs 5-9)
        { name: "Rookie", desc: "Reach level 10", cat: "Progression", tier: 1, xp: 100, token: 20 },
        { name: "Veteran", desc: "Reach level 25", cat: "Progression", tier: 2, xp: 250, token: 75 },
        { name: "Elite", desc: "Reach level 50", cat: "Progression", tier: 3, xp: 500, token: 200 },
        { name: "Legendary", desc: "Reach level 75", cat: "Progression", tier: 4, xp: 1000, token: 500 },
        { name: "Max Power", desc: "Reach level 100", cat: "Progression", tier: 5, xp: 2000, token: 1000 },

        // 3. BREEDING (IDs 10-14)
        { name: "Breeder", desc: "Breed your first offspring", cat: "Breeding", tier: 1, xp: 100, token: 30 },
        { name: "Genetics Expert", desc: "Breed 10 offspring", cat: "Breeding", tier: 2, xp: 300, token: 100 },
        { name: "Bloodline Master", desc: "Create 5th generation character", cat: "Breeding", tier: 3, xp: 500, token: 250 },
        { name: "Fusion Pioneer", desc: "Perform your first fusion", cat: "Breeding", tier: 4, xp: 750, token: 400 },
        { name: "Perfect Specimen", desc: "Breed character with all stats 90+", cat: "Breeding", tier: 5, xp: 1500, token: 800 },

        // 4. STAKING (IDs 15-18)
        { name: "Hodler", desc: "Stake for 7 days", cat: "Staking", tier: 1, xp: 75, token: 25 },
        { name: "Committed", desc: "Stake for 30 days", cat: "Staking", tier: 2, xp: 200, token: 75 },
        { name: "Whale", desc: "Stake 10 characters simultaneously", cat: "Staking", tier: 3, xp: 400, token: 150 },
        { name: "Diamond Hands", desc: "Stake for 180 days", cat: "Staking", tier: 4, xp: 1000, token: 500 }
    ];

    console.log(`Adding ${achievements.length} achievements...`);

    for (let i = 0; i < achievements.length; i++) {
        const a = achievements[i];
        const tx = await tracker.addAchievement(
            a.name,
            a.desc,
            a.cat,
            a.tier,
            a.xp,
            ethers.parseEther(a.token.toString()) // Assuming token has 18 decimals
        );
        await tx.wait();
        console.log(`Added: ${a.name} (ID: ${i + 1})`);
    }

    console.log("Achievements setup complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
