/**
 * Accessible, Colorblind-Conscious Enterprise Chart Palette for Carbon IQ
 * Aligned with Section 7 of Master Specification:
 * - Electricity / Scope 2: #0072B2 (blue)
 * - Transportation / Scope 1: #E69F00 (orange)
 * - Waste & Water / Scope 3: #009E73 (green)
 * - Historical Actual: #6D5BD0 (purple)
 * - Forecast / Projection: #D55E00 (vermilion)
 * - Confidence Bounds: #8B98A9 (slate gray)
 * - Comparison / Alternative: #CC79A7 (magenta)
 * - Neutral Baseline: #64748B (slate)
 */

export const CHART_COLORS = {
  // Scopes & Activities
  scope1: '#E69F00',       // Orange (Scope 1 / Transport / Fuel)
  scope2: '#0072B2',       // Blue (Scope 2 / Electricity)
  scope3: '#009E73',       // Green (Scope 3 / Water / Waste)
  
  // Time-Series & Forecasting
  actual: '#6D5BD0',       // Rich Purple (Historical Actual)
  forecast: '#D55E00',     // Vermilion (ML Forecast Line)
  confidence: '#8B98A9',   // Slate Gray (Confidence Band)
  confidenceBand: 'rgba(213, 94, 0, 0.18)', // Translucent vermilion fill
  
  // Campus Wings
  aWing: '#0072B2',        // Blue (A Wing - 350 KVA Contract Demand)
  bWing: '#E69F00',        // Orange (B Wing - 175 KVA Contract Demand)
  construction: '#8B98A9', // Slate Gray (Construction meter)
  
  // Comparative & Baseline
  comparison: '#CC79A7',   // Magenta
  baseline: '#64748B',     // Slate
  projected: '#009E73',    // Green (Intervention outcome)
};

export const SCOPE_COLORS = {
  'Scope 1': CHART_COLORS.scope1,
  'Scope 2': CHART_COLORS.scope2,
  'Scope 3': CHART_COLORS.scope3,
  'scope_1': CHART_COLORS.scope1,
  'scope_2': CHART_COLORS.scope2,
  'scope_3': CHART_COLORS.scope3,
};

export const WING_COLORS = {
  a_wing_kwh: CHART_COLORS.aWing,
  b_wing_kwh: CHART_COLORS.bWing,
  construction_kwh: CHART_COLORS.construction,
  'A Wing': CHART_COLORS.aWing,
  'B Wing': CHART_COLORS.bWing,
  'Construction': CHART_COLORS.construction,
};

/**
 * Returns dynamic theme-adapted styling properties for Recharts components
 * @param {boolean} isDark - whether dark mode is currently active
 */
export const getChartTheme = (isDark = true) => {
  return {
    grid: {
      stroke: isDark ? '#29364B' : '#E2E8F0',
      strokeDasharray: '3 3',
    },
    axis: {
      stroke: isDark ? '#A7B4C8' : '#5D6B82',
      fontSize: 11,
      tickLine: false,
    },
    tooltip: {
      wrapperStyle: { outline: 'none' },
      contentStyle: {
        backgroundColor: isDark ? '#151F32' : '#FFFFFF',
        borderColor: isDark ? '#29364B' : '#DCE4EE',
        borderRadius: '0.75rem',
        boxShadow: isDark ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.1)',
        color: isDark ? '#F1F5F9' : '#172033',
        fontSize: '12px',
        padding: '10px 14px',
      },
      itemStyle: {
        color: isDark ? '#F1F5F9' : '#172033',
        fontSize: '11px',
      },
      labelStyle: {
        color: isDark ? '#A7B4C8' : '#5D6B82',
        fontWeight: 'bold',
        marginBottom: '4px',
      },
    },
    legend: {
      color: isDark ? '#A7B4C8' : '#5D6B82',
      fontSize: '12px',
    },
  };
};
