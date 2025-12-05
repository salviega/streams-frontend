'use client'

import { JSX, useState } from 'react'

import { CampaignWithMeta } from '@/app/hooks/useCampaigns'

import Campaigns from './_componets/Campaigns'
import Position from './_componets/Position'

export default function Home(): JSX.Element {
	const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithMeta | null>(null)

	return (
		<div className="h-full w-full flex flex-row gap-5 overflow-hidden">
			{/* Sidebar - Campaigns */}
			<div className="h-full w-[310px] min-w-[310px] flex flex-col overflow-y-auto">
				<Campaigns
					onSelectCampaign={setSelectedCampaign}
					selectedCampaignId={selectedCampaign ? Number(selectedCampaign.id) : undefined}
				/>
			</div>

			{/* Content */}
			<div className="h-full flex flex-1 flex-col overflow-hidden">
				<Position campaign={selectedCampaign} />
			</div>
		</div>
	)
}
