export const BRAND = {
  name: 'XFunded Trader',
  shortName: 'XFunded',
  tagline: 'Institutional Trading Platform',
  description: 'XFunded Trader is a next-generation institutional trading platform. Get funded with up to $200K. Fast payouts. Institutional-grade trading conditions.',
  website: 'https://xfundedtrader.com',
  location: 'Dubai International Financial Centre, UAE',
  
  // Color scheme
  primary: '#FF5C00',
  secondary: '#8B5CF6',
  accent: '#00f5a0',
  
  // Social
  social: {
    twitter: 'https://twitter.com/xfundedtrader',
    discord: 'https://discord.gg/xfundedtrader',
    linkedin: 'https://linkedin.com/company/xfundedtrader',
  },
};

export const PAGE_TITLES = {
  dashboard: 'Dashboard',
  trading: 'Trading Terminal',
  analytics: 'Analytics',
  withdrawals: 'Withdrawals',
  certificates: 'Certificates',
  affiliate: 'Affiliate Program',
  support: 'Support Center',
};

export const getPageTitle = (page) => {
  return `${PAGE_TITLES[page] || page} | ${BRAND.name}`;
};