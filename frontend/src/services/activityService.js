/**
 * Activity Services for Water, Waste, Transportation, and Appliances
 * 
 * NOTE: These models exist in backend database (models/activity.py and models/asset.py).
 * These services provide clean client-side staging and fallback data until the corresponding
 * FastAPI endpoints (/api/v1/transportation, /api/v1/waste, /api/v1/water) are exposed.
 */

const STORAGE_KEYS = {
  TRANSPORT: 'campus_data_transport',
  WASTE: 'campus_data_waste',
  WATER: 'campus_data_water',
  APPLIANCES: 'campus_data_appliances',
};

const getStored = (key, initial) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : initial;
  } catch {
    return initial;
  }
};

const saveStored = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initial Seed Data
const INITIAL_TRANSPORT = [
  { id: 1, department_id: 1, department_name: 'Engineering', vehicle_type: 'Campus Bus (Diesel)', fuel_type: 'Diesel', distance_or_fuel_volume: 450, timestamp: '2024-03-10T10:00:00Z', calculated_emission: 1215.0 },
  { id: 2, department_id: 2, department_name: 'Management', vehicle_type: 'Faculty Van (Petrol)', fuel_type: 'Petrol', distance_or_fuel_volume: 220, timestamp: '2024-03-12T14:30:00Z', calculated_emission: 506.0 },
  { id: 3, department_id: 5, department_name: 'Hostel', vehicle_type: 'Service Utility EV', fuel_type: 'Electric', distance_or_fuel_volume: 380, timestamp: '2024-03-14T09:15:00Z', calculated_emission: 155.8 },
];

const INITIAL_WATER = [
  { id: 1, department_id: 5, department_name: 'Hostel', liters_consumed: 125000, timestamp: '2024-03-01T08:00:00Z', calculated_emission: 43.75 },
  { id: 2, department_id: 1, department_name: 'Engineering', liters_consumed: 45000, timestamp: '2024-03-05T09:30:00Z', calculated_emission: 15.75 },
  { id: 3, department_id: 3, department_name: 'Pharmacy', liters_consumed: 38000, timestamp: '2024-03-08T11:00:00Z', calculated_emission: 13.3 },
];

const INITIAL_WASTE = [
  { id: 1, department_id: 5, department_name: 'Hostel', waste_type: 'Organic Food Waste', weight_kg: 850, is_recycled: true, timestamp: '2024-03-04T12:00:00Z', calculated_emission: 170.0 },
  { id: 2, department_id: 1, department_name: 'Engineering', waste_type: 'E-Waste & Hardware', weight_kg: 120, is_recycled: true, timestamp: '2024-03-09T15:00:00Z', calculated_emission: 36.0 },
  { id: 3, department_id: 2, department_name: 'Management', waste_type: 'Paper & Cardboard', weight_kg: 340, is_recycled: true, timestamp: '2024-03-11T16:30:00Z', calculated_emission: 68.0 },
];

const INITIAL_APPLIANCES = [
  { id: 1, department_id: 1, department_name: 'Engineering', type: 'Central HVAC Chiller Unit', power_rating_kw: 45.0, quantity: 4, status: 'Active (Optimized)' },
  { id: 2, department_id: 1, department_name: 'Engineering', type: 'Computer Lab Workstations', power_rating_kw: 0.35, quantity: 120, status: 'Active' },
  { id: 3, department_id: 3, department_name: 'Pharmacy', type: 'Lab Autoclaves & Refrigeration', power_rating_kw: 12.5, quantity: 8, status: 'Active' },
  { id: 4, department_id: 5, department_name: 'Hostel', type: 'Solar Water Heaters (Dual Backup)', power_rating_kw: 18.0, quantity: 6, status: 'Eco Mode' },
];

export const activityService = {
  // Transportation
  getTransportationData: async () => {
    return getStored(STORAGE_KEYS.TRANSPORT, INITIAL_TRANSPORT);
  },
  createTransportationData: async (data) => {
    const list = getStored(STORAGE_KEYS.TRANSPORT, INITIAL_TRANSPORT);
    // Approximate Scope 1 factor (2.7 kgCO2/L for diesel, 2.3 for petrol)
    const factor = data.fuel_type === 'Diesel' ? 2.7 : data.fuel_type === 'Petrol' ? 2.3 : 0.41;
    const newItem = {
      id: Date.now(),
      ...data,
      calculated_emission: Number((data.distance_or_fuel_volume * factor).toFixed(2)),
      timestamp: data.timestamp || new Date().toISOString(),
    };
    list.unshift(newItem);
    saveStored(STORAGE_KEYS.TRANSPORT, list);
    return newItem;
  },

  // Water
  getWaterData: async () => {
    return getStored(STORAGE_KEYS.WATER, INITIAL_WATER);
  },
  createWaterData: async (data) => {
    const list = getStored(STORAGE_KEYS.WATER, INITIAL_WATER);
    // Factor: ~0.35 kgCO2e per 1,000 Liters treated and pumped
    const newItem = {
      id: Date.now(),
      ...data,
      calculated_emission: Number(((data.liters_consumed / 1000) * 0.35).toFixed(2)),
      timestamp: data.timestamp || new Date().toISOString(),
    };
    list.unshift(newItem);
    saveStored(STORAGE_KEYS.WATER, list);
    return newItem;
  },

  // Waste
  getWasteData: async () => {
    return getStored(STORAGE_KEYS.WASTE, INITIAL_WASTE);
  },
  createWasteData: async (data) => {
    const list = getStored(STORAGE_KEYS.WASTE, INITIAL_WASTE);
    // Factor: ~0.2 kgCO2e per kg unmanaged waste; reduced if recycled
    const factor = data.is_recycled ? 0.08 : 0.25;
    const newItem = {
      id: Date.now(),
      ...data,
      calculated_emission: Number((data.weight_kg * factor).toFixed(2)),
      timestamp: data.timestamp || new Date().toISOString(),
    };
    list.unshift(newItem);
    saveStored(STORAGE_KEYS.WASTE, list);
    return newItem;
  },

  // Appliances / Assets
  getAppliances: async () => {
    return getStored(STORAGE_KEYS.APPLIANCES, INITIAL_APPLIANCES);
  },
  createAppliance: async (data) => {
    const list = getStored(STORAGE_KEYS.APPLIANCES, INITIAL_APPLIANCES);
    const newItem = {
      id: Date.now(),
      ...data,
    };
    list.unshift(newItem);
    saveStored(STORAGE_KEYS.APPLIANCES, list);
    return newItem;
  },
};
