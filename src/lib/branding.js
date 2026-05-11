export const BRAND = {
  name: 'Funded Firms CRM',
  shortName: 'Funded Firms',
  tagline: 'Institutional Trading Platform',
  description: 'Funded Firms CRM is a next-generation institutional trading platform. Get funded with up to $200K. Fast payouts. Institutional-grade trading conditions.',
  website: 'https://fundedfirms.com',
  location: 'Singapore',
  
  // Color scheme
  primary: '#FF5C00',
  secondary: '#8B5CF6',
  accent: '#00f5a0',
  
  // Social
  social: {
    twitter: 'https://twitter.com/fundedfirms',
    discord: 'https://discord.gg/fundedfirms',
    linkedin: 'https://linkedin.com/company/fundedfirms',
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