import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { GameCharacter, GameCharacter__factory } from "../../typechain-types";

// Import Hardhat Chai Matchers for custom matchers like .revertedWith, .emit etc.
import "@nomicfoundation/hardhat-chai-matchers";

describe("GameCharacter", function () {
    let gameCharacter: GameCharacter;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let gameCharacterFactory: GameCharacter__factory;

    const TOKEN_NAME = "GameCharacter";
    const TOKEN_SYMBOL = "GC";
    const MAX_LEVEL = 100; // Assuming _MAX_LEVEL is 100 as per contract

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        gameCharacterFactory = await ethers.getContractFactory("GameCharacter");

        // Deploy and initialize the proxy contract
        gameCharacter = (await upgrades.deployProxy(gameCharacterFactory, [TOKEN_NAME, TOKEN_SYMBOL], {
            initializer: "initialize",
            kind: "uups",
        })) as unknown as GameCharacter;
        await gameCharacter.waitForDeployment(); // Ensure deployment is complete
    });

    // Test Suite 1: Deployment & Initialization
    describe("Deployment & Initialization", function () {
        it("Should initialize with correct name and symbol", async function () {
            expect(await gameCharacter.name()).to.equal(TOKEN_NAME);
            expect(await gameCharacter.symbol()).to.equal(TOKEN_SYMBOL);
        });

        it("Should set owner correctly", async function () {
            expect(await gameCharacter.owner()).to.equal(owner.address);
        });

        it("Should prevent reinitialization", async function () {
            await expect(gameCharacter.initialize(TOKEN_NAME, TOKEN_SYMBOL)).to.be.revertedWith(
                "Initializable: contract is already initialized"
            );
        });

        it("Should start with token counter correctly (first token is ID 1)", async function () {
            const characterClass = "Warrior";
            const tokenId = await gameCharacter.mintCharacter.staticCall(characterClass);
            expect(tokenId).to.equal(1);
            await gameCharacter.mintCharacter(characterClass);
        });
    });

    // Test Suite 2: Minting
    describe("Minting", function () {
        it("Should mint character with Warrior class", async function () {
            const characterClass = "Warrior";
            const tokenId = await gameCharacter.mintCharacter.staticCall(characterClass);
            await gameCharacter.mintCharacter(characterClass);

            const traits = await gameCharacter.getCharacterTraits(tokenId);
            expect(traits.characterClass).to.equal(characterClass);
            expect(await gameCharacter.ownerOf(tokenId)).to.equal(owner.address);
        });

        it("Should mint character with Mage class", async function () {
            await gameCharacter.mintCharacter("Warrior"); // Mint one first to get token ID 1 out of the way
            const characterClass = "Mage";
            const tokenId = await gameCharacter.mintCharacter.staticCall(characterClass);
            await gameCharacter.mintCharacter(characterClass);

            const traits = await gameCharacter.getCharacterTraits(tokenId);
            expect(traits.characterClass).to.equal(characterClass);
            expect(await gameCharacter.ownerOf(tokenId)).to.equal(owner.address);
        });

        it("Should mint character with Rogue class", async function () {
            await gameCharacter.mintCharacter("Warrior");
            await gameCharacter.mintCharacter("Mage");
            const characterClass = "Rogue";
            const tokenId = await gameCharacter.mintCharacter.staticCall(characterClass);
            await gameCharacter.mintCharacter(characterClass);

            const traits = await gameCharacter.getCharacterTraits(tokenId);
            expect(traits.characterClass).to.equal(characterClass);
            expect(await gameCharacter.ownerOf(tokenId)).to.equal(owner.address);
        });

        it("Should initialize traits correctly (level 1, base stats)", async function () {
            const characterClass = "Warrior";
            const tokenId = await gameCharacter.mintCharacter.staticCall(characterClass);
            await gameCharacter.mintCharacter(characterClass);

            const traits = await gameCharacter.getCharacterTraits(tokenId);
            expect(traits.level).to.equal(1);
            expect(traits.strength).to.equal(10);
            expect(traits.agility).to.equal(10);
            expect(traits.intelligence).to.equal(10);
            expect(traits.experience).to.equal(0);
            expect(traits.generation).to.equal(1);
            expect(traits.characterClass).to.equal(characterClass);
            expect(traits.lastTrainedAt).to.be.above(0);
        });

        it("Should increment token counter", async function () {
            await gameCharacter.mintCharacter("Warrior");
            const tokenId2 = await gameCharacter.mintCharacter.staticCall("Mage");
            expect(tokenId2).to.equal(2);
            await gameCharacter.mintCharacter("Mage");
        });

        it("Should assign ownership correctly", async function () {
            const tokenId = await gameCharacter.mintCharacter.staticCall("Warrior");
            await gameCharacter.mintCharacter("Warrior");
            expect(await gameCharacter.ownerOf(tokenId)).to.equal(owner.address);
        });

        it("Should emit CharacterMinted event with correct parameters", async function () {
            const characterClass = "Mage";
            const tokenId = await gameCharacter.mintCharacter.staticCall(characterClass);
            const mintTx = await gameCharacter.mintCharacter(characterClass);

            await expect(mintTx)
                .to.emit(gameCharacter, "CharacterMinted")
                .withArgs(tokenId, owner.address, characterClass);
        });

        it("Should revert for invalid class names", async function () {
            const invalidClass = "Healer";
            await expect(gameCharacter.mintCharacter(invalidClass)).to.be.revertedWithCustomError(
                gameCharacter,
                "InvalidCharacterClass"
            ).withArgs(invalidClass);
        });

        it("Should allow only owner to mint", async function () {
            const characterClass = "Warrior";
            await expect(gameCharacter.connect(addr1).mintCharacter(characterClass)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });
    });

    // Test Suite 3: Character Traits
    describe("Character Traits", function () {
        let mintedTokenId: bigint;
        const characterClass = "Rogue";

        beforeEach(async function () {
            mintedTokenId = await gameCharacter.mintCharacter.staticCall(characterClass);
            await gameCharacter.mintCharacter(characterClass);
        });

        it("Should retrieve correct traits for minted character", async function () {
            const traits = await gameCharacter.getCharacterTraits(mintedTokenId);
            expect(traits.characterClass).to.equal(characterClass);
        });

        it("Should have correct initial values", async function () {
            const traits = await gameCharacter.getCharacterTraits(mintedTokenId);
            expect(traits.level).to.equal(1);
            expect(traits.strength).to.equal(10);
            expect(traits.agility).to.equal(10);
            expect(traits.intelligence).to.equal(10);
            expect(traits.experience).to.equal(0);
            expect(traits.generation).to.equal(1);
            expect(traits.characterClass).to.equal(characterClass);
            expect(traits.lastTrainedAt).to.be.above(0);
        });

        it("Should store traits persistently (after another mint)", async function () {
            await gameCharacter.mintCharacter("Warrior");
            const traits = await gameCharacter.getCharacterTraits(mintedTokenId);

            expect(traits.level).to.equal(1);
            expect(traits.strength).to.equal(10);
            expect(traits.agility).to.equal(10);
            expect(traits.intelligence).to.equal(10);
            expect(traits.experience).to.equal(0);
            expect(traits.generation).to.equal(1);
            expect(traits.characterClass).to.equal(characterClass);
            expect(traits.lastTrainedAt).to.be.above(0);
        });
    });

    // Test Suite 4: Access Control
    describe("Access Control", function () {
        it("Should allow owner to perform admin functions (e.g., mint)", async function () {
            const characterClass = "Warrior";
            await expect(gameCharacter.mintCharacter(characterClass)).to.not.be.reverted;
        });

        it("Should deny non-owners from admin functions (e.g., mint)", async function () {
            const characterClass = "Warrior";
            await expect(gameCharacter.connect(addr1).mintCharacter(characterClass)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("Should deny non-owners from upgrading the contract", async function () {
            const GameCharacterV2Factory = await ethers.getContractFactory("GameCharacter", addr1);
            await expect(
                upgrades.upgradeProxy(await gameCharacter.getAddress(), GameCharacterV2Factory, { kind: "uups" })
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    // New Test Suite: Access Control for Authorized Addresses
    describe("Access Control for Authorized Addresses", function () {
        let tokenId: bigint;

        beforeEach(async function () {
            tokenId = await gameCharacter.mintCharacter.staticCall("Warrior");
            await gameCharacter.mintCharacter("Warrior");
        });

        it("Should allow owner to add authorized address", async function () {
            await expect(gameCharacter.addAuthorizedAddress(addr1.address)).to.not.be.reverted;
            expect(await gameCharacter.isAuthorized(addr1.address)).to.be.true;
        });

        it("Should allow owner to remove authorized address", async function () {
            await gameCharacter.addAuthorizedAddress(addr1.address);
            expect(await gameCharacter.isAuthorized(addr1.address)).to.be.true;

            await expect(gameCharacter.removeAuthorizedAddress(addr1.address)).to.not.be.reverted;
            expect(await gameCharacter.isAuthorized(addr1.address)).to.be.false;
        });

        it("Should deny non-owner from adding authorized address", async function () {
            await expect(gameCharacter.connect(addr1).addAuthorizedAddress(addr2.address)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
            expect(await gameCharacter.isAuthorized(addr2.address)).to.be.false;
        });

        it("Should deny non-owner from removing authorized address", async function () {
            await gameCharacter.addAuthorizedAddress(addr1.address);
            await expect(gameCharacter.connect(addr2).removeAuthorizedAddress(addr1.address)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
            expect(await gameCharacter.isAuthorized(addr1.address)).to.be.true;
        });

        it("Should return true for authorized address", async function () {
            await gameCharacter.addAuthorizedAddress(addr1.address);
            expect(await gameCharacter.isAuthorized(addr1.address)).to.be.true;
        });

        it("Should return false for unauthorized address", async function () {
            expect(await gameCharacter.isAuthorized(addr1.address)).to.be.false;
        });
    });

    // New Test Suite: Experience & Leveling
    describe("Experience & Leveling", function () {
        let tokenId: bigint;
        let authAddr: SignerWithAddress;

        beforeEach(async function () {
            tokenId = await gameCharacter.mintCharacter.staticCall("Warrior");
            await gameCharacter.mintCharacter("Warrior");
            authAddr = addr1; // Use addr1 as an authorized address
            await gameCharacter.addAuthorizedAddress(authAddr.address);
        });

        it("Should allow authorized address to gain experience", async function () {
            const initialExp = (await gameCharacter.getCharacterTraits(tokenId)).experience;
            const xpAmount = 50;
            await expect(gameCharacter.connect(authAddr).gainExperience(tokenId, xpAmount)).to.not.be.reverted;
            const finalExp = (await gameCharacter.getCharacterTraits(tokenId)).experience;
            expect(finalExp).to.equal(initialExp + BigInt(xpAmount));
        });

        it("Should allow owner to gain experience", async function () {
            const initialExp = (await gameCharacter.getCharacterTraits(tokenId)).experience;
            const xpAmount = 50;
            await expect(gameCharacter.gainExperience(tokenId, xpAmount)).to.not.be.reverted;
            const finalExp = (await gameCharacter.getCharacterTraits(tokenId)).experience;
            expect(finalExp).to.equal(initialExp + BigInt(xpAmount));
        });

        it("Should deny unauthorized address from gaining experience", async function () {
            const xpAmount = 50;
            await expect(gameCharacter.connect(addr2).gainExperience(tokenId, xpAmount)).to.be.revertedWithCustomError(
                gameCharacter,
                "UnauthorizedCaller"
            ).withArgs(addr2.address);
        });

        it("Should emit ExperienceGained event", async function () {
            const xpAmount = 50;
            const initialTraits = await gameCharacter.getCharacterTraits(tokenId);
            const initialExp = initialTraits.experience;

            await expect(gameCharacter.connect(authAddr).gainExperience(tokenId, xpAmount))
                .to.emit(gameCharacter, "ExperienceGained")
                .withArgs(tokenId, xpAmount, initialExp + BigInt(xpAmount));
        });

        it("Should revert when gaining experience for non-existent token", async function () {
            const nonExistentTokenId = 999;
            const xpAmount = 50;
            await expect(gameCharacter.connect(authAddr).gainExperience(nonExistentTokenId, xpAmount)).to.be.revertedWithCustomError(
                gameCharacter,
                "CharacterDoesNotExist"
            ).withArgs(nonExistentTokenId);
        });

        it("Should revert when gaining experience for character at max level", async function () {
            // Level up to MAX_LEVEL
            const maxLevel = await gameCharacter.getMaxLevel();
            for (let i = 1; i < maxLevel; i++) {
                const requiredXP = await gameCharacter.calculateXPForLevel(i);
                await gameCharacter.connect(authAddr).gainExperience(tokenId, requiredXP);
            }
            // Should be at max level now
            expect((await gameCharacter.getCharacterTraits(tokenId)).level).to.equal(maxLevel);

            // Try to gain more experience
            const xpAmount = 10;
            await expect(gameCharacter.connect(authAddr).gainExperience(tokenId, xpAmount)).to.be.revertedWithCustomError(
                gameCharacter,
                "MaxLevelReached"
            ).withArgs(tokenId, maxLevel);
        });

        it("Should level up character when enough XP is gained", async function () {
            const initialTraits = await gameCharacter.getCharacterTraits(tokenId);
            expect(initialTraits.level).to.equal(1);

            const xpToLevelUp = await gameCharacter.calculateXPForLevel(1); // XP needed for level 1 to level 2 (100 * 1)
            await gameCharacter.connect(authAddr).gainExperience(tokenId, xpToLevelUp);

            const traitsAfterLevelUp = await gameCharacter.getCharacterTraits(tokenId);
            expect(traitsAfterLevelUp.level).to.equal(2);
            expect(traitsAfterLevelUp.experience).to.equal(0); // Should have used up all XP for level up
        });

        it("Should emit LevelUp event on level up", async function () {
            const xpToLevelUp = await gameCharacter.calculateXPForLevel(1);
            await expect(gameCharacter.connect(authAddr).gainExperience(tokenId, xpToLevelUp))
                .to.emit(gameCharacter, "LevelUp")
                .withArgs(tokenId, 1, 2); // From level 1 to 2
        });

        it("Should increase stats on level up", async function () {
            const initialTraits = await gameCharacter.getCharacterTraits(tokenId);
            const xpToLevelUp = await gameCharacter.calculateXPForLevel(1);
            await gameCharacter.connect(authAddr).gainExperience(tokenId, xpToLevelUp);

            const traitsAfterLevelUp = await gameCharacter.getCharacterTraits(tokenId);
            expect(traitsAfterLevelUp.level).to.equal(2);
            expect(traitsAfterLevelUp.strength).to.equal(initialTraits.strength + BigInt(2));
            expect(traitsAfterLevelUp.agility).to.equal(initialTraits.agility + BigInt(2));
            expect(traitsAfterLevelUp.intelligence).to.equal(initialTraits.intelligence + BigInt(2));
        });

        it("Should reset overflow XP after level up", async function () {
            const xpToLevelUp = await gameCharacter.calculateXPForLevel(1);
            const extraXp = 50;
            await gameCharacter.connect(authAddr).gainExperience(tokenId, xpToLevelUp + BigInt(extraXp));

            const traitsAfterLevelUp = await gameCharacter.getCharacterTraits(tokenId);
            expect(traitsAfterLevelUp.level).to.equal(2);
            expect(traitsAfterLevelUp.experience).to.equal(extraXp); // Should retain extra XP
        });

        it("Should handle multiple level ups from single XP gain", async function () {
            const initialTraits = await gameCharacter.getCharacterTraits(tokenId); // Level 1
            const xpForLevel2 = await gameCharacter.calculateXPForLevel(1); // 100 XP
            const xpForLevel3 = await gameCharacter.calculateXPForLevel(2); // 200 XP
            const totalXpToReachLevel3 = xpForLevel2 + xpForLevel3;

            const gainTx = await gameCharacter.connect(authAddr).gainExperience(tokenId, totalXpToReachLevel3);

            const traitsAfterLevelUp = await gameCharacter.getCharacterTraits(tokenId);
            expect(traitsAfterLevelUp.level).to.equal(3);
            expect(traitsAfterLevelUp.experience).to.equal(0);
            expect(traitsAfterLevelUp.strength).to.equal(initialTraits.strength + BigInt(4)); // 2 levels * 2 stats
            await expect(gainTx).to.emit(gameCharacter, "LevelUp").withArgs(tokenId, 1, 2);
            await expect(gainTx).to.emit(gameCharacter, "LevelUp").withArgs(tokenId, 2, 3);
            await expect(gainTx).to.emit(gameCharacter, "TraitsUpdated").withArgs(
                tokenId,
                3, // newLevel
                initialTraits.strength + BigInt(4),
                initialTraits.agility + BigInt(4),
                initialTraits.intelligence + BigInt(4),
                0 // newExperience
            );
        });

        it("Should not level up if insufficient XP", async function () {
            const initialTraits = await gameCharacter.getCharacterTraits(tokenId);
            const xpAmount = 99; // Not enough for level 2
            await gameCharacter.connect(authAddr).gainExperience(tokenId, xpAmount);

            const traitsAfterGain = await gameCharacter.getCharacterTraits(tokenId);
            expect(traitsAfterGain.level).to.equal(initialTraits.level);
            expect(traitsAfterGain.experience).to.equal(initialTraits.experience + BigInt(xpAmount));
        });

        it("Should accurately calculate XP for next level", async function () {
            expect(await gameCharacter.calculateXPForLevel(1)).to.equal(100);
            expect(await gameCharacter.calculateXPForLevel(5)).to.equal(500);
            expect(await gameCharacter.calculateXPForLevel(MAX_LEVEL)).to.equal(BigInt(MAX_LEVEL * 100));
        });

        it("Should calculate character power correctly", async function () {
            const traits = await gameCharacter.getCharacterTraits(tokenId); // Level 1, stats 10
            const expectedPower = (traits.strength + traits.agility + traits.intelligence) * traits.level;
            expect(await gameCharacter.getCharacterPower(tokenId)).to.equal(expectedPower);
        });

        it("Should show increased power after leveling up", async function () {
            const initialTraits = await gameCharacter.getCharacterTraits(tokenId); // Level 1, stats 10
            const initialPower = await gameCharacter.getCharacterPower(tokenId);

            const xpToLevelUp = await gameCharacter.calculateXPForLevel(1);
            await gameCharacter.connect(authAddr).gainExperience(tokenId, xpToLevelUp); // Level 2, stats 12

            const traitsAfterLevelUp = await gameCharacter.getCharacterTraits(tokenId);
            const expectedPowerAfterLevelUp = (traitsAfterLevelUp.strength + traitsAfterLevelUp.agility + traitsAfterLevelUp.intelligence) * traitsAfterLevelUp.level;
            expect(await gameCharacter.getCharacterPower(tokenId)).to.equal(expectedPowerAfterLevelUp);
            expect(await gameCharacter.getCharacterPower(tokenId)).to.be.above(initialPower);
        });

        it("Should revert getCharacterPower for non-existent token", async function () {
            const nonExistentTokenId = 999;
            await expect(gameCharacter.getCharacterPower(nonExistentTokenId)).to.be.revertedWithCustomError(
                gameCharacter,
                "CharacterDoesNotExist"
            ).withArgs(nonExistentTokenId);
        });

        it("Should revert getCharacterTraits for non-existent token", async function () {
            const nonExistentTokenId = 999;
            await expect(gameCharacter.getCharacterTraits(nonExistentTokenId)).to.be.revertedWithCustomError(
                gameCharacter,
                "CharacterDoesNotExist"
            ).withArgs(nonExistentTokenId);
        });
    });

    // Test Suite 5: Upgradeability
    describe("Upgradeability", function () {
        let gameCharacterV2: GameCharacter;

        it("Should allow owner to upgrade the contract", async function () {
            const GameCharacterV2Factory = await ethers.getContractFactory("GameCharacter", owner);
            gameCharacterV2 = (await upgrades.upgradeProxy(
                await gameCharacter.getAddress(),
                GameCharacterV2Factory,
                { kind: "uups" }
            )) as unknown as GameCharacter;
            await gameCharacterV2.waitForDeployment();

            expect(await gameCharacterV2.getAddress()).to.equal(await gameCharacter.getAddress());
        });

        it("Should maintain state after upgrade", async function () {
            const tokenId = await gameCharacter.mintCharacter.staticCall("Mage");
            await gameCharacter.mintCharacter("Mage");

            // Gain some experience and level up before upgrade
            const xpToLevelUp = await gameCharacter.calculateXPForLevel(1);
            await gameCharacter.gainExperience(tokenId, xpToLevelUp + BigInt(50)); // Level 2, 50 XP

            const originalTraits = await gameCharacter.getCharacterTraits(tokenId);

            // Upgrade the contract
            const GameCharacterV2Factory = await ethers.getContractFactory("GameCharacter", owner);
            gameCharacterV2 = (await upgrades.upgradeProxy(
                await gameCharacter.getAddress(),
                GameCharacterV2Factory,
                { kind: "uups" }
            )) as unknown as GameCharacter;
            await gameCharacterV2.waitForDeployment();

            // Verify state is maintained
            const upgradedTraits = await gameCharacterV2.getCharacterTraits(tokenId);
            expect(upgradedTraits.level).to.equal(originalTraits.level);
            expect(upgradedTraits.strength).to.equal(originalTraits.strength);
            expect(upgradedTraits.agility).to.equal(originalTraits.agility);
            expect(upgradedTraits.intelligence).to.equal(originalTraits.intelligence);
            expect(upgradedTraits.experience).to.equal(originalTraits.experience);
            expect(upgradedTraits.generation).to.equal(originalTraits.generation);
            expect(upgradedTraits.characterClass).to.equal(originalTraits.characterClass);

            // Also check new functions state maintained
            expect(await gameCharacterV2.getCharacterPower(tokenId)).to.equal(await gameCharacter.getCharacterPower(tokenId));
        });
    });
});
