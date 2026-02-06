import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"; // This might be "@nomicfoundation/hardhat-ethers/signers" in newer versions
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
            // Use .staticCall to get the return value without sending a transaction
            const tokenId = await gameCharacter.mintCharacter.staticCall(characterClass);
            expect(tokenId).to.equal(1);
            // Send the actual transaction after confirming the return value
            await gameCharacter.mintCharacter(characterClass);
        });
    });

    // Test Suite 2: Minting
    describe("Minting", function () {
        it("Should mint character with Warrior class", async function () {
            const characterClass = "Warrior";
            const tokenId = await gameCharacter.mintCharacter.staticCall(characterClass);
            await gameCharacter.mintCharacter(characterClass); // Send the actual transaction

            const traits = await gameCharacter.getCharacterTraits(tokenId);
            expect(traits.characterClass).to.equal(characterClass);
            expect(await gameCharacter.ownerOf(tokenId)).to.equal(owner.address);
        });

        it("Should mint character with Mage class", async function () {
            await gameCharacter.mintCharacter("Warrior"); // Mint one first to get token ID 1 out of the way
            const characterClass = "Mage";
            const tokenId = await gameCharacter.mintCharacter.staticCall(characterClass); // This should be 2
            await gameCharacter.mintCharacter(characterClass); // Send the actual transaction

            const traits = await gameCharacter.getCharacterTraits(tokenId);
            expect(traits.characterClass).to.equal(characterClass);
            expect(await gameCharacter.ownerOf(tokenId)).to.equal(owner.address);
        });

        it("Should mint character with Rogue class", async function () {
            await gameCharacter.mintCharacter("Warrior"); // Mint one first
            await gameCharacter.mintCharacter("Mage"); // Mint another
            const characterClass = "Rogue";
            const tokenId = await gameCharacter.mintCharacter.staticCall(characterClass); // This should be 3
            await gameCharacter.mintCharacter(characterClass); // Send the actual transaction

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
            expect(traits.lastTrainedAt).to.be.above(0); // Should be a timestamp
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
        let mintedTokenId: bigint; // Use bigint for tokenId from ethers v6
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
            await gameCharacter.mintCharacter("Warrior"); // Mint another character
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
            // Note: The `getAddress()` method is a common way to get the address of a deployed contract.
            // Depending on the exact Hardhat-Ethers version and how the `upgrades` plugin
            // returns the deployed proxy, you might need to adjust `gameCharacter.getAddress()`
            // to `gameCharacter.address` if it's directly available.
            const GameCharacterV2Factory = await ethers.getContractFactory("GameCharacter", addr1); // Use addr1 to deploy and attempt upgrade
            await expect(
                upgrades.upgradeProxy(await gameCharacter.getAddress(), GameCharacterV2Factory, { kind: "uups" })
            ).to.be.revertedWith("Ownable: caller is not the owner");
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
            // Mint a character before upgrade
            const tokenId = await gameCharacter.mintCharacter.staticCall("Mage");
            await gameCharacter.mintCharacter("Mage"); // Send the actual transaction for state change

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
        });
    });
});