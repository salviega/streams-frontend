export type TokenInfo = {
	address: string
	name: string
	symbol: string
	decimals: number
	balance?: string // Balance formatted
	balanceRaw?: bigint // Balance in wei
}

export type FeeTier = {
	fee: number
	tickSpacing: number
	label: string
	description: string
}

export type CampaignFormData = {
	// Step 1
	token0: TokenInfo | null
	token1: TokenInfo | null
	feeTier: FeeTier | null
	// Step 2
	initialPrice: string
	amount0: string
	amount1: string
	// Step 3
	rewardToken: TokenInfo | null
	rewardAmount: string
	duration: number // days
}
