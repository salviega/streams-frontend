import { JSX } from 'react'

import Typography from '@/app/ui/Typography'
import { cn } from '@/app/utils/cn.util'

type Step = {
	number: number
	title: string
	subtitle: string
}

type Props = {
	steps: Step[]
	currentStep: number
}

export default function StepIndicator(props: Props): JSX.Element {
	const { steps, currentStep } = props

	return (
		<div className="flex flex-col gap-0">
			{steps.map((step, index) => {
				const isActive = step.number === currentStep
				const isCompleted = step.number < currentStep
				const isLast = index === steps.length - 1

				return (
					<div key={step.number} className="flex items-start gap-3">
						{/* Circle and Line */}
						<div className="flex flex-col items-center">
							{/* Circle */}
							<div
								className={cn(
									'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
									isActive
										? 'bg-cyan-500 text-white'
										: isCompleted
											? 'bg-green-500 text-white'
											: 'bg-slate-800 border border-gray-600 text-gray-400'
								)}
							>
								{isCompleted ? (
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M5 13l4 4L19 7"
										/>
									</svg>
								) : (
									step.number
								)}
							</div>

							{/* Connecting Line */}
							{!isLast && (
								<div
									className={cn(
										'w-px h-12 transition-colors duration-300',
										isCompleted ? 'bg-green-500' : 'bg-gray-700'
									)}
								/>
							)}
						</div>

						{/* Text */}
						<div className="flex flex-col pb-8">
							<Typography
								variant="label"
								className={cn(
									'text-xs uppercase tracking-wider',
									isActive ? 'text-cyan-400' : 'text-gray-500'
								)}
							>
								Step {step.number}
							</Typography>
							<Typography
								variant="subtitle"
								className={cn(
									'font-medium',
									isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-gray-400'
								)}
							>
								{step.title}
							</Typography>
						</div>
					</div>
				)
			})}
		</div>
	)
}

