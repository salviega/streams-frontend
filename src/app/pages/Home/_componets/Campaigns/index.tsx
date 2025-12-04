'use client'

import { JSX, useState } from 'react'

import Container from '@/app/ui/Container'
import Typography from '@/app/ui/Typography'

import Pool from './_components/Pool'

// Mock campaigns data - En producción vendrá del contrato Streamer
const mockCampaigns = [
	{
		id: 1,
		name: 'SUNM Fair Launch',
		pool: { token0: 'SUNM', token1: 'USDCM', feeTier: 3000, price: 0.0245 },
		reward: 'USDTM',
		network: 'Sepolia',
		status: 'live' as const,
		totalUnits: 320000,
		goal: 500000,
		budget: 50000,
		tvl: 125000,
		daysRemaining: 25,
		goalReached: false
	},
	{
		id: 2,
		name: 'ETH/USDC Rewards',
		pool: { token0: 'WETH', token1: 'USDC', feeTier: 500, price: 3245.67 },
		reward: 'ARB',
		network: 'Sepolia',
		status: 'live' as const,
		totalUnits: 890000,
		goal: 1000000,
		budget: 100000,
		tvl: 520000,
		daysRemaining: 12,
		goalReached: false
	},
	{
		id: 3,
		name: 'DAI Liquidity',
		pool: { token0: 'DAI', token1: 'USDC', feeTier: 100, price: 0.9998 },
		reward: 'COMP',
		network: 'Sepolia',
		status: 'funding' as const,
		totalUnits: 150000,
		goal: 500000,
		budget: 25000,
		tvl: 75000,
		daysRemaining: 30,
		goalReached: false
	},
	{
		id: 4,
		name: 'LINK Boost',
		pool: { token0: 'LINK', token1: 'WETH', feeTier: 3000, price: 0.0042 },
		reward: 'LINK',
		network: 'Sepolia',
		status: 'completed' as const,
		totalUnits: 500000,
		goal: 500000,
		budget: 75000,
		tvl: 310000,
		daysRemaining: 0,
		goalReached: true
	},
	{
		id: 5,
		name: 'UNI/WETH Pool',
		pool: { token0: 'UNI', token1: 'WETH', feeTier: 3000, price: 0.0021 },
		reward: 'UNI',
		network: 'Sepolia',
		status: 'live' as const,
		totalUnits: 420000,
		goal: 600000,
		budget: 45000,
		tvl: 180000,
		daysRemaining: 18,
		goalReached: false
	}
]

export default function Campaigns(): JSX.Element {
	const [selectedId, setSelectedId] = useState<number>(1)

	return (
		<div className="h-full flex flex-col items-center justify-start">
			<Container className="h-full w-full flex flex-col gap-4">
				<div className="flex flex-row items-center justify-between">
					<Typography variant="title">Campaigns</Typography>
					<Container variant="rounded" className="w-fit px-3 py-1">
						<Typography variant="label">
							{mockCampaigns.length} pools
						</Typography>
					</Container>
				</div>

				{/* Lista con scroll */}
				<div className="h-full w-full flex flex-col gap-3 overflow-y-auto">
					{mockCampaigns.map(campaign => (
						<Pool
							key={campaign.id}
							campaign={campaign}
							selected={campaign.id === selectedId}
							onClick={() => setSelectedId(campaign.id)}
						/>
					))}
				</div>
			</Container>
		</div>
	)
}
