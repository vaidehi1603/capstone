/**
 * What-If Carbon Policy Simulation Service
 * 
 * Corresponds to Simulation model in backend/app/models/ml_analytics.py.
 * Formatted for direct hookup with future backend Simulation endpoints.
 */

export const simulationService = {
  /**
   * Run sustainability policy scenario simulation
   * @param {Object} params - { solarOffsetPct, hvacEfficiencyPct, evTransitionPct, wasteDiversionPct, currentBaseline }
   */
  runSimulation: async (params) => {
    // Simulated backend calculation delay
    await new Promise((res) => setTimeout(res, 350));

    const {
      solarOffsetPct = 0,
      hvacEfficiencyPct = 0,
      evTransitionPct = 0,
      wasteDiversionPct = 0,
      baselineTotalKg = 8500,
    } = params;

    // Component baseline distributions (Scope 1, 2, 3)
    const scope2ElectricityBase = baselineTotalKg * 0.72; // ~72% from electricity
    const scope1TransportBase = baselineTotalKg * 0.18;   // ~18% from transport/fleet
    const scope3WasteBase = baselineTotalKg * 0.10;       // ~10% from waste & water

    // Reduction amounts
    const solarReduction = scope2ElectricityBase * (solarOffsetPct / 100);
    const hvacReduction = (scope2ElectricityBase - solarReduction) * (hvacEfficiencyPct / 100) * 0.45; // HVAC is ~45% of electricity
    const electricityProjected = Math.max(0, scope2ElectricityBase - solarReduction - hvacReduction);

    const evReduction = scope1TransportBase * (evTransitionPct / 100) * 0.85; // EVs still have small grid charging emission
    const transportProjected = Math.max(0, scope1TransportBase - evReduction);

    const wasteReduction = scope3WasteBase * (wasteDiversionPct / 100) * 0.75;
    const wasteProjected = Math.max(0, scope3WasteBase - wasteReduction);

    const projectedTotalKg = Math.round(electricityProjected + transportProjected + wasteProjected);
    const totalReducedKg = Math.round(baselineTotalKg - projectedTotalKg);
    const percentageReduction = Number(((totalReducedKg / baselineTotalKg) * 100).toFixed(1));

    return {
      baseline_total_kg: baselineTotalKg,
      projected_total_kg: projectedTotalKg,
      total_reduced_kg: totalReducedKg,
      percentage_reduction: percentageReduction,
      breakdown: [
        {
          category: 'Scope 2: Electricity',
          baseline: Math.round(scope2ElectricityBase),
          projected: Math.round(electricityProjected),
          reduction: Math.round(scope2ElectricityBase - electricityProjected),
          interventions: `Solar (${solarOffsetPct}%) + HVAC (${hvacEfficiencyPct}%)`,
        },
        {
          category: 'Scope 1: Transportation',
          baseline: Math.round(scope1TransportBase),
          projected: Math.round(transportProjected),
          reduction: Math.round(scope1TransportBase - transportProjected),
          interventions: `EV Fleet Transition (${evTransitionPct}%)`,
        },
        {
          category: 'Scope 3: Waste & Water',
          baseline: Math.round(scope3WasteBase),
          projected: Math.round(wasteProjected),
          reduction: Math.round(scope3WasteBase - wasteProjected),
          interventions: `Waste Diversion & Biogas (${wasteDiversionPct}%)`,
        },
      ],
      net_zero_milestone_impact: `Simulated policies achieve ${percentageReduction}% towards campus 2030 Carbon Neutrality target.`
    };
  }
};
