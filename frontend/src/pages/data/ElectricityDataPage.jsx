import React, { useState, useEffect } from 'react';
import { electricityService } from '../../services/electricityService';
import { departmentService } from '../../services/departmentService';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../hooks/useAuth';
import { useDataMode } from '../../context/DataModeContext';
import { useToast } from '../../hooks/useToast';
import { DataTable } from '../../components/tables/DataTable';
import { Modal } from '../../components/common/Modal';
import { ElectricityForm } from '../../components/forms/ElectricityForm';
import { BillUploadWorkflow } from '../../components/forms/BillUploadWorkflow';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { Badge } from '../../components/common/Badge';
import { formatNumber, formatCarbon, formatDate, extractErrorMessage } from '../../utils/formatters';
import { Plus, Download, RefreshCw, UploadCloud, Building2, Zap, Filter } from 'lucide-react';
import axios from 'axios';

export const ElectricityDataPage = () => {
  const { isAdmin, isMaintenance } = useAuth();
  const { isVesit } = useDataMode();
  const [electricityData, setElectricityData] = useState([]);
  const [vesitRawRecords, setVesitRawRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL');
  const [selectedWingFilter, setSelectedWingFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBillUploadOpen, setIsBillUploadOpen] = useState(false);
  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isVesit) {
        const token = localStorage.getItem('token');
        const vesitRes = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/electricity/vesit`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 300 },
          }
        );
        setVesitRawRecords(vesitRes.data || []);
      } else {
        const [elecRes, deptRes] = await Promise.all([
          electricityService.getElectricityData(),
          departmentService.getDepartments(),
        ]);
        setElectricityData(elecRes || []);
        setDepartments(deptRes || []);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isVesit]);

  // Export CSV
  const handleExportCSV = () => {
    if (isVesit) {
      if (!vesitRawRecords.length) {
        toast.info('No VESIT electricity records to export.');
        return;
      }
      const rows = vesitRawRecords.map((item) => ({
        ID: item.energy_id,
        Date: item.date,
        Year: item.year,
        Month: item.month,
        Wing: item.wing,
        Units_Consumed_kWh: item.units_consumed_kwh,
        Amount_Paid_INR: item.amount_paid,
        Rate_Per_Unit_INR: item.rate_per_unit,
        Billing_Demand_KVA: item.billing_demand,
        Power_Factor: item.power_factor,
        Calculated_CO2e_kg: (item.units_consumed_kwh * 0.82).toFixed(2),
      }));
      reportService.exportToCSV(`VESIT_Electricity_Dataset_${Date.now()}.csv`, rows);
      toast.success('VESIT electricity records exported to CSV.');
    } else {
      if (!electricityData.length) {
        toast.info('No electricity records to export.');
        return;
      }
      const rows = electricityData.map((item) => {
        const dept = departments.find((d) => d.id === item.department_id);
        return {
          ID: item.id,
          Department: dept ? `${dept.name} (${dept.code})` : item.department_id,
          Consumption_kWh: item.kwh,
          Source: item.source,
          Timestamp: item.timestamp,
          Calculated_CO2e_kg: (item.kwh * 0.82).toFixed(2),
        };
      });
      reportService.exportToCSV(`Electricity_Records_${Date.now()}.csv`, rows);
      toast.success('Electricity records exported as CSV.');
    }
  };

  // Filtering
  const filteredVesit = vesitRawRecords.filter((item) => {
    if (selectedYearFilter !== 'ALL' && String(item.year) !== selectedYearFilter) return false;
    if (selectedWingFilter !== 'ALL' && item.wing !== selectedWingFilter) return false;
    return true;
  });

  const filteredDemo = selectedDeptFilter === 'ALL'
    ? electricityData
    : electricityData.filter((item) => String(item.department_id) === String(selectedDeptFilter));

  const totalKwh = isVesit
    ? filteredVesit.reduce((acc, curr) => acc + (curr.units_consumed_kwh || 0), 0)
    : filteredDemo.reduce((acc, curr) => acc + (curr.kwh || 0), 0);
  const totalCarbon = totalKwh * 0.82;

  // VESIT Table Columns
  const vesitColumns = [
    {
      header: 'Month & Year',
      accessor: 'date',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">{row.month} {row.year}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{row.date}</div>
        </div>
      ),
    },
    {
      header: 'Campus Wing / Sector',
      accessor: 'wing',
      render: (row) => (
        <Badge variant={row.wing?.includes('A Wing') ? 'blue' : row.wing?.includes('B Wing') ? 'orange' : 'purple'}>
          {row.wing}
        </Badge>
      ),
    },
    {
      header: 'Consumption (kWh)',
      accessor: 'units_consumed_kwh',
      render: (row) => (
        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
          {formatNumber(row.units_consumed_kwh)} kWh
        </span>
      ),
    },
    {
      header: 'Billed Amount (INR)',
      accessor: 'amount_paid',
      render: (row) => (
        <span className="font-mono text-slate-700 dark:text-slate-300">
          {row.amount_paid ? `₹${formatNumber(row.amount_paid)}` : '—'}
        </span>
      ),
    },
    {
      header: 'Power Factor',
      accessor: 'power_factor',
      render: (row) => (
        <span className="font-mono text-slate-600 dark:text-slate-400 text-xs">
          {row.power_factor ? row.power_factor.toFixed(2) : '—'}
        </span>
      ),
    },
    {
      header: 'Computed Scope 2 CO₂e',
      accessor: 'units_consumed_kwh',
      className: 'text-right',
      cellClassName: 'text-right font-mono font-bold text-emerald-600 dark:text-emerald-400',
      render: (row) => formatCarbon(row.units_consumed_kwh * 0.82),
    },
  ];

  // Demo Table Columns
  const demoColumns = [
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
    { header: 'Timestamp', accessor: 'timestamp', render: (r) => formatDate(r.timestamp) },
    {
      header: 'Computed Scope 2 CO₂e',
      accessor: 'kwh',
      className: 'text-right',
      cellClassName: 'text-right font-mono font-bold text-emerald-600 dark:text-emerald-400',
      render: (r) => formatCarbon(r.kwh * 0.82),
    },
  ];

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading Verified Electricity Datasets..." className="min-h-[50vh]" />;
  }

  if (error) {
    return <ErrorState title="Failed to Load Electricity Records" message={error} onRetry={loadData} className="my-8" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Electricity Telemetry & Billing Ledger
            </h1>
            <Badge variant={isVesit ? 'emerald' : 'amber'}>
              {isVesit ? 'VESIT Official Records' : 'Test Set'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Historical electricity consumption, billing demand, power factor, and Scope 2 emissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={() => setIsBillUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Bill
          </button>

          {(isAdmin || isMaintenance) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          )}
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-surface p-4 border-l-4 border-l-sky-500">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
            Filtered Energy Consumption
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">
            {formatNumber(totalKwh)} <span className="text-xs font-normal text-slate-500">kWh</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
            {isVesit ? `${filteredVesit.length} Records matched` : `${filteredDemo.length} Entries matched`}
          </div>
        </div>

        <div className="card-surface p-4 border-l-4 border-l-emerald-500">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
            Scope 2 Carbon Generated
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {formatCarbon(totalCarbon)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
            CEA Factor: 0.82 kgCO₂e/kWh
          </div>
        </div>

        <div className="card-surface p-4 border-l-4 border-l-purple-500">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
            Active Dataset Context
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">
            {isVesit ? 'VESIT Campus' : `${departments.length} Zones`}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
            {isVesit ? '350 KVA (A) + 175 KVA (B)' : 'Multi-department demo feed'}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      {isVesit ? (
        <div className="card-surface p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono mr-1">
              <Filter className="w-3.5 h-3.5" />
              Filters:
            </div>

            {/* Year Filter */}
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl input-surface text-xs font-semibold font-mono"
            >
              <option value="ALL">All Years (2022–2026)</option>
              <option value="2026">Year 2026</option>
              <option value="2025">Year 2025</option>
              <option value="2024">Year 2024</option>
              <option value="2023">Year 2023</option>
              <option value="2022">Year 2022</option>
            </select>

            {/* Wing Filter */}
            <select
              value={selectedWingFilter}
              onChange={(e) => setSelectedWingFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl input-surface text-xs font-semibold font-mono"
            >
              <option value="ALL">All Campus Wings</option>
              <option value="A Wing">A Wing (350 KVA Demand)</option>
              <option value="B Wing">B Wing (175 KVA Demand)</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSelectedYearFilter('ALL');
              setSelectedWingFilter('ALL');
            }}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="card-surface p-4 flex items-center gap-4">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
            Department Filter:
          </label>
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl input-surface text-xs font-semibold font-mono"
          >
            <option value="ALL">All Monitored Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Table */}
      <DataTable
        columns={isVesit ? vesitColumns : demoColumns}
        data={isVesit ? filteredVesit : filteredDemo}
        searchPlaceholder="Search by month, wing, or ID..."
        searchField={isVesit ? 'month' : 'source'}
      />

      {/* Manual Entry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Electricity Consumption"
        subtitle="Input metered kWh consumption for automated Scope 2 carbon calculation."
      >
        <ElectricityForm
          departments={departments}
          onSuccess={() => {
            setIsModalOpen(false);
            loadData();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Bill Upload Modal */}
      <Modal
        isOpen={isBillUploadOpen}
        onClose={() => setIsBillUploadOpen(false)}
        title="Upload Utility Electricity Bill"
        subtitle="Upload verified monthly MSEDCL/Tata Power electricity bills with automated validation."
        maxWidth="max-w-2xl"
      >
        <BillUploadWorkflow
          onSuccess={() => {
            setIsBillUploadOpen(false);
            loadData();
          }}
          onCancel={() => setIsBillUploadOpen(false)}
        />
      </Modal>
    </div>
  );
};
