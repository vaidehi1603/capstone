import axios from 'axios';

const OFFLINE_RULES_FALLBACK = [
  {
    id: 1,
    title: 'Optimize AC Scheduling',
    priority: 'HIGH',
    reason: 'AC consumption accounts for over 40% of total energy.',
    action: 'Implement automated temperature setpoints and schedule AC shutoffs during non-operational hours.',
    category: 'Electricity',
    source: 'Offline Sustainability Rules'
  },
  {
    id: 2,
    title: 'LED Retrofitting',
    priority: 'MEDIUM',
    reason: 'Lighting accounts for a significant portion of energy usage.',
    action: 'Replace remaining conventional bulbs with LED and install motion sensors in corridors.',
    category: 'Electricity',
    source: 'Offline Sustainability Rules'
  },
  {
    id: 3,
    title: 'Expand Solar Generation',
    priority: 'HIGH',
    reason: 'Solar energy offsets only a fraction of total consumption.',
    action: 'Evaluate rooftop space for additional solar panel installation to increase green energy mix.',
    category: 'Solar',
    source: 'Offline Sustainability Rules'
  }
];

export const recommendationService = {
  getRecommendations: async (buildingId = 'all') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/insights/recommendations`,
        { building_identifier: buildingId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const data = response.data.recommendations;
      
      if (!data || data.length === 0) {
        return OFFLINE_RULES_FALLBACK;
      }

      // Map backend fields to frontend model
      return data.map((rec, index) => ({
        id: index,
        title: rec.title || 'Recommendation',
        category: rec.category || 'General',
        priority: rec.priority || 'MEDIUM',
        reason: rec.reason || '',
        action: rec.action || '',
        source: rec.source || 'Google Gemini AI',
      }));
    } catch (error) {
      console.error('Failed to fetch AI recommendations', error);
      // HARD FALLBACK: Guarantee the page is never blank
      return OFFLINE_RULES_FALLBACK;
    }
  }
};
