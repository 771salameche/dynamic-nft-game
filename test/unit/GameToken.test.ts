import { expect } from "chai";
import { ethers } from "hardhat";
import { GameToken, GameToken__factory } from "../../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("GameToken", function () {
    let gameToken: GameToken;
    let owner: SignerWithAddress;
    let minter: SignerWithAddress;
    let user: SignerWithAddress;
    let other: SignerWithAddress;
    let gameTokenFactory: GameToken__factory;

    const NAME = "Game Token";
    const SYMBOL = "GAME";
    const INITIAL_SUPPLY = ethers.parseEther("1000000");

    beforeEach(async function () {
        [owner, minter, user, other] = await ethers.getSigners();
        gameTokenFactory = await ethers.getContractFactory("GameToken");
        gameToken = await gameTokenFactory.deploy(owner.address);
        await gameToken.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should have correct name and symbol", async function () {
            expect(await gameToken.name()).to.equal(NAME);
            expect(await gameToken.symbol()).to.equal(SYMBOL);
        });

        it("Should mint initial supply to deployer", async function () {
            expect(await gameToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
        });

        it("Should grant admin role to deployer", async function () {
            const DEFAULT_ADMIN_ROLE = await gameToken.DEFAULT_ADMIN_ROLE();
            expect(await gameToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
        });

        it("Should grant minter role to deployer", async function () {
            const MINTER_ROLE = await gameToken.MINTER_ROLE();
            expect(await gameToken.hasRole(MINTER_ROLE, owner.address)).to.be.true;
        });

        it("Should have 18 decimals", async function () {
            expect(await gameToken.decimals()).to.equal(18);
        });
    });

    describe("Minting", function () {
        it("Should allow minter to mint tokens", async function () {
            const MINTER_ROLE = await gameToken.MINTER_ROLE();
            await gameToken.grantRole(MINTER_ROLE, minter.address);
            
            const amount = ethers.parseEther("100");
            await expect(gameToken.connect(minter).mint(user.address, amount))
                .to.not.be.reverted;
            
            expect(await gameToken.balanceOf(user.address)).to.equal(amount);
        });

        it("Should prevent non-minters from minting", async function () {
            const amount = ethers.parseEther("100");
            const MINTER_ROLE = await gameToken.MINTER_ROLE();
            await expect(gameToken.connect(user).mint(user.address, amount))
                .to.be.revertedWithCustomError(gameToken, "AccessControlUnauthorizedAccount")
                .withArgs(user.address, MINTER_ROLE);
        });

        it("Should emit Transfer event on mint", async function () {
            const amount = ethers.parseEther("100");
            await expect(gameToken.mint(user.address, amount))
                .to.emit(gameToken, "Transfer")
                .withArgs(ethers.ZeroAddress, user.address, amount);
        });

        it("Should update total supply correctly", async function () {
            const amount = ethers.parseEther("100");
            const supplyBefore = await gameToken.totalSupply();
            await gameToken.mint(user.address, amount);
            expect(await gameToken.totalSupply()).to.equal(supplyBefore + amount);
        });
    });

    describe("Role Management", function () {
        it("Should allow admin to add minters", async function () {
            const MINTER_ROLE = await gameToken.MINTER_ROLE();
            await expect(gameToken.addMinter(minter.address))
                .to.emit(gameToken, "RoleGranted")
                .withArgs(MINTER_ROLE, minter.address, owner.address);
            
            expect(await gameToken.hasRole(MINTER_ROLE, minter.address)).to.be.true;
        });

        it("Should allow admin to remove minters", async function () {
            const MINTER_ROLE = await gameToken.MINTER_ROLE();
            await gameToken.addMinter(minter.address);
            
            await expect(gameToken.removeMinter(minter.address))
                .to.emit(gameToken, "RoleRevoked")
                .withArgs(MINTER_ROLE, minter.address, owner.address);
            
            expect(await gameToken.hasRole(MINTER_ROLE, minter.address)).to.be.false;
        });

        it("Should prevent non-admins from managing roles", async function () {
            const DEFAULT_ADMIN_ROLE = await gameToken.DEFAULT_ADMIN_ROLE();
            await expect(gameToken.connect(user).addMinter(other.address))
                .to.be.revertedWithCustomError(gameToken, "AccessControlUnauthorizedAccount")
                .withArgs(user.address, DEFAULT_ADMIN_ROLE);
                
            await expect(gameToken.connect(user).removeMinter(minter.address))
                .to.be.revertedWithCustomError(gameToken, "AccessControlUnauthorizedAccount")
                .withArgs(user.address, DEFAULT_ADMIN_ROLE);
        });
    });

    describe("Burning", function () {
        beforeEach(async function () {
            const amount = ethers.parseEther("100");
            await gameToken.transfer(user.address, amount);
        });

        it("Should allow users to burn their own tokens", async function () {
            const amount = ethers.parseEther("40");
            const balanceBefore = await gameToken.balanceOf(user.address);
            
            await expect(gameToken.connect(user).burn(amount))
                .to.emit(gameToken, "Transfer")
                .withArgs(user.address, ethers.ZeroAddress, amount);
                
            expect(await gameToken.balanceOf(user.address)).to.equal(balanceBefore - amount);
        });

        it("Should decrease total supply on burn", async function () {
            const amount = ethers.parseEther("40");
            const supplyBefore = await gameToken.totalSupply();
            await gameToken.connect(user).burn(amount);
            expect(await gameToken.totalSupply()).to.equal(supplyBefore - amount);
        });

        it("Should revert if burning more than balance", async function () {
            const balance = await gameToken.balanceOf(user.address);
            const amount = balance + BigInt(1);
            await expect(gameToken.connect(user).burn(amount))
                .to.be.revertedWithCustomError(gameToken, "ERC20InsufficientBalance");
        });
    });

    describe("Transfers", function () {
        it("Should allow normal ERC20 transfers", async function () {
            const amount = ethers.parseEther("50");
            await expect(gameToken.transfer(user.address, amount))
                .to.changeTokenBalances(gameToken, [owner, user], [-amount, amount]);
        });

        it("Should update balances correctly", async function () {
            const amount = ethers.parseEther("50");
            await gameToken.transfer(user.address, amount);
            expect(await gameToken.balanceOf(user.address)).to.equal(amount);
            
            await gameToken.connect(user).transfer(other.address, amount);
            expect(await gameToken.balanceOf(user.address)).to.equal(0);
            expect(await gameToken.balanceOf(other.address)).to.equal(amount);
        });
    });

    describe("Interface Support", function () {
        it("Should support AccessControl interface", async function () {
            const INTERFACE_ID_ACCESS_CONTROL = "0x7965db0b";
            expect(await gameToken.supportsInterface(INTERFACE_ID_ACCESS_CONTROL)).to.be.true;
        });
    });
});