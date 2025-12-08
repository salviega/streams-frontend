# Streams Protocol

## 📋 Overview

**Streams** is a DeFi protocol that enables the creation of liquidity incentive campaigns with streaming rewards. The protocol combines **Uniswap V4** for liquidity pools and **Superfluid GDA** (General Distribution Agreement) to distribute rewards continuously and proportionally to liquidity providers (LPs).

## 🎯 Objective and Purpose

The main objective of Streams is to facilitate the creation of liquidity incentive programs where:

- **Campaign creators** can set up incentives to attract liquidity to specific token pairs
- **Liquidity Providers (LPs)** receive continuous streaming rewards based on their proportional participation in the pool
- Rewards are distributed automatically using Superfluid, eliminating the need for manual "claim" transactions
- The system tracks provided liquidity and assigns proportional "units" that determine reward share

### Use Cases

- **DeFi projects** that want to incentivize liquidity for their tokens
- **Protocols** that need to create liquidity pools with programmatic incentives
- **Communities** that wish to reward their liquidity providers continuously and fairly

## 🏗️ Architecture

The project is divided into two main repositories:

```
streams/
├── streams-contracts/    # Smart contracts (Solidity + Hardhat)
└── streams-frontend/    # Web interface (Next.js + React)
```

**Repositories:**

