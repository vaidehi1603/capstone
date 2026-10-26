import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from '../../hooks/useToast';
import { formatNumber, formatCarbon } from '../../utils/formatters';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';

export const BillUploadWorkflow = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview/Edit, 3: Processing, 4: Result
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const toast = useToast();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleExtract = async () => {
    if (!file) {
      toast.error('Please select an electricity bill file to upload');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/upload/bill/extract`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setExtractedData(response.data.extracted_data);
      setWarnings(response.data.warnings || []);
      setStep(2);
      toast.success('Bill data extracted successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to extract bill data. Please check file format.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!extractedData.units_consumed_kwh || extractedData.units_consumed_kwh <= 0) {
      toast.error('Please enter valid electricity units consumed (kWh)');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/upload/bill/confirm`,
        extractedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResultData(response.data);
      setStep(4);
      toast.success('Bill saved and carbon footprint calculated!');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to process and confirm bill calculation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        {[
          { num: 1, label: 'Upload Document' },
          { num: 2, label: 'Verify Fields' },
          { num: 3, label: 'Carbon Agent' },
          { num: 4, label: 'Impact & Forecast' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                step === s.num
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : step > s.num
                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                  : 'elevated-surface text-[var(--text-secondary)]'
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                step === s.num ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)]'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1: FILE UPLOAD */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="border-2 border-dashed border-[var(--border-color)] hover:border-emerald-500 rounded-2xl p-8 text-center elevated-surface transition-colors">
            <UploadCloud className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-[var(--text-primary)]">Upload Utility Bill Document</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md mx-auto">
              Select your PDF utility bill, image invoice (PNG/JPG), Excel workbook (XLSX), or CSV telemetry record.
            </p>

            <label className="inline-block mt-4 px-4 py-2 rounded-xl elevated-surface text-[var(--text-primary)] text-xs font-bold cursor-pointer transition-colors border border-[var(--border-color)] hover:border-emerald-500">
              Browse Document
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {file && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                <FileText className="w-4 h-4" />
                <span>{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              disabled={!file || loading}
              onClick={handleExtract}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Extracting Entities...
                </>
              ) : (
                <>
                  Next: Extract Bill Data
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: EXTRACTED DATA PREVIEW & VALIDATION */}
      {step === 2 && extractedData && (
        <div className="space-y-4">
          {/* Validation warnings */}
          {warnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Validation Alerts ({warnings.length}):</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Billing Period
              </label>
              <input
                type="text"
                value={extractedData.billing_period || ''}
                onChange={(e) => setExtractedData({ ...extractedData, billing_period: e.target.value })}
                className="w-full px-3 py-2 rounded-xl input-surface text-xs font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Campus Wing / Building
              </label>
              <select
                value={extractedData.wing || 'A Wing'}
                onChange={(e) => setExtractedData({ ...extractedData, wing: e.target.value })}
                className="w-full px-3 py-2 rounded-xl input-surface text-xs font-mono focus:outline-none"
              >
                <option value="A Wing">A Wing (350 KVA Contract Demand)</option>
                <option value="B Wing">B Wing (175 KVA Contract Demand)</option>
                <option value="Construction">Construction / Temporary</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Electricity Consumed (kWh) *
              </label>
              <input
                type="number"
                step="0.1"
                value={extractedData.units_consumed_kwh || ''}
                onChange={(e) => setExtractedData({ ...extractedData, units_consumed_kwh: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl input-surface text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Amount Paid (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={extractedData.amount_paid || ''}
                onChange={(e) => setExtractedData({ ...extractedData, amount_paid: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl input-surface text-xs font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Billing Demand (KVA)
              </label>
              <input
                type="number"
                step="0.1"
                value={extractedData.billing_demand_kva || ''}
                onChange={(e) => setExtractedData({ ...extractedData, billing_demand_kva: parseFloat(e.target.value) || null })}
                className="w-full px-3 py-2 rounded-xl input-surface text-xs font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Power Factor (PF)
              </label>
              <input
                type="number"
                step="0.01"
                max="1.0"
                value={extractedData.power_factor || ''}
                onChange={(e) => setExtractedData({ ...extractedData, power_factor: parseFloat(e.target.value) || null })}
                className="w-full px-3 py-2 rounded-xl input-surface text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold"
            >
              Back to Upload
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Calculating Carbon...
                </>
              ) : (
                <>
                  Confirm & Calculate Carbon Footprint
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS IMPACT & UPDATED FORECAST */}
      {step === 4 && resultData && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-base font-extrabold text-[var(--text-primary)]">
              Electricity Bill Processed & Carbon Stored
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Deterministic Scope 2 calculation completed via Carbon Calculator Agent.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl elevated-surface">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase font-bold font-mono">
                Calculated Scope 2 Carbon
              </div>
              <div className="text-xl font-extrabold text-emerald-500 font-mono mt-1">
                {formatCarbon(resultData.bill_analysis?.calculated_carbon_kgco2e)}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">Factor: 0.82 kgCO₂e/kWh</div>
            </div>

            <div className="p-3.5 rounded-xl elevated-surface">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase font-bold font-mono">
                vs Previous Month
              </div>
              <div className="text-xl font-extrabold text-[var(--text-primary)] font-mono mt-1 flex items-center gap-1">
                {resultData.bill_analysis?.comparison_prev_month_pct !== null && resultData.bill_analysis?.comparison_prev_month_pct !== undefined ? (
                  <>
                    {resultData.bill_analysis.comparison_prev_month_pct >= 0 ? (
                      <span className="text-rose-500 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-0.5" />
                        +{resultData.bill_analysis.comparison_prev_month_pct}%
                      </span>
                    ) : (
                      <span className="text-emerald-500 flex items-center">
                        <TrendingDown className="w-4 h-4 mr-0.5" />
                        {resultData.bill_analysis.comparison_prev_month_pct}%
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[var(--text-secondary)] text-xs">First Entry</span>
                )}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">Month-over-Month</div>
            </div>

            <div className="p-3.5 rounded-xl elevated-surface">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase font-bold font-mono">
                vs Same Month Last Year
              </div>
              <div className="text-xl font-extrabold text-[var(--text-primary)] font-mono mt-1 flex items-center gap-1">
                {resultData.bill_analysis?.comparison_prev_year_pct !== null && resultData.bill_analysis?.comparison_prev_year_pct !== undefined ? (
                  <>
                    {resultData.bill_analysis.comparison_prev_year_pct >= 0 ? (
                      <span className="text-rose-500 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-0.5" />
                        +{resultData.bill_analysis.comparison_prev_year_pct}%
                      </span>
                    ) : (
                      <span className="text-emerald-500 flex items-center">
                        <TrendingDown className="w-4 h-4 mr-0.5" />
                        {resultData.bill_analysis.comparison_prev_year_pct}%
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[var(--text-secondary)] text-xs">Baseline Year</span>
                )}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">Year-over-Year</div>
            </div>
          </div>

          {/* Refreshed 6-Month Forecast preview */}
          {resultData.updated_forecast?.forecast_summary && (
            <div className="p-3.5 rounded-xl elevated-surface border border-sky-500/30">
              <div className="flex items-center gap-2 text-sky-500 font-bold text-xs">
                <Cpu className="w-4 h-4" />
                <span>6-Month ML Forecaster Refreshed Automatically</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Next 6 months predicted electricity:{' '}
                <strong className="text-[var(--text-primary)] font-mono">
                  {formatNumber(resultData.updated_forecast.forecast_summary.total_predicted_energy_kwh)} kWh
                </strong>{' '}
                ({formatCarbon(resultData.updated_forecast.forecast_summary.total_predicted_co2e_kg)} Scope 2 CO₂e).
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setFile(null);
                setExtractedData(null);
              }}
              className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold"
            >
              Upload Another Bill
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Close & Return
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
