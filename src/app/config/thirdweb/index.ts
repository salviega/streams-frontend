import { createThirdwebClient } from 'thirdweb'

import { register } from '@/app/config/const'

export const thirdwebClient = createThirdwebClient({
	clientId: register.thirdweb.clientId
})

