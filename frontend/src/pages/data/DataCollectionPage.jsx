import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { electricityService } from '../../services/electricityService';
import { activityService } from '../../services/activityService';
import { departmentService } from '../../services/departmentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ElectricityForm } from '../../components/forms/ElectricityForm';
import { DataTable } from '../../components/tables/DataTable';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatNumber, formatCarbon, formatDate } from '../../utils/formatters';
import {
  Zap,
  Bus,
  Droplets,
  Trash2,
  HardDrive,
  Plus,
  ArrowRight,
} from 'lucide-react';

export const DataCollectionPage = () => {
  const [activeTab, setActiveTab] = useState('electricity');
  const [departments, setDepartments] = useState([]);
  const [electricityList, setElectricityList] = useState([]);
  const [transportList, setTransportList] = useState([]);
  const [waterList, setWaterList] = useState([]);
  const [wasteList, setWasteList] = useState([]);
  const [appliancesList, setAppliancesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { isAdmin, isMaintenance } = useAuth();
  const toast = useToast();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [deptRes, elecRes, transRes, waterRes, wasteRes, appRes] = await Promise.all([
        departmentService.getDepartments().catch(() => []),
        electricityService.getElectricityData().catch(() => []),
        activityService.getTransportationData(),
        activityService.getWaterData(),
        activityService.getWasteData(),
        activityService.getAppliances(),
      ]);

      setDepartments(deptRes || []);
      setElectricityList(elecRes || []);
      setTransportList(transRes || []);
      setWaterList(waterRes || []);
      setWasteList(wasteRes || []);
      setAppliancesList(appRes || []);
    } catch {
      toast.error('Error fetching activity datasets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const tabs = [
    { id: 'electricity', name: 'Electricity (Scope 2)', icon: Zap, count: electricityList.length, realApi: true },
    { id: 'transport', name: 'Transportation (Scope 1)', icon: Bus, count: transportList.length },
    { id: 'water', name: 'Water (Scope 3)', icon: Droplets, count: waterList.length },
    { id: 'waste', name: 'Waste & Recycling (Scope 3)', icon: Trash2, count: wasteList.length },
    { id: 'appliances', name: 'Assets & Facilities', icon: HardDrive, count: appliancesList.length },
  ];

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading Data Collection Center..." className="min-h-[50vh]" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            Sustainability Data Collection Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Input verified campus activity metrics for automated GHG inventory calculation.
          </p>
        </div>

        {(isAdmin || isMaintenance) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-900/40"
          >
            <Plus className="w-4 h-4" />
            Add {tabs.find((t) => t.id === activeTab)?.name.split(' ')[0]} Entry
          </button>
        )}
      </div>

      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-md shadow-brand-900/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                activeTab === tab.id ? 'bg-black/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab 1: Electricity Data (Connected to real backend API) */}
      {activeTab === 'electricity' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-brand-950/30 border border-brand-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/40 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  Real FastAPI Backend Active Endpoint: <span className="font-mono text-brand-400">/api/v1/electricity/</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Submissions automatically compute Scope 2 carbon emission records synchronously in PostgreSQL.
                </p>
              </div>
            </div>
            <NavLink
              to="/data/electricity"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              Dedicated View <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          <DataTable
            columns={[
              { header: 'ID', accessor: 'id', render: (r) => <span className="font-mono text-slate-500">#{r.id}</span> },
              {
                header: 'Department',
                accessor: 'department_id',
                render: (r) => {
                  const d = departments.find((dept) => dept.id === r.department_id);
                  return d ? `${d.name} (${d.code})` : `#${r.department_id}`;
                },
              },
              { header: 'Consumption (kWh)', accessor: 'kwh', render: (r) => `${formatNumber(r.kwh)} kWh` },
              { header: 'Source', accessor: 'source', render: (r) => <Badge variant="cyan">{r.source}</Badge> },
              { header: 'Timestamp', accessor: 'timestamp', render: (r) => formatDate(r.timestamp, true) },
              {
                header: 'Synchronously Computed CO₂e',
                accessor: 'kwh',
                className: 'text-right',
                cellClassName: 'text-right font-mono font-bold text-emerald-400',
                render: (r) => formatCarbon(r.kwh * 0.82),
              },
            ]}
            data={electricityList}
            searchPlaceholder="Filter electricity records..."
          />
        </div>
      )}

      {/* Tab 2: Transportation */}
      {activeTab === 'transport' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  Campus Fleet & Commuting Activity (Scope 1)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Covers campus shuttle buses, security patrol vans, and student transit.
                </p>
              </div>
            </div>
            <Badge variant="amber">Scope 1</Badge>
          </div>

          <DataTable
            columns={[
              { header: 'ID', accessor: 'id', render: (r) => <span className="font-mono text-slate-500">#{r.id}</span> },
              { header: 'Department', accessor: 'department_name' },
              { header: 'Vehicle Type', accessor: 'vehicle_type' },
              { header: 'Fuel Type', accessor: 'fuel_type', render: (r) => <Badge variant={r.fuel_type === 'Electric' ? 'emerald' : 'amber'}>{r.fuel_type}</Badge> },
              { header: 'Distance / Volume', accessor: 'distance_or_fuel_volume', render: (r) => `${formatNumber(r.distance_or_fuel_volume)} km/L` },
              { header: 'Date', accessor: 'timestamp', render: (r) => formatDate(r.timestamp) },
              { header: 'Emission Output', accessor: 'calculated_emission', className: 'text-right', cellClassName: 'text-right font-mono font-bold text-amber-400', render: (r) => formatCarbon(r.calculated_emission) },
            ]}
            data={transportList}
            searchPlaceholder="Filter transportation records..."
          />
        </div>
      )}

      {/* Tab 3: Water */}
      {activeTab === 'water' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  Water Consumption & Pumping (Scope 3)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Includes municipal supply, groundwater borehole pumping, and rainwater harvesting.
                </p>
              </div>
            </div>
            <Badge variant="cyan">Scope 3</Badge>
          </div>

          <DataTable
            columns={[
              { header: 'ID', accessor: 'id', render: (r) => <span className="font-mono text-slate-500">#{r.id}</span> },
              { header: 'Department', accessor: 'department_name' },
              { header: 'Volume Consumed', accessor: 'liters_consumed', render: (r) => `${formatNumber(r.liters_consumed, 0)} Liters` },
              { header: 'Date', accessor: 'timestamp', render: (r) => formatDate(r.timestamp) },
              { header: 'Calculated Carbon', accessor: 'calculated_emission', className: 'text-right', cellClassName: 'text-right font-mono font-bold text-cyan-400', render: (r) => formatCarbon(r.calculated_emission) },
            ]}
            data={waterList}
            searchPlaceholder="Filter water records..."
          />
        </div>
      )}

      {/* Tab 4: Waste */}
      {activeTab === 'waste' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  Solid Waste & Composting (Scope 3)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Tracking organic mess waste, e-waste recycling, and landfill diversion rates.
                </p>
              </div>
            </div>
            <Badge variant="emerald">Circularity</Badge>
          </div>

          <DataTable
            columns={[
              { header: 'ID', accessor: 'id', render: (r) => <span className="font-mono text-slate-500">#{r.id}</span> },
              { header: 'Department', accessor: 'department_name' },
              { header: 'Waste Stream', accessor: 'waste_type' },
              { header: 'Weight (kg)', accessor: 'weight_kg', render: (r) => `${formatNumber(r.weight_kg)} kg` },
              { header: 'Recycled / Composted', accessor: 'is_recycled', render: (r) => r.is_recycled ? <Badge variant="emerald">Recycled</Badge> : <Badge variant="amber">Landfill</Badge> },
              { header: 'Date', accessor: 'timestamp', render: (r) => formatDate(r.timestamp) },
              { header: 'Scope 3 Impact', accessor: 'calculated_emission', className: 'text-right', cellClassName: 'text-right font-mono font-bold text-emerald-400', render: (r) => formatCarbon(r.calculated_emission) },
            ]}
            data={wasteList}
            searchPlaceholder="Filter waste records..."
          />
        </div>
      )}

      {/* Tab 5: Appliances */}
      {activeTab === 'appliances' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  Campus Electrical Assets & HVAC Infrastructure
                </h4>
                <p className="text-[11px] text-slate-400">
                  Connected appliances, chillers, lab autoclaves, and power ratings.
                </p>
              </div>
            </div>
            <Badge variant="purple">Infrastructure</Badge>
          </div>

          <DataTable
            columns={[
              { header: 'ID', accessor: 'id', render: (r) => <span className="font-mono text-slate-500">#{r.id}</span> },
              { header: 'Department', accessor: 'department_name' },
              { header: 'Asset / Equipment', accessor: 'type' },
              { header: 'Power Rating', accessor: 'power_rating_kw', render: (r) => `${r.power_rating_kw} kW` },
              { header: 'Quantity', accessor: 'quantity' },
              { header: 'Operating Status', accessor: 'status', render: (r) => <Badge variant="default">{r.status}</Badge> },
            ]}
            data={appliancesList}
            searchPlaceholder="Filter appliances..."
          />
        </div>
      )}

      {/* Entry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Campus Electricity Consumption"
        subtitle="Saves directly to FastAPI backend and runs synchronous carbon emission calculation."
      >
        <ElectricityForm
          departments={departments}
          onSuccess={() => {
            setIsModalOpen(false);
            loadAll();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
