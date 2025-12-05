/**
 * Utility functions for formatting numbers in a human-readable way
 */

/**
 * Format a large number with K, M, B, T suffixes
 */
export function formatCompact(value: number): string {
	if (value === undefined || value === null || isNaN(value)) return '0'
	if (value === 0) return '0'
	if (value < 0) return '-' + formatCompact(-value)

	// Very small numbers
	if (value < 0.0001) return '<0.0001'
	if (value < 1) return value.toFixed(4)
	if (value < 1000) return value.toFixed(2)

	const suffixes = ['', 'K', 'M', 'B', 'T', 'Q']
	const tier = Math.min(Math.floor(Math.log10(Math.abs(value)) / 3), suffixes.length - 1)

	if (tier === 0) {
		return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
	}

	const suffix = suffixes[tier]
	const scale = Math.pow(10, tier * 3)
	const scaled = value / scale

	return scaled.toFixed(2) + suffix
}

/**
 * Format a number with max 2 decimal places for display
 */
export function formatAmount(value: number, maxDecimals: number = 2): string {
	if (value === undefined || value === null || isNaN(value)) return '0'
	if (value === 0) return '0'
	if (Math.abs(value) < 0.01 && maxDecimals <= 2) return '<0.01'
	
	return value.toLocaleString('en-US', {
		minimumFractionDigits: 0,
		maximumFractionDigits: maxDecimals
	})
}

/**
 * Format a very small number (like flow rates) in a readable way
 */
export function formatSmallNumber(value: number, maxDecimals: number = 6): string {
	if (value === undefined || value === null || isNaN(value)) return '0'
	if (value === 0) return '0'
	if (Math.abs(value) < 0.000001) return '<0.000001'
	
	// Remove trailing zeros
	const fixed = value.toFixed(maxDecimals)
	return fixed.replace(/\.?0+$/, '')
}

/**
 * Format flow rate to human readable per day
 * flowRate from Superfluid is ALWAYS in wei/second (10^18 precision)
 * regardless of token decimals
 */
export function formatFlowRatePerDay(flowRateWei: bigint | number, _decimals?: number): string {
	const rate = typeof flowRateWei === 'bigint' ? Number(flowRateWei) : flowRateWei
	// Superfluid flow rate is always in wei/second (10^18)
	const perSecond = rate / 1e18
	const perDay = perSecond * 86400
	return formatAmount(perDay, 2)
}

/**
 * Format percentage
 */
export function formatPercent(value: number, maxDecimals: number = 2): string {
	if (value === undefined || value === null || isNaN(value)) return '0%'
	if (value === 0) return '0%'
	if (value < 0.01 && value > 0) return '<0.01%'
	return `${value.toFixed(maxDecimals)}%`
}

/**
 * Safely divide by 10^decimals for unit conversion
 */
export function fromWei(value: bigint | number, decimals: number = 18): number {
	const num = typeof value === 'bigint' ? Number(value) : value
	if (num === 0 || isNaN(num)) return 0
	return num / Math.pow(10, decimals)
}

/**
 * Convert Uniswap liquidity units to approximate USD value
 * Based on the inverse of getLiquidityForUsdBudgetToken0Stable from task
 * 
 * Formula: valueToken0 = L * k0
 * where k0 = (sqrtB - sqrtP) / (sqrtP * sqrtB) + (sqrtP - sqrtA) / price
 */
export function liquidityToUsd(
	liquidity: bigint | number,
	price: number,
	tickLower: number,
	tickUpper: number,
	token0Decimals: number
): number {
	const L = typeof liquidity === 'bigint' ? Number(liquidity) : liquidity
	if (L === 0 || isNaN(L)) return 0

	const priceLower = tickToPrice(tickLower)
	const priceUpper = tickToPrice(tickUpper)

	const sqrtP = Math.sqrt(price)
	const sqrtA = Math.sqrt(priceLower)
	const sqrtB = Math.sqrt(priceUpper)

	// k0 factor from the liquidity formula
	const k0 = (sqrtB - sqrtP) / (sqrtP * sqrtB) + (sqrtP - sqrtA) / price

	if (k0 <= 0) return 0

	// valueToken0 in raw units (wei)
	const valueToken0Raw = L * k0

	// Convert from raw units to USD (token0 is stable, so 1:1 with USD)
	const valueUsd = valueToken0Raw / Math.pow(10, token0Decimals)

	return valueUsd
}

/**
 * Convert tick to price using Uniswap formula
 */
export function tickToPrice(tick: number): number {
	return Math.pow(1.0001, tick)
}

/**
 * Format liquidity as integer (no decimals)
 */
export function formatLiquidity(value: bigint | number): string {
	const num = typeof value === 'bigint' ? Number(value) : value
	if (num === 0 || isNaN(num)) return '0'
	
	// Format as compact integer
	return formatCompact(num)
}
