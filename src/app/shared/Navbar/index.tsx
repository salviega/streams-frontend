'use client'
import { JSX } from 'react'

import { LoginButton } from './_componets/LoginButton'

export default function Navbar(): JSX.Element {
	return (
		<header className="w-full flex flex-col p-12 gap-3">
			<div className="flex flex-row items-center justify-between">
				<h1 className="text-xl font-semibold tracking-tight md:text-2xl">
					Streamer plataform 💦
				</h1>

				<div className="flex flex-row items-center justify-center gap-15">
					<button type="button">➕ New campaign</button>
					<button type="button">▶️ Start campaign</button>
				</div>

				<LoginButton />
			</div>
			<p className="mt-1 max-w-xl text-xs text-slate-400 md:text-sm">
				Recompensas continuas para atraer LPs a nuevos tokens. Conecta campañas
				Superfluid GDA + Uniswap v4 desde un solo panel.
			</p>
		</header>
	)
}
