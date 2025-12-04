import { JSX } from 'react'

import Home from './pages/Home'
import Navbar from './shared/Navbar'

export default function Page(): JSX.Element {
	return (
		<div className="h-screen w-full flex flex-col items-center">
			<Navbar />
			<div className="w-4/5 flex flex-col items-center justify-start p-6">
				<Home />
			</div>
		</div>
	)
}
