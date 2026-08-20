import React from 'react';
import { useForm } from 'react-hook-form';
import { emissionFactorService } from '../../services/emissionFactorService';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../utils/formatters';
import { Sliders, Loader2 } from 'lucide-react';

export const EmissionFactorForm = ({ onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: {
      category: 'Scope 2',
      subcategory: 'Grid Electricity',
      activity_unit: 'kWh',
      factor_value: '',
      factor_unit: 'kgCO2e/kWh',
      source: 'Central Electricity Authority (CEA)',
      region: 'India',
      is_active: true,
    }
  });

  const toast = useToast();

  const onSubmit = async (data) => {
    try {
      const payload = {
        category: data.category,
        subcategory: data.subcategory.trim(),
        activity_unit: data.activity_unit.trim(),
        factor_value: parseFloat(data.factor_value),
        factor_unit: data.factor_unit.trim(),
        source: data.source.trim(),
        region: data.region ? data.region.trim() : null,
        is_active: Boolean(data.is_active),
      };

      const result = await emissionFactorService.createEmissionFactor(payload);
      toast.success(`Emission Factor for "${result.subcategory}" registered!`);
      reset();
      if (onSuccess) onSuccess(result);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            GHG Scope <span className="text-rose-400">*</span>
          </label>
          <select
            {...register('category', { required: 'Scope category is required' })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="Scope 1">Scope 1 (Direct Combustion & Fleet)</option>
            <option value="Scope 2">Scope 2 (Purchased Electricity)</option>
            <option value="Scope 3">Scope 3 (Waste, Water & Commute)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Subcategory / Fuel <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Grid Electricity, Diesel, LPG"
            {...register('subcategory', { required: 'Subcategory is required' })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Factor Value <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            step="any"
            placeholder="e.g. 0.82"
            {...register('factor_value', {
              required: 'Factor value is required',
              min: { value: 0.0001, message: 'Must be > 0' }
            })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors font-mono"
          />
          {errors.factor_value && <p className="text-[11px] text-rose-400 mt-1">{errors.factor_value.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Activity Unit <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. kWh, Liters, kg"
            {...register('activity_unit', { required: 'Unit is required' })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Factor Unit <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. kgCO2e/kWh"
            {...register('factor_unit', { required: 'Factor unit is required' })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Regulatory Source <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Central Electricity Authority (CEA) / IPCC"
            {...register('source', { required: 'Source is required' })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Region / Grid Zone
          </label>
          <input
            type="text"
            placeholder="e.g. India National Grid / Northern Region"
            {...register('region')}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-900/40 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Registering Factor...
            </>
          ) : (
            <>
              <Sliders className="w-4 h-4" />
              Save Emission Factor
            </>
          )}
        </button>
      </div>
    </form>
  );
};
