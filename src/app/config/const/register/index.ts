import { ensureEnvVar } from '@/app/helpers/ensure-env-var.helper'

interface Register {
	thirdweb: {
		clientId: string
		clientSecret: string
	}
}

export const register: Register = {
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
