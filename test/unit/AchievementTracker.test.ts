import { expect } from "chai";
import "@nomicfoundation/hardhat-chai-matchers";
import { ethers, upgrades } from "hardhat";
import { 
    AchievementTracker, 
    AchievementBadge, 
    AchievementTrigger, 
    GameCharacter, 
    GameToken, 
    CharacterBreeding, 
    CharacterStaking,
    VRFCoordinatorV2Mock 
} from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Achievement System", function () {
    // Contract Instances
    let tracker: AchievementTracker;
    let badge: AchievementBadge;
    let trigger: AchievementTrigger;
    let character: GameCharacter;
    let token: GameToken;
    let breeding: CharacterBreeding;
    let staking: CharacterStaking;
    let vrfMock: VRFCoordinatorV2Mock;

    // Signers
    let owner: HardhatEthersSigner;
    let player1: HardhatEthersSigner;
    let player2: HardhatEthersSigner;
    let player3: HardhatEthersSigner;
    let player4: HardhatEthersSigner;
    let player5: HardhatEthersSigner;
    let player6: HardhatEthersSigner;
    let player7: HardhatEthersSigner;
    let authorizedContract: HardhatEthersSigner;

    const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
    const SUB_ID = 1n;

    async function deploySystemFixture() {
        const [owner, player1, player2, player3, player4, player5, player6, player7, authorizedContract] = await ethers.getSigners();

        // 1. Deploy VRF Mock
        const VRFMockFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
        const vrfMock = await VRFMockFactory.deploy(ethers.parseEther("0.1"), 1000000000);

        const tx = await vrfMock.createSubscription();
        const receipt = await tx.wait();
        // In the mock, it's always 1 for the first sub
        const subId = SUB_ID;
        await vrfMock.fundSubscription(subId, ethers.parseEther("100"));

        // 2. Deploy GameToken
        const TokenFactory = await ethers.getContractFactory("GameToken");
        const token = await TokenFactory.deploy(owner.address);

        // 3. Deploy GameCharacter (UUPS Proxy)
        const CharacterFactory = await ethers.getContractFactory("GameCharacter");
        const character = (await upgrades.deployProxy(CharacterFactory, [
            "GameCharacter",
            "CHAR",
            await vrfMock.getAddress(),
            SUB_ID,
            KEY_HASH
        ], { 
            kind: 'uups',
            constructorArgs: [await vrfMock.getAddress()],
            unsafeAllow: ["constructor", "state-variable-immutable"]
        })) as unknown as GameCharacter;

        // 4. Deploy Achievement System
        const TrackerFactory = await ethers.getContractFactory("AchievementTracker");
        tracker = await TrackerFactory.deploy(await token.getAddress(), await character.getAddress());

        const BadgeFactory = await ethers.getContractFactory("AchievementBadge");
        badge = await BadgeFactory.deploy();

        const StakingFactory = await ethers.getContractFactory("CharacterStaking");
        staking = await StakingFactory.deploy(await character.getAddress(), await token.getAddress());

        const TriggerFactory = await ethers.getContractFactory("AchievementTrigger");
        trigger = await TriggerFactory.deploy(await tracker.getAddress(), await character.getAddress(), await staking.getAddress());

        const BreedingFactory = await ethers.getContractFactory("CharacterBreeding");
        breeding = await BreedingFactory.deploy(
            await vrfMock.getAddress(),
            await character.getAddress(),
            await token.getAddress(),
            SUB_ID,
            KEY_HASH
        );

        // 5. Link Contracts
        await tracker.setAchievementBadge(await badge.getAddress());
        await badge.setAchievementTracker(await tracker.getAddress());
        
        await character.setAchievementTrigger(await trigger.getAddress());
        await breeding.setAchievementTrigger(await trigger.getAddress());
        await staking.setAchievementTrigger(await trigger.getAddress());

        await tracker.addAuthorizedAddress(await trigger.getAddress());
        await tracker.addAuthorizedAddress(await tracker.getAddress()); // Self-authorization for updateProgress
        await tracker.addAuthorizedAddress(await authorizedContract.getAddress());
        await trigger.setAuthorizedCaller(await character.getAddress(), true);
        await trigger.setAuthorizedCaller(await breeding.getAddress(), true);
        await trigger.setAuthorizedCaller(await staking.getAddress(), true);

        // Authorize character for Breeding and Staking
        await character.addAuthorizedAddress(await breeding.getAddress());
        await character.addAuthorizedAddress(await tracker.getAddress()); // For XP rewards

        // Authorize Breeding and Staking to mint tokens (Staking needs it)
        await token.addMinter(await tracker.getAddress());
        await token.addMinter(await staking.getAddress());

        // Add consumers to VRF
        await vrfMock.addConsumer(subId, await character.getAddress());
        await vrfMock.addConsumer(subId, await breeding.getAddress());

        // 6. Setup predefined achievements
        const achievements = [
            // COLLECTION (IDs 1-4)
            { name: "First Steps", desc: "Mint your first character", cat: "Collection", tier: 1, xp: 50, token: 10 },
            { name: "Collector", desc: "Own 5 characters", cat: "Collection", tier: 2, xp: 100, token: 25 },
            { name: "Hoarder", desc: "Own 25 characters", cat: "Collection", tier: 3, xp: 300, token: 100 },
            { name: "Master Collector", desc: "Own 100 characters", cat: "Collection", tier: 4, xp: 1000, token: 500 },

            // PROGRESSION (IDs 5-9)
            { name: "Rookie", desc: "Reach level 10", cat: "Progression", tier: 1, xp: 100, token: 20 },
            { name: "Veteran", desc: "Reach level 25", cat: "Progression", tier: 2, xp: 250, token: 75 },
            { name: "Elite", desc: "Reach level 50", cat: "Progression", tier: 3, xp: 500, token: 200 },
            { name: "Legendary", desc: "Reach level 75", cat: "Progression", tier: 4, xp: 1000, token: 500 },
            { name: "Max Power", desc: "Reach level 100", cat: "Progression", tier: 5, xp: 2000, token: 1000 },

            // BREEDING (IDs 10-14)
            { name: "Breeder", desc: "Breed your first offspring", cat: "Breeding", tier: 1, xp: 100, token: 30 },
            { name: "Genetics Expert", desc: "Breed 10 offspring", cat: "Breeding", tier: 2, xp: 300, token: 100 },
            { name: "Bloodline Master", desc: "Create 5th generation character", cat: "Breeding", tier: 3, xp: 500, token: 250 },
            { name: "Fusion Pioneer", desc: "Perform your first fusion", cat: "Breeding", tier: 4, xp: 750, token: 400 },
            { name: "Perfect Specimen", desc: "Breed character with all stats 90+", cat: "Breeding", tier: 5, xp: 1500, token: 800 },

            // STAKING (IDs 15-18)
            { name: "Hodler", desc: "Stake for 7 days", cat: "Staking", tier: 1, xp: 75, token: 25 },
            { name: "Committed", desc: "Stake for 30 days", cat: "Staking", tier: 2, xp: 200, token: 75 },
            { name: "Whale", desc: "Stake 10 characters simultaneously", cat: "Staking", tier: 3, xp: 400, token: 150 },
            { name: "Diamond Hands", desc: "Stake for 180 days", cat: "Staking", tier: 4, xp: 1000, token: 500 },

            // EXTRA (IDs 19-20)
            { name: "Quest Novice", desc: "Complete 1 quest", cat: "Quests", tier: 1, xp: 50, token: 10 },
            { name: "Quest Master", desc: "Complete 10 quests", cat: "Quests", tier: 2, xp: 200, token: 50 }
        ];

        for (const a of achievements) {
            await tracker.addAchievement(a.name, a.desc, a.cat, a.tier, a.xp, ethers.parseEther(a.token.toString()));
        }

        return { vrfMock, token, character, tracker, badge, staking, trigger, breeding, owner, player1, player2, player3, player4, player5, player6, player7, authorizedContract };
    }

    beforeEach(async function () {
        Object.assign(this, await loadFixture(deploySystemFixture));
        ({ vrfMock, token, character, tracker, badge, staking, trigger, breeding, owner, player1, player2, player3, player4, player5, player6, player7, authorizedContract } = this as any);
    });

    describe("Class Validation Fix", function () {
        it("Should accept Warrior class", async function () {
            await expect(character.mintCharacter("Warrior")).to.not.be.reverted;
        });
        
        it("Should accept Mage class", async function () {
            await expect(character.mintCharacter("Mage")).to.not.be.reverted;
        });
        
        it("Should accept Rogue class", async function () {
            await expect(character.mintCharacter("Rogue")).to.not.be.reverted;
        });
        
        it("Should reject invalid class", async function () {
            await expect(character.mintCharacter("InvalidClass"))
                .to.be.revertedWithCustomError(character, "InvalidCharacterClass");
        });
        
        it("Should emit debug event showing class validation", async function () {
            await expect(character.mintCharacter("Warrior"))
                .to.emit(character, "ClassValidationDebug")
                .withArgs("Warrior", ethers.keccak256(ethers.toUtf8Bytes("Warrior")), true);
        });
    });

    describe("Authorization Verification", function() {
        it("Should have all required authorizations", async function() {
            // Character authorizations
            expect(await character.isAuthorized(await breeding.getAddress())).to.be.true;
            expect(await character.isAuthorized(await tracker.getAddress())).to.be.true;
            
            // Tracker authorizations
            expect(await tracker.isAuthorized(await trigger.getAddress())).to.be.true;
            expect(await tracker.isAuthorized(await tracker.getAddress())).to.be.true;
            
            // Trigger authorizations
            expect(await trigger.authorizedCallers(await character.getAddress())).to.be.true;
            expect(await trigger.authorizedCallers(await breeding.getAddress())).to.be.true;
            expect(await trigger.authorizedCallers(await staking.getAddress())).to.be.true;
            
            // Token minting permissions
            const MINTER_ROLE = await token.MINTER_ROLE();
            expect(await token.hasRole(MINTER_ROLE, await tracker.getAddress())).to.be.true;
            expect(await token.hasRole(MINTER_ROLE, await staking.getAddress())).to.be.true;
        });
    });

    describe("Achievement Management", function () {
        it("Should add new achievement", async function () {
            await expect(tracker.addAchievement("New", "Desc", "Social", 1, 10, 0))
                .to.emit(tracker, "AchievementAdded")
                .withArgs(21n, "New", 1);
            
            const a = await tracker.achievements(21);
            expect(a.name).to.equal("New");
            expect(await tracker.totalAchievements()).to.equal(21n);
        });

        it("Should update achievement details (via re-adding or status)", async function () {
            await tracker.setAchievementStatus(1, false);
            const a = await tracker.achievements(1);
            expect(a.isActive).to.be.false;
        });

        it("Should deactivate achievement", async function () {
            await tracker.setAchievementStatus(5, false);
            await expect(tracker.connect(authorizedContract).unlockAchievement(player1.address, 5, 0))
                .to.be.revertedWith("Achievement is not active");
        });

        it("Should prevent unauthorized achievement addition", async function () {
            await expect(tracker.connect(player1).addAchievement("Fail", "Fail", "Fail", 1, 0, 0))
                .to.be.revertedWithCustomError(tracker, "OwnableUnauthorizedAccount");
        });
    });

    describe("Unlocking Achievements", function () {
        it("Should unlock achievement successfully", async function () {
            await expect(tracker.connect(authorizedContract).unlockAchievement(player3.address, 19, 0))
                .to.emit(tracker, "AchievementUnlocked")
                .withArgs(player3.address, 19n, 50n, ethers.parseEther("10"));
            
            const pa = await tracker.playerAchievements(player3.address, 19);
            expect(pa.isUnlocked).to.be.true;
        });

        it("Should prevent double unlocking", async function () {
            await tracker.connect(authorizedContract).unlockAchievement(player3.address, 19, 0);
            await expect(tracker.connect(authorizedContract).unlockAchievement(player3.address, 19, 0))
                .to.be.revertedWith("Already unlocked");
        });

        it("Should grant correct rewards (XP and tokens)", async function () {
            // Use player4 for clean math, no achievements triggered on mint
            await character.adminMintCharacter(player4.address, "Warrior");
            const tokenId = 1n;
            
            const initialTokens = await token.balanceOf(player4.address);
            const initialTraits = await character.getCharacterTraits(tokenId);
            expect(initialTraits.experience).to.equal(0n);

            // Unlock ID 19 manually (gives 50 XP)
            await tracker.connect(authorizedContract).unlockAchievement(player4.address, 19, tokenId);

            expect(await token.balanceOf(player4.address)).to.equal(initialTokens + ethers.parseEther("10"));
            const finalTraits = await character.getCharacterTraits(tokenId);
            expect(finalTraits.experience).to.equal(50n);
        });

        it("Should increment unlock counter", async function () {
            // Use fresh player5 and player6
            await tracker.connect(authorizedContract).unlockAchievement(player5.address, 19, 0);
            await tracker.connect(authorizedContract).unlockAchievement(player6.address, 19, 0);
            
            const a = await tracker.achievements(19);
            expect(a.unlockedCount).to.equal(2n);
        });
    });

    describe("Progress Tracking", function () {
        it("Should update progress correctly", async function () {
            await tracker.connect(authorizedContract).updateProgress(player1.address, 11, 50, 0);
            expect(await tracker.getAchievementProgress(player1.address, 11)).to.equal(50n);
        });

        it("Should auto-unlock at 100% progress", async function () {
            await expect(tracker.connect(authorizedContract).updateProgress(player1.address, 11, 100, 0))
                .to.emit(tracker, "AchievementUnlocked")
                .withArgs(player1.address, 11n, 300n, ethers.parseEther("100"));
            
            expect((await tracker.playerAchievements(player1.address, 11)).isUnlocked).to.be.true;
        });
    });

    describe("Player Queries", function () {
        it("Should return all player achievements", async function () {
            await tracker.connect(authorizedContract).unlockAchievement(player1.address, 19, 0);
            await tracker.connect(authorizedContract).unlockAchievement(player1.address, 5, 0);
            
            const pas = await tracker.getPlayerAchievements(player1.address);
            expect(pas.length).to.equal(2);
        });

        it("Should return unlocked count", async function () {
            await tracker.connect(authorizedContract).unlockAchievement(player7.address, 19, 0);
            expect(await tracker.unlockedAchievementCount(player7.address)).to.equal(1n);
        });

        it("Should filter by category", async function () {
            const list = await tracker.getAchievementsByCategory("Collection");
            expect(list.length).to.equal(4);
        });
    });

    describe("Integration Tests", function () {
        it("Should unlock 'First Steps' on first mint", async function () {
            await expect(character.mintCharacter("Warrior"))
                .to.emit(tracker, "AchievementUnlocked")
                .withArgs(owner.address, 1n, 50n, ethers.parseEther("10"));
        });

        it("Should unlock 'Collector' after 5 mints", async function () {
            // Use player6 for isolation
            for (let i = 0; i < 4; i++) {
                await character.adminMintCharacter(player6.address, "Warrior");
            }
            // 5th character triggers Collector (balance becomes 5)
            // Use mintCharacter here to trigger achievement trigger
            // Need to connect as player6? No, mintCharacter is onlyOwner.
            // But checkMintAchievements uses msg.sender.
            // Wait, GameCharacter.sol mintCharacter uses msg.sender for checkMintAchievements.
            // So if owner mints to themselves, it works.
            // I'll make player6 the owner temporarily or just use owner for this test.
            
            // Re-evaluating: I'll use owner for this test to keep it simple.
            for (let i = 0; i < 4; i++) {
                await character.adminMintCharacter(owner.address, "Warrior");
            }
            await expect(character.mintCharacter("Warrior"))
                .to.emit(tracker, "AchievementUnlocked")
                .withArgs(owner.address, 2n, 100n, ethers.parseEther("25"));
        });

        it("Should unlock 'Rookie' at level 10", async function () {
            await character.mintCharacter("Warrior"); // ID 1
            const tokenId = (await character.balanceOf(owner.address));
            
            await expect(character.gainExperience(tokenId, 4500))
                .to.emit(tracker, "AchievementUnlocked")
                .withArgs(owner.address, 5n, 100n, ethers.parseEther("20"));
        });

        it("Should unlock 'Breeder' after first breeding", async function () {
            // Use player7 for fresh state
            await character.adminMintCharacter(player7.address, "Warrior"); // ID 1, Req 1
            await character.adminMintCharacter(player7.address, "Warrior"); // ID 2, Req 2
            
            await vrfMock.fulfillRandomWords(1, await character.getAddress());
            await vrfMock.fulfillRandomWords(2, await character.getAddress());

            await token.addMinter(owner.address);
            await token.mint(player7.address, ethers.parseEther("1000"));
            await token.connect(player7).approve(await breeding.getAddress(), ethers.parseEther("1000"));

            await breeding.connect(player7).breed(1, 2);
            
            // Breed is Req 3
            // This triggers mintOffspring which triggers ID 1
            // Then fulfillRandomWords triggers ID 10
            await vrfMock.fulfillRandomWords(3, await breeding.getAddress(), { gasLimit: 3000000 });
            
            // Verify state
            expect(await tracker.unlockedAchievementCount(player7.address)).to.equal(2n);
            const achievements = await tracker.getPlayerAchievements(player7.address);
            const ids = achievements.map(a => a.achievementId);
            expect(ids).to.include(1n);
            expect(ids).to.include(10n);
        });

        it("Should unlock 'Hodler' after 7 days staking", async function () {
            await character.mintCharacter("Warrior");
            const tokenId = await character.balanceOf(owner.address);
            await character.approve(await staking.getAddress(), tokenId);
            await staking.stake(tokenId);

            await time.increase(time.duration.days(7));

            await expect(staking.claimRewards())
                .to.emit(tracker, "AchievementUnlocked")
                .withArgs(owner.address, 15n, 75n, ethers.parseEther("25"));
        });
    });

    describe("Badge Minting", function () {
        it("Should mint badge on achievement unlock", async function () {
            await tracker.connect(authorizedContract).unlockAchievement(player2.address, 19, 0);
            expect(await badge.balanceOf(player2.address)).to.equal(1n);
            
            const meta = await badge.badgeMetadata(1);
            expect(meta.achievementId).to.equal(19n);
            expect(meta.name).to.equal("Quest Novice");
        });

        it("Should create soulbound NFT", async function () {
            await tracker.connect(authorizedContract).unlockAchievement(player2.address, 19, 0);
            expect(await badge.locked(1)).to.be.true;
            
            await expect(badge.connect(player2).transferFrom(player2.address, player1.address, 1))
                .to.be.revertedWith("Soulbound: Token is non-transferable");
        });

        it("Should generate correct metadata", async function () {
            await tracker.connect(authorizedContract).unlockAchievement(player2.address, 19, 0);
            const uri = await badge.tokenURI(1);
            expect(uri).to.contain("data:application/json;base64,");
        });
    });

    describe("Rewards Distribution", function () {
        it("Should mint tokens correctly", async function () {
            // Using player7 who was fresh in Player Queries but it was a separate test.
            // fixture resets everything so player2 is fine.
            const initial = await token.balanceOf(player2.address);
            await tracker.connect(authorizedContract).unlockAchievement(player2.address, 19, 0);
            expect(await token.balanceOf(player2.address)).to.equal(initial + ethers.parseEther("10"));
        });

        it("Should grant XP to character", async function () {
            // Give character WITHOUT triggering achievements (no auto ID 1)
            await character.adminMintCharacter(owner.address, "Warrior"); 
            const tokenId = 1n;
            const initialXP = (await character.getCharacterTraits(tokenId)).experience;
            expect(initialXP).to.equal(0n);

            // Now manually unlock ID 19 (gives 50 XP)
            await tracker.connect(authorizedContract).unlockAchievement(owner.address, 19, tokenId);
            expect((await character.getCharacterTraits(tokenId)).experience).to.equal(50n);
        });
    });

    describe("Access Control", function () {
        it("Should only allow authorized contracts to unlock", async function () {
            await expect(tracker.connect(player1).unlockAchievement(player1.address, 1, 0))
                .to.be.revertedWith("Caller is not authorized");
        });

        it("Should only allow owner to add achievements", async function () {
            await expect(tracker.connect(player1).addAchievement("X", "X", "X", 1, 0, 0))
                .to.be.revertedWithCustomError(tracker, "OwnableUnauthorizedAccount");
        });

        it("Should prevent unauthorized progress updates", async function () {
            await expect(tracker.connect(player1).updateProgress(player1.address, 1, 50, 0))
                .to.be.revertedWith("Caller is not authorized");
        });
    });

    describe("Predefined Achievements Check", function () {
        it("Should have all 20 predefined achievements", async function () {
            expect(await tracker.totalAchievements()).to.equal(20n);
            
            const names = [
                "First Steps", "Collector", "Hoarder", "Master Collector",
                "Rookie", "Veteran", "Elite", "Legendary", "Max Power",
                "Breeder", "Genetics Expert", "Bloodline Master", "Fusion Pioneer", "Perfect Specimen",
                "Hodler", "Committed", "Whale", "Diamond Hands",
                "Quest Novice", "Quest Master"
            ];

            for (let i = 1; i <= 20; i++) {
                const a = await tracker.achievements(i);
                expect(a.name).to.equal(names[i-1]);
            }
        });
    });
});