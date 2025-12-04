import { JSX } from 'react'

import Label from './_componets/Label'
import Stats from './_componets/Stats'
import Yield from './_componets/Yield'

export default function Position(): JSX.Element {
	return (
		<div className="h-full flex flex-col gap-4 overflow-y-auto">
			{/* Campaign Header */}
			<Label />

			{/* Grid: Position + Timeline */}
			<div className="grid grid-cols-[1.4fr_1fr] gap-4">
				<Stats />
				<Yield />
			</div>
		</div>
	)
}
