'use client'

import { JSX, useState } from 'react'
import { formatUnits } from 'viem'

import { useCampaigns, CampaignWithMeta } from '@/app/hooks/useCampaigns'
import Container from '@/app/ui/Container'
import Typography from '@/app/ui/Typography'

import Pool from './_components/Pool'

type Props = {
	onSelectCampaign?: (campaign: CampaignWithMeta) => void
	selectedCampaignId?: number
}

export default function Campaigns(props: Props): JSX.Element {
	const { onSelectCampaign, selectedCampaignId } = props
	const { campaigns, loading, error, refetch } = useCampaigns()

	const [selectedId, setSelectedId] = useState<number>(selectedCampaignId || 1)

	const handleSelectCampaign = (campaign: CampaignWithMeta) => {
		setSelectedId(Number(campaign.id))
		onSelectCampaign?.(campaign)
	}

	if (loading) {
		return (
			<Container className="h-full w-full flex flex-col gap-4 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
				<Typography variant="label" className="text-gray-400">
					Loading campaigns...
				</Typography>
			</Container>
		)
	}

	if (error) {
		return (
			<Container className="h-full w-full flex flex-col gap-4 items-center justify-center">
				<Typography variant="label" className="text-red-400">
					{error}
				</Typography>
				<button
					onClick={refetch}
					className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/30"
				>
					Retry
				</button>
			</Container>
		)
	}

	if (campaigns.length === 0) {
		return (
			<Container className="h-full w-full flex flex-col gap-4 items-center justify-center">
				<Typography variant="label" className="text-gray-400">
					No campaigns found
				</Typography>
				<Typography variant="label" className="text-gray-500 text-xs">
					Create your first campaign to get started!
				</Typography>
			</Container>
		)
	}

	return (
		<Container className="h-full w-full flex flex-col gap-4">
			<div className="w-full flex flex-row items-center justify-between">
				<Typography variant="title">Campaigns</Typography>
				<Container variant="rounded" className="w-fit px-3 py-1">
					<Typography variant="label">{campaigns.length} pools</Typography>
				</Container>
			</div>

			<div className="flex-1 overflow-y-auto pr-1">
				<div className="flex flex-col gap-3">
					{campaigns.map(campaign => (
						<Pool
							key={Number(campaign.id)}
							campaign={campaign}
							selected={Number(campaign.id) === selectedId}
							onClick={() => handleSelectCampaign(campaign)}
						/>
					))}
				</div>
			</div>
		</Container>
	)
}
