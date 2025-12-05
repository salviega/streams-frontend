import { Address, parseUnits } from 'viem'

import { TokenInfo, FeeTier } from '@/app/types/token'
import {
	Q96,
	RewardType,
	STREAMER_HOOK_ADDRESS,
	UNISWAP_V4_SPREADS_MAP
} from '@/app/config/const/contracts'

// ============= Types =============

export type PoolKey = {
	currency0: Address
	currency1: Address
	fee: bigint
	tickSpacing: bigint
	hooks: Address
}

export type MintPositionParams = {
	tickLower: number
	tickUpper: number
	liquidity: bigint
	amount0Max: bigint
	amount1Max: bigint
	recipient: Address
	hookData: `0x${string}`
}

export type CreateCampaignParams = {
	pool: PoolKey
	reward: Address
	budget: bigint
	goal: bigint
	duration: bigint
	deadline: bigint
	rewardType: RewardType
	startingPrice: bigint
	mintParams: MintPositionParams
}

// ============= Helper Functions =============

function getCurrentTick(price: number): number {
	return Math.floor(Math.log(price) / Math.log(1.0001))
}

function getUsableTick(currentTick: number, tickSpacing: number): number {
	return Math.floor(currentTick / tickSpacing) * tickSpacing
}

function tickToPrice(tick: number): number {
	return Math.pow(1.0001, tick)
}

export function getTickLowerAndUpper(
	price: number,
	tickSpacing: number,
	spread: number
): { tickLower: number; tickUpper: number } {
	if (spread < tickSpacing) {
		throw new Error(`Spread must be >= tick spacing: ${spread} < ${tickSpacing}`)
	}

	if (spread % tickSpacing !== 0) {
		throw new Error(
			`Spread must be divisible by tickSpacing: ${spread} % ${tickSpacing} !== 0`
		)
	}

	const currentTick = getCurrentTick(price)
	const usableTick = getUsableTick(currentTick, tickSpacing)
	const tickLower = usableTick - spread
	const tickUpper = usableTick + spread

	console.log('🎯 Tick Calculation:')
	console.log(`   Price: ${price}`)
	console.log(`   Current Tick: ${currentTick}`)
	console.log(`   Usable Tick: ${usableTick}`)
	console.log(`   Spread: ${spread}`)
	console.log(`   Tick Lower: ${tickLower}`)
	console.log(`   Tick Upper: ${tickUpper}`)

	if (tickLower < -887270 || tickUpper > 887270) {
		throw new Error(
			`Tick out of range: ${tickLower} < -887270 or ${tickUpper} > 887270`
		)
	}

	return { tickLower, tickUpper }
}

export function encodeSqrtPriceX96(value: number): bigint {
	if (value <= 0) throw new Error('Value must be > 0')
	const sqrtPrice = Math.sqrt(value)
	const sqrtPriceX96 = sqrtPrice * Number(Q96)
	return BigInt(Math.floor(sqrtPriceX96))
}

function encodeSqrtPriceX96FromTick(tick: number): bigint {
	const price = tickToPrice(tick)
	return encodeSqrtPriceX96(price)
}

function getSqrtPricesFromTicks(
	tickLower: number,
	tickUpper: number
): { sqrtPriceAX96: bigint; sqrtPriceBX96: bigint } {
	if (tickLower >= tickUpper) {
		throw new Error(`tickLower must be < tickUpper: ${tickLower} >= ${tickUpper}`)
	}

	return {
		sqrtPriceAX96: encodeSqrtPriceX96FromTick(tickLower),
		sqrtPriceBX96: encodeSqrtPriceX96FromTick(tickUpper)
	}
}

function getLiquidityForAmount0(
	sqrtPriceAX96: bigint,
	sqrtPriceBX96: bigint,
	amount0: bigint
): bigint {
	if (sqrtPriceAX96 >= sqrtPriceBX96) {
		throw new Error('sqrtPriceAX96 must be < sqrtPriceBX96')
	}

	const numerator = amount0 * (sqrtPriceAX96 * sqrtPriceBX96)
	const denominator = sqrtPriceBX96 - sqrtPriceAX96

	return numerator / Q96 / denominator
}

export function getLiquidity(
	amount0: bigint,
	_amount1: bigint,
	tickLower: number,
	tickUpper: number
): bigint {
	const { sqrtPriceAX96, sqrtPriceBX96 } = getSqrtPricesFromTicks(
		tickLower,
		tickUpper
	)

	const liquidity = getLiquidityForAmount0(sqrtPriceAX96, sqrtPriceBX96, amount0)
	
	console.log('💧 Liquidity Calculation:')
	console.log(`   sqrtPriceAX96: ${sqrtPriceAX96.toString()}`)
	console.log(`   sqrtPriceBX96: ${sqrtPriceBX96.toString()}`)
	console.log(`   amount0: ${amount0.toString()}`)
	console.log(`   liquidity: ${liquidity.toString()}`)

	return liquidity
}

