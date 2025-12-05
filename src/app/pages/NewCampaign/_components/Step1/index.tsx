'use client'

import { JSX, useState } from 'react'

import Typography from '@/app/ui/Typography'
import Button from '@/app/ui/Button'
import Container from '@/app/ui/Container'
import { TokenInfo, FeeTier } from '@/app/types/token'

import TokenSelector from '../TokenSelector'
import TokenSelectModal from '../TokenSelectModal'
import FeeTierSelector from '../FeeTierSelector'

type Props = {
	token0: TokenInfo | null
	token1: TokenInfo | null
	feeTier: FeeTier | null
	onToken0Change: (token: TokenInfo) => void
	onToken1Change: (token: TokenInfo) => void
	onFeeTierChange: (tier: FeeTier) => void
	onContinue: () => void
}

export default function Step1(props: Props): JSX.Element {
	const {
		token0,
		token1,
		feeTier,
		onToken0Change,
		onToken1Change,
		onFeeTierChange,
		onContinue
	} = props

	const [modalOpen, setModalOpen] = useState<'token0' | 'token1' | null>(null)

	const handleSelectToken = (token: TokenInfo) => {
		if (modalOpen === 'token0') {
			onToken0Change(token)
		} else if (modalOpen === 'token1') {
			onToken1Change(token)
		}
		setModalOpen(null)
	}

	const canContinue = token0 && token1 && feeTier

	// Get selected tokens to exclude from modal
	const selectedTokens = [token0, token1].filter((t): t is TokenInfo => t !== null)

	return (
		<Container variant="default" className="flex flex-col gap-6">
			{/* Select Pair Section */}
			<div className="flex flex-col gap-3">
				<Typography variant="subtitle" className="text-white">
					Select pair
				</Typography>
				<Typography variant="label" className="text-gray-400">
					Choose the tokens you want to provide liquidity for. You can select tokens
					on all supported networks.
				</Typography>

				{/* Token Selectors */}
				<div className="flex flex-row items-center gap-3">
					<TokenSelector
						token={token0}
						onClick={() => setModalOpen('token0')}
						placeholder="Choose token"
						className="flex-1"
					/>
					<TokenSelector
						token={token1}
						onClick={() => setModalOpen('token1')}
						placeholder="Choose token"
						className="flex-1"
					/>
				</div>

				{/* Add a Hook (Advanced) */}
				<div className="flex items-center gap-2 text-gray-500">
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
							d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
						/>
					</svg>
					<Typography variant="label" className="text-gray-500 text-xs">
						Add a Hook{' '}
						<span className="text-gray-600">(Advanced)</span>
					</Typography>
					<div className="h-4 w-4 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-[10px]">
						?
					</div>
				</div>
			</div>

			{/* Fee Tier Section */}
			<FeeTierSelector selected={feeTier} onSelect={onFeeTierChange} />

			{/* Continue Button */}
			<Button
				variant={canContinue ? 'primary' : 'secondary'}
				size="lg"
				disabled={!canContinue}
				onClick={onContinue}
				className="w-full"
			>
				Continue
			</Button>

			{/* Token Select Modal */}
			<TokenSelectModal
				isOpen={modalOpen !== null}
				onClose={() => setModalOpen(null)}
				onSelect={handleSelectToken}
				selectedTokens={selectedTokens}
			/>
		</Container>
	)
}

