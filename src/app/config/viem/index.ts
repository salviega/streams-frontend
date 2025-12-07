import { createPublicClient, http, formatUnits, erc20Abi as viemErc20Abi } from 'viem'
import { sepolia } from 'viem/chains'

import { register } from '@/app/config/const/register'

// Re-export erc20Abi from viem
export const erc20Abi = viemErc20Abi

// Private Alchemy RPC for Sepolia (higher rate limits)
const SEPOLIA_RPC = register.alchemy.ethereumSepoliaRpcHttps

// Public client for Sepolia with Alchemy RPC
export const sepoliaClient = createPublicClient({
	chain: sepolia,
	transport: http(SEPOLIA_RPC, {
		retryCount: 3,
		retryDelay: 1000,
		timeout: 30_000
	})
})

// Custom ERC20 ABI subset for compatibility
export const erc20AbiCustom = [
	{
		constant: true,
		inputs: [],
		name: 'name',
		outputs: [{ name: '', type: 'string' }],
		type: 'function'
	},
	{
		constant: true,
		inputs: [],
		name: 'symbol',
		outputs: [{ name: '', type: 'string' }],
		type: 'function'
	},
	{
		constant: true,
		inputs: [],
		name: 'decimals',
		outputs: [{ name: '', type: 'uint8' }],
		type: 'function'
	},
	{
		constant: true,
		inputs: [{ name: 'account', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ name: '', type: 'uint256' }],
		type: 'function'
	}
] as const

// Helper to format balance
export function formatBalance(
	balance: bigint,
	decimals: number,
	maxDecimals: number = 4
): string {
	const formatted = formatUnits(balance, decimals)
	const num = parseFloat(formatted)
	if (num === 0) return '0'
	if (num < 0.0001) return '<0.0001'
	return num.toLocaleString('en-US', {
		maximumFractionDigits: maxDecimals,
		minimumFractionDigits: 0
	})
}

// Detect if tokens are stablecoins (for suggested initial price)
export function isStablecoin(symbol: string): boolean {
	const stablecoins = [
		'USDC',
		'USDT',
		'DAI',
		'BUSD',
		'TUSD',
		'USDP',
		'FRAX',
		'LUSD',
		'USDCM',
		'USDTM',
		'USDCMx',
		'USDTMx'
	]
	return stablecoins.some(s => symbol.toUpperCase().includes(s.toUpperCase()))
}

// Suggest initial price based on token types
export function suggestInitialPrice(
	token0Symbol: string,
	token1Symbol: string
): string {
	const t0Stable = isStablecoin(token0Symbol)
	const t1Stable = isStablecoin(token1Symbol)

	// Both stablecoins → 1:1
	if (t0Stable && t1Stable) return '1'

	// No suggestion for other pairs
	return ''
}
