import {
	Address,
	encodeFunctionData,
	erc20Abi,
	Hex,
	maxUint256,
	zeroAddress
} from 'viem'

import { TokenInfo } from '@/app/types/token'

export type TokenWithAllowance = TokenInfo & {
	allowance?: bigint
}

export function buildApproveCalls(
	tokens: TokenWithAllowance[],
	amounts: bigint[],
	spender: Address
): Array<{ to: Address; data: Hex }> {
	if (tokens.length !== amounts.length) {
		throw new Error('MISMATCH: tokens vs amounts for approvals')
	}

	const calls: Array<{ to: Address; data: Hex }> = []

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i]
		const amount = amounts[i]

		if (!token) continue
		if (token.address === zeroAddress) continue // ETH doesn't need approval
		if (amount === 0n) continue // Nothing to spend

		const allowance = token.allowance ?? 0n

		if (allowance >= amount) continue // Already approved enough

		// If there's existing allowance, reset it first (for tokens like USDT)
		if (allowance > 0n) {
			calls.push({
				to: token.address as Address,
				data: encodeFunctionData({
					abi: erc20Abi,
					functionName: 'approve',
					args: [spender, 0n]
				})
			})
		}

		// Approve max
		calls.push({
			to: token.address as Address,
			data: encodeFunctionData({
				abi: erc20Abi,
				functionName: 'approve',
				args: [spender, maxUint256]
			})
		})
	}

	return calls
}

