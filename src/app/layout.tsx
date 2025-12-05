import './globals.css'

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { JSX } from 'react'
import { ThirdwebProvider } from 'thirdweb/react'

import { WagmiProvider } from '@/app/providers/WagmiProvider'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin']
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin']
})

export const metadata: Metadata = {
	title: 'Streams',
	description:
		'Streams is a platform for creating and sharing continuous rewards for LPs'
}

type Props = {
	children: React.ReactNode
}

export default function RootLayout(props: Props): JSX.Element {
	const { children } = props
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<WagmiProvider>
					<ThirdwebProvider>{children}</ThirdwebProvider>
				</WagmiProvider>
			</body>
		</html>
	)
}
