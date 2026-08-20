/**
 * Recommendation Service
 * 
 * Corresponds to Recommendation model in backend/app/models/ml_analytics.py.
 * Formatted for direct hookup with future backend AI Recommendation endpoints.
 */

export const recommendationService = {
  getRecommendations: async (departmentId = 'all') => {
    // Simulated delay
    await new Promise((res) => setTimeout(res, 300));

    const recommendations = [
      {
        id: 1,
        department_id: 1,
        department_name: 'Engineering',
        category: 'Renewable Energy',
        priority: 'High',
        problem: 'Grid electricity peak demand spikes between 11:00 AM and 3:00 PM in heavy lab clusters.',
        suggestion: 'Install 50 kW rooftop solar photovoltaic array over Mechanical & Electrical engineering blocks to offset peak daytime lab draw.',
        expected_impact: '-18.5% Scope 2 Carbon Emissions',
        estimated_annual_savings: '₹ 4,80,000 / year',
        reasoning: 'Solar irradiance peaks synchronously with engineering computer simulation and CNC lab load cycles.',
        status: 'Recommended',
        payback_period: '3.2 years'
      },
      {
        id: 2,
        department_id: 5,
        department_name: 'Hostel',
        category: 'Water Heating & Efficiency',
        priority: 'High',
        problem: 'Electric resistance geysers in student hostels consume 32% of total night-time electricity.',
        suggestion: 'Transition to centralized heat-pump water heating integrated with existing solar thermal pre-heaters.',
        expected_impact: '-24.0% Hostel Electricity Consumption',
        estimated_annual_savings: '₹ 6,20,000 / year',
        reasoning: 'Heat pumps operate at 3.5 COP compared to 1.0 COP of resistive water heating elements.',
        status: 'In Review',
        payback_period: '2.1 years'
      },
      {
        id: 3,
        department_id: 2,
        department_name: 'Management',
        category: 'HVAC Optimization',
        priority: 'Medium',
        problem: 'Air conditioning systems left running in unoccupied seminar halls and classrooms during breaks.',
        suggestion: 'Deploy IoT occupancy sensor-driven smart thermostats with automated setback temperature schedules.',
        expected_impact: '-12.0% Scope 2 HVAC Emissions',
        estimated_annual_savings: '₹ 1,95,000 / year',
        reasoning: 'Room occupancy telemetry indicates 40% empty-state cooling during afternoon lecture intervals.',
        status: 'Recommended',
        payback_period: '1.4 years'
      },
      {
        id: 4,
        department_id: 1,
        department_name: 'Engineering',
        category: 'Lighting Retrofit',
        priority: 'Low',
        problem: 'Fluorescent T8 lighting fixtures still in use across workshop basements.',
        suggestion: 'Complete LED retrofit with daylight harvesting daylight-dimming ballasts.',
        expected_impact: '-4.8% Lighting Carbon Emissions',
        estimated_annual_savings: '₹ 85,000 / year',
        reasoning: 'Modern LED retrofit delivers 130 lm/W vs 75 lm/W of older fluorescent tubes.',
        status: 'Approved',
        payback_period: '1.1 years'
      },
      {
        id: 5,
        department_id: 5,
        department_name: 'Hostel',
        category: 'Circular Waste Management',
        priority: 'Medium',
        problem: 'High organic food waste generation from mess facilities dispatched to municipal landfills.',
        suggestion: 'Commission an on-site 200 kg/day biomethanation plant to produce biogas for cooking and bio-fertilizer for campus greenery.',
        expected_impact: '-8.2% Scope 3 Methane Emissions',
        estimated_annual_savings: '₹ 1,40,000 / year (LPG offset)',
        reasoning: 'Diverts 6 tons of organic waste monthly from anaerobic landfill decomposition.',
        status: 'Planning',
        payback_period: '3.8 years'
      },
    ];

    if (departmentId !== 'all') {
      return recommendations.filter((r) => String(r.department_id) === String(departmentId));
    }

    return recommendations;
  }
};
