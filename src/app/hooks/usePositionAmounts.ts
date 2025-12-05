'use client'

import { useEffect, useState, useCallback } from 'react'
import { Address, formatUnits, erc20Abi } from 'viem'

import { STREAMER_ADDRESS } from '@/app/config/const/contracts'
import { sepoliaClient } from '@/app/config/viem'

export type PositionAmounts = {
	amount0: number
	amount1: number
	totalAmount0InStreamer: number
	totalAmount1InStreamer: number
}

/**
 * Hook to get user's position amounts by querying Streamer's token balances
 * and calculating the user's share based on LP units.
 * 
 * This approach is more accurate than trying to decode Uniswap V4 liquidity
 * because the Streamer contract holds the actual tokens.
 */
export function usePositionAmounts(
	currency0: Address,
	currency1: Address,
	token0Decimals: number,
	token1Decimals: number,
	userLpUnits?: bigint,
	totalUnits?: bigint
) {
	const [amounts, setAmounts] = useState<PositionAmounts | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchAmounts = useCallback(async () => {
		try {
			setLoading(true)

			// Get Streamer's token balances
			const [balance0Raw, balance1Raw] = await Promise.all([
				sepoliaClient.readContract({
					address: currency0,
					abi: erc20Abi,
					functionName: 'balanceOf',
					args: [STREAMER_ADDRESS]
				}),
				sepoliaClient.readContract({
					address: currency1,
					abi: erc20Abi,
					functionName: 'balanceOf',
					args: [STREAMER_ADDRESS]
				})
			])

			// Convert to human readable
			const totalAmount0 = parseFloat(formatUnits(balance0Raw, token0Decimals))
			const totalAmount1 = parseFloat(formatUnits(balance1Raw, token1Decimals))

			// Calculate user's portion based on LP units
			let userAmount0 = 0
			let userAmount1 = 0

			if (userLpUnits && totalUnits && totalUnits > 0n) {
				const userShare = Number(userLpUnits) / Number(totalUnits)
				userAmount0 = totalAmount0 * userShare
				userAmount1 = totalAmount1 * userShare
			}

			setAmounts({
				amount0: userAmount0,
				amount1: userAmount1,
				totalAmount0InStreamer: totalAmount0,
				totalAmount1InStreamer: totalAmount1
			})
			setError(null)
		} catch (err) {
			console.error('Error fetching position amounts:', err)
			setError('Failed to fetch position amounts')
			setAmounts(null)
		} finally {
			setLoading(false)
		}
	}, [currency0, currency1, token0Decimals, token1Decimals, userLpUnits, totalUnits])

	useEffect(() => {
		fetchAmounts()
	}, [fetchAmounts])

	return { amounts, loading, error, refetch: fetchAmounts }
}

