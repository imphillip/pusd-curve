import React, { useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../App';
import { EXCHANGE_ADDRESS } from '../contracts/constants';
import { exchangeABI } from '../contracts/abis';

const Navbar = () => {
  const { account, isConnected, connectWallet, disconnectWallet, provider } = useContext(WalletContext);
  const [isOwner, setIsOwner] = useState(false);

  // Check if connected account is the owner
  useEffect(() => {
    const checkOwner = async () => {
      if (isConnected && account && provider) {
        try {
          const contract = new ethers.Contract(EXCHANGE_ADDRESS, exchangeABI, provider);
          const ownerAddress = await contract.owner();
          setIsOwner(account.toLowerCase() === ownerAddress.toLowerCase());
        } catch (err) {
          console.error('Error checking owner status:', err);
          setIsOwner(false);
        }
      } else {
        setIsOwner(false);
      }
    };

    checkOwner();
  }, [isConnected, account, provider]);

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container container">
        <div className="navbar-brand">
          pUSD Bonding Vault
        </div>
        
        <div className="navbar-menu">
          {isOwner && (
            <a href="/withdraw.html" className="admin-link">
              Withdraw USDT
            </a>
          )}
        </div>
        
        <div className="navbar-actions">
          {isConnected ? (
            <div style={{display: 'flex', alignItems: 'center'}}>
              <div className="address-badge">
                {formatAddress(account)}
              </div>
              <button 
                onClick={disconnectWallet}
                className="btn btn-secondary"
                style={{fontSize: '0.875rem'}}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              className="btn btn-primary"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
