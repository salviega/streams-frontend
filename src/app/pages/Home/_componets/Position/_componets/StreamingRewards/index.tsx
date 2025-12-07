'use client'

import { JSX, useEffect, useState, useRef, useCallback } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import { formatUnits, parseAbi, Address } from 'viem'
import { useActiveAccount } from 'thirdweb/react'

import { CampaignWithMeta, useLpPosition } from '@/app/hooks/useCampaigns'
import { useClaimRewards } from '@/app/hooks/useClaimRewards'
import { sepoliaClient } from '@/app/config/viem'
import Container from '@/app/ui/Container'
import Typography from '@/app/ui/Typography'
import { formatAmount, formatSmallNumber, fromWei } from '@/app/utils/format'

const SUPER_TOKEN_ABI = parseAbi([
	'function realtimeBalanceOfNow(address account) view returns (int256 availableBalance, uint256 deposit, uint256 owedDeposit, uint256 timestamp)'
])

// Import lotties
import catAnimation from '@/../public/lotties/loader-cat.json'
import usdcAnimation from '@/../public/lotties/usdc-earnings.json'

type Props = {
	campaign: CampaignWithMeta
	onClaimSuccess?: () => void
}

export default function StreamingRewards(props: Props): JSX.Element {
	const { campaign, onClaimSuccess } = props
	const { position, refetch: refetchPosition } = useLpPosition(Number(campaign.id))
	const account = useActiveAccount()
	const userAddress = account?.address as Address | undefined
	
	// Flow rate per second (Superfluid uses 18 decimals always)
	const flowRatePerSecond = fromWei(campaign.flowRate, 18)

	// User's share (basis points to decimal)
	const shareBps = position ? Number(position.shareBps) : 0
	const userFlowRatePerSecond = flowRatePerSecond * (shareBps / 10000)

	// Get user's LP units to check if they have liquidity
	const userLpUnits = position?.lpUnits ?? 0n
	const hasLiquidity = userLpUnits > 0n

	// Initialize balance state - will be set by useEffect when position loads
	const [balance, setBalance] = useState(0)
	// Track if balance has been initialized from real balance
	const [balanceInitialized, setBalanceInitialized] = useState(false)
	
	// Get pendingReward from position for claim hook
	const pendingRewardBigInt = position?.pendingReward ?? 0n

	// Calculate estimated balance from UI (balance state * 1e18)
	// This is needed because when not connected, pendingReward from contract is 0
	// but the UI shows the estimated accumulated rewards
	const estimatedBalanceBigInt = hasLiquidity && balance > 0
		? BigInt(Math.floor(balance * 1e18))
		: 0n

	// Claim hook
	const { 
		claim, 
		reset: resetClaim,
		status: claimStatus, 
		error: claimError, 
		isLoading: isClaimLoading,
		isPending: isClaimPending,
		isSuccess: isClaimSuccess,
		isFailed: isClaimFailed,
		txHash,
		txStatus: claimTxStatus,
		claimedAmount
	} = useClaimRewards(
		campaign.superToken as `0x${string}`,
		campaign.distributionPool as `0x${string}`,
		() => {
			// Refetch position data after successful claim
			refetchPosition()
			onClaimSuccess?.()
		},
		pendingRewardBigInt, // Pass pendingReward from contract
		estimatedBalanceBigInt // Pass estimated balance from UI (for when not connected)
	)

	// Track success state locally to persist modal
	const [showSuccess, setShowSuccess] = useState(false)
	const [confirmedTxHash, setConfirmedTxHash] = useState<string | null>(null)
	const [confirmedAmount, setConfirmedAmount] = useState<bigint>(0n)

	// Track error display state - auto-hide after a few seconds
	const [showError, setShowError] = useState(false)

	// Handle success - store values locally
	useEffect(() => {
		if (isClaimSuccess && !showSuccess) {
			setShowSuccess(true)
			setConfirmedTxHash(txHash)
			setConfirmedAmount(claimedAmount)
		}
	}, [isClaimSuccess, showSuccess, txHash, claimedAmount])

	// Handle error - show error message and auto-hide after 5 seconds
	useEffect(() => {
		if (claimError || isClaimFailed) {
			setShowError(true)
			// Auto-hide error after 5 seconds
			const timer = setTimeout(() => {
				setShowError(false)
			}, 5000)

			return () => clearTimeout(timer)
		} else {
			setShowError(false)
		}
	}, [claimError, isClaimFailed])
	const catRef = useRef<LottieRefCurrentProps>(null)
	const usdcRef = useRef<LottieRefCurrentProps>(null)
	const usdcRefRight = useRef<LottieRefCurrentProps>(null)
	// Ref to track if counter has started (to prevent multiple starts)
	const counterStartedRef = useRef(false)

	// Animation should only work when: campaign active + user has LP units + shareBps > 0
	const isStreaming = campaign.active && hasLiquidity && shareBps > 0

	// Reset balanceInitialized and counterStartedRef when campaign changes
	useEffect(() => {
		setBalanceInitialized(false)
		counterStartedRef.current = false
	}, [campaign.id])

	// Fetch real SuperToken balance and initialize counter from there
	// This effect runs when position loads or campaign changes
	useEffect(() => {
		console.log(`[StreamingRewards] Initializing balance for Campaign ${campaign.id}`)
		console.log(`  userAddress: ${userAddress}`)
		console.log(`  superToken: ${campaign.superToken}`)
		console.log(`  hasLiquidity: ${hasLiquidity}`)
		console.log(`  position:`, position ? {
			lpUnits: position.lpUnits.toString(),
			shareBps: position.shareBps.toString(),
			pendingReward: position.pendingReward.toString(),
			pendingRewardFormatted: parseFloat(formatUnits(position.pendingReward, 18))
		} : null)

		// Only fetch if we have user address and superToken
		if (!userAddress || !campaign.superToken) {
			console.log(`[StreamingRewards] Missing userAddress or superToken, setting balance to 0`)
			setBalance(0)
			setBalanceInitialized(true)
			return
		}

		// If no liquidity, set balance to 0
		if (!hasLiquidity) {
			console.log(`[StreamingRewards] No liquidity, setting balance to 0`)
			setBalance(0)
			setBalanceInitialized(true)
			return
		}

		// Only fetch if position is loaded (to avoid race condition)
		if (!position) {
			// If position is still loading, don't initialize yet
			setBalanceInitialized(false)
			return
		}

		// Fetch real balance from SuperToken
		const fetchRealBalance = async () => {
			try {
				console.log(`[StreamingRewards] Fetching realtimeBalanceOfNow from SuperToken ${campaign.superToken}`)
				const realtimeBalance = await sepoliaClient.readContract({
					address: campaign.superToken as Address,
					abi: SUPER_TOKEN_ABI,
					functionName: 'realtimeBalanceOfNow',
					args: [userAddress]
				})

				const availableBalance = realtimeBalance[0]
				const deposit = realtimeBalance[1]
				const owedDeposit = realtimeBalance[2]
				const timestamp = realtimeBalance[3]
				
				console.log(`[StreamingRewards] realtimeBalanceOfNow result:`)
				console.log(`  availableBalance: ${availableBalance.toString()} (${Number(availableBalance) / 1e18} tokens)`)
				console.log(`  deposit: ${deposit.toString()}`)
				console.log(`  owedDeposit: ${owedDeposit.toString()}`)
				console.log(`  timestamp: ${timestamp.toString()}`)
				
				// Convert to number (SuperToken always uses 18 decimals)
				const balanceNumber = availableBalance > 0n 
					? parseFloat(formatUnits(availableBalance, 18))
					: 0
				
				console.log(`[StreamingRewards] Setting balance to: ${balanceNumber} (from realtimeBalanceOfNow)`)
				setBalance(balanceNumber)
				setBalanceInitialized(true)
			} catch (err) {
				console.error(`[StreamingRewards] Error fetching realtimeBalanceOfNow:`, err)
				// Fallback to pendingReward if available, otherwise 0
				if (position?.pendingReward) {
					const pending = parseFloat(formatUnits(position.pendingReward, 18))
					console.log(`[StreamingRewards] Fallback: Using pendingReward: ${pending}`)
					setBalance(pending)
				} else {
					console.log(`[StreamingRewards] Fallback: No pendingReward, setting balance to 0`)
					setBalance(0)
				}
				setBalanceInitialized(true)
			}
		}

		fetchRealBalance()
	}, [campaign.id, campaign.superToken, campaign.rewardSymbol, userAddress, hasLiquidity, position]) // Reset when campaign changes or position loads

	// Reset balance after successful claim (when tx is confirmed)
	useEffect(() => {
		if (isClaimSuccess && userAddress && campaign.superToken) {
			// Fetch real balance after claim to start counter from actual value
			const fetchBalanceAfterClaim = async () => {
				try {
					const realtimeBalance = await sepoliaClient.readContract({
						address: campaign.superToken as Address,
						abi: SUPER_TOKEN_ABI,
						functionName: 'realtimeBalanceOfNow',
						args: [userAddress]
					})

					const availableBalance = realtimeBalance[0]
					const balanceNumber = availableBalance > 0n 
						? parseFloat(formatUnits(availableBalance, 18))
						: 0
					
					setBalance(balanceNumber)
					setBalanceInitialized(true)
				} catch (err) {
					setBalance(0)
					setBalanceInitialized(true)
				}
			}

			fetchBalanceAfterClaim()
			// Refetch position to get updated balance
			refetchPosition()
		}
	}, [isClaimSuccess, refetchPosition, userAddress, campaign.superToken, campaign.rewardSymbol])

	// Control cat animation - pause if no liquidity or campaign inactive
	useEffect(() => {
		if (catRef.current) {
			if (hasLiquidity && campaign.active) {
				catRef.current.play()
			} else {
				catRef.current.pause()
			}
		}
	}, [hasLiquidity, campaign.active])

	// Control USDC coin animations - only animate when streaming
	useEffect(() => {
		if (usdcRef.current) {
			if (isStreaming) {
				usdcRef.current.play()
			} else {
				usdcRef.current.pause()
			}
		}
		if (usdcRefRight.current) {
			if (isStreaming) {
				usdcRefRight.current.play()
			} else {
				usdcRefRight.current.pause()
			}
		}
	}, [isStreaming])

	// Animate balance counter - only when streaming AND balance is initialized
	// Use a separate effect that runs when balance is set to ensure we start from the correct value
	useEffect(() => {
		// Only start counter once when balance is initialized and streaming starts
		if (!balanceInitialized || counterStartedRef.current) {
			return
		}
		
		if (!isStreaming || userFlowRatePerSecond <= 0) {
			return
		}

		// Mark as started
		counterStartedRef.current = true
		
		console.log(`[StreamingRewards] Starting counter animation from balance: ${balance}`)
		
		const interval = setInterval(() => {
			setBalance(prev => prev + userFlowRatePerSecond / 10)
		}, 100)

		return () => {
			console.log(`[StreamingRewards] Stopping counter animation`)
			clearInterval(interval)
			counterStartedRef.current = false
		}
	}, [isStreaming, userFlowRatePerSecond, balanceInitialized, balance]) // Include balance to start when it's set

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
				{/* Show cat and counter only when NOT loading/pending and NOT showing success */}
				{!isClaimLoading && !isClaimPending && !showSuccess && (
					<>
						{/* Lottie animations container */}
						<div className="relative flex items-center justify-center h-56">
							{/* Cat animation - always visible but paused if no liquidity */}
							<div className="relative z-20 w-72 h-72">
								<Lottie
									lottieRef={catRef}
									animationData={catAnimation}
									loop={true}
									autoplay={hasLiquidity && campaign.active}
									style={{ width: '100%', height: '100%' }}
								/>
							</div>

							{/* USDC coin - LEFT side - only animate when streaming */}
							<div className="absolute -left-48 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-90">
								<Lottie
									lottieRef={usdcRef}
									animationData={usdcAnimation}
									loop={true}
									autoplay={isStreaming}
									style={{ width: '100%', height: '100%' }}
								/>
							</div>

							{/* USDC coin - RIGHT side - only animate when streaming */}
							<div className="absolute -right-48 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-90">
								<Lottie
									lottieRef={usdcRefRight}
									animationData={usdcAnimation}
									loop={true}
									autoplay={isStreaming}
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
									{formatAmount(hasLiquidity ? balance : 0, 4)}
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

							{!hasLiquidity && (
								<Typography variant="label" className="text-gray-500 text-xs">
									Add liquidity to start earning
								</Typography>
							)}
							{hasLiquidity && !campaign.active && (
								<Typography variant="label" className="text-yellow-500 text-xs">
									Campaign is not active
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
					</>
				)}

				{/* Pending State - shows when transaction is pending (replaces cat/counter) */}
				{(isClaimLoading || isClaimPending) && !showSuccess && (
					<div className="flex flex-col items-center justify-center gap-4 py-12">
						<div className="h-16 w-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
						</div>
						<Typography variant="title" className="text-cyan-400 text-lg">
							Transaction Pending
						</Typography>
						<Typography variant="label" className="text-gray-400 text-center text-sm">
							{claimStatus === 'connecting' 
								? 'Connecting to pool...' 
								: claimStatus === 'checking' 
								? 'Checking balance...' 
								: claimTxStatus === 'pending'
								? 'Waiting for blockchain confirmation...'
								: 'Processing transaction...'}
						</Typography>
					</div>
				)}

				{/* Success State - shows when tx is confirmed */}
				{showSuccess ? (
					<div className="flex flex-col items-center justify-center gap-4 py-6">
						<div className="relative">
							<div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
								<span className="text-4xl">🎉</span>
							</div>
							<div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
								<svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
								</svg>
							</div>
						</div>
						<Typography variant="title" className="text-green-400 text-lg">
							Rewards Claimed Successfully!
						</Typography>
						<Typography variant="label" className="text-gray-400 text-center text-sm">
							You successfully claimed {formatAmount(Number(confirmedAmount) / 1e18, 4)} {campaign.rewardSymbol}
						</Typography>
						{(confirmedTxHash || txHash) && (
							<a
								href={`https://sepolia.etherscan.io/tx/${confirmedTxHash || txHash}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors text-sm"
							>
								<span>View on Etherscan</span>
								<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
								</svg>
							</a>
						)}
						<button
							onClick={() => {
								setShowSuccess(false)
								setConfirmedTxHash(null)
								setConfirmedAmount(0n)
								resetClaim()
							}}
							className="w-full mt-2 px-6 py-3 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-colors"
						>
							Close
						</button>
					</div>
				) : (
					<>
						{/* Claim button - only show when not loading/pending and not showing success */}
						{!isClaimLoading && !isClaimPending && (
							<button
								onClick={claim}
								className="w-full mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-green-500 text-white font-semibold hover:from-cyan-600 hover:to-green-600 transition-all duration-200 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={!hasLiquidity || balance <= 0 || isClaimLoading}
							>
								{`Claim ${formatAmount(hasLiquidity ? balance : 0, 2)} ${campaign.rewardSymbol}`}
							</button>
						)}

						{/* Error message */}
						{showError && claimError && (
							<Typography variant="label" className="text-red-400 text-xs text-center">
								{claimError}
							</Typography>
						)}
					</>
				)}

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
