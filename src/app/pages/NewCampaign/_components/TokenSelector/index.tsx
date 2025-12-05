'use client'

import { JSX } from 'react'

import { TokenInfo } from '@/app/types/token'
import { cn } from '@/app/utils/cn.util'

type Props = {
	token: TokenInfo | null
	onClick: () => void
	placeholder?: string
	className?: string
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

export default function TokenSelector(props: Props): JSX.Element {
	const { token, onClick, placeholder = 'Choose token', className = '' } = props

	return (
		<button
			onClick={onClick}
			className={cn(
				'flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-gray-700 bg-slate-800/50',
				'hover:border-gray-600 hover:bg-slate-800 transition-all duration-200',
				'min-w-[160px]',
				className
			)}
		>
			{token ? (
				<div className="flex items-center gap-2">
					{/* Token Logo */}
					<div
						className={`h-6 w-6 rounded-full bg-gradient-to-br ${getColorFromSymbol(
							token.symbol
						)} flex items-center justify-center text-white font-bold text-[10px]`}
					>
						{getInitials(token.symbol)}
					</div>
					<span className="text-white font-medium">{token.symbol}</span>
				</div>
			) : (
				<span className="text-gray-400">{placeholder}</span>
			)}

			{/* Chevron */}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="h-4 w-4 text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M19 9l-7 7-7-7"
				/>
			</svg>
		</button>
	)
}

