import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { departmentService } from '../../services/departmentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { DataTable } from '../../components/tables/DataTable';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { formatCarbon, formatDate } from '../../utils/formatters';
import {
  FileText,
  Download,
  Plus,
  RefreshCw,
  ShieldCheck,
  Printer,
} from 'lucide-react';

export const ReportsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newReportType, setNewReportType] = useState('Quarterly ESG Carbon Audit');
  const [newReportingPeriod, setNewReportingPeriod] = useState('Q1 2024 (Jan - Mar)');
  const [newDeptId, setNewDeptId] = useState('');
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rData, deptData] = await Promise.all([
        reportService.getReports(),
        departmentService.getDepartments().catch(() => []),
      ]);
      setReports(rData || []);
      setDepartments(deptData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const dept = departments.find((d) => String(d.id) === String(newDeptId));
      await reportService.generateReport({
        report_type: newReportType,
        reporting_period: newReportingPeriod,
        department_id: newDeptId ? parseInt(newDeptId, 10) : null,
        department_name: dept ? dept.name : 'All Campus Departments',
        created_by: user?.name || 'Administrator',
        total_emissions_kgco2e: 8200.0,
      });
      toast.success('ESG Carbon Audit Report generated successfully!');
      setIsModalOpen(false);
      loadData();
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = (report) => {
    toast.success(`Exporting ${report.file_reference}...`);
    const rows = [
      {
        Report_Title: report.title,
        Report_Type: report.report_type,
        Reporting_Period: report.reporting_period,
        Department_Scope: report.department_name,
        Total_Campus_Emissions_kgCO2e: report.total_emissions_kgco2e,
        Generated_By: report.created_by,
        Generated_Date: report.generated_at,
        Status: report.status,
      },
    ];
    reportService.exportToCSV(`${report.file_reference.replace('.pdf', '')}_AuditSummary.csv`, rows);
  };

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      className: 'w-14',
      render: (r) => <span className="font-mono text-slate-500">#{r.id}</span>,
    },
    {
      header: 'Report Title',
      accessor: 'title',
      render: (r) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">{r.title}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{r.file_reference}</div>
        </div>
      ),
    },
    {
      header: 'Reporting Period',
      accessor: 'reporting_period',
      render: (r) => <span className="font-medium text-slate-700 dark:text-slate-300 font-mono text-xs">{r.reporting_period}</span>,
    },
    {
      header: 'Department / Scope',
      accessor: 'department_name',
      render: (r) => <span className="text-slate-700 dark:text-slate-300 text-xs">{r.department_name}</span>,
    },
    {
      header: 'Emissions Accounted',
      accessor: 'total_emissions_kgco2e',
      render: (r) => (
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
          {formatCarbon(r.total_emissions_kgco2e)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => (
        <Badge variant={r.status === 'Certified' ? 'emerald' : 'blue'}>
          {r.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (r) => (
        <button
          onClick={() => handleDownloadReport(r)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading ESG Report Registry..." className="min-h-[50vh]" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              ESG & Carbon Compliance Reporting Registry
            </h1>
            <Badge variant="emerald">ISO 14064-1 Compliant</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generated greenhouse gas inventory statements, executive sustainability summaries, and CSV audit exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Generate New Report
          </button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={reports}
        searchPlaceholder="Filter reports by title or reporting period..."
        searchField="title"
      />

      {/* Generate Report Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate ESG Carbon Audit Report"
        subtitle="Produce an official emissions inventory summary according to ISO 14064 standards."
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
              Report Type / Classification
            </label>
            <select
              value={newReportType}
              onChange={(e) => setNewReportType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl input-surface text-xs font-semibold font-mono"
            >
              <option value="Quarterly ESG Carbon Audit">Quarterly ESG Carbon Audit</option>
              <option value="Annual Campus Greenhouse Gas Inventory">Annual Campus Greenhouse Gas Inventory</option>
              <option value="Scope 2 Electricity & Billing Demand Audit">Scope 2 Electricity & Billing Demand Audit</option>
              <option value="Departmental Energy Intensity Profile">Departmental Energy Intensity Profile</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
              Reporting Term / Period
            </label>
            <input
              type="text"
              value={newReportingPeriod}
              onChange={(e) => setNewReportingPeriod(e.target.value)}
              placeholder="e.g. Q1 2024 (Jan - Mar) or Academic Year 2023-24"
              required
              className="w-full px-3 py-2 rounded-xl input-surface text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
              Target Departmental Scope
            </label>
            <select
              value={newDeptId}
              onChange={(e) => setNewDeptId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl input-surface text-xs font-semibold font-mono"
            >
              <option value="">All Monitored Campus Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {generating ? 'Compiling Statement...' : 'Generate Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
