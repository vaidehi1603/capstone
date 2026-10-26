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
import { Plus, RefreshCw, Building2, Layers } from 'lucide-react';

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
        <div className="font-bold text-slate-900 dark:text-slate-100">{row.name}</div>
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
        <span className="text-slate-600 dark:text-slate-400 max-w-md block truncate">
          {row.description || '—'}
        </span>
      ),
    },
    {
      header: 'Registered Date',
      accessor: 'created_at',
      render: (row) => (
        <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
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
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Campus Departments & Facilities
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Registered academic, administrative, and laboratory campus carbon accounting zones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDepartments}
            title="Refresh"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
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
            className="card-surface card-surface-hover p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/30 dark:text-purple-400 flex items-center justify-center font-mono font-bold text-xs">
                  {dept.code}
                </div>
                <Badge variant="purple">Active Node</Badge>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">{dept.name}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {dept.description || 'Standard academic department carbon zone.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span>Department ID: #{dept.id}</span>
              <span>{formatDate(dept.created_at)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Compact Registry Table */}
      <DataTable
        columns={columns}
        data={departments}
        searchPlaceholder="Search departments by name or code..."
        searchField="name"
      />

      {/* Add Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Campus Department"
        subtitle="Register a new academic or operational department zone for carbon footprint allocation."
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
