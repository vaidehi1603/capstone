import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { electricityService } from '../../services/electricityService';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage, formatCarbon } from '../../utils/formatters';
import { DEFAULT_EMISSION_FACTOR_GRID_KWH } from '../../utils/constants';
import { Zap, Calculator, Loader2 } from 'lucide-react';

export const ElectricityForm = ({ departments, onSuccess, onCancel }) => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: {
      department_id: departments && departments.length > 0 ? departments[0].id : '',
      kwh: '',
      timestamp: new Date().toISOString().split('T')[0], // yyyy-mm-dd
      source: 'Grid',
    }
  });

  const toast = useToast();
  const watchedKwh = watch('kwh');
  const numericKwh = parseFloat(watchedKwh) || 0;
  const estimatedCarbon = numericKwh * DEFAULT_EMISSION_FACTOR_GRID_KWH;

  const onSubmit = async (data) => {
    try {
      // Backend expects ISO timestamp e.g. 2024-03-15T12:00:00Z
      const timestampIso = new Date(data.timestamp).toISOString();

      const payload = {
        department_id: parseInt(data.department_id, 10),
        kwh: parseFloat(data.kwh),
        source: data.source,
        timestamp: timestampIso,
      };

      const result = await electricityService.createElectricityData(payload);
      toast.success(`Electricity data saved! Synchronously calculated carbon emission.`);
      reset();
      if (onSuccess) onSuccess(result);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Department Selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          Campus Department <span className="text-rose-400">*</span>
        </label>
        <select
          {...register('department_id', { required: 'Please select a department' })}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
        >
          <option value="">Select Department</option>
          {departments?.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name} ({dept.code})
            </option>
          ))}
        </select>
        {errors.department_id && (
          <p className="text-[11px] text-rose-400 mt-1">{errors.department_id.message}</p>
        )}
      </div>

      {/* Electricity Consumption Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          Electricity Consumed (kWh) <span className="text-rose-400">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            step="any"
            placeholder="e.g. 1500.5"
            {...register('kwh', {
              required: 'Electricity consumption in kWh is required',
              min: { value: 0.1, message: 'Consumption must be greater than 0' }
            })}
            className="w-full pl-3.5 pr-14 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors font-mono"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
            kWh
          </span>
        </div>
        {errors.kwh && (
          <p className="text-[11px] text-rose-400 mt-1">{errors.kwh.message}</p>
        )}
      </div>

      {/* Grid Source & Date in 2 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Power Source <span className="text-rose-400">*</span>
          </label>
          <select
            {...register('source', { required: 'Please select power source' })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="Grid">State Utility Grid (CEA Factor)</option>
            <option value="Solar">Rooftop Solar PV</option>
            <option value="DG Set">Diesel Generator (DG Backup)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Record Date <span className="text-rose-400">*</span>
          </label>
          <input
            type="date"
            {...register('timestamp', { required: 'Date is required' })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Synchronous Carbon Calculation Preview Box */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-brand-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Estimated Backend Scope 2 Carbon
            </div>
            <div className="text-xs text-slate-300">
              Factor: <span className="font-mono text-emerald-400">0.82 kgCO₂e / kWh</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-extrabold text-brand-400 font-mono">
            {formatCarbon(estimatedCarbon)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Synchronous Calculation
          </div>
        </div>
      </div>

      {/* Action Buttons */}
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
              Submitting & Calculating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Record Electricity Data
            </>
          )}
        </button>
      </div>
    </form>
  );
};
