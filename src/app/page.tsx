'use client'

import { JSX, useState } from 'react'

import Home from './pages/Home'
import NewCampaign from './pages/NewCampaign'
import Navbar from './shared/Navbar'

export default function Page(): JSX.Element {
	const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false)

	return (
		<div className="h-screen w-full flex flex-col overflow-hidden">
			<Navbar onNewCampaign={() => setIsNewCampaignOpen(true)} />
			<div className="w-full flex flex-1 flex-col items-center justify-start p-6 overflow-hidden">
				<Home />
			</div>

			{/* New Campaign Modal */}
			<NewCampaign
				isOpen={isNewCampaignOpen}
				onClose={() => setIsNewCampaignOpen(false)}
			/>
		</div>
	)
}
