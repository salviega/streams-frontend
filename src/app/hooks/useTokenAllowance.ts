'use client'

import { useCallback, useState } from 'react'
import { Address, erc20Abi } from 'viem'

import { sepoliaClient } from '@/app/config/viem'
import { TokenInfo } from '@/app/types/token'

export function useTokenAllowance() {
	const [isLoading, setIsLoading] = useState(false)

	const fetchAllowance = useCallback(
		async (
			tokenAddress: Address,
			ownerAddress: Address,
			spenderAddress: Address
		): Promise<bigint> => {
			try {
				const allowance = await sepoliaClient.readContract({
					address: tokenAddress,
					abi: erc20Abi,
					functionName: 'allowance',
					args: [ownerAddress, spenderAddress]
				})
				return allowance
			} catch (error) {
				console.error('Error fetching allowance:', error)
				return 0n
			}
		},
		[]
	)

	const fetchAllowancesForTokens = useCallback(
		async (
			tokens: TokenInfo[],
			ownerAddress: Address,
			spenderAddress: Address
		): Promise<Map<string, bigint>> => {
			setIsLoading(true)
			const allowanceMap = new Map<string, bigint>()

			try {
				const promises = tokens.map(async token => {
					const allowance = await fetchAllowance(
						token.address as Address,
						ownerAddress,
						spenderAddress
					)
					return { address: token.address, allowance }
				})

				const results = await Promise.all(promises)

				results.forEach(({ address, allowance }) => {
					allowanceMap.set(address.toLowerCase(), allowance)
				})
			} catch (error) {
				console.error('Error fetching allowances:', error)
			} finally {
				setIsLoading(false)
			}

			return allowanceMap
		},
		[fetchAllowance]
	)

	return {
		fetchAllowance,
		fetchAllowancesForTokens,
		isLoading
	}
}

