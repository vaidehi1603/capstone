import React, { useState, useEffect } from 'react';
import { electricityService } from '../../services/electricityService';
import { departmentService } from '../../services/departmentService';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { DataTable } from '../../components/tables/DataTable';
import { Modal } from '../../components/common/Modal';
import { ElectricityForm } from '../../components/forms/ElectricityForm';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { Badge } from '../../components/common/Badge';
import { formatNumber, formatCarbon, formatDate, extractErrorMessage } from '../../utils/formatters';
import { Plus, Download, RefreshCw } from 'lucide-react';

export const ElectricityDataPage = () => {
  const { isAdmin, isMaintenance } = useAuth();
  const [electricityData, setElectricityData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [elecRes, deptRes] = await Promise.all([
        electricityService.getElectricityData(),
        departmentService.getDepartments(),
      ]);
      setElectricityData(elecRes || []);
      setDepartments(deptRes || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = () => {
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
  };

  const filteredData = selectedDeptFilter === 'ALL'
    ? electricityData
    : electricityData.filter((item) => String(item.department_id) === String(selectedDeptFilter));

  const totalKwh = filteredData.reduce((acc, curr) => acc + (curr.kwh || 0), 0);
  const totalCarbon = totalKwh * 0.82;

  const columns = [
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
      header: 'Backend Computed CO₂e',
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
    return <LoadingSpinner size="lg" text="Fetching Electricity Activity Logs..." className="min-h-[50vh]" />;
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
              Electricity Consumption Records
            </h2>
            <Badge variant="cyan">Scope 2</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Verified smart-meter & utility grid energy consumption logged across academic & residential zones.
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
          {(isAdmin || isMaintenance) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-900/40"
            >
              <Plus className="w-4 h-4" />
              New Entry
            </button>
          )}
        </div>
      </div>

      {/* Summary Banner */}
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
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Department Filter
            </div>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="mt-1 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
            >
              <option value="ALL">All Campus Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        searchPlaceholder="Filter electricity records..."
        emptyMessage="No electricity records found for this selection."
      />

      {/* Entry Modal */}
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
