import { ensureEnvVar } from '@/app/helpers/ensure-env-var.helper'

interface Register {
	alchemy: {
		ethereumSepoliaRpcHttps: string
	}
	thirdweb: {
		clientId: string
		clientSecret: string
	}
}

export const register: Register = {
	alchemy: {
		ethereumSepoliaRpcHttps: ensureEnvVar(
			process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_HTTPS,
			'ETHEREUM_SEPOLIA_RPC_HTTPS'
		)
	},
	thirdweb: {
		clientId: ensureEnvVar(
			process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
			'THIRDWEB_CLIENT_ID'
		),
		clientSecret: ensureEnvVar(
			process.env.NEXT_PUBLIC_THIRDWEB_SECRET_KEY,
			'THIRDWEB_SECRET_KEY'
		)
	}
}
