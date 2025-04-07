// Contract addresses on BSC Mainnet
export const EXCHANGE_ADDRESS = '0x46ddd8e5273f46360ae1eF903950a7c3Ba0c0848';
export const PUSD_ADDRESS = '0x980e9171873a5D77cD14ca4F3d45528B432c341b';

// USDT address on BSC Mainnet
export const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';

// Chain ID for BSC Mainnet
export const BSC_CHAIN_ID = 56;

// Decimal precision for tokens
export const DECIMALS = {
  USDT: 18,
  PUSD: 18
};

// Format large numbers for display
export const formatNumber = (num, decimals = 2) => {
  if (!num) return '0';
  
  // Convert to number if it's a string or BigInt
  const numValue = typeof num === 'string' || typeof num === 'bigint' 
    ? Number(num) 
    : num;
  
  // Handle very large numbers with abbreviations
  if (numValue >= 1e12) {
    return (numValue / 1e12).toFixed(decimals) + 'T';
  } else if (numValue >= 1e9) {
    return (numValue / 1e9).toFixed(decimals) + 'B';
  } else if (numValue >= 1e6) {
    return (numValue / 1e6).toFixed(decimals) + 'M';
  } else if (numValue >= 1e3) {
    return (numValue / 1e3).toFixed(decimals) + 'K';
  }
  
  return numValue.toFixed(decimals);
};

// Format token amounts with proper decimal places
export const formatTokenAmount = (amount, decimals = 18) => {
  if (!amount) return '0';
  
  // Convert to string if it's not already
  const amountStr = amount.toString();
  
  // If the amount has fewer digits than decimals, pad with zeros
  if (amountStr.length <= decimals) {
    return '0.' + '0'.repeat(decimals - amountStr.length) + amountStr;
  }
  
  // Otherwise, insert decimal point at the right position
  const integerPart = amountStr.slice(0, amountStr.length - decimals);
  const fractionalPart = amountStr.slice(amountStr.length - decimals);
  
  return integerPart + '.' + fractionalPart;
};

// Parse token amount to wei (with proper decimal places)
export const parseTokenAmount = (amount, decimals = 18) => {
  if (!amount) return '0';
  
  // Convert to string if it's not already
  const amountStr = amount.toString();
  
  // Split by decimal point
  const parts = amountStr.split('.');
  
  if (parts.length === 1) {
    // No decimal point, just add zeros
    return parts[0] + '0'.repeat(decimals);
  }
  
  // Has decimal point
  const integerPart = parts[0];
  let fractionalPart = parts[1];
  
  // If fractional part is too long, truncate it
  if (fractionalPart.length > decimals) {
    fractionalPart = fractionalPart.slice(0, decimals);
  } else if (fractionalPart.length < decimals) {
    // If fractional part is too short, pad with zeros
    fractionalPart = fractionalPart + '0'.repeat(decimals - fractionalPart.length);
  }
  
  return integerPart + fractionalPart;
};
