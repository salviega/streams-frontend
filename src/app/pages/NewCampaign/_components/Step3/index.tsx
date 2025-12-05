'use client'

import { JSX, useState } from 'react'

import Typography from '@/app/ui/Typography'
import Button from '@/app/ui/Button'
import Container from '@/app/ui/Container'
import { TokenInfo, FeeTier } from '@/app/types/token'

import TokenSelector from '../TokenSelector'
import TokenSelectModal from '../TokenSelectModal'
import DepositInput from '../DepositInput'

type Props = {
	// Step 1 Summary
	token0: TokenInfo
	token1: TokenInfo
	feeTier: FeeTier
	// Step 2 Summary
	initialPrice: string
	amount0: string
	amount1: string
	// Step 3 Data
	rewardToken: TokenInfo | null
	rewardAmount: string
	duration: number
	onRewardTokenChange: (token: TokenInfo) => void
	onRewardAmountChange: (value: string) => void
	onDurationChange: (days: number) => void
	onBack: () => void
	onCreateCampaign: () => void
	isCreating?: boolean
}

// Generate a consistent color from symbol
function getColorFromSymbol(symbol: string): string {
	const colors = [
		'from-cyan-500 to-blue-600',
		'from-purple-500 to-pink-600',
		'from-green-500 to-teal-600',
		'from-orange-500 to-red-600',
		'from-indigo-500 to-purple-600',
		'from-yellow-500 to-orange-600'
	]
	if (!symbol) return colors[0]
	const index = symbol.charCodeAt(0) % colors.length
	return colors[index]
}

function getInitials(symbol: string): string {
	if (!symbol) return '??'
	return symbol.slice(0, 2).toUpperCase()
}

const DURATION_OPTIONS = [7, 14, 30, 60, 90]

