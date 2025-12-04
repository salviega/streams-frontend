import { JSX } from 'react'

import { cn } from '@/app/utils/cn.util'

const variants = {
	default: 'border border-gray-600',
	none: 'border-none',
	rounded: 'rounded-full border border-gray-600'
}

type Props = {
	children: React.ReactNode
	variant?: keyof typeof variants
	className?: string
	onClick?: () => void
}

export default function Container(props: Props): JSX.Element {
	const { children, variant = 'default', className = '', onClick } = props

	return (
		<div
			className={cn('w-full p-6 rounded-3xl', variants[variant], className)}
			onClick={onClick}
		>
			{children}
		</div>
	)
}
