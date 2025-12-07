export const STREAMER_ABI = [
	// ============= Campaign Functions =============
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

	// Add liquidity to existing campaign
	{
		inputs: [
			{ internalType: 'uint256', name: '_campaignId', type: 'uint256' },
			{ internalType: 'int24', name: '_tickLower', type: 'int24' },
			{ internalType: 'int24', name: '_tickUpper', type: 'int24' },
			{ internalType: 'uint256', name: '_liquidity', type: 'uint256' },
			{ internalType: 'uint256', name: '_amount0Max', type: 'uint256' },
			{ internalType: 'uint256', name: '_amount1Max', type: 'uint256' },
			{ internalType: 'uint256', name: '_deadline', type: 'uint256' }
		],
		name: 'addLiquidityToCampaign',
		outputs: [],
		stateMutability: 'payable',
		type: 'function'
	},

	// Start campaign
	{
		inputs: [{ internalType: 'uint256', name: '_campaignId', type: 'uint256' }],
		name: 'startCampaign',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},

	// ============= Getter Functions =============
	{
		inputs: [],
		name: 'getCampaignCounter',
		outputs: [{ internalType: 'uint128', name: '', type: 'uint128' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'uint256', name: '_campaignId', type: 'uint256' }],
		name: 'getCampaign',
		outputs: [
			{
				components: [
					{ internalType: 'uint256', name: 'id', type: 'uint256' },
					{ internalType: 'uint256', name: 'positionTokenId', type: 'uint256' },
					{ internalType: 'uint256', name: 'budget', type: 'uint256' },
					{ internalType: 'uint256', name: 'goal', type: 'uint256' },
					{ internalType: 'uint256', name: 'duration', type: 'uint256' },
					{ internalType: 'address', name: 'owner', type: 'address' },
					{ internalType: 'address', name: 'reward', type: 'address' },
					{ internalType: 'address', name: 'superToken', type: 'address' },
					{
						internalType: 'enum IStreamerConfig.RewardType',
						name: 'rewardType',
						type: 'uint8'
					},
					{ internalType: 'bool', name: 'active', type: 'bool' },
					{ internalType: 'int96', name: 'flowRate', type: 'int96' },
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
					}
				],
				internalType: 'struct IStreamerConfig.Campaign',
				name: '',
				type: 'tuple'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'uint256', name: '_campaignId', type: 'uint256' }],
		name: 'getCampaignTotalUnits',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'uint256', name: '_campaignId', type: 'uint256' }],
		name: 'getCampaignGoalReached',
		outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'uint256', name: '_campaignId', type: 'uint256' }],
		name: 'getCampaignDistributionPool',
		outputs: [{ internalType: 'contract ISuperfluidPool', name: '', type: 'address' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'uint256', name: '_campaignId', type: 'uint256' }],
		name: 'getCampaignSuperToken',
		outputs: [{ internalType: 'address', name: '', type: 'address' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'uint256', name: '_campaignId', type: 'uint256' },
			{ internalType: 'address', name: '_lp', type: 'address' }
		],
		name: 'getLpUnits',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'uint256', name: '_campaignId', type: 'uint256' },
			{ internalType: 'address', name: '_lp', type: 'address' }
		],
		name: 'getLpShareBps',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'uint256', name: '_campaignId', type: 'uint256' },
			{ internalType: 'address', name: '_lp', type: 'address' }
		],
		name: 'getLpPendingReward',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'uint256', name: '_campaignId', type: 'uint256' }],
		name: 'getCampaignOwner',
		outputs: [{ internalType: 'address', name: '', type: 'address' }],
		stateMutability: 'view',
		type: 'function'
	}
] as const
