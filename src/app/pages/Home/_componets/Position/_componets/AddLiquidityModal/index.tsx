'use client'

import { JSX, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { formatUnits, Address } from 'viem'
import { useActiveAccount } from 'thirdweb/react'

import Modal from '@/app/ui/Modal'
import Button from '@/app/ui/Button'
import Typography from '@/app/ui/Typography'
import Container from '@/app/ui/Container'
import TokenAvatar, { TokenPair } from '@/app/ui/TokenAvatar'
import { CampaignWithMeta } from '@/app/hooks/useCampaigns'
import { useAddLiquidity } from '@/app/hooks/useAddLiquidity'
import { sepoliaClient, erc20Abi } from '@/app/config/viem'
import { STREAMER_ADDRESS } from '@/app/config/const/contracts'

type Props = {
	isOpen: boolean
	onClose: () => void
	campaign: CampaignWithMeta
	onSuccess?: () => void
}

type TokenBalance = {
	raw: bigint
	formatted: string
}

const PERCENTAGES = [25, 50, 75] as const

export default function AddLiquidityModal(props: Props): JSX.Element {
	const { isOpen, onClose, campaign, onSuccess } = props

	const account = useActiveAccount()
	const userAddress = account?.address as Address | undefined

	const [amount0, setAmount0] = useState('')
	const [amount1, setAmount1] = useState('')
	const [balance0, setBalance0] = useState<TokenBalance>({ raw: BigInt(0), formatted: '0' })
	const [balance1, setBalance1] = useState<TokenBalance>({ raw: BigInt(0), formatted: '0' })
	const [poolPrice, setPoolPrice] = useState<number>(0) // price of token0 in terms of token1
	const [priceLoading, setPriceLoading] = useState(true)
	const [showSuccess, setShowSuccess] = useState(false) // Local state to keep success visible
	const [confirmedTxHash, setConfirmedTxHash] = useState<string | null>(null)
	const [confirmedAmounts, setConfirmedAmounts] = useState<{ amount0: string; amount1: string } | null>(null)
	const [hasCalledOnSuccess, setHasCalledOnSuccess] = useState(false) // Prevent multiple onSuccess calls
	
	// Track which input is being edited to prevent infinite loops
	const editingRef = useRef<'token0' | 'token1' | null>(null)

	const { 
		addLiquidity, 
		isPending, 
		isSuccess, 
		isFailed,
		error, 
		txHash, 
		batchId,
		status, 
		txStatus,
		reset 
	} = useAddLiquidity()

	// Fee percent
	const feePercent = (campaign.pool.fee / 10000).toFixed(2)

	// Token decimals
	const token0Decimals = campaign.token0Decimals ?? (campaign.token0Symbol.includes('USD') ? 6 : 18)
	const token1Decimals = campaign.token1Decimals ?? (campaign.token1Symbol.includes('USD') ? 6 : 18)

	// Fetch pool price from Streamer balances
	const fetchPoolPrice = useCallback(async () => {
		setPriceLoading(true)
		try {
			// Get token balances in the Streamer contract to estimate price
			const [streamerBal0, streamerBal1] = await Promise.all([
				sepoliaClient.readContract({
					address: campaign.pool.currency0 as Address,
					abi: erc20Abi,
					functionName: 'balanceOf',
					args: [STREAMER_ADDRESS]
				}),
				sepoliaClient.readContract({
					address: campaign.pool.currency1 as Address,
					abi: erc20Abi,
					functionName: 'balanceOf',
					args: [STREAMER_ADDRESS]
				})
			])

			// Calculate price: how many token1 per token0
			const bal0Normalized = parseFloat(formatUnits(streamerBal0, token0Decimals))
			const bal1Normalized = parseFloat(formatUnits(streamerBal1, token1Decimals))

			if (bal0Normalized > 0 && bal1Normalized > 0) {
				const price = bal1Normalized / bal0Normalized
				setPoolPrice(price)
			} else {
				// Default to 1:1 ratio if no liquidity (for new pools or stablecoin pairs)
				setPoolPrice(1)
			}
		} catch (e) {
			setPoolPrice(1) // Default to 1:1
		} finally {
			setPriceLoading(false)
		}
	}, [campaign.pool.currency0, campaign.pool.currency1, token0Decimals, token1Decimals, campaign.token0Symbol, campaign.token1Symbol])

	// Fetch user balances
	const fetchBalances = useCallback(async () => {
		if (!userAddress) return

		try {
			const [bal0, bal1] = await Promise.all([
				sepoliaClient.readContract({
					address: campaign.pool.currency0 as Address,
					abi: erc20Abi,
					functionName: 'balanceOf',
					args: [userAddress]
				}),
				sepoliaClient.readContract({
					address: campaign.pool.currency1 as Address,
					abi: erc20Abi,
					functionName: 'balanceOf',
					args: [userAddress]
				})
			])

			setBalance0({
				raw: bal0,
				formatted: parseFloat(formatUnits(bal0, token0Decimals)).toLocaleString('en-US', {
					maximumFractionDigits: 2
				})
			})
			setBalance1({
				raw: bal1,
				formatted: parseFloat(formatUnits(bal1, token1Decimals)).toLocaleString('en-US', {
					maximumFractionDigits: 2
				})
			})
		} catch (e) {
			// Silently fail - balances will remain at 0
		}
	}, [userAddress, campaign.pool.currency0, campaign.pool.currency1, token0Decimals, token1Decimals])

	useEffect(() => {
		if (isOpen) {
			fetchPoolPrice()
			if (userAddress) {
				fetchBalances()
			}
		}
	}, [isOpen, userAddress, fetchBalances, fetchPoolPrice])

	// Handle success - store values locally but DON'T call onSuccess yet (causes unmount)
	useEffect(() => {
		if (isSuccess && !showSuccess) {
			// Store the confirmed values locally so they persist
			setShowSuccess(true)
			setConfirmedTxHash(txHash)
			setConfirmedAmounts({ amount0, amount1 })
			// Only refetch balances - don't call onSuccess yet as it causes re-mount
			fetchBalances()
		}
	}, [isSuccess, showSuccess, txHash, amount0, amount1, fetchBalances])

	// Validation
	const { isValid, errorMessage } = useMemo(() => {
		if (!amount0 || !amount1) {
			return { isValid: false, errorMessage: null }
		}

		const num0 = parseFloat(amount0)
		const num1 = parseFloat(amount1)

		if (isNaN(num0) || isNaN(num1) || num0 <= 0 || num1 <= 0) {
			return { isValid: false, errorMessage: 'Enter valid amounts' }
		}

		const bal0Num = parseFloat(formatUnits(balance0.raw, token0Decimals))
		const bal1Num = parseFloat(formatUnits(balance1.raw, token1Decimals))

		if (num0 > bal0Num) {
			return { isValid: false, errorMessage: `Insufficient ${campaign.token0Symbol} balance` }
		}

		if (num1 > bal1Num) {
			return { isValid: false, errorMessage: `Insufficient ${campaign.token1Symbol} balance` }
		}

		return { isValid: true, errorMessage: null }
	}, [amount0, amount1, balance0.raw, balance1.raw, token0Decimals, token1Decimals, campaign.token0Symbol, campaign.token1Symbol])

	// Auto-calculate corresponding amount based on pool price
	const calculateAmount1FromAmount0 = useCallback((amt0: string): string => {
		if (!amt0 || poolPrice <= 0) return ''
		const num = parseFloat(amt0)
		if (isNaN(num) || num <= 0) return ''
		const calculated = num * poolPrice
		return calculated.toFixed(6)
	}, [poolPrice])

	const calculateAmount0FromAmount1 = useCallback((amt1: string): string => {
		if (!amt1 || poolPrice <= 0) return ''
		const num = parseFloat(amt1)
		if (isNaN(num) || num <= 0) return ''
		const calculated = num / poolPrice
		return calculated.toFixed(6)
	}, [poolPrice])

	// Handle amount0 change (auto-calculate amount1)
	const handleAmount0Change = useCallback((value: string) => {
		setAmount0(value)
		if (value && poolPrice > 0) {
			editingRef.current = 'token0'
			const calculatedAmount1 = calculateAmount1FromAmount0(value)
			setAmount1(calculatedAmount1)
			// Reset editing ref after state update
			setTimeout(() => { editingRef.current = null }, 0)
		} else if (!value) {
			setAmount1('')
		}
	}, [calculateAmount1FromAmount0, poolPrice])

	// Handle amount1 change (auto-calculate amount0)
	const handleAmount1Change = useCallback((value: string) => {
		setAmount1(value)
		if (value && poolPrice > 0) {
			editingRef.current = 'token1'
			const calculatedAmount0 = calculateAmount0FromAmount1(value)
			setAmount0(calculatedAmount0)
			setTimeout(() => { editingRef.current = null }, 0)
		} else if (!value) {
			setAmount0('')
		}
	}, [calculateAmount0FromAmount1, poolPrice])

	// Handle percentage click
	const handlePercentage0 = (percent: number) => {
		const bal = parseFloat(formatUnits(balance0.raw, token0Decimals))
		const amount = (bal * percent) / 100
		handleAmount0Change(amount.toString())
	}

	const handlePercentage1 = (percent: number) => {
		const bal = parseFloat(formatUnits(balance1.raw, token1Decimals))
		const amount = (bal * percent) / 100
		handleAmount1Change(amount.toString())
	}

	const handleMaxAmount0 = () => {
		const bal = formatUnits(balance0.raw, token0Decimals)
		handleAmount0Change(bal)
	}

	const handleMaxAmount1 = () => {
		const bal = formatUnits(balance1.raw, token1Decimals)
		handleAmount1Change(bal)
	}

	// Handle submit
	const handleAddLiquidity = async () => {
		await addLiquidity({
			campaign,
			amount0,
			amount1,
			token0Decimals,
			token1Decimals
		})
		// Success/failure will be handled by the hook's isSuccess/isFailed states
	}

	// Handle close
	const handleClose = () => {
		// If we had a successful tx, call onSuccess now (when user manually closes)
		if (showSuccess && !hasCalledOnSuccess) {
			setHasCalledOnSuccess(true)
			onSuccess?.()
		}
		setAmount0('')
		setAmount1('')
		setShowSuccess(false)
		setConfirmedTxHash(null)
		setConfirmedAmounts(null)
		setHasCalledOnSuccess(false)
		reset()
		onClose()
	}

	// Input handler for token0
	const handleInput0Change = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value
		if (val === '' || /^\d*\.?\d*$/.test(val)) {
			handleAmount0Change(val)
		}
	}

	// Input handler for token1
	const handleInput1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value
		if (val === '' || /^\d*\.?\d*$/.test(val)) {
			handleAmount1Change(val)
		}
	}

	return (
		<Modal isOpen={isOpen} onClose={handleClose} size="lg" className="max-w-md">
			{/* Header */}
			<div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-700">
				<button
					onClick={handleClose}
					className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors"
				>
					<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
				<Typography variant="title" className="text-lg text-white">
					Add liquidity
				</Typography>
				<button className="p-2 rounded-lg border border-gray-700 bg-slate-800/50 text-gray-400 hover:text-white transition-colors">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				</button>
			</div>

			{/* Pending State - Waiting for wallet or confirmation */}
			{(txStatus === 'waiting_wallet' || txStatus === 'pending') && (
				<div className="flex flex-col items-center justify-center gap-4 py-8">
					{/* Loading spinner */}
					<div className="relative">
						<div className="h-20 w-20 rounded-full border-4 border-cyan-500/30 flex items-center justify-center">
							<div className="h-16 w-16 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
						</div>
					</div>

					<Typography variant="title" className="text-cyan-400 text-xl">
						{txStatus === 'waiting_wallet' ? 'Confirm in Wallet' : 'Transaction Pending'}
					</Typography>

					<Typography variant="label" className="text-gray-400 text-center">
						{txStatus === 'waiting_wallet' 
							? 'Please confirm the transaction in your wallet...'
							: 'Waiting for blockchain confirmation...'}
					</Typography>

					{/* Show batch ID if available */}
					{batchId && (
						<div className="w-full p-3 rounded-lg bg-slate-800/30 border border-gray-700">
							<div className="flex items-center justify-between">
								<Typography variant="label" className="text-gray-400 text-xs">
									Batch ID
								</Typography>
								<Typography variant="label" className="text-cyan-400 font-mono text-xs">
									{batchId.slice(0, 8)}...{batchId.slice(-6)}
								</Typography>
							</div>
						</div>
					)}

					{/* Amount being added */}
					<div className="w-full p-4 rounded-xl bg-slate-800/50 border border-cyan-500/30">
						<Typography variant="label" className="text-gray-400 text-xs mb-2">Adding:</Typography>
						<div className="flex justify-between items-center mb-1">
							<div className="flex items-center gap-2">
								<TokenAvatar symbol={campaign.token0Symbol} size="sm" />
								<Typography variant="label" className="text-white">
									{amount0} {campaign.token0Symbol}
								</Typography>
							</div>
						</div>
						<div className="flex justify-between items-center">
							<div className="flex items-center gap-2">
								<TokenAvatar symbol={campaign.token1Symbol} size="sm" />
								<Typography variant="label" className="text-white">
									{amount1} {campaign.token1Symbol}
								</Typography>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Success State - uses local state to persist */}
			{showSuccess && (
				<div className="flex flex-col items-center justify-center gap-4 py-8">
					{/* Success Icon with animation */}
					<div className="relative">
						<div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
							<span className="text-5xl">🎉</span>
						</div>
						<div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
							<svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
							</svg>
						</div>
					</div>

					<Typography variant="title" className="text-green-400 text-xl">
						Liquidity Added Successfully!
					</Typography>

					{/* Amount Summary - use confirmed amounts */}
					<div className="w-full p-4 rounded-xl bg-slate-800/50 border border-green-500/30">
						<div className="flex justify-between items-center mb-2">
							<div className="flex items-center gap-2">
								<TokenAvatar symbol={campaign.token0Symbol} size="sm" />
								<Typography variant="label" className="text-white">
									{confirmedAmounts?.amount0 || amount0} {campaign.token0Symbol}
								</Typography>
							</div>
							<Typography variant="label" className="text-green-400">+</Typography>
						</div>
						<div className="flex justify-between items-center">
							<div className="flex items-center gap-2">
								<TokenAvatar symbol={campaign.token1Symbol} size="sm" />
								<Typography variant="label" className="text-white">
									{confirmedAmounts?.amount1 || amount1} {campaign.token1Symbol}
								</Typography>
							</div>
							<Typography variant="label" className="text-green-400">+</Typography>
						</div>
					</div>

					{/* Transaction Info - use confirmed txHash */}
					{(confirmedTxHash || txHash) && (
						<div className="w-full flex flex-col gap-2">
							<div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-gray-700">
								<Typography variant="label" className="text-gray-400 text-xs">
									Transaction Hash
								</Typography>
								<Typography variant="label" className="text-cyan-400 font-mono text-xs">
									{(confirmedTxHash || txHash)?.slice(0, 8)}...{(confirmedTxHash || txHash)?.slice(-6)}
								</Typography>
							</div>
							<a
								href={`https://sepolia.etherscan.io/tx/${confirmedTxHash || txHash}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center justify-center gap-2 p-3 rounded-xl border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
							>
								<span>View on Etherscan</span>
								<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
								</svg>
							</a>
						</div>
					)}

					{/* Info message */}
					<Typography variant="label" className="text-gray-500 text-xs text-center">
						Your position has been updated.
					</Typography>

					{/* Close button */}
					<Button
						variant="secondary"
						size="md"
						className="w-full mt-2"
						onClick={handleClose}
					>
						Close
					</Button>
				</div>
			)}

			{/* Failed State */}
			{isFailed && (
				<div className="flex flex-col items-center justify-center gap-4 py-8">
					<div className="h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center">
						<span className="text-5xl">❌</span>
					</div>
					<Typography variant="title" className="text-red-400 text-xl">
						Transaction Failed
					</Typography>
					<Typography variant="label" className="text-gray-400 text-center">
						{error || 'The transaction could not be completed. Please try again.'}
					</Typography>
					<Button
						variant="secondary"
						size="md"
						className="w-full mt-2"
						onClick={reset}
					>
						Try Again
					</Button>
				</div>
			)}

			{/* Form State */}
			{txStatus === 'idle' && !showSuccess && !isFailed && (
				<>
					{/* Pool Info */}
					<div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-gray-700 mb-4">
						<TokenPair symbol0={campaign.token0Symbol} symbol1={campaign.token1Symbol} size="md" />
						<div className="flex-1">
							<Typography variant="subtitle" className="text-white font-medium">
								{campaign.token0Symbol} / {campaign.token1Symbol}
							</Typography>
							<div className="flex items-center gap-2 mt-0.5">
								<span className="text-xs text-gray-400">v4</span>
								<span className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] text-gray-400">
									{feePercent}%
								</span>
								<span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px]">
									● In range
								</span>
							</div>
						</div>
					</div>

					{/* Status/Error */}
					{status && isPending && (
						<div className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
							<div className="flex items-center gap-3">
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
								<Typography variant="label" className="text-cyan-400 text-sm">
									{status}
								</Typography>
							</div>
						</div>
					)}

					{error && (
						<div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
							<Typography variant="label" className="text-red-400 text-sm">
								❌ {error}
							</Typography>
						</div>
					)}

					{/* Token 0 Input */}
					<div className="relative mb-2">
						<Container variant="none" className="p-4 rounded-xl border border-gray-700 bg-slate-800/30">
							<div className="flex items-center justify-between mb-2">
								<input
									type="text"
									inputMode="decimal"
									placeholder="0"
									value={amount0}
									onChange={handleInput0Change}
									disabled={priceLoading}
									className="flex-1 text-2xl bg-transparent border-none outline-none text-white w-20 disabled:opacity-50"
								/>
								<div className="flex items-center gap-2">
									<TokenAvatar symbol={campaign.token0Symbol} size="sm" />
									<Typography variant="subtitle" className="text-white font-medium">
										{campaign.token0Symbol}
									</Typography>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex gap-1">
									{PERCENTAGES.map(p => (
										<button
											key={p}
											onClick={() => handlePercentage0(p)}
											className="px-2 py-0.5 text-xs rounded border border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
										>
											{p}%
										</button>
									))}
									<button
										onClick={handleMaxAmount0}
										className="px-2 py-0.5 text-xs rounded border border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
									>
										Max
									</button>
								</div>
								<Typography variant="label" className="text-gray-500 text-xs">
									{balance0.formatted} {campaign.token0Symbol}
								</Typography>
							</div>
						</Container>
					</div>

					{/* Token 1 Input */}
					<div className="relative mb-4">
						<Container variant="none" className="p-4 rounded-xl border border-gray-700 bg-slate-800/30">
							<div className="flex items-center justify-between mb-2">
								<input
									type="text"
									inputMode="decimal"
									placeholder="0"
									value={amount1}
									onChange={handleInput1Change}
									disabled={priceLoading}
									className="flex-1 text-2xl bg-transparent border-none outline-none text-white w-20 disabled:opacity-50"
								/>
								<div className="flex items-center gap-2">
									<TokenAvatar symbol={campaign.token1Symbol} size="sm" />
									<Typography variant="subtitle" className="text-white font-medium">
										{campaign.token1Symbol}
									</Typography>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex gap-1">
									{PERCENTAGES.map(p => (
										<button
											key={p}
											onClick={() => handlePercentage1(p)}
											className="px-2 py-0.5 text-xs rounded border border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
										>
											{p}%
										</button>
									))}
									<button
										onClick={handleMaxAmount1}
										className="px-2 py-0.5 text-xs rounded border border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
									>
										Max
									</button>
								</div>
								<Typography variant="label" className="text-gray-500 text-xs">
									{balance1.formatted} {campaign.token1Symbol}
								</Typography>
							</div>
						</Container>
					</div>

					{/* Pool Price Info */}
					<div className="p-3 rounded-xl bg-slate-800/30 border border-gray-700 mb-4">
						<div className="flex justify-between items-center mb-2">
							<Typography variant="label" className="text-gray-400 text-sm">
								Pool Rate
							</Typography>
							{priceLoading ? (
								<div className="flex items-center gap-2">
									<div className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
									<Typography variant="label" className="text-gray-500 text-sm">
										Loading...
									</Typography>
								</div>
							) : (
								<Typography variant="label" className="text-cyan-400 text-sm">
									1 {campaign.token0Symbol} = {poolPrice.toFixed(5)} {campaign.token1Symbol}
								</Typography>
							)}
						</div>
						<div className="flex justify-between items-center mb-2">
							<Typography variant="label" className="text-gray-400 text-sm">
								{campaign.token0Symbol} position
							</Typography>
							<Typography variant="label" className="text-white text-sm">
								{amount0 || '0'} {campaign.token0Symbol}
							</Typography>
						</div>
						<div className="flex justify-between items-center">
							<Typography variant="label" className="text-gray-400 text-sm">
								{campaign.token1Symbol} position
							</Typography>
							<Typography variant="label" className="text-white text-sm">
								{amount1 || '0'} {campaign.token1Symbol}
							</Typography>
						</div>
					</div>

					{/* Error Message */}
					{errorMessage && (
						<Typography variant="label" className="text-red-400 text-sm mb-4 block text-center">
							⚠️ {errorMessage}
						</Typography>
					)}

					{/* Submit Button */}
					<Button
						variant="primary"
						size="lg"
						className="w-full"
						onClick={handleAddLiquidity}
						disabled={!isValid || isPending}
					>
						{isPending ? (
							<div className="flex items-center gap-2">
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
								Processing...
							</div>
						) : !amount0 && !amount1 ? (
							'Enter an amount'
						) : !isValid ? (
							errorMessage || 'Invalid input'
						) : (
							'Add Liquidity'
						)}
					</Button>
				</>
			)}
		</Modal>
	)
}

