'use client'

import { useState, useCallback, useEffect } from 'react'
import { Address, encodeFunctionData, erc20Abi, Hex, maxUint256, parseUnits } from 'viem'
import { useSendCalls, useCallsStatus } from 'wagmi'
import { useActiveAccount } from 'thirdweb/react'

import { STREAMER_ABI } from '@/app/abi/streamer.abi'
import { STREAMER_ADDRESS } from '@/app/config/const/contracts'
import { sepoliaClient, erc20Abi as customErc20Abi } from '@/app/config/viem'
import { TokenInfo, FeeTier } from '@/app/types/token'
import { buildCreateCampaignParams } from '@/app/helpers/campaign-params.helper'

type TxStatus =
	| 'idle'
	| 'preparing'
	| 'waiting_wallet'
	| 'pending'
	| 'success'
	| 'failed'

export type CreateCampaignInput = {
	token0: TokenInfo
	token1: TokenInfo
	feeTier: FeeTier
	initialPrice: string
	amount0: string
	amount1: string
	rewardToken: TokenInfo
	rewardAmount: string
	durationDays: number
}

type Call = {
	to: Address
	data: Hex
	value?: bigint
}

export function useCreateCampaign() {
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

	// Derive status message
	const derivedStatusMessage = (() => {
		if (derivedTxStatus === 'pending')
			return 'Transaction pending... Waiting for confirmation.'
		if (derivedTxStatus === 'success') return 'Transaction confirmed!'
		if (derivedTxStatus === 'failed') return ''
		return status
	})()

	// Update txStatus when callsStatus changes
	useEffect(() => {
		if (callsStatus) {
			if (callsStatus.status === 'success') {
				setTxStatus('success')
			} else if (callsStatus.status === 'failure') {
				setTxStatus('failed')
			} else if (callsStatus.status === 'pending') {
				setTxStatus('pending')
			}
		}
	}, [callsStatus, derivedTxStatus])

	const fetchAllowances = useCallback(
		async (
			tokens: TokenInfo[]
		): Promise<Map<string, bigint>> => {
			if (!userAddress) return new Map()

			const allowanceMap = new Map<string, bigint>()

			for (const token of tokens) {
				try {
					const allowance = await sepoliaClient.readContract({
						address: token.address as Address,
						abi: customErc20Abi,
						functionName: 'allowance',
						args: [userAddress, STREAMER_ADDRESS]
					})
					allowanceMap.set(token.address.toLowerCase(), allowance)
				} catch (e) {
					allowanceMap.set(token.address.toLowerCase(), 0n)
				}
			}

			return allowanceMap
		},
		[userAddress]
	)

	const buildApproveCalls = useCallback(
		(
			tokens: TokenInfo[],
			amounts: bigint[],
			allowanceMap: Map<string, bigint>
		): Call[] => {
			const calls: Call[] = []

			for (let i = 0; i < tokens.length; i++) {
				const token = tokens[i]
				const amount = amounts[i]
				const currentAllowance =
					allowanceMap.get(token.address.toLowerCase()) ?? 0n

				if (currentAllowance >= amount) {
					continue
				}

				// If there's existing allowance, reset it first (for tokens like USDT)
				if (currentAllowance > 0n) {
					calls.push({
						to: token.address as Address,
						data: encodeFunctionData({
							abi: erc20Abi,
							functionName: 'approve',
							args: [STREAMER_ADDRESS, 0n]
						})
					})
				}

				// Approve max
				calls.push({
					to: token.address as Address,
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

	const createCampaign = useCallback(
		async (input: CreateCampaignInput): Promise<string | null> => {
			if (!userAddress) {
				setError('Wallet not connected')
				return null
			}

			setError(null)
			setTxHash(null)
			setStatus('Preparing transaction...')

			try {
				const {
					token0,
					token1,
					feeTier,
					initialPrice,
					amount0,
					amount1,
					rewardToken,
					rewardAmount,
					durationDays
				} = input

				// 1. Calculate amounts
				const amount0Parsed = parseUnits(amount0, token0.decimals)
				const amount1Parsed = parseUnits(amount1, token1.decimals)
				const budgetParsed = parseUnits(rewardAmount, rewardToken.decimals)

				// 2. Fetch current allowances
				setStatus('Checking allowances...')
				const allTokens = [token0, token1, rewardToken]
				const amounts = [amount0Parsed, amount1Parsed, budgetParsed]
				const allowanceMap = await fetchAllowances(allTokens)

				// 3. Build approve calls
				const approveCalls = buildApproveCalls(allTokens, amounts, allowanceMap)

				// 4. Get current campaign counter to calculate the new campaign ID
				setStatus('Getting campaign counter...')
				const currentCounter = await sepoliaClient.readContract({
					address: STREAMER_ADDRESS,
					abi: STREAMER_ABI,
					functionName: 'getCampaignCounter'
				})
				const newCampaignId = currentCounter + 1n

				// 5. Build campaign params
				setStatus('Building campaign parameters...')
				const campaignParams = buildCreateCampaignParams(
					token0,
					token1,
					feeTier,
					initialPrice,
					amount0,
					amount1,
					rewardToken,
					rewardAmount,
					durationDays,
					userAddress
				)

				// 6. Build createCampaign call
				const createCampaignCall: Call = {
					to: STREAMER_ADDRESS,
					data: encodeFunctionData({
						abi: STREAMER_ABI,
						functionName: 'createCampaign',
						args: [campaignParams]
					})
				}

				// 7. Build startCampaign call (will use the ID calculated above)
				const startCampaignCall: Call = {
					to: STREAMER_ADDRESS,
					data: encodeFunctionData({
						abi: STREAMER_ABI,
						functionName: 'startCampaign',
						args: [newCampaignId]
					})
				}

				// 8. Combine all calls: approves + createCampaign + startCampaign
				const allCalls = [...approveCalls, createCampaignCall, startCampaignCall]

				// 9. Send batch transaction
				setStatus('Please confirm in your wallet...')
				setTxStatus('waiting_wallet')

				const { id: newBatchId } = await sendCallsAsync({
					calls: allCalls
				})

				setBatchId(newBatchId)
				setTxStatus('pending')
				setStatus('Transaction submitted! Waiting for confirmation...')

				return newBatchId
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Unknown error occurred'
				setError(errorMessage)
				setStatus('')
				return null
			}
		},
		[userAddress, fetchAllowances, buildApproveCalls, sendCallsAsync]
	)

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
		createCampaign,
		isPending,
		isSuccess,
		isFailed,
		error: isFailed ? 'Transaction failed' : error,
		txHash: actualTxHash,
		batchId,
		status: derivedStatusMessage,
		txStatus: derivedTxStatus,
		reset: () => {
			setError(null)
			setTxHash(null)
			setBatchId(null)
			setStatus('')
			setTxStatus('idle')
		}
	}
}
