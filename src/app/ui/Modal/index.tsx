'use client'

import { JSX, useEffect, useRef } from 'react'

import { cn } from '@/app/utils/cn.util'

type Props = {
	isOpen: boolean
	onClose: () => void
	title?: string
	children: React.ReactNode
	className?: string
	size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = {
	sm: 'max-w-sm',
	md: 'max-w-md',
	lg: 'max-w-lg',
	xl: 'max-w-xl'
}

export default function Modal(props: Props): JSX.Element | null {
	const { isOpen, onClose, title, children, className = '', size = 'md' } = props
	const modalRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}

		if (isOpen) {
			document.addEventListener('keydown', handleEscape)
			document.body.style.overflow = 'hidden'
		}

		return () => {
			document.removeEventListener('keydown', handleEscape)
			document.body.style.overflow = 'unset'
		}
	}, [isOpen, onClose])

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
			onClose()
		}
	}

	if (!isOpen) return null

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
			onClick={handleBackdropClick}
		>
			<div
				ref={modalRef}
				className={cn(
					'w-full rounded-2xl border border-gray-700 bg-slate-900 p-6 shadow-2xl',
					sizes[size],
					className
				)}
			>
				{/* Header */}
				{title && (
					<div className="flex items-center justify-between border-b border-gray-700 pb-4 mb-4">
						<h2 className="text-lg font-semibold text-white">{title}</h2>
						<button
							onClick={onClose}
							className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				)}

				{/* Content */}
				{children}
			</div>
		</div>
	)
}

