import { JSX } from 'react'

import Label from './_componets/Label'
import Stats from './_componets/Stats'
import StreamingRewards from './_componets/StreamingRewards'

export default function Position(): JSX.Element {
	return (
		<div className="h-full flex flex-col gap-4 overflow-y-auto">
			{/* Campaign Header */}
			<Label />

			{/* Grid: Position + Streaming */}
			<div className="grid grid-cols-[1fr_1fr] gap-4">
				<Stats />
				<StreamingRewards
					rewardSymbol="USDTM"
					flowRatePerSecond={0.0000084}
					initialBalance={218.286772}
					isStreaming={true}
				/>
			</div>
		</div>
	)
}
