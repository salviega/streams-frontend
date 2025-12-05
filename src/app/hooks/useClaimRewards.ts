'use client'

import { useState, useCallback } from 'react'
import { Address, encodeFunctionData, parseAbi } from 'viem'
import { useActiveAccount, useSendTransaction } from 'thirdweb/react'
import { prepareTransaction } from 'thirdweb'

import { GDA_FORWARDER_ADDRESS } from '@/app/config/const/contracts'
import { sepoliaClient } from '@/app/config/viem'
import { thirdwebClient, sepoliaChain } from '@/app/config/thirdweb'

// ABIs for reading
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

export type ClaimStatus = 'idle' | 'checking' | 'connecting' | 'claiming' | 'success' | 'error'

export function useClaimRewards(
	superTokenAddress: Address,
	gdaPoolAddress: Address,
	onSuccess?: () => void
) {
	const account = useActiveAccount()
	const address = account?.address as Address | undefined
	
	const [status, setStatus] = useState<ClaimStatus>('idle')
	const [error, setError] = useState<string | null>(null)
	const [claimedAmount, setClaimedAmount] = useState<bigint>(0n)
	const [txHash, setTxHash] = useState<string | null>(null)

	const { mutateAsync: sendTx, isPending } = useSendTransaction()

	const claim = useCallback(async () => {
		if (!address || !superTokenAddress || !gdaPoolAddress || !account) {
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

			// Connect if not connected
			if (!isConnected) {
				setStatus('connecting')
				
				const connectData = encodeFunctionData({
					abi: GDA_FORWARDER_ABI,
					functionName: 'connectPool',
					args: [gdaPoolAddress, '0x']
				})

				const connectTx = prepareTransaction({
					chain: sepoliaChain,
					client: thirdwebClient,
					to: GDA_FORWARDER_ADDRESS,
					data: connectData,
					value: 0n
				})

				const result = await sendTx(connectTx)
				console.log('Connect TX:', result.transactionHash)
				
				// Wait for confirmation
				await new Promise(resolve => setTimeout(resolve, 3000))
			}

			// Get claimable balance
			setStatus('claiming')
			
			const realtimeBalance = await sepoliaClient.readContract({
				address: superTokenAddress,
				abi: SUPER_TOKEN_ABI,
				functionName: 'realtimeBalanceOfNow',
				args: [address]
			})

			const availableBalance = realtimeBalance[0]

			if (availableBalance <= 0n) {
				setError('No rewards available to claim')
				setStatus('error')
				return
			}

			// Downgrade SuperToken to underlying token
			const downgradeData = encodeFunctionData({
				abi: SUPER_TOKEN_ABI,
				functionName: 'downgrade',
				args: [BigInt(availableBalance)]
			})

			const downgradeTx = prepareTransaction({
				chain: sepoliaChain,
				client: thirdwebClient,
				to: superTokenAddress,
				data: downgradeData,
				value: 0n
			})

			const result = await sendTx(downgradeTx)
			setTxHash(result.transactionHash)
			setClaimedAmount(BigInt(availableBalance))
			setStatus('success')
			
			// Call success callback after a short delay to allow state updates
			setTimeout(() => {
				onSuccess?.()
			}, 2000)

		} catch (err) {
			console.error('Claim error:', err)
			setError(err instanceof Error ? err.message : 'Failed to claim rewards')
			setStatus('error')
		}
	}, [address, superTokenAddress, gdaPoolAddress, account, sendTx, onSuccess])

	const reset = useCallback(() => {
		setStatus('idle')
		setError(null)
		setTxHash(null)
		setClaimedAmount(0n)
	}, [])

	return {
		claim,
		reset,
		status,
		error,
		claimedAmount,
		isLoading: isPending || status === 'checking' || status === 'connecting' || status === 'claiming',
		txHash
	}
}

