'use client'

import { JSX, useState, useCallback, useEffect } from 'react'
import { isAddress, Address, formatUnits } from 'viem'
import { useDebouncedCallback } from 'use-debounce'
import { useActiveAccount } from 'thirdweb/react'

import Modal from '@/app/ui/Modal'
import Input from '@/app/ui/Input'
import Button from '@/app/ui/Button'
import Typography from '@/app/ui/Typography'
import { TokenInfo } from '@/app/types/token'
import { sepoliaClient, erc20AbiCustom, formatBalance } from '@/app/config/viem'

type Props = {
	isOpen: boolean
	onClose: () => void
	onSelect: (token: TokenInfo) => void
	selectedTokens?: TokenInfo[]
}

// Generate initials from symbol (max 2 chars)
function getInitials(symbol: string): string {
	if (!symbol) return '??'
	return symbol.slice(0, 2).toUpperCase()
}

// Generate a consistent color from symbol
function getColorFromSymbol(symbol: string): string {
	const colors = [
		'from-cyan-500 to-blue-600',
		'from-purple-500 to-pink-600',
		'from-green-500 to-teal-600',
		'from-orange-500 to-red-600',
		'from-indigo-500 to-purple-600',
		'from-yellow-500 to-orange-600'
	]
	if (!symbol) return colors[0]
	const index = symbol.charCodeAt(0) % colors.length
	return colors[index]
}

export default function TokenSelectModal(props: Props): JSX.Element {
	const { isOpen, onClose, onSelect, selectedTokens = [] } = props

	const account = useActiveAccount()
	const userAddress = account?.address as Address | undefined

	const [address, setAddress] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')
	const [foundToken, setFoundToken] = useState<TokenInfo | null>(null)

	const resetState = useCallback(() => {
		setAddress('')
		setError('')
		setFoundToken(null)
		setIsLoading(false)
	}, [])

	const handleClose = useCallback(() => {
		resetState()
		onClose()
	}, [resetState, onClose])

	const fetchTokenInfo = useCallback(
		async (tokenAddress: string) => {
			if (!tokenAddress.trim()) {
				setError('Please enter a token address')
				return
			}

			if (!isAddress(tokenAddress)) {
				setError('Invalid Ethereum address')
				return
			}

			// Check if already selected
			if (
				selectedTokens.some(
					t => t.address.toLowerCase() === tokenAddress.toLowerCase()
				)
			) {
				setError('Token already selected')
				return
			}

			setIsLoading(true)
			setError('')
			setFoundToken(null)

			try {
				// Fetch token info from Sepolia using viem
				const [name, symbol, decimals] = await Promise.all([
					sepoliaClient.readContract({
						address: tokenAddress as Address,
						abi: erc20AbiCustom,
						functionName: 'name'
					}),
					sepoliaClient.readContract({
						address: tokenAddress as Address,
						abi: erc20AbiCustom,
						functionName: 'symbol'
					}),
					sepoliaClient.readContract({
						address: tokenAddress as Address,
						abi: erc20AbiCustom,
						functionName: 'decimals'
					})
				])

				// Fetch balance if user is connected
				let balance = '0'
				let balanceRaw = 0n

				if (userAddress) {
					try {
						balanceRaw = (await sepoliaClient.readContract({
							address: tokenAddress as Address,
							abi: erc20AbiCustom,
							functionName: 'balanceOf',
							args: [userAddress]
						})) as bigint

						balance = formatBalance(balanceRaw, Number(decimals))
					} catch (e) {
						// Silently fail - balance will remain 0
					}
				}

				const token: TokenInfo = {
					address: tokenAddress,
					name: name as string,
					symbol: symbol as string,
					decimals: Number(decimals),
					balance,
					balanceRaw
				}

				setFoundToken(token)
			} catch (err) {
				setError(
					'Could not fetch token information. Make sure this is a valid ERC-20 on Sepolia.'
				)
			} finally {
				setIsLoading(false)
			}
		},
		[selectedTokens, userAddress]
	)

	// Debounced search
	const debouncedSearch = useDebouncedCallback((value: string) => {
		if (isAddress(value)) {
			fetchTokenInfo(value)
		}
	}, 500)

	const handleSelect = useCallback(() => {
		if (foundToken) {
			onSelect(foundToken)
			handleClose()
		}
	}, [foundToken, onSelect, handleClose])

	const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.trim()
		setAddress(value)
		setError('')
		setFoundToken(null)

		// Debounced auto-search
		debouncedSearch(value)
	}

	// Reset when modal closes
	useEffect(() => {
		if (!isOpen) {
			resetState()
		}
	}, [isOpen, resetState])

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="Select a token" size="md">
			<div className="flex flex-col gap-4">
				{/* Network Badge */}
				<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-gray-700">
					<div className="h-2 w-2 rounded-full bg-green-400" />
					<Typography variant="label" className="text-gray-400 text-xs">
						Network: <span className="text-white">Ethereum Sepolia</span>
					</Typography>
				</div>

				{/* Search Input */}
				<div className="relative">
					<Input
						placeholder="Paste token contract address (0x...)"
						value={address}
						onChange={handleAddressChange}
						error={error}
						className="font-mono text-sm"
					/>
					{isLoading && (
						<div className="absolute right-3 top-3">
							<div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
						</div>
					)}
				</div>

				{/* Search Results */}
				{foundToken && (
					<div className="border-t border-gray-700 pt-4">
						<Typography variant="label" className="text-gray-400 mb-3">
							Search results
						</Typography>

						<button
							onClick={handleSelect}
							className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-700 bg-slate-800/50 hover:border-cyan-500/50 hover:bg-slate-800 transition-all duration-200"
						>
							{/* Token Logo (Generated) */}
							<div
								className={`h-10 w-10 rounded-full bg-gradient-to-br ${getColorFromSymbol(
									foundToken.symbol
								)} flex items-center justify-center text-white font-bold text-sm`}
							>
								{getInitials(foundToken.symbol)}
							</div>

							{/* Token Info */}
							<div className="flex flex-col items-start flex-1">
								<span className="text-white font-medium">{foundToken.name}</span>
								<span className="text-gray-400 text-sm flex items-center gap-2">
									{foundToken.symbol}
									<span className="text-gray-600 font-mono text-xs">
										{foundToken.address.slice(0, 6)}...
										{foundToken.address.slice(-4)}
									</span>
								</span>
							</div>

							{/* Balance & Decimals */}
							<div className="flex flex-col items-end gap-1">
								{userAddress && (
									<span className="text-cyan-400 text-sm font-medium">
										{foundToken.balance} {foundToken.symbol}
									</span>
								)}
								<span className="px-2 py-0.5 rounded bg-slate-700 text-gray-400 text-xs">
									{foundToken.decimals} decimals
								</span>
							</div>
						</button>
					</div>
				)}

				{/* Helper Text */}
				{!foundToken && !error && !isLoading && (
					<Typography variant="label" className="text-gray-500 text-center">
						Enter a token contract address to find and select tokens
					</Typography>
				)}

				{/* Loading state message */}
				{isLoading && (
					<Typography variant="label" className="text-cyan-400 text-center">
						Fetching token info from Sepolia...
					</Typography>
				)}

				{/* Manual Search Button */}
				{address && !foundToken && !isLoading && !error && (
					<Button
						variant="secondary"
						onClick={() => fetchTokenInfo(address)}
						className="w-full"
					>
						Search Token
					</Button>
				)}
			</div>
		</Modal>
	)
}
