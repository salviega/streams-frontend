import { JSX } from 'react'

import { cn } from '@/app/utils/cn.util'

type Props = {
	value: number
	max?: number
	className?: string
}

export default function Progress(props: Props): JSX.Element {
	const { value, max = 100, className = '' } = props
	const percentage = Math.min(100, Math.round((value / max) * 100))

	return (
		<div
			className={cn(
				'h-[5px] w-full overflow-hidden rounded-full bg-gray-800',
				className
			)}
		>
			<div
				className="h-full bg-linear-to-r from-cyan-400 to-indigo-600 transition-all duration-300"
				style={{ width: `${percentage}%` }}
			/>
		</div>
	)
}

