import { Address } from 'viem'

// Sepolia Contract Addresses
export const STREAMER_ADDRESS: Address =
	'0x08440b6118721414Fc35616da45251f12e634Fa4'

export const STREAMER_HOOK_ADDRESS: Address =
	'0xdf128f75822B36fbca98c302B7011a40CF6cC500'

// Superfluid Addresses (Sepolia)
export const GDA_FORWARDER_ADDRESS: Address =
	'0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08'

// Uniswap V4 Tiers
export const UNISWAP_V4_TIERS = [
	{ fee: 100, tickSpacing: 1 }, // 0.01%
	{ fee: 500, tickSpacing: 10 }, // 0.05%
	{ fee: 3000, tickSpacing: 60 }, // 0.30%
	{ fee: 10000, tickSpacing: 200 } // 1.00%
] as const

// Uniswap V4 Spreads
export const UNISWAP_V4_SPREADS_MAP: Record<number, number> = {
	3000: 3000,
	6000: 6000,
	9000: 9000
}

// Q96 for price encoding
export const Q96 = 2n ** 96n

// Reward types
export enum RewardType {
	Points = 0,
	Streaming = 1,
	Tokens = 2
}

