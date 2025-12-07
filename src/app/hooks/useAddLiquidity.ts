'use client'

import { useCallback, useState } from 'react'
import { useActiveAccount } from 'thirdweb/react'
import {
	Address,
	encodeFunctionData,
	erc20Abi,
	Hex,
	maxUint256,
	parseUnits
} from 'viem'
import { useCallsStatus, useSendCalls } from 'wagmi'

import { STREAMER_ABI } from '@/app/abi/streamer.abi'
import { STREAMER_ADDRESS } from '@/app/config/const/contracts'
import { erc20Abi as customErc20Abi, sepoliaClient } from '@/app/config/viem'
import { CampaignWithMeta } from '@/app/hooks/useCampaigns'

export type AddLiquidityInput = {
	campaign: CampaignWithMeta
	amount0: string // Human readable amount
	amount1: string // Human readable amount
	token0Decimals: number
	token1Decimals: number
}

type Call = {
	to: Address
	data: Hex
	value?: bigint
}

type TxStatus =
	| 'idle'
	| 'preparing'
	| 'waiting_wallet'
	| 'pending'
	| 'success'
	| 'failed'

export function useAddLiquidity() {
	const account = useActiveAccount()
	const userAddress = account?.address as Address | undefined

	const { sendCallsAsync, isPending: isSending } = useSendCalls()

	const [error, setError] = useState<string | null>(null)
	const [txHash, setTxHash] = useState<string | null>(null)
	const [batchId, setBatchId] = useState<string | null>(null)
	const [txStatus, setTxStatus] = useState<TxStatus>('idle')
	const [status, setStatus] = useState<string>('')

	// Watch batch status
	const { data: callsStatus } = useCallsStatus({
		id: batchId as string,
		query: {
			enabled: !!batchId,
			refetchInterval: data => {
				// Stop polling when confirmed or failed
				const status = data.state.data?.status
				if (status === 'success' || status === 'failure') return false
				return 2000 // Poll every 2 seconds
			}
		}
	})

	// Derive transaction status from callsStatus
	const derivedTxStatus: TxStatus = (() => {
		if (!batchId) return txStatus // Use local state if no batchId yet
		if (!callsStatus) return 'pending'
		if (callsStatus.status === 'pending') return 'pending'
		if (callsStatus.status === 'success') return 'success'
		if (callsStatus.status === 'failure') return 'failed'
		return txStatus
	})()

	// Get actual tx hash from receipts when confirmed
	const actualTxHash =
		callsStatus?.receipts?.[callsStatus.receipts.length - 1]?.transactionHash ??
		txHash

	// Derive status message
	const derivedStatusMessage = (() => {
		if (derivedTxStatus === 'pending')
			return 'Transaction pending... Waiting for confirmation.'
		if (derivedTxStatus === 'success') return 'Transaction confirmed!'
		if (derivedTxStatus === 'failed') return ''
		return status
	})()

	const fetchAllowances = useCallback(
		async (
			token0Address: Address,
			token1Address: Address
		): Promise<{ allowance0: bigint; allowance1: bigint }> => {
			if (!userAddress) return { allowance0: BigInt(0), allowance1: BigInt(0) }

			try {
				const [allowance0, allowance1] = await Promise.all([
					sepoliaClient.readContract({
						address: token0Address,
						abi: customErc20Abi,
						functionName: 'allowance',
						args: [userAddress, STREAMER_ADDRESS]
					}),
					sepoliaClient.readContract({
						address: token1Address,
						abi: customErc20Abi,
						functionName: 'allowance',
						args: [userAddress, STREAMER_ADDRESS]
					})
				])
				return { allowance0, allowance1 }
			} catch {
				return { allowance0: BigInt(0), allowance1: BigInt(0) }
			}
		},
		[userAddress]
	)

	const buildApproveCalls = useCallback(
		(
			token0Address: Address,
			token1Address: Address,
			amount0: bigint,
			amount1: bigint,
			allowance0: bigint,
			allowance1: bigint,
			_token0Symbol: string,
			_token1Symbol: string
		): Call[] => {
			const calls: Call[] = []

			// Approve token0 if needed
			if (allowance0 < amount0) {
				// Reset if existing allowance
				if (allowance0 > BigInt(0)) {
					calls.push({
						to: token0Address,
						data: encodeFunctionData({
							abi: erc20Abi,
							functionName: 'approve',
							args: [STREAMER_ADDRESS, BigInt(0)]
						})
					})
				}

				calls.push({
					to: token0Address,
					data: encodeFunctionData({
						abi: erc20Abi,
						functionName: 'approve',
						args: [STREAMER_ADDRESS, maxUint256]
					})
				})
			}

			// Approve token1 if needed
			if (allowance1 < amount1) {
				if (allowance1 > BigInt(0)) {
					calls.push({
						to: token1Address,
						data: encodeFunctionData({
							abi: erc20Abi,
							functionName: 'approve',
							args: [STREAMER_ADDRESS, BigInt(0)]
						})
					})
				}

				calls.push({
					to: token1Address,
					data: encodeFunctionData({
						abi: erc20Abi,
						functionName: 'approve',
						args: [STREAMER_ADDRESS, maxUint256]
					})
				})
			}

			return calls
		},
		[]
	)

	const calculateTickRange = useCallback(
		(
			amount0: bigint,
			amount1: bigint,
			fee: number
		): { tickLower: number; tickUpper: number; liquidity: bigint } => {
			// Get tick spacing based on fee
			const tickSpacingMap: Record<number, number> = {
				100: 1, // 0.01%
				500: 10, // 0.05%
				3000: 60, // 0.30%
				10000: 200 // 1.00%
			}
			const tickSpacing = tickSpacingMap[fee] || 200

			// Calculate price and tick
			const price = Number(amount1) / Number(amount0)
			const currentTick = Math.floor(Math.log(price) / Math.log(1.0001))

			// Align current tick to tick spacing
			const alignedTick = Math.floor(currentTick / tickSpacing) * tickSpacing

			// Use a spread that is a multiple of tickSpacing
			// Spread of ~3000 ticks on each side, but aligned to tickSpacing
			const spreadTicks = Math.floor(3000 / tickSpacing) * tickSpacing

			// Calculate tick range - MUST be multiples of tickSpacing
			const tickLower = alignedTick - spreadTicks
			const tickUpper = alignedTick + spreadTicks

			// Calculate liquidity
			const Q96 = BigInt(2) ** BigInt(96)
			const sqrtPriceX96 = BigInt(Math.floor(Math.sqrt(price) * Number(Q96)))
			const liquidity = (amount0 * sqrtPriceX96) / Q96

			return { tickLower, tickUpper, liquidity }
		},
		[]
	)

	const addLiquidity = useCallback(
		async (input: AddLiquidityInput): Promise<string | null> => {
			if (!userAddress) {
				setError('Wallet not connected')
				return null
			}

			setError(null)
			setTxHash(null)
			setStatus('Preparing transaction...')

			try {
				const { campaign, amount0, amount1, token0Decimals, token1Decimals } =
					input

				// 1. Parse amounts
				const amount0Parsed = parseUnits(amount0, token0Decimals)
				const amount1Parsed = parseUnits(amount1, token1Decimals)

				if (amount0Parsed <= BigInt(0) || amount1Parsed <= BigInt(0)) {
					setError('Both amounts must be greater than 0')
					return null
				}

				// 2. Get token addresses from campaign pool
				const token0Address = campaign.pool.currency0 as Address
				const token1Address = campaign.pool.currency1 as Address

				// 3. Fetch allowances
				setStatus('Checking allowances...')
				const { allowance0, allowance1 } = await fetchAllowances(
					token0Address,
					token1Address
				)

				// 4. Build approve calls
				const approveCalls = buildApproveCalls(
					token0Address,
					token1Address,
					amount0Parsed,
					amount1Parsed,
					allowance0,
					allowance1,
					campaign.token0Symbol,
					campaign.token1Symbol
				)

				// 5. Calculate tick range and liquidity
				setStatus('Calculating position parameters...')
				const { tickLower, tickUpper, liquidity } = calculateTickRange(
					amount0Parsed,
					amount1Parsed,
					campaign.pool.fee
				)

				// 6. Build addLiquidityToCampaign call
				const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour

				const addLiquidityCall: Call = {
					to: STREAMER_ADDRESS,
					data: encodeFunctionData({
						abi: STREAMER_ABI,
						functionName: 'addLiquidityToCampaign',
						args: [
							BigInt(campaign.id), // uint256 _campaignId
							tickLower, // int24 _tickLower
							tickUpper, // int24 _tickUpper
							liquidity, // uint256 _liquidity
							amount0Parsed, // uint256 _amount0Max
							amount1Parsed, // uint256 _amount1Max
							deadline // uint256 _deadline
						]
					})
				}

				// 7. Combine all calls: approves + addLiquidity
				const allCalls = [...approveCalls, addLiquidityCall]

				// 8. Send batch transaction using wagmi sendCalls
				setStatus('Please confirm in your wallet...')
				setTxStatus('waiting_wallet')

				const { id: newBatchId } = await sendCallsAsync({
					calls: allCalls
				})

				setBatchId(newBatchId)
				setTxStatus('pending')
				setStatus('Transaction submitted! Waiting for confirmation...')

				// Return batchId - the actual txHash will be set when confirmed
				return newBatchId
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Unknown error occurred'
				setError(errorMessage)
				setStatus('')
				return null
			}
		},
		[
			userAddress,
			fetchAllowances,
			buildApproveCalls,
			calculateTickRange,
			sendCallsAsync
		]
	)

	const reset = useCallback(() => {
		setError(null)
		setTxHash(null)
		setBatchId(null)
		setStatus('')
		setTxStatus('idle')
	}, [])

	// isPending when sending or waiting for confirmation
	const isPending =
		isSending ||
		derivedTxStatus === 'preparing' ||
		derivedTxStatus === 'waiting_wallet' ||
		derivedTxStatus === 'pending'
	// isSuccess when tx is confirmed
	const isSuccess = derivedTxStatus === 'success'
	// isFailed when tx failed
	const isFailed = derivedTxStatus === 'failed'

	return {
		addLiquidity,
		isPending,
		isSuccess,
		isFailed,
		error: isFailed ? 'Transaction failed' : error,
		txHash: actualTxHash,
		batchId,
		status: derivedStatusMessage,
		txStatus: derivedTxStatus,
		reset
	}
}
