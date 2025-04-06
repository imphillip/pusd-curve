# Optimized Compilation Guide for pusd-curve

This guide explains the optimizations that have been applied to the compilation process for the pusd-curve project.

## Compilation Optimizations

The following optimizations have been implemented:

1. **Solidity Optimizer Settings**:
   - Enabled optimizer with 2000 runs (good balance for deployment cost vs. execution cost)
   - Enabled Yul optimizer for more aggressive optimizations
   - Enabled deduplicate, CSE, constantOptimizer, and orderLiterals for additional gas savings
   - Enabled viaIR (Intermediate Representation) for more optimized bytecode

2. **Parallel Compilation**:
   - Automatically uses multiple CPU cores for faster compilation
   - Dynamically sets the number of parallel jobs based on available cores

3. **Caching Improvements**:
   - Enhanced caching to avoid recompiling unchanged contracts
   - Configured metadata settings to optimize for compilation speed

4. **Contract Size Monitoring**:
   - Added contract-sizer plugin to track contract sizes
   - Automatically runs on each compilation

## Available Scripts

The following npm scripts are available for compilation:

- `npm run compile` - Standard compilation
- `npm run compile:force` - Force recompilation of all contracts
- `npm run compile:clean` - Clean cache and artifacts before compiling
- `npm run compile:profile` - Run compilation with profiling enabled
- `npm run compile:time` - Measure and record compilation time
- `npm run size` - Show contract sizes
- `npm run flatten` - Flatten the BondingCurveExchange contract for verification

## Compilation Performance

Current compilation time: ~3.35 seconds (may vary based on your system)

Contract sizes:
- BondingCurveExchange: 3.970 KiB (deployed), 4.418 KiB (initcode)
- Lock: 0.488 KiB (deployed), 0.691 KiB (initcode)
- MockERC20: 2.144 KiB (deployed), 3.106 KiB (initcode)
- SafeERC20: 0.017 KiB (deployed), 0.045 KiB (initcode)

## Further Optimization Tips

1. **Code Organization**:
   - Split large contracts into smaller, focused contracts
   - Use libraries for common functionality
   - Remove unused functions and variables

2. **Gas Optimization**:
   - Use uint256 instead of smaller uint types when possible
   - Batch operations to reduce gas costs
   - Use calldata instead of memory for function parameters
   - Minimize storage usage

3. **Development Workflow**:
   - Use incremental compilation during development
   - Run full optimized compilation before deployment
   - Monitor contract sizes regularly to avoid hitting size limits

## Reverting to Original Settings

A backup of the original hardhat.config.js has been saved as hardhat.config.js.bak. You can restore it if needed.
