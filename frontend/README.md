# pUSD Bonding Curve Exchange DApp

A decentralized application for exchanging USDT for pUSD using a bonding curve mechanism on BSC.

## Features

- Connect wallet (including OKX Wallet support)
- View current exchange rate
- View remaining pUSD supply
- Buy pUSD with USDT
- Automatic approval flow for USDT
- Real-time price calculation

## Environment Configuration

```bash
# .env.local
VITE_CONTRACT_EXCHANGE=your_exchange_address
VITE_CONTRACT_PUSD=your_pusd_address
VITE_CONTRACT_USDT=your_usdt_address
```

**Security Reminder:**
- Store production addresses in environment variables
- Use different keys for test/mainnet environments
- Regularly rotate access credentials

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to Vercel

This project is configured for deployment on Vercel.

### Option 1: Using Vercel CLI

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy to production:
   ```bash
   npm run deploy
   ```

### Option 2: Using Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).

2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click "New Project".

3. Import your repository and configure the project:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. Click "Deploy" and wait for the deployment to complete.

## Project Structure

```
frontend/
├── public/             # Static assets
├── src/
│   ├── components/     # React components
│   │   ├── Navbar.jsx  # Navigation bar with wallet connection
│   │   └── ExchangeInterface.jsx # Main exchange interface
│   ├── contracts/      # Contract ABIs and constants
│   │   ├── abis.js     # Contract ABIs
│   │   └── constants.js # Contract addresses and utility functions
│   ├── App.jsx         # Main application component
│   ├── main.jsx        # Application entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
├── vercel.json         # Vercel deployment configuration
└── package.json        # Project dependencies and scripts
```

## License

ISC
