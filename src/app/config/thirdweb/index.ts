import { createThirdwebClient } from 'thirdweb'
import { sepolia } from 'thirdweb/chains'

import { register } from '@/app/config/const'

export const thirdwebClient = createThirdwebClient({
	clientId: register.thirdweb.clientId
})

export const sepoliaChain = sepolia

