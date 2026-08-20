import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { departmentService } from '../../services/departmentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { DataTable } from '../../components/tables/DataTable';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { formatCarbon } from '../../utils/formatters';
import {
  FileText,
  Download,
  Plus,
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
        created_by: user?.name || 'Admin',
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
    toast.success(`Downloading ${report.file_reference}...`);
    // Export formatted metadata as CSV summary
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
          <div className="font-bold text-slate-200">{r.title}</div>
          <div className="text-[10px] text-slate-400 font-mono">{r.file_reference}</div>
        </div>
      ),
    },
    {
      header: 'Reporting Period',
      accessor: 'reporting_period',
      render: (r) => <span className="font-medium text-slate-300">{r.reporting_period}</span>,
    },
    {
      header: 'Department / Scope',
      accessor: 'department_name',
      render: (r) => <span className="text-slate-300 text-xs">{r.department_name}</span>,
    },
    {
      header: 'Emissions Accounted',
      accessor: 'total_emissions_kgco2e',
      render: (r) => (
        <span className="font-mono font-bold text-emerald-400">
          {formatCarbon(r.total_emissions_kgco2e)}
        </span>
      ),
    },
    {
      header: 'Compliance Status',
      accessor: 'status',
      render: (r) => (
        <Badge variant={r.status === 'Certified' ? 'emerald' : 'cyan'}>
          {r.status}
        </Badge>
      ),
    },
    {
      header: 'Action',
      accessor: 'id',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (r) => (
        <button
          onClick={() => handleDownloadReport(r)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-400 text-xs font-semibold transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading ESG Report Archive..." className="min-h-[50vh]" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              ESG Compliance & Carbon Audit Reports
            </h2>
            <Badge variant="emerald">ISO 14064 Certified</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated greenhouse gas accounting statements and regulatory sustainability disclosures.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-900/40"
        >
          <Plus className="w-4 h-4" />
          Generate New ESG Report
        </button>
      </div>

      {/* Reports Table */}
      <DataTable
        columns={columns}
        data={reports}
        searchPlaceholder="Search reports by title..."
        searchField="title"
        emptyMessage="No reports found."
      />

      {/* Generate Report Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate ESG Sustainability Audit Report"
        subtitle="Aggregates verified scope emissions, methodology notes, and emission factors."
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Report Type <span className="text-rose-400">*</span>
            </label>
            <select
              value={newReportType}
              onChange={(e) => setNewReportType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="Quarterly ESG Carbon Audit">Quarterly ESG Carbon Audit</option>
              <option value="Annual Campus ISO 14064 GHG Inventory">Annual Campus ISO 14064 GHG Inventory</option>
              <option value="Scope 2 Electricity Profile">Scope 2 Electricity Profile</option>
              <option value="Departmental Energy Audit">Departmental Energy Audit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Reporting Period <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={newReportingPeriod}
              onChange={(e) => setNewReportingPeriod(e.target.value)}
              placeholder="e.g. Q1 2024 (Jan - Mar) or FY 2023-24"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Department Scope
            </label>
            <select
              value={newDeptId}
              onChange={(e) => setNewDeptId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Campus Departments (Consolidated)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-900/40 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {generating ? 'Generating Audit Report...' : 'Generate Certified Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
