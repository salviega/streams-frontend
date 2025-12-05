'use client'
import { type JSX } from 'react'
import { ConnectButton } from 'thirdweb/react'

import { thirdwebClient } from '@/app/config/thirdweb'

export function LoginButton(): JSX.Element {
	return <ConnectButton client={thirdwebClient} />
}
