import { JSX } from 'react'

import { cn } from '@/app/utils/cn.util'

const variants = {
	none: '',
	title: 'text-lg font-bold',
	subtitle: 'text-md font-medium',
	label: 'text-sm'
}

type Props = {
	children: React.ReactNode
	variant?: keyof typeof variants
	className?: string
}

export default function Typography(props: Props): JSX.Element {
	const { children, variant = 'none', className = '' } = props

	return (
		<div>
			<h1 className={cn(variants[variant], className)}>{children}</h1>
		</div>
	)
}
