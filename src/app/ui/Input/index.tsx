'use client'

import { JSX, InputHTMLAttributes } from 'react'

import { cn } from '@/app/utils/cn.util'

type Props = InputHTMLAttributes<HTMLInputElement> & {
	label?: string
	error?: string
	hint?: string
}

export default function Input(props: Props): JSX.Element {
	const { label, error, hint, className = '', ...inputProps } = props

	return (
		<div className="flex flex-col gap-1.5">
			{label && (
				<label className="text-sm text-gray-400">{label}</label>
			)}
			<input
				{...inputProps}
				className={cn(
					'w-full rounded-xl border border-gray-700 bg-slate-800/50 px-4 py-3 text-white',
					'placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500',
					'transition-colors duration-200',
					error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
					className
				)}
			/>
			{hint && !error && (
				<span className="text-xs text-gray-500">{hint}</span>
			)}
			{error && (
				<span className="text-xs text-red-400">{error}</span>
			)}
		</div>
	)
}

