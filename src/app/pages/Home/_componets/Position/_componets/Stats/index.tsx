'use client'

import { JSX } from 'react'
import { formatUnits } from 'viem'

import { CampaignWithMeta, useLpPosition } from '@/app/hooks/useCampaigns'
import { usePositionAmounts } from '@/app/hooks/usePositionAmounts'
import Container from '@/app/ui/Container'
import TokenAvatar, { TokenPair } from '@/app/ui/TokenAvatar'
import Typography from '@/app/ui/Typography'
import { formatCompact, formatAmount, formatPercent, fromWei } from '@/app/utils/format'

type Props = {
	campaign: CampaignWithMeta
}

export default function Stats(props: Props): JSX.Element {
	const { campaign } = props
	const { position, loading } = useLpPosition(Number(campaign.id))
	
	// Get user's LP units for the position amounts calculation
	const userLpUnits = position?.lpUnits ?? 0n
	
	// Get real token amounts from Streamer balances
	const { amounts, loading: amountsLoading } = usePositionAmounts(
		campaign.pool.currency0 as `0x${string}`,
		campaign.pool.currency1 as `0x${string}`,
		campaign.token0Decimals,
		campaign.token1Decimals,
		userLpUnits,
		campaign.totalUnits
	)

	const feePercent = (campaign.pool.fee / 10000).toFixed(2)
	
	// Liquidity units are integers (not divided by 10^18)
	const totalUnits = Number(campaign.totalUnits)

	// LP position data - lpUnits are also liquidity integers
	const lpUnits = position ? Number(position.lpUnits) : 0
	
	// Share is in basis points (1 bps = 0.01%)
	const shareBps = position ? Number(position.shareBps) : 0
	const sharePercent = shareBps / 100
	
	// Pending reward - SuperToken always uses 18 decimals
	const pendingReward = position
		? parseFloat(formatUnits(position.pendingReward, 18))
		: 0

	const hasPosition = lpUnits > 0

	// Calculate estimated daily reward (Superfluid uses 18 decimals for flow rate)
	const flowRatePerSecond = fromWei(campaign.flowRate, 18)
	const estimatedDailyReward = flowRatePerSecond * 86400 * (shareBps / 10000)

	// Check if user is the only LP
	const isOnlyLP = sharePercent === 100

	// Real token amounts from Streamer balances
	const token0Amount = amounts?.amount0 ?? 0
	const token1Amount = amounts?.amount1 ?? 0

	if (loading || amountsLoading) {
		return (
			<Container className="flex flex-col gap-4 items-center justify-center min-h-[200px]">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
				<Typography variant="label" className="text-gray-400">
					Loading position...
				</Typography>
			</Container>
		)
	}

	return (
		<Container className="flex flex-col gap-4">
			{/* Header */}
			<div className="flex flex-row items-center justify-between">
				<Typography variant="title">Your position</Typography>
				{hasPosition && (
					<Container
						variant="rounded"
						className="w-fit px-3 py-1 border-green-500/40 bg-green-600/10"
					>
						<Typography variant="label" className="text-green-400">
							{campaign.active ? 'Receiving rewards' : 'Position detected'}
						</Typography>
					</Container>
				)}
			</div>

			{/* Pool Info Bar with Token Avatars */}
			<div className="flex flex-row items-center justify-between rounded-lg bg-slate-800/50 p-3">
				<div className="flex items-center gap-3">
					{/* Token Pair Avatars */}
					<TokenPair 
						symbol0={campaign.token0Symbol} 
						symbol1={campaign.token1Symbol}
						size="md"
					/>
					
					<div className="flex flex-col">
						<Typography variant="subtitle" className="text-white">
							{campaign.token0Symbol}/{campaign.token1Symbol}
						</Typography>
						<Typography variant="label" className="text-gray-500 text-xs">
							Position Token ID: #{campaign.positionTokenId.toString()}
						</Typography>
					</div>
				</div>
				<span className="px-2 py-1 bg-slate-700/50 rounded text-[11px] text-gray-400">
					{feePercent}% Fee
				</span>
			</div>

			{hasPosition ? (
				<>
					{/* Deposited Tokens Section */}
					<div className="grid grid-cols-2 gap-3">
						{/* Token 0 */}
						<div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
							<TokenAvatar symbol={campaign.token0Symbol} size="lg" />
							<div className="flex flex-col">
								<Typography variant="label" className="text-gray-400 text-[10px] uppercase">
									{campaign.token0Symbol}
								</Typography>
								<Typography variant="subtitle" className="text-white">
									{formatAmount(token0Amount, 2)}
								</Typography>
								<Typography variant="label" className="text-green-400/70 text-[10px]">
									≈ ${formatAmount(token0Amount, 2)}
								</Typography>
							</div>
						</div>

						{/* Token 1 */}
						<div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
							<TokenAvatar symbol={campaign.token1Symbol} size="lg" />
							<div className="flex flex-col">
								<Typography variant="label" className="text-gray-400 text-[10px] uppercase">
									{campaign.token1Symbol}
								</Typography>
								<Typography variant="subtitle" className="text-white">
									{formatAmount(token1Amount, 2)}
								</Typography>
								<Typography variant="label" className="text-green-400/70 text-[10px]">
									≈ ${formatAmount(token1Amount, 2)}
								</Typography>
							</div>
						</div>
					</div>

					{/* Stats Grid */}
					<div className="grid grid-cols-3 gap-4">
						<div className="flex flex-col gap-1">
							<Typography
								variant="label"
								className="text-gray-400 uppercase tracking-wider text-[11px]"
							>
								Your LP
							</Typography>
							<Typography variant="subtitle">
								{formatCompact(lpUnits)}
							</Typography>
							<Typography variant="label" className="text-gray-500 text-[10px]">
								of {formatCompact(totalUnits)} total
							</Typography>
						</div>

						<div className="flex flex-col gap-1">
							<Typography
								variant="label"
								className="text-gray-400 uppercase tracking-wider text-[11px]"
							>
								Pool share
							</Typography>
							<Typography variant="subtitle" className="text-cyan-400">
								{formatPercent(sharePercent)}
							</Typography>
							{isOnlyLP ? (
								<Typography variant="label" className="text-yellow-400/80 text-[10px]">
									🏆 Only LP
								</Typography>
							) : (
								<Typography variant="label" className="text-gray-500 text-[10px]">
									of reward distribution
								</Typography>
							)}
						</div>

						<div className="flex flex-col gap-1">
							<Typography
								variant="label"
								className="text-gray-400 uppercase tracking-wider text-[11px]"
							>
								Pending rewards
							</Typography>
							<div className="flex items-center gap-1">
								<TokenAvatar symbol={campaign.rewardSymbol} size="sm" />
								<Typography variant="subtitle" className="text-green-400">
									{formatAmount(pendingReward, 4)}
								</Typography>
							</div>
							<Typography variant="label" className="text-gray-500 text-[10px]">
								~{formatAmount(estimatedDailyReward, 2)}/day
							</Typography>
						</div>
					</div>

					{/* Pool Share Explanation */}
					{isOnlyLP && (
						<div className="flex flex-row items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
							<span className="text-yellow-400">💡</span>
							<Typography variant="label" className="text-yellow-400/80 text-xs">
								You&apos;re the only LP in this campaign. You receive 100% of rewards.
								If others add liquidity, your share will decrease proportionally.
							</Typography>
						</div>
					)}

					{/* SuperToken Info */}
					<div className="flex flex-row items-center gap-2 pt-1">
						<div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
						<Typography variant="label" className="text-gray-400 text-xs">
							Rewards streamed via Superfluid GDA • SuperToken:{' '}
							<span className="text-cyan-400">
								{campaign.superToken.slice(0, 10)}...
							</span>
						</Typography>
					</div>

					{/* Footer */}
					<div className="flex flex-row items-center justify-between gap-4 pt-2 border-t border-gray-700">
						<Typography variant="label" className="text-gray-500 text-xs">
							Your share updates when you modify liquidity. Rewards claimable anytime.
						</Typography>
						<button className="px-4 py-2 rounded-xl border border-gray-600 bg-slate-900/80 text-sm hover:bg-slate-800 transition-colors whitespace-nowrap">
							+ Add liquidity
						</button>
					</div>
				</>
			) : (
				<div className="flex flex-col gap-4">
					<Typography variant="label" className="text-gray-400">
						No position found. Add liquidity to this pool to start earning streaming rewards.
					</Typography>
					<div className="flex flex-col gap-2 p-3 bg-slate-800/50 rounded-lg">
						<Typography variant="label" className="text-gray-300">
							How it works:
						</Typography>
						<Typography variant="label" className="text-gray-400 text-xs">
							1. Add liquidity to the Uniswap v4 pool
							<br />
							2. Receive LP units proportional to your liquidity
							<br />
							3. Start receiving streaming rewards via Superfluid
							<br />
							4. Claim rewards anytime or let them accumulate
						</Typography>
					</div>
					<button className="w-fit px-4 py-2 rounded-xl border border-cyan-500 bg-cyan-500/10 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-colors">
						+ Add liquidity to earn
					</button>
				</div>
			)}
		</Container>
	)
}
