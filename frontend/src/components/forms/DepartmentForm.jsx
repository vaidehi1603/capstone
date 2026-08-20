import React from 'react';
import { useForm } from 'react-hook-form';
import { departmentService } from '../../services/departmentService';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../utils/formatters';
import { Building2, Loader2 } from 'lucide-react';

export const DepartmentForm = ({ onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();
  const toast = useToast();

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description ? data.description.trim() : null,
      };

      const result = await departmentService.createDepartment(payload);
      toast.success(`Department "${result.name}" created successfully!`);
      reset();
      if (onSuccess) onSuccess(result);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          Department Name <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Mechanical Engineering"
          {...register('name', { required: 'Department name is required' })}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
        />
        {errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          Department Code <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. MECH"
          {...register('code', {
            required: 'Department code is required',
            maxLength: { value: 10, message: 'Code must be 10 characters or less' }
          })}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors uppercase font-mono"
        />
        {errors.code && <p className="text-[11px] text-rose-400 mt-1">{errors.code.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          Description (Optional)
        </label>
        <textarea
          rows={3}
          placeholder="Brief details regarding buildings, lab infrastructure, or campus zone..."
          {...register('description')}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors resize-none"
        />
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
              Creating Department...
            </>
          ) : (
            <>
              <Building2 className="w-4 h-4" />
              Register Department
            </>
          )}
        </button>
      </div>
    </form>
  );
};