export default function Step3(props: Props): JSX.Element {
	const {
		token0,
		token1,
		feeTier,
		initialPrice,
		amount0,
		amount1,
		rewardToken,
		rewardAmount,
		duration,
		onRewardTokenChange,
		onRewardAmountChange,
		onDurationChange,
		onBack,
		onCreateCampaign,
		isCreating = false
	} = props

	const [modalOpen, setModalOpen] = useState(false)

	// Check if reward amount exceeds balance - remove commas from formatted balance
	const rewardExceedsBalance =
		rewardToken?.balanceRaw && rewardAmount
			? parseFloat(rewardAmount) >
				parseFloat((rewardToken.balance || '0').replace(/,/g, ''))
			: false

	const canCreate =
		rewardToken &&
		rewardAmount &&
		duration > 0 &&
		parseFloat(rewardAmount) > 0 &&
		!rewardExceedsBalance

	// Calculate estimated flow rate
	const flowRatePerSecond =
		rewardAmount && duration
			? (parseFloat(rewardAmount) / (duration * 24 * 60 * 60)).toFixed(6)
			: '0'

	return (
		<Container variant="default" className="flex flex-col gap-6">
			{/* Step 1 & 2 Summary */}
			<div className="flex flex-col gap-4 pb-4 border-b border-gray-700">
				{/* Pool Summary */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="flex -space-x-2">
							<div
								className={`h-8 w-8 rounded-full bg-gradient-to-br ${getColorFromSymbol(
									token0.symbol
								)} flex items-center justify-center text-white font-bold text-xs border-2 border-slate-900 z-10`}
							>
								{getInitials(token0.symbol)}
							</div>
							<div
								className={`h-8 w-8 rounded-full bg-gradient-to-br ${getColorFromSymbol(
									token1.symbol
								)} flex items-center justify-center text-white font-bold text-xs border-2 border-slate-900`}
							>
								{getInitials(token1.symbol)}
							</div>
						</div>

						<div className="flex flex-col">
							<div className="flex items-center gap-2">
								<Typography variant="subtitle" className="text-white">
									{token0.symbol} / {token1.symbol}
								</Typography>
								<span className="px-2 py-0.5 rounded bg-slate-700 text-gray-400 text-xs">
									{feeTier.label}
								</span>
							</div>
							<Typography variant="label" className="text-gray-500 text-xs">
								Initial price: 1 {token0.symbol} = {initialPrice} {token1.symbol}
							</Typography>
						</div>
					</div>

					<Button variant="ghost" size="sm" onClick={onBack}>
						✏️ Edit
					</Button>
				</div>

				{/* Liquidity Summary */}
				<div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-800/30">
					<div className="flex flex-col gap-1">
						<Typography variant="label" className="text-gray-500 text-xs">
							{token0.symbol} Deposit
						</Typography>
						<Typography variant="subtitle" className="text-white">
							{amount0} {token0.symbol}
						</Typography>
					</div>
					<div className="flex flex-col gap-1">
						<Typography variant="label" className="text-gray-500 text-xs">
							{token1.symbol} Deposit
						</Typography>
						<Typography variant="subtitle" className="text-white">
							{amount1} {token1.symbol}
						</Typography>
					</div>
				</div>
			</div>

			{/* Select Reward Token */}
			<div className="flex flex-col gap-3">
				<Typography variant="subtitle" className="text-white">
					Select reward token
				</Typography>
				<Typography variant="label" className="text-gray-400 text-xs">
					Choose the token that will be streamed as rewards to liquidity
					providers.
				</Typography>

				<TokenSelector
					token={rewardToken}
					onClick={() => setModalOpen(true)}
					placeholder="Choose reward token"
					className="w-full"
				/>
			</div>

			{/* Campaign Duration */}
			<div className="flex flex-col gap-3">
				<Typography variant="subtitle" className="text-white">
					Campaign duration
				</Typography>
				<Typography variant="label" className="text-gray-400 text-xs">
					How long will this campaign run? Rewards will be streamed continuously
					via Superfluid GDA.
				</Typography>

				<div className="flex flex-wrap gap-2">
					{DURATION_OPTIONS.map(days => (
						<button
							key={days}
							onClick={() => onDurationChange(days)}
							className={`px-4 py-2 rounded-xl border text-sm transition-all duration-200 ${
								duration === days
									? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
									: 'border-gray-700 bg-slate-800/50 text-gray-400 hover:border-gray-600'
							}`}
						>
							{days} days
						</button>
					))}
				</div>
			</div>

			{/* Deposit Reward Tokens */}
			{rewardToken && (
				<div className="flex flex-col gap-3">
					<Typography variant="subtitle" className="text-white">
						Deposit reward tokens
					</Typography>
					<Typography variant="label" className="text-gray-400 text-xs">
						This amount will be distributed to LPs over the campaign duration.
						Hover to select a percentage.
					</Typography>

					<DepositInput
						token={rewardToken}
						value={rewardAmount}
						onChange={onRewardAmountChange}
					/>

					{/* Flow Rate Preview */}
					{rewardAmount && parseFloat(rewardAmount) > 0 && (
						<div className="flex items-center gap-2 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
							<div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
							<Typography variant="label" className="text-gray-400 text-xs">
								Estimated flow rate:{' '}
								<span className="text-cyan-400 font-medium">
									~{flowRatePerSecond} {rewardToken.symbol}/sec
								</span>
							</Typography>
						</div>
					)}
				</div>
			)}

			{/* Campaign Summary */}
			{canCreate && rewardToken && (
				<div className="flex flex-col gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/5">
					<Typography variant="subtitle" className="text-green-400 text-sm">
						📊 Campaign Summary
					</Typography>
					<div className="grid grid-cols-2 gap-3 text-xs">
						<div className="flex flex-col gap-0.5">
							<span className="text-gray-500">Pool</span>
							<span className="text-white">
								{token0.symbol}/{token1.symbol} ({feeTier.label})
							</span>
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="text-gray-500">Duration</span>
							<span className="text-white">{duration} days</span>
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="text-gray-500">Total Rewards</span>
							<span className="text-white">
								{rewardAmount} {rewardToken.symbol}
							</span>
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="text-gray-500">Distribution</span>
							<span className="text-white">Superfluid GDA</span>
						</div>
					</div>
				</div>
			)}

			{/* Create Campaign Button */}
			<Button
				variant={canCreate ? 'success' : 'secondary'}
				size="lg"
				disabled={!canCreate || isCreating}
				onClick={onCreateCampaign}
				className="w-full"
			>
				{isCreating ? (
					<span className="flex items-center justify-center gap-2">
						<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
						Creating Campaign...
					</span>
				) : rewardExceedsBalance ? (
					'Insufficient balance'
				) : canCreate ? (
					'🚀 Create Campaign'
				) : (
					'Complete all fields'
				)}
			</Button>

			{/* Token Select Modal */}
			<TokenSelectModal
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				onSelect={onRewardTokenChange}
				selectedTokens={[token0, token1]}
			/>
		</Container>
	)
}
