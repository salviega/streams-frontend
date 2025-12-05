import { FeeTier } from '@/app/types/token'

export const UNISWAP_V4_TIERS: FeeTier[] = [
	{
		fee: 100,
		tickSpacing: 1,
		label: '0.01%',
		description: 'Best for very stable pairs.'
	},
	{
		fee: 500,
		tickSpacing: 10,
		label: '0.05%',
		description: 'Best for stable pairs.'
	},
	{
		fee: 3000,
		tickSpacing: 60,
		label: '0.3%',
		description: 'Best for most pairs.'
	},
	{
		fee: 10000,
		tickSpacing: 200,
		label: '1%',
		description: 'Best for exotic pairs.'
	}
]