function getLiquidityForUsdBudget(
	usdBudget: number,
	token0Decimals: number,
	price: number,
	tickLower: number,
	tickUpper: number
): bigint {
	const budgetToken0 = parseUnits(usdBudget.toString(), token0Decimals)
	const valueToken0 = Number(budgetToken0)

	const priceLower = tickToPrice(tickLower)
	const priceUpper = tickToPrice(tickUpper)

	const sqrtP = Math.sqrt(price)
	const sqrtA = Math.sqrt(priceLower)
	const sqrtB = Math.sqrt(priceUpper)

	const k0 = (sqrtB - sqrtP) / (sqrtP * sqrtB) + (sqrtP - sqrtA) / price

	if (k0 <= 0) {
		throw new Error('Invalid K factor for liquidity calculation')
	}

	return BigInt(Math.floor(valueToken0 / k0))
}

// ============= Main Builder =============

export function buildCreateCampaignParams(
	token0: TokenInfo,
	token1: TokenInfo,
	feeTier: FeeTier,
	initialPrice: string,
	amount0: string,
	amount1: string,
	rewardToken: TokenInfo,
	rewardAmount: string,
	durationDays: number,
	recipient: Address
): CreateCampaignParams {
	console.log('\n🔧 ========== BUILD CAMPAIGN PARAMS ==========')
	console.log('\n📥 INPUT:')
	console.log(`   Token0: ${token0.symbol} (${token0.address}) decimals=${token0.decimals}`)
	console.log(`   Token1: ${token1.symbol} (${token1.address}) decimals=${token1.decimals}`)
	console.log(`   Fee Tier: ${feeTier.label} (fee=${feeTier.fee}, tickSpacing=${feeTier.tickSpacing})`)
	console.log(`   Initial Price: ${initialPrice}`)
	console.log(`   Amount0: ${amount0}`)
	console.log(`   Amount1: ${amount1}`)
	console.log(`   Reward Token: ${rewardToken.symbol} (${rewardToken.address}) decimals=${rewardToken.decimals}`)
	console.log(`   Reward Amount: ${rewardAmount}`)
	console.log(`   Duration Days: ${durationDays}`)
	console.log(`   Recipient: ${recipient}`)

	// Sort tokens (currency0 < currency1) - CRITICAL!
	const [sortedToken0, sortedToken1, isSwapped] =
		token0.address.toLowerCase() < token1.address.toLowerCase()
			? [token0, token1, false]
			: [token1, token0, true]

	const currency0 = sortedToken0.address as Address
	const currency1 = sortedToken1.address as Address

	console.log('\n🔀 SORTED TOKENS:')
	console.log(`   isSwapped: ${isSwapped}`)
	console.log(`   currency0: ${sortedToken0.symbol} (${currency0})`)
	console.log(`   currency1: ${sortedToken1.symbol} (${currency1})`)
	console.log(`   Verification: currency0 < currency1 = ${currency0.toLowerCase() < currency1.toLowerCase()}`)

	// Parse amounts (SWAP IF NEEDED!)
	const amount0Parsed = parseUnits(
		isSwapped ? amount1 : amount0,
		sortedToken0.decimals
	)
	const amount1Parsed = parseUnits(
		isSwapped ? amount0 : amount1,
		sortedToken1.decimals
	)

	console.log('\n💰 AMOUNTS (after swap adjustment):')
	console.log(`   amount0Max (${sortedToken0.symbol}): ${amount0Parsed.toString()}`)
	console.log(`   amount1Max (${sortedToken1.symbol}): ${amount1Parsed.toString()}`)

	// Parse budget
	const budget = parseUnits(rewardAmount, rewardToken.decimals)
	console.log(`   budget (${rewardToken.symbol}): ${budget.toString()}`)

	// Calculate price: MUST NORMALIZE BY DECIMALS!
	// price = (amount1 / 10^decimals1) / (amount0 / 10^decimals0)
	// This gives the real exchange rate: how many token1 per 1 token0
	const amount0Normalized = Number(amount0Parsed) / Math.pow(10, sortedToken0.decimals)
	const amount1Normalized = Number(amount1Parsed) / Math.pow(10, sortedToken1.decimals)
	const price = amount1Normalized / amount0Normalized

	console.log('\n📈 PRICE:')
	console.log(`   Input initialPrice: ${initialPrice}`)
	console.log(`   amount0Normalized: ${amount0Normalized} ${sortedToken0.symbol}`)
	console.log(`   amount1Normalized: ${amount1Normalized} ${sortedToken1.symbol}`)
	console.log(`   Calculated price (normalized): ${price}`)
	console.log(`   This means: 1 ${sortedToken0.symbol} = ${price} ${sortedToken1.symbol}`)

	// Get tick spacing from fee tier
	const tickSpacing = feeTier.tickSpacing

	// Use spread from map, adjusted to be divisible by tickSpacing
	const baseSpread = UNISWAP_V4_SPREADS_MAP[3000] || 3000
	// Ensure spread is divisible by tickSpacing
	let spread = Math.floor(baseSpread / tickSpacing) * tickSpacing
	// Ensure minimum spread
	if (spread < tickSpacing * 10) {
		spread = tickSpacing * 300 // A reasonable spread for most cases
	}

	console.log('\n📏 TICK CONFIG:')
	console.log(`   tickSpacing: ${tickSpacing}`)
	console.log(`   baseSpread: ${baseSpread}`)
	console.log(`   adjusted spread: ${spread}`)
	console.log(`   spread % tickSpacing = ${spread % tickSpacing} (must be 0)`)

	// Calculate ticks
	const { tickLower, tickUpper } = getTickLowerAndUpper(price, tickSpacing, spread)

	// Calculate liquidity using ONLY amount0 (exactly like the task)
	const liquidity = getLiquidity(amount0Parsed, amount1Parsed, tickLower, tickUpper)

	// Calculate goal (TVL target)
	const goalUsd = parseFloat(rewardAmount)
	const goal = getLiquidityForUsdBudget(
		goalUsd,
		sortedToken0.decimals,
		price,
		tickLower,
		tickUpper
	)

	console.log(`   goal: ${goal.toString()}`)

	// Duration in seconds
	const duration = BigInt(durationDays * 24 * 60 * 60)

	// Deadline (30 minutes from now)
	const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800)

	// Starting price
	const startingPrice = encodeSqrtPriceX96(price)

	console.log('\n⏱️ TIME:')
	console.log(`   duration: ${duration.toString()} seconds (${durationDays} days)`)
	console.log(`   deadline: ${deadline.toString()}`)
	console.log(`   startingPrice (sqrtPriceX96): ${startingPrice.toString()}`)

	// Pool Key
	const poolKey: PoolKey = {
		currency0,
		currency1,
		fee: BigInt(feeTier.fee),
		tickSpacing: BigInt(tickSpacing),
		hooks: STREAMER_HOOK_ADDRESS
	}

	console.log('\n🏊 POOL KEY:')
	console.log(`   currency0: ${poolKey.currency0}`)
	console.log(`   currency1: ${poolKey.currency1}`)
	console.log(`   fee: ${poolKey.fee.toString()}`)
	console.log(`   tickSpacing: ${poolKey.tickSpacing.toString()}`)
	console.log(`   hooks: ${poolKey.hooks}`)

	// Mint Position Params
	const mintParams: MintPositionParams = {
		tickLower,
		tickUpper,
		liquidity,
		amount0Max: amount0Parsed,
		amount1Max: amount1Parsed,
		recipient,
		hookData: '0x'
	}

	console.log('\n🎫 MINT PARAMS:')
	console.log(`   tickLower: ${mintParams.tickLower}`)
	console.log(`   tickUpper: ${mintParams.tickUpper}`)
	console.log(`   liquidity: ${mintParams.liquidity.toString()}`)
	console.log(`   amount0Max: ${mintParams.amount0Max.toString()}`)
	console.log(`   amount1Max: ${mintParams.amount1Max.toString()}`)
	console.log(`   recipient: ${mintParams.recipient}`)
	console.log(`   hookData: ${mintParams.hookData}`)

	const result: CreateCampaignParams = {
		pool: poolKey,
		reward: rewardToken.address as Address,
		budget,
		goal,
		duration,
		deadline,
		rewardType: RewardType.Streaming,
		startingPrice,
		mintParams
	}

	console.log('\n📦 FINAL CREATE CAMPAIGN PARAMS:')
	console.log(JSON.stringify({
		pool: {
			currency0: result.pool.currency0,
			currency1: result.pool.currency1,
			fee: result.pool.fee.toString(),
			tickSpacing: result.pool.tickSpacing.toString(),
			hooks: result.pool.hooks
		},
		reward: result.reward,
		budget: result.budget.toString(),
		goal: result.goal.toString(),
		duration: result.duration.toString(),
		deadline: result.deadline.toString(),
		rewardType: result.rewardType,
		startingPrice: result.startingPrice.toString(),
		mintParams: {
			tickLower: result.mintParams.tickLower,
			tickUpper: result.mintParams.tickUpper,
			liquidity: result.mintParams.liquidity.toString(),
			amount0Max: result.mintParams.amount0Max.toString(),
			amount1Max: result.mintParams.amount1Max.toString(),
			recipient: result.mintParams.recipient,
			hookData: result.mintParams.hookData
		}
	}, null, 2))
	console.log('\n🔧 ========== END BUILD CAMPAIGN PARAMS ==========\n')

	return result
}
