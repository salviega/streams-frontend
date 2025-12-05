'use client'

import { JSX } from 'react'

import { CampaignWithMeta } from '@/app/hooks/useCampaigns'
import Container from '@/app/ui/Container'
import Typography from '@/app/ui/Typography'

import Label from './_componets/Label'
import Stats from './_componets/Stats'
import StreamingRewards from './_componets/StreamingRewards'

type Props = {
	campaign: CampaignWithMeta | null
}

export default function Position(props: Props): JSX.Element {
	const { campaign } = props

	if (!campaign) {
		return (
			<Container className="h-full flex flex-col items-center justify-center gap-4">
				<Typography variant="title" className="text-gray-400">
					Select a campaign
				</Typography>
				<Typography variant="label" className="text-gray-500">
					Click on a campaign from the list to view details
				</Typography>
			</Container>
		)
	}

	return (
		<div className="h-full flex flex-col gap-4 overflow-y-auto">
			{/* Campaign Header */}
			<Label campaign={campaign} />

			{/* Grid: Position + Streaming */}
			<div className="grid grid-cols-[1fr_1fr] gap-4">
				<Stats campaign={campaign} />
				<StreamingRewards campaign={campaign} />
			</div>
		</div>
	)
}
