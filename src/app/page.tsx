import { JSX } from 'react'

import Home from './pages/Home'
import Navbar from './shared/Navbar'

export default function Page(): JSX.Element {
	return (
		<div className="min-h-screen w-full flex flex-col items-center justify-center">
			<Navbar />
			<div className="h-full w-full max-w-3xl flex flex-1">
				<Home />
			</div>
		</div>
	)
}
