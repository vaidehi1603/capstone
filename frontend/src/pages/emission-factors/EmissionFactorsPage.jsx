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
import { Sliders, Plus, RefreshCw } from 'lucide-react';

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
            row.category === 'Scope 1' ? 'amber' : row.category === 'Scope 2' ? 'emerald' : 'cyan'
          }
        >
          {row.category}
        </Badge>
      ),
    },
    {
      header: 'Subcategory / Fuel',
      accessor: 'subcategory',
      render: (row) => <div className="font-semibold text-slate-200">{row.subcategory}</div>,
    },
    {
      header: 'Emission Factor Value',
      accessor: 'factor_value',
      render: (row) => (
        <div className="font-mono font-bold text-emerald-400">
          {row.factor_value} <span className="text-slate-400 text-xs font-normal">{row.factor_unit}</span>
        </div>
      ),
    },
    {
      header: 'Activity Unit',
      accessor: 'activity_unit',
      render: (row) => <span className="font-mono text-slate-300">{row.activity_unit}</span>,
    },
    {
      header: 'Regulatory Source',
      accessor: 'source',
      render: (row) => (
        <div>
          <div className="text-slate-300 text-xs">{row.source}</div>
          {row.region && <div className="text-[10px] text-slate-400 font-mono">{row.region}</div>}
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
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            GHG Emission Factors Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Standardized greenhouse gas coefficients applied for automated campus carbon conversion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadEmissionFactors}
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
              Register Emission Factor
            </button>
          )}
        </div>
      </div>

      {/* Info card */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sliders className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-slate-100">Synchronous Backend Calculation Engine:</strong> Whenever activity
          data (e.g. electricity in kWh) is submitted, the backend automatically queries the most recently updated active
          emission factor from this registry and writes a timestamped record to <code className="font-mono text-emerald-400">carbon_calculations</code>.
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={factors}
        searchPlaceholder="Filter emission factors by category/source..."
        searchField="subcategory"
        emptyMessage="No emission factors registered."
      />

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Emission Factor"
        subtitle="Adds a new carbon coefficient factor to the database."
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
