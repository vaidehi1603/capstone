import React, { useState, useEffect } from 'react';
import { emissionFactorService } from '../../services/emissionFactorService';
import { useAuth } from '../../hooks/useAuth';
import { DataTable } from '../../components/tables/DataTable';
import { Modal } from '../../components/common/Modal';
import { EmissionFactorForm } from '../../components/forms/EmissionFactorForm';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { Badge } from '../../components/common/Badge';
import { extractErrorMessage } from '../../utils/formatters';
import { Sliders, Plus, RefreshCw, ShieldCheck } from 'lucide-react';

export const EmissionFactorsPage = () => {
  const { isAdmin } = useAuth();
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadEmissionFactors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await emissionFactorService.getEmissionFactors();
      setFactors(data || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmissionFactors();
  }, []);

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      className: 'w-14',
      render: (row) => <span className="font-mono text-slate-500">#{row.id}</span>,
    },
    {
      header: 'GHG Scope',
      accessor: 'category',
      render: (row) => (
        <Badge
          variant={
            row.category === 'Scope 1' ? 'orange' : row.category === 'Scope 2' ? 'blue' : 'emerald'
          }
        >
          {row.category}
        </Badge>
      ),
    },
    {
      header: 'Subcategory / Activity',
      accessor: 'subcategory',
      render: (row) => <div className="font-semibold text-slate-900 dark:text-slate-100">{row.subcategory}</div>,
    },
    {
      header: 'Emission Factor Value',
      accessor: 'factor_value',
      render: (row) => (
        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
          {row.factor_value} <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">{row.factor_unit}</span>
        </div>
      ),
    },
    {
      header: 'Activity Unit',
      accessor: 'activity_unit',
      render: (row) => <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{row.activity_unit}</span>,
    },
    {
      header: 'Regulatory Source',
      accessor: 'source',
      render: (row) => (
        <div>
          <div className="text-slate-800 dark:text-slate-200 text-xs font-medium">{row.source}</div>
          {row.region && <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{row.region}</div>}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (row) => (
        <Badge variant={row.is_active ? 'emerald' : 'rose'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner size="lg" text="Fetching Emission Factors..." className="min-h-[50vh]" />;
  }

  if (error) {
    return <ErrorState title="Failed to Load Emission Factors" message={error} onRetry={loadEmissionFactors} className="my-8" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            GHG Emission Factors Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standardized greenhouse gas coefficients applied for automated campus carbon conversion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadEmissionFactors}
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
              Register Emission Factor
            </button>
          )}
        </div>
      </div>

      {/* Regulatory Info Card */}
      <div className="card-surface p-4 flex items-start gap-3.5 border-l-4 border-l-emerald-500">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-0.5">
            ISO 14064-1 & GHG Protocol Compliance
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Scope 2 electricity emissions are quantified using the Indian Central Electricity Authority (CEA) Baseline Database Version 19.0 (0.82 kgCO₂e/kWh average grid emission factor for Western Regional Grid, India).
          </p>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={factors}
        searchPlaceholder="Filter factors by category or source..."
        searchField="subcategory"
      />

      {/* Register Factor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Emission Factor"
        subtitle="Specify official GHG conversion coefficient with regulatory reference and activity units."
      >
        <EmissionFactorForm
          onSuccess={() => {
            setIsModalOpen(false);
            loadEmissionFactors();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
