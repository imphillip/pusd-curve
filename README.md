# BondingCurveExchange

A Solidity smart contract for exchanging USDT for pUSD tokens based on a three-part bonding curve.

## Overview

The BondingCurveExchange contract allows users to buy pUSD tokens using USDT, with the price determined by a piecewise bonding curve. The contract is designed to be deployed on BNB Chain and interacts with BEP20 tokens.

### Bonding Curve Stages

The price per pUSD is defined by a three-part bonding curve based on the total amount of pUSD released:

1. **Stage 1:** First 1 trillion pUSD (0–1e12) are sold at a fixed rate of 1 USDT = 100,000 pUSD
2. **Stage 2:** Next 2 trillion pUSD (1e12–3e12) are sold at a linearly decreasing rate from 100,000 → 1 pUSD per USDT
3. **Stage 3:** Final 1 trillion pUSD (3e12–4e12) are sold at a fixed rate of 1 USDT = 1 pUSD

## Contract Features

- Accepts USDT (BEP20, 18 decimals) and sends users pUSD (BEP20, 18 decimals)
- pUSD is a fixed-supply token with a total supply of 4 trillion (4e12)
- Tracks released pUSD via a `released` variable
- No reverse exchange (users cannot convert pUSD back to USDT)
- No fee (the full amount of USDT is used for the exchange)
- USDT received is retained in the contract and can be withdrawn by the owner
- Owner is defined at deployment and has exclusive withdrawal access

## Key Functions

### `getRate()`

Returns the current exchange rate (pUSD per USDT) based on the amount of pUSD released.

```solidity
function getRate() public view returns (uint256)
```

### `calculatePurchaseAmount(uint256 usdtAmount)`

Calculates how much pUSD a user will receive for a given amount of USDT.

```solidity
function calculatePurchaseAmount(uint256 usdtAmount) public view returns (uint256)
```

### `buy(uint256 usdtAmount)`

Allows users to buy pUSD tokens with USDT.

```solidity
function buy(uint256 usdtAmount) external returns (uint256)
```

### `withdrawUSDT(address to)`

Allows the owner to withdraw USDT from the contract.

```solidity
function withdrawUSDT(address to) external onlyOwner
```

## Deployment

### Prerequisites

- Node.js and npm installed
- Hardhat installed
- BNB Chain wallet with BNB for gas
- USDT and pUSD token addresses

### Steps

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd pusd-curve
npm install
```

2. Create a `.env` file with the following variables:

```
PRIVATE_KEY=your_private_key
USDT_ADDRESS=usdt_token_address
PUSD_ADDRESS=pusd_token_address
```

3. Deploy the contract:

```bash
npx hardhat run scripts/deploy-exchange.js --network bsc
```

4. After deployment, transfer pUSD tokens to the contract:

```javascript
// Using ethers.js or web3.js
const pusdToken = await ethers.getContractAt("IERC20", pusdAddress);
await pusdToken.transfer(exchangeAddress, ethers.utils.parseEther("4000000000000"));
```

5. Verify the contract on BscScan:

```bash
npx hardhat verify --network bsc <contract-address> <usdt-address> <pusd-address>
```

## Usage

### DApp Integration

When integrating with a DApp, the typical user flow is:

1. Display the current exchange rate by calling `getRate()`
2. When the user enters a USDT amount, calculate the expected pUSD amount by calling `calculatePurchaseAmount(usdtAmount)`
3. Check if the user has approved the contract to spend their USDT by calling `usdt.allowance(userAddress, contractAddress)`
4. If needed, prompt the user to approve the contract by calling `usdt.approve(contractAddress, amount)`
5. Execute the purchase by calling `buy(usdtAmount)`

### Direct Wallet Interaction

Users can also interact with the contract directly through wallets like MetaMask or through BscScan:

1. First, approve the BondingCurveExchange contract to spend USDT by calling the `approve` function on the USDT contract
2. Then call the `buy` function with the desired USDT amount

## Testing

Run the tests with:

```bash
npx hardhat test
```

The tests cover:
- Deployment validation
- Rate calculation for all three stages
- Purchase amount calculation
- Buy function
- Withdrawal functionality

## License

MIT
