export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MAINTENANCE: 'MAINTENANCE',
  HOD: 'HOD',
  VIEWER: 'VIEWER',
};

export const ROLE_LABELS = {
  ADMIN: 'System Administrator',
  MAINTENANCE: 'Facility / Maintenance',
  HOD: 'Head of Department',
  VIEWER: 'Sustainability Viewer',
};

export const ROLE_BADGE_COLORS = {
  ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  MAINTENANCE: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  HOD: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  VIEWER: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

export const SCOPE_DEFINITIONS = {
  SCOPE_1: {
    title: 'Scope 1: Direct Emissions',
    description: 'Direct emissions from campus-owned sources (generators, campus fleet, fugitive emissions).',
    color: '#f59e0b', // amber
  },
  SCOPE_2: {
    title: 'Scope 2: Indirect Energy',
    description: 'Emissions from purchased grid electricity consumed across academic buildings & hostels.',
    color: '#10b981', // emerald
  },
  SCOPE_3: {
    title: 'Scope 3: Value Chain & Commute',
    description: 'Indirect emissions from daily student/staff commuting, waste disposal, water supply.',
    color: '#06b6d4', // cyan
  },
};

export const DEFAULT_EMISSION_FACTOR_GRID_KWH = 0.82; // CEA standard for India Grid (kgCO2e / kWh)
