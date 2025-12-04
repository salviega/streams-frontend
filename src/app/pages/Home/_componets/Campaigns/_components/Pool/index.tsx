import { JSX } from 'react'

import Container from '@/app/ui/Container'
import Progress from '@/app/ui/Progress'
import Typography from '@/app/ui/Typography'

type PoolProps = {
	campaign?: {
		id: number
		name: string
		pool: {
			token0: string
			token1: string
			feeTier: number // 500 = 0.05%, 3000 = 0.3%, 10000 = 1%
			price: number // Precio actual token0/token1
		}
		reward: string
		network: string
		status: 'funding' | 'live' | 'completed' | 'paused'
		totalUnits: number
		goal: number
		budget: number
		tvl: number // TVL en USD
		daysRemaining: number
		goalReached: boolean
	}
	selected?: boolean
	onClick?: () => void
}

export default function Pool(props: PoolProps): JSX.Element {
	// Mock data - En producción vendrá del contrato Streamer.getCampaign()
	// y datos de Uniswap v4 (PoolManager, slot0, etc.)
	const {
		campaign = {
			id: 1,
			name: 'SUNM Fair Launch',
			pool: {
				token0: 'SUNM',
				token1: 'USDCM',
				feeTier: 3000, // 0.3%
				price: 0.0245 // 1 SUNM = 0.0245 USDCM
			},
			reward: 'USDTM',
			network: 'Sepolia',
			status: 'live' as const,
			totalUnits: 320000,
			goal: 500000,
			budget: 50000,
			tvl: 125000, // TVL en USD
			daysRemaining: 25,
			goalReached: false
		},
		selected = false,
		onClick
	} = props

	const progress = Math.round((campaign.totalUnits / campaign.goal) * 100)
	const feePercent = (campaign.pool.feeTier / 10000).toFixed(2)
	const estimatedAPY =
		campaign.tvl > 0 ? Math.round((campaign.budget / campaign.tvl) * 365) : 0

	const statusConfig = {
		funding: {
			label: 'Funding',
			class: 'border-yellow-500/40 text-yellow-400'
		},
		live: { label: 'Live', class: 'border-cyan-400/70 text-cyan-300' },
		completed: { label: 'Ended', class: 'border-gray-500/60 text-gray-400' },
		paused: { label: 'Paused', class: 'border-orange-500/40 text-orange-400' }
	}

	const status = statusConfig[campaign.status]

	return (
		<Container
			className={`hover:border-cyan-400/50 transition-all duration-200 cursor-pointer ${
				selected ? 'border-cyan-400 bg-cyan-400/5' : 'bg-slate-900/50'
			}`}
			onClick={onClick}
		>
			<div className="w-full flex flex-col gap-2">
				{/* Header: Par y Estado */}
				<div className="flex flex-row items-center justify-between">
					<div className="flex items-center gap-2">
						<Typography variant="subtitle" className="font-medium text-white">
							{campaign.pool.token0}/{campaign.pool.token1}
						</Typography>
						<span className="px-1.5 py-0.5 bg-slate-700/50 rounded text-[10px] text-gray-400">
							{feePercent}%
						</span>
					</div>
					<Container
						variant="rounded"
						className={`w-fit px-2 py-0.5 ${status.class}`}
					>
						<Typography variant="label" className={status.class.split(' ')[1]}>
							{status.label}
						</Typography>
					</Container>
				</div>

				{/* Price y Network */}
				<div className="flex flex-row items-center justify-between text-[11px]">
					<Typography variant="label" className="text-gray-500">
						1 {campaign.pool.token0} = {campaign.pool.price.toFixed(4)}{' '}
						{campaign.pool.token1}
					</Typography>
					<Typography variant="label" className="text-gray-500">
						{campaign.network}
					</Typography>
				</div>

				{/* TVL y APY */}
				<div className="flex flex-row items-center justify-between text-[11px]">
					<Typography variant="label" className="text-gray-400">
						TVL: ${campaign.tvl.toLocaleString()}
					</Typography>
					<Typography variant="label" className="text-green-400 font-medium">
						~{estimatedAPY}% APY
					</Typography>
				</div>

				{/* Reward token */}
				<div className="flex flex-row items-center gap-1.5 text-[10px]">
					<span className="text-gray-500">Rewards in</span>
					<span className="px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400">
						{campaign.reward}
					</span>
				</div>

				{/* Progress bar */}
				<Progress value={campaign.totalUnits} max={campaign.goal} />

				{/* Progress info */}
				<div className="flex flex-row items-center justify-between text-[10px]">
					<Typography variant="label" className="text-gray-500">
						{campaign.totalUnits.toLocaleString()} /{' '}
						{campaign.goal.toLocaleString()} units
					</Typography>
					<Typography
						variant="label"
						className={
							campaign.goalReached ? 'text-green-400' : 'text-gray-400'
						}
					>
						{progress}%{campaign.goalReached && ' ✓'}
					</Typography>
				</div>

				{/* Days remaining */}
				{campaign.status === 'live' && (
					<Typography variant="label" className="text-gray-600 text-[10px]">
						{campaign.daysRemaining} days remaining
					</Typography>
				)}
			</div>
		</Container>
	)
}
