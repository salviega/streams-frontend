import { JSX } from 'react'

import { cn } from '@/app/utils/cn.util'

const variants = {
	primary:
		'bg-cyan-500/10 border-cyan-500 text-cyan-400 hover:bg-cyan-500/20',
	secondary:
		'bg-slate-800 border-gray-600 text-white hover:bg-slate-700',
	ghost:
		'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-slate-800',
	danger:
		'bg-red-500/10 border-red-500 text-red-400 hover:bg-red-500/20',
	success:
		'bg-green-500/10 border-green-500 text-green-400 hover:bg-green-500/20'
}

const sizes = {
	sm: 'px-3 py-1.5 text-xs',
	md: 'px-4 py-2 text-sm',
	lg: 'px-6 py-3 text-base'
}

type Props = {
	children: React.ReactNode
	variant?: keyof typeof variants
	size?: keyof typeof sizes
	className?: string
	disabled?: boolean
	onClick?: () => void
	type?: 'button' | 'submit' | 'reset'
}

export default function Button(props: Props): JSX.Element {
	const {
		children,
		variant = 'primary',
		size = 'md',
		className = '',
		disabled = false,
		onClick,
		type = 'button'
	} = props

	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={cn(
				'rounded-xl border font-medium transition-all duration-200',
				variants[variant],
				sizes[size],
				disabled && 'opacity-50 cursor-not-allowed',
				className
			)}
		>
			{children}
		</button>
	)
}

