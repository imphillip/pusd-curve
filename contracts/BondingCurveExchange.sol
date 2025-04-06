// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Uncomment this line to enable test functions
// pragma abicoder v2;
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BondingCurveExchange
 * @dev Contract for exchanging USDT for pUSD based on a three-part bonding curve
 *
 * The bonding curve has three stages:
 * - Stage 1: First 1 trillion pUSD (0-1e12) at 1 USDT = 100,000 pUSD
 * - Stage 2: Next 2 trillion pUSD (1e12-3e12) at linearly decreasing rate from 100,000 → 1 pUSD per USDT
 * - Stage 3: Final 1 trillion pUSD (3e12-4e12) at 1 USDT = 1 pUSD
 */
contract BondingCurveExchange is Ownable {
    using SafeERC20 for IERC20;
    
    // Token contracts
    IERC20 public immutable usdt;
    IERC20 public immutable pusd;
    
    // Constants for bonding curve stages (with 18 decimals)
    uint256 public constant STAGE1_MAX = 1e12 ether; // 1 trillion pUSD
    uint256 public constant STAGE2_MAX = 3e12 ether; // 3 trillion pUSD
    uint256 public constant TOTAL_SUPPLY = 4e12 ether; // 4 trillion pUSD
    
    // Exchange rates
    uint256 public constant STAGE1_RATE = 100000; // 1 USDT = 100,000 pUSD
    uint256 public constant STAGE3_RATE = 1;      // 1 USDT = 1 pUSD
    
    // Track released pUSD
    uint256 public released;
    
    // Events
    event TokensPurchased(address indexed buyer, uint256 usdtAmount, uint256 pusdAmount);
    event UsdtWithdrawn(address indexed to, uint256 amount);
    
    /**
     * @dev Constructor sets the token addresses and initializes the owner
     * @param _usdt Address of the USDT token contract
     * @param _pusd Address of the pUSD token contract
     */
    constructor(address _usdt, address _pusd) Ownable(msg.sender) {
        require(_usdt != address(0), "USDT address cannot be zero");
        require(_pusd != address(0), "pUSD address cannot be zero");
        usdt = IERC20(_usdt);
        pusd = IERC20(_pusd);
    }
    
    /**
     * @dev Returns the current exchange rate based on the amount of pUSD released
     * @return The number of pUSD tokens per 1 USDT
     */
    function getRate() public view returns (uint256) {
        if (released < STAGE1_MAX) {
            // Stage 1: Fixed rate of 100,000 pUSD per USDT
            return STAGE1_RATE;
        } else if (released < STAGE2_MAX) {
            // Stage 2: Linear decrease from 100,000 to 1
            uint256 stageProgress = released - STAGE1_MAX;
            uint256 stageTotal = STAGE2_MAX - STAGE1_MAX;
            uint256 rateDecrease = ((STAGE1_RATE - STAGE3_RATE) * stageProgress) / stageTotal;
            return STAGE1_RATE - rateDecrease;
        } else {
            // Stage 3: Fixed rate of 1 pUSD per USDT
            return STAGE3_RATE;
        }
    }
    
    /**
     * @dev Calculates the amount of pUSD tokens to be received for a given amount of USDT
     * @param usdtAmount The amount of USDT to exchange
     * @return The amount of pUSD tokens to be received
     */
    function calculatePurchaseAmount(uint256 usdtAmount) public view returns (uint256) {
        require(usdtAmount > 0, "Amount must be greater than 0");
        
        uint256 remainingUsdt = usdtAmount;
        uint256 totalPusd = 0;
        uint256 currentReleased = released;
        
        // Stage 1: Fixed rate of 100,000 pUSD per USDT
        if (currentReleased < STAGE1_MAX && remainingUsdt > 0) {
            uint256 stage1Remaining = STAGE1_MAX - currentReleased;
            uint256 stage1PusdAmount = remainingUsdt * STAGE1_RATE;
            
            if (currentReleased + stage1PusdAmount <= STAGE1_MAX) {
                // All USDT can be used in Stage 1
                totalPusd += stage1PusdAmount;
                currentReleased += stage1PusdAmount;
                remainingUsdt = 0;
            } else {
                // Only part of USDT can be used in Stage 1
                totalPusd += stage1Remaining;
                remainingUsdt -= stage1Remaining / STAGE1_RATE;
                currentReleased = STAGE1_MAX;
            }
        }
        
        // Stage 2: Linear decrease from 100,000 to 1
        if (currentReleased < STAGE2_MAX && remainingUsdt > 0) {
            // For the linear decreasing rate, we need to calculate the integral
            // of the rate function over the USDT amount
            
            uint256 stageTotal = STAGE2_MAX - STAGE1_MAX;
            uint256 initialRate = STAGE1_RATE - ((STAGE1_RATE - STAGE3_RATE) * (currentReleased - STAGE1_MAX)) / stageTotal;
            
            // Calculate how much USDT would be needed to reach STAGE2_MAX
            uint256 usdtToReachStage3;
            
            // This is a simplified approach for the integral calculation
            // We're calculating the area under the linear curve
            if (initialRate > STAGE3_RATE) {
                uint256 remainingPusd = STAGE2_MAX - currentReleased;
                
                // Area of a trapezoid = (a + b) * h / 2
                // where a and b are the parallel sides (rates) and h is the height (pUSD amount)
                usdtToReachStage3 = (remainingPusd * 2) / (initialRate + STAGE3_RATE);
            } else {
                // If we're already at or below STAGE3_RATE, use that rate
                usdtToReachStage3 = (STAGE2_MAX - currentReleased) / STAGE3_RATE;
            }
            
            if (remainingUsdt <= usdtToReachStage3) {
                // Calculate pUSD for the partial stage 2 purchase
                // This is an approximation using the average rate
                uint256 avgRate = (initialRate + getRate()) / 2;
                uint256 stage2PusdAmount = remainingUsdt * avgRate;
                
                // Ensure we don't exceed STAGE2_MAX
                if (currentReleased + stage2PusdAmount > STAGE2_MAX) {
                    stage2PusdAmount = STAGE2_MAX - currentReleased;
                }
                
                totalPusd += stage2PusdAmount;
                currentReleased += stage2PusdAmount;
                remainingUsdt = 0;
            } else {
                // Use all remaining USDT needed to reach STAGE2_MAX
                totalPusd += (STAGE2_MAX - currentReleased);
                remainingUsdt -= usdtToReachStage3;
                currentReleased = STAGE2_MAX;
            }
        }
        
        // Stage 3: Fixed rate of 1 pUSD per USDT
        if (currentReleased < TOTAL_SUPPLY && remainingUsdt > 0) {
            uint256 stage3Remaining = TOTAL_SUPPLY - currentReleased;
            uint256 stage3PusdAmount = remainingUsdt * STAGE3_RATE;
            
            if (currentReleased + stage3PusdAmount <= TOTAL_SUPPLY) {
                // All remaining USDT can be used in Stage 3
                totalPusd += stage3PusdAmount;
            } else {
                // Only part of USDT can be used in Stage 3
                totalPusd += stage3Remaining;
            }
        }
        
        return totalPusd;
    }
    
    /**
     * @dev Allows users to buy pUSD tokens with USDT
     * @param usdtAmount The amount of USDT to exchange
     * @return The amount of pUSD tokens received
     */
    function buy(uint256 usdtAmount) external returns (uint256) {
        require(usdtAmount > 0, "Amount must be greater than 0");
        
        // Calculate pUSD amount based on bonding curve
        uint256 pusdAmount = calculatePurchaseAmount(usdtAmount);
        
        // Check if contract has enough pUSD
        uint256 pusdBalance = pusd.balanceOf(address(this));
        require(pusdBalance >= pusdAmount, "Insufficient pUSD balance");
        
        // Check USDT allowance
        require(usdt.allowance(msg.sender, address(this)) >= usdtAmount, "Insufficient USDT allowance");
        
        // Transfer USDT from user to contract
        usdt.safeTransferFrom(msg.sender, address(this), usdtAmount);
        
        // Transfer pUSD to user
        pusd.safeTransfer(msg.sender, pusdAmount);
        
        // Update released amount
        released += pusdAmount;
        
        emit TokensPurchased(msg.sender, usdtAmount, pusdAmount);
        
        return pusdAmount;
    }
    
    /**
     * @dev Allows the owner to withdraw USDT from the contract
     * @param to The address to send the USDT to
     */
    function withdrawUSDT(address to) external onlyOwner {
        require(to != address(0), "Cannot withdraw to zero address");
        
        uint256 balance = usdt.balanceOf(address(this));
        require(balance > 0, "No USDT to withdraw");
        
        usdt.safeTransfer(to, balance);
        
        emit UsdtWithdrawn(to, balance);
    }
    
    /**
     * @dev FOR TESTING ONLY: Sets the released amount to a specific value
     * @param amount The amount to set released to
     * @notice This function should be removed or disabled in production
     */
    function setReleased(uint256 amount) external onlyOwner {
        // This function is for testing purposes only
        // It allows setting the released amount to test different stages of the bonding curve
        released = amount;
    }
}
