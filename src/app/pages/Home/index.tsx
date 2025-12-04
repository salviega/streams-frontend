import { JSX } from 'react'

import Campaigns from './_componets/Campaigns'
import Position from './_componets/Position'

export default function Home(): JSX.Element {
	return (
		<div className="h-[calc(100vh-120px)] w-full flex flex-row gap-5 overflow-hidden">
			{/* Sidebar - Campaigns */}
			<div className="h-full w-[340px] min-w-[340px] flex flex-col">
				<Campaigns />
			</div>

			{/* Content - Position */}
			<div className="h-full flex flex-1 flex-col overflow-hidden">
				<Position />
			</div>
		</div>
	)
}
