'use client'

import { useState, useCallback, useEffect } from 'react'
import { Address, encodeFunctionData, Hex, parseAbi } from 'viem'
import { useActiveAccount } from 'thirdweb/react'
import { useSendCalls, useCallsStatus } from 'wagmi'

import { GDA_FORWARDER_ADDRESS } from '@/app/config/const/contracts'
import { sepoliaClient } from '@/app/config/viem'

type TxStatus =
	| 'idle'
	| 'preparing'
	| 'waiting_wallet'
	| 'pending'
	| 'success'
	| 'failed'

// ABIs for reading and encoding
const GDA_FORWARDER_ABI = parseAbi([
	'function connectPool(address pool, bytes userData) returns (bool)',
	'function isMemberConnected(address pool, address memberAddress) view returns (bool)'
])

const SUPER_TOKEN_ABI = parseAbi([
	'function realtimeBalanceOfNow(address account) view returns (int256 availableBalance, uint256 deposit, uint256 owedDeposit, uint256 timestamp)',
	'function downgrade(uint256 amount)',
	'function balanceOf(address account) view returns (uint256)',
	'function getUnderlyingToken() view returns (address)'
])

type Call = {
	to: Address
	data: Hex
	value?: bigint
}

export type ClaimStatus = 'idle' | 'checking' | 'connecting' | 'claiming' | 'success' | 'error'

export function useClaimRewards(
	superTokenAddress: Address,
	gdaPoolAddress: Address,
	onSuccess?: () => void,
	pendingReward?: bigint, // Optional: pending reward from position (for when not connected)
	estimatedBalance?: bigint // Optional: estimated balance from UI (for when not connected and pendingReward is 0)
) {
	const account = useActiveAccount()
	const address = account?.address as Address | undefined
	
	const [status, setStatus] = useState<ClaimStatus>('idle')
	const [error, setError] = useState<string | null>(null)
	const [claimedAmount, setClaimedAmount] = useState<bigint>(0n)
	const [txHash, setTxHash] = useState<string | null>(null)
	const [batchId, setBatchId] = useState<string | null>(null)
	const [txStatus, setTxStatus] = useState<TxStatus>('idle')

	const { sendCallsAsync, isPending: isSending } = useSendCalls()

	// Watch batch status
	const { data: callsStatus } = useCallsStatus({
		id: batchId as string,
		query: {
			enabled: !!batchId,
			refetchInterval: data => {
				const status = data.state.data?.status
				if (status === 'success' || status === 'failure') return false
				return 2000
			}
		}
	})

	// Derive transaction status from callsStatus
	const derivedTxStatus: TxStatus = (() => {
		if (!batchId) return txStatus
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

	// Update txStatus when callsStatus changes
	useEffect(() => {
		if (callsStatus) {
			if (callsStatus.status === 'success') {
				setTxStatus('success')
				setStatus('success')
				// Call success callback when confirmed
				setTimeout(() => {
					onSuccess?.()
				}, 1000)
			} else if (callsStatus.status === 'failure') {
				setTxStatus('failed')
				setStatus('error')
			} else if (callsStatus.status === 'pending') {
				setTxStatus('pending')
			}
		}
	}, [callsStatus, derivedTxStatus, onSuccess])

	const claim = useCallback(async () => {
		if (!address || !superTokenAddress || !gdaPoolAddress) {
			setError('Please connect your wallet')
			return
		}

		try {
			setStatus('checking')
			setError(null)
			setTxHash(null)

			// Check if connected to pool
			const isConnected = await sepoliaClient.readContract({
				address: GDA_FORWARDER_ADDRESS,
				abi: GDA_FORWARDER_ABI,
				functionName: 'isMemberConnected',
				args: [gdaPoolAddress, address]
			})

			// Build calls array
			const calls: Call[] = []

			// Determine claim amount BEFORE building calls
			// If not connected, we need to use pendingReward or estimate based on available data
			let claimAmount: bigint

			if (isConnected) {
				// If connected, get real balance
				setStatus('claiming')
				const realtimeBalance = await sepoliaClient.readContract({
					address: superTokenAddress,
					abi: SUPER_TOKEN_ABI,
					functionName: 'realtimeBalanceOfNow',
					args: [address]
				})

				const availableBalance = realtimeBalance[0]

				if (availableBalance <= 0n) {
					const errorMsg = availableBalance < 0n 
						? 'You have a negative balance (debt). Cannot claim rewards.'
						: 'No rewards available to claim. Balance is zero.'
					setError(errorMsg)
					setStatus('error')
					return
				}
				claimAmount = availableBalance
			} else {
				// If not connected, balance will be 0 until after connection
				// Superfluid accumulates rewards but doesn't show them until connected
				// After connectPool, all accumulated rewards become available
				setStatus('claiming')
				const realtimeBalance = await sepoliaClient.readContract({
					address: superTokenAddress,
					abi: SUPER_TOKEN_ABI,
					functionName: 'realtimeBalanceOfNow',
					args: [address]
				})

				const availableBalance = realtimeBalance[0]

				// Determine claim amount: use availableBalance if > 0, otherwise use estimatedBalance or pendingReward
				// After connectPool, the balance will be available, so we can use estimatedBalance as a fallback
				if (availableBalance > 0n) {
					claimAmount = availableBalance
				} else if (estimatedBalance && estimatedBalance > 0n) {
					// Use estimated balance from UI (calculated from flow rate * time)
					claimAmount = estimatedBalance
				} else if (pendingReward && pendingReward > 0n) {
					claimAmount = pendingReward
				} else {
					// No balance available - can't determine claim amount
					setError('No rewards available to claim. Connect to pool first or wait for rewards to accumulate.')
					setStatus('error')
					return
				}

				// Add connect call if not connected (must be first)
				setStatus('connecting')
				const connectData = encodeFunctionData({
					abi: GDA_FORWARDER_ABI,
					functionName: 'connectPool',
					args: [gdaPoolAddress, '0x']
				})

				calls.push({
					to: GDA_FORWARDER_ADDRESS,
					data: connectData
				})
			}

			// Add downgrade call with the determined amount
			const downgradeData = encodeFunctionData({
				abi: SUPER_TOKEN_ABI,
				functionName: 'downgrade',
				args: [claimAmount]
			})

			calls.push({
				to: superTokenAddress,
				data: downgradeData
			})

			// Send batch transaction
			setStatus('claiming')
			setTxStatus('waiting_wallet')
			
			const { id: newBatchId } = await sendCallsAsync({
				calls
			})
			setBatchId(newBatchId)
			setTxStatus('pending')
			setClaimedAmount(claimAmount)
			setStatus('claiming') // Keep as claiming until confirmed
			
			// Success callback will be called when tx is confirmed (via useEffect)

		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to claim rewards')
			setStatus('error')
		}
	}, [address, superTokenAddress, gdaPoolAddress, sendCallsAsync, onSuccess, pendingReward, estimatedBalance])

	const reset = useCallback(() => {
		setStatus('idle')
		setError(null)
		setTxHash(null)
		setBatchId(null)
		setClaimedAmount(0n)
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
		claim,
		reset,
		status,
		error: isFailed ? 'Transaction failed' : error,
		claimedAmount,
		isLoading: isPending || status === 'checking' || status === 'connecting' || status === 'claiming',
		isPending,
		isSuccess,
		isFailed,
		txHash: actualTxHash,
		batchId,
		txStatus: derivedTxStatus
	}
}

