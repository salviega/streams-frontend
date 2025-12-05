'use client'

import { useState, useCallback } from 'react'
import { Address, encodeFunctionData, erc20Abi, Hex, maxUint256, parseUnits } from 'viem'
import { useSendCalls, useWalletClient } from 'wagmi'
import { useActiveAccount } from 'thirdweb/react'

import { STREAMER_ABI } from '@/app/abi/streamer.abi'
import { STREAMER_ADDRESS } from '@/app/config/const/contracts'
import { sepoliaClient, erc20Abi as customErc20Abi } from '@/app/config/viem'
import { TokenInfo, FeeTier } from '@/app/types/token'
import { buildCreateCampaignParams } from '@/app/helpers/campaign-params.helper'

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

	const { sendCallsAsync, isPending } = useSendCalls()

	const [error, setError] = useState<string | null>(null)
	const [txHash, setTxHash] = useState<string | null>(null)
	const [status, setStatus] = useState<string>('')

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
					console.warn(`Failed to fetch allowance for ${token.symbol}:`, e)
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
					console.log(`✅ ${token.symbol} already approved`)
					continue
				}

				console.log(
					`📝 Need to approve ${token.symbol}: current=${currentAllowance}, needed=${amount}`
				)

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

				// 4. Build campaign params
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

				console.log('📦 Campaign params:', campaignParams)

				// 5. Build createCampaign call
				const createCampaignCall: Call = {
					to: STREAMER_ADDRESS,
					data: encodeFunctionData({
						abi: STREAMER_ABI,
						functionName: 'createCampaign',
						args: [campaignParams]
					})
				}

				// 6. Combine all calls
				const allCalls = [...approveCalls, createCampaignCall]

				console.log('🔁 Total calls:', allCalls.length)
				console.log('   Approve calls:', approveCalls.length)
				console.log('   CreateCampaign call: 1')

				// 7. Send batch transaction
				setStatus(`Sending ${allCalls.length} transactions...`)

				const { id: batchId } = await sendCallsAsync({
					calls: allCalls
				})

				console.log('🚀 Batch ID:', batchId)
				setTxHash(batchId)
				setStatus('Transaction sent! Waiting for confirmation...')

				return batchId
			} catch (err) {
				console.error('❌ Error creating campaign:', err)
				const errorMessage =
					err instanceof Error ? err.message : 'Unknown error occurred'
				setError(errorMessage)
				setStatus('')
				return null
			}
		},
		[userAddress, fetchAllowances, buildApproveCalls, sendCallsAsync]
	)

	return {
		createCampaign,
		isPending,
		error,
		txHash,
		status
	}
}
