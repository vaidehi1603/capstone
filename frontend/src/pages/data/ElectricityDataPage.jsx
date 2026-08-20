import React, { useState, useEffect } from 'react';
import { electricityService } from '../../services/electricityService';
import { departmentService } from '../../services/departmentService';
import { analyticsService } from '../../services/analyticsService';
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
import { Plus, Download, RefreshCw, UploadCloud, Building2, Zap } from 'lucide-react';
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
          `${import.meta.env.VITE_API_BASE_URL}/electricity/vesit`,
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
      toast.success('VESIT electricity records exported as CSV.');
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
          <div className="font-bold text-slate-100">{row.month} {row.year}</div>
          <div className="text-[10px] text-slate-400 font-mono">{row.date}</div>
        </div>
      ),
    },
    {
      header: 'Campus Wing / Sector',
      accessor: 'wing',
      render: (row) => (
        <Badge
          variant={row.wing === 'A Wing' ? 'cyan' : row.wing === 'B Wing' ? 'emerald' : 'amber'}
        >
          {row.wing}
        </Badge>
      ),
    },
    {
      header: 'Consumption (kWh)',
      accessor: 'units_consumed_kwh',
      render: (row) => (
        <span className="font-mono font-bold text-slate-100">
          {formatNumber(row.units_consumed_kwh)} <span className="text-slate-400 font-normal">kWh</span>
        </span>
      ),
    },
    {
      header: 'Amount Paid (₹)',
      accessor: 'amount_paid',
      render: (row) => (
        <span className="font-mono text-slate-200">
          {row.amount_paid ? `₹${formatNumber(row.amount_paid)}` : '—'}
        </span>
      ),
    },
    {
      header: 'Billing Demand',
      accessor: 'billing_demand',
      render: (row) => (
        <span className="font-mono text-slate-400 text-xs">
          {row.billing_demand ? `${row.billing_demand} KVA` : '—'}
        </span>
      ),
    },
    {
      header: 'Power Factor',
      accessor: 'power_factor',
      render: (row) => (
        <span className="font-mono text-slate-400 text-xs">
          {row.power_factor ?? '—'}
        </span>
      ),
    },
    {
      header: 'Calculated Scope 2 CO₂e',
      accessor: 'units_consumed_kwh',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <span className="font-mono font-bold text-emerald-400">
          {formatCarbon(row.units_consumed_kwh * 0.82)}
        </span>
      ),
    },
  ];

  // Demo Table Columns
  const demoColumns = [
    {
      header: 'ID',
      accessor: 'id',
      className: 'w-16',
      render: (row) => <span className="font-mono text-slate-500">#{row.id}</span>,
    },
    {
      header: 'Department',
      accessor: 'department_id',
      render: (row) => {
        const dept = departments.find((d) => d.id === row.department_id);
        return (
          <div>
            <div className="font-semibold text-slate-200">
              {dept ? dept.name : `Department #${row.department_id}`}
            </div>
            {dept && <div className="text-[10px] text-slate-400 font-mono">{dept.code}</div>}
          </div>
        );
      },
    },
    {
      header: 'Consumption (kWh)',
      accessor: 'kwh',
      render: (row) => (
        <span className="font-mono font-bold text-slate-100">
          {formatNumber(row.kwh)} <span className="text-slate-400 font-normal">kWh</span>
        </span>
      ),
    },
    {
      header: 'Power Source',
      accessor: 'source',
      render: (row) => (
        <Badge
          variant={row.source === 'Solar' ? 'emerald' : row.source === 'DG Set' ? 'amber' : 'cyan'}
        >
          {row.source}
        </Badge>
      ),
    },
    {
      header: 'Date & Time',
      accessor: 'timestamp',
      render: (row) => (
        <span className="text-slate-400 text-[11px] font-mono">
          {formatDate(row.timestamp, true)}
        </span>
      ),
    },
    {
      header: 'Estimated Carbon (CO₂e)',
      accessor: 'calculated_emission',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <span className="font-mono font-bold text-emerald-400">
          {formatCarbon(row.kwh * 0.82)}
        </span>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading Campus Electricity Records..." className="min-h-[50vh]" />;
  }

  if (error) {
    return <ErrorState title="Failed to Load Electricity Records" message={error} onRetry={loadData} className="my-8" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              {isVesit ? 'VESIT Official Electricity Records (2022–2026)' : 'Electricity Consumption Records'}
            </h2>
            <Badge variant={isVesit ? 'emerald' : 'cyan'}>Scope 2</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isVesit
              ? 'Actual utility meter logs across A Wing (350 KVA), B Wing (175 KVA), and Construction.'
              : 'Verified smart-meter & utility grid energy consumption logged across academic zones.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          {isVesit ? (
            <button
              onClick={() => setIsBillUploadOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Utility Bill
            </button>
          ) : (
            (isAdmin || isMaintenance) && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-900/40"
              >
                <Plus className="w-4 h-4" />
                New Entry
              </button>
            )
          )}
        </div>
      </div>

      {/* Summary Banner & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Filtered Energy
          </div>
          <div className="text-xl font-extrabold text-slate-100 font-mono mt-1">
            {formatNumber(totalKwh)} kWh
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Computed Scope 2 Carbon
          </div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
            {formatCarbon(totalCarbon)}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          {isVesit ? (
            <div className="flex gap-2 w-full">
              <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Year</div>
                <select
                  value={selectedYearFilter}
                  onChange={(e) => setSelectedYearFilter(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none"
                >
                  <option value="ALL">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>

              <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Wing</div>
                <select
                  value={selectedWingFilter}
                  onChange={(e) => setSelectedWingFilter(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none"
                >
                  <option value="ALL">All Wings</option>
                  <option value="A Wing">A Wing (350 KVA)</option>
                  <option value="B Wing">B Wing (175 KVA)</option>
                  <option value="Construction">Construction</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Department Filter
              </div>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
              >
                <option value="ALL">All Campus Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={isVesit ? vesitColumns : demoColumns}
        data={isVesit ? filteredVesit : filteredDemo}
        searchPlaceholder={isVesit ? "Search VESIT records (month, wing, kWh)..." : "Filter electricity records..."}
        emptyMessage="No electricity records found for this selection."
      />

      {/* Upload Electricity Bill Modal (VESIT) */}
      <Modal
        isOpen={isBillUploadOpen}
        onClose={() => setIsBillUploadOpen(false)}
        title="Upload Electricity Bill & Compute Carbon"
        subtitle="Automatic entity extraction, historical validation, and deterministic Scope 2 calculation."
      >
        <BillUploadWorkflow
          onSuccess={() => {
            loadData();
          }}
          onCancel={() => setIsBillUploadOpen(false)}
        />
      </Modal>

      {/* Manual Entry Modal (Demo) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Campus Electricity Consumption"
        subtitle="Backend synchronously computes Scope 2 carbon using active CEA emission factor (0.82 kgCO2e/kWh)."
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
    </div>
  );
};
