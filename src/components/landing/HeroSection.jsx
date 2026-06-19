import React from 'react';
import { ArrowRight, TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react';
import LivePriceTicker from './LivePriceTicker';
import LiveFundedAccountCard from './LiveFundedAccountCard';

const stats = [
{ label: 'Traders worldwide', value: '14,200+', icon: Users },
{ label: 'Total payouts', value: '$742M+', icon: DollarSign },
{ label: 'Funded accounts', value: '8,450+', icon: TrendingUp },
{ label: 'Daily volume', value: '$2.4B+', icon: BarChart3 }];


export default function HeroSection({ heroImage }) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20 pb-12">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Trading floor" className="w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md mb-6 hidden" style={{ background: 'rgba(255,92,0,0.08)', border: '1px solid rgba(255,92,0,0.15)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">XFunded Trader — Dubai</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.1] tracking-tight mb-6">
                Trade bigger.<br />
                <span className="text-muted-foreground">Scale faster.</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                An institutional-grade proprietary trading firm built for the next generation of global traders. Access up to $200K in funded capital.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/challenges"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-md transition-colors"
                style={{ background: 'hsl(var(--primary))' }}>
                
                Start Challenge
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/challenges?type=instant"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-md transition-colors"
                style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}>
                
                Get Instant Funding
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 pt-8">
              {stats.map((stat) =>
              <div key={stat.label}>
                  <div className="text-3xl font-semibold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Content - Animated Funded Account Card */}
          <div className="hidden lg:block">
            <LiveFundedAccountCard />
          </div>
        </div>
      </div>

      <LivePriceTicker />
    </section>);

}