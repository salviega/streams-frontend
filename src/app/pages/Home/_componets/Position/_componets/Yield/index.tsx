import { JSX } from 'react'

import Container from '@/app/ui/Container'
import Typography from '@/app/ui/Typography'

type TimelineStep = {
	title: string
	description: string
	status: 'done' | 'active' | 'pending'
	details?: string
}

export default function Yield(): JSX.Element {
	// Mock data - En producción vendrá del contrato:
	// - campaign.active (si startCampaign() fue llamado)
	// - campaignGoalReached[campaignId]
	// - Eventos: CampaignCreated, CampaignStarted, GoalReached
	const campaignStatus = {
		created: true,
		started: true,
		goalReached: false,
		ended: false,
		// Detalles técnicos
		positionTokenId: 12345,
		gdaPoolAddress: '0x1234...5678',
		superTokenAddress: '0xabcd...efgh',
		remainingBudget: 45000, // USDTM restante
		daysRemaining: 25
	}

	const steps: TimelineStep[] = [
		{
			title: 'Campaign created',
			description:
				'Pool Uniswap v4 inicializado con StreamerHook. Posición inicial creada.',
			status: campaignStatus.created ? 'done' : 'pending',
			details: campaignStatus.created
				? `Position NFT #${campaignStatus.positionTokenId}`
				: undefined
		},
		{
			title: 'Streaming active',
			description:
				'GDA pool de Superfluid configurado. Distribución de rewards iniciada.',
			status: campaignStatus.started
				? campaignStatus.ended
					? 'done'
					: 'active'
				: 'pending',
			details: campaignStatus.started
				? `${campaignStatus.remainingBudget.toLocaleString()} USDTM restante • ${campaignStatus.daysRemaining} días`
				: undefined
		},
		{
			title: campaignStatus.goalReached ? 'Goal reached! 🎉' : 'Campaign end',
			description: campaignStatus.goalReached
				? 'TVL objetivo alcanzado. La campaña continúa distribuyendo rewards.'
				: 'Finaliza cuando se agota el budget o termina la duración.',
			status: campaignStatus.goalReached
				? 'done'
				: campaignStatus.ended
					? 'done'
					: 'pending',
			details: campaignStatus.goalReached
				? 'Nuevos LPs no reciben más unidades'
				: undefined
		}
	]

	const getStatusColor = (status: TimelineStep['status']) => {
		switch (status) {
			case 'done':
				return 'bg-green-400'
			case 'active':
				return 'bg-cyan-400 animate-pulse'
			default:
				return 'bg-gray-500'
		}
	}

	return (
		<Container className="flex flex-col gap-4">
			{/* Header */}
			<div className="flex flex-row items-center justify-between">
				<Typography variant="title">Campaign status</Typography>
				{campaignStatus.started && !campaignStatus.ended && (
					<div className="flex items-center gap-2">
						<div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
						<Typography variant="label" className="text-green-400">
							Live
						</Typography>
					</div>
				)}
			</div>

			{/* Timeline */}
			<ol className="relative ml-2">
				{steps.map((step, index) => (
					<li
						key={step.title}
						className={`relative pb-5 pl-6 ${
							index !== steps.length - 1
								? 'border-l border-dashed border-gray-600'
								: ''
						}`}
					>
						{/* Dot */}
						<span
							className={`absolute -left-[5px] top-1 h-[10px] w-[10px] rounded-full border-2 border-slate-900 ${getStatusColor(step.status)}`}
						/>

						{/* Content */}
						<div className="flex flex-col gap-1">
							<Typography
								variant="subtitle"
								className={`text-[13px] ${step.status === 'active' ? 'text-cyan-400' : ''}`}
							>
								{step.title}
							</Typography>
							<Typography variant="label" className="text-gray-400 text-xs">
								{step.description}
							</Typography>
							{step.details && (
								<Typography
									variant="label"
									className="text-gray-500 text-[10px] mt-1"
								>
									{step.details}
								</Typography>
							)}
						</div>
					</li>
				))}
			</ol>

			{/* Technical info */}
			{campaignStatus.started && (
				<div className="pt-2 border-t border-gray-700">
					<Typography variant="label" className="text-gray-500 text-[10px]">
						GDA Pool: {campaignStatus.gdaPoolAddress}
					</Typography>
				</div>
			)}
		</Container>
	)
}
