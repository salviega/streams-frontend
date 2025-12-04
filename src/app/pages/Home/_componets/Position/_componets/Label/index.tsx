import { JSX } from 'react'

import Container from '@/app/ui/Container'
import Typography from '@/app/ui/Typography'

export default function Label(): JSX.Element {
	// Mock data - En producción vendrá del contrato Streamer.getCampaign()
	const campaign = {
		id: 1,
		network: 'Sepolia',
		name: 'SUNM Fair Launch',
		pool: {
			token0: 'SUNM',
			token1: 'USDCM'
		},
		reward: {
			token: 'USDTM', // Reward token (puede ser diferente al pool)
			symbol: 'USDTMx' // SuperToken symbol
		},
		budget: 50000, // Budget en reward tokens
		goal: 500000, // TVL goal en USD
		duration: 30, // Días
		flowRate: '1929012345679', // wei/segundo (calculado: budget/duration)
		active: true,
		totalUnits: 320000, // Liquidez actual
		goalReached: false
	}

	const tvlProgress = Math.round((campaign.totalUnits / campaign.goal) * 100)
	const estimatedAPY = Math.round(
		(campaign.budget / campaign.totalUnits) * 365 * 100
	)

	return (
		<Container className="flex flex-row items-start justify-between gap-6">
			{/* Info de la campaña */}
			<div className="flex flex-col gap-2">
				{/* Chips */}
				<div className="flex flex-row items-center gap-2">
					<Container variant="rounded" className="w-fit px-3 py-1">
						<Typography variant="label">{campaign.network}</Typography>
					</Container>
					<Container
						variant="rounded"
						className="w-fit px-3 py-1 border-dashed"
					>
						<Typography variant="label" className="text-gray-400">
							ID #{campaign.id}
						</Typography>
					</Container>
					<Container
						variant="rounded"
						className="w-fit px-3 py-1 border-dashed"
					>
						<Typography variant="label" className="text-gray-400">
							Reward: {campaign.reward.token}
						</Typography>
					</Container>
					{campaign.active && (
						<Container
							variant="rounded"
							className="w-fit px-3 py-1 border-cyan-400/70 bg-cyan-400/10"
						>
							<Typography variant="label" className="text-cyan-300">
								Streaming
							</Typography>
						</Container>
					)}
				</div>

				{/* Título */}
				<Typography variant="title" className="text-xl">
					{campaign.name}
				</Typography>

				{/* Subtítulo con info del contrato */}
				<Typography variant="label" className="text-gray-400">
					Pool:{' '}
					<span className="text-white font-medium">
						{campaign.pool.token0} / {campaign.pool.token1}
					</span>{' '}
					• Duration: {campaign.duration} days • Budget:{' '}
					{campaign.budget.toLocaleString()} {campaign.reward.token}
				</Typography>

				{/* Flow rate info */}
				<Typography variant="label" className="text-gray-500 text-[10px]">
					Flow rate: ~{(Number(campaign.flowRate) / 1e18).toFixed(6)}{' '}
					{campaign.reward.symbol}
					/sec
				</Typography>
			</div>

			{/* KPIs */}
			<div className="flex flex-row items-end gap-3">
				<Container className="min-w-[110px] p-3">
					<Typography variant="label" className="text-gray-400">
						TVL (Units)
					</Typography>
					<Typography variant="subtitle" className="mt-1">
						{campaign.totalUnits.toLocaleString()}
					</Typography>
				</Container>

				<Container className="min-w-[110px] p-3">
					<Typography variant="label" className="text-gray-400">
						APY (est.)
					</Typography>
					<Typography variant="subtitle" className="mt-1 text-green-400">
						{estimatedAPY}%
					</Typography>
				</Container>

				<Container className="min-w-[110px] p-3">
					<Typography variant="label" className="text-gray-400">
						Goal progress
					</Typography>
					<Typography
						variant="subtitle"
						className={`mt-1 ${campaign.goalReached ? 'text-green-400' : ''}`}
					>
						{tvlProgress}%
					</Typography>
				</Container>
			</div>
		</Container>
	)
}
