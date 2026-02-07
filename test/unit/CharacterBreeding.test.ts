import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import "@nomicfoundation/hardhat-chai-matchers";
import { 
    CharacterBreeding, 
    GameCharacter, 
    GameToken,
    VRFCoordinatorV2Mock
} from "../../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("CharacterBreeding Unit Tests", function () {
    let breeding: CharacterBreeding;
    let gameCharacter: GameCharacter;
    let gameToken: GameToken;
    let vrfCoordinatorMock: VRFCoordinatorV2Mock;
    
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    
    const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";

    async function mintAndFulfill(signer: SignerWithAddress = addr1): Promise<bigint> {
        const tx = await gameCharacter.mintCharacter("Warrior");
        const receipt = await tx.wait();
        const event = receipt?.logs.find(x => {
            try { return gameCharacter.interface.parseLog(x as any)?.name === "MintRequested"; } catch { return false; }
        });
        const requestId = gameCharacter.interface.parseLog(event as any)?.args[0];
        const tokenId = gameCharacter.interface.parseLog(event as any)?.args[1];
        
        await vrfCoordinatorMock.fulfillRandomWords(requestId, await gameCharacter.getAddress());
        
        if (signer.address !== owner.address) {
            await gameCharacter.transferFrom(owner.address, signer.address, tokenId);
            await gameCharacter.connect(signer).approve(await breeding.getAddress(), tokenId);
        }
        return tokenId;
    }

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();

        const VRFCoordinatorV2MockFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
        vrfCoordinatorMock = await VRFCoordinatorV2MockFactory.deploy(ethers.parseEther("0.1"), 1000000000);
        
        const GameTokenFactory = await ethers.getContractFactory("GameToken");
        gameToken = await GameTokenFactory.deploy(owner.address);

        const GameCharacterFactory = await ethers.getContractFactory("GameCharacter");
        gameCharacter = (await upgrades.deployProxy(
            GameCharacterFactory, 
            ["GameCharacter", "GC", await vrfCoordinatorMock.getAddress(), 1, KEY_HASH], 
            {
                initializer: "initialize",
                kind: "uups",
                constructorArgs: [await vrfCoordinatorMock.getAddress()],
                unsafeAllow: ["constructor", "state-variable-immutable"]
            }
        )) as unknown as GameCharacter;

        await vrfCoordinatorMock.createSubscription();
        await vrfCoordinatorMock.fundSubscription(1, ethers.parseEther("10"));
        await vrfCoordinatorMock.addConsumer(1, await gameCharacter.getAddress());

        const CharacterBreedingFactory = await ethers.getContractFactory("CharacterBreeding");
        breeding = await CharacterBreedingFactory.deploy(
            await vrfCoordinatorMock.getAddress(),
            await gameCharacter.getAddress(),
            await gameToken.getAddress(),
            1,
            KEY_HASH
        );

        await vrfCoordinatorMock.addConsumer(1, await breeding.getAddress());
        await gameCharacter.addAuthorizedAddress(await breeding.getAddress());
        await gameCharacter.addAuthorizedAddress(owner.address);
        
        await gameToken.transfer(addr1.address, ethers.parseEther("5000"));
        await gameToken.connect(addr1).approve(await breeding.getAddress(), ethers.MaxUint256);
    });

    describe("Breeding Mechanics", function () {
        it("Should breed successfully and mint offspring", async function () {
            const id1 = await mintAndFulfill(); 
            const id2 = await mintAndFulfill();

            const tx = await breeding.connect(addr1).breed(id1, id2);
            const receipt = await tx.wait();
            
            const breedLog = receipt?.logs.find(x => {
                try { return breeding.interface.parseLog(x as any)?.name === "BreedingRequested"; } catch { return false; }
            });
            const requestId = breeding.interface.parseLog(breedLog as any)?.args[0];

            await vrfCoordinatorMock.fulfillRandomWords(requestId, await breeding.getAddress());
            
            const balance = await gameCharacter.balanceOf(addr1.address);
            expect(balance).to.equal(3n);
        });

        it("Should enforce cooldown period", async function () {
            const id1 = await mintAndFulfill();
            const id2 = await mintAndFulfill();
            
            await breeding.connect(addr1).breed(id1, id2);
            await expect(breeding.connect(addr1).breed(id1, id2))
                .to.be.revertedWith("Parent 1 cannot breed");
        });
    });

    describe("Fusion System", function () {
        it("Should fuse high-level characters successfully", async function () {
            const id1 = await mintAndFulfill();
            const id2 = await mintAndFulfill();

            await gameCharacter.gainExperience(id1, 65535);
            await gameCharacter.gainExperience(id1, 65535);
            await gameCharacter.gainExperience(id2, 65535);
            await gameCharacter.gainExperience(id2, 65535);

            await expect(breeding.connect(addr1).fuse(id1, id2))
                .to.emit(breeding, "CharactersFused");
            
            const balance = await gameCharacter.balanceOf(addr1.address);
            expect(balance).to.equal(1n); 
            
            const traits = await gameCharacter.getCharacterTraits(3);
            expect(traits.isFused).to.be.true;
        });
    });
});