- [streams-contracts](https://github.com/salviega/streams-contracts.git) - Smart contracts repository

### Core Components

#### 1. **Streamer.sol** (Main Contract)

- Manages campaign creation and execution
- Converts reward tokens to SuperTokens
- Sets up GDA distribution pools
- Tracks LP units and distributes rewards

#### 2. **StreamerHook.sol** (Uniswap V4 Hook)

- Uniswap V4 hook that executes after adding/removing liquidity
- Detects changes in pool liquidity
- Notifies the Streamer contract to update LP units

### How the Hook Works

The **StreamerHook** is a critical component that enables automatic tracking of liquidity changes in Uniswap V4 pools. Here's how it operates:

#### Hook Permissions

The hook is configured with the following permissions:

- `afterAddLiquidity: true` - Executes after liquidity is added
- `afterRemoveLiquidity: true` - Executes after liquidity is removed
- All other hooks are disabled for gas efficiency

#### Hook Execution Flow

1. **When LP adds liquidity:**
   - Uniswap V4 PositionManager calls the pool's `modifyLiquidity` function
   - After the liquidity is added, `_afterAddLiquidity` hook is triggered
   - The hook extracts the `campaignId` by looking up the pool key
   - If a campaign exists for this pool, it calls `streamer.addUnitsToLP()`
   - The LP's address is extracted from `hookData` (passed during liquidity addition)

2. **When LP removes liquidity:**
   - Similar flow but triggered by `_afterRemoveLiquidity`
   - Calls `streamer.removeUnitsFromLP()` to update the LP's units
   - Proportions are automatically recalculated

#### Hook Data

The hook uses `hookData` to identify the actual LP address:

```solidity
// When adding liquidity, the LP address is encoded in hookData
bytes memory hookData = abi.encode(msg.sender);
```

This allows the hook to correctly attribute liquidity changes to the right LP, even when called through intermediate contracts.

#### Integration with Campaigns

- Each campaign is associated with a specific Uniswap V4 pool
- The hook maintains a mapping: `PoolId → CampaignId`
- Only pools with active campaigns trigger unit updates
- This ensures gas efficiency by only processing relevant liquidity events

#### 3. **StreamerConfig.sol** (Configuration)

- Manages protocol parameters (fees, treasury, etc.)
- Stores campaign information and token mappings

#### 4. **Frontend (Next.js)**

- Interface for creating campaigns
- Visualization of active campaigns
- Liquidity position management
- Streaming rewards monitoring

## 🔄 Complete Protocol Flow

### Phase 1: Campaign Creation

1. **Creator initiates campaign** (`createCampaign`)
   - Defines: `budget` (reward budget), `goal` (liquidity goal), `duration` (duration), `reward` (reward token)
   - Specifies the token pair for the pool (token0/token1)
   - Defines pool parameters: fee tier, tick spacing, starting price

2. **Conversion to SuperToken**
   - The contract receives the reward token
   - If not a SuperToken, creates a wrapper using SuperTokenFactory
   - Converts the token to SuperToken (scales to 18 decimals)

3. **Flow Rate Calculation**
   - Calculates `flowRate` = `budget / duration`
   - This determines how much is distributed per second to LPs

4. **Uniswap V4 Pool Initialization**
   - Creates/initializes the Uniswap V4 pool with the specified pair
   - The pool is associated with StreamerHook for liquidity tracking

5. **Initial Position Mint**
   - The creator can add initial liquidity to the pool
   - Fees are calculated and transferred to treasury
   - A position NFT is created in Uniswap V4

### Phase 2: Campaign Activation

1. **Distribution start** (`startCampaign`)
   - Creates a GDA (General Distribution Agreement) distribution pool
   - Configures the pool so only the admin (Streamer) can distribute
   - Starts the distribution flow with the calculated `flowRate`

2. **Active state**
   - The campaign is marked as `active = true`
   - The GDA distribution pool is ready to receive members (LPs)

### Phase 3: Liquidity Providers

1. **LP adds liquidity** (`addLiquidityToCampaign`)
   - The LP provides both tokens of the pair (or ETH if native)
   - Fees are calculated and transferred to treasury
   - Uniswap V4 PositionManager is called to add liquidity

2. **StreamerHook detects the change**
   - The `afterAddLiquidity` hook executes automatically
   - Extracts the `campaignId` from the pool
   - Calls `addUnitsToLP` in the Streamer contract

3. **Unit assignment**
   - Units = amount of liquidity added
   - Updates `campaignLpUnits[campaignId][lp]` and `campaignTotalUnits[campaignId]`
   - Checks if the goal has been reached

4. **GDA pool update**
   - Updates the GDA distribution pool with the LP's new units
   - If it's the first LP (totalUnits was 0), starts the distribution flow
   - The LP now automatically receives proportional rewards

### Phase 4: Reward Distribution

1. **Continuous streaming**
   - Superfluid GDA distributes tokens continuously according to `flowRate`
   - Each LP receives: `(lpUnits / totalUnits) * flowRate`
   - Rewards accumulate in real-time in the LP's account

2. **Proportionality**
   - If an LP has 10% of total units, they receive 10% of the flow
   - If another LP adds more liquidity, proportions adjust automatically
   - Rewards update in real-time without requiring transactions

### Phase 5: Liquidity Removal

1. **LP withdraws liquidity**
   - The LP calls Uniswap V4 to remove liquidity
   - StreamerHook detects the removal in `afterRemoveLiquidity`

2. **Unit update**
   - Units proportional to withdrawn liquidity are removed
   - Updates the GDA pool with new units (may be 0)
   - The LP stops receiving proportional rewards

### Phase 6: Completion

1. **Goal reached**
   - When `campaignTotalUnits >= goal`, `campaignGoalReached = true` is marked
   - No more units can be added (though liquidity can still be added)
   - Distribution flow continues until budget is exhausted

2. **Duration completed**
   - After `duration` seconds, the budget is exhausted
   - LPs can continue to withdraw liquidity normally
   - Rewards stop distributing when the flow stops

## 🔧 Technologies Used

### Smart Contracts

- **Solidity 0.8.30**: Programming language
- **Hardhat**: Development framework
- **Uniswap V4**: Liquidity protocol (pools and hooks)
- **Superfluid**: Streaming reward distribution (GDA)
- **Permit2**: Token approval optimization
- **OpenZeppelin**: Base contracts and security

### Frontend

- **Next.js 16**: React framework
- **React 19**: UI library
- **Wagmi + Viem**: Blockchain interaction
- **Thirdweb**: Wallet connection
- **TailwindCSS + DaisyUI**: Styling

## 📁 Project Structure

### streams-contracts/

```
contracts/
├── Streamer.sol              # Main contract
├── StreamerConfig.sol        # Configuration and storage
├── StreamerHook.sol          # Uniswap V4 hook
└── core/
    ├── interfaces/           # Protocol interfaces
    └── libraries/            # Utilities (Transfer, Errors, etc.)

deploy/                       # Deployment scripts
task/                         # Hardhat tasks for testing
models/                       # TypeScript models
services/                     # Services (GraphQL, etc.)
```

### streams-frontend/

```
src/
├── app/
│   ├── pages/
│   │   ├── Home/             # Campaign list
│   │   └── NewCampaign/      # Create new campaign
│   ├── hooks/                # React hooks for contracts
│   ├── config/               # Configuration (contracts, wagmi, etc.)
│   └── ui/                   # Reusable UI components
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Bun or npm
- Alchemy/Infura account for RPC
- Wallet with testnet funds (Sepolia)

### Installation

```bash
# Clone contracts repository
git clone https://github.com/salviega/streams-contracts.git
cd streams-contracts
npm install

# Clone frontend repository (if available)
# git clone <frontend-repo-url>
# cd streams-frontend
# npm install
```

### Configuration

1. **Contracts** (`streams-contracts/.env`):

```env
PRIVATE_KEY=your_private_key
ALCHEMY_API_KEY=your_api_key
ETHERSCAN_API_KEY=your_api_key
```

2. **Frontend** (`streams-frontend/.env.local`):

```env
NEXT_PUBLIC_STREAMER_ADDRESS=0x...
NEXT_PUBLIC_STREAMER_HOOK_ADDRESS=0x...
```

### Deployment

```bash
# Compile contracts
cd streams-contracts
npm run compile

# Deploy to Sepolia
npm run deploy -- --network Sepolia
```

### Development

```bash
# Frontend
cd streams-frontend
npm run dev

# Open http://localhost:3000
```

## 📊 Key Concepts

### Units

- Represent an LP's participation in a campaign
- Calculated as: `units = liquidity` (initially 1:1)
- Determine reward percentage: `lpShare = lpUnits / totalUnits`

### Flow Rate

- Reward distribution speed (tokens/second)
- Calculated as: `flowRate = budget / duration`
- Distributed proportionally among all active LPs

### SuperTokens

- Tokens wrapped with Superfluid that enable streaming
- Always have 18 decimals
- Created automatically if reward token is not a SuperToken

### Goal

- Total liquidity target in the pool
- When reached, no more units can be added
- Distribution flow continues until budget is exhausted

## 🔒 Security

- **ReentrancyGuard**: Protection against reentrancy attacks
- **Access Control**: Protected administrative functions
- **Input Validation**: Exhaustive parameter validation
- **Safe Transfers**: Use of SafeTransferLib for transfers
- **Upgradeable**: Upgradeable contracts for security patches

## 📝 Available Scripts

### Contracts

- `npm run compile` - Compile contracts
- `npm run deploy` - Deploy contracts
- `npm run task:01-create-campaign` - Create test campaign
- `npm run task:02-start-campaign` - Start campaign
- `npm run task:18-connect-and-add-liquidity` - Add liquidity

### Frontend

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - Linter

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Useful Links

- [Streams Contracts Repository](https://github.com/salviega/streams-contracts.git)
- [Uniswap V4 Docs](https://docs.uniswap.org/)
- [Superfluid Docs](https://docs.superfluid.finance/)
- [Hardhat Docs](https://hardhat.org/docs)
- [Next.js Docs](https://nextjs.org/docs)

## 📧 Support

For questions and support, open an issue in the repository.

## 🚀 Future Plans & Support Needed

Our next goal is to move from this hackathon demo to a more solid MVP that can be tested in real environments. To do that, we're looking for a small amount of funding—ideally through a grant—to strengthen the hook infrastructure, improve security, and deliver a beta version ready for pilot programs.

We'd also appreciate support in connecting with protocols that are preparing token launches and want to experiment with liquidity incentive campaigns on our platform. Running pilots with real projects would help us validate the experience, improve usability, and ensure the product solves real needs in the ecosystem.

If you're interested in:

- **Providing funding or grants** for development
- **Partnering** for pilot programs with your token launch
- **Contributing** to the codebase or documentation
- **Providing feedback** on the protocol design

Please reach out by opening an issue or contacting us directly.

---

**Note**: This protocol is under active development. Use at your own risk and always perform security audits before using on mainnet.
