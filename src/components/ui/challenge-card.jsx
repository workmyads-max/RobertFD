import React from 'react';
import { Shield, Zap, Lightbulb, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as PricingCard from './pricing-card';

export default function ChallengeCard({ plan, onSelect }) {
	const getIcon = () => {
		switch (plan.type) {
			case 'two-step': return <Shield className="w-5 h-5" />;
			case 'instant': return <Zap className="w-5 h-5" />;
			case 'instant_light': return <Lightbulb className="w-5 h-5" />;
			default: return <Shield className="w-5 h-5" />;
		}
	};

	const getLabel = () => {
		if (plan.type === 'two-step') return 'Evaluation Phase';
		if (plan.type === 'instant') return 'No Evaluation';
		return 'Most Affordable';
	};

	const leverage = plan.account_type === 'swing' ? plan.leverage_swing : plan.leverage_standard;

	return (
		<PricingCard.Card className="group hover:shadow-2xl transition-all duration-300">
			<PricingCard.Header glassEffect={true}>
				{/* Icon */}
				<div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/10 text-orange-500">
					{getIcon()}
				</div>

				{/* Label */}
				<div className="mb-2">
					<span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
						{getLabel()}
					</span>
				</div>

				{/* Plan Name */}
				<div className="mb-2">
					<span className="text-white text-lg font-bold">{plan.name}</span>
				</div>

				{/* Description */}
				<PricingCard.Description className="text-sm leading-relaxed mb-6">
					{plan.type === 'two-step'
						? 'Prove your skills through a structured 2-phase evaluation. Built for disciplined traders.'
						: plan.type === 'instant'
						? 'Skip evaluation entirely. Get funded capital the same day and request payouts daily.'
						: 'Most affordable path to funding. Trading drawdown protection moves your safety floor up.'}
				</PricingCard.Description>

				{/* CTA Button */}
				<Button
					className={cn(
						'w-full font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]',
						'bg-gradient-to-b from-orange-500 to-orange-600 shadow-[0_10px_25px_rgba(255,115,0,0.3)]'
					)}
					onClick={() => onSelect(plan)}
				>
					Buy Challenge →
				</Button>
			</PricingCard.Header>

			<PricingCard.Body>
				<PricingCard.List>
					<ListItem label="Phase 1 Target" value={`${plan.phase1_target}%`} />
					{plan.type === 'two-step' && (
						<ListItem label="Phase 2 Target" value={`${plan.phase2_target}%`} />
					)}
					<ListItem label="Daily DD" value={`${plan.daily_dd}%`} />
					<ListItem label="Max DD" value={`${plan.max_dd}%`} />
					<ListItem label="Leverage" value={leverage} />
					<ListItem 
						label="Payouts" 
						value={plan.type === 'instant' || plan.type === 'instant_light' ? 'Daily' : 'On Pass'} 
					/>
					<ListItem label="Profit Split" value={`${plan.profit_split}%`} />
				</PricingCard.List>
			</PricingCard.Body>
		</PricingCard.Card>
	);
}

function ListItem({ label, value }) {
	return (
		<PricingCard.ListItem>
			<span className="mt-0.5">
				<CheckCircle2 className="h-4 w-4 text-orange-500" aria-hidden="true" />
			</span>
			<span className="flex-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
				{label}
			</span>
			<span className="text-orange-400 font-bold text-sm">{value}</span>
		</PricingCard.ListItem>
	);
}