import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { electricityService } from '../../services/electricityService';
import { activityService } from '../../services/activityService';
import { departmentService } from '../../services/departmentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ElectricityForm } from '../../components/forms/ElectricityForm';
import { BillUploadWorkflow } from '../../components/forms/BillUploadWorkflow';
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
  UploadCloud,
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
  const [isBillUploadOpen, setIsBillUploadOpen] = useState(false);

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
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Sustainability Data Collection Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Input verified campus activity metrics across Scope 1, Scope 2, and Scope 3 categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBillUploadOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Electricity Bill
          </button>

          {(isAdmin || isMaintenance) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add {tabs.find((t) => t.id === activeTab)?.name.split(' ')[0]} Entry
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                activeTab === tab.id ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab 1: Electricity Data (Scope 2) */}
      {activeTab === 'electricity' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/40 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Campus Electricity Telemetry & Metered Records
                </h2>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Metered electricity inputs generate standardized Scope 2 carbon accounting records at 0.82 kgCO₂e/kWh.
                </p>
              </div>
            </div>
            <NavLink
              to="/data/electricity"
              className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1"
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
                header: 'Calculated CO₂e',
                accessor: 'kwh',
                className: 'text-right',
                cellClassName: 'text-right font-mono font-bold text-emerald-600 dark:text-emerald-400',
                render: (r) => formatCarbon(r.kwh * 0.82),
              },
            ]}
            data={electricityList}
            searchPlaceholder="Filter electricity records..."
          />
        </div>
      )}

      {/* Tab 2: Transportation (Scope 1) */}
      {activeTab === 'transport' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40 flex items-center justify-center">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Campus Fleet & Commuting Activity (Scope 1)
                </h2>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Covers campus shuttle buses, diesel generator testing, and institutional transport.
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
              { header: 'Emission Output', accessor: 'calculated_emission', className: 'text-right', cellClassName: 'text-right font-mono font-bold text-amber-600 dark:text-amber-400', render: (r) => formatCarbon(r.calculated_emission) },
            ]}
            data={transportList}
            searchPlaceholder="Filter transportation records..."
          />
        </div>
      )}

      {/* Tab 3: Water (Scope 3) */}
      {activeTab === 'water' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/40 flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Water Supply & Borewell Pumping (Scope 3)
                </h2>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Includes municipal water supply, borehole groundwater extraction, and water purification energy.
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
              { header: 'Calculated Carbon', accessor: 'calculated_emission', className: 'text-right', cellClassName: 'text-right font-mono font-bold text-sky-600 dark:text-sky-400', render: (r) => formatCarbon(r.calculated_emission) },
            ]}
            data={waterList}
            searchPlaceholder="Filter water records..."
          />
        </div>
      )}

      {/* Tab 4: Waste (Scope 3) */}
      {activeTab === 'waste' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Waste Management & Organic Diversion (Scope 3)
                </h2>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Campus cafeteria organic waste, recyclables, compost pit activity, and e-waste disposal.
                </p>
              </div>
            </div>
            <Badge variant="emerald">Scope 3</Badge>
          </div>

          <DataTable
            columns={[
              { header: 'ID', accessor: 'id', render: (r) => <span className="font-mono text-slate-500">#{r.id}</span> },
              { header: 'Department', accessor: 'department_name' },
              { header: 'Waste Type', accessor: 'waste_type' },
              { header: 'Weight (kg)', accessor: 'kg_waste', render: (r) => `${formatNumber(r.kg_waste)} kg` },
              { header: 'Disposal Route', accessor: 'disposal_method', render: (r) => <Badge variant={r.disposal_method === 'Composting' ? 'emerald' : 'amber'}>{r.disposal_method}</Badge> },
              { header: 'Date', accessor: 'timestamp', render: (r) => formatDate(r.timestamp) },
              { header: 'Calculated Carbon', accessor: 'calculated_emission', className: 'text-right', cellClassName: 'text-right font-mono font-bold text-emerald-600 dark:text-emerald-400', render: (r) => formatCarbon(r.calculated_emission) },
            ]}
            data={wasteList}
            searchPlaceholder="Filter waste records..."
          />
        </div>
      )}

      {/* Tab 5: Appliances & Assets */}
      {activeTab === 'appliances' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/40 flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  VESIT Electrical Assets & Equipment Registry
                </h2>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Audited campus equipment inventory across air conditioning, computing, lighting, and heavy loads.
                </p>
              </div>
            </div>
            <Badge variant="purple">Asset Registry</Badge>
          </div>

          <DataTable
            columns={[
              { header: 'ID', accessor: 'id', render: (r) => <span className="font-mono text-slate-500">#{r.id}</span> },
              { header: 'Appliance Category', accessor: 'appliance_name' },
              { header: 'Location / Wing', accessor: 'location', render: (r) => <span className="font-mono">{r.location}</span> },
              { header: 'Quantity', accessor: 'quantity', render: (r) => <span className="font-bold">{formatNumber(r.quantity, 0)}</span> },
              { header: 'Wattage (W)', accessor: 'wattage_per_unit', render: (r) => `${r.wattage_per_unit} W` },
              { header: 'Daily Hours', accessor: 'daily_usage_hours', render: (r) => `${r.daily_usage_hours} hrs/day` },
              { header: 'Est. Monthly kWh', accessor: 'monthly_kwh', className: 'text-right', cellClassName: 'text-right font-mono font-bold text-sky-600 dark:text-sky-400', render: (r) => `${formatNumber((r.wattage_per_unit * r.quantity * r.daily_usage_hours * 25) / 1000)} kWh` },
            ]}
            data={appliancesList}
            searchPlaceholder="Filter asset records..."
          />
        </div>
      )}

      {/* Electricity Entry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Activity Data"
        subtitle="Input verified campus telemetry metrics for automated GHG accounting."
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

      {/* Bill Upload Modal */}
      <Modal
        isOpen={isBillUploadOpen}
        onClose={() => setIsBillUploadOpen(false)}
        title="Upload Electricity Utility Bill"
        subtitle="Upload verified monthly MSEDCL/Tata Power electricity bills with automated validation."
        maxWidth="max-w-2xl"
      >
        <BillUploadWorkflow
          onSuccess={() => {
            setIsBillUploadOpen(false);
            loadAll();
          }}
          onCancel={() => setIsBillUploadOpen(false)}
        />
      </Modal>
    </div>
  );
};
