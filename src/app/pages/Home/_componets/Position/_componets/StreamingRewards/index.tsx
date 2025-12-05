'use client'

import { JSX, useEffect, useState, useRef } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import { formatUnits } from 'viem'

import { CampaignWithMeta, useLpPosition } from '@/app/hooks/useCampaigns'
import Container from '@/app/ui/Container'
import Typography from '@/app/ui/Typography'
import { formatAmount, formatSmallNumber, fromWei } from '@/app/utils/format'

// Import lotties
import catAnimation from '@/../public/lotties/loader-cat.json'
import usdcAnimation from '@/../public/lotties/usdc-earnings.json'

type Props = {
	campaign: CampaignWithMeta
}

export default function StreamingRewards(props: Props): JSX.Element {
	const { campaign } = props
	const { position } = useLpPosition(Number(campaign.id))

	// Flow rate per second (Superfluid uses 18 decimals always)
	const flowRatePerSecond = fromWei(campaign.flowRate, 18)

	// User's share (basis points to decimal)
	const shareBps = position ? Number(position.shareBps) : 0
	const userFlowRatePerSecond = flowRatePerSecond * (shareBps / 10000)

	// Initial balance from pending rewards - SuperToken always uses 18 decimals
	const initialPendingReward = position
		? parseFloat(formatUnits(position.pendingReward, 18))
		: 0

	const [balance, setBalance] = useState(initialPendingReward)
	const catRef = useRef<LottieRefCurrentProps>(null)
	const usdcRef = useRef<LottieRefCurrentProps>(null)

	const isStreaming = campaign.active && shareBps > 0

	// Update balance when position changes
	useEffect(() => {
		if (position) {
			// SuperToken always uses 18 decimals
			const pending = parseFloat(formatUnits(position.pendingReward, 18))
			setBalance(pending)
		}
	}, [position])

	// Animate balance counter
	useEffect(() => {
		if (!isStreaming || userFlowRatePerSecond <= 0) return

		const interval = setInterval(() => {
			setBalance(prev => prev + userFlowRatePerSecond / 10)
		}, 100)

		return () => clearInterval(interval)
	}, [isStreaming, userFlowRatePerSecond])

	// Calculate earnings
	const hourlyEarnings = userFlowRatePerSecond * 3600
	const dailyEarnings = userFlowRatePerSecond * 86400
	const monthlyEarnings = dailyEarnings * 30

	return (
		<Container className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
			{/* Background glow effect */}
			<div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-green-500/5" />
			
			{/* Header */}
			<div className="relative z-10 flex items-center justify-between mb-4">
				<Typography variant="title" className="text-white">
					Streaming Rewards 💸
				</Typography>
				{isStreaming && (
					<div className="flex items-center gap-2">
						<div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
						<Typography variant="label" className="text-green-400 text-xs">
							Live
						</Typography>
					</div>
				)}
			</div>

			{/* Main content */}
			<div className="relative z-10 flex flex-col items-center gap-6 py-8">
				{/* Lottie animations container */}
				<div className="relative flex items-center justify-center h-56">
					{/* Cat animation */}
					<div className="relative z-20 w-72 h-72">
						<Lottie
							lottieRef={catRef}
							animationData={catAnimation}
							loop={true}
							autoplay={true}
							style={{ width: '100%', height: '100%' }}
						/>
					</div>

					{/* USDC coin - LEFT side */}
					<div className="absolute -left-48 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-90">
						<Lottie
							lottieRef={usdcRef}
							animationData={usdcAnimation}
							loop={true}
							autoplay={true}
							style={{ width: '100%', height: '100%' }}
						/>
					</div>

					{/* USDC coin - RIGHT side */}
					<div className="absolute -right-48 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-90">
						<Lottie
							animationData={usdcAnimation}
							loop={true}
							autoplay={true}
							style={{ width: '100%', height: '100%' }}
						/>
					</div>
				</div>

				{/* Balance counter */}
				<div className="flex flex-col items-center gap-2">
					<Typography variant="label" className="text-gray-400 uppercase tracking-wider text-xs">
						Claimable Rewards
					</Typography>
					
					<div className="flex items-baseline gap-2">
						<span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400 font-mono tabular-nums">
							{formatAmount(balance, 4)}
						</span>
						<span className="text-xl text-gray-400">{campaign.rewardSymbol}</span>
					</div>

					{/* Flow rate indicator */}
					{isStreaming && (
						<div className="flex items-center gap-1 text-xs">
							<span className="text-green-400">+</span>
							<span className="text-green-400 font-mono">
								{formatSmallNumber(userFlowRatePerSecond)}
							</span>
							<span className="text-gray-500">{campaign.rewardSymbol}/sec</span>
						</div>
					)}

					{!isStreaming && shareBps === 0 && (
						<Typography variant="label" className="text-gray-500 text-xs">
							Add liquidity to start earning
						</Typography>
					)}
				</div>

				{/* Stats row */}
				{isStreaming && (
					<div className="w-full grid grid-cols-3 gap-4 pt-4 border-t border-gray-700/50">
						<div className="flex flex-col items-center gap-1">
							<Typography variant="label" className="text-gray-500 text-[10px] uppercase">
								Per Hour
							</Typography>
							<Typography variant="subtitle" className="text-cyan-400 text-sm">
								+{formatAmount(hourlyEarnings, 4)}
							</Typography>
						</div>
						<div className="flex flex-col items-center gap-1">
							<Typography variant="label" className="text-gray-500 text-[10px] uppercase">
								Per Day
							</Typography>
							<Typography variant="subtitle" className="text-cyan-400 text-sm">
								+{formatAmount(dailyEarnings, 2)}
							</Typography>
						</div>
						<div className="flex flex-col items-center gap-1">
							<Typography variant="label" className="text-gray-500 text-[10px] uppercase">
								Per Month
							</Typography>
							<Typography variant="subtitle" className="text-cyan-400 text-sm">
								+{formatAmount(monthlyEarnings, 2)}
							</Typography>
						</div>
					</div>
				)}

				{/* Claim button */}
				<button
					className="w-full mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-green-500 text-white font-semibold hover:from-cyan-600 hover:to-green-600 transition-all duration-200 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={balance <= 0}
				>
					Claim {formatAmount(balance, 2)} {campaign.rewardSymbol}
				</button>

				{/* Superfluid badge */}
				<div className="flex items-center gap-2 text-xs text-gray-500">
					<span>Powered by</span>
					<span className="text-green-400 font-medium">Superfluid</span>
					<span>GDA</span>
				</div>
			</div>
		</Container>
	)
}
