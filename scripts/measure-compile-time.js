// Script to measure compilation time
const { execSync } = require('child_process');
const fs = require('fs');

console.log('Measuring compilation time...');

// Clean the cache and artifacts
console.log('Cleaning cache and artifacts...');
execSync('npx hardhat clean', { stdio: 'inherit' });

// Measure compilation time
console.log('Starting compilation...');
const startTime = Date.now();

try {
  execSync('npx hardhat compile', { stdio: 'inherit' });
  const endTime = Date.now();
  const compilationTime = (endTime - startTime) / 1000; // Convert to seconds
  
  console.log(`\nCompilation completed in ${compilationTime.toFixed(2)} seconds`);
  
  // Save the result to a file for comparison
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const resultFile = `compilation-time-${timestamp}.txt`;
  
  fs.writeFileSync(
    resultFile,
    `Compilation time: ${compilationTime.toFixed(2)} seconds\n` +
    `Date: ${new Date().toISOString()}\n` +
    `Solidity version: 0.8.28\n` +
    `Optimizer enabled: true\n` +
    `Optimizer runs: 2000\n` +
    `viaIR: true\n`
  );
  
  console.log(`Results saved to ${resultFile}`);
} catch (error) {
  console.error('Compilation failed:', error.message);
  process.exit(1);
}
