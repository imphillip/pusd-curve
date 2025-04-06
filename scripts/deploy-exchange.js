// Script to deploy the BondingCurveExchange contract

const hre = require("hardhat");

async function main() {
  console.log("Deploying BondingCurveExchange contract...");

  // Get the contract factory
  const BondingCurveExchange = await hre.ethers.getContractFactory("BondingCurveExchange");

  // You'll need to replace these with actual token addresses when deploying
  const usdtAddress = process.env.USDT_ADDRESS; // BEP20 USDT token address
  const pusdAddress = process.env.PUSD_ADDRESS; // pUSD token address

  if (!usdtAddress || !pusdAddress) {
    console.error("Error: USDT_ADDRESS and PUSD_ADDRESS must be set in environment variables");
    process.exit(1);
  }

  console.log(`Using USDT address: ${usdtAddress}`);
  console.log(`Using pUSD address: ${pusdAddress}`);

  // Deploy the contract
  const exchange = await BondingCurveExchange.deploy(usdtAddress, pusdAddress);
  await exchange.waitForDeployment();

  const exchangeAddress = await exchange.getAddress();
  console.log(`BondingCurveExchange deployed to: ${exchangeAddress}`);

  console.log("\nNext steps:");
  console.log("1. Transfer pUSD tokens to the contract (4 trillion tokens)");
  console.log(`   - Call pusdToken.transfer(${exchangeAddress}, "4000000000000000000000000000000")`);
  console.log("2. Verify the contract on BscScan:");
  console.log(`   npx hardhat verify --network bsc ${exchangeAddress} ${usdtAddress} ${pusdAddress}`);

  // Additional deployment information
  console.log("\nContract Information:");
  console.log("- Owner:", await exchange.owner());
  console.log("- USDT Token:", await exchange.usdt());
  console.log("- pUSD Token:", await exchange.pusd());
  console.log("- Current Rate:", (await exchange.getRate()).toString());
  console.log("- Released pUSD:", (await exchange.released()).toString());
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
