/** Unified dashboard color palette */
export const CHART_COLORS = {
  income: '#10b981',
  expense: '#f43f5e',
  savings: '#3b82f6',
  udhari: '#f59e0b',
  goals: '#a855f7',
  emi: '#6366f1',
  receive: '#22c55e',
  give: '#ef4444',
};

export const CATEGORY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#06b6d4', '#ec4899', '#8b5cf6',
];

export const GRADIENT_PAIRS = [
  ['#3b82f6', '#60a5fa'],
  ['#10b981', '#34d399'],
  ['#f59e0b', '#fbbf24'],
  ['#f43f5e', '#fb7185'],
  ['#a855f7', '#c084fc'],
  ['#06b6d4', '#22d3ee'],
  ['#ec4899', '#f472b6'],
  ['#6366f1', '#818cf8'],
];

export const ANIM_DURATION = 1400;
export const ANIM_EASING = 'ease-out';

export const formatINR = (num) => `₹${Number(num || 0).toLocaleString('en-IN')}`;

export const formatCompactINR = (num) => {
  const n = Number(num) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
};
