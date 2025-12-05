'use client'

import { JSX } from 'react'

import { cn } from '@/app/utils/cn.util'

type Props = {
	symbol: string
	size?: 'sm' | 'md' | 'lg'
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

const sizeClasses = {
	sm: 'h-5 w-5 text-[8px]',
	md: 'h-7 w-7 text-[10px]',
	lg: 'h-10 w-10 text-sm'
}

export default function TokenAvatar(props: Props): JSX.Element {
	const { symbol, size = 'md', className = '' } = props

	return (
		<div
			className={cn(
				'rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shadow-lg',
				getColorFromSymbol(symbol),
				sizeClasses[size],
				className
			)}
		>
			{getInitials(symbol)}
		</div>
	)
}

// Pair component for showing two tokens overlapped
type PairProps = {
	symbol0: string
	symbol1: string
	size?: 'sm' | 'md' | 'lg'
	className?: string
}

export function TokenPair(props: PairProps): JSX.Element {
	const { symbol0, symbol1, size = 'md', className = '' } = props

	return (
		<div className={cn('flex items-center', className)}>
			<TokenAvatar symbol={symbol0} size={size} />
			<TokenAvatar symbol={symbol1} size={size} className="-ml-2 ring-2 ring-slate-900" />
		</div>
	)
}

