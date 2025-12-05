'use client'

import { JSX, useState, useMemo } from 'react'
import { formatUnits, parseUnits } from 'viem'

import Typography from '@/app/ui/Typography'
import { TokenInfo } from '@/app/types/token'
import { cn } from '@/app/utils/cn.util'

type Props = {
	token: TokenInfo
	value: string
	onChange: (value: string) => void
	disabled?: boolean
}

const PERCENTAGES = [25, 50, 75, 100]

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

export default function DepositInput(props: Props): JSX.Element {
	const { token, value, onChange, disabled = false } = props
	const [showPercentages, setShowPercentages] = useState(false)

	// Check if value exceeds balance
	const { exceedsBalance, balanceNum } = useMemo(() => {
		if (!token.balanceRaw || !value) {
			return { exceedsBalance: false, balanceNum: 0 }
		}

		try {
			const balanceFormatted = formatUnits(token.balanceRaw, token.decimals)
			const balNum = parseFloat(balanceFormatted)
			const inputNum = parseFloat(value)

			return {
				exceedsBalance: inputNum > balNum,
				balanceNum: balNum
			}
		} catch {
			return { exceedsBalance: false, balanceNum: 0 }
		}
	}, [token.balanceRaw, token.decimals, value])

	const handlePercentageClick = (percent: number) => {
		if (!token.balanceRaw) return

		const balanceFormatted = formatUnits(token.balanceRaw, token.decimals)
		const balNum = parseFloat(balanceFormatted)
		const amount = (balNum * percent) / 100

		// Format with appropriate decimals
		const formatted =
			amount < 0.0001
				? '0'
				: amount.toLocaleString('en-US', {
						maximumFractionDigits: 6,
						useGrouping: false
					})

		onChange(formatted)
		setShowPercentages(false)
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value
		// Allow only numbers and decimals
		if (val === '' || /^\d*\.?\d*$/.test(val)) {
			onChange(val)
		}
	}

	return (
		<div
			className={cn(
				'relative flex flex-col gap-2 p-4 rounded-xl border transition-all duration-200',
				exceedsBalance
					? 'border-red-500 bg-red-500/5'
					: 'border-gray-700 bg-slate-800/50',
				disabled && 'opacity-50 cursor-not-allowed'
			)}
			onMouseEnter={() => !disabled && setShowPercentages(true)}
			onMouseLeave={() => setShowPercentages(false)}
		>
			{/* Main Row */}
			<div className="flex items-center justify-between">
				<input
					type="text"
					inputMode="decimal"
					placeholder="0"
					value={value}
					onChange={handleInputChange}
					disabled={disabled}
					className={cn(
						'flex-1 text-2xl bg-transparent border-none outline-none',
						exceedsBalance ? 'text-red-400' : 'text-white',
						disabled && 'cursor-not-allowed'
					)}
				/>

				<div className="flex flex-col items-end gap-1">
					<div className="flex items-center gap-2">
						<div
							className={`h-6 w-6 rounded-full bg-gradient-to-br ${getColorFromSymbol(
								token.symbol
							)} flex items-center justify-center text-white font-bold text-[10px]`}
						>
							{getInitials(token.symbol)}
						</div>
						<Typography variant="subtitle" className="text-white">
							{token.symbol}
						</Typography>
					</div>
					<Typography
						variant="label"
						className={cn(
							'text-xs',
							exceedsBalance ? 'text-red-400' : 'text-gray-500'
						)}
					>
						Balance: {token.balance || '0'} {token.symbol}
					</Typography>
				</div>
			</div>

			{/* Error Message */}
			{exceedsBalance && (
				<Typography variant="label" className="text-red-400 text-xs">
					⚠️ Insufficient balance. You only have {token.balance} {token.symbol}
				</Typography>
			)}

			{/* Percentage Buttons (on hover) */}
			{showPercentages && !disabled && token.balanceRaw && token.balanceRaw > 0n && (
				<div className="absolute top-0 right-0 -translate-y-full flex gap-1 pb-2">
					{PERCENTAGES.map(percent => (
						<button
							key={percent}
							onClick={() => handlePercentageClick(percent)}
							className="px-2 py-1 text-xs rounded-lg border border-gray-600 bg-slate-800 text-gray-300 hover:border-cyan-500 hover:text-cyan-400 transition-all duration-150"
						>
							{percent}%
						</button>
					))}
				</div>
			)}
		</div>
	)
}

