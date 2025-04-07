import React, { useContext } from 'react';
import { WalletContext } from '../App';

const Navbar = () => {
  const { account, isConnected, connectWallet, disconnectWallet } = useContext(WalletContext);

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
