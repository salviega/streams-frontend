'use client'

import { JSX, useEffect, useState, useRef } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'

import Container from '@/app/ui/Container'
import Typography from '@/app/ui/Typography'

// Import lotties
import catAnimation from '@/../public/lotties/loader-cat.json'
import usdcAnimation from '@/../public/lotties/usdc-earnings.json'

type Props = {
	rewardSymbol?: string
	flowRatePerSecond?: number // tokens per second
	initialBalance?: number
	isStreaming?: boolean
}

export default function StreamingRewards(props: Props): JSX.Element {
	const {
		rewardSymbol = 'USDTM',
		flowRatePerSecond = 0.0000084, // ~$0.73/day
		initialBalance = 1234.567891,
		isStreaming = true
	} = props

	const [balance, setBalance] = useState(initialBalance)
	const catRef = useRef<LottieRefCurrentProps>(null)
	const usdcRef = useRef<LottieRefCurrentProps>(null)

	// Animate balance counter
	useEffect(() => {
		if (!isStreaming) return

		const interval = setInterval(() => {
			setBalance(prev => prev + flowRatePerSecond / 10) // Update 10x per second for smooth animation
		}, 100)

		return () => clearInterval(interval)
	}, [isStreaming, flowRatePerSecond])

	// Format balance with many decimals for streaming effect
	const formatBalance = (value: number): string => {
		const [integer, decimal] = value.toFixed(8).split('.')
		return `${parseInt(integer).toLocaleString()}.${decimal}`
	}

	// Calculate daily/monthly earnings
	const dailyEarnings = flowRatePerSecond * 86400
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
				{/* Cat animation - MUCH BIGGER */}
				<div className="relative z-20 w-72 h-72">
					<Lottie
						lottieRef={catRef}
						animationData={catAnimation}
						loop={true}
						autoplay={true}
						style={{ width: '100%', height: '100%' }}
					/>
				</div>

				{/* USDC coin - LEFT side of the cat */}
				<div className="absolute -left-48 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-90">
					<Lottie
						lottieRef={usdcRef}
						animationData={usdcAnimation}
						loop={true}
						autoplay={true}
						style={{ width: '100%', height: '100%' }}
					/>
				</div>

				{/* USDC coin - RIGHT side of the cat */}
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
							{formatBalance(balance)}
						</span>
						<span className="text-xl text-gray-400">{rewardSymbol}</span>
					</div>

					{/* Flow rate indicator */}
					<div className="flex items-center gap-1 text-xs">
						<span className="text-green-400">+</span>
						<span className="text-green-400 font-mono">
							{flowRatePerSecond.toFixed(8)}
						</span>
						<span className="text-gray-500">{rewardSymbol}/sec</span>
					</div>
				</div>

				{/* Stats row */}
				<div className="w-full grid grid-cols-3 gap-4 pt-4 border-t border-gray-700/50">
					<div className="flex flex-col items-center gap-1">
						<Typography variant="label" className="text-gray-500 text-[10px] uppercase">
							Per Hour
						</Typography>
						<Typography variant="subtitle" className="text-cyan-400 text-sm">
							+{(flowRatePerSecond * 3600).toFixed(4)}
						</Typography>
					</div>
					<div className="flex flex-col items-center gap-1">
						<Typography variant="label" className="text-gray-500 text-[10px] uppercase">
							Per Day
						</Typography>
						<Typography variant="subtitle" className="text-cyan-400 text-sm">
							+{dailyEarnings.toFixed(2)}
						</Typography>
					</div>
					<div className="flex flex-col items-center gap-1">
						<Typography variant="label" className="text-gray-500 text-[10px] uppercase">
							Per Month
						</Typography>
						<Typography variant="subtitle" className="text-cyan-400 text-sm">
							+{monthlyEarnings.toFixed(2)}
						</Typography>
					</div>
				</div>

				{/* Claim button */}
				<button className="w-full mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-green-500 text-white font-semibold hover:from-cyan-600 hover:to-green-600 transition-all duration-200 shadow-lg shadow-cyan-500/20">
					Claim {balance.toFixed(2)} {rewardSymbol}
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

