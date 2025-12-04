import { JSX } from 'react'

import Container from '@/app/ui/Container'
import Typography from '@/app/ui/Typography'

export default function Stats(): JSX.Element {
	// Mock data - En producción vendrá del contrato y Uniswap:
	// Contrato Streamer:
	// - Streamer.getLpUnits(campaignId, lpAddress)
	// - Streamer.getLpShareBps(campaignId, lpAddress)
	// - Streamer.getLpPendingReward(campaignId, lpAddress)
	// - GDA Pool: pool.getUnits(lpAddress)
	// Uniswap v4:
	// - PoolManager.getSlot0(poolId) -> sqrtPriceX96, tick
	// - Position data from PositionManager

	const poolInfo = {
		token0: { symbol: 'SUNM', decimals: 18 },
		token1: { symbol: 'USDCM', decimals: 6 },
		feeTier: 3000, // 0.3%
		currentPrice: 0.0245, // token0 price in token1 terms
		tickSpacing: 60,
		liquidity: '1234567890' // Total pool liquidity
	}

	const lpPosition = {
		hasPosition: true,
		lpUnits: 52000, // Liquidez del LP (unidades Uniswap v4)
		totalUnits: 320000, // Total del campaign
		shareBps: 1625, // 16.25% = 52000/320000 * 10000
		pendingReward: 1234.56, // Rewards acumulados
		rewardToken: 'USDTM',
		superToken: 'USDTMx',
		// Info Uniswap v4
		token0Amount: 15000, // Cantidad de token0 en la posición
		token1Amount: 367.5, // Cantidad de token1 en la posición
		positionValue: 735, // Valor total en USD
		// Info adicional útil
		estimatedDailyReward: 55.55, // budget/30 * shareBps/10000
		connectedToPool: true // Si el LP está conectado al GDA pool
	}

	const sharePercent = (lpPosition.shareBps / 100).toFixed(2)
	const feePercent = (poolInfo.feeTier / 10000).toFixed(2)

	return (
		<Container className="flex flex-col gap-4">
			{/* Header */}
			<div className="flex flex-row items-center justify-between">
				<Typography variant="title">Your position</Typography>
				{lpPosition.hasPosition && (
					<Container
						variant="rounded"
						className="w-fit px-3 py-1 border-green-500/40 bg-green-600/10"
					>
						<Typography variant="label" className="text-green-400">
							{lpPosition.connectedToPool
								? 'Receiving rewards'
								: 'Position detected'}
						</Typography>
					</Container>
				)}
			</div>

			{lpPosition.hasPosition ? (
				<>
					{/* Pool Info Bar */}
					<div className="flex flex-row items-center gap-4 p-3 bg-slate-800/40 rounded-lg">
						<div className="flex flex-col gap-0.5">
							<Typography
								variant="label"
								className="text-gray-500 text-[10px] uppercase"
							>
								Pool
							</Typography>
							<Typography variant="subtitle" className="text-white">
								{poolInfo.token0.symbol}/{poolInfo.token1.symbol}
							</Typography>
						</div>
						<div className="h-8 w-px bg-gray-700" />
						<div className="flex flex-col gap-0.5">
							<Typography
								variant="label"
								className="text-gray-500 text-[10px] uppercase"
							>
								Price
							</Typography>
							<Typography variant="subtitle">
								1 {poolInfo.token0.symbol} = {poolInfo.currentPrice.toFixed(4)}{' '}
								{poolInfo.token1.symbol}
							</Typography>
						</div>
						<div className="h-8 w-px bg-gray-700" />
						<div className="flex flex-col gap-0.5">
							<Typography
								variant="label"
								className="text-gray-500 text-[10px] uppercase"
							>
								Fee
							</Typography>
							<Typography variant="subtitle">{feePercent}%</Typography>
						</div>
					</div>

					{/* Position Value & Tokens */}
					<div className="grid grid-cols-2 gap-4">
						<div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-lg">
							<Typography
								variant="label"
								className="text-gray-400 uppercase tracking-wider text-[11px]"
							>
								Position Value
							</Typography>
							<Typography variant="title" className="text-white">
								${lpPosition.positionValue.toLocaleString()}
							</Typography>
							<div className="flex flex-col gap-1 text-xs">
								<div className="flex justify-between text-gray-400">
									<span>{poolInfo.token0.symbol}</span>
									<span className="text-white">
										{lpPosition.token0Amount.toLocaleString()}
									</span>
								</div>
								<div className="flex justify-between text-gray-400">
									<span>{poolInfo.token1.symbol}</span>
									<span className="text-white">
										{lpPosition.token1Amount.toLocaleString()}
									</span>
								</div>
							</div>
						</div>

						<div className="flex flex-col gap-2 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
							<Typography
								variant="label"
								className="text-cyan-400 uppercase tracking-wider text-[11px]"
							>
								Your Share
							</Typography>
							<Typography variant="title" className="text-cyan-400">
								{sharePercent}%
							</Typography>
							<div className="flex flex-col gap-1 text-xs">
								<div className="flex justify-between text-gray-400">
									<span>Your units</span>
									<span className="text-white">
										{lpPosition.lpUnits.toLocaleString()}
									</span>
								</div>
								<div className="flex justify-between text-gray-400">
									<span>Total units</span>
									<span className="text-gray-300">
										{lpPosition.totalUnits.toLocaleString()}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Rewards Section */}
					<div className="flex flex-row items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
						<div className="flex flex-col gap-1">
							<Typography
								variant="label"
								className="text-green-400 uppercase tracking-wider text-[11px]"
							>
								Claimable rewards
							</Typography>
							<div className="flex items-baseline gap-2">
								<Typography variant="title" className="text-green-400">
									{lpPosition.pendingReward.toFixed(2)} {lpPosition.rewardToken}
								</Typography>
								<Typography variant="label" className="text-gray-500">
									~${(lpPosition.pendingReward * 1).toFixed(2)}
								</Typography>
							</div>
							<Typography variant="label" className="text-gray-500 text-[10px]">
								~{lpPosition.estimatedDailyReward.toFixed(2)}{' '}
								{lpPosition.rewardToken}/day
							</Typography>
						</div>
						<button className="px-4 py-2 rounded-xl border border-green-500/40 bg-green-500/10 text-green-400 text-sm hover:bg-green-500/20 transition-colors">
							Claim
						</button>
					</div>

					{/* SuperToken Info */}
					<div className="flex flex-row items-center gap-2 pt-1">
						<div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
						<Typography variant="label" className="text-gray-400 text-xs">
							Rewards streamed as{' '}
							<span className="text-cyan-400">{lpPosition.superToken}</span> via
							Superfluid GDA
						</Typography>
					</div>

					{/* Footer */}
					<div className="flex flex-row items-center justify-between gap-4 pt-2 border-t border-gray-700">
						<Typography variant="label" className="text-gray-500 text-xs">
							Your share updates automatically when you modify liquidity.
						</Typography>
						<button className="px-4 py-2 rounded-xl border border-gray-600 bg-slate-900/80 text-sm hover:bg-slate-800 transition-colors whitespace-nowrap">
							+ Add liquidity
						</button>
					</div>
				</>
			) : (
				<div className="flex flex-col gap-4">
					{/* Pool Info cuando no hay posición */}
					<div className="flex flex-row items-center gap-4 p-3 bg-slate-800/40 rounded-lg">
						<div className="flex flex-col gap-0.5">
							<Typography
								variant="label"
								className="text-gray-500 text-[10px] uppercase"
							>
								Pool
							</Typography>
							<Typography variant="subtitle" className="text-white">
								{poolInfo.token0.symbol}/{poolInfo.token1.symbol}
							</Typography>
						</div>
						<div className="h-8 w-px bg-gray-700" />
						<div className="flex flex-col gap-0.5">
							<Typography
								variant="label"
								className="text-gray-500 text-[10px] uppercase"
							>
								Current Price
							</Typography>
							<Typography variant="subtitle">
								1 {poolInfo.token0.symbol} = {poolInfo.currentPrice.toFixed(4)}{' '}
								{poolInfo.token1.symbol}
							</Typography>
						</div>
						<div className="h-8 w-px bg-gray-700" />
						<div className="flex flex-col gap-0.5">
							<Typography
								variant="label"
								className="text-gray-500 text-[10px] uppercase"
							>
								Fee Tier
							</Typography>
							<Typography variant="subtitle">{feePercent}%</Typography>
						</div>
					</div>

					<Typography variant="label" className="text-gray-400">
						No position found. Add liquidity to this pool to start earning
						streaming rewards.
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
							4. Your share = Your Units / Total Units
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
