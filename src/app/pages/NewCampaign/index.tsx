'use client'

import { JSX, useState, useCallback } from 'react'

import Modal from '@/app/ui/Modal'
import Button from '@/app/ui/Button'
import Typography from '@/app/ui/Typography'
import { TokenInfo, FeeTier, CampaignFormData } from '@/app/types/token'
import { useCreateCampaign } from '@/app/hooks/useCreateCampaign'

import StepIndicator from './_components/StepIndicator'
import Step1 from './_components/Step1'
import Step2 from './_components/Step2'
import Step3 from './_components/Step3'

type Props = {
	isOpen: boolean
	onClose: () => void
}

const STEPS = [
	{ number: 1, title: 'Select token pair and fees', subtitle: 'Choose pool tokens' },
	{ number: 2, title: 'Set price range and deposit amounts', subtitle: 'Configure liquidity' },
	{ number: 3, title: 'Configure rewards and create', subtitle: 'Set up streaming rewards' }
]

const initialFormData: CampaignFormData = {
	token0: null,
	token1: null,
	feeTier: null,
	initialPrice: '',
	amount0: '',
	amount1: '',
	rewardToken: null,
	rewardAmount: '',
	duration: 30
}

export default function NewCampaign(props: Props): JSX.Element {
	const { isOpen, onClose } = props

	const [currentStep, setCurrentStep] = useState(1)
	const [formData, setFormData] = useState<CampaignFormData>(initialFormData)
	const [txSuccess, setTxSuccess] = useState(false)

	const { createCampaign, isPending, error, txHash, status } = useCreateCampaign()

	const handleClose = useCallback(() => {
		setCurrentStep(1)
		setFormData(initialFormData)
		setTxSuccess(false)
		onClose()
	}, [onClose])

	const handleReset = useCallback(() => {
		setCurrentStep(1)
		setFormData(initialFormData)
		setTxSuccess(false)
	}, [])

	// Step 1 handlers
	const handleToken0Change = (token: TokenInfo) => {
		setFormData(prev => ({ ...prev, token0: token }))
	}

	const handleToken1Change = (token: TokenInfo) => {
		setFormData(prev => ({ ...prev, token1: token }))
	}

	const handleFeeTierChange = (tier: FeeTier) => {
		setFormData(prev => ({ ...prev, feeTier: tier }))
	}

	// Step 2 handlers
	const handleInitialPriceChange = (value: string) => {
		setFormData(prev => ({ ...prev, initialPrice: value }))
	}

	const handleAmount0Change = (value: string) => {
		setFormData(prev => ({ ...prev, amount0: value }))
	}

	const handleAmount1Change = (value: string) => {
		setFormData(prev => ({ ...prev, amount1: value }))
	}

	// Step 3 handlers
	const handleRewardTokenChange = (token: TokenInfo) => {
		setFormData(prev => ({ ...prev, rewardToken: token }))
	}

	const handleRewardAmountChange = (value: string) => {
		setFormData(prev => ({ ...prev, rewardAmount: value }))
	}

	const handleDurationChange = (days: number) => {
		setFormData(prev => ({ ...prev, duration: days }))
	}

	const handleCreateCampaign = async () => {
		if (
			!formData.token0 ||
			!formData.token1 ||
			!formData.feeTier ||
			!formData.rewardToken
		) {
			return
		}

		try {
			const batchId = await createCampaign({
				token0: formData.token0,
				token1: formData.token1,
				feeTier: formData.feeTier,
				initialPrice: formData.initialPrice,
				amount0: formData.amount0,
				amount1: formData.amount1,
				rewardToken: formData.rewardToken,
				rewardAmount: formData.rewardAmount,
				durationDays: formData.duration
			})

			if (batchId) {
				setTxSuccess(true)
				// Close after a delay to show success
				setTimeout(() => {
					handleClose()
				}, 3000)
			}
		} catch (err) {
			console.error('Error creating campaign:', err)
		}
	}

	return (
		<Modal isOpen={isOpen} onClose={handleClose} size="xl" className="max-w-4xl">
			{/* Header */}
			<div className="flex items-center justify-between pb-6 border-b border-gray-700 mb-6">
				<Typography variant="title" className="text-2xl text-white">
					New position
				</Typography>

				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" onClick={handleReset}>
						↺ Reset
					</Button>
					<div className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-700 bg-slate-800/50">
						<span className="text-white text-sm">v4 position</span>
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
					</div>
					<button className="p-2 rounded-lg border border-gray-700 bg-slate-800/50 text-gray-400 hover:text-white transition-colors">
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
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					</button>
				</div>
			</div>

			{/* Success State */}
			{txSuccess && (
				<div className="flex flex-col items-center justify-center gap-4 py-12">
					<div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
						<span className="text-4xl">🎉</span>
					</div>
					<Typography variant="title" className="text-green-400">
						Campaign Created!
					</Typography>
					<Typography variant="label" className="text-gray-400 text-center">
						Your campaign has been submitted to the blockchain.
						{txHash && (
							<span className="block mt-2 font-mono text-xs text-cyan-400">
								Batch ID: {txHash}
							</span>
						)}
					</Typography>
				</div>
			)}

			{/* Status State */}
			{status && isPending && (
				<div className="mb-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
					<div className="flex items-center gap-3">
						<div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
						<Typography variant="label" className="text-cyan-400">
							{status}
						</Typography>
					</div>
				</div>
			)}

			{/* Error State */}
			{error && (
				<div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
					<Typography variant="label" className="text-red-400">
						❌ {error}
					</Typography>
				</div>
			)}

			{/* Main Content */}
			{!txSuccess && (
				<div className="flex gap-8">
					{/* Left Sidebar - Step Indicator */}
					<div className="w-64 flex-shrink-0">
						<StepIndicator steps={STEPS} currentStep={currentStep} />
					</div>

					{/* Right Content - Step Forms */}
					<div className="flex-1 max-h-[70vh] overflow-y-auto pr-2">
						{currentStep === 1 && (
							<Step1
								token0={formData.token0}
								token1={formData.token1}
								feeTier={formData.feeTier}
								onToken0Change={handleToken0Change}
								onToken1Change={handleToken1Change}
								onFeeTierChange={handleFeeTierChange}
								onContinue={() => setCurrentStep(2)}
							/>
						)}

						{currentStep === 2 && formData.token0 && formData.token1 && formData.feeTier && (
							<Step2
								token0={formData.token0}
								token1={formData.token1}
								feeTier={formData.feeTier}
								initialPrice={formData.initialPrice}
								amount0={formData.amount0}
								amount1={formData.amount1}
								onInitialPriceChange={handleInitialPriceChange}
								onAmount0Change={handleAmount0Change}
								onAmount1Change={handleAmount1Change}
								onBack={() => setCurrentStep(1)}
								onContinue={() => setCurrentStep(3)}
							/>
						)}

						{currentStep === 3 && formData.token0 && formData.token1 && formData.feeTier && (
							<Step3
								token0={formData.token0}
								token1={formData.token1}
								feeTier={formData.feeTier}
								initialPrice={formData.initialPrice}
								amount0={formData.amount0}
								amount1={formData.amount1}
								rewardToken={formData.rewardToken}
								rewardAmount={formData.rewardAmount}
								duration={formData.duration}
								onRewardTokenChange={handleRewardTokenChange}
								onRewardAmountChange={handleRewardAmountChange}
								onDurationChange={handleDurationChange}
								onBack={() => setCurrentStep(2)}
								onCreateCampaign={handleCreateCampaign}
								isCreating={isPending}
							/>
						)}
					</div>
				</div>
			)}
		</Modal>
	)
}
