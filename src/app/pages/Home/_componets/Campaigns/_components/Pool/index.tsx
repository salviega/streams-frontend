import { JSX } from 'react'
import { formatUnits } from 'viem'

import { CampaignWithMeta } from '@/app/hooks/useCampaigns'
import Container from '@/app/ui/Container'
import Progress from '@/app/ui/Progress'
import Typography from '@/app/ui/Typography'
import { formatAmount, formatFlowRatePerDay } from '@/app/utils/format'

type PoolProps = {
	campaign: CampaignWithMeta
	selected?: boolean
	onClick?: () => void
}

export default function Pool(props: PoolProps): JSX.Element {
	const { campaign, selected = false, onClick } = props

	// Budget in USD (this is the goal value)
	const budgetUsd = parseFloat(formatUnits(campaign.budget, campaign.rewardDecimals))

	// Calculate TVL (total value locked) in USD
	// Formula: tvlUsd = (totalUnits / goal) * budgetUsd
	const totalUnits = Number(campaign.totalUnits)
	const goal = Number(campaign.goal)
	const tvlUsd = goal > 0 ? (totalUnits / goal) * budgetUsd : 0
	
	const progress = goal > 0 ? Math.min(100, Math.round((totalUnits / goal) * 100)) : 0

	// Format fee tier
	const feePercent = (campaign.pool.fee / 10000).toFixed(2)

	// Flow rate per day
	const flowRatePerDay = formatFlowRatePerDay(campaign.flowRate)

	// Status based on active flag
	const status = campaign.active
		? { label: 'Live', class: 'border-cyan-400/70 text-cyan-300' }
		: { label: 'Inactive', class: 'border-gray-500/60 text-gray-400' }

	return (
		<Container
			variant="none"
			className={`hover:border-cyan-400/50 transition-all duration-200 cursor-pointer border rounded-2xl p-4 ${
				selected
					? 'border-cyan-400 bg-cyan-400/5'
					: 'border-transparent bg-slate-900/50'
			}`}
			onClick={onClick}
		>
			<div className="w-full flex flex-col gap-2">
				{/* Header: Par y Estado */}
				<div className="flex flex-row items-center justify-between">
					<div className="flex items-center gap-2">
						<Typography variant="subtitle" className="font-medium text-white">
							{campaign.token0Symbol}/{campaign.token1Symbol}
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

				{/* Campaign ID */}
				<div className="flex flex-row items-center justify-between text-[11px]">
					<Typography variant="label" className="text-gray-500">
						Campaign #{campaign.id.toString()}
					</Typography>
					<Typography variant="label" className="text-gray-500">
						Sepolia
					</Typography>
				</div>

				{/* Budget y Flow Rate */}
				<div className="flex flex-row items-center justify-between text-[11px]">
					<Typography variant="label" className="text-gray-400">
						Goal: ${formatAmount(budgetUsd)} {campaign.rewardSymbol}
					</Typography>
					<Typography variant="label" className="text-green-400 font-medium">
						~{flowRatePerDay}/day
					</Typography>
				</div>

				{/* Reward token */}
				<div className="flex flex-row items-center gap-1.5 text-[10px]">
					<span className="text-gray-500">Rewards in</span>
					<span className="px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400">
						{campaign.rewardSymbol}
					</span>
					{campaign.goalReached && (
						<span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-green-400">
							✓ Goal reached
						</span>
					)}
				</div>

				{/* Progress bar */}
				<Progress value={progress} max={100} />

				{/* Progress info - TVL in USD */}
				<div className="flex flex-row items-center justify-between text-[10px]">
					<Typography variant="label" className="text-gray-500">
						TVL: ${formatAmount(tvlUsd)} / ${formatAmount(budgetUsd)}
					</Typography>
					<Typography
						variant="label"
						className={campaign.goalReached ? 'text-green-400' : 'text-gray-400'}
					>
						{progress}%{campaign.goalReached && ' ✓'}
					</Typography>
				</div>

				{/* Duration */}
				<Typography variant="label" className="text-gray-600 text-[10px]">
					Duration: {Math.round(Number(campaign.duration) / 86400)} days
				</Typography>
			</div>
		</Container>
	)
}
