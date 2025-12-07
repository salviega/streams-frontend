'use client'

import { JSX, useEffect, useState, useCallback, useRef } from 'react'

import Typography from '@/app/ui/Typography'
import Button from '@/app/ui/Button'
import Container from '@/app/ui/Container'
import { TokenInfo, FeeTier } from '@/app/types/token'
import { suggestInitialPrice, isStablecoin } from '@/app/config/viem'

import DepositInput from '../DepositInput'

type Props = {
	token0: TokenInfo
	token1: TokenInfo
	feeTier: FeeTier
	initialPrice: string
	amount0: string
	amount1: string
	onInitialPriceChange: (value: string) => void
	onAmount0Change: (value: string) => void
	onAmount1Change: (value: string) => void
	onBack: () => void
	onContinue: () => void
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

function getInitials(symbol: string): string {
	if (!symbol) return '??'
	return symbol.slice(0, 2).toUpperCase()
}

export default function Step2(props: Props): JSX.Element {
	const {
		token0,
		token1,
		feeTier,
		initialPrice,
		amount0,
		amount1,
		onInitialPriceChange,
		onAmount0Change,
		onAmount1Change,
		onBack,
		onContinue
	} = props

	const [priceDirection, setPriceDirection] = useState<'token0' | 'token1'>(
		'token1'
	)

	// Track which input is being edited to prevent infinite loops
	const editingRef = useRef<'token0' | 'token1' | 'price' | null>(null)

	// Suggest price for stablecoin pairs
	useEffect(() => {
		if (!initialPrice) {
			const suggested = suggestInitialPrice(token0.symbol, token1.symbol)
			if (suggested) {
				onInitialPriceChange(suggested)
			}
		}
	}, [token0.symbol, token1.symbol, initialPrice, onInitialPriceChange])

	// Get the actual price value based on direction
	const getPriceValue = useCallback((): number => {
		if (!initialPrice) return 0
		const priceNum = parseFloat(initialPrice)
		if (isNaN(priceNum) || priceNum <= 0) return 0
		// Price is always: 1 token0 = X token1
		// If direction is token1, price is direct
		// If direction is token0, price is inverted
		return priceDirection === 'token1' ? priceNum : 1 / priceNum
	}, [initialPrice, priceDirection])

	// Auto-calculate amount1 from amount0 based on price
	const calculateAmount1FromAmount0 = useCallback((amt0: string, price: number): string => {
		if (!amt0 || price <= 0) return ''
		const num = parseFloat(amt0)
		if (isNaN(num) || num <= 0) return ''
		const calculated = num * price
		return calculated.toFixed(6)
	}, [])

	// Auto-calculate amount0 from amount1 based on price
	const calculateAmount0FromAmount1 = useCallback((amt1: string, price: number): string => {
		if (!amt1 || price <= 0) return ''
		const num = parseFloat(amt1)
		if (isNaN(num) || num <= 0) return ''
		const calculated = num / price
		return calculated.toFixed(6)
	}, [])

	// Track last price to detect changes
	const lastPriceRef = useRef<number>(0)

	// Handle price change - recalculate amounts if one is already set
	// Only recalculate when price actually changes, not when amounts change
	useEffect(() => {
		// Skip if we're currently editing price (handled by handleInitialPriceChange)
		if (editingRef.current === 'price') {
			editingRef.current = null
			return
		}

		const price = getPriceValue()
		
		// Only recalculate if price actually changed
		if (price <= 0 || price === lastPriceRef.current) {
			lastPriceRef.current = price
			return
		}

		lastPriceRef.current = price

		// If amount0 is set, recalculate amount1
		if (amount0 && editingRef.current !== 'token0' && editingRef.current !== 'token1') {
			editingRef.current = 'price'
			const calculated = calculateAmount1FromAmount0(amount0, price)
			if (calculated && calculated !== amount1) {
				onAmount1Change(calculated)
			}
			setTimeout(() => { editingRef.current = null }, 0)
		}
		// If amount1 is set, recalculate amount0
		else if (amount1 && editingRef.current !== 'token0' && editingRef.current !== 'token1') {
			editingRef.current = 'price'
			const calculated = calculateAmount0FromAmount1(amount1, price)
			if (calculated && calculated !== amount0) {
				onAmount0Change(calculated)
			}
			setTimeout(() => { editingRef.current = null }, 0)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialPrice, priceDirection]) // Only depend on price, not amounts

	// Handle amount0 change (auto-calculate amount1)
	const handleAmount0Change = useCallback((value: string) => {
		editingRef.current = 'token0'
		onAmount0Change(value)
		const price = getPriceValue()
		if (value && price > 0) {
			const calculatedAmount1 = calculateAmount1FromAmount0(value, price)
			// Only update if different to avoid loops
			if (calculatedAmount1 && calculatedAmount1 !== amount1) {
				onAmount1Change(calculatedAmount1)
			}
		} else if (!value) {
			onAmount1Change('')
		}
		setTimeout(() => { editingRef.current = null }, 0)
	}, [getPriceValue, calculateAmount1FromAmount0, onAmount0Change, onAmount1Change, amount1])

	// Handle amount1 change (auto-calculate amount0)
	const handleAmount1Change = useCallback((value: string) => {
		editingRef.current = 'token1'
		onAmount1Change(value)
		const price = getPriceValue()
		if (value && price > 0) {
			const calculatedAmount0 = calculateAmount0FromAmount1(value, price)
			// Only update if different to avoid loops
			if (calculatedAmount0 && calculatedAmount0 !== amount0) {
				onAmount0Change(calculatedAmount0)
			}
		} else if (!value) {
			onAmount0Change('')
		}
		setTimeout(() => { editingRef.current = null }, 0)
	}, [getPriceValue, calculateAmount0FromAmount1, onAmount0Change, onAmount1Change, amount0])

	// Handle price change
	const handleInitialPriceChange = useCallback((value: string) => {
		editingRef.current = 'price'
		onInitialPriceChange(value)
		setTimeout(() => { editingRef.current = null }, 0)
	}, [onInitialPriceChange])

	// Check if both are stablecoins
	const bothStablecoins = isStablecoin(token0.symbol) && isStablecoin(token1.symbol)

	// Check if amounts exceed balances - remove commas from formatted balance
	const amount0Exceeds =
		token0.balanceRaw && amount0
			? parseFloat(amount0) >
				parseFloat((token0.balance || '0').replace(/,/g, ''))
			: false

	const amount1Exceeds =
		token1.balanceRaw && amount1
			? parseFloat(amount1) >
				parseFloat((token1.balance || '0').replace(/,/g, ''))
			: false

	const canContinue =
		initialPrice &&
		amount0 &&
		amount1 &&
		!amount0Exceeds &&
		!amount1Exceeds &&
		parseFloat(amount0) > 0 &&
		parseFloat(amount1) > 0

	// Price display text
	const priceDisplayText =
		priceDirection === 'token1'
			? `1 ${token0.symbol} = ${initialPrice || '0'} ${token1.symbol}`
			: `1 ${token1.symbol} = ${initialPrice ? (1 / parseFloat(initialPrice)).toFixed(6) : '0'} ${token0.symbol}`

	return (
		<Container variant="default" className="flex flex-col gap-6">
			{/* Step 1 Summary */}
			<div className="flex items-center justify-between pb-4 border-b border-gray-700">
				<div className="flex items-center gap-3">
					{/* Token Pair Icons */}
					<div className="flex -space-x-2">
						<div
							className={`h-8 w-8 rounded-full bg-gradient-to-br ${getColorFromSymbol(
								token0.symbol
							)} flex items-center justify-center text-white font-bold text-xs border-2 border-slate-900 z-10`}
						>
							{getInitials(token0.symbol)}
						</div>
						<div
							className={`h-8 w-8 rounded-full bg-gradient-to-br ${getColorFromSymbol(
								token1.symbol
							)} flex items-center justify-center text-white font-bold text-xs border-2 border-slate-900`}
						>
							{getInitials(token1.symbol)}
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Typography variant="subtitle" className="text-white">
							{token0.symbol} / {token1.symbol}
						</Typography>
						<span className="px-2 py-0.5 rounded bg-slate-700 text-gray-400 text-xs">
							v4
						</span>
						<span className="px-2 py-0.5 rounded bg-slate-700 text-gray-400 text-xs">
							{feeTier.label}
						</span>
					</div>
				</div>

				<Button variant="ghost" size="sm" onClick={onBack}>
					✏️ Edit
				</Button>
			</div>

			{/* Creating New Pool Notice */}
			<div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
				<div className="h-5 w-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs">
					ℹ
				</div>
				<div className="flex flex-col gap-1">
					<Typography variant="subtitle" className="text-cyan-400 text-sm">
						Creating new pool
					</Typography>
					<Typography variant="label" className="text-gray-400 text-xs">
						Your selections will create a new liquidity pool which may result in
						lower initial liquidity and increased volatility. Consider adding to an
						existing pool to minimize these risks.
					</Typography>
				</div>
			</div>

			{/* Set Initial Price */}
			<div className="flex flex-col gap-3 p-4 rounded-xl border border-gray-700 bg-slate-800/30">
				<Typography variant="subtitle" className="text-white">
					Set initial price
				</Typography>
				<Typography variant="label" className="text-gray-400 text-xs">
					When creating a new pool, you must set the starting exchange rate for
					both tokens. This rate will reflect the initial market price.
				</Typography>

				<div className="flex flex-col gap-2">
					<Typography variant="label" className="text-gray-500 text-xs">
						Initial price
					</Typography>

					<div className="flex items-center gap-3">
						<input
							type="text"
							inputMode="decimal"
							placeholder="0"
							value={initialPrice}
							onChange={e => {
								const val = e.target.value
								if (val === '' || /^\d*\.?\d*$/.test(val)) {
									handleInitialPriceChange(val)
								}
							}}
							className="flex-1 text-2xl bg-transparent border-none outline-none text-white"
						/>

						{/* Price Toggle */}
						<div className="flex rounded-lg border border-gray-700 overflow-hidden">
							<button
								onClick={() => setPriceDirection('token1')}
								className={`px-3 py-1.5 text-sm transition-colors ${
									priceDirection === 'token1'
										? 'bg-slate-700 text-white'
										: 'bg-slate-800 text-gray-400 hover:text-white'
								}`}
							>
								{token1.symbol}
							</button>
							<button
								onClick={() => setPriceDirection('token0')}
								className={`px-3 py-1.5 text-sm transition-colors ${
									priceDirection === 'token0'
										? 'bg-slate-700 text-white'
										: 'bg-slate-800 text-gray-400 hover:text-white'
								}`}
							>
								{token0.symbol}
							</button>
						</div>
					</div>

					<Typography variant="label" className="text-gray-500 text-xs">
						{priceDisplayText}
					</Typography>
				</div>

				{/* Stablecoin suggestion */}
				{bothStablecoins && (
					<div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
						<span className="text-green-500">💡</span>
						<Typography variant="label" className="text-green-400 text-xs">
							Stablecoin pair detected. Suggested price: 1:1 ratio.
						</Typography>
					</div>
				)}

				{/* Warning */}
				{!bothStablecoins && (
					<div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
						<span className="text-yellow-500">⚠</span>
						<Typography variant="label" className="text-yellow-400 text-xs">
							Market price not found. Please do your own research to avoid loss
							of funds.
						</Typography>
					</div>
				)}
			</div>

			{/* Deposit Tokens */}
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-1">
					<Typography variant="subtitle" className="text-white">
						Deposit tokens
					</Typography>
					<Typography variant="label" className="text-gray-400 text-xs">
						Specify the token amounts for your liquidity contribution. Hover to
						select a percentage of your balance.
					</Typography>
				</div>

				{/* Token 0 Input */}
				<DepositInput
					token={token0}
					value={amount0}
					onChange={handleAmount0Change}
				/>

				{/* Token 1 Input */}
				<DepositInput
					token={token1}
					value={amount1}
					onChange={handleAmount1Change}
				/>
			</div>

			{/* Continue Button */}
			<Button
				variant={canContinue ? 'primary' : 'secondary'}
				size="lg"
				disabled={!canContinue}
				onClick={onContinue}
				className="w-full"
			>
				{amount0Exceeds || amount1Exceeds
					? 'Insufficient balance'
					: canContinue
						? 'Continue'
						: 'Enter an amount'}
			</Button>
		</Container>
	)
}
