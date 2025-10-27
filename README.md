# SecretBallot - Privacy-Preserving Voting Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FHEVM](https://img.shields.io/badge/FHEVM-v0.8-blue)](https://docs.zama.ai/fhevm)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-lightgrey)](https://soliditylang.org/)

SecretBallot is a privacy-preserving decentralized voting platform built on FHEVM (Fully Homomorphic Encryption Virtual Machine). It enables voters to cast encrypted ballots where votes remain private on-chain until a decryption process reveals final counts.

## 🌟 Features

- **🔒 Fully Private Voting**: Votes are encrypted on-chain using FHEVM technology
- **🛡️ Tamper-Proof**: Encrypted votes cannot be manipulated or predicted
- **⚡ Transparent Results**: Decrypted results are publicly verifiable
- **🌐 Bilingual Support**: English and Chinese interfaces
- **🔐 EIP-712 Signatures**: Secure authorization for decryption requests
- **📊 Rich Analytics**: Personal voting history and proposal tracking

## 🏗️ Architecture

```
zama_voting_0004/
├── fhevm-hardhat-template/    # Smart contracts
│   ├── contracts/
│   │   └── SecretBallot.sol    # Main voting contract
│   ├── deploy/
│   │   └── deploySecretBallot.ts
│   ├── tasks/
│   │   └── SecretBallot.ts     # CLI tasks
│   └── test/
│       └── SecretBallot.ts     # Contract tests
│
├── secretballot-frontend/       # Next.js frontend
│   ├── app/                     # App Router pages
│   ├── components/              # React components
│   ├── hooks/                   # Custom hooks
│   ├── fhevm/                   # FHEVM integration
│   └── scripts/                 # ABI generation
│
└── frontend/                    # Reference implementation (read-only)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask wallet
- Sepolia ETH (for testnet) or local Hardhat node

### Installation

```bash
# Clone the repository
git clone https://github.com/FayMore/SecretBallot.git
cd SecretBallot

# Install dependencies for smart contracts
cd fhevm-hardhat-template
npm install

# Install dependencies for frontend
cd ../secretballot-frontend
npm install
```

### Local Development

#### 1. Start Hardhat Node

```bash
cd fhevm-hardhat-template
npx hardhat node
```

#### 2. Deploy Contracts

```bash
npx hardhat deploy --network localhost
```

#### 3. Start Frontend (Mock Mode)

```bash
cd secretballot-frontend
npm run dev:mock
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testnet Deployment

#### Sepolia Testnet

```bash
# Configure environment variables
cd fhevm-hardhat-template
npx hardhat vars set MNEMONIC "your mnemonic"
npx hardhat vars set INFURA_API_KEY "your infura key"

# Deploy to Sepolia
npx hardhat deploy --network sepolia --tags SecretBallot
```

**Deployed Contract Address**: `0x88bdDd50d90bA6aAD22B38DdF5D3f987A36C258D`

- [View on Etherscan](https://sepolia.etherscan.io/address/0x88bdDd50d90bA6aAD22B38DdF5D3f987A36C258D)

## 📖 Usage

### Creating a Proposal

1. Connect your wallet
2. Click "Create New Proposal"
3. Fill in the proposal details:
   - Title and description
   - Voting options (minimum 2)
   - Duration (1 minute for localhost testing, 7 days for testnet)
4. Submit the proposal

### Voting

1. Browse available proposals on the home page
2. Click "View Details"
3. Select your preferred option
4. Confirm the vote (encrypted on-chain)
5. Wait for the voting period to end

### Decrypting Results

1. After a proposal ends, click "Decrypt Results"
2. Sign the transaction to request decryption
3. Results will be revealed automatically (on localhost)
4. View voting statistics and winner

## 🧪 Testing

### Run Contract Tests

```bash
cd fhevm-hardhat-template
npx hardhat test
```

### Build Frontend

```bash
cd secretballot-frontend
npm run build
```

## 🔑 Key Technologies

- **Smart Contracts**: Solidity 0.8.27, Hardhat
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Glassmorphism design
- **Blockchain**: FHEVM (Zama)
- **Wallet**: MetaMask (EIP-6963)
- **i18n**: next-intl

## 📁 Project Structure

```
fhevm-hardhat-template/
├── contracts/SecretBallot.sol          # Main voting contract
├── deploy/deploySecretBallot.ts       # Deployment script
├── tasks/SecretBallot.ts              # CLI tasks
└── test/SecretBallot.ts               # Contract tests

secretballot-frontend/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx                   # Home page
│   │   ├── create/page.tsx            # Create proposal
│   │   ├── my-proposals/page.tsx      # User proposals
│   │   ├── my-votes/page.tsx          # User votes
│   │   └── proposal/[id]/page.tsx     # Proposal details
├── hooks/
│   ├── useSecretBallot.tsx            # Contract hook
│   └── metamask/                      # Wallet integration
├── fhevm/
│   └── internal/fhevm.ts              # FHEVM instance management
└── scripts/
    ├── genabi.mjs                     # ABI generation
    └── is-hardhat-node-running.mjs    # Node detection
```

## 🔐 Security

- FHEVM encryption ensures vote privacy
- EIP-712 signatures for secure authorization
- Transparent on-chain vote storage
- Verifiable decryption results

## 🌍 Internationalization

Supported languages:
- English (`/en`)
- 中文 (`/zh`)

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Zama](https://zama.ai/) for FHEVM technology
- [Hardhat](https://hardhat.org/) for development framework
- [Next.js](https://nextjs.org/) for frontend framework

## 📧 Contact

- GitHub: [@FayMore](https://github.com/FayMore)
- Email: hakiyamehga@gmail.com

## 🗺️ Roadmap

- [ ] Mobile app support
- [ ] Advanced proposal types
- [ ] Governance token integration
- [ ] Cross-chain voting
- [ ] Decentralized oracle network

---

**Made with ❤️ using FHEVM**

