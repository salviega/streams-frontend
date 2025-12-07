'use client'

import { useEffect, useState, useCallback } from 'react'
import { Address, formatUnits, erc20Abi } from 'viem'
import { useActiveAccount } from 'thirdweb/react'

import { STREAMER_ABI } from '@/app/abi/streamer.abi'
import { STREAMER_ADDRESS } from '@/app/config/const/contracts'
import { sepoliaClient } from '@/app/config/viem'

// ============= Types =============

export type PoolKey = {
	currency0: Address
	currency1: Address
	fee: number
	tickSpacing: number
	hooks: Address
}

export type Campaign = {
	id: bigint
	positionTokenId: bigint
	budget: bigint
	goal: bigint
	duration: bigint
	owner: Address
	reward: Address
	superToken: Address
	rewardType: number
	active: boolean
	flowRate: bigint
	pool: PoolKey
}

export type CampaignWithMeta = Campaign & {
	totalUnits: bigint
	goalReached: boolean
	distributionPool: Address
	// Token metadata
	token0Symbol: string
	token1Symbol: string
	rewardSymbol: string
	token0Decimals: number
	token1Decimals: number
	rewardDecimals: number
}

// ============= Hook: Fetch Campaign Counter =============

export function useCampaignCounter() {
	const [counter, setCounter] = useState<number>(0)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchCounter = useCallback(async () => {
		try {
			setLoading(true)
			const result = await sepoliaClient.readContract({
				address: STREAMER_ADDRESS,
				abi: STREAMER_ABI,
				functionName: 'getCampaignCounter'
			})
			setCounter(Number(result))
			setError(null)
		} catch (err) {
			setError('Failed to fetch campaign counter')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchCounter()
	}, [fetchCounter])

	return { counter, loading, error, refetch: fetchCounter }
}

// ============= Hook: Fetch Single Campaign =============

export function useCampaign(campaignId: number) {
	const [campaign, setCampaign] = useState<CampaignWithMeta | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchCampaign = useCallback(async () => {
		if (campaignId < 1) return

		try {
			setLoading(true)

			// Fetch campaign data
			const campaignData = await sepoliaClient.readContract({
				address: STREAMER_ADDRESS,
				abi: STREAMER_ABI,
				functionName: 'getCampaign',
				args: [BigInt(campaignId)]
			}) as Campaign

			// Fetch additional data
			const [totalUnits, goalReached, distributionPool] = await Promise.all([
				sepoliaClient.readContract({
					address: STREAMER_ADDRESS,
					abi: STREAMER_ABI,
					functionName: 'getCampaignTotalUnits',
					args: [BigInt(campaignId)]
				}),
				sepoliaClient.readContract({
					address: STREAMER_ADDRESS,
					abi: STREAMER_ABI,
					functionName: 'getCampaignGoalReached',
					args: [BigInt(campaignId)]
				}),
				sepoliaClient.readContract({
					address: STREAMER_ADDRESS,
					abi: STREAMER_ABI,
					functionName: 'getCampaignDistributionPool',
					args: [BigInt(campaignId)]
				})
			])

			// Fetch token metadata
			const [token0Symbol, token1Symbol, rewardSymbol, token0Decimals, token1Decimals, rewardDecimals] =
				await Promise.all([
					sepoliaClient.readContract({
						address: campaignData.pool.currency0,
						abi: erc20Abi,
						functionName: 'symbol'
					}),
					sepoliaClient.readContract({
						address: campaignData.pool.currency1,
						abi: erc20Abi,
						functionName: 'symbol'
					}),
					sepoliaClient.readContract({
						address: campaignData.reward,
						abi: erc20Abi,
						functionName: 'symbol'
					}),
					sepoliaClient.readContract({
						address: campaignData.pool.currency0,
						abi: erc20Abi,
						functionName: 'decimals'
					}),
					sepoliaClient.readContract({
						address: campaignData.pool.currency1,
						abi: erc20Abi,
						functionName: 'decimals'
					}),
					sepoliaClient.readContract({
						address: campaignData.reward,
						abi: erc20Abi,
						functionName: 'decimals'
					})
				])

			const campaignWithMeta: CampaignWithMeta = {
				...campaignData,
				totalUnits: totalUnits as bigint,
				goalReached: goalReached as boolean,
				distributionPool: distributionPool as Address,
				token0Symbol: token0Symbol as string,
				token1Symbol: token1Symbol as string,
				rewardSymbol: rewardSymbol as string,
				token0Decimals: token0Decimals as number,
				token1Decimals: token1Decimals as number,
				rewardDecimals: rewardDecimals as number
			}

			setCampaign(campaignWithMeta)
			setError(null)
		} catch (err) {
			setError('Failed to fetch campaign')
		} finally {
			setLoading(false)
		}
	}, [campaignId])

	useEffect(() => {
		fetchCampaign()
	}, [fetchCampaign])

	return { campaign, loading, error, refetch: fetchCampaign }
}

// ============= Hook: Fetch All Campaigns =============

export function useCampaigns() {
	const [campaigns, setCampaigns] = useState<CampaignWithMeta[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchCampaigns = useCallback(async () => {
		try {
			setLoading(true)

			// Get counter
			const counter = await sepoliaClient.readContract({
				address: STREAMER_ADDRESS,
				abi: STREAMER_ABI,
				functionName: 'getCampaignCounter'
			})

			const numCampaigns = Number(counter)
			if (numCampaigns === 0) {
				setCampaigns([])
				setLoading(false)
				return
			}

			// Fetch all campaigns
			const campaignPromises: Promise<CampaignWithMeta | null>[] = []

			for (let i = 1; i <= numCampaigns; i++) {
				campaignPromises.push(fetchSingleCampaign(i))
			}

			const results = await Promise.all(campaignPromises)
			const validCampaigns = results.filter((c): c is CampaignWithMeta => c !== null)

			setCampaigns(validCampaigns)
			setError(null)
		} catch (err) {
			setError('Failed to fetch campaigns')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchCampaigns()
	}, [fetchCampaigns])

	return { campaigns, loading, error, refetch: fetchCampaigns }
}

// ============= Hook: Fetch LP Position =============

export function useLpPosition(campaignId: number) {
	const account = useActiveAccount()
	const userAddress = account?.address as Address | undefined

	const [position, setPosition] = useState<{
		lpUnits: bigint
		shareBps: bigint
		pendingReward: bigint
	} | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchPosition = useCallback(async () => {
		if (!userAddress || campaignId < 1) {
			setPosition(null)
			setLoading(false)
			return
		}

		try {
			setLoading(true)

			const [lpUnits, shareBps, pendingReward] = await Promise.all([
				sepoliaClient.readContract({
					address: STREAMER_ADDRESS,
					abi: STREAMER_ABI,
					functionName: 'getLpUnits',
					args: [BigInt(campaignId), userAddress]
				}),
				sepoliaClient.readContract({
					address: STREAMER_ADDRESS,
					abi: STREAMER_ABI,
					functionName: 'getLpShareBps',
					args: [BigInt(campaignId), userAddress]
				}),
				sepoliaClient.readContract({
					address: STREAMER_ADDRESS,
					abi: STREAMER_ABI,
					functionName: 'getLpPendingReward',
					args: [BigInt(campaignId), userAddress]
				})
			])

			console.log(`[useLpPosition] Campaign ${campaignId} - User: ${userAddress}`)
			console.log(`  lpUnits: ${lpUnits.toString()}`)
			console.log(`  shareBps: ${shareBps.toString()}`)
			console.log(`  pendingReward: ${pendingReward.toString()} (${Number(pendingReward) / 1e18} tokens)`)

			setPosition({
				lpUnits: lpUnits as bigint,
				shareBps: shareBps as bigint,
				pendingReward: pendingReward as bigint
			})
			setError(null)
		} catch (err) {
			setError('Failed to fetch LP position')
		} finally {
			setLoading(false)
		}
	}, [campaignId, userAddress])

	useEffect(() => {
		fetchPosition()
	}, [fetchPosition])

	return { position, loading, error, refetch: fetchPosition }
}

// ============= Helper: Fetch Single Campaign =============

async function fetchSingleCampaign(campaignId: number): Promise<CampaignWithMeta | null> {
	try {
		const campaignData = await sepoliaClient.readContract({
			address: STREAMER_ADDRESS,
			abi: STREAMER_ABI,
			functionName: 'getCampaign',
			args: [BigInt(campaignId)]
		}) as Campaign

		const [totalUnits, goalReached, distributionPool] = await Promise.all([
			sepoliaClient.readContract({
				address: STREAMER_ADDRESS,
				abi: STREAMER_ABI,
				functionName: 'getCampaignTotalUnits',
				args: [BigInt(campaignId)]
			}),
			sepoliaClient.readContract({
				address: STREAMER_ADDRESS,
				abi: STREAMER_ABI,
				functionName: 'getCampaignGoalReached',
				args: [BigInt(campaignId)]
			}),
			sepoliaClient.readContract({
				address: STREAMER_ADDRESS,
				abi: STREAMER_ABI,
				functionName: 'getCampaignDistributionPool',
				args: [BigInt(campaignId)]
			})
		])

		// Fetch token metadata
		const [token0Symbol, token1Symbol, rewardSymbol, token0Decimals, token1Decimals, rewardDecimals] =
			await Promise.all([
				sepoliaClient.readContract({
					address: campaignData.pool.currency0,
					abi: erc20Abi,
					functionName: 'symbol'
				}),
				sepoliaClient.readContract({
					address: campaignData.pool.currency1,
					abi: erc20Abi,
					functionName: 'symbol'
				}),
				sepoliaClient.readContract({
					address: campaignData.reward,
					abi: erc20Abi,
					functionName: 'symbol'
				}),
				sepoliaClient.readContract({
					address: campaignData.pool.currency0,
					abi: erc20Abi,
					functionName: 'decimals'
				}),
				sepoliaClient.readContract({
					address: campaignData.pool.currency1,
					abi: erc20Abi,
					functionName: 'decimals'
				}),
				sepoliaClient.readContract({
					address: campaignData.reward,
					abi: erc20Abi,
					functionName: 'decimals'
				})
			])

		return {
			...campaignData,
			totalUnits: totalUnits as bigint,
			goalReached: goalReached as boolean,
			distributionPool: distributionPool as Address,
			token0Symbol: token0Symbol as string,
			token1Symbol: token1Symbol as string,
			rewardSymbol: rewardSymbol as string,
			token0Decimals: token0Decimals as number,
			token1Decimals: token1Decimals as number,
			rewardDecimals: rewardDecimals as number
		}
	} catch (err) {
		return null
	}
}

// ============= Helper: Format Values =============

export function formatBudget(budget: bigint, decimals: number): string {
	return formatUnits(budget, decimals)
}

export function formatFlowRate(flowRate: bigint, decimals: number): string {
	// Flow rate is per second, convert to readable per day
	const perSecond = Number(flowRate) / Math.pow(10, decimals)
	const perDay = perSecond * 86400
	return perDay.toFixed(4)
}

export function formatShareBps(shareBps: bigint): string {
	// shareBps is in basis points (1 = 0.01%)
	return (Number(shareBps) / 100).toFixed(2)
}

