import React, { useState, useEffect, useContext } from 'react';
import './Withdraw.css';
import { ethers } from 'ethers';
import { WalletContext } from '../App';
import { EXCHANGE_ADDRESS, BSC_CHAIN_ID } from '../contracts/constants';
import { exchangeABI } from '../contracts/abis';

const Withdraw = () => {
  const { provider, signer, account, isConnected, chainId, connectWallet } = useContext(WalletContext);
  const [isOwner, setIsOwner] = useState(false);
  const [toAddress, setToAddress] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if connected account is the owner
  useEffect(() => {
    const checkOwner = async () => {
      if (isConnected && signer) {
        try {
          const contract = new ethers.Contract(EXCHANGE_ADDRESS, exchangeABI, provider);
          const ownerAddress = await contract.owner();
          setIsOwner(account.toLowerCase() === ownerAddress.toLowerCase());
        } catch (err) {
          console.error('Error checking owner:', err);
          setError('Failed to verify owner status');
        }
      } else {
        setIsOwner(false);
      }
    };

    checkOwner();
    
    // Set up interval to periodically check owner status
    const interval = setInterval(checkOwner, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [isConnected, account, provider, signer]);

  // Validate address format
  useEffect(() => {
    try {
      setIsValidAddress(ethers.utils.isAddress(toAddress));
    } catch (err) {
      setIsValidAddress(false);
    }
  }, [toAddress]);

  // Handle withdraw function
  const handleWithdraw = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isOwner) {
      setError('Only the contract owner can withdraw USDT');
      return;
    }

    if (!isValidAddress) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    // Check if on the correct network
    if (chainId !== BSC_CHAIN_ID) {
      setError(`Please switch to BSC Mainnet (Chain ID: ${BSC_CHAIN_ID})`);
      return;
    }

    // Confirm the action
    if (!window.confirm('Are you sure you want to withdraw all USDT from the contract?')) {
      return;
    }

    setIsLoading(true);
    setTxStatus('Initiating withdrawal...');
    setError('');

    try {
      const contract = new ethers.Contract(EXCHANGE_ADDRESS, exchangeABI, signer);
      
      // Call the withdrawUSDT function
      const tx = await contract.withdrawUSDT(toAddress);
      setTxStatus('Transaction submitted. Waiting for confirmation...');
      setTxHash(tx.hash);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      setTxStatus('Withdrawal successful!');
    } catch (err) {
      console.error('Error withdrawing USDT:', err);
      setError(err.message || 'Failed to withdraw USDT');
      setTxStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="withdraw-container">
      <h1 className="withdraw-title">Withdraw USDT</h1>
      
      {!isConnected ? (
        <div className="connect-wallet-section">
          <p>Please connect your wallet to continue</p>
          <button 
            className="connect-wallet-button" 
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          <div className="status-section">
            <p>Connected Account: <span className="address">{account}</span></p>
            <p>Owner Status: 
              <span className={isOwner ? "status-positive" : "status-negative"}>
                {isOwner ? ' You are the owner' : ' You are not the owner'}
              </span>
            </p>
          </div>

          {isOwner ? (
            <div className="withdraw-form">
              <div className="input-group">
                <label htmlFor="toAddress">Recipient Address:</label>
                <input
                  id="toAddress"
                  type="text"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="0x..."
                  className={`address-input ${!isValidAddress && toAddress ? 'invalid' : ''}`}
                  disabled={isLoading}
                />
                {!isValidAddress && toAddress && (
                  <p className="validation-error">Please enter a valid address</p>
                )}
              </div>

              <button
                className="withdraw-button"
                onClick={handleWithdraw}
                disabled={!isValidAddress || isLoading}
              >
                {isLoading ? 'Processing...' : 'Withdraw USDT'}
              </button>

              {txStatus && (
                <div className="transaction-status">
                  <p>{txStatus}</p>
                  {txHash && (
                    <a 
                      href={`https://bscscan.com/tx/${txHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      View on BscScan
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="not-owner-message">
              <p>Only the contract owner can withdraw USDT.</p>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="back-link">
        <a href="/">← Back to Exchange</a>
      </div>
    </div>
  );
};

export default Withdraw;
