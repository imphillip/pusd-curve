import React, { useState, useEffect, useCallback, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../App';
import { 
  EXCHANGE_ADDRESS, 
  PUSD_ADDRESS, 
  USDT_ADDRESS,
  DECIMALS,
  formatNumber,
  formatTokenAmount,
  parseTokenAmount
} from '../contracts/constants';
import { exchangeABI, erc20ABI } from '../contracts/abis';

// Debounce function to prevent too many requests
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const ExchangeInterface = () => {
  const { provider, signer, account, isConnected, chainId } = useContext(WalletContext);
  
  // Input state
  const [usdtAmount, setUsdtAmount] = useState('');
  const [estimatedPusd, setEstimatedPusd] = useState('0');
  
  // Contract state
  const [exchangeRate, setExchangeRate] = useState('0');
  const [totalReleased, setTotalReleased] = useState('0');
  const [totalSupply, setTotalSupply] = useState('0');
  const [remainingSupply, setRemainingSupply] = useState('0');
  
  // User balances
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [pusdBalance, setPusdBalance] = useState('0');
  
  // Transaction state
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [txHash, setTxHash] = useState('');
  
  // Error state
  const [error, setError] = useState('');

  // Initialize contracts
  const getContracts = useCallback(() => {
    if (!signer) return null;
    
    const exchangeContract = new ethers.Contract(
      EXCHANGE_ADDRESS,
      exchangeABI,
      signer
    );
    
    const usdtContract = new ethers.Contract(
      USDT_ADDRESS,
      erc20ABI,
      signer
    );
    
    const pusdContract = new ethers.Contract(
      PUSD_ADDRESS,
      erc20ABI,
      signer
    );
    
    return { exchangeContract, usdtContract, pusdContract };
  }, [signer]);

  // Load contract data
  const loadContractData = useCallback(async () => {
    try {
      if (!provider) return;
      
      // Create read-only contracts with provider
      const exchangeContract = new ethers.Contract(
        EXCHANGE_ADDRESS,
        exchangeABI,
        provider
      );
      
      // Get exchange rate
      const rate = await exchangeContract.getRate();
      setExchangeRate(formatTokenAmount(rate));
      
      // Get total released
      const released = await exchangeContract.released();
      setTotalReleased(released.toString());
      
      // Get total supply
      const total = await exchangeContract.TOTAL_SUPPLY();
      setTotalSupply(total.toString());
      
      // Calculate remaining supply
      const remaining = total.sub(released);
      setRemainingSupply(remaining.toString());
      
    } catch (err) {
      console.error('Error loading contract data:', err);
      setError('Failed to load contract data');
    }
  }, [provider]);

  // Load user balances
  const loadUserBalances = useCallback(async () => {
    if (!account || !provider) return;
    
    try {
      // Create read-only contracts with provider
      const usdtContract = new ethers.Contract(
        USDT_ADDRESS,
        erc20ABI,
        provider
      );
      
      const pusdContract = new ethers.Contract(
        PUSD_ADDRESS,
        erc20ABI,
        provider
      );
      
      // Get USDT balance
      const usdt = await usdtContract.balanceOf(account);
      setUsdtBalance(usdt.toString());
      
      // Get pUSD balance
      const pusd = await pusdContract.balanceOf(account);
      setPusdBalance(pusd.toString());
      
    } catch (err) {
      console.error('Error loading user balances:', err);
    }
  }, [account, provider]);

  // Check allowance
  const checkAllowance = useCallback(async () => {
    if (!account || !provider) return;
    
    try {
      const usdtContract = new ethers.Contract(
        USDT_ADDRESS,
        erc20ABI,
        provider
      );
      
      const allowance = await usdtContract.allowance(account, EXCHANGE_ADDRESS);
      const isApproved = allowance.gt(ethers.utils.parseUnits('1000000', DECIMALS.USDT));
      
      setIsApproved(isApproved);
    } catch (err) {
      console.error('Error checking allowance:', err);
    }
  }, [account, provider]);

  // Estimate pUSD amount
  const estimatePusdAmount = useCallback(async (amount) => {
    if (!amount || parseFloat(amount) === 0 || !provider) {
      setEstimatedPusd('0');
      return;
    }
    
    try {
      const exchangeContract = new ethers.Contract(
        EXCHANGE_ADDRESS,
        exchangeABI,
        provider
      );
      
      const usdtWei = ethers.utils.parseUnits(amount, DECIMALS.USDT);
      const pusdWei = await exchangeContract.calculatePurchaseAmount(usdtWei);
      
      setEstimatedPusd(pusdWei.toString());
    } catch (err) {
      console.error('Error estimating pUSD amount:', err);
      setEstimatedPusd('0');
    }
  }, [provider]);

  // Debounced estimate function
  const debouncedEstimate = useCallback(
    debounce((amount) => estimatePusdAmount(amount), 1000),
    [estimatePusdAmount]
  );

  // Handle input change
  const handleUsdtAmountChange = (e) => {
    const value = e.target.value;
    
    // Only allow numbers and decimals
    if (value === '' || /^[0-9]*[.]?[0-9]*$/.test(value)) {
      setUsdtAmount(value);
      debouncedEstimate(value);
    }
  };

  // Approve USDT
  const approveUsdt = async () => {
    if (!account || !signer) return;
    
    try {
      setIsApproving(true);
      setError('');
      
      const contracts = getContracts();
      if (!contracts) {
        setError('Failed to initialize contracts');
        setIsApproving(false);
        return;
      }
      
      const { usdtContract } = contracts;
      
      const tx = await usdtContract.approve(
        EXCHANGE_ADDRESS,
        ethers.constants.MaxUint256
      );
      
      await tx.wait();
      
      setIsApproved(true);
      setIsApproving(false);
    } catch (err) {
      console.error('Error approving USDT:', err);
      setError('Failed to approve USDT');
      setIsApproving(false);
    }
  };

  // Buy pUSD
  const buyPusd = async () => {
    if (!account || !signer || !usdtAmount || parseFloat(usdtAmount) === 0) return;
    
    try {
      setIsBuying(true);
      setError('');
      setTxHash('');
      
      const contracts = getContracts();
      if (!contracts) {
        setError('Failed to initialize contracts');
        setIsBuying(false);
        return;
      }
      
      const { exchangeContract } = contracts;
      
      const usdtWei = ethers.utils.parseUnits(usdtAmount, DECIMALS.USDT);
      
      const tx = await exchangeContract.buy(usdtWei);
      setTxHash(tx.hash);
      
      await tx.wait();
      
      // Reload data
      loadContractData();
      loadUserBalances();
      checkAllowance();
      
      // Reset input
      setUsdtAmount('');
      setEstimatedPusd('0');
      
      setIsBuying(false);
    } catch (err) {
      console.error('Error buying pUSD:', err);
      setError('Failed to buy pUSD: ' + (err.message || 'Unknown error'));
      setIsBuying(false);
    }
  };

  // Load data on mount and when provider/account changes
  useEffect(() => {
    if (provider) {
      loadContractData();
    }
  }, [provider, loadContractData]);

  // Load user data when account changes
  useEffect(() => {
    if (account && provider) {
      loadUserBalances();
      checkAllowance();
    }
  }, [account, provider, loadUserBalances, checkAllowance]);

  // Check if on BSC network
  const isBscNetwork = chainId === 56;

  return (
    <div className="card gradient-bg">
      {/* Network Warning */}
      {!isBscNetwork && isConnected && (
        <div className="network-warning">
          Please switch to Binance Smart Chain (BSC) network to use this application.
        </div>
      )}
      
      {/* Exchange Info */}
      <div className="exchange-info">
        <div className="info-grid">
          <div>
            <h3 className="info-label">Current Rate</h3>
            <p className="info-value">1 USDT = {formatNumber(exchangeRate)} pUSD</p>
          </div>
          <div>
            <h3 className="info-label">Remaining Supply</h3>
            <p className="info-value">{formatNumber(formatTokenAmount(remainingSupply))} pUSD</p>
          </div>
          <div>
            <h3 className="info-label">Total Released</h3>
            <p className="info-value">{formatNumber(formatTokenAmount(totalReleased))} pUSD</p>
          </div>
          <div>
            <h3 className="info-label">Total Supply</h3>
            <p className="info-value">{formatNumber(formatTokenAmount(totalSupply))} pUSD</p>
          </div>
        </div>
      </div>

      {/* Exchange Form */}
      <div className="exchange-form">
        <div className="form-group">
          <label className="form-label">You Pay</label>
          <div className="input-group">
            <input
              type="text"
              value={usdtAmount}
              onChange={handleUsdtAmountChange}
              placeholder="0.0"
              className="input-field"
            />
            <div className="input-addon">
              <span className="balance-text">Balance: {formatNumber(formatTokenAmount(usdtBalance))}</span>
              <div className="token-badge">USDT</div>
            </div>
          </div>
        </div>

        <div className="arrow-divider">
          <div className="arrow-circle">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">You Receive</label>
          <div className="input-group">
            <input
              type="text"
              value={formatNumber(formatTokenAmount(estimatedPusd))}
              readOnly
              className="input-field"
            />
            <div className="input-addon">
              <span className="balance-text">Balance: {formatNumber(formatTokenAmount(pusdBalance))}</span>
              <div className="token-badge">pUSD</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {txHash && (
          <div className="success-message">
            Transaction submitted! <a href={`https://bscscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer">View on BscScan</a>
          </div>
        )}

        {!isApproved ? (
          <button
            onClick={approveUsdt}
            disabled={isApproving || !account || !isBscNetwork}
            className="btn btn-primary full-width-button"
          >
            {isApproving ? (
              <>
                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Approving...
              </>
            ) : (
              'Approve USDT'
            )}
          </button>
        ) : (
          <button
            onClick={buyPusd}
            disabled={isBuying || !usdtAmount || parseFloat(usdtAmount) === 0 || !account || !isBscNetwork}
            className="btn btn-primary full-width-button"
          >
            {isBuying ? (
              <>
                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Buying...
              </>
            ) : (
              'Buy pUSD'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ExchangeInterface;
