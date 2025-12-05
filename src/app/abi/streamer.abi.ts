export const STREAMER_ABI = [
	{
		inputs: [
			{
				components: [
					{
						components: [
							{ internalType: 'Currency', name: 'currency0', type: 'address' },
							{ internalType: 'Currency', name: 'currency1', type: 'address' },
							{ internalType: 'uint24', name: 'fee', type: 'uint24' },
							{ internalType: 'int24', name: 'tickSpacing', type: 'int24' },
							{ internalType: 'contract IHooks', name: 'hooks', type: 'address' }
						],
						internalType: 'struct PoolKey',
						name: 'pool',
						type: 'tuple'
					},
					{ internalType: 'address', name: 'reward', type: 'address' },
					{ internalType: 'uint256', name: 'budget', type: 'uint256' },
					{ internalType: 'uint256', name: 'goal', type: 'uint256' },
					{ internalType: 'uint256', name: 'duration', type: 'uint256' },
					{ internalType: 'uint256', name: 'deadline', type: 'uint256' },
					{
						internalType: 'enum IStreamerConfig.RewardType',
						name: 'rewardType',
						type: 'uint8'
					},
					{ internalType: 'uint160', name: 'startingPrice', type: 'uint160' },
					{
						components: [
							{ internalType: 'int24', name: 'tickLower', type: 'int24' },
							{ internalType: 'int24', name: 'tickUpper', type: 'int24' },
							{ internalType: 'uint128', name: 'liquidity', type: 'uint128' },
							{ internalType: 'uint256', name: 'amount0Max', type: 'uint256' },
							{ internalType: 'uint256', name: 'amount1Max', type: 'uint256' },
							{ internalType: 'address', name: 'recipient', type: 'address' },
							{ internalType: 'bytes', name: 'hookData', type: 'bytes' }
						],
						internalType: 'struct IStreamerConfig.MintPositionParams',
						name: 'mintParams',
						type: 'tuple'
					}
				],
				internalType: 'struct IStreamerConfig.CreateCampaignParams',
				name: '_params',
				type: 'tuple'
			}
		],
		name: 'createCampaign',
		outputs: [],
		stateMutability: 'payable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'getCampaignCounter',
		outputs: [{ internalType: 'uint128', name: '', type: 'uint128' }],
		stateMutability: 'view',
		type: 'function'
	}
] as const

