import { JSX } from 'react'
import { formatUnits } from 'viem'

import { CampaignWithMeta } from '@/app/hooks/useCampaigns'
import Container from '@/app/ui/Container'
import Typography from '@/app/ui/Typography'
import { formatAmount, formatSmallNumber, fromWei } from '@/app/utils/format'

type Props = {
	campaign: CampaignWithMeta
}

export default function Label(props: Props): JSX.Element {
	const { campaign } = props

	const feePercent = (campaign.pool.fee / 10000).toFixed(2)
	const budgetUsd = parseFloat(formatUnits(campaign.budget, campaign.rewardDecimals))
	const durationDays = Math.round(Number(campaign.duration) / 86400)

	// Flow rate per second (Superfluid uses 18 decimals)
	const flowRatePerSecond = fromWei(campaign.flowRate, 18)

	// Calculate TVL in USD: tvlUsd = (totalUnits / goal) * budgetUsd
	const totalUnits = Number(campaign.totalUnits)
	const goal = Number(campaign.goal)
	const tvlUsd = goal > 0 ? (totalUnits / goal) * budgetUsd : 0
	const progress = goal > 0 ? Math.min(100, Math.round((totalUnits / goal) * 100)) : 0

	return (
		<Container className="flex flex-row items-start justify-between gap-6">
			{/* Info de la campaña */}
			<div className="flex flex-col gap-2">
				{/* Chips */}
				<div className="flex flex-row items-center gap-2">
					<Container variant="rounded" className="w-fit px-3 py-1">
						<Typography variant="label">Sepolia</Typography>
					</Container>
					<Container
						variant="rounded"
						className="w-fit px-3 py-1 border-dashed"
					>
						<Typography variant="label" className="text-gray-400">
							ID #{campaign.id.toString()}
						</Typography>
					</Container>
					<Container
						variant="rounded"
						className="w-fit px-3 py-1 border-dashed"
					>
						<Typography variant="label" className="text-gray-400">
							Reward: {campaign.rewardSymbol}
						</Typography>
					</Container>
					{campaign.active && (
						<Container
							variant="rounded"
							className="w-fit px-3 py-1 border-green-500/50 bg-green-500/10"
						>
							<Typography variant="label" className="text-green-400">
								● Live
							</Typography>
						</Container>
					)}
				</div>

				{/* Título */}
				<Typography variant="title" className="text-xl">
					{campaign.token0Symbol}/{campaign.token1Symbol} Campaign
				</Typography>

				{/* Subtítulo */}
				<Typography variant="label" className="text-gray-400">
					Pool:{' '}
					<span className="text-white font-medium">
						{campaign.token0Symbol} / {campaign.token1Symbol} ({feePercent}%)
					</span>{' '}
					• Duration: {durationDays} days • Budget: ${formatAmount(budgetUsd)}
				</Typography>

				{/* Flow rate info */}
				<Typography variant="label" className="text-gray-500 text-[10px]">
					Flow rate: ~{formatSmallNumber(flowRatePerSecond)} {campaign.rewardSymbol}/sec
				</Typography>

				{/* Addresses */}
				<div className="flex flex-row gap-4 text-[10px] text-gray-600">
					<span>Token0: {campaign.pool.currency0.slice(0, 10)}...</span>
					<span>Token1: {campaign.pool.currency1.slice(0, 10)}...</span>
					<span>Reward: {campaign.reward.slice(0, 10)}...</span>
				</div>
			</div>

			{/* KPIs - Values in USD */}
			<div className="flex flex-row items-end gap-3">
				<Container className="min-w-[110px] p-3">
					<Typography variant="label" className="text-gray-400">
						TVL
					</Typography>
					<Typography variant="subtitle" className="mt-1">
						${formatAmount(tvlUsd)}
					</Typography>
				</Container>

				<Container className="min-w-[110px] p-3">
					<Typography variant="label" className="text-gray-400">
						Goal
					</Typography>
					<Typography variant="subtitle" className="mt-1">
						${formatAmount(budgetUsd)}
					</Typography>
				</Container>

				<Container className="min-w-[110px] p-3">
					<Typography variant="label" className="text-gray-400">
						Progress
					</Typography>
					<Typography variant="subtitle" className="mt-1">
						{progress}%
					</Typography>
				</Container>
			</div>
		</Container>
	)
}
