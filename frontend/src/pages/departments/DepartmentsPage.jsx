import React, { useState, useEffect } from 'react';
import { departmentService } from '../../services/departmentService';
import { useAuth } from '../../hooks/useAuth';
import { DataTable } from '../../components/tables/DataTable';
import { Modal } from '../../components/common/Modal';
import { DepartmentForm } from '../../components/forms/DepartmentForm';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { Badge } from '../../components/common/Badge';
import { formatDate, extractErrorMessage } from '../../utils/formatters';
import { Plus, RefreshCw } from 'lucide-react';

export const DepartmentsPage = () => {
  const { isAdmin } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await departmentService.getDepartments();
      setDepartments(data || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      className: 'w-16',
      render: (row) => <span className="font-mono text-slate-500">#{row.id}</span>,
    },
    {
      header: 'Department Name',
      accessor: 'name',
      render: (row) => (
        <div className="font-bold text-slate-200">{row.name}</div>
      ),
    },
    {
      header: 'Code',
      accessor: 'code',
      render: (row) => <Badge variant="purple">{row.code}</Badge>,
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row) => (
        <span className="text-slate-400 max-w-md block truncate">
          {row.description || '—'}
        </span>
      ),
    },
    {
      header: 'Registered Date',
      accessor: 'created_at',
      render: (row) => (
        <span className="text-slate-400 font-mono text-[11px]">
          {formatDate(row.created_at)}
        </span>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner size="lg" text="Fetching Campus Departments..." className="min-h-[50vh]" />;
  }

  if (error) {
    return <ErrorState title="Failed to Load Departments" message={error} onRetry={loadDepartments} className="my-8" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            Campus Departments & Facilities
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registered academic, administrative, and residential campus carbon reporting zones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDepartments}
            title="Refresh"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-900/40"
            >
              <Plus className="w-4 h-4" />
              Add Department
            </button>
          )}
        </div>
      </div>

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-bold text-xs">
                  {dept.code}
                </div>
                <Badge variant="purple">Active Node</Badge>
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-1">{dept.name}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {dept.description || 'Standard academic department zone.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Department ID: #{dept.id}</span>
              <span className="font-mono">{formatDate(dept.created_at)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Departments Table */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-slate-200 mb-3">Department Registry Table</h3>
        <DataTable
          columns={columns}
          data={departments}
          searchPlaceholder="Search departments by name..."
          emptyMessage="No departments found."
        />
      </div>

      {/* Add Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Campus Department"
        subtitle="Adds a new monitored zone to PostgreSQL via FastAPI backend."
      >
        <DepartmentForm
          onSuccess={() => {
            setIsModalOpen(false);
            loadDepartments();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
