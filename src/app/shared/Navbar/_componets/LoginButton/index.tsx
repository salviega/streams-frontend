'use client'
import { type JSX } from 'react'
import { ConnectButton } from 'thirdweb/react'

import { register } from '@/app/config/const'

export function LoginButton(): JSX.Element {
	const client = register.thirdweb.clientId

	return <ConnectButton client={{ clientId: client, secretKey: undefined }} />
}
