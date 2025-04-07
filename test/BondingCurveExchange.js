const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther } = require("ethers");

describe("BondingCurveExchange", function () {
  let bondingCurveExchange;
  let usdt;
  let pusd;
  let owner;
  let buyer;

  // Constants from the contract
  const STAGE1_MAX = ethers.utils.parseEther("1000000000000"); // 1e12 ether
  const STAGE2_MAX = ethers.utils.parseEther("3000000000000"); // 3e12 ether
  const TOTAL_SUPPLY = ethers.utils.parseEther("4000000000000"); // 4e12 ether
  const STAGE1_RATE = 100000;
  const STAGE3_RATE = 1;

  beforeEach(async function () {
    // Get signers
    [owner, buyer] = await ethers.getSigners();

    // Deploy mock tokens
    const MockToken = await ethers.getContractFactory("MockERC20");
    usdt = await MockToken.deploy("USDT", "USDT", 18);
    pusd = await MockToken.deploy("pUSD", "pUSD", 18);

    // Deploy BondingCurveExchange
    const BondingCurveExchange = await ethers.getContractFactory("BondingCurveExchange");
    bondingCurveExchange = await BondingCurveExchange.deploy(
      await usdt.getAddress(),
      await pusd.getAddress()
    );

    // Mint tokens
    await usdt.mint(buyer.address, ethers.utils.parseEther("1000000")); // 1 million USDT
    await pusd.mint(await bondingCurveExchange.getAddress(), TOTAL_SUPPLY); // 4 trillion pUSD

    // Approve tokens
    await usdt.connect(buyer).approve(
      await bondingCurveExchange.getAddress(),
      ethers.constants.MaxUint256
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await bondingCurveExchange.owner()).to.equal(owner.address);
    });

    it("Should set the right token addresses", async function () {
      expect(await bondingCurveExchange.usdt()).to.equal(await usdt.getAddress());
      expect(await bondingCurveExchange.pusd()).to.equal(await pusd.getAddress());
    });

    it("Should have the correct initial released amount", async function () {
      expect(await bondingCurveExchange.released()).to.equal(0);
    });
  });

  describe("Rate Calculation", function () {
    it("Should return the correct rate for Stage 1", async function () {
      expect(await bondingCurveExchange.getRate()).to.equal(STAGE1_RATE);
    });

    it("Should return the correct rate for Stage 2", async function () {
      // First, release enough pUSD to reach Stage 2
      const usdtAmount = ethers.utils.parseEther("10000"); // 10,000 USDT
      await bondingCurveExchange.connect(buyer).buy(usdtAmount);

      // Verify we're in Stage 2
      const released = await bondingCurveExchange.released();
      expect(released).to.be.gt(STAGE1_MAX);
      expect(released).to.be.lt(STAGE2_MAX);

      // Calculate expected rate
      const stageProgress = released.sub(STAGE1_MAX);
      const stageTotal = STAGE2_MAX.sub(STAGE1_MAX);
      const rateDecrease = STAGE1_RATE.sub(STAGE3_RATE).mul(stageProgress).div(stageTotal);
      const expectedRate = STAGE1_RATE.sub(rateDecrease);

      // Check rate
      expect(await bondingCurveExchange.getRate()).to.equal(expectedRate);
    });

    it("Should return the correct rate for Stage 3", async function () {
      // First, release enough pUSD to reach Stage 3
      // This would require a very large purchase, so we'll manually set the released amount
      await bondingCurveExchange.setReleased(STAGE2_MAX);

      // Check rate
      expect(await bondingCurveExchange.getRate()).to.equal(STAGE3_RATE);
    });
  });

  describe("Purchase Calculation", function () {
    it("Should calculate the correct amount for Stage 1", async function () {
      const usdtAmount = ethers.utils.parseEther("1"); // 1 USDT
      const expectedPusdAmount = usdtAmount.mul(STAGE1_RATE);
      
      expect(await bondingCurveExchange.calculatePurchaseAmount(usdtAmount)).to.equal(expectedPusdAmount);
    });

    it("Should calculate the correct amount for a purchase spanning multiple stages", async function () {
      // Calculate how much USDT is needed to buy all of Stage 1
      const stage1UsdtAmount = STAGE1_MAX.div(STAGE1_RATE);
      
      // Add some extra USDT to span into Stage 2
      const extraUsdt = ethers.utils.parseEther("1000"); // 1,000 USDT
      const totalUsdtAmount = stage1UsdtAmount.add(extraUsdt);
      
      // Calculate expected pUSD amount
      const stage1PusdAmount = STAGE1_MAX;
      
      // For Stage 2, we'll use an approximation
      const initialRate = STAGE1_RATE;
      const finalRate = STAGE1_RATE.sub(
        STAGE1_RATE.sub(STAGE3_RATE).mul(extraUsdt.mul(initialRate)).div(STAGE2_MAX.sub(STAGE1_MAX))
      );
      const avgRate = initialRate.add(finalRate).div(2);
      const stage2PusdAmount = extraUsdt.mul(avgRate);
      
      const expectedTotalPusdAmount = stage1PusdAmount.add(stage2PusdAmount);
      
      // Get the actual calculated amount
      const actualPusdAmount = await bondingCurveExchange.calculatePurchaseAmount(totalUsdtAmount);
      
      // Allow for some calculation differences due to rounding
      const tolerance = ethers.utils.parseEther("1000000"); // 1 million pUSD tolerance
      expect(actualPusdAmount).to.be.closeTo(expectedTotalPusdAmount, tolerance);
    });
  });

  describe("Buy Function", function () {
    it("Should allow users to buy pUSD with USDT", async function () {
      const usdtAmount = ethers.utils.parseEther("100"); // 100 USDT
      const expectedPusdAmount = usdtAmount.mul(STAGE1_RATE);
      
      // Check balances before
      const buyerPusdBefore = await pusd.balanceOf(buyer.address);
      const contractUsdtBefore = await usdt.balanceOf(await bondingCurveExchange.getAddress());
      
      // Execute purchase
      await expect(bondingCurveExchange.connect(buyer).buy(usdtAmount))
        .to.emit(bondingCurveExchange, "TokensPurchased")
        .withArgs(buyer.address, usdtAmount, expectedPusdAmount);
      
      // Check balances after
      const buyerPusdAfter = await pusd.balanceOf(buyer.address);
      const contractUsdtAfter = await usdt.balanceOf(await bondingCurveExchange.getAddress());
      
      expect(buyerPusdAfter.sub(buyerPusdBefore)).to.equal(expectedPusdAmount);
      expect(contractUsdtAfter.sub(contractUsdtBefore)).to.equal(usdtAmount);
      
      // Check released amount
      expect(await bondingCurveExchange.released()).to.equal(expectedPusdAmount);
    });

    it("Should revert if contract has insufficient pUSD balance", async function () {
      // First, drain the contract of pUSD
      await pusd.burn(await bondingCurveExchange.getAddress(), TOTAL_SUPPLY);
      
      // Try to buy
      const usdtAmount = ethers.utils.parseEther("1");
      await expect(bondingCurveExchange.connect(buyer).buy(usdtAmount))
        .to.be.revertedWith("Insufficient pUSD balance");
    });

    it("Should revert if buyer has insufficient USDT allowance", async function () {
      // Revoke approval
      await usdt.connect(buyer).approve(await bondingCurveExchange.getAddress(), 0);
      
      // Try to buy
      const usdtAmount = ethers.utils.parseEther("1");
      await expect(bondingCurveExchange.connect(buyer).buy(usdtAmount))
        .to.be.revertedWith("Insufficient USDT allowance");
    });
  });

  describe("Withdraw Function", function () {
    it("Should allow owner to withdraw USDT", async function () {
      // First, make a purchase to get some USDT in the contract
      const usdtAmount = ethers.utils.parseEther("100");
      await bondingCurveExchange.connect(buyer).buy(usdtAmount);
      
      // Check balances before
      const ownerUsdtBefore = await usdt.balanceOf(owner.address);
      const contractUsdtBefore = await usdt.balanceOf(await bondingCurveExchange.getAddress());
      
      // Execute withdrawal
      await expect(bondingCurveExchange.withdrawUSDT(owner.address))
        .to.emit(bondingCurveExchange, "UsdtWithdrawn")
        .withArgs(owner.address, contractUsdtBefore);
      
      // Check balances after
      const ownerUsdtAfter = await usdt.balanceOf(owner.address);
      const contractUsdtAfter = await usdt.balanceOf(await bondingCurveExchange.getAddress());
      
      expect(ownerUsdtAfter.sub(ownerUsdtBefore)).to.equal(contractUsdtBefore);
      expect(contractUsdtAfter).to.equal(0);
    });

    it("Should revert if called by non-owner", async function () {
      await expect(bondingCurveExchange.connect(buyer).withdrawUSDT(buyer.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert if there is no USDT to withdraw", async function () {
      await expect(bondingCurveExchange.withdrawUSDT(owner.address))
        .to.be.revertedWith("No USDT to withdraw");
    });
  });
});
