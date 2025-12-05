'use client'

import { JSX, useState } from 'react'

import Typography from '@/app/ui/Typography'
import { FeeTier } from '@/app/types/token'
import { UNISWAP_V4_TIERS } from '@/app/config/const/uniswap'
import { cn } from '@/app/utils/cn.util'

type Props = {
	selected: FeeTier | null
	onSelect: (tier: FeeTier) => void
}

export default function FeeTierSelector(props: Props): JSX.Element {
	const { selected, onSelect } = props
	const [isExpanded, setIsExpanded] = useState(false)

	return (
		<div className="flex flex-col gap-3">
			{/* Header */}
			<div className="flex flex-col gap-1">
				<Typography variant="subtitle" className="text-white">
					Fee tier
				</Typography>
				<Typography variant="label" className="text-gray-400">
					The amount earned providing liquidity. Choose an amount that suits your
					risk tolerance and strategy.
				</Typography>
			</div>

			{/* Collapsed View */}
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="flex items-center justify-between p-4 rounded-xl border border-gray-700 bg-slate-800/50 hover:border-gray-600 transition-colors"
			>
				<div className="flex flex-col items-start">
					<Typography variant="label" className="text-gray-400">
						{selected ? selected.label : '-- fee tier'}
					</Typography>
					<Typography variant="label" className="text-gray-500 text-xs">
						The % you will earn in fees
					</Typography>
				</div>
				<div className="flex items-center gap-2 text-gray-400">
					<span className="text-sm">{isExpanded ? 'Less' : 'More'}</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className={cn(
							'h-4 w-4 transition-transform duration-200',
							isExpanded && 'rotate-180'
						)}
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
				</div>
			</button>

			{/* Expanded Options */}
			{isExpanded && (
				<div className="grid grid-cols-4 gap-2">
					{UNISWAP_V4_TIERS.map(tier => {
						const isSelected = selected?.fee === tier.fee

						return (
							<button
								key={tier.fee}
								onClick={() => {
									onSelect(tier)
									setIsExpanded(false)
								}}
								className={cn(
									'flex flex-col gap-2 p-4 rounded-xl border transition-all duration-200',
									isSelected
										? 'border-cyan-500 bg-cyan-500/10'
										: 'border-gray-700 bg-slate-800/50 hover:border-gray-600'
								)}
							>
								<Typography
									variant="subtitle"
									className={cn(
										'font-semibold',
										isSelected ? 'text-cyan-400' : 'text-white'
									)}
								>
									{tier.label}
								</Typography>
								<Typography variant="label" className="text-gray-400 text-xs">
									{tier.description}
								</Typography>
								<Typography variant="label" className="text-gray-500 text-xs mt-auto">
									0 TVL
								</Typography>
							</button>
						)
					})}
				</div>
			)}

			{/* Advanced Search */}
			{isExpanded && (
				<Typography variant="label" className="text-gray-500 text-xs flex items-center gap-1">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-3 w-3"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					Search or create other fee tiers (Advanced)
				</Typography>
			)}
		</div>
	)
}

