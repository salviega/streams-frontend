'use client'

import { JSX } from 'react'
import { WagmiProvider as WagmiProviderBase } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { wagmiConfig } from '@/app/config/wagmi'

const queryClient = new QueryClient()

type Props = {
	children: React.ReactNode
}

export function WagmiProvider(props: Props): JSX.Element {
	const { children } = props

	return (
		<WagmiProviderBase config={wagmiConfig}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</WagmiProviderBase>
	)
}